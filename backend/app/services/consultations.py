from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.triage import TriageResult
from app.models.user import User
from app.schemas.consultation import ConsultationCreate, ConsultationResponse, ConsultationUpdate
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError

ACTIVE_CONSULTATION_STATUSES = ("scheduled", "in_progress")
ALLOWED_STATUS_TRANSITIONS = {
    "scheduled": {"in_progress", "cancelled"},
    "in_progress": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _ensure_doctor_exists(db: Session, doctor_id: int) -> Doctor:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise NotFoundError("Doctor not found")
    return doctor


def _ensure_triage_belongs_to_patient(db: Session, triage_result_id: int | None, patient_id: int) -> None:
    if triage_result_id is None:
        return
    triage_result = db.get(TriageResult, triage_result_id)
    if triage_result is None or triage_result.patient_id != patient_id:
        raise NotFoundError("Triage result not found")


def _ensure_doctor_slot_available(
    db: Session,
    doctor_id: int,
    scheduled_at: datetime,
    consultation_id: int | None = None,
) -> None:
    slot_start = scheduled_at - timedelta(minutes=30)
    slot_end = scheduled_at + timedelta(minutes=30)
    conflict_query = select(Consultation).where(
        Consultation.doctor_id == doctor_id,
        Consultation.status.in_(ACTIVE_CONSULTATION_STATUSES),
        Consultation.scheduled_at >= slot_start,
        Consultation.scheduled_at <= slot_end,
    )
    if consultation_id is not None:
        conflict_query = conflict_query.where(Consultation.id != consultation_id)

    existing = db.execute(conflict_query.order_by(Consultation.scheduled_at.asc())).scalars().first()
    if existing is not None:
        raise ConflictError("Doctor is not available for the selected time")


def _ensure_consultation_belongs_to_patient(db: Session, consultation_id: int, patient_id: int) -> Consultation:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None or consultation.patient_id != patient_id:
        raise NotFoundError("Consultation not found")
    return consultation


def _validate_status_transition(current_status: str, new_status: str) -> None:
    if new_status == current_status:
        return
    allowed_transitions = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed_transitions:
        raise BadRequestError(f"Cannot change consultation status from {current_status} to {new_status}")


def book_consultation(db: Session, patient: User, payload: ConsultationCreate) -> ConsultationResponse:
    scheduled_at = _normalize_datetime(payload.scheduled_at)
    if scheduled_at <= _utc_now():
        raise BadRequestError("Consultation time must be in the future")

    doctor = _ensure_doctor_exists(db, payload.doctor_id)
    if not doctor.is_available:
        raise ConflictError("Doctor is not currently available")

    _ensure_triage_belongs_to_patient(db, payload.triage_result_id, patient.id)
    _ensure_doctor_slot_available(db, doctor.id, scheduled_at)

    consultation = Consultation(
        patient_id=patient.id,
        doctor_id=doctor.id,
        triage_result_id=payload.triage_result_id,
        status="scheduled",
        scheduled_at=scheduled_at,
        notes=payload.notes,
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return ConsultationResponse.model_validate(consultation)


def list_patient_consultations(db: Session, patient_id: int, skip: int = 0, limit: int = 20) -> list[ConsultationResponse]:
    consultations = db.execute(
        select(Consultation)
        .where(Consultation.patient_id == patient_id)
        .order_by(Consultation.scheduled_at.desc(), Consultation.id.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()
    return [ConsultationResponse.model_validate(consultation) for consultation in consultations]


def update_consultation(
    db: Session,
    consultation_id: int,
    patient_id: int,
    payload: ConsultationUpdate,
) -> ConsultationResponse:
    consultation = _ensure_consultation_belongs_to_patient(db, consultation_id, patient_id)
    updates = payload.model_dump(exclude_unset=True)

    doctor_id = updates.get("doctor_id", consultation.doctor_id)
    scheduled_at = _normalize_datetime(updates.get("scheduled_at", consultation.scheduled_at))

    if consultation.status in {"completed", "cancelled"} and any(key in updates for key in {"doctor_id", "scheduled_at", "triage_result_id"}):
        raise BadRequestError("Completed or cancelled consultations cannot be rescheduled")

    if "doctor_id" in updates:
        doctor = _ensure_doctor_exists(db, doctor_id)
        if not doctor.is_available:
            raise ConflictError("Doctor is not currently available")

    if "triage_result_id" in updates:
        _ensure_triage_belongs_to_patient(db, updates.get("triage_result_id"), patient_id)

    if "scheduled_at" in updates or "doctor_id" in updates:
        if scheduled_at <= _utc_now() and consultation.status == "scheduled":
            raise BadRequestError("Consultation time must be in the future")
        _ensure_doctor_slot_available(db, doctor_id, scheduled_at, consultation_id=consultation.id)

    new_status = updates.get("status")
    if new_status is not None:
        _validate_status_transition(consultation.status, new_status)
        if new_status == "cancelled" and not (updates.get("cancel_reason") or consultation.cancel_reason):
            raise BadRequestError("Cancellation reason is required when cancelling a consultation")
        consultation.status = new_status
        if new_status != "cancelled" and "cancel_reason" not in updates:
            consultation.cancel_reason = None

    if "doctor_id" in updates:
        consultation.doctor_id = doctor_id
    if "triage_result_id" in updates:
        consultation.triage_result_id = updates.get("triage_result_id")
    if "scheduled_at" in updates:
        consultation.scheduled_at = scheduled_at
    if "notes" in updates:
        consultation.notes = updates.get("notes")
    if "cancel_reason" in updates:
        consultation.cancel_reason = updates.get("cancel_reason")

    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return ConsultationResponse.model_validate(consultation)


def cancel_consultation(db: Session, consultation_id: int, patient_id: int, reason: str) -> ConsultationResponse:
    consultation = _ensure_consultation_belongs_to_patient(db, consultation_id, patient_id)
    _validate_status_transition(consultation.status, "cancelled")
    consultation.status = "cancelled"
    consultation.cancel_reason = reason
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return ConsultationResponse.model_validate(consultation)
