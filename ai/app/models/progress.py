from __future__ import annotations

from pydantic import BaseModel, Field


class ProgressCheckIn(BaseModel):
    symptoms_current: str = Field(..., min_length=1)
    improvement_rating: int = Field(..., ge=1, le=10)
    new_symptoms: list[str] = Field(default_factory=list)


class ProgressAssessment(BaseModel):
    trend: str = Field(..., min_length=1)
    recommendation: str = Field(..., min_length=1)
    needs_reconsultation: bool = False
