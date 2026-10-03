from pydantic import BaseModel, ConfigDict, Field


# One line in the cart that the customer sends
class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int = Field(ge=1, le=50)
    # ids of the picked options (size, crust, toppings)
    option_ids: list[int] = []
    note: str | None = Field(default=None, max_length=255)


class OrderItemOptionResponse(BaseModel):
    group_name: str
    option_name: str
    extra_price: float

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    id: int
    food_id: int
    food_name: str
    food_image: str | None
    quantity: int
    unit_price: float
    subtotal: float
    note: str | None
    options: list[OrderItemOptionResponse]

    model_config = ConfigDict(from_attributes=True)
