from __future__ import annotations

from app.engine.mental_health import MentalHealthScreener
from app.engine.safety import detect_emergency
from app.models.progress import ProgressAssessment, ProgressCheckIn
from app.models.triage import TriageResponse


class ProgressTracker:
    def __init__(self, mental_health_screener: MentalHealthScreener | None = None) -> None:
        self.mental_health_screener = mental_health_screener or MentalHealthScreener()

    def evaluate_progress(self, check_ins: list[ProgressCheckIn], original_triage: TriageResponse) -> ProgressAssessment:
        symptom_trajectory = [item.improvement_rating for item in check_ins]
        latest = check_ins[-1]
        all_new_symptoms = [symptom for item in check_ins for symptom in item.new_symptoms]
        combined_latest_text = " ".join([latest.symptoms_current, *latest.new_symptoms])

        if detect_emergency(combined_latest_text):
            return ProgressAssessment(
                trend="worsening",
                recommendation="Emergency warning signs were detected during follow-up. Seek urgent in-person evaluation immediately.",
                needs_reconsultation=True,
                concerning_patterns=["Emergency red flags detected during progress review."],
                symptom_trajectory=symptom_trajectory,
                crisis_rescreened=True,
                reconsultation_threshold="Immediate emergency evaluation.",
                last_check_in_summary=latest.symptoms_current,
            )

        concerning_patterns: list[str] = []
        if len(symptom_trajectory) >= 2 and symptom_trajectory[-1] <= symptom_trajectory[0] - 2:
            concerning_patterns.append("Symptoms are worsening compared with earlier check-ins.")
        if latest.improvement_rating <= 3:
            concerning_patterns.append("Current improvement rating remains very low.")
        if all_new_symptoms:
            concerning_patterns.append("New symptoms have appeared since the original triage.")

        trend = self._determine_trend(symptom_trajectory, concerning_patterns)
        needs_reconsultation = trend == "worsening" or bool(all_new_symptoms) or original_triage.severity_level.value in {"high", "emergency"}
        recommendation = self._build_recommendation(trend, needs_reconsultation, original_triage.referral_specialization or "general practice")
        mood_trend = self._mood_trend(check_ins)
        crisis_rescreened = False

        mental_health_context = (
            original_triage.detected_domain == "mental_health"
            or (original_triage.referral_specialization or "").lower() == "psychiatry"
        )
        if mental_health_context:
            crisis_rescreened = True
            assessment = self.mental_health_screener.screen(combined_latest_text, latest.notes or "")
            if assessment.crisis_detected:
                return ProgressAssessment(
                    trend="worsening",
                    recommendation="Possible mental health crisis detected during progress review. Seek emergency help immediately and use a crisis helpline now.",
                    needs_reconsultation=True,
                    concerning_patterns=[*concerning_patterns, "Mental health crisis re-screen was positive."],
                    symptom_trajectory=symptom_trajectory,
                    mood_trend=mood_trend,
                    crisis_rescreened=True,
                    reconsultation_threshold="Immediate emergency evaluation for any self-harm or suicidal ideation.",
                    last_check_in_summary=latest.symptoms_current,
                )
            if assessment.severity in {"moderate", "severe"}:
                needs_reconsultation = True
                concerning_patterns.append("Mental health symptoms remain clinically significant on re-screen.")
                recommendation = "Mental health symptoms remain significant. Arrange counseling or psychiatric review soon."

        return ProgressAssessment(
            trend=trend,
            recommendation=recommendation,
            needs_reconsultation=needs_reconsultation,
            concerning_patterns=concerning_patterns,
            symptom_trajectory=symptom_trajectory,
            mood_trend=mood_trend,
            crisis_rescreened=crisis_rescreened,
            reconsultation_threshold=self._reconsultation_threshold(trend, needs_reconsultation),
            last_check_in_summary=latest.symptoms_current,
        )

    @staticmethod
    def _determine_trend(symptom_trajectory: list[int], concerning_patterns: list[str]) -> str:
        if len(symptom_trajectory) == 1:
            return "stable" if symptom_trajectory[-1] >= 5 else "worsening"
        if symptom_trajectory[-1] >= symptom_trajectory[0] + 2 and not concerning_patterns:
            return "improving"
        if symptom_trajectory[-1] <= symptom_trajectory[0] - 1 or concerning_patterns:
            return "worsening"
        return "stable"

    @staticmethod
    def _build_recommendation(trend: str, needs_reconsultation: bool, specialization: str) -> str:
        if trend == "improving" and not needs_reconsultation:
            return "Symptoms appear to be improving. Continue the current plan and keep monitoring for any relapse or new red flags."
        if trend == "stable" and not needs_reconsultation:
            return "Progress is limited but not clearly worsening. Continue monitoring and re-consult if symptoms persist or impact daily function."
        return f"Re-consult with {specialization} because symptoms are worsening, new symptoms are present, or recovery is not on track."

    @staticmethod
    def _mood_trend(check_ins: list[ProgressCheckIn]) -> str | None:
        mood_scores = [item.mood_rating for item in check_ins if item.mood_rating is not None]
        if len(mood_scores) < 2:
            return None
        if mood_scores[-1] >= mood_scores[0] + 2:
            return "improving"
        if mood_scores[-1] <= mood_scores[0] - 2:
            return "worsening"
        return "stable"

    @staticmethod
    def _reconsultation_threshold(trend: str, needs_reconsultation: bool) -> str:
        if trend == "worsening":
            return "Re-consult within 24-48 hours, or sooner if new red flags appear."
        if needs_reconsultation:
            return "Re-consult within the next few days if symptoms do not improve."
        return "Re-consult if symptoms persist beyond the expected recovery window or new symptoms appear."
