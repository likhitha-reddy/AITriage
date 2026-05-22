from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def _build_payload(
    subject: str,
    expires_delta: timedelta,
    token_type: str,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)
    return payload


def create_access_token(subject: str, extra: Optional[Dict[str, Any]] = None) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    payload = _build_payload(subject=subject, expires_delta=expires_delta, token_type="access", extra=extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, extra: Optional[Dict[str, Any]] = None) -> str:
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    payload = _build_payload(subject=subject, expires_delta=expires_delta, token_type="refresh", extra=extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def validate_token_type(token: str, expected_type: str) -> Dict[str, Any]:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    token_type = payload.get("type")
    subject = payload.get("sub")
    if token_type != expected_type or not subject:
        raise ValueError("Invalid token")
    return payload
