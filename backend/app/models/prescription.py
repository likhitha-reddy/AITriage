from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    drugs = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    consultation = relationship("Consultation", foreign_keys=[consultation_id])
    doctor = relationship("Doctor", back_populates="prescriptions", foreign_keys=[doctor_id])
    patient = relationship("User", back_populates="prescriptions", foreign_keys=[patient_id])
