from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# How many options the customer can pick in a group
SELECTION_SINGLE = "single"      # e.g. Size: Small OR Medium OR Large
SELECTION_MULTIPLE = "multiple"  # e.g. Extra toppings: any number


# A group of choices for one food, e.g. "Size", "Crust Type", "Extra Toppings"
class FoodOptionGroup(Base):
    __tablename__ = "food_option_groups"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    food_id: Mapped[int] = mapped_column(
        ForeignKey("foods.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    selection: Mapped[str] = mapped_column(
        String(10),
        default=SELECTION_SINGLE,
        nullable=False
    )

    # Required = the customer must pick one (e.g. Size)
    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Smaller number = shown higher in the popup
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    food = relationship("Food", back_populates="option_groups")

    options = relationship(
        "FoodOption",
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="FoodOption.id"
    )


# One choice inside a group, e.g. "Large" or "Extra Cheese"
class FoodOption(Base):
    __tablename__ = "food_options"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    group_id: Mapped[int] = mapped_column(
        ForeignKey("food_option_groups.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # Added to the food's base price. 0 = free choice.
    extra_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )

    # Small icon shown next to the option (optional)
    image: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    group = relationship("FoodOptionGroup", back_populates="options")
