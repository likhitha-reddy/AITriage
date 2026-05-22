from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ConsultationBase(BaseModel):
    doctor_id: int
    triage_result_id: Optional[int] = None
    status: str = Field(default="scheduled", max_length=50)
    scheduled_at: datetime
    notes: Optional[str] = None
    prescription_id: Optional[int] = None


class ConsultationCreate(BaseModel):
    doctor_id: int
    triage_result_id: Optional[int] = None
    scheduled_at: datetime
    notes: Optional[str] = None


class ConsultationUpdate(BaseModel):
    doctor_id: Optional[int] = None
    triage_result_id: Optional[int] = None
    status: Optional[str] = Field(default=None, max_length=50)
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    prescription_id: Optional[int] = None


class ConsultationResponse(ConsultationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
