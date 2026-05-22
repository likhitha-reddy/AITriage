from sqlalchemy import Boolean, Column, Integer, JSON, String

from app.database import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    price_inr = Column(Integer, nullable=False, default=0)
    billing_cycle_days = Column(Integer, nullable=False, default=30)
    consultation_discount_percent = Column(Integer, nullable=False, default=0)
    free_triage_count = Column(Integer, nullable=False, default=0)
    perks = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
