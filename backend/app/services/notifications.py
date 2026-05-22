from __future__ import annotations

import logging
from typing import Any, Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.notification import DeviceToken, Notification
from app.models.prescription import Prescription
from app.models.triage import TriageResult
from app.schemas.notification import (
    DeviceTokenResponse,
    NotificationResponse,
)
from app.services.exceptions import NotFoundError

logger = logging.getLogger(__name__)


def register_device(db: Session, user_id: int, token: str, platform: str) -> DeviceTokenResponse:
    device = db.execute(select(DeviceToken).where(DeviceToken.token == token)).scalars().first()
    if device is None:
        device = DeviceToken(user_id=user_id, token=token, platform=platform, is_active=True)
    else:
        device.user_id = user_id
        device.platform = platform
        device.is_active = True

    db.add(device)
    db.commit()
    db.refresh(device)
    return DeviceTokenResponse.model_validate(device)


def unregister_device(db: Session, user_id: int, token: str) -> None:
    device = db.execute(
        select(DeviceToken).where(DeviceToken.user_id == user_id, DeviceToken.token == token)
    ).scalars().first()
    if device is None:
        raise NotFoundError("Device token not found")

    device.is_active = False
    db.add(device)
    db.commit()


def send_notification(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    type: str,
    data: dict[str, Any] | None = None,
) -> NotificationResponse:
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=type,
        data=data or {},
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    active_tokens = db.execute(
        select(DeviceToken).where(DeviceToken.user_id == user_id, DeviceToken.is_active.is_(True))
    ).scalars().all()
    for device in active_tokens:
        logger.info(
            "Mock push delivery queued",
            extra={
                "user_id": user_id,
                "notification_id": notification.id,
                "device_token_id": device.id,
                "platform": device.platform,
                "type": type,
            },
        )

    return NotificationResponse.model_validate(notification)


def send_bulk_notification(
    db: Session,
    user_ids: Iterable[int],
    title: str,
    body: str,
    type: str,
    data: dict[str, Any] | None = None,
) -> list[NotificationResponse]:
    results: list[NotificationResponse] = []
    for user_id in dict.fromkeys(user_ids):
        results.append(send_notification(db, user_id, title, body, type, data))
    return results


def get_notifications(db: Session, user_id: int, unread_only: bool = False) -> list[NotificationResponse]:
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))

    notifications = db.execute(query.order_by(Notification.created_at.desc(), Notification.id.desc())).scalars().all()
    return [NotificationResponse.model_validate(notification) for notification in notifications]


def get_unread_count(db: Session, user_id: int) -> int:
    return int(
        db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        ).scalar_one()
    )


def mark_read(db: Session, notification_id: int, user_id: int) -> NotificationResponse:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise NotFoundError("Notification not found")

    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


def mark_all_read(db: Session, user_id: int) -> int:
    notifications = db.execute(
        select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
    ).scalars().all()
    for notification in notifications:
        notification.is_read = True
        db.add(notification)

    db.commit()
    return len(notifications)


def notify_consultation_reminder(db: Session, consultation: Consultation) -> NotificationResponse:
    scheduled_at = consultation.scheduled_at.isoformat() if consultation.scheduled_at else None
    return send_notification(
        db,
        consultation.patient_id,
        "Consultation starting soon",
        "Your video consultation starts in 15 minutes.",
        "consultation_reminder",
        {"consultation_id": consultation.id, "scheduled_at": scheduled_at},
    )


def notify_triage_complete(db: Session, triage_result: TriageResult) -> NotificationResponse:
    return send_notification(
        db,
        triage_result.patient_id,
        "Your triage result is ready",
        "We have completed your AI triage assessment. Review the latest guidance in the app.",
        "triage_result",
        {"triage_result_id": triage_result.id},
    )


def notify_prescription_ready(db: Session, prescription: Prescription) -> NotificationResponse:
    return send_notification(
        db,
        prescription.patient_id,
        "Prescription ready",
        "A doctor has prepared your prescription. Open the consultation to review the details.",
        "prescription_ready",
        {"prescription_id": prescription.id, "consultation_id": prescription.consultation_id},
    )


def notify_progress_checkin(db: Session, user_id: int) -> NotificationResponse:
    return send_notification(
        db,
        user_id,
        "Daily health check-in",
        "Take a moment to log how you are feeling today so we can track your progress.",
        "progress_checkin",
        {},
    )
