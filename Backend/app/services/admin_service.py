import math
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session

from app.models.activity_log import AREA_ADMIN, ActivityLog
from app.models.category import Category
from app.models.food import Food
from app.models.order import Order, STATUS_CANCELLED, STATUS_PENDING
from app.models.order_item import OrderItem
from app.models.user import ALL_ROLES, ROLE_CUSTOMER, ROLE_OWNER, User
from app.services import activity_service
from app.services.customer_service import order_stats_subquery
from app.services.dashboard_service import (
    MAX_DAYS,
    day_start,
    get_sales_by_day,
    get_status_counts,
    get_top_foods,
    percent_change
)


def bad_request(message: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


# start/end (both days included) -> datetimes [start, end) + the same-length period before
def period_bounds(start_day: date, end_day: date):
    if end_day < start_day:
        raise bad_request("The end date must be on or after the start date.")

    days = (end_day - start_day).days + 1
    if days > MAX_DAYS:
        raise bad_request("Please pick a range of one year or less.")

    start = day_start(start_day)
    end = day_start(end_day + timedelta(days=1))
    return start, end, start - timedelta(days=days)


# ---------- Users ----------

# Every user + how many orders and how much money (cancelled orders not counted)
def users_with_stats(db: Session):
    stats = order_stats_subquery(db)
    orders = func.coalesce(stats.c.orders, 0)
    spent = func.coalesce(stats.c.spent, 0)

    query = (
        db.query(User, orders.label("orders"), spent.label("spent"))
        .outerjoin(stats, stats.c.customer_id == User.id)
    )
    return query


def user_row(user: User, orders, spent) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
        "orders": int(orders or 0),
        "total_spent": float(spent or 0)
    }


def get_users(
    db: Session,
    search: str | None,
    role: str | None,
    active: bool | None,
    sort: str,
    page: int,
    limit: int
) -> dict:
    base = users_with_stats(db)

    if search and search.strip():
        like = f"%{search.strip()}%"
        base = base.filter(or_(User.name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))

    # Tab numbers (same search, before the role / status filters)
    role_rows = base.with_entities(User.role, func.count(User.id)).group_by(User.role).all()
    role_counts = {r: 0 for r in ALL_ROLES} | dict(role_rows)
    active_rows = dict(base.with_entities(User.is_active, func.count(User.id)).group_by(User.is_active).all())

    query = base
    if role:
        query = query.filter(User.role == role)
    if active is not None:
        query = query.filter(User.is_active == active)

    sort_columns = {
        "newest": User.created_at.desc(),
        "oldest": User.created_at.asc(),
        "name": User.name.asc(),
        "last_login": User.last_login_at.desc()
    }
    query = query.order_by(sort_columns.get(sort, User.created_at.desc()), User.id.desc())

    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [user_row(*row) for row in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0,
        "role_counts": role_counts,
        "active_count": active_rows.get(True, 0),
        "inactive_count": active_rows.get(False, 0)
    }


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return user


def get_user_detail(db: Session, user_id: int) -> dict:
    row = users_with_stats(db).filter(User.id == user_id).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    detail = user_row(*row)
    detail["recent_activity"] = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .limit(15)
        .all()
    )
    return detail


# The restaurant must always keep one owner who can log in,
# otherwise nobody can take orders or change the menu.
def check_keeps_an_owner(db: Session, user: User):
    if user.role != ROLE_OWNER or not user.is_active:
        return

    other_owners = (
        db.query(func.count(User.id))
        .filter(User.role == ROLE_OWNER, User.is_active == True, User.id != user.id)  # noqa: E712
        .scalar()
    )

    if other_owners == 0:
        raise bad_request(
            f"{user.name} is the only active restaurant owner. Make another user the owner first."
        )


def set_user_status(db: Session, admin: User, user_id: int, is_active: bool) -> dict:
    user = get_user_or_404(db, user_id)

    # An admin who switches themself off could lock everyone out
    if user.id == admin.id:
        raise bad_request("You cannot change the status of your own account.")

    if user.is_active == is_active:
        return get_user_detail(db, user_id)

    if not is_active:
        check_keeps_an_owner(db, user)

    user.is_active = is_active
    db.commit()

    activity_service.log(
        db, admin, AREA_ADMIN,
        "user_activated" if is_active else "user_deactivated",
        f"{'activated' if is_active else 'deactivated'} {user.name}'s account ({user.email})"
    )

    return get_user_detail(db, user_id)


def set_user_role(db: Session, admin: User, user_id: int, role: str) -> dict:
    user = get_user_or_404(db, user_id)

    if user.id == admin.id:
        raise bad_request("You cannot change your own role.")

    if user.role == role:
        return get_user_detail(db, user_id)

    if role != ROLE_OWNER:
        check_keeps_an_owner(db, user)

    old_role = user.role
    user.role = role
    db.commit()

    activity_service.log(
        db, admin, AREA_ADMIN, "role_changed",
        f"changed {user.name}'s role from {old_role} to {role}"
    )

    return get_user_detail(db, user_id)


# ---------- Dashboard ----------

def orders_and_revenue(db: Session, start, end) -> tuple[int, float]:
    count, revenue = (
        db.query(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.created_at >= start, Order.created_at < end, Order.status != STATUS_CANCELLED)
        .one()
    )
    return count, float(revenue)


def get_overview(db: Session) -> dict:
    today = date.today()
    tomorrow = day_start(today + timedelta(days=1))

    role_counts = {r: 0 for r in ALL_ROLES} | dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    active = dict(db.query(User.is_active, func.count(User.id)).group_by(User.is_active).all())

    orders_today, revenue_today = orders_and_revenue(db, day_start(today), tomorrow)
    orders_month, revenue_month = orders_and_revenue(db, day_start(today.replace(day=1)), tomorrow)

    return {
        "total_users": sum(role_counts.values()),
        "role_counts": role_counts,
        "active_users": active.get(True, 0),
        "inactive_users": active.get(False, 0),
        "new_users_7d": db.query(func.count(User.id))
        .filter(User.created_at >= day_start(today - timedelta(days=6))).scalar(),
        "orders_today": orders_today,
        "revenue_today": revenue_today,
        "orders_month": orders_month,
        "revenue_month": revenue_month,
        "pending_orders": db.query(func.count(Order.id)).filter(Order.status == STATUS_PENDING).scalar(),
        "sales": get_sales_by_day(db, today - timedelta(days=13), today),
        "recent_activity": (
            db.query(ActivityLog)
            .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
            .limit(8)
            .all()
        )
    }


# ---------- Restaurant report ----------

def get_restaurant_report(db: Session, start_day: date, end_day: date) -> dict:
    start, end, before_start = period_bounds(start_day, end_day)

    orders_now, revenue_now = orders_and_revenue(db, start, end)
    orders_before, revenue_before = orders_and_revenue(db, before_start, start)

    avg_now = revenue_now / orders_now if orders_now else 0
    avg_before = revenue_before / orders_before if orders_before else 0

    cancelled = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= start, Order.created_at < end, Order.status == STATUS_CANCELLED)
        .scalar()
    )
    all_orders = orders_now + cancelled

    # Money and items per category (cancelled orders not counted)
    category_rows = (
        db.query(Category.name, func.sum(OrderItem.quantity), func.sum(OrderItem.subtotal))
        .join(Food, Food.category_id == Category.id)
        .join(OrderItem, OrderItem.food_id == Food.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= start, Order.created_at < end, Order.status != STATUS_CANCELLED)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(OrderItem.subtotal).desc())
        .all()
    )

    return {
        "start": start_day,
        "end": end_day,
        "stats": {
            "orders": {"value": orders_now, "change": percent_change(orders_now, orders_before)},
            "revenue": {"value": revenue_now, "change": percent_change(revenue_now, revenue_before)},
            "avg_order_value": {"value": round(avg_now, 2), "change": percent_change(avg_now, avg_before)},
            "cancelled_orders": cancelled,
            "cancel_rate": round(cancelled / all_orders * 100, 1) if all_orders else 0
        },
        "sales": get_sales_by_day(db, start_day, end_day),
        "status_counts": get_status_counts(db, start, end),
        "top_foods": get_top_foods(db, start, end, limit=10),
        "category_sales": [
            {"name": name, "quantity": int(quantity or 0), "revenue": float(revenue or 0)}
            for name, quantity, revenue in category_rows
        ],
        "menu": {
            "categories": db.query(func.count(Category.id)).scalar(),
            "foods": db.query(func.count(Food.id)).scalar(),
            "available_foods": db.query(func.count(Food.id)).filter(Food.is_available == True).scalar()  # noqa: E712
        }
    }


