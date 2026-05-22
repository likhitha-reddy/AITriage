from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VideoSessionCreate(BaseModel):
    consultation_id: int = Field(..., ge=1)


class VideoSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consultation_id: int
    room_id: str
    provider: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    created_at: datetime


class VideoSessionJoin(BaseModel):
    room_id: str
    provider: str
    status: str
    token: str
