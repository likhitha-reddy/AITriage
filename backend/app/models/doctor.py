from sqlalchemy import Boolean, Column, Float, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=False, index=True)
    qualification = Column(String(255), nullable=False)
    experience_years = Column(Integer, nullable=False, default=0)
    consultation_fee = Column(Numeric(10, 2), nullable=False, default=0)
    is_available = Column(Boolean, nullable=False, default=True)
    rating = Column(Float, nullable=False, default=0.0)

    consultations = relationship(
        "Consultation",
        back_populates="doctor",
        cascade="all, delete-orphan",
        foreign_keys="Consultation.doctor_id",
    )
    prescriptions = relationship(
        "Prescription",
        back_populates="doctor",
        cascade="all, delete-orphan",
        foreign_keys="Prescription.doctor_id",
    )
