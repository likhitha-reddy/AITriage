from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.triage import TriageResultCreate, TriageResultResponse
from app.services import triage as triage_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("/", response_model=TriageResultResponse, status_code=status.HTTP_201_CREATED)
def submit_triage(
    payload: TriageResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TriageResultResponse:
    try:
        return triage_service.submit_triage(db, current_user, payload)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to submit triage") from exc


@router.get("/{triage_result_id}", response_model=TriageResultResponse)
def get_triage_result(
    triage_result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TriageResultResponse:
    try:
        return triage_service.get_triage_result(db, triage_result_id, current_user.id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch triage result") from exc
