from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.food import Food
from app.models.order import Order, STATUS_CANCELLED
from app.models.order_item import OrderItem
from app.schemas.food import FoodCreate, FoodUpdate
from app.services.category_service import get_category_or_404
from app.services.pagination import paginate


# The columns the frontend is allowed to sort by
SORT_COLUMNS = {
    "name": Food.name,
    "price": Food.price,
    "newest": Food.created_at
}


def get_foods(
    db: Session,
    search: str | None,
    category_id: int | None,
    sort: str,
    order: str,
    page: int,
    limit: int,
    only_available: bool,
    available: bool | None = None
) -> dict:
    query = db.query(Food)

    # 1. Filters
    if only_available:
        query = query.filter(Food.is_available == True)  # noqa: E712

    # Owner's "Available" / "Unavailable" tabs (None = both)
    if available is not None:
        query = query.filter(Food.is_available == available)

    if search:
        query = query.filter(Food.name.ilike(f"%{search.strip()}%"))

    if category_id:
        query = query.filter(Food.category_id == category_id)

    # 2. Sorting
    if sort == "popular":
        query = sort_by_popular(db, query)
    else:
        sort_column = SORT_COLUMNS.get(sort, Food.name)

        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    # 3. Pagination
    return paginate(query, page, limit)


# "Sort by: Popular" on the Menu page.
# Most sold foods first. Cancelled orders do not count.
def sort_by_popular(db: Session, query):
    # One row per food: (food_id, total_sold)
    sold = (
        db.query(
            OrderItem.food_id,
            func.sum(OrderItem.quantity).label("total_sold")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status != STATUS_CANCELLED)
        .group_by(OrderItem.food_id)
        .subquery()
    )

    # TODO(human): join `sold` to `query` and order the foods by sold.c.total_sold.
    return query


def get_popular_foods(db: Session, limit: int):
    # Best sellers: add up the quantity of each food in all orders
    best_sellers = (
        db.query(Food)
        .join(OrderItem, OrderItem.food_id == Food.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status != STATUS_CANCELLED)
        .filter(Food.is_available == True)  # noqa: E712
        .group_by(Food.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )

    # A new restaurant has few orders, so fill the empty places
    # with the newest available foods.
    if len(best_sellers) < limit:
        used_ids = [food.id for food in best_sellers]

        newest_foods = (
            db.query(Food)
            .filter(Food.is_available == True)  # noqa: E712
            .filter(Food.id.notin_(used_ids))
            .order_by(Food.created_at.desc())
            .limit(limit - len(best_sellers))
            .all()
        )

        best_sellers = best_sellers + newest_foods

    return best_sellers


def get_food_or_404(db: Session, food_id: int) -> Food:
    food = db.query(Food).filter(Food.id == food_id).first()

    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found."
        )

    return food


# The sale price must be lower than the normal price
def check_discount(price, discount_price):
    if discount_price is not None and discount_price >= float(price):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The discount price must be lower than the price."
        )


def create_food(db: Session, data: FoodCreate) -> Food:
    # Category must exist
    get_category_or_404(db, data.category_id)
    check_discount(data.price, data.discount_price)

    food = Food(
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
        price=data.price,
        discount_price=data.discount_price,
        prep_time=data.prep_time,
        calories=data.calories,
        image=data.image,
        is_available=data.is_available
    )

    db.add(food)
    db.commit()
    db.refresh(food)

    return food


def update_food(db: Session, food_id: int, data: FoodUpdate) -> Food:
    food = get_food_or_404(db, food_id)

    if data.category_id is not None:
        get_category_or_404(db, data.category_id)
        food.category_id = data.category_id

    if data.name is not None:
        food.name = data.name.strip()

    if data.description is not None:
        food.description = data.description

    if data.price is not None:
        food.price = data.price

    if data.is_available is not None:
        food.is_available = data.is_available

    # These can be cleared, so "sent as null" is different from "not sent".
    # model_fields_set = only the fields that were really in the request.
    for field in ("discount_price", "prep_time", "calories", "image"):
        if field in data.model_fields_set:
            setattr(food, field, getattr(data, field))

    check_discount(food.price, food.discount_price)

    db.commit()
    db.refresh(food)

    return food


def delete_food(db: Session, food_id: int):
    food = get_food_or_404(db, food_id)

    # A food that is in old orders cannot be deleted,
    # or those orders would lose their item. Hide it instead.
    used_in_orders = db.query(OrderItem).filter(OrderItem.food_id == food_id).first()

    if used_in_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This food is in past orders. Disable it instead of deleting."
        )

    db.delete(food)
    db.commit()