# ---------- Users report ----------

def ordering_customer_ids(db: Session, start, end):
    return (
        db.query(distinct(Order.customer_id))
        .filter(Order.created_at >= start, Order.created_at < end, Order.status != STATUS_CANCELLED)
    )


def get_user_report(db: Session, start_day: date, end_day: date) -> dict:
    start, end, before_start = period_bounds(start_day, end_day)

    def new_users(a, b):
        return db.query(func.count(User.id)).filter(User.created_at >= a, User.created_at < b).scalar()

    ordering_now = ordering_customer_ids(db, start, end).count()
    ordering_before = ordering_customer_ids(db, before_start, start).count()

    # Customers in this period who had also ordered before it
    returning = (
        db.query(func.count(distinct(Order.customer_id)))
        .filter(Order.customer_id.in_(ordering_customer_ids(db, start, end)))
        .filter(Order.created_at < start, Order.status != STATUS_CANCELLED)
        .scalar()
    )

    logins = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == "login", ActivityLog.created_at >= start, ActivityLog.created_at < end)
        .scalar()
    )

    # Sign-ups per day, customers and staff apart; every day included (0 when none)
    signup_day = func.date(User.created_at)
    rows = (
        db.query(signup_day, User.role, func.count(User.id))
        .filter(User.created_at >= start, User.created_at < end)
        .group_by(signup_day, User.role)
        .all()
    )
    per_day: dict[str, dict] = {}
    for day, role, count in rows:
        slot = per_day.setdefault(str(day), {"customers": 0, "staff": 0})
        slot["customers" if role == ROLE_CUSTOMER else "staff"] += count

    signups = []
    day = start_day
    while day <= end_day:
        slot = per_day.get(str(day), {"customers": 0, "staff": 0})
        signups.append({"day": day, **slot})
        day += timedelta(days=1)

    spent = func.sum(Order.total_amount)
    top_rows = (
        db.query(User.id, User.name, User.email, func.count(Order.id), spent)
        .join(Order, Order.customer_id == User.id)
        .filter(Order.created_at >= start, Order.created_at < end, Order.status != STATUS_CANCELLED)
        .group_by(User.id, User.name, User.email)
        .order_by(spent.desc(), User.name)
        .limit(10)
        .all()
    )

    role_counts = {r: 0 for r in ALL_ROLES} | dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    active = dict(db.query(User.is_active, func.count(User.id)).group_by(User.is_active).all())

    new_now = new_users(start, end)
    new_before = new_users(before_start, start)

    return {
        "start": start_day,
        "end": end_day,
        "stats": {
            "new_users": {"value": new_now, "change": percent_change(new_now, new_before)},
            "ordering_customers": {"value": ordering_now, "change": percent_change(ordering_now, ordering_before)},
            "returning_customers": returning,
            "logins": logins
        },
        "signups": signups,
        "role_counts": role_counts,
        "active_users": active.get(True, 0),
        "inactive_users": active.get(False, 0),
        "top_customers": [
            {"id": uid, "name": name, "email": email, "orders": count, "spent": float(total or 0)}
            for uid, name, email, count, total in top_rows
        ]
    }
