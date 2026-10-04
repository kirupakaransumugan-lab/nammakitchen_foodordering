from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# "09:00" ... "23:59"
TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


class RestaurantResponse(BaseModel):
    name: str
    tagline: str | None
    description: str | None
    phone: str | None
    email: str | None
    address: str | None
    open_time: str | None
    close_time: str | None
    logo: str | None
    cover_image: str | None
    is_accepting_orders: bool
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RestaurantUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    tagline: str | None = Field(default=None, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=255)
    open_time: str | None = Field(default=None, pattern=TIME_PATTERN)
    close_time: str | None = Field(default=None, pattern=TIME_PATTERN)
    logo: str | None = Field(default=None, max_length=255)
    cover_image: str | None = Field(default=None, max_length=255)


class OrderingUpdate(BaseModel):
    is_accepting_orders: bool
