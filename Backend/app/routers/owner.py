from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_log import AREA_RESTAURANT
from app.models.user import User
from app.schemas.customer import CustomerDetail, CustomerListResponse, CustomerSummary
from app.schemas.dashboard import CategoryWithCount, DashboardResponse, OrderStatusUpdate
from app.schemas.food import FoodListResponse
from app.schemas.order import OrderResponse, OwnerOrderDetail, OwnerOrderList
from app.security.auth import require_owner
from app.services import activity_service, customer_service, dashboard_service, food_service, order_service, upload_service


# Everything here is for the restaurant owner only
router = APIRouter(
    prefix="/owner",
    tags=["Restaurant Owner"],
    dependencies=[Depends(require_owner)]
)


# Example: /api/owner/dashboard?start=2025-10-01&end=2025-10-31
# Without dates: from the 1st of this month until today.
@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    return dashboard_service.get_dashboard(
        db,
        start or today.replace(day=1),
        end or today
    )


# Examples:
#   /api/owner/orders?start=2026-10-03&end=2026-10-03
#   /api/owner/orders?status=Pending&search=kavindu
# No dates = all orders.
@router.get("/orders", response_model=OwnerOrderList)
def list_orders(
    status: str | None = None,
    search: str | None = None,
    start: date | None = None,
    end: date | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return order_service.get_owner_orders(db, status, search, start, end, page, limit)


@router.get("/orders/{order_id}", response_model=OwnerOrderDetail)
def order_detail(order_id: int, db: Session = Depends(get_db)):
    return order_service.get_owner_order_detail(db, order_id)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def change_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    order = order_service.update_order_status(db, order_id, data.status)

    activity_service.log(
        db, owner, AREA_RESTAURANT, "order_status",
        f"changed order {activity_service.order_code(order.id)} to {order.status}"
    )

    return order


@router.get("/categories", response_model=list[CategoryWithCount])
def categories_with_counts(db: Session = Depends(get_db)):
    return dashboard_service.get_categories_with_counts(db)


# Like /api/foods, but also shows the foods that are turned off.
#   available=true / false -> only on / only off foods (leave out for both)
@router.get("/foods", response_model=FoodListResponse)
def all_foods(
    search: str | None = None,
    category_id: int | None = None,
    available: bool | None = None,
    sort: Literal["popular", "name", "price", "newest"] = "newest",
    order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return food_service.get_foods(
        db,
        search=search,
        category_id=category_id,
        sort=sort,
        order=order,
        page=page,
        limit=limit,
        only_available=False,
        available=available
    )


# Food / category photo from the owner's computer.
# Returns {"url": "http://.../uploads/foods/abc.jpg"} to save in "image".
@router.post("/uploads/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    path = await upload_service.save_image(file)
    return {"url": str(request.base_url) + path}


# ---------- Customers ----------

@router.get("/customers/summary", response_model=CustomerSummary)
def customers_summary(db: Session = Depends(get_db)):
    return customer_service.get_summary(db)


# Examples:
#   /api/owner/customers?type=vip
#   /api/owner/customers?search=kavindu&period=30d&sort=spent
@router.get("/customers", response_model=CustomerListResponse)
def list_customers(
    search: str | None = None,
    type: Literal["all", "repeat", "new", "vip"] = "all",
    period: Literal["all", "30d", "90d", "year"] = "all",
    sort: Literal["newest", "oldest", "name", "orders", "spent", "last_order"] = "newest",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return customer_service.get_customers(
        db,
        search=search,
        customer_type=type,
        period=period,
        sort=sort,
        page=page,
        limit=limit
    )


# orders_limit: how many of the latest orders to send (3 in the panel, more for "full history")
@router.get("/customers/{customer_id}", response_model=CustomerDetail)
def customer_detail(
    customer_id: int,
    orders_limit: int = Query(default=3, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return customer_service.get_customer_detail(db, customer_id, orders_limit)
