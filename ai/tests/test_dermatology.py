from __future__ import annotations

from unittest.mock import Mock

import pytest

from app.engine.dermatology import DermatologyAnalyzer
from app.models.diagnosis import RecommendedAction
from app.models.triage import ImageAnalysis


@pytest.mark.parametrize(
    ("symptoms", "duration", "expected_condition"),
    [
        ("Itchy dry rash on the elbow with flaking", "2 weeks", "Eczema / dermatitis"),
        ("Painful acne breakout on the cheeks", "5 days", "Acne"),
        ("Circular rash with itching between the toes", "10 days", "Fungal infection"),
    ],
)
def test_skin_condition_keyword_matching(symptoms, duration, expected_condition):
    image_analyzer = Mock()
    analyzer = DermatologyAnalyzer(image_analyzer=image_analyzer)

    assessment = analyzer.analyze(symptoms=symptoms, images=[], duration=duration)

    assert expected_condition in assessment.possible_conditions


@pytest.mark.parametrize(
    ("symptoms", "duration", "image_analysis", "expected_urgency", "expected_action"),
    [
        (
            "Acne breakout on the forehead",
            "1 week",
            ImageAnalysis(observations=[], concerning_features=[], quality_issues=[], summary=""),
            "cosmetic_concern",
            RecommendedAction.SELF_CARE,
        ),
        (
            "Itchy inflamed rash on the hands",
            "2 weeks",
            ImageAnalysis(observations=[], concerning_features=[], quality_issues=[], summary=""),
            "treatable_condition",
            RecommendedAction.CONSULT_DOCTOR,
        ),
        (
            "Changing mole with irregular border and occasional bleeding",
            "3 months",
            ImageAnalysis(
                observations=["Pigmented lesion"],
                concerning_features=["Irregular border", "Asymmetry"],
                quality_issues=[],
                summary="Dark lesion with color variation.",
            ),
            "needs_biopsy",
            RecommendedAction.CONSULT_DOCTOR,
        ),
        (
            "Rapidly spreading rash with fever and skin peeling",
            "2 days",
            ImageAnalysis(observations=[], concerning_features=[], quality_issues=[], summary=""),
            "urgent_dermatology_referral",
            RecommendedAction.URGENT_CARE,
        ),
    ],
)
def test_urgency_classification(symptoms, duration, image_analysis, expected_urgency, expected_action):
    image_analyzer = Mock()
    image_analyzer.analyze_image.return_value = image_analysis
    analyzer = DermatologyAnalyzer(image_analyzer=image_analyzer)
    images = ["https://example.com/skin.jpg"] if image_analysis.summary or image_analysis.concerning_features else []

    assessment = analyzer.analyze(symptoms=symptoms, images=images, duration=duration)

    assert assessment.urgency == expected_urgency
    assert assessment.recommended_action == expected_action


def test_image_analysis_routing():
    image_analyzer = Mock()
    image_analyzer.analyze_image.return_value = ImageAnalysis(
        observations=["Dry scaly patch"],
        concerning_features=[],
        quality_issues=[],
        summary="Dry erythematous patch on flexural skin.",
    )
    analyzer = DermatologyAnalyzer(image_analyzer=image_analyzer)

    assessment = analyzer.analyze(
        symptoms="Itchy dry rash on the elbow with flaking",
        images=["https://example.com/skin.jpg"],
        duration="2 weeks",
    )

    image_analyzer.analyze_image.assert_called_once()
    assert assessment.image_observations[0].summary == "Dry erythematous patch on flexural skin."
    assert "Images were reviewed for observational support." in assessment.summary
