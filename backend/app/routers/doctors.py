from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.doctor import DoctorAvailabilityResponse, DoctorMatchResponse, DoctorResponse
from app.services import doctor_matching
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    specialization: Optional[str] = Query(default=None),
    available_only: bool = Query(default=False),
    min_rating: Optional[float] = Query(default=None, ge=0.0, le=5.0),
    fee_min: Optional[Decimal] = Query(default=None, ge=0),
    fee_max: Optional[Decimal] = Query(default=None, ge=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[DoctorResponse]:
    try:
        return doctor_matching.list_doctors(
            db=db,
            specialization=specialization,
            available_only=available_only,
            min_rating=min_rating,
            fee_min=fee_min,
            fee_max=fee_max,
            skip=skip,
            limit=limit,
        )
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch doctors") from exc


@router.get("/match", response_model=List[DoctorMatchResponse])
def match_doctors(
    triage_result_id: int = Query(..., ge=1),
    available_only: bool = Query(default=True),
    min_rating: Optional[float] = Query(default=None, ge=0.0, le=5.0),
    fee_min: Optional[Decimal] = Query(default=None, ge=0),
    fee_max: Optional[Decimal] = Query(default=None, ge=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DoctorMatchResponse]:
    try:
        return doctor_matching.match_doctors_for_triage(
            db=db,
            triage_result_id=triage_result_id,
            patient_id=current_user.id,
            available_only=available_only,
            min_rating=min_rating,
            fee_min=fee_min,
            fee_max=fee_max,
            skip=skip,
            limit=limit,
        )
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to match doctors") from exc


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_detail(doctor_id: int, db: Session = Depends(get_db)) -> DoctorResponse:
    try:
        return doctor_matching.get_doctor(db, doctor_id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch doctor details") from exc


@router.get("/{doctor_id}/availability", response_model=DoctorAvailabilityResponse)
def get_doctor_availability(doctor_id: int, db: Session = Depends(get_db)) -> DoctorAvailabilityResponse:
    try:
        return doctor_matching.get_doctor_availability(db, doctor_id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch doctor availability") from exc
