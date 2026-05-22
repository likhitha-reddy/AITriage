from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorAvailabilityResponse, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    specialization: Optional[str] = Query(default=None),
    available_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> List[DoctorResponse]:
    query = select(Doctor)
    if specialization:
        query = query.where(Doctor.specialization.ilike(f"%{specialization}%"))
    if available_only:
        query = query.where(Doctor.is_available.is_(True))
    return list(db.execute(query.order_by(Doctor.rating.desc(), Doctor.name.asc())).scalars().all())


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_detail(doctor_id: int, db: Session = Depends(get_db)) -> DoctorResponse:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.get("/{doctor_id}/availability", response_model=DoctorAvailabilityResponse)
def get_doctor_availability(doctor_id: int, db: Session = Depends(get_db)) -> DoctorAvailabilityResponse:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return DoctorAvailabilityResponse(
        doctor_id=doctor.id,
        is_available=doctor.is_available,
        specialization=doctor.specialization,
    )
