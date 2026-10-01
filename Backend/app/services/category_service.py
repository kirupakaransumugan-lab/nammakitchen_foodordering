from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.food import Food
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_all_categories(db: Session):
    # Oldest first, so they show in the order the owner added them
    return db.query(Category).order_by(Category.id).all()


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return category


def check_name_is_free(db: Session, name: str, ignore_id: int | None = None):
    query = db.query(Category).filter(Category.name == name)

    # When updating, the category may keep its own name
    if ignore_id is not None:
        query = query.filter(Category.id != ignore_id)

    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists."
        )


def create_category(db: Session, data: CategoryCreate) -> Category:
    name = data.name.strip()
    check_name_is_free(db, name)

    category = Category(
        name=name,
        description=data.description,
        image=data.image
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category:
    category = get_category_or_404(db, category_id)

    if data.name is not None:
        name = data.name.strip()
        check_name_is_free(db, name, ignore_id=category_id)
        category.name = name

    if data.description is not None:
        category.description = data.description

    if data.image is not None:
        category.image = data.image

    db.commit()
    db.refresh(category)

    return category


def delete_category(db: Session, category_id: int):
    category = get_category_or_404(db, category_id)

    # Do not delete a category that still has foods
    food_count = db.query(Food).filter(Food.category_id == category_id).count()

    if food_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This category has {food_count} food(s). Move or delete them first."
        )

    db.delete(category)
    db.commit()
