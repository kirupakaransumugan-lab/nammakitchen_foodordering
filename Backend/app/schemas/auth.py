from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    address: str | None = None
    password: str = Field(min_length=6, max_length=100)

    # The register page always sends "customer".
    # "admin" and "owner" are created once from Postman.
    role: Literal["customer", "owner", "admin"] = "customer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# The logged-in user changing their own details (email and role stay the same)
class AccountUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    address: str | None = Field(default=None, max_length=255)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=100)
