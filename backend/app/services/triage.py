from __future__ import annotations

from datetime import date

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.triage import TriageResult
from app.models.user import User
from app.schemas.triage import TriageResultCreate, TriageResultResponse
from app.services.exceptions import ExternalServiceError, NotFoundError

settings = get_settings()


def _calculate_age(date_of_birth: date | None) -> int | None:
    if date_of_birth is None:
        return None
    today = date.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))


def _build_ai_payload(user: User, payload: TriageResultCreate) -> dict:
    return {
        "symptoms_text": payload.symptoms_text,
        "image_urls": payload.image_urls,
        "patient_age": _calculate_age(user.date_of_birth),
        "patient_gender": None,
        "medical_history": [],
    }


def _extract_possible_diagnoses(response_payload: dict) -> list[str]:
    diagnoses = response_payload.get("possible_diagnoses") or []
    results: list[str] = []
    for item in diagnoses:
        if isinstance(item, dict) and item.get("name"):
            results.append(str(item["name"]))
        elif isinstance(item, str):
            results.append(item)
    return results


def _extract_confidence_score(response_payload: dict) -> float:
    confidence_scores = response_payload.get("confidence_scores") or {}
    if isinstance(confidence_scores, dict) and confidence_scores:
        return max(float(score) for score in confidence_scores.values())

    diagnoses = response_payload.get("possible_diagnoses") or []
    probabilities = [float(item.get("probability", 0.0)) for item in diagnoses if isinstance(item, dict)]
    return max(probabilities) if probabilities else 0.0


def submit_triage(db: Session, current_user: User, payload: TriageResultCreate) -> TriageResultResponse:
    request_payload = _build_ai_payload(current_user, payload)
    endpoint = f"{settings.ai_service_url.rstrip('/')}/triage"

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(endpoint, json=request_payload)
            response.raise_for_status()
            ai_payload = response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text or "AI triage service returned an error"
        raise ExternalServiceError(f"AI triage request failed: {detail}") from exc
    except httpx.RequestError as exc:
        raise ExternalServiceError("AI triage service is unavailable") from exc
    except ValueError as exc:
        raise ExternalServiceError("AI triage service returned an invalid response") from exc

    triage_result = TriageResult(
        patient_id=current_user.id,
        symptoms_text=payload.symptoms_text,
        image_urls=payload.image_urls,
        ai_analysis=ai_payload,
        possible_diagnoses=_extract_possible_diagnoses(ai_payload),
        confidence_score=_extract_confidence_score(ai_payload),
        recommended_action=str(ai_payload.get("recommended_action", "CONSULT_DOCTOR")),
    )
    db.add(triage_result)
    db.commit()
    db.refresh(triage_result)
    return TriageResultResponse.model_validate(triage_result)


def get_triage_result(db: Session, triage_result_id: int, patient_id: int) -> TriageResultResponse:
    triage_result = db.get(TriageResult, triage_result_id)
    if triage_result is None or triage_result.patient_id != patient_id:
        raise NotFoundError("Triage result not found")
    return TriageResultResponse.model_validate(triage_result)
