from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class FoodCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=500)
    price: float = Field(gt=0)
    discount_price: float | None = Field(default=None, gt=0)
    prep_time: int | None = Field(default=None, ge=1, le=300)
    calories: int | None = Field(default=None, ge=0, le=5000)
    image: str | None = Field(default=None, max_length=255)
    is_available: bool = True


class FoodUpdate(BaseModel):
    # All fields are optional, so the owner can change only the price, etc.
    # discount_price / prep_time / calories can be sent as null to clear them.
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0)
    discount_price: float | None = Field(default=None, gt=0)
    prep_time: int | None = Field(default=None, ge=1, le=300)
    calories: int | None = Field(default=None, ge=0, le=5000)
    image: str | None = Field(default=None, max_length=255)
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
    discount_price: float | None
    prep_time: int | None
    calories: int | None
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


# ---------- Options (size, crust, toppings) + extra photos ----------

class FoodOptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    extra_price: float = Field(default=0, ge=0)
    image: str | None = None


class FoodOptionGroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    selection: Literal["single", "multiple"] = "single"
    is_required: bool = False
    sort_order: int = 0
    options: list[FoodOptionCreate] = Field(min_length=1)


class FoodImageCreate(BaseModel):
    url: str = Field(min_length=5, max_length=255)
    sort_order: int = 0


class FoodOptionResponse(BaseModel):
    id: int
    name: str
    extra_price: float
    image: str | None

    model_config = ConfigDict(from_attributes=True)


class FoodOptionGroupResponse(BaseModel):
    id: int
    name: str
    selection: str
    is_required: bool
    sort_order: int
    options: list[FoodOptionResponse]

    model_config = ConfigDict(from_attributes=True)


class FoodImageResponse(BaseModel):
    id: int
    url: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


# One food with everything the "Add to cart" popup needs
class FoodDetailResponse(FoodResponse):
    option_groups: list[FoodOptionGroupResponse]
    images: list[FoodImageResponse]
