from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False
    )

    food_id: Mapped[int] = mapped_column(
        ForeignKey("foods.id"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # The price at the time of the order.
    # If the owner changes the food price later, old orders stay correct.
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    order = relationship("Order", back_populates="items")
    food = relationship("Food")

    # So the API can show the food name next to each item
    @property
    def food_name(self) -> str:
        return self.food.name if self.food else "Deleted food"
