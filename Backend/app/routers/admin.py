from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.admin import (
    ActivityList,
    AdminOverview,
    AdminUserDetail,
    AdminUserList,
    AreaName,
    RestaurantReport,
    UserReport,
    UserRoleUpdate,
    UserStatusUpdate
)
from app.security.auth import require_admin
from app.services import activity_service, admin_service


# Everything here is for the admin only
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)]
)


def this_month() -> tuple[date, date]:
    today = date.today()
    return today.replace(day=1), today


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    return admin_service.get_overview(db)


# ---------- Users ----------

# Examples:
#   /api/admin/users?role=owner
#   /api/admin/users?active=false&search=gmail
@router.get("/users", response_model=AdminUserList)
def list_users(
    search: str | None = None,
    role: Literal["customer", "owner", "admin"] | None = None,
    active: bool | None = None,
    sort: Literal["newest", "oldest", "name", "last_login"] = "newest",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return admin_service.get_users(db, search, role, active, sort, page, limit)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def user_detail(user_id: int, db: Session = Depends(get_db)):
    return admin_service.get_user_detail(db, user_id)


@router.patch("/users/{user_id}/status", response_model=AdminUserDetail)
def change_user_status(
    user_id: int,
    data: UserStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return admin_service.set_user_status(db, admin, user_id, data.is_active)


@router.patch("/users/{user_id}/role", response_model=AdminUserDetail)
def change_user_role(
    user_id: int,
    data: UserRoleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return admin_service.set_user_role(db, admin, user_id, data.role)


# ---------- Reports (no dates = this month) ----------

@router.get("/reports/restaurant", response_model=RestaurantReport)
def restaurant_report(start: date | None = None, end: date | None = None, db: Session = Depends(get_db)):
    first, today = this_month()
    return admin_service.get_restaurant_report(db, start or first, end or today)


@router.get("/reports/users", response_model=UserReport)
def user_report(start: date | None = None, end: date | None = None, db: Session = Depends(get_db)):
    first, today = this_month()
    return admin_service.get_user_report(db, start or first, end or today)


# Activity history.
#   area: restaurant (owner's work) | user (customers) | admin (admin changes); leave out for all
@router.get("/activity", response_model=ActivityList)
def activity(
    area: AreaName | None = None,
    user_id: int | None = None,
    search: str | None = None,
    start: date | None = None,
    end: date | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return activity_service.get_activity(db, area, user_id, search, start, end, page, limit)
