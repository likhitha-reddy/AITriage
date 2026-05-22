from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class TriageResult(Base):
    __tablename__ = "triage_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symptoms_text = Column(Text, nullable=False)
    image_urls = Column(JSON, nullable=False, default=list)
    ai_analysis = Column(JSON, nullable=False, default=dict)
    possible_diagnoses = Column(JSON, nullable=False, default=list)
    confidence_score = Column(Float, nullable=False, default=0.0)
    recommended_action = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    patient = relationship("User", back_populates="triage_results")
    consultations = relationship("Consultation", back_populates="triage_result")
