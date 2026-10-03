from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# Which list an activity shows up in on the admin pages
AREA_RESTAURANT = "restaurant"   # menu changes, order status changes (the owner)
AREA_USER = "user"               # sign-ups, logins, orders placed / cancelled (customers)
AREA_ADMIN = "admin"             # activate / deactivate / role changes (the admin)

ALL_AREAS = [AREA_RESTAURANT, AREA_USER, AREA_ADMIN]


# One thing someone did, e.g. "Spice Hub changed order #NK00012 to Preparing".
# The name and role are copied here, so the history stays readable
# even if the user is renamed or gets a new role later.
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    user_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    user_role: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    area: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )

    # Short code for the icon, e.g. "login", "order_placed", "food_created"
    action: Mapped[str] = mapped_column(
        String(40),
        nullable=False
    )

    # The sentence shown to the admin, without the name,
    # e.g. "changed order #NK00012 to Preparing"
    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        index=True
    )
