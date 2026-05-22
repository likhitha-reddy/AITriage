from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers._helpers import internal_server_error, raise_for_service_error
from app.schemas.subscription import SubscriptionCreate, SubscriptionPerksResponse, SubscriptionResponse
from app.services import subscriptions as subscription_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    try:
        return subscription_service.create_subscription_for_user(
            db,
            current_user,
            payload.plan,
            started_at=payload.started_at,
            expires_at=payload.expires_at,
        )
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to create subscription") from exc


@router.get("/active", response_model=SubscriptionResponse)
@router.get("/status", response_model=SubscriptionResponse)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    try:
        return subscription_service.get_active_subscription(db, current_user)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch subscription") from exc


@router.get("/perks", response_model=SubscriptionPerksResponse)
def get_current_subscription_perks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionPerksResponse:
    try:
        return subscription_service.get_subscription_perks(db, current_user)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to fetch subscription perks") from exc


@router.post("/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    try:
        return subscription_service.cancel_subscription(db, current_user)
    except ServiceError as exc:
        raise_for_service_error(exc)
    except Exception as exc:
        raise internal_server_error("Unable to cancel subscription") from exc
