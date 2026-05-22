from __future__ import annotations

import pytest

from app.engine.mental_health import MentalHealthScreener
from app.models.diagnosis import RecommendedAction


@pytest.fixture()
def screener() -> MentalHealthScreener:
    return MentalHealthScreener()


def test_crisis_keyword_detection_returns_emergency(screener: MentalHealthScreener):
    assessment = screener.screen(
        "I feel hopeless and I want to kill myself tonight.",
        "previous depression",
    )

    assert assessment.crisis_detected is True
    assert assessment.recommended_action == RecommendedAction.EMERGENCY
    assert assessment.risk_level == "crisis"
    assert assessment.severity == "severe"


@pytest.mark.parametrize(
    ("symptoms", "history", "expected_severity", "expected_action"),
    [
        (
            "I feel stressed after work sometimes.",
            "",
            "minimal",
            RecommendedAction.SELF_CARE,
        ),
        (
            "I feel anxious and keep overthinking often.",
            "",
            "mild",
            RecommendedAction.CONSULT_DOCTOR,
        ),
        (
            "I feel anxious often, cannot focus, and have not been sleeping well for weeks.",
            "history of stress episodes",
            "moderate",
            RecommendedAction.CONSULT_DOCTOR,
        ),
        (
            "I feel hopeless every day, cannot function, have not slept, and cannot get out of bed for weeks.",
            "history of depression",
            "severe",
            RecommendedAction.URGENT_CARE,
        ),
    ],
)
def test_severity_classification(screener: MentalHealthScreener, symptoms, history, expected_severity, expected_action):
    assessment = screener.screen(symptoms, history)

    assert assessment.severity == expected_severity
    assert assessment.recommended_action == expected_action


def test_helpline_numbers_included_in_crisis_response(screener: MentalHealthScreener):
    assessment = screener.screen(
        "I have suicidal thoughts and do not want to live.",
        "history of anxiety",
    )

    assert any(any(character.isdigit() for character in line) for line in assessment.crisis_resources)
    assert any("9820466726" in line or "9152987821" in line for line in assessment.crisis_resources)


def test_non_crisis_mental_health_screening(screener: MentalHealthScreener):
    assessment = screener.screen(
        "I feel anxious, overwhelmed, and keep waking up at night.",
        "work stress for weeks",
    )

    assert assessment.crisis_detected is False
    assert assessment.referral_specialization == "psychiatry"
    assert assessment.recommended_action == RecommendedAction.CONSULT_DOCTOR
    assert "Generalized anxiety symptoms" in assessment.possible_concerns
    assert len(assessment.follow_up_questions) >= 4
