from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.security.auth import require_customer
from app.services import order_service


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# ---------- Customer only ----------

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    data: OrderCreate,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return order_service.place_order(db, customer, data)


# Examples:
#   /api/orders/my
#   /api/orders/my?status=Pending
@router.get("/my", response_model=list[OrderResponse])
def my_orders(
    status: str | None = None,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return order_service.get_my_orders(db, customer, status)


@router.get("/my/{order_id}", response_model=OrderResponse)
def my_order(
    order_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return order_service.get_my_order_or_404(db, customer, order_id)


@router.patch("/my/{order_id}/cancel", response_model=OrderResponse)
def cancel_my_order(
    order_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return order_service.cancel_my_order(db, customer, order_id)
