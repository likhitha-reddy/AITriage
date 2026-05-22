from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    triage_result_id = Column(Integer, ForeignKey("triage_results.id"), nullable=True, index=True)
    status = Column(String(50), nullable=False, default="scheduled")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    notes = Column(Text, nullable=True)
    prescription_id = Column(Integer, nullable=True, unique=True)

    patient = relationship("User", back_populates="consultations", foreign_keys=[patient_id])
    doctor = relationship("Doctor", back_populates="consultations", foreign_keys=[doctor_id])
    triage_result = relationship("TriageResult", back_populates="consultations", foreign_keys=[triage_result_id])
