from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.video_session import VideoSessionCreate, VideoSessionJoin, VideoSessionResponse
from app.services import video as video_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/video/sessions", tags=["video"])


@router.post("", response_model=VideoSessionResponse, status_code=status.HTTP_201_CREATED)
def create_video_session(
    payload: VideoSessionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VideoSessionResponse:
    try:
        return video_service.create_session(db, payload.consultation_id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to create video session") from exc


@router.post("/{room_id}/join", response_model=VideoSessionJoin)
def join_video_session(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VideoSessionJoin:
    try:
        return video_service.join_session(db, room_id, current_user.id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to join video session") from exc


@router.post("/{room_id}/end", response_model=VideoSessionResponse)
def end_video_session(
    room_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VideoSessionResponse:
    try:
        return video_service.end_session(db, room_id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to end video session") from exc


@router.get("/{consultation_id}", response_model=VideoSessionResponse)
def get_video_session(
    consultation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VideoSessionResponse:
    try:
        return video_service.get_session(db, consultation_id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch video session") from exc
