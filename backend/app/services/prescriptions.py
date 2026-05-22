from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError


def create_prescription(db: Session, payload: PrescriptionCreate) -> PrescriptionResponse:
    consultation = db.get(Consultation, payload.consultation_id)
    if consultation is None:
        raise NotFoundError("Consultation not found")
    if consultation.status not in {"in_progress", "completed"}:
        raise BadRequestError("Prescription can only be issued after the consultation has started")

    doctor = db.get(Doctor, payload.doctor_id)
    if doctor is None:
        raise NotFoundError("Doctor not found")
    if consultation.doctor_id != doctor.id:
        raise BadRequestError("Prescription doctor must match the consultation doctor")

    existing = db.execute(
        select(Prescription).where(Prescription.consultation_id == consultation.id)
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("Prescription already exists for this consultation")
    if not payload.drugs:
        raise BadRequestError("At least one prescribed drug is required")

    prescription = Prescription(
        consultation_id=consultation.id,
        doctor_id=doctor.id,
        patient_id=consultation.patient_id,
        drugs=payload.drugs,
        notes=payload.notes,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    consultation.prescription_id = prescription.id
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return PrescriptionResponse.model_validate(prescription)


def get_prescription_by_consultation(db: Session, consultation_id: int, patient_id: int) -> PrescriptionResponse:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None or consultation.patient_id != patient_id:
        raise NotFoundError("Consultation not found")

    prescription = db.execute(
        select(Prescription).where(Prescription.consultation_id == consultation_id)
    ).scalar_one_or_none()
    if prescription is None:
        raise NotFoundError("Prescription not found")
    return PrescriptionResponse.model_validate(prescription)


def list_patient_prescriptions(db: Session, patient_id: int, skip: int = 0, limit: int = 20) -> list[PrescriptionResponse]:
    prescriptions = db.execute(
        select(Prescription)
        .where(Prescription.patient_id == patient_id)
        .order_by(Prescription.created_at.desc(), Prescription.id.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()
    return [PrescriptionResponse.model_validate(prescription) for prescription in prescriptions]
