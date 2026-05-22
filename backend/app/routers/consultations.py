import logging
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.consultation import ConsultationCancel, ConsultationCreate, ConsultationResponse, ConsultationUpdate
from app.services import consultations as consultation_service
from app.services import notifications as notification_service
from app.services import video as video_service
from app.services.exceptions import ServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/consultations", tags=["consultations"])


@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def book_consultation(
    payload: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsultationResponse:
    try:
        consultation = consultation_service.book_consultation(db, current_user, payload)
        try:
            video_session = video_service.create_session(db, consultation.id)
            notification_service.send_notification(
                db,
                current_user.id,
                "Consultation booked",
                "Your video consultation has been scheduled and the room is ready.",
                "general",
                {
                    "consultation_id": consultation.id,
                    "doctor_id": consultation.doctor_id,
                    "scheduled_at": consultation.scheduled_at.isoformat(),
                    "video_room_id": video_session.room_id,
                },
            )
            # TODO: schedule notify_consultation_reminder 15 minutes before consultation.scheduled_at.
        except Exception:
            logger.exception("Post-booking automation failed", extra={"consultation_id": consultation.id})
        return consultation
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to book consultation") from exc


@router.get("/", response_model=List[ConsultationResponse])
def list_consultations(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ConsultationResponse]:
    try:
        return consultation_service.list_patient_consultations(db, current_user.id, skip=skip, limit=limit)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch consultations") from exc


@router.patch("/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(
    consultation_id: int,
    payload: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsultationResponse:
    try:
        return consultation_service.update_consultation(db, consultation_id, current_user.id, payload)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to update consultation") from exc


@router.post("/{consultation_id}/cancel", response_model=ConsultationResponse)
def cancel_consultation(
    consultation_id: int,
    payload: ConsultationCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsultationResponse:
    try:
        return consultation_service.cancel_consultation(db, consultation_id, current_user.id, payload.reason)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to cancel consultation") from exc
