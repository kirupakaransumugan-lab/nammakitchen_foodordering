import math
from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.activity_log import ALL_AREAS, ActivityLog
from app.models.user import User


# 12 -> "#NK00012" (same as the frontend shows it)
def order_code(order_id: int) -> str:
    return f"#NK{order_id:05d}"


# 1800 -> "Rs. 1,800", 1250.5 -> "Rs. 1,250.50"
def money(amount) -> str:
    text = f"{float(amount):,.2f}"
    return "Rs. " + (text[:-3] if text.endswith(".00") else text)


# Saves one activity. Call it AFTER the real change is saved,
# so a failed change never shows up in the history.
def log(db: Session, user: User | None, area: str, action: str, description: str):
    db.add(ActivityLog(
        user_id=user.id if user else None,
        user_name=user.name if user else "System",
        user_role=user.role if user else "system",
        area=area,
        action=action,
        description=description[:255]
    ))
    db.commit()


def get_activity(
    db: Session,
    area: str | None,
    user_id: int | None,
    search: str | None,
    start: date | None,
    end: date | None,
    page: int,
    limit: int
) -> dict:
    if area and area not in ALL_AREAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown area. Use one of: {', '.join(ALL_AREAS)}."
        )

    query = db.query(ActivityLog)

    if area:
        query = query.filter(ActivityLog.area == area)

    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    if search and search.strip():
        like = f"%{search.strip()}%"
        query = query.filter(or_(ActivityLog.user_name.ilike(like), ActivityLog.description.ilike(like)))

    if start:
        query = query.filter(ActivityLog.created_at >= datetime.combine(start, time.min))

    if end:
        query = query.filter(ActivityLog.created_at < datetime.combine(end + timedelta(days=1), time.min))

    total = query.count()
    items = (
        query.order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0
    }
