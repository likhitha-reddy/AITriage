from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RecommendedAction(str, Enum):
    SELF_CARE = "SELF_CARE"
    CONSULT_DOCTOR = "CONSULT_DOCTOR"
    URGENT_CARE = "URGENT_CARE"
    EMERGENCY = "EMERGENCY"


class Diagnosis(BaseModel):
    name: str = Field(..., min_length=1)
    icd_code_hint: str | None = None
    probability: float = Field(..., ge=0.0, le=1.0)
    description: str = Field(..., min_length=1)
    urgency: str = Field(default="routine", min_length=1)
