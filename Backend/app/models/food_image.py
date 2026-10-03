from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Extra photos of a food (the thumbnails in the food popup).
# The main photo is still foods.image.
class FoodImage(Base):
    __tablename__ = "food_images"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    food_id: Mapped[int] = mapped_column(
        ForeignKey("foods.id"),
        nullable=False
    )

    url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    food = relationship("Food", back_populates="images")
