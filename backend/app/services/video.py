from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.video_session import VideoSession
from app.schemas.video_session import VideoSessionJoin, VideoSessionResponse
from app.services.exceptions import NotFoundError


ACTIVE_VIDEO_STATUSES = {"waiting", "active"}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_room_id(consultation_id: int) -> str:
    return f"consultation-{consultation_id}-{uuid4().hex[:10]}"


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _get_by_room_id(db: Session, room_id: str) -> VideoSession:
    session = db.execute(select(VideoSession).where(VideoSession.room_id == room_id)).scalars().first()
    if session is None:
        raise NotFoundError("Video session not found")
    return session


def create_session(db: Session, consultation_id: int) -> VideoSessionResponse:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None:
        raise NotFoundError("Consultation not found")

    existing = db.execute(
        select(VideoSession).where(VideoSession.consultation_id == consultation_id)
    ).scalars().first()
    if existing is not None:
        return VideoSessionResponse.model_validate(existing)

    room_id = _generate_room_id(consultation_id)
    while db.execute(select(VideoSession.id).where(VideoSession.room_id == room_id)).first() is not None:
        room_id = _generate_room_id(consultation_id)

    session = VideoSession(
        consultation_id=consultation_id,
        room_id=room_id,
        provider="agora",
        status="waiting",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return VideoSessionResponse.model_validate(session)


def join_session(db: Session, room_id: str, user_id: int) -> VideoSessionJoin:
    session = _get_by_room_id(db, room_id)
    if session.status not in ACTIVE_VIDEO_STATUSES:
        raise NotFoundError("Video session is no longer available")

    if session.status == "waiting":
        session.status = "active"
        if session.started_at is None:
            session.started_at = _utc_now()
        db.add(session)
        db.commit()
        db.refresh(session)

    token = f"mock-video-token-{user_id}-{room_id}-{uuid4().hex[:12]}"
    return VideoSessionJoin(
        room_id=session.room_id,
        provider=session.provider,
        status=session.status,
        token=token,
    )


def end_session(db: Session, room_id: str) -> VideoSessionResponse:
    session = _get_by_room_id(db, room_id)
    if session.status == "ended":
        return VideoSessionResponse.model_validate(session)

    ended_at = _utc_now()
    duration_minutes = 0
    started_at = _normalize_datetime(session.started_at)
    if started_at is not None:
        duration_minutes = max(0, int((ended_at - started_at).total_seconds() // 60))

    session.status = "ended"
    session.ended_at = ended_at
    session.duration_minutes = duration_minutes
    db.add(session)
    db.commit()
    db.refresh(session)
    return VideoSessionResponse.model_validate(session)


def get_session(db: Session, consultation_id: int) -> VideoSessionResponse:
    session = db.execute(
        select(VideoSession).where(VideoSession.consultation_id == consultation_id)
    ).scalars().first()
    if session is None:
        raise NotFoundError("Video session not found")
    return VideoSessionResponse.model_validate(session)
