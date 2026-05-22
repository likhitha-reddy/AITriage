from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Doctor, SubscriptionPlan

SEED_TIMESTAMP = "2026-05-22T13:39:17Z"

DOCTOR_FIXTURES = [
    {
        "name": "Dr. Ananya Reddy",
        "specialization": "Dermatology",
        "qualification": "MBBS, MD Dermatology",
        "experience_years": 11,
        "consultation_fee": Decimal("350.00"),
        "is_available": True,
        "rating": 4.8,
    },
    {
        "name": "Dr. Priya Nair",
        "specialization": "Dermatology",
        "qualification": "MBBS, MD Dermatology",
        "experience_years": 8,
        "consultation_fee": Decimal("280.00"),
        "is_available": True,
        "rating": 4.6,
    },
    {
        "name": "Dr. Karthik Iyer",
        "specialization": "Dermatology",
        "qualification": "MBBS, MD Dermatology",
        "experience_years": 14,
        "consultation_fee": Decimal("420.00"),
        "is_available": True,
        "rating": 4.9,
    },
    {
        "name": "Dr. Meera Sharma",
        "specialization": "Psychiatry",
        "qualification": "MBBS, MD Psychiatry",
        "experience_years": 10,
        "consultation_fee": Decimal("500.00"),
        "is_available": True,
        "rating": 4.9,
    },
    {
        "name": "Dr. Arjun Malhotra",
        "specialization": "Psychiatry",
        "qualification": "MBBS, MD Psychiatry",
        "experience_years": 7,
        "consultation_fee": Decimal("420.00"),
        "is_available": True,
        "rating": 4.7,
    },
    {
        "name": "Dr. Nisha Kapoor",
        "specialization": "Psychiatry",
        "qualification": "MBBS, MD Psychiatry",
        "experience_years": 12,
        "consultation_fee": Decimal("460.00"),
        "is_available": True,
        "rating": 4.8,
    },
    {
        "name": "Dr. Rohit Verma",
        "specialization": "General Practice",
        "qualification": "MBBS, MD General Medicine",
        "experience_years": 9,
        "consultation_fee": Decimal("180.00"),
        "is_available": True,
        "rating": 4.5,
    },
    {
        "name": "Dr. Sneha Kulkarni",
        "specialization": "General Practice",
        "qualification": "MBBS, MD General Medicine",
        "experience_years": 6,
        "consultation_fee": Decimal("150.00"),
        "is_available": True,
        "rating": 4.4,
    },
    {
        "name": "Dr. Vikram Deshpande",
        "specialization": "ENT",
        "qualification": "MBBS, MS ENT",
        "experience_years": 13,
        "consultation_fee": Decimal("320.00"),
        "is_available": True,
        "rating": 4.7,
    },
    {
        "name": "Dr. Pooja Bhat",
        "specialization": "ENT",
        "qualification": "MBBS, MS ENT",
        "experience_years": 8,
        "consultation_fee": Decimal("260.00"),
        "is_available": True,
        "rating": 4.6,
    },
]

PLAN_FIXTURES = [
    {
        "code": "free",
        "name": "Free",
        "price_inr": 0,
        "billing_cycle_days": 3650,
        "consultation_discount_percent": 0,
        "free_triage_count": 2,
        "perks": [
            "2 free AI triages every month",
            "Standard doctor discovery",
            "Basic consultation booking",
        ],
    },
    {
        "code": "basic",
        "name": "Basic",
        "price_inr": 299,
        "billing_cycle_days": 30,
        "consultation_discount_percent": 10,
        "free_triage_count": 8,
        "perks": [
            "8 free AI triages every month",
            "10% discount on consultations",
            "Priority booking support",
        ],
    },
    {
        "code": "premium",
        "name": "Premium",
        "price_inr": 599,
        "billing_cycle_days": 30,
        "consultation_discount_percent": 20,
        "free_triage_count": 9999,
        "perks": [
            "Unlimited AI triages",
            "20% discount on consultations",
            "Priority consultations and prescription support",
        ],
    },
]


def seed_doctors() -> int:
    with SessionLocal() as db:
        inserted = 0
        for payload in DOCTOR_FIXTURES:
            existing = db.execute(select(Doctor).where(Doctor.name == payload["name"])).scalar_one_or_none()
            if existing:
                for field, value in payload.items():
                    setattr(existing, field, value)
            else:
                db.add(Doctor(**payload))
                inserted += 1
        db.commit()
        return inserted


def seed_plans() -> int:
    with SessionLocal() as db:
        inserted = 0
        for payload in PLAN_FIXTURES:
            existing = db.execute(select(SubscriptionPlan).where(SubscriptionPlan.code == payload["code"])).scalar_one_or_none()
            if existing:
                for field, value in payload.items():
                    setattr(existing, field, value)
                existing.is_active = True
            else:
                db.add(SubscriptionPlan(**payload, is_active=True))
                inserted += 1
        db.commit()
        return inserted


def main() -> None:
    Base.metadata.create_all(bind=engine)
    doctors_created = seed_doctors()
    plans_created = seed_plans()
    print(f"[{SEED_TIMESTAMP}] Seed complete: doctors_added={doctors_created}, plans_added={plans_created}")


if __name__ == "__main__":
    main()
