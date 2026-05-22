from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin
from app.schemas.user import UserCreate, UserResponse
from app.services.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.services.subscriptions import ensure_subscription_for_user
from app.utils.jwt import create_access_token, create_refresh_token, validate_token_type
from app.utils.security import get_password_hash, verify_password


def _build_token_response(user: User) -> TokenResponse:
    token_extra = {"email": user.email}
    return TokenResponse(
        access_token=create_access_token(str(user.id), extra=token_extra),
        refresh_token=create_refresh_token(str(user.id), extra=token_extra),
        user=UserResponse.model_validate(user),
    )


def register_user(db: Session, payload: UserCreate) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    existing_user = db.execute(select(User).where(func.lower(User.email) == normalized_email)).scalar_one_or_none()
    if existing_user is not None:
        raise ConflictError("Email is already registered")

    user = User(
        email=normalized_email,
        hashed_password=get_password_hash(payload.password),
        name=payload.name,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        subscription_tier=(payload.subscription_tier or "free").lower(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_subscription_for_user(db, user)
    return _build_token_response(user)


def login_user(db: Session, payload: UserLogin) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    user = db.execute(select(User).where(func.lower(User.email) == normalized_email)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    return _build_token_response(user)


def refresh_user_session(db: Session, refresh_token: str) -> TokenResponse:
    try:
        token_payload = validate_token_type(refresh_token, "refresh")
        user_id = int(token_payload["sub"])
    except (ValueError, TypeError, KeyError) as exc:
        raise UnauthorizedError("Invalid refresh token") from exc

    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")
    return _build_token_response(user)


def get_user_from_access_token(db: Session, token: str) -> User:
    try:
        token_payload = validate_token_type(token, "access")
        user_id = int(token_payload["sub"])
    except (ValueError, TypeError, KeyError) as exc:
        raise UnauthorizedError("Could not validate credentials") from exc

    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedError("Could not validate credentials")
    return user
