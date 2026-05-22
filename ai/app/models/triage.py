from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from app.models.diagnosis import Diagnosis, RecommendedAction


class SeverityLevel(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    HIGH = "high"
    EMERGENCY = "emergency"


class ImageAnalysis(BaseModel):
    observations: list[str] = Field(default_factory=list)
    concerning_features: list[str] = Field(default_factory=list)
    quality_issues: list[str] = Field(default_factory=list)
    summary: str = ""


class TriageRequest(BaseModel):
    symptoms_text: str = Field(..., min_length=1)
    image_urls: list[str] = Field(default_factory=list)
    patient_age: int | None = Field(default=None, ge=0, le=120)
    patient_gender: str | None = None
    medical_history: list[str] = Field(default_factory=list)


class TriageResponse(BaseModel):
    possible_diagnoses: list[Diagnosis] = Field(default_factory=list)
    confidence_scores: dict[str, float] = Field(default_factory=dict)
    severity_level: SeverityLevel = SeverityLevel.MODERATE
    recommended_action: RecommendedAction = RecommendedAction.CONSULT_DOCTOR
    follow_up_questions: list[str] = Field(default_factory=list)
    referral_specialization: str | None = None
    image_observations: list[ImageAnalysis] = Field(default_factory=list)
    disclaimers: list[str] = Field(default_factory=list)
