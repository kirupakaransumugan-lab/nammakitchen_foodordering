import math
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.activity_log import AREA_USER
from app.models.food import Food
from app.models.food_option import FoodOption, FoodOptionGroup, SELECTION_SINGLE
from app.models.order import Order, ALL_STATUSES, NEXT_STATUSES, STATUS_PENDING, STATUS_CANCELLED
from app.models.order_item import OrderItem
from app.models.order_item_option import OrderItemOption
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services import activity_service


# Loads each order's items and their foods in 2 extra queries,
# instead of 1 query per order (the "N+1" problem).
def with_items(query):
    return query.options(
        selectinload(Order.items).selectinload(OrderItem.food),
        selectinload(Order.items).selectinload(OrderItem.options)
    )


def bad_request(message: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


# Checks the options picked for one food and returns them as
# a list of (group, option). Raises 400 if the choice is not allowed.
def check_options(food: Food, option_ids: list[int]) -> list[tuple[FoodOptionGroup, FoodOption]]:
    # Every option this food has: option id -> (group, option)
    allowed = {
        option.id: (group, option)
        for group in food.option_groups
        for option in group.options
    }

    picked = []
    for option_id in option_ids:
        if option_id not in allowed:
            raise bad_request(f"That option is not available for {food.name}.")
        picked.append(allowed[option_id])

    for group in food.option_groups:
        count = sum(1 for g, _ in picked if g.id == group.id)

        if group.selection == SELECTION_SINGLE and count > 1:
            raise bad_request(f"Please pick only one {group.name} for {food.name}.")

        if group.is_required and count == 0:
            raise bad_request(f"Please pick a {group.name} for {food.name}.")

    return picked


def place_order(db: Session, customer: User, data: OrderCreate) -> Order:
    # Same food + same options + same note twice in the cart
    # -> one line with both quantities
    lines: dict[tuple, int] = {}
    for item in data.items:
        note = (item.note or "").strip()
        key = (item.food_id, tuple(sorted(set(item.option_ids))), note)
        lines[key] = lines.get(key, 0) + item.quantity

    food_ids = {food_id for food_id, _, _ in lines}
    foods = (
        db.query(Food)
        .options(selectinload(Food.option_groups).selectinload(FoodOptionGroup.options))
        .filter(Food.id.in_(food_ids))
        .all()
    )
    foods_by_id = {food.id: food for food in foods}

    order = Order(
        customer_id=customer.id,
        status=STATUS_PENDING,
        delivery_address=data.delivery_address.strip(),
        phone=data.phone.strip(),
        total_amount=Decimal("0")
    )

    total = Decimal("0")

    for (food_id, option_ids, note), quantity in lines.items():
        food = foods_by_id.get(food_id)

        if food is None or not food.is_available:
            name = food.name if food else f"Food #{food_id}"
            raise bad_request(f"{name} is not available right now. Please remove it from your cart.")

        picked = check_options(food, list(option_ids))

        # The price always comes from the database, never from the browser:
        # base price + the extra price of every picked option
        unit_price = food.price + sum((option.extra_price for _, option in picked), Decimal("0"))
        subtotal = unit_price * quantity
        total += subtotal

        order_item = OrderItem(
            food_id=food.id,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
            note=note or None
        )

        # Keep a copy of the names and prices, in the order the groups are shown
        picked.sort(key=lambda pair: (pair[0].sort_order, pair[0].id, pair[1].id))
        for group, option in picked:
            order_item.options.append(OrderItemOption(
                group_name=group.name,
                option_name=option.name,
                extra_price=option.extra_price
            ))

        order.items.append(order_item)

    order.total_amount = total

    db.add(order)
    db.commit()

    item_count = sum(item.quantity for item in order.items)
    activity_service.log(
        db, customer, AREA_USER, "order_placed",
        f"placed order {activity_service.order_code(order.id)} "
        f"({item_count} {'item' if item_count == 1 else 'items'}, {activity_service.money(total)})"
    )

    return get_my_order_or_404(db, customer, order.id)


def get_my_orders(db: Session, customer: User, order_status: str | None):
    query = with_items(db.query(Order)).filter(Order.customer_id == customer.id)

    if order_status:
        if order_status not in ALL_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown status. Use one of: {', '.join(ALL_STATUSES)}."
            )

        query = query.filter(Order.status == order_status)

    # Newest order first
    return query.order_by(Order.created_at.desc(), Order.id.desc()).all()


def get_my_order_or_404(db: Session, customer: User, order_id: int) -> Order:
    # Filtering by customer_id too, so nobody can open another person's order
    order = (
        with_items(db.query(Order))
        .filter(Order.id == order_id, Order.customer_id == customer.id)
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    return order


def cancel_my_order(db: Session, customer: User, order_id: int) -> Order:
    order = get_my_order_or_404(db, customer, order_id)

    # After the restaurant confirms, the kitchen may already be cooking
    if order.status != STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending orders can be cancelled."
        )

    order.status = STATUS_CANCELLED
    db.commit()

    activity_service.log(
        db, customer, AREA_USER, "order_cancelled",
        f"cancelled order {activity_service.order_code(order.id)}"
    )

    return get_my_order_or_404(db, customer, order.id)


# ---------- Restaurant owner ----------

def update_order_status(db: Session, order_id: int, new_status: str) -> Order:
    order = with_items(db.query(Order)).filter(Order.id == order_id).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    # An order only moves forward, e.g. Pending -> Confirmed -> Preparing
    allowed = NEXT_STATUSES.get(order.status, [])

    if new_status not in allowed:
        if allowed:
            detail = f"A {order.status} order can only change to: {', '.join(allowed)}."
        else:
            detail = f"This order is already {order.status}."

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    order.status = new_status
    db.commit()

    return order


# ---------- Restaurant owner: Orders page ----------

# The Orders page filters, used for both the rows and the tab numbers.
#   search: customer name, phone, food name, or order number ("12", "#12", "NK00012")
def owner_orders_query(db: Session, search: str | None, start: date | None, end: date | None):
    query = db.query(Order).outerjoin(User, User.id == Order.customer_id)

    if start and end and end < start:
        raise bad_request("The end date must be on or after the start date.")

    if start:
        query = query.filter(Order.created_at >= datetime.combine(start, time.min))

    if end:
        query = query.filter(Order.created_at < datetime.combine(end + timedelta(days=1), time.min))

    if search and search.strip():
        text = search.strip()
        like = f"%{text}%"

        conditions = [
            User.name.ilike(like),
            Order.phone.ilike(like),
            Order.items.any(OrderItem.food.has(Food.name.ilike(like)))
        ]

        # "#NK00012" -> 12
        digits = "".join(ch for ch in text if ch.isdigit())
        if digits and len(digits) <= 9:
            conditions.append(Order.id == int(digits))

        query = query.filter(or_(*conditions))

    return query


def get_owner_orders(
    db: Session,
    order_status: str | None,
    search: str | None,
    start: date | None,
    end: date | None,
    page: int,
    limit: int
) -> dict:
    if order_status and order_status not in ALL_STATUSES:
        raise bad_request(f"Unknown status. Use one of: {', '.join(ALL_STATUSES)}.")

    base = owner_orders_query(db, search, start, end)

    # Tab numbers: one count per status (before the status filter)
    rows = (
        base.with_entities(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )
    counts = dict(rows)
    status_counts = {s: counts.get(s, 0) for s in ALL_STATUSES}

    query = base
    if order_status:
        query = query.filter(Order.status == order_status)

    total = query.count()

    orders = (
        with_items(query.options(selectinload(Order.customer)))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for order in orders:
        images = [item.food_image for item in order.items if item.food_image]

        items.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_name": order.customer.name if order.customer else "Deleted user",
            "phone": order.phone,
            "item_count": sum(item.quantity for item in order.items),
            "images": images[:2],
            "total_amount": float(order.total_amount),
            "status": order.status,
            "created_at": order.created_at,
            "next_statuses": NEXT_STATUSES.get(order.status, [])
        })

    pending_now = db.query(func.count(Order.id)).filter(Order.status == STATUS_PENDING).scalar()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0,
        "status_counts": status_counts,
        "all_count": sum(status_counts.values()),
        "pending_now": pending_now
    }


def get_owner_order_detail(db: Session, order_id: int) -> dict:
    order = (
        with_items(db.query(Order).options(selectinload(Order.customer)))
        .filter(Order.id == order_id)
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    return {
        "id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "delivery_address": order.delivery_address,
        "phone": order.phone,
        "created_at": order.created_at,
        "customer": order.customer,
        "items": order.items,
        "next_statuses": NEXT_STATUSES.get(order.status, [])
    }
