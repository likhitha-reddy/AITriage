from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.engine.triage_engine import TriageEngine
from app.models.diagnosis import RecommendedAction
from app.models.triage import SeverityLevel, TriageRequest


class TriageEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            openai_api_key="test-key",
            anthropic_api_key=None,
            llm_provider="openai",
            model_name="test-model",
            vision_model_name="test-vision-model",
            confidence_threshold=0.35,
            max_diagnoses=3,
            request_timeout_seconds=30,
        )
        self.engine = TriageEngine(settings=self.settings)

    def test_analyze_symptoms_with_mock_llm_response(self) -> None:
        request = TriageRequest(
            symptoms_text="I have an itchy red rash on my forearm for two days.",
            patient_age=31,
            patient_gender="female",
            medical_history=["eczema"],
        )
        mock_payload = {
            "possible_diagnoses": [
                {
                    "name": "Contact dermatitis",
                    "icd_code_hint": "L25.9",
                    "probability": 0.72,
                    "description": "Contact dermatitis is consistent with the rash pattern.",
                    "urgency": "routine",
                },
                {
                    "name": "Eczema flare",
                    "icd_code_hint": "L30.9",
                    "probability": 0.58,
                    "description": "An eczema flare is also possible.",
                    "urgency": "routine",
                },
            ],
            "confidence_scores": {"Contact dermatitis": 0.72, "Eczema flare": 0.58},
            "severity_level": "moderate",
            "recommended_action": "CONSULT_DOCTOR",
            "follow_up_questions": ["Has the rash spread?", "Any new soaps or lotions?"],
            "referral_specialization": "dermatology",
            "disclaimers": ["Not a diagnosis."],
        }

        with patch.object(TriageEngine, "_call_llm_json", return_value=mock_payload):
            response = self.engine.analyze_symptoms(request)

        self.assertEqual(response.referral_specialization, "dermatology")
        self.assertEqual(response.recommended_action, RecommendedAction.CONSULT_DOCTOR)
        self.assertEqual(response.severity_level, SeverityLevel.MODERATE)
        self.assertLessEqual(len(response.possible_diagnoses), 3)
        self.assertTrue(response.disclaimers)

    def test_emergency_bypasses_llm(self) -> None:
        request = TriageRequest(symptoms_text="I have chest pain and I can't breathe well.")

        with patch.object(TriageEngine, "_call_llm_json") as mocked_call:
            response = self.engine.analyze_symptoms(request)

        mocked_call.assert_not_called()
        self.assertEqual(response.recommended_action, RecommendedAction.EMERGENCY)
        self.assertEqual(response.severity_level, SeverityLevel.EMERGENCY)


if __name__ == "__main__":
    unittest.main()
