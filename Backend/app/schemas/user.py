from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    address: str | None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str
    address: str | None = None