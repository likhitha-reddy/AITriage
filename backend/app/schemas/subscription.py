from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SubscriptionBase(BaseModel):
    plan: str = Field(..., min_length=1, max_length=100)
    status: str = Field(default="active", max_length=50)
    started_at: datetime
    expires_at: datetime


class SubscriptionCreate(BaseModel):
    plan: str = Field(..., min_length=1, max_length=100)
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class SubscriptionUpdate(BaseModel):
    plan: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[str] = Field(default=None, max_length=50)
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class SubscriptionResponse(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
