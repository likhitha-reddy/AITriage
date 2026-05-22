from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.triage import TriageResult
from tests.conftest import TEST_TIMESTAMP


def create_triage_result(test_db_session: Session, test_user) -> TriageResult:
    triage_result = TriageResult(
        patient_id=test_user.id,
        symptoms_text="Persistent itchy rash",
        image_urls=[],
        ai_analysis={"status": "placeholder"},
        possible_diagnoses=["Dermatitis"],
        confidence_score=0.45,
        recommended_action="Schedule a dermatology consultation",
    )
    test_db_session.add(triage_result)
    test_db_session.commit()
    test_db_session.refresh(triage_result)
    return triage_result


def test_book_consultation_with_valid_doctor_and_triage_result(
    client,
    auth_headers,
    test_db_session: Session,
    test_user,
    test_doctor,
):
    triage_result = create_triage_result(test_db_session, test_user)

    response = client.post(
        "/api/v1/consultations/",
        headers=auth_headers,
        json={
            "doctor_id": test_doctor.id,
            "triage_result_id": triage_result.id,
            "scheduled_at": (TEST_TIMESTAMP + timedelta(days=1)).isoformat(),
            "notes": "Need quick review",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["doctor_id"] == test_doctor.id
    assert body["triage_result_id"] == triage_result.id
    assert body["status"] == "scheduled"


def test_book_consultation_with_invalid_doctor_returns_404(client, auth_headers):
    response = client.post(
        "/api/v1/consultations/",
        headers=auth_headers,
        json={
            "doctor_id": 9999,
            "scheduled_at": (TEST_TIMESTAMP + timedelta(days=1)).isoformat(),
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Doctor not found"


def test_list_patient_consultations(client, auth_headers, test_db_session: Session, test_user, test_doctor):
    older = Consultation(
        patient_id=test_user.id,
        doctor_id=test_doctor.id,
        triage_result_id=None,
        status="scheduled",
        scheduled_at=TEST_TIMESTAMP + timedelta(days=1),
        notes="Older appointment",
    )
    newer = Consultation(
        patient_id=test_user.id,
        doctor_id=test_doctor.id,
        triage_result_id=None,
        status="scheduled",
        scheduled_at=TEST_TIMESTAMP + timedelta(days=2),
        notes="Newer appointment",
    )
    test_db_session.add_all([older, newer])
    test_db_session.commit()

    response = client.get("/api/v1/consultations/", headers=auth_headers)

    assert response.status_code == 200
    consultations = response.json()
    assert len(consultations) == 2
    assert [item["notes"] for item in consultations] == ["Newer appointment", "Older appointment"]


def test_cancel_consultation(client, auth_headers, test_db_session: Session, test_user, test_doctor):
    consultation = Consultation(
        patient_id=test_user.id,
        doctor_id=test_doctor.id,
        triage_result_id=None,
        status="scheduled",
        scheduled_at=TEST_TIMESTAMP + timedelta(days=1),
        notes="Cancelable appointment",
    )
    test_db_session.add(consultation)
    test_db_session.commit()
    test_db_session.refresh(consultation)

    response = client.post(
        f"/api/v1/consultations/{consultation.id}/cancel",
        headers=auth_headers,
        json={"reason": "Patient requested cancellation"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert response.json()["cancel_reason"] == "Patient requested cancellation"
    updated = test_db_session.get(Consultation, consultation.id)
    assert updated.status == "cancelled"


def test_cannot_book_when_doctor_is_unavailable(client, auth_headers, test_db_session: Session, test_doctor):
    test_doctor.is_available = False
    test_db_session.add(test_doctor)
    test_db_session.commit()

    response = client.post(
        "/api/v1/consultations/",
        headers=auth_headers,
        json={
            "doctor_id": test_doctor.id,
            "scheduled_at": (TEST_TIMESTAMP + timedelta(days=1)).isoformat(),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Doctor is not currently available"
