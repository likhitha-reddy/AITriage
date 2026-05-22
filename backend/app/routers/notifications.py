from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.notification import (
    BulkReadResponse,
    DeviceTokenCreate,
    DeviceTokenDelete,
    DeviceTokenResponse,
    NotificationList,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services import notifications as notification_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/device", response_model=DeviceTokenResponse, status_code=status.HTTP_201_CREATED)
def register_device_token(
    payload: DeviceTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceTokenResponse:
    try:
        return notification_service.register_device(db, current_user.id, payload.token, payload.platform)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to register device token") from exc


@router.delete("/device", status_code=status.HTTP_200_OK)
def unregister_device_token(
    payload: DeviceTokenDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    try:
        notification_service.unregister_device(db, current_user.id, payload.token)
        return {"message": "Device token unregistered"}
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to unregister device token") from exc


@router.get("", response_model=NotificationList)
def list_notifications(
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationList:
    try:
        items = notification_service.get_notifications(db, current_user.id, unread_only=unread_only)
        unread_count = notification_service.get_unread_count(db, current_user.id)
        return NotificationList(items=items, unread_count=unread_count)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch notifications") from exc


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    try:
        return notification_service.mark_read(db, notification_id, current_user.id)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to mark notification as read") from exc


@router.patch("/read-all", response_model=BulkReadResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BulkReadResponse:
    try:
        updated_count = notification_service.mark_all_read(db, current_user.id)
        return BulkReadResponse(updated_count=updated_count)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to mark notifications as read") from exc


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountResponse:
    try:
        return UnreadCountResponse(unread_count=notification_service.get_unread_count(db, current_user.id))
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch unread count") from exc
