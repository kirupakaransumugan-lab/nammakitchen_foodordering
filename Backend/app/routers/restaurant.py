from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.restaurant import RestaurantResponse
from app.services import restaurant_service


# Public: name, contact details, opening hours and "taking orders?"
router = APIRouter(
    prefix="/restaurant",
    tags=["Restaurant"]
)


@router.get("", response_model=RestaurantResponse)
def get_restaurant(db: Session = Depends(get_db)):
    return restaurant_service.get_restaurant(db)
