from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_log import AREA_RESTAURANT
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.security.auth import require_owner
from app.services import activity_service, category_service


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# ---------- Public (anyone can see) ----------

@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return category_service.get_all_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return category_service.get_category_or_404(db, category_id)


# ---------- Restaurant owner only ----------

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_category(data: CategoryCreate, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    category = category_service.create_category(db, data)
    activity_service.log(db, owner, AREA_RESTAURANT, "category_created", f"added the {category.name} category")
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    category = category_service.update_category(db, category_id, data)
    activity_service.log(db, owner, AREA_RESTAURANT, "category_updated", f"updated the {category.name} category")
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_category(category_id: int, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    name = category_service.get_category_or_404(db, category_id).name
    category_service.delete_category(db, category_id)
    activity_service.log(db, owner, AREA_RESTAURANT, "category_deleted", f"removed the {name} category")
