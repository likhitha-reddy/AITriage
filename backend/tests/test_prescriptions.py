from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.prescription import Prescription
from tests.conftest import TEST_TIMESTAMP


def create_consultation(test_db_session: Session, test_user, test_doctor) -> Consultation:
    consultation = Consultation(
        patient_id=test_user.id,
        doctor_id=test_doctor.id,
        triage_result_id=None,
        status="scheduled",
        scheduled_at=TEST_TIMESTAMP + timedelta(days=1),
        notes="Prescription consult",
    )
    test_db_session.add(consultation)
    test_db_session.commit()
    test_db_session.refresh(consultation)
    return consultation


def test_get_prescription_for_consultation(client, auth_headers, test_db_session: Session, test_user, test_doctor):
    consultation = create_consultation(test_db_session, test_user, test_doctor)
    prescription = Prescription(
        consultation_id=consultation.id,
        doctor_id=test_doctor.id,
        patient_id=test_user.id,
        drugs=[{"name": "Hydrocortisone", "dosage": "Apply twice daily"}],
        notes="Use for seven days",
    )
    test_db_session.add(prescription)
    test_db_session.commit()

    response = client.get(
        f"/api/v1/prescriptions/consultation/{consultation.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["consultation_id"] == consultation.id
    assert body["drugs"][0]["name"] == "Hydrocortisone"


def test_prescription_not_found_returns_404(client, auth_headers, test_db_session: Session, test_user, test_doctor):
    consultation = create_consultation(test_db_session, test_user, test_doctor)

    response = client.get(
        f"/api/v1/prescriptions/consultation/{consultation.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Prescription not found"
