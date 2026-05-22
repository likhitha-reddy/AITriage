from __future__ import annotations

from decimal import Decimal

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.models.triage import TriageResult
from app.schemas.doctor import DoctorAvailabilityResponse, DoctorMatchResponse, DoctorResponse
from app.services.exceptions import BadRequestError, ForbiddenError, NotFoundError


SPECIALIZATION_ALIASES = {
    "dermatology": "Dermatology",
    "dermatologist": "Dermatology",
    "psychiatry": "Psychiatry",
    "psychiatrist": "Psychiatry",
    "mental health": "Psychiatry",
    "general practice": "General Practice",
    "general practitioner": "General Practice",
    "gp": "General Practice",
    "ent": "ENT",
    "ear nose throat": "ENT",
}


def _normalize_specialization(specialization: str | None) -> str | None:
    if not specialization:
        return None
    normalized = specialization.strip().lower()
    return SPECIALIZATION_ALIASES.get(normalized, specialization.strip())


def _validate_fee_range(fee_min: Decimal | None, fee_max: Decimal | None) -> None:
    if fee_min is not None and fee_max is not None and fee_min > fee_max:
        raise BadRequestError("Minimum fee cannot be greater than maximum fee")


def list_doctors(
    db: Session,
    specialization: str | None = None,
    available_only: bool = False,
    min_rating: float | None = None,
    fee_min: Decimal | None = None,
    fee_max: Decimal | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[DoctorResponse]:
    _validate_fee_range(fee_min, fee_max)
    normalized_specialization = _normalize_specialization(specialization)

    query = select(Doctor)
    if normalized_specialization:
        query = query.where(Doctor.specialization.ilike(f"%{normalized_specialization}%"))
    if available_only:
        query = query.where(Doctor.is_available.is_(True))
    if min_rating is not None:
        query = query.where(Doctor.rating >= min_rating)
    if fee_min is not None:
        query = query.where(Doctor.consultation_fee >= fee_min)
    if fee_max is not None:
        query = query.where(Doctor.consultation_fee <= fee_max)

    if normalized_specialization:
        specialization_rank = case(
            (Doctor.specialization.ilike(normalized_specialization), 3),
            (Doctor.specialization.ilike(f"%{normalized_specialization}%"), 2),
            else_=1,
        )
        query = query.order_by(
            specialization_rank.desc(),
            Doctor.is_available.desc(),
            Doctor.rating.desc(),
            Doctor.experience_years.desc(),
            Doctor.consultation_fee.asc(),
            Doctor.name.asc(),
        )
    else:
        query = query.order_by(
            Doctor.is_available.desc(),
            Doctor.rating.desc(),
            Doctor.experience_years.desc(),
            Doctor.consultation_fee.asc(),
            Doctor.name.asc(),
        )

    doctors = db.execute(query.offset(skip).limit(limit)).scalars().all()
    return [DoctorResponse.model_validate(doctor) for doctor in doctors]


def get_doctor(db: Session, doctor_id: int) -> DoctorResponse:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise NotFoundError("Doctor not found")
    return DoctorResponse.model_validate(doctor)


def get_doctor_availability(db: Session, doctor_id: int) -> DoctorAvailabilityResponse:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise NotFoundError("Doctor not found")
    return DoctorAvailabilityResponse(
        doctor_id=doctor.id,
        is_available=doctor.is_available,
        specialization=doctor.specialization,
    )


def _extract_specialization_from_triage(triage_result: TriageResult) -> str:
    ai_analysis = triage_result.ai_analysis or {}
    specialization = ai_analysis.get("referral_specialization")
    if specialization:
        return _normalize_specialization(str(specialization)) or "General Practice"

    recommended_action = (triage_result.recommended_action or "").lower()
    for alias, normalized in SPECIALIZATION_ALIASES.items():
        if alias in recommended_action:
            return normalized
    return "General Practice"


def match_doctors_for_triage(
    db: Session,
    triage_result_id: int,
    patient_id: int,
    available_only: bool = True,
    min_rating: float | None = None,
    fee_min: Decimal | None = None,
    fee_max: Decimal | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[DoctorMatchResponse]:
    triage_result = db.get(TriageResult, triage_result_id)
    if triage_result is None:
        raise NotFoundError("Triage result not found")
    if triage_result.patient_id != patient_id:
        raise ForbiddenError("You cannot access this triage result")

    specialization = _extract_specialization_from_triage(triage_result)
    matches = list_doctors(
        db=db,
        specialization=specialization,
        available_only=available_only,
        min_rating=min_rating,
        fee_min=fee_min,
        fee_max=fee_max,
        skip=skip,
        limit=limit,
    )

    results: list[DoctorMatchResponse] = []
    for doctor in matches:
        match_score = round(
            (50 if doctor.specialization.lower() == specialization.lower() else 35)
            + (25 if doctor.is_available else 0)
            + (doctor.rating * 5)
            + max(0, min(10, doctor.experience_years / 2)),
            2,
        )
        results.append(DoctorMatchResponse(**doctor.model_dump(), match_score=match_score))
    return results
