from __future__ import annotations

from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.progress import ProgressCheckIn, ProgressEvaluationRequest
from app.models.triage import SeverityLevel, TriageResponse


def make_original_triage(domain: str = "dermatology", referral: str = "dermatology") -> TriageResponse:
    return TriageResponse(
        triage_id="triage-progress-1",
        detected_domain=domain,
        possible_diagnoses=[
            Diagnosis(
                name="Baseline concern",
                icd_code_hint=None,
                probability=0.75,
                description="Possible baseline concern needing review.",
                urgency="routine",
            )
        ],
        confidence_scores={"Baseline concern": 0.75},
        severity_level=SeverityLevel.MILD,
        recommended_action=RecommendedAction.CONSULT_DOCTOR,
        follow_up_questions=[],
        referral_specialization=referral,
        disclaimers=["Supportive triage only."],
    )


def test_improvement_detection(engine):
    request = ProgressEvaluationRequest(
        check_ins=[
            ProgressCheckIn(symptoms_current="The rash is still itchy.", improvement_rating=4, new_symptoms=[]),
            ProgressCheckIn(symptoms_current="The rash is much less itchy and less red.", improvement_rating=8, new_symptoms=[]),
        ],
        original_triage=make_original_triage(),
    )

    assessment = engine.assess_progress(request)

    assert assessment.trend == "improving"
    assert assessment.needs_reconsultation is False


def test_deterioration_detection_recommends_reconsultation(engine):
    request = ProgressEvaluationRequest(
        check_ins=[
            ProgressCheckIn(symptoms_current="Anxiety was manageable earlier this week.", improvement_rating=5, new_symptoms=[]),
            ProgressCheckIn(symptoms_current="My anxiety is worse and I am sleeping less.", improvement_rating=2, new_symptoms=[]),
        ],
        original_triage=make_original_triage(domain="mental_health", referral="psychiatry"),
    )

    assessment = engine.assess_progress(request)

    assert assessment.trend == "worsening"
    assert assessment.needs_reconsultation is True
    assert "re-consult" in assessment.recommendation.lower() or "review" in assessment.recommendation.lower()


def test_new_symptom_flagging(engine):
    request = ProgressEvaluationRequest(
        check_ins=[
            ProgressCheckIn(symptoms_current="The rash is stable but still present.", improvement_rating=6, new_symptoms=["fever"]),
        ],
        original_triage=make_original_triage(),
    )

    assessment = engine.assess_progress(request)

    assert assessment.needs_reconsultation is True
    assert any("new symptoms" in pattern.lower() for pattern in assessment.concerning_patterns)
    assert "re-consult" in assessment.recommendation.lower()
