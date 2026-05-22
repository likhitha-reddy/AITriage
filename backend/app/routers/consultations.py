from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.triage import TriageResult
from app.models.user import User
from app.schemas.consultation import ConsultationCreate, ConsultationResponse, ConsultationUpdate

router = APIRouter(prefix="/consultations", tags=["consultations"])


@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def book_consultation(
    payload: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsultationResponse:
    doctor = db.get(Doctor, payload.doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if not doctor.is_available:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Doctor is not currently available")

    if payload.triage_result_id is not None:
        triage_result = db.get(TriageResult, payload.triage_result_id)
        if triage_result is None or triage_result.patient_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Triage result not found")

    consultation = Consultation(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        triage_result_id=payload.triage_result_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status="scheduled",
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation


@router.get("/", response_model=List[ConsultationResponse])
def list_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ConsultationResponse]:
    query = (
        select(Consultation)
        .where(Consultation.patient_id == current_user.id)
        .order_by(Consultation.scheduled_at.desc())
    )
    return list(db.execute(query).scalars().all())


@router.patch("/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(
    consultation_id: int,
    payload: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsultationResponse:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None or consultation.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")

    updates = payload.dict(exclude_unset=True)

    if "doctor_id" in updates:
        doctor = db.get(Doctor, updates["doctor_id"])
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if "triage_result_id" in updates and updates["triage_result_id"] is not None:
        triage_result = db.get(TriageResult, updates["triage_result_id"])
        if triage_result is None or triage_result.patient_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Triage result not found")

    for field, value in updates.items():
        setattr(consultation, field, value)

    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation
