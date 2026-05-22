from __future__ import annotations

from unittest.mock import Mock, patch

from sqlalchemy.orm import Session

from app.models.triage import TriageResult


def build_ai_payload(*, diagnosis_name: str = "Contact dermatitis", recommended_action: str = "CONSULT_DOCTOR") -> dict:
    return {
        "possible_diagnoses": [
            {
                "name": diagnosis_name,
                "icd_code_hint": None,
                "probability": 0.78,
                "description": "Possible condition requiring clinician review.",
                "urgency": "routine",
            }
        ],
        "confidence_scores": {diagnosis_name: 0.78},
        "severity_level": "moderate",
        "recommended_action": recommended_action,
        "follow_up_questions": ["How long have the symptoms been present?"],
        "referral_specialization": "dermatology",
        "disclaimers": ["AI-generated triage support only."],
    }


def mock_ai_service(ai_payload: dict):
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = ai_payload
    client_context = Mock()
    client_context.__enter__ = Mock(return_value=client_context)
    client_context.__exit__ = Mock(return_value=False)
    client_context.post = Mock(return_value=response)
    return client_context


def test_submit_triage_with_text_only(client, auth_headers):
    ai_payload = build_ai_payload()
    with patch("app.services.triage.httpx.Client", return_value=mock_ai_service(ai_payload)):
        response = client.post(
            "/api/v1/triage/",
            headers=auth_headers,
            json={"symptoms_text": "Itchy rash on both hands", "image_urls": []},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["possible_diagnoses"] == ["Contact dermatitis"]
    assert body["ai_analysis"]["recommended_action"] == "CONSULT_DOCTOR"


def test_submit_triage_with_text_and_images(client, auth_headers):
    image_urls = [
        "https://example.com/rash-front.jpg",
        "https://example.com/rash-side.jpg",
    ]
    ai_payload = build_ai_payload(diagnosis_name="Inflamed skin rash")
    mocked_client = mock_ai_service(ai_payload)
    with patch("app.services.triage.httpx.Client", return_value=mocked_client):
        response = client.post(
            "/api/v1/triage/",
            headers=auth_headers,
            json={"symptoms_text": "Red skin rash with itching", "image_urls": image_urls},
        )

    assert response.status_code == 201
    assert response.json()["possible_diagnoses"] == ["Inflamed skin rash"]
    request_payload = mocked_client.post.call_args.kwargs["json"]
    assert request_payload["image_urls"] == image_urls


def test_triage_result_storage(client, auth_headers, test_db_session: Session, test_user):
    ai_payload = build_ai_payload(diagnosis_name="Anxiety symptoms", recommended_action="CONSULT_DOCTOR")
    with patch("app.services.triage.httpx.Client", return_value=mock_ai_service(ai_payload)):
        response = client.post(
            "/api/v1/triage/",
            headers=auth_headers,
            json={"symptoms_text": "I feel anxious and stressed", "image_urls": []},
        )

    triage_id = response.json()["id"]
    stored_result = test_db_session.get(TriageResult, triage_id)
    assert stored_result is not None
    assert stored_result.patient_id == test_user.id
    assert stored_result.recommended_action == "CONSULT_DOCTOR"
    assert stored_result.possible_diagnoses == ["Anxiety symptoms"]


def test_get_triage_result(client, auth_headers):
    ai_payload = build_ai_payload(diagnosis_name="Acne flare")
    with patch("app.services.triage.httpx.Client", return_value=mock_ai_service(ai_payload)):
        created = client.post(
            "/api/v1/triage/",
            headers=auth_headers,
            json={"symptoms_text": "Acne flare on face", "image_urls": []},
        ).json()

    response = client.get(f"/api/v1/triage/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["possible_diagnoses"] == created["possible_diagnoses"]


def test_triage_requires_authentication(client):
    response = client.post(
        "/api/v1/triage/",
        json={"symptoms_text": "Itchy rash on both hands", "image_urls": []},
    )

    assert response.status_code == 401
