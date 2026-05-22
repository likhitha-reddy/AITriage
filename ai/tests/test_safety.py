from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.engine.safety import apply_guardrails, build_emergency_response, detect_emergency
from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.triage import SeverityLevel, TriageRequest, TriageResponse


class SafetyTests(unittest.TestCase):
    def test_detect_emergency_keywords(self) -> None:
        self.assertTrue(detect_emergency("I have chest pain and difficulty breathing"))

    def test_guardrails_add_disclaimer_and_consultation(self) -> None:
        request = TriageRequest(symptoms_text="itchy rash on both hands", medical_history=[])
        response = TriageResponse(
            possible_diagnoses=[
                Diagnosis(
                    name="Contact dermatitis",
                    icd_code_hint="L25.9",
                    probability=0.62,
                    description="Contact dermatitis is consistent with the presentation.",
                    urgency="routine",
                )
            ],
            confidence_scores={"Contact dermatitis": 0.62},
            severity_level=SeverityLevel.MODERATE,
            recommended_action=RecommendedAction.SELF_CARE,
            follow_up_questions=["When did the rash start?"],
        )

        guarded = apply_guardrails(response, request, threshold=0.35, max_diagnoses=3)

        self.assertEqual(guarded.recommended_action, RecommendedAction.CONSULT_DOCTOR)
        self.assertTrue(any("not a medical diagnosis" in item.lower() for item in guarded.disclaimers))
        self.assertIn("Possible", guarded.possible_diagnoses[0].description)

    def test_build_emergency_response(self) -> None:
        response = build_emergency_response("Chest pain and fainting were reported.")

        self.assertEqual(response.recommended_action, RecommendedAction.EMERGENCY)
        self.assertEqual(response.severity_level, SeverityLevel.EMERGENCY)
        self.assertEqual(response.referral_specialization, "emergency medicine")


if __name__ == "__main__":
    unittest.main()
