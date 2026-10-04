from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# The restaurant's own details. There is only one restaurant,
# so this table always has one row (id = 1), made on first use.
class Restaurant(Base):
    __tablename__ = "restaurant"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    tagline: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # "09:00" and "22:30" (24-hour)
    open_time: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True
    )

    close_time: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True
    )

    logo: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    cover_image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # Off = customers can still look at the menu but cannot place orders
    is_accepting_orders: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
