from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=32)
    date_of_birth: Optional[date] = None
    subscription_tier: str = Field(default="free", max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=32)
    date_of_birth: Optional[date] = None
    subscription_tier: Optional[str] = Field(default=None, max_length=50)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
