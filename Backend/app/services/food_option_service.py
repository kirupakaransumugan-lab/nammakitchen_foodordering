from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.food import Food
from app.models.food_image import FoodImage
from app.models.food_option import FoodOption, FoodOptionGroup
from app.schemas.food import FoodImageCreate, FoodOptionCreate, FoodOptionGroupCreate
from app.services.food_service import get_food_or_404


# ---------- Public: the "Add to cart" popup ----------

def get_food_detail_or_404(db: Session, food_id: int) -> Food:
    food = (
        db.query(Food)
        .options(
            selectinload(Food.option_groups).selectinload(FoodOptionGroup.options),
            selectinload(Food.images)
        )
        .filter(Food.id == food_id)
        .first()
    )

    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found."
        )

    return food


# ---------- Owner: option groups ----------

def get_group_or_404(db: Session, group_id: int) -> FoodOptionGroup:
    group = db.query(FoodOptionGroup).filter(FoodOptionGroup.id == group_id).first()

    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option group not found."
        )

    return group


def create_option_group(db: Session, food_id: int, data: FoodOptionGroupCreate) -> FoodOptionGroup:
    get_food_or_404(db, food_id)

    group = FoodOptionGroup(
        food_id=food_id,
        name=data.name.strip(),
        selection=data.selection,
        is_required=data.is_required,
        sort_order=data.sort_order
    )

    for option in data.options:
        group.options.append(FoodOption(
            name=option.name.strip(),
            extra_price=option.extra_price,
            image=option.image
        ))

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


def delete_option_group(db: Session, group_id: int):
    group = get_group_or_404(db, group_id)

    # Its options are deleted too (cascade). Old orders keep their
    # copy in order_item_options, so nothing breaks.
    db.delete(group)
    db.commit()


# ---------- Owner: single options ----------

def add_option(db: Session, group_id: int, data: FoodOptionCreate) -> FoodOptionGroup:
    group = get_group_or_404(db, group_id)

    group.options.append(FoodOption(
        name=data.name.strip(),
        extra_price=data.extra_price,
        image=data.image
    ))

    db.commit()
    db.refresh(group)

    return group


def delete_option(db: Session, option_id: int):
    option = db.query(FoodOption).filter(FoodOption.id == option_id).first()

    if option is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option not found."
        )

    # A group with no options makes no sense: delete the group instead
    if len(option.group.options) == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is the last option in its group. Delete the whole group instead."
        )

    db.delete(option)
    db.commit()


# ---------- Owner: extra photos ----------

def add_image(db: Session, food_id: int, data: FoodImageCreate) -> FoodImage:
    get_food_or_404(db, food_id)

    image = FoodImage(
        food_id=food_id,
        url=data.url.strip(),
        sort_order=data.sort_order
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image


def delete_image(db: Session, image_id: int):
    image = db.query(FoodImage).filter(FoodImage.id == image_id).first()

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found."
        )

    db.delete(image)
    db.commit()
