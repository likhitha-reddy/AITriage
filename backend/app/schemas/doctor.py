from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DoctorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    specialization: str = Field(..., min_length=1, max_length=255)
    qualification: str = Field(..., min_length=1, max_length=255)
    experience_years: int = Field(default=0, ge=0)
    consultation_fee: Decimal = Field(default=0, ge=0)
    is_available: bool = True
    rating: float = Field(default=0.0, ge=0.0, le=5.0)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    specialization: Optional[str] = Field(default=None, min_length=1, max_length=255)
    qualification: Optional[str] = Field(default=None, min_length=1, max_length=255)
    experience_years: Optional[int] = Field(default=None, ge=0)
    consultation_fee: Optional[Decimal] = Field(default=None, ge=0)
    is_available: Optional[bool] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)


class DoctorResponse(DoctorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DoctorMatchResponse(DoctorResponse):
    match_score: float = Field(default=0.0, ge=0.0)


class DoctorAvailabilityResponse(BaseModel):
    doctor_id: int
    is_available: bool
    specialization: str
