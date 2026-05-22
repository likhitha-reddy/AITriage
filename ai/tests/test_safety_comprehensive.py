from __future__ import annotations

from unittest.mock import patch

import pytest

from app.engine.safety import DEFAULT_DISCLAIMERS, EMERGENCY_KEYWORDS, apply_guardrails
from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.triage import SeverityLevel, TriageRequest, TriageResponse


@pytest.mark.parametrize("keyword", EMERGENCY_KEYWORDS)
def test_all_emergency_keywords_trigger_emergency_action(engine, keyword):
    request = TriageRequest(symptoms_text=f"Patient reports {keyword} today.")

    with patch.object(type(engine), "_call_llm_json") as mocked_call:
        response = engine.analyze_symptoms(request)

    mocked_call.assert_not_called()
    assert response.recommended_action == RecommendedAction.EMERGENCY
    assert response.severity_level == SeverityLevel.EMERGENCY


def test_confidence_threshold_enforcement():
    request = TriageRequest(symptoms_text="Mild skin irritation on one finger.")
    response = TriageResponse(
        possible_diagnoses=[
            Diagnosis(
                name="Low confidence rash",
                icd_code_hint=None,
                probability=0.20,
                description="This is definitely a rash.",
                urgency="routine",
            )
        ],
        confidence_scores={"Low confidence rash": 0.20},
        severity_level=SeverityLevel.MILD,
        recommended_action=RecommendedAction.SELF_CARE,
        follow_up_questions=[],
        disclaimers=[],
    )

    guarded = apply_guardrails(response, request, threshold=0.60, max_diagnoses=3)

    assert guarded.possible_diagnoses[0].name == "Unclear symptom pattern"
    assert guarded.confidence_scores["Unclear symptom pattern"] >= 0.60


def test_disclaimer_is_always_present():
    request = TriageRequest(symptoms_text="Dry patch of skin on elbow.")
    response = TriageResponse(
        possible_diagnoses=[
            Diagnosis(
                name="Dry skin",
                icd_code_hint=None,
                probability=0.70,
                description="Dry skin is consistent with the presentation.",
                urgency="routine",
            )
        ],
        confidence_scores={"Dry skin": 0.70},
        severity_level=SeverityLevel.MILD,
        recommended_action=RecommendedAction.SELF_CARE,
        follow_up_questions=["Any new moisturizers?"],
        disclaimers=[],
    )

    guarded = apply_guardrails(response, request, threshold=0.35, max_diagnoses=3)

    for disclaimer in DEFAULT_DISCLAIMERS:
        assert disclaimer in guarded.disclaimers


def test_ai_never_claims_to_be_a_doctor():
    request = TriageRequest(symptoms_text="Scaly rash on scalp.")
    response = TriageResponse(
        possible_diagnoses=[
            Diagnosis(
                name="Psoriasis",
                icd_code_hint=None,
                probability=0.80,
                description="This diagnosis is definitely psoriasis.",
                urgency="routine",
            )
        ],
        confidence_scores={"Psoriasis": 0.80},
        severity_level=SeverityLevel.MODERATE,
        recommended_action=RecommendedAction.CONSULT_DOCTOR,
        follow_up_questions=["Has the rash worsened?"],
        disclaimers=[],
    )

    guarded = apply_guardrails(response, request, threshold=0.35, max_diagnoses=3)
    combined_text = " ".join([*guarded.disclaimers, *[item.description for item in guarded.possible_diagnoses]])

    assert "i am a doctor" not in combined_text.lower()
    assert "not a medical diagnosis" in combined_text.lower()
    assert "definitely" not in guarded.possible_diagnoses[0].description.lower()


def test_severe_symptoms_always_recommend_professional_consultation():
    request = TriageRequest(symptoms_text="Rapidly worsening painful skin infection.")
    response = TriageResponse(
        possible_diagnoses=[
            Diagnosis(
                name="Skin infection concern",
                icd_code_hint=None,
                probability=0.82,
                description="Possible infection needing clinician review.",
                urgency="urgent",
            )
        ],
        confidence_scores={"Skin infection concern": 0.82},
        severity_level=SeverityLevel.HIGH,
        recommended_action=RecommendedAction.SELF_CARE,
        follow_up_questions=["Is the pain spreading?"],
        disclaimers=[],
    )

    guarded = apply_guardrails(response, request, threshold=0.35, max_diagnoses=3)

    assert guarded.recommended_action == RecommendedAction.URGENT_CARE
