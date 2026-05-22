from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TriageResultBase(BaseModel):
    symptoms_text: str = Field(..., min_length=3)
    image_urls: List[str] = Field(default_factory=list)
    ai_analysis: Dict[str, Any] = Field(default_factory=dict)
    possible_diagnoses: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    recommended_action: str = Field(default="Doctor review recommended", min_length=3, max_length=255)


class TriageResultCreate(BaseModel):
    symptoms_text: str = Field(..., min_length=3)
    image_urls: List[str] = Field(default_factory=list)


class TriageResultUpdate(BaseModel):
    symptoms_text: Optional[str] = Field(default=None, min_length=3)
    image_urls: Optional[List[str]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    possible_diagnoses: Optional[List[str]] = None
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    recommended_action: Optional[str] = Field(default=None, min_length=3, max_length=255)


class TriageResultResponse(TriageResultBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    created_at: datetime
