from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.doctor import Doctor


def test_list_doctors_returns_seeded_data(client, test_db_session: Session, test_doctor: Doctor):
    extra_doctor = Doctor(
        name="Dr. Nina Rao",
        specialization="Psychiatry",
        qualification="MD",
        experience_years=10,
        consultation_fee=Decimal("900.00"),
        is_available=True,
        rating=4.6,
    )
    test_db_session.add(extra_doctor)
    test_db_session.commit()

    response = client.get("/api/v1/doctors/")

    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) == 2
    assert [doctor["name"] for doctor in doctors] == ["Dr. Maya Patel", "Dr. Nina Rao"]


def test_filter_doctors_by_specialization(client, test_db_session: Session, test_doctor: Doctor):
    psychiatrist = Doctor(
        name="Dr. Omar Ali",
        specialization="Psychiatry",
        qualification="MD",
        experience_years=12,
        consultation_fee=Decimal("950.00"),
        is_available=True,
        rating=4.9,
    )
    test_db_session.add(psychiatrist)
    test_db_session.commit()

    response = client.get("/api/v1/doctors/", params={"specialization": "derma"})

    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) == 1
    assert doctors[0]["id"] == test_doctor.id


def test_filter_doctors_by_availability(client, test_db_session: Session, test_doctor: Doctor):
    unavailable_doctor = Doctor(
        name="Dr. Lila Sen",
        specialization="Dermatology",
        qualification="MBBS, MD",
        experience_years=6,
        consultation_fee=Decimal("700.00"),
        is_available=False,
        rating=4.3,
    )
    test_db_session.add(unavailable_doctor)
    test_db_session.commit()

    response = client.get("/api/v1/doctors/", params={"available_only": True})

    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) == 1
    assert doctors[0]["id"] == test_doctor.id
    assert doctors[0]["is_available"] is True


def test_get_doctor_detail(client, test_doctor: Doctor):
    response = client.get(f"/api/v1/doctors/{test_doctor.id}")

    assert response.status_code == 200
    doctor = response.json()
    assert doctor["name"] == "Dr. Maya Patel"
    assert doctor["specialization"] == "Dermatology"
    assert doctor["rating"] == 4.8
