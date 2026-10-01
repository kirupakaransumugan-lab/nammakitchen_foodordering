from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    image: str | None = None


class CategoryUpdate(BaseModel):
    # All fields are optional, so the owner can change only one thing
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = None
    image: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    image: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
