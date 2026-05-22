from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    started_at = payload.started_at or datetime.now(timezone.utc)
    expires_at = payload.expires_at or (started_at + timedelta(days=30))

    subscription = db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.started_at.desc())
    ).scalars().first()

    if subscription is None:
        subscription = Subscription(
            user_id=current_user.id,
            plan=payload.plan,
            status="active",
            started_at=started_at,
            expires_at=expires_at,
        )
        db.add(subscription)
    else:
        subscription.plan = payload.plan
        subscription.status = "active"
        subscription.started_at = started_at
        subscription.expires_at = expires_at

    current_user.subscription_tier = payload.plan
    db.add(current_user)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/status", response_model=SubscriptionResponse)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    subscription = db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.started_at.desc())
    ).scalars().first()
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return subscription


@router.post("/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    subscription = db.execute(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.started_at.desc())
    ).scalars().first()
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    subscription.status = "cancelled"
    subscription.expires_at = datetime.now(timezone.utc)
    current_user.subscription_tier = "free"
    db.add(current_user)
    db.commit()
    db.refresh(subscription)
    return subscription
