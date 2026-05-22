from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app, settings as app_settings
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.prescription import Prescription
from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.models.triage import TriageResult
from app.models.user import User
from app.utils.jwt import create_access_token
from app.utils.security import get_password_hash

TEST_TIMESTAMP = datetime(2026, 5, 22, 13, 39, 17, tzinfo=timezone.utc)

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE, future=True)


@pytest.fixture()
def test_db_session() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(test_db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield test_db_session

    original_create_tables = app_settings.create_tables_on_startup
    app_settings.create_tables_on_startup = False
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        app_settings.create_tables_on_startup = original_create_tables


@pytest.fixture()
def test_user(test_db_session: Session) -> User:
    user = User(
        email="patient@example.com",
        hashed_password=get_password_hash("StrongPass123"),
        name="Test Patient",
        phone="5551234567",
        subscription_tier="free",
    )
    test_db_session.add(user)
    test_db_session.commit()
    test_db_session.refresh(user)
    return user


@pytest.fixture()
def test_doctor(test_db_session: Session) -> Doctor:
    doctor = Doctor(
        name="Dr. Maya Patel",
        specialization="Dermatology",
        qualification="MD",
        experience_years=8,
        consultation_fee=Decimal("750.00"),
        is_available=True,
        rating=4.8,
    )
    test_db_session.add(doctor)
    test_db_session.commit()
    test_db_session.refresh(doctor)
    return doctor


@pytest.fixture()
def auth_headers(test_user: User) -> dict[str, str]:
    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}
