from datetime import datetime

from pydantic import BaseModel


# Numbers at the top of the Customers page
class CustomerSummary(BaseModel):
    total_customers: int
    repeat_customers: int      # 2 or more orders
    vip_customers: int
    new_this_month: int
    new_change: float | None   # % vs last month's new customers (None = nothing to compare)
    avg_order_value: float     # all customers together


# One row in the customers table.
# Cancelled orders are not counted in orders / total_spent / last_order.
class CustomerRow(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    address: str | None
    is_active: bool
    created_at: datetime
    orders: int
    total_spent: float
    last_order: datetime | None
    is_vip: bool


class CustomerListResponse(BaseModel):
    items: list[CustomerRow]
    total: int
    page: int
    limit: int
    total_pages: int


class CustomerOrder(BaseModel):
    id: int
    items_summary: str
    image: str | None
    total_amount: float
    status: str
    created_at: datetime


# The side panel: one customer + their latest orders
class CustomerDetail(CustomerRow):
    avg_order_value: float
    cancelled_orders: int
    recent_orders: list[CustomerOrder]
