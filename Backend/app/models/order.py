from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Order status values
STATUS_PENDING = "Pending"
STATUS_CONFIRMED = "Confirmed"
STATUS_PREPARING = "Preparing"
STATUS_OUT_FOR_DELIVERY = "Out for Delivery"
STATUS_DELIVERED = "Delivered"
STATUS_CANCELLED = "Cancelled"

ALL_STATUSES = [
    STATUS_PENDING,
    STATUS_CONFIRMED,
    STATUS_PREPARING,
    STATUS_OUT_FOR_DELIVERY,
    STATUS_DELIVERED,
    STATUS_CANCELLED
]

# Which status can come next. An order only moves forward.
# Delivered and Cancelled are final, so they have no next status.
NEXT_STATUSES = {
    STATUS_PENDING: [STATUS_CONFIRMED, STATUS_CANCELLED],
    STATUS_CONFIRMED: [STATUS_PREPARING, STATUS_CANCELLED],
    STATUS_PREPARING: [STATUS_OUT_FOR_DELIVERY],
    STATUS_OUT_FOR_DELIVERY: [STATUS_DELIVERED],
    STATUS_DELIVERED: [],
    STATUS_CANCELLED: []
}


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default=STATUS_PENDING,
        nullable=False
    )

    # Where this order goes. Saved on the order, so old orders
    # keep their address even if the customer moves later.
    delivery_address: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    customer = relationship("User")

    # One order has many order items.
    # "delete-orphan" removes the items when the order is deleted.
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )
