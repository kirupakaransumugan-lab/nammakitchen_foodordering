from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    # Numeric(10, 2) = money with 2 decimal places, e.g. 1800.00
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    # Each food belongs to one category
    category = relationship("Category", back_populates="foods")
