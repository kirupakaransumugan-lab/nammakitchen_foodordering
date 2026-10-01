from datetime import datetime

from pydantic import BaseModel, ConfigDict


# What we send back to the frontend about a user.
# password_hash is NOT here, so it is never sent out.
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    address: str | None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
