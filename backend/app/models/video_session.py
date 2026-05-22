from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class VideoSession(Base):
    __tablename__ = "video_sessions"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    room_id = Column(String(128), nullable=False, unique=True, index=True)
    provider = Column(String(50), nullable=False, default="agora")
    status = Column(String(50), nullable=False, default="waiting")
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    consultation = relationship("Consultation", back_populates="video_session", foreign_keys=[consultation_id])
