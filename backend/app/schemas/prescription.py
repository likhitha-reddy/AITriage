from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionBase(BaseModel):
    consultation_id: int
    doctor_id: int
    patient_id: int
    drugs: List[Dict[str, Any]] = Field(default_factory=list)
    notes: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    drugs: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class PrescriptionResponse(PrescriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
