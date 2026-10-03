import math
from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, STATUS_CANCELLED
from app.models.order_item import OrderItem
from app.models.user import User, ROLE_CUSTOMER
from app.services.dashboard_service import day_start, percent_change, summarize_items


# A customer who spent this much (not counting cancelled orders) is a VIP
VIP_MIN_SPENT = 10000

# "repeat" customer = at least this many orders
REPEAT_MIN_ORDERS = 2

# The Last Order filter -> days back
PERIOD_DAYS = {
    "30d": 30,
    "90d": 90,
    "year": 365
}


# One row per customer who ordered: (customer_id, orders, spent, last_order).
# Cancelled orders do not count.
def order_stats_subquery(db: Session):
    return (
        db.query(
            Order.customer_id.label("customer_id"),
            func.count(Order.id).label("orders"),
            func.sum(Order.total_amount).label("spent"),
            func.max(Order.created_at).label("last_order")
        )
        .filter(Order.status != STATUS_CANCELLED)
        .group_by(Order.customer_id)
        .subquery()
    )


# Every customer (also the ones with no orders yet) + their numbers
def customers_with_stats(db: Session):
    stats = order_stats_subquery(db)

    orders = func.coalesce(stats.c.orders, 0)
    spent = func.coalesce(stats.c.spent, 0)

    query = (
        db.query(User, orders.label("orders"), spent.label("spent"), stats.c.last_order)
        .outerjoin(stats, stats.c.customer_id == User.id)
        .filter(User.role == ROLE_CUSTOMER)
    )

    return query, orders, spent, stats.c.last_order


def month_start(day: date) -> datetime:
    return day_start(day.replace(day=1))


def row_to_dict(user: User, orders: int, spent, last_order) -> dict:
    total_spent = float(spent or 0)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "orders": int(orders or 0),
        "total_spent": total_spent,
        "last_order": last_order,
        "is_vip": total_spent >= VIP_MIN_SPENT
    }


def get_summary(db: Session) -> dict:
    query, orders, spent, _ = customers_with_stats(db)

    this_month = month_start(date.today())
    last_month = month_start((this_month - timedelta(days=1)).date())

    new_this_month = query.filter(User.created_at >= this_month).count()
    new_last_month = query.filter(User.created_at >= last_month, User.created_at < this_month).count()

    # Average of all orders (not of customers): money / number of orders
    order_count, money = (
        db.query(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.status != STATUS_CANCELLED)
        .one()
    )

    return {
        "total_customers": query.count(),
        "repeat_customers": query.filter(orders >= REPEAT_MIN_ORDERS).count(),
        "vip_customers": query.filter(spent >= VIP_MIN_SPENT).count(),
        "new_this_month": new_this_month,
        "new_change": percent_change(new_this_month, new_last_month),
        "avg_order_value": round(float(money) / order_count, 2) if order_count else 0
    }


def get_customers(
    db: Session,
    search: str | None,
    customer_type: str,
    period: str,
    sort: str,
    page: int,
    limit: int
) -> dict:
    query, orders, spent, last_order = customers_with_stats(db)

    # 1. Filters
    if search:
        text = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(text), User.email.ilike(text), User.phone.ilike(text)))

    if customer_type == "repeat":
        query = query.filter(orders >= REPEAT_MIN_ORDERS)
    elif customer_type == "new":
        query = query.filter(User.created_at >= month_start(date.today()))
    elif customer_type == "vip":
        query = query.filter(spent >= VIP_MIN_SPENT)

    # Only customers who ordered in the last N days
    if period in PERIOD_DAYS:
        query = query.filter(last_order >= datetime.now() - timedelta(days=PERIOD_DAYS[period]))

    # 2. Sorting (User.id at the end keeps the same order between pages)
    sort_columns = {
        "newest": User.created_at.desc(),
        "oldest": User.created_at.asc(),
        "name": User.name.asc(),
        "orders": orders.desc(),
        "spent": spent.desc(),
        "last_order": last_order.desc()
    }
    query = query.order_by(sort_columns.get(sort, User.created_at.desc()), User.id.desc())

    # 3. Pagination
    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [row_to_dict(*row) for row in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0
    }


def get_customer_detail(db: Session, customer_id: int, orders_limit: int) -> dict:
    query, _, _, _ = customers_with_stats(db)
    row = query.filter(User.id == customer_id).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    customer = row_to_dict(*row)

    cancelled = (
        db.query(func.count(Order.id))
        .filter(Order.customer_id == customer_id, Order.status == STATUS_CANCELLED)
        .scalar()
    )

    # Latest orders, also cancelled ones, so the owner sees everything
    recent = (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.food))
        .filter(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(orders_limit)
        .all()
    )

    recent_orders = []
    for order in recent:
        summary, image = summarize_items(order)
        recent_orders.append({
            "id": order.id,
            "items_summary": summary,
            "image": image,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "created_at": order.created_at
        })

    count = customer["orders"]
    customer["avg_order_value"] = round(customer["total_spent"] / count, 2) if count else 0
    customer["cancelled_orders"] = cancelled
    customer["recent_orders"] = recent_orders

    return customer
