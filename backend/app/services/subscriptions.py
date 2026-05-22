from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User
from app.schemas.subscription import SubscriptionPerksResponse, SubscriptionPlanResponse, SubscriptionResponse
from app.services.exceptions import BadRequestError, NotFoundError

DEFAULT_PLAN_CONFIGS = {
    "free": {
        "code": "free",
        "name": "Free",
        "price_inr": 0,
        "billing_cycle_days": 3650,
        "consultation_discount_percent": 0,
        "free_triage_count": 2,
        "perks": [
            "2 free AI triages every month",
            "Standard doctor discovery",
            "Basic consultation booking",
        ],
    },
    "basic": {
        "code": "basic",
        "name": "Basic",
        "price_inr": 299,
        "billing_cycle_days": 30,
        "consultation_discount_percent": 10,
        "free_triage_count": 8,
        "perks": [
            "8 free AI triages every month",
            "10% discount on consultations",
            "Priority booking support",
        ],
    },
    "premium": {
        "code": "premium",
        "name": "Premium",
        "price_inr": 599,
        "billing_cycle_days": 30,
        "consultation_discount_percent": 20,
        "free_triage_count": 9999,
        "perks": [
            "Unlimited AI triages",
            "20% discount on consultations",
            "Priority consultations and prescription support",
        ],
    },
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_plan_exists(plan_code: str) -> dict:
    normalized_plan = plan_code.strip().lower()
    plan = DEFAULT_PLAN_CONFIGS.get(normalized_plan)
    if not plan:
        raise BadRequestError("Unsupported subscription plan")
    return plan


def _get_plan_definition(db: Session, plan_code: str) -> dict:
    fallback = _ensure_plan_exists(plan_code)
    plan = db.execute(select(SubscriptionPlan).where(SubscriptionPlan.code == fallback["code"])).scalar_one_or_none()
    if plan is None or not plan.is_active:
        return fallback
    return {
        "code": plan.code,
        "name": plan.name,
        "price_inr": plan.price_inr,
        "billing_cycle_days": plan.billing_cycle_days,
        "consultation_discount_percent": plan.consultation_discount_percent,
        "free_triage_count": plan.free_triage_count,
        "perks": list(plan.perks or []),
    }


def _build_plan_response(plan_definition: dict) -> SubscriptionPlanResponse:
    return SubscriptionPlanResponse(**plan_definition)


def _build_subscription_response(db: Session, subscription: Subscription) -> SubscriptionResponse:
    plan_definition = _get_plan_definition(db, subscription.plan)
    return SubscriptionResponse(
        id=subscription.id,
        user_id=subscription.user_id,
        plan=subscription.plan,
        status=subscription.status,
        started_at=subscription.started_at,
        expires_at=subscription.expires_at,
        plan_details=_build_plan_response(plan_definition),
    )


def get_latest_subscription(db: Session, user_id: int) -> Subscription | None:
    return db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.started_at.desc(), Subscription.id.desc())
    ).scalars().first()


def get_active_subscription_record(db: Session, user_id: int) -> Subscription | None:
    now = _utc_now()
    return db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.expires_at > now,
        )
        .order_by(Subscription.started_at.desc(), Subscription.id.desc())
    ).scalars().first()


def create_subscription_for_user(
    db: Session,
    user: User,
    plan_code: str,
    started_at: datetime | None = None,
    expires_at: datetime | None = None,
) -> SubscriptionResponse:
    plan_definition = _get_plan_definition(db, plan_code)
    subscription_start = started_at or _utc_now()
    if subscription_start.tzinfo is None:
        subscription_start = subscription_start.replace(tzinfo=timezone.utc)
    subscription_end = expires_at or (subscription_start + timedelta(days=plan_definition["billing_cycle_days"]))
    if subscription_end.tzinfo is None:
        subscription_end = subscription_end.replace(tzinfo=timezone.utc)
    if subscription_end <= subscription_start:
        raise BadRequestError("Subscription expiry must be after the start time")

    active_subscription = get_active_subscription_record(db, user.id)
    if active_subscription is None:
        subscription = Subscription(
            user_id=user.id,
            plan=plan_definition["code"],
            status="active",
            started_at=subscription_start,
            expires_at=subscription_end,
        )
        db.add(subscription)
    else:
        active_subscription.plan = plan_definition["code"]
        active_subscription.status = "active"
        active_subscription.started_at = subscription_start
        active_subscription.expires_at = subscription_end
        subscription = active_subscription

    user.subscription_tier = plan_definition["code"]
    db.add(user)
    db.commit()
    db.refresh(subscription)
    db.refresh(user)
    return _build_subscription_response(db, subscription)


def ensure_subscription_for_user(db: Session, user: User) -> SubscriptionResponse:
    active_subscription = get_active_subscription_record(db, user.id)
    if active_subscription is not None:
        if user.subscription_tier != active_subscription.plan:
            user.subscription_tier = active_subscription.plan
            db.add(user)
            db.commit()
            db.refresh(user)
        return _build_subscription_response(db, active_subscription)

    if user.subscription_tier not in DEFAULT_PLAN_CONFIGS:
        user.subscription_tier = "free"
        db.add(user)
        db.commit()
        db.refresh(user)

    return create_subscription_for_user(db, user, user.subscription_tier or "free")


def get_active_subscription(db: Session, user: User) -> SubscriptionResponse:
    active_subscription = get_active_subscription_record(db, user.id)
    if active_subscription is None:
        raise NotFoundError("Active subscription not found")
    return _build_subscription_response(db, active_subscription)


def cancel_subscription(db: Session, user: User) -> SubscriptionResponse:
    active_subscription = get_active_subscription_record(db, user.id)
    if active_subscription is None:
        raise NotFoundError("Active subscription not found")

    active_subscription.status = "cancelled"
    active_subscription.expires_at = _utc_now()
    user.subscription_tier = "free"
    db.add(user)
    db.commit()
    db.refresh(active_subscription)
    db.refresh(user)
    return _build_subscription_response(db, active_subscription)


def get_subscription_perks(db: Session, user: User) -> SubscriptionPerksResponse:
    active_subscription = get_active_subscription_record(db, user.id)
    expires_at = None
    current_plan = user.subscription_tier or "free"
    if active_subscription is not None:
        current_plan = active_subscription.plan
        expires_at = active_subscription.expires_at

    plan_definition = _get_plan_definition(db, current_plan)
    return SubscriptionPerksResponse(
        has_active_subscription=active_subscription is not None,
        current_plan=plan_definition["code"],
        consultation_discount_percent=plan_definition["consultation_discount_percent"],
        free_triage_count=plan_definition["free_triage_count"],
        perks=list(plan_definition["perks"]),
        expires_at=expires_at,
    )
