from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

NotificationType = Literal[
    "consultation_reminder",
    "triage_result",
    "prescription_ready",
    "progress_checkin",
    "general",
]
DevicePlatform = Literal["ios", "android"]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    body: str
    type: NotificationType
    data: Dict[str, Any] = Field(default_factory=dict)
    is_read: bool
    created_at: datetime


class NotificationList(BaseModel):
    items: List[NotificationResponse] = Field(default_factory=list)
    unread_count: int = 0


class DeviceTokenCreate(BaseModel):
    token: str = Field(..., min_length=8, max_length=512)
    platform: DevicePlatform


class DeviceTokenDelete(BaseModel):
    token: str = Field(..., min_length=8, max_length=512)


class DeviceTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    token: str
    platform: DevicePlatform
    is_active: bool
    created_at: datetime


class NotificationPreferences(BaseModel):
    consultation_reminder: bool = True
    triage_result: bool = True
    prescription_ready: bool = True
    progress_checkin: bool = True
    general: bool = True


class UnreadCountResponse(BaseModel):
    unread_count: int = 0


class BulkReadResponse(BaseModel):
    updated_count: int = 0
