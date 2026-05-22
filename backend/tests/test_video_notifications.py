from __future__ import annotations

from datetime import timedelta
from unittest.mock import Mock, patch

from sqlalchemy.orm import Session

from app.models.consultation import Consultation
from app.models.notification import DeviceToken, Notification
from app.models.video_session import VideoSession
from app.services import notifications as notification_service
from tests.conftest import TEST_TIMESTAMP


def create_consultation(test_db_session: Session, test_user, test_doctor) -> Consultation:
    consultation = Consultation(
        patient_id=test_user.id,
        doctor_id=test_doctor.id,
        triage_result_id=None,
        status="scheduled",
        scheduled_at=TEST_TIMESTAMP + timedelta(days=1),
        notes="Video-ready appointment",
    )
    test_db_session.add(consultation)
    test_db_session.commit()
    test_db_session.refresh(consultation)
    return consultation


def build_ai_payload() -> dict:
    return {
        "possible_diagnoses": [{"name": "Dermatitis", "probability": 0.81}],
        "confidence_scores": {"Dermatitis": 0.81},
        "recommended_action": "CONSULT_DOCTOR",
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


def test_booking_consultation_auto_creates_video_session_and_notification(
    client,
    auth_headers,
    test_db_session: Session,
    test_user,
    test_doctor,
):
    response = client.post(
        "/api/v1/consultations/",
        headers=auth_headers,
        json={
            "doctor_id": test_doctor.id,
            "scheduled_at": (TEST_TIMESTAMP + timedelta(days=1)).isoformat(),
            "notes": "Need a video consult",
        },
    )

    assert response.status_code == 201
    consultation_id = response.json()["id"]

    video_session = test_db_session.query(VideoSession).filter(VideoSession.consultation_id == consultation_id).one()
    notification = test_db_session.query(Notification).filter(Notification.user_id == test_user.id).one()

    assert video_session.provider == "agora"
    assert video_session.status == "waiting"
    assert notification.type == "general"
    assert notification.data["consultation_id"] == consultation_id
    assert notification.data["video_room_id"] == video_session.room_id


def test_video_session_routes_support_create_join_get_and_end(
    client,
    auth_headers,
    test_db_session: Session,
    test_user,
    test_doctor,
):
    consultation = create_consultation(test_db_session, test_user, test_doctor)

    create_response = client.post(
        "/api/v1/video/sessions",
        headers=auth_headers,
        json={"consultation_id": consultation.id},
    )

    assert create_response.status_code == 201
    room_id = create_response.json()["room_id"]

    join_response = client.post(f"/api/v1/video/sessions/{room_id}/join", headers=auth_headers)
    assert join_response.status_code == 200
    assert join_response.json()["status"] == "active"
    assert join_response.json()["token"].startswith("mock-video-token")

    get_response = client.get(f"/api/v1/video/sessions/{consultation.id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["room_id"] == room_id

    end_response = client.post(f"/api/v1/video/sessions/{room_id}/end", headers=auth_headers)
    assert end_response.status_code == 200
    assert end_response.json()["status"] == "ended"
    assert end_response.json()["duration_minutes"] >= 0


def test_triage_submission_creates_notification(client, auth_headers, test_db_session: Session, test_user):
    with patch("app.services.triage.httpx.Client", return_value=mock_ai_service(build_ai_payload())):
        response = client.post(
            "/api/v1/triage/",
            headers=auth_headers,
            json={"symptoms_text": "Itchy skin rash", "image_urls": []},
        )

    assert response.status_code == 201
    triage_id = response.json()["id"]
    notifications = test_db_session.query(Notification).filter(Notification.user_id == test_user.id).all()

    assert len(notifications) == 1
    assert notifications[0].type == "triage_result"
    assert notifications[0].data["triage_result_id"] == triage_id


def test_notifications_routes_support_device_registration_listing_and_read_updates(
    client,
    auth_headers,
    test_db_session: Session,
    test_user,
):
    register_response = client.post(
        "/api/v1/notifications/device",
        headers=auth_headers,
        json={"token": "android-device-token-12345", "platform": "android"},
    )
    assert register_response.status_code == 201
    assert register_response.json()["is_active"] is True

    notification_service.send_notification(
        test_db_session,
        test_user.id,
        "First",
        "First body",
        "general",
        {"kind": 1},
    )
    notification_service.send_notification(
        test_db_session,
        test_user.id,
        "Second",
        "Second body",
        "general",
        {"kind": 2},
    )

    list_response = client.get("/api/v1/notifications", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()["items"]) == 2
    assert list_response.json()["unread_count"] == 2

    first_notification_id = list_response.json()["items"][0]["id"]
    read_response = client.patch(f"/api/v1/notifications/{first_notification_id}/read", headers=auth_headers)
    assert read_response.status_code == 200
    assert read_response.json()["is_read"] is True

    unread_response = client.get("/api/v1/notifications?unread_only=true", headers=auth_headers)
    assert unread_response.status_code == 200
    assert len(unread_response.json()["items"]) == 1
    assert unread_response.json()["unread_count"] == 1

    unread_count_response = client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert unread_count_response.status_code == 200
    assert unread_count_response.json()["unread_count"] == 1

    read_all_response = client.patch("/api/v1/notifications/read-all", headers=auth_headers)
    assert read_all_response.status_code == 200
    assert read_all_response.json()["updated_count"] == 1

    unregister_response = client.request(
        "DELETE",
        "/api/v1/notifications/device",
        headers=auth_headers,
        json={"token": "android-device-token-12345"},
    )
    assert unregister_response.status_code == 200

    stored_device = test_db_session.query(DeviceToken).filter(DeviceToken.user_id == test_user.id).one()
    assert stored_device.is_active is False
