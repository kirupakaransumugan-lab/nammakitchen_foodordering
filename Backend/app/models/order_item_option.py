from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# What the customer picked for one order item, e.g. "Size: Large (+800)".
# Names and price are copied here (not linked), so old orders stay
# correct even if the owner renames or deletes the option later.
class OrderItemOption(Base):
    __tablename__ = "order_item_options"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    order_item_id: Mapped[int] = mapped_column(
        ForeignKey("order_items.id"),
        nullable=False
    )

    group_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    option_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    extra_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    order_item = relationship("OrderItem", back_populates="options")
