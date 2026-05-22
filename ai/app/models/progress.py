from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.triage import TriageResponse


class ProgressCheckIn(BaseModel):
    symptoms_current: str = Field(..., min_length=1)
    improvement_rating: int = Field(..., ge=1, le=10)
    new_symptoms: list[str] = Field(default_factory=list)
    notes: str | None = None
    mood_rating: int | None = Field(default=None, ge=1, le=10)


class ProgressEvaluationRequest(BaseModel):
    check_ins: list[ProgressCheckIn] = Field(..., min_length=1)
    original_triage: TriageResponse


class ProgressAssessment(BaseModel):
    trend: str = Field(..., min_length=1)
    recommendation: str = Field(..., min_length=1)
    needs_reconsultation: bool = False
    concerning_patterns: list[str] = Field(default_factory=list)
    symptom_trajectory: list[int] = Field(default_factory=list)
    mood_trend: str | None = None
    crisis_rescreened: bool = False
    reconsultation_threshold: str | None = None
    last_check_in_summary: str | None = None
