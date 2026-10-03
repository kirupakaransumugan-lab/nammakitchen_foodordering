from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.order_item import OrderItemCreate, OrderItemResponse


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    delivery_address: str = Field(min_length=5, max_length=255)
    phone: str = Field(min_length=9, max_length=20)


class OrderResponse(BaseModel):
    id: int
    status: str
    total_amount: float
    delivery_address: str
    phone: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


# ---------- Restaurant owner ----------

# One row in the owner's Orders table
class OwnerOrderRow(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    phone: str
    item_count: int            # all quantities added up, e.g. 2 pizzas + 1 coke = 3
    images: list[str]          # up to 2 food photos for the row
    total_amount: float
    status: str
    created_at: datetime
    next_statuses: list[str]   # what the owner can change it to


class OwnerOrderList(BaseModel):
    items: list[OwnerOrderRow]
    total: int
    page: int
    limit: int
    total_pages: int
    # For the tabs: orders per status in the same dates + search (ignores the status filter)
    status_counts: dict[str, int]
    all_count: int
    # Pending orders right now, any date (sidebar + bell)
    pending_now: int


class OwnerOrderCustomer(BaseModel):
    id: int
    name: str
    email: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


# The side panel: one order with everything in it
class OwnerOrderDetail(BaseModel):
    id: int
    status: str
    total_amount: float
    delivery_address: str
    phone: str                 # the phone given for this order
    created_at: datetime
    customer: OwnerOrderCustomer | None
    items: list[OrderItemResponse]
    next_statuses: list[str]
