from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User
from app.utils.jwt import validate_token_type


TEST_TIMESTAMP = datetime(2026, 5, 22, 13, 39, 17, tzinfo=timezone.utc)


def registration_payload(**overrides):
    payload = {
        "email": "new.patient@example.com",
        "password": "StrongPass123",
        "name": "New Patient",
        "phone": "5550001111",
        "subscription_tier": "free",
    }
    payload.update(overrides)
    return payload


def test_register_success(client, test_db_session: Session):
    response = client.post("/api/v1/auth/register", json=registration_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "new.patient@example.com"

    created_user = test_db_session.execute(
        select(User).where(User.email == "new.patient@example.com")
    ).scalar_one()
    assert created_user.name == "New Patient"


def test_register_duplicate_email(client, test_user):
    response = client.post(
        "/api/v1/auth/register",
        json=registration_payload(email=test_user.email),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered"


def test_register_invalid_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json=registration_payload(email="invalid-email"),
    )

    assert response.status_code == 422


def test_register_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json=registration_payload(password="weak12"),
    )

    assert response.status_code == 422


def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPass123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == test_user.id
    assert body["access_token"]
    assert body["refresh_token"]


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "WrongPass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "StrongPass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_jwt_token_validation(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPass123"},
    )

    payload = validate_token_type(response.json()["access_token"], "access")
    assert payload["sub"] == str(test_user.id)
    assert payload["type"] == "access"


def test_jwt_token_expiry_rejected(client, test_user):
    settings = get_settings()
    expired_token = jwt.encode(
        {
            "sub": str(test_user.id),
            "type": "access",
            "iat": datetime(1970, 1, 1, tzinfo=timezone.utc),
            "exp": datetime(1970, 1, 1, 0, 1, tzinfo=timezone.utc),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(ValueError):
        validate_token_type(expired_token, "access")

    response = client.get(
        "/api/v1/patients/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/v1/patients/me")

    assert response.status_code == 401
