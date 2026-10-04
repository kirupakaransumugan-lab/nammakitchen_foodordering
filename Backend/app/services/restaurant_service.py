from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity_log import AREA_RESTAURANT
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantUpdate
from app.services import activity_service


RESTAURANT_ID = 1


# The one restaurant row; made with the default name the first time
def get_restaurant(db: Session) -> Restaurant:
    restaurant = db.get(Restaurant, RESTAURANT_ID)

    if restaurant is None:
        restaurant = Restaurant(id=RESTAURANT_ID, name="Namma Kitchen", is_accepting_orders=True)
        db.add(restaurant)
        db.commit()
        db.refresh(restaurant)

    return restaurant


# "  " -> None, so empty boxes are saved as "not set"
def clean(text: str | None) -> str | None:
    if text is None:
        return None
    return text.strip() or None


def update_restaurant(db: Session, owner: User, data: RestaurantUpdate) -> Restaurant:
    restaurant = get_restaurant(db)

    restaurant.name = data.name.strip()
    restaurant.tagline = clean(data.tagline)
    restaurant.description = clean(data.description)
    restaurant.phone = clean(data.phone)
    restaurant.email = clean(data.email)
    restaurant.address = clean(data.address)
    restaurant.open_time = data.open_time or None
    restaurant.close_time = data.close_time or None
    restaurant.logo = clean(data.logo)
    restaurant.cover_image = clean(data.cover_image)

    db.commit()
    db.refresh(restaurant)

    activity_service.log(db, owner, AREA_RESTAURANT, "update_profile", "updated the restaurant profile")
    return restaurant


def set_accepting_orders(db: Session, owner: User, accepting: bool) -> Restaurant:
    restaurant = get_restaurant(db)
    restaurant.is_accepting_orders = accepting

    db.commit()
    db.refresh(restaurant)

    action = "opened" if accepting else "paused"
    activity_service.log(db, owner, AREA_RESTAURANT, "ordering", f"{action} online ordering")
    return restaurant


# Called before a customer's order is saved
def check_accepting_orders(db: Session):
    if not get_restaurant(db).is_accepting_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sorry, the restaurant is not taking orders right now. Please try again later."
        )
