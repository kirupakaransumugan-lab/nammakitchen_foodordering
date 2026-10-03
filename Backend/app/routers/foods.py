from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_log import AREA_RESTAURANT
from app.models.user import User
from app.schemas.food import (
    FoodCreate,
    FoodUpdate,
    FoodResponse,
    FoodListResponse,
    FoodDetailResponse,
    FoodOptionCreate,
    FoodOptionGroupCreate,
    FoodOptionGroupResponse,
    FoodImageCreate,
    FoodImageResponse
)
from app.security.auth import require_owner
from app.services import activity_service, food_service, food_option_service


router = APIRouter(
    prefix="/foods",
    tags=["Foods"]
)


# ---------- Public (anyone can see) ----------

# Examples:
#   /api/foods?search=pizza
#   /api/foods?category_id=1
#   /api/foods?sort=price&order=asc
#   /api/foods?sort=popular        (most sold first, "order" is ignored)
#   /api/foods?page=1&limit=10
@router.get("", response_model=FoodListResponse)
def list_foods(
    search: str | None = None,
    category_id: int | None = None,
    sort: Literal["popular", "name", "price", "newest"] = "name",
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


# One food + its options (size, crust, toppings) + extra photos.
# Used by the "Add to cart" popup.
@router.get("/{food_id}", response_model=FoodDetailResponse)
def get_food(food_id: int, db: Session = Depends(get_db)):
    return food_option_service.get_food_detail_or_404(db, food_id)


# ---------- Restaurant owner only ----------

@router.post(
    "",
    response_model=FoodResponse,
    status_code=status.HTTP_201_CREATED
)
def create_food(data: FoodCreate, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    food = food_service.create_food(db, data)
    activity_service.log(db, owner, AREA_RESTAURANT, "food_created", f"added {food.name} to the menu")
    return food


@router.put(
    "/{food_id}",
    response_model=FoodResponse
)
def update_food(food_id: int, data: FoodUpdate, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    food = food_service.update_food(db, food_id, data)

    # Only the on/off switch was used -> say that, not just "updated"
    if data.model_fields_set == {"is_available"}:
        text = f"made {food.name} {'available' if food.is_available else 'unavailable'}"
    else:
        text = f"updated {food.name}"

    activity_service.log(db, owner, AREA_RESTAURANT, "food_updated", text)
    return food


@router.delete(
    "/{food_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_food(food_id: int, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    name = food_service.get_food_or_404(db, food_id).name
    food_service.delete_food(db, food_id)
    activity_service.log(db, owner, AREA_RESTAURANT, "food_deleted", f"removed {name} from the menu")


# ---------- Restaurant owner: options (size, crust, toppings) ----------

# Example body:
# {
#   "name": "Size", "selection": "single", "is_required": true,
#   "options": [
#     {"name": "Small", "extra_price": 0},
#     {"name": "Medium", "extra_price": 500},
#     {"name": "Large", "extra_price": 800}
#   ]
# }
@router.post(
    "/{food_id}/option-groups",
    response_model=FoodOptionGroupResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_owner)]
)
def create_option_group(food_id: int, data: FoodOptionGroupCreate, db: Session = Depends(get_db)):
    return food_option_service.create_option_group(db, food_id, data)


@router.delete(
    "/option-groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)]
)
def delete_option_group(group_id: int, db: Session = Depends(get_db)):
    food_option_service.delete_option_group(db, group_id)


@router.post(
    "/option-groups/{group_id}/options",
    response_model=FoodOptionGroupResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_owner)]
)
def add_option(group_id: int, data: FoodOptionCreate, db: Session = Depends(get_db)):
    return food_option_service.add_option(db, group_id, data)


@router.delete(
    "/options/{option_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)]
)
def delete_option(option_id: int, db: Session = Depends(get_db)):
    food_option_service.delete_option(db, option_id)


# ---------- Restaurant owner: extra photos ----------

@router.post(
    "/{food_id}/images",
    response_model=FoodImageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_owner)]
)
def add_image(food_id: int, data: FoodImageCreate, db: Session = Depends(get_db)):
    return food_option_service.add_image(db, food_id, data)


@router.delete(
    "/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)]
)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    food_option_service.delete_image(db, image_id)
