from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.security.auth import require_owner
from app.services import category_service


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
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_owner)]
)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    return category_service.create_category(db, data)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_owner)]
)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    return category_service.update_category(db, category_id, data)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)]
)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category_service.delete_category(db, category_id)
