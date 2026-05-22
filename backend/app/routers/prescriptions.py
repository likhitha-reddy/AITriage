from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services import prescriptions as prescription_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
) -> PrescriptionResponse:
    try:
        return prescription_service.create_prescription(db, payload)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to create prescription") from exc


@router.get("/", response_model=List[PrescriptionResponse])
def list_prescriptions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[PrescriptionResponse]:
    try:
        return prescription_service.list_patient_prescriptions(db, current_user.id, skip=skip, limit=limit)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch prescriptions") from exc


@router.get("/consultation/{consultation_id}", response_model=PrescriptionResponse)
def get_prescription_for_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PrescriptionResponse:
    try:
        return prescription_service.get_prescription_by_consultation(db, consultation_id, current_user.id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch prescription") from exc
