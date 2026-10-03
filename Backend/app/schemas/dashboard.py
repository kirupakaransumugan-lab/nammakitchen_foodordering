from datetime import date, datetime

from pydantic import BaseModel


# One number at the top of the dashboard, e.g. Total Orders.
# change = % compared with the period before (same number of days).
# None = nothing to compare with (the period before had 0).
class StatCard(BaseModel):
    value: float
    change: float | None


class DashboardStats(BaseModel):
    total_orders: StatCard
    total_customers: StatCard
    total_revenue: StatCard
    active_foods: int


# One day in the Sales Overview chart
class SalesPoint(BaseModel):
    day: date
    orders: int
    revenue: float


class StatusCount(BaseModel):
    status: str
    count: int


class RecentOrder(BaseModel):
    id: int
    customer_name: str
    items_summary: str        # e.g. "Chicken Pizza × 2 +1 more"
    image: str | None         # first item's food photo
    total_amount: float
    status: str
    created_at: datetime
    next_statuses: list[str]  # what the owner can change it to


class TopFood(BaseModel):
    food_id: int
    name: str
    image: str | None
    quantity: int    # how many were sold
    orders: int      # in how many orders
    percent: float   # share of all items sold in the period


class DashboardResponse(BaseModel):
    start: date
    end: date
    stats: DashboardStats
    sales: list[SalesPoint]
    status_counts: list[StatusCount]
    pending_orders: int       # bell icon: pending orders right now
    recent_orders: list[RecentOrder]
    top_foods: list[TopFood]


class CategoryWithCount(BaseModel):
    id: int
    name: str
    description: str | None
    image: str | None
    food_count: int


class OrderStatusUpdate(BaseModel):
    status: str
