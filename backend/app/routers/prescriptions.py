from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionResponse

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.get("/consultation/{consultation_id}", response_model=PrescriptionResponse)
def get_prescription_for_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PrescriptionResponse:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None or consultation.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")

    prescription = db.execute(
        select(Prescription).where(Prescription.consultation_id == consultation_id)
    ).scalar_one_or_none()
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return prescription
