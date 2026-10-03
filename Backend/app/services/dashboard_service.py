from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category
from app.models.food import Food
from app.models.order import ALL_STATUSES, NEXT_STATUSES, STATUS_CANCELLED, STATUS_PENDING, Order
from app.models.order_item import OrderItem


MAX_DAYS = 366


def day_start(day: date) -> datetime:
    return datetime.combine(day, time.min)


# % change from "before" to "now". None when there is nothing to compare with.
def percent_change(now: float, before: float) -> float | None:
    if before == 0:
        return None
    return round((now - before) / before * 100, 1)


# Orders, customers and revenue between two moments.
# Revenue does not count cancelled orders (that money never came in).
def period_numbers(db: Session, start: datetime, end: datetime) -> dict:
    in_period = (Order.created_at >= start, Order.created_at < end)

    orders = db.query(func.count(Order.id)).filter(*in_period).scalar() or 0
    customers = db.query(func.count(distinct(Order.customer_id))).filter(*in_period).scalar() or 0
    revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(*in_period, Order.status != STATUS_CANCELLED)
        .scalar()
    )

    return {"orders": orders, "customers": customers, "revenue": float(revenue or 0)}


def get_dashboard(db: Session, start_day: date, end_day: date) -> dict:
    if end_day < start_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The end date must be on or after the start date."
        )

    days = (end_day - start_day).days + 1
    if days > MAX_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please pick a range of one year or less."
        )

    start = day_start(start_day)
    end = day_start(end_day + timedelta(days=1))   # up to the end of end_day

    # The period just before, with the same number of days
    before_start = start - timedelta(days=days)

    now = period_numbers(db, start, end)
    before = period_numbers(db, before_start, start)

    active_foods = db.query(func.count(Food.id)).filter(Food.is_available == True).scalar()  # noqa: E712

    return {
        "start": start_day,
        "end": end_day,
        "stats": {
            "total_orders": {"value": now["orders"], "change": percent_change(now["orders"], before["orders"])},
            "total_customers": {"value": now["customers"], "change": percent_change(now["customers"], before["customers"])},
            "total_revenue": {"value": now["revenue"], "change": percent_change(now["revenue"], before["revenue"])},
            "active_foods": active_foods
        },
        "sales": get_sales_by_day(db, start_day, end_day),
        "status_counts": get_status_counts(db, start, end),
        "pending_orders": db.query(func.count(Order.id)).filter(Order.status == STATUS_PENDING).scalar(),
        "recent_orders": get_recent_orders(db),
        "top_foods": get_top_foods(db, start, end)
    }


def get_sales_by_day(db: Session, start_day: date, end_day: date) -> list[dict]:
    order_day = func.date(Order.created_at)

    rows = (
        db.query(order_day, func.count(Order.id), func.sum(Order.total_amount))
        .filter(Order.created_at >= day_start(start_day))
        .filter(Order.created_at < day_start(end_day + timedelta(days=1)))
        .filter(Order.status != STATUS_CANCELLED)
        .group_by(order_day)
        .all()
    )

    # MySQL gives a date, SQLite gives text: str() makes them the same
    by_day = {str(day): (count, revenue) for day, count, revenue in rows}

    # Every day in the range, also days with no orders (0), so the chart has no gaps
    points = []
    day = start_day
    while day <= end_day:
        count, revenue = by_day.get(str(day), (0, 0))
        points.append({"day": day, "orders": count, "revenue": float(revenue or 0)})
        day += timedelta(days=1)

    return points


def get_status_counts(db: Session, start: datetime, end: datetime) -> list[dict]:
    rows = (
        db.query(Order.status, func.count(Order.id))
        .filter(Order.created_at >= start, Order.created_at < end)
        .group_by(Order.status)
        .all()
    )
    counts = dict(rows)

    # Always all 6 statuses, in the order they happen
    return [{"status": s, "count": counts.get(s, 0)} for s in ALL_STATUSES]


# Short text + photo for an order: ("Chicken Pizza × 2 +1 more", first food's photo).
# The order's items (and their foods) should be loaded with selectinload.
def summarize_items(order: Order) -> tuple[str, str | None]:
    first = order.items[0] if order.items else None
    if first is None:
        return "No items", None

    summary = f"{first.food_name} × {first.quantity}"
    if len(order.items) > 1:
        summary += f" +{len(order.items) - 1} more"

    return summary, first.food_image


def get_recent_orders(db: Session, limit: int = 5) -> list[dict]:
    orders = (
        db.query(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.food)
        )
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(limit)
        .all()
    )

    result = []
    for order in orders:
        summary, image = summarize_items(order)

        result.append({
            "id": order.id,
            "customer_name": order.customer.name if order.customer else "Deleted user",
            "items_summary": summary,
            "image": image,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "created_at": order.created_at,
            "next_statuses": NEXT_STATUSES.get(order.status, [])
        })

    return result


def get_top_foods(db: Session, start: datetime, end: datetime, limit: int = 5) -> list[dict]:
    sold = func.sum(OrderItem.quantity)

    base = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= start, Order.created_at < end)
        .filter(Order.status != STATUS_CANCELLED)
    )

    total_sold = base.with_entities(func.coalesce(sold, 0)).scalar() or 0

    rows = (
        base.join(Food, Food.id == OrderItem.food_id)
        .with_entities(
            Food.id,
            Food.name,
            Food.image,
            sold.label("quantity"),
            func.count(distinct(Order.id)).label("orders")
        )
        .group_by(Food.id, Food.name, Food.image)
        .order_by(sold.desc(), Food.name)
        .limit(limit)
        .all()
    )

    return [
        {
            "food_id": food_id,
            "name": name,
            "image": image,
            "quantity": int(quantity),
            "orders": orders,
            "percent": round(int(quantity) / total_sold * 100, 1) if total_sold else 0
        }
        for food_id, name, image, quantity, orders in rows
    ]


def get_categories_with_counts(db: Session) -> list[dict]:
    rows = (
        db.query(Category, func.count(Food.id))
        .outerjoin(Food, Food.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.id)
        .all()
    )

    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "image": category.image,
            "food_count": count
        }
        for category, count in rows
    ]
