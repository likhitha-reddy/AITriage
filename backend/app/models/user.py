from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    subscription_tier = Column(String(50), nullable=False, default="free")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    consultations = relationship(
        "Consultation",
        back_populates="patient",
        cascade="all, delete-orphan",
        foreign_keys="Consultation.patient_id",
    )
    triage_results = relationship(
        "TriageResult",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    prescriptions = relationship(
        "Prescription",
        back_populates="patient",
        cascade="all, delete-orphan",
        foreign_keys="Prescription.patient_id",
    )
    subscriptions = relationship(
        "Subscription",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Notification.user_id",
    )
    device_tokens = relationship(
        "DeviceToken",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="DeviceToken.user_id",
    )
