from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.dashboard import SalesPoint, StatCard, StatusCount, TopFood


# ---------- Activity ----------

class ActivityItem(BaseModel):
    id: int
    user_id: int | None
    user_name: str
    user_role: str
    area: str
    action: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityList(BaseModel):
    items: list[ActivityItem]
    total: int
    page: int
    limit: int
    total_pages: int


# ---------- Users ----------

class AdminUserRow(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    address: str | None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None
    orders: int          # not counting cancelled ones
    total_spent: float


class AdminUserList(BaseModel):
    items: list[AdminUserRow]
    total: int
    page: int
    limit: int
    total_pages: int
    # For the tabs (same search, before the role / status filter)
    role_counts: dict[str, int]
    active_count: int
    inactive_count: int


class AdminUserDetail(AdminUserRow):
    recent_activity: list[ActivityItem]


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: Literal["customer", "owner", "admin"]


# ---------- Dashboard ----------

class AdminOverview(BaseModel):
    total_users: int
    role_counts: dict[str, int]
    active_users: int
    inactive_users: int
    new_users_7d: int
    orders_today: int
    revenue_today: float
    orders_month: int
    revenue_month: float
    pending_orders: int
    sales: list[SalesPoint]            # last 14 days
    recent_activity: list[ActivityItem]


# ---------- Restaurant report ----------

class CategorySales(BaseModel):
    name: str
    quantity: int
    revenue: float


class RestaurantReportStats(BaseModel):
    orders: StatCard
    revenue: StatCard
    avg_order_value: StatCard
    cancelled_orders: int
    cancel_rate: float          # % of all orders in the period


class MenuNumbers(BaseModel):
    categories: int
    foods: int
    available_foods: int


class RestaurantReport(BaseModel):
    start: date
    end: date
    stats: RestaurantReportStats
    sales: list[SalesPoint]
    status_counts: list[StatusCount]
    top_foods: list[TopFood]
    category_sales: list[CategorySales]
    menu: MenuNumbers


# ---------- Users report ----------

class SignupPoint(BaseModel):
    day: date
    customers: int
    staff: int      # owners + admins


class TopCustomer(BaseModel):
    id: int
    name: str
    email: str
    orders: int
    spent: float


class UserReportStats(BaseModel):
    new_users: StatCard
    ordering_customers: StatCard    # customers who placed at least one order
    returning_customers: int        # of those, how many had ordered before the period
    logins: int


class UserReport(BaseModel):
    start: date
    end: date
    stats: UserReportStats
    signups: list[SignupPoint]
    role_counts: dict[str, int]     # all users right now
    active_users: int
    inactive_users: int
    top_customers: list[TopCustomer]


AreaName = Literal["restaurant", "user", "admin"]
