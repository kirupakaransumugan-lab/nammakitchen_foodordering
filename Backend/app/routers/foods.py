from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.food import FoodCreate, FoodUpdate, FoodResponse, FoodListResponse
from app.security.auth import require_owner
from app.services import food_service


router = APIRouter(
    prefix="/foods",
    tags=["Foods"]
)


# ---------- Public (anyone can see) ----------

# Examples:
#   /api/foods?search=pizza
#   /api/foods?category_id=1
#   /api/foods?sort=price&order=asc
#   /api/foods?page=1&limit=10
@router.get("", response_model=FoodListResponse)
def list_foods(
    search: str | None = None,
    category_id: int | None = None,
    sort: Literal["name", "price", "newest"] = "name",
    order: Literal["asc", "desc"] = "asc",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return food_service.get_foods(
        db,
        search=search,
        category_id=category_id,
        sort=sort,
        order=order,
        page=page,
        limit=limit,
        only_available=True
    )


# This route must be ABOVE "/{food_id}",
# otherwise FastAPI would read "popular" as a food id.
@router.get("/popular", response_model=list[FoodResponse])
def popular_foods(
    limit: int = Query(default=4, ge=1, le=20),
    db: Session = Depends(get_db)
):
    return food_service.get_popular_foods(db, limit)


@router.get("/{food_id}", response_model=FoodResponse)
def get_food(food_id: int, db: Session = Depends(get_db)):
    return food_service.get_food_or_404(db, food_id)


# ---------- Restaurant owner only ----------

@router.post(
    "",
    response_model=FoodResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_owner)]
)
def create_food(data: FoodCreate, db: Session = Depends(get_db)):
    return food_service.create_food(db, data)


@router.put(
    "/{food_id}",
    response_model=FoodResponse,
    dependencies=[Depends(require_owner)]
)
def update_food(food_id: int, data: FoodUpdate, db: Session = Depends(get_db)):
    return food_service.update_food(db, food_id, data)


@router.delete(
    "/{food_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)]
)
def delete_food(food_id: int, db: Session = Depends(get_db)):
    food_service.delete_food(db, food_id)
