from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FoodCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=500)
    price: float = Field(gt=0)
    image: str | None = None
    is_available: bool = True


class FoodUpdate(BaseModel):
    # All fields are optional, so the owner can change only the price, etc.
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0)
    image: str | None = None
    is_available: bool | None = None


# Small category info shown inside each food
class FoodCategory(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class FoodResponse(BaseModel):
    id: int
    category_id: int
    category: FoodCategory
    name: str
    description: str | None
    price: float
    image: str | None
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# One page of foods + numbers the frontend needs for pagination
class FoodListResponse(BaseModel):
    items: list[FoodResponse]
    total: int
    page: int
    limit: int
    total_pages: int
