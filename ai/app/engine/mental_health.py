from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field

from app.models.diagnosis import RecommendedAction

CRISIS_RESOURCE_LINES = [
    "AASRA helpline: 9820466726",
    "iCall: 9152987821",
    "Vandrevala Foundation: 1860-2662-345",
]

_MENTAL_HEALTH_PATTERNS: dict[str, list[str]] = {
    "depression": [
        "depress",
        "hopeless",
        "worthless",
        "empty",
        "loss of interest",
        "no interest",
        "guilty",
        "low mood",
    ],
    "anxiety": ["anxiety", "anxious", "worry", "overthinking", "nervous", "restless", "tense"],
    "panic": ["panic", "heart racing", "palpitations", "doom", "can't calm down", "cannot calm down"],
    "stress": ["stress", "burnout", "overwhelmed", "pressure", "workload", "exhausted"],
    "sleep": ["insomnia", "sleep", "nightmare", "can't sleep", "cannot sleep", "waking up"],
    "ptsd": ["trauma", "flashback", "hypervigilant", "triggered", "ptsd", "avoidance"],
}

_CRISIS_PATTERNS = [
    "suicidal",
    "suicide",
    "self-harm",
    "kill myself",
    "end my life",
    "don't want to live",
    "do not want to live",
    "hurt myself",
    "overdose",
]

_FUNCTIONAL_IMPAIRMENT_PATTERNS = [
    "can't function",
    "cannot function",
    "unable to work",
    "not sleeping at all",
    "haven't slept",
    "isolating",
    "can't get out of bed",
    "cannot get out of bed",
]


class MentalHealthScreenRequest(BaseModel):
    symptoms: str = Field(..., min_length=1)
    patient_history: str = ""


class MentalHealthAssessment(BaseModel):
    severity: Literal["minimal", "mild", "moderate", "severe"]
    crisis_detected: bool = False
    risk_level: str = "low"
    possible_concerns: list[str] = Field(default_factory=list)
    symptom_domains: list[str] = Field(default_factory=list)
    summary: str
    recommended_interventions: list[str] = Field(default_factory=list)
    recommended_action: RecommendedAction = RecommendedAction.CONSULT_DOCTOR
    referral_specialization: str = "psychiatry"
    follow_up_questions: list[str] = Field(default_factory=list)
    crisis_resources: list[str] = Field(default_factory=lambda: list(CRISIS_RESOURCE_LINES))
    disclaimers: list[str] = Field(
        default_factory=lambda: [
            "Mental health screening is supportive triage only and not a diagnosis.",
            "If you feel unsafe, cannot function, or symptoms rapidly worsen, seek urgent in-person help.",
        ]
    )


class MentalHealthScreener:
    def screen(self, symptoms: str, patient_history: str) -> MentalHealthAssessment:
        combined_text = " ".join(part for part in [symptoms, patient_history] if part).lower()
        crisis_detected = any(pattern in combined_text for pattern in _CRISIS_PATTERNS)
        symptom_domains = [domain for domain, patterns in _MENTAL_HEALTH_PATTERNS.items() if any(pattern in combined_text for pattern in patterns)]
        severity_score = self._score_severity(combined_text, symptom_domains)
        severity = self._severity_from_score(severity_score)
        possible_concerns = self._build_possible_concerns(symptom_domains)

        if crisis_detected:
            return MentalHealthAssessment(
                severity="severe",
                crisis_detected=True,
                risk_level="crisis",
                possible_concerns=possible_concerns or ["Acute self-harm or suicidal ideation risk"],
                symptom_domains=symptom_domains or ["crisis"],
                summary="Possible acute mental health crisis detected. Immediate emergency evaluation is recommended.",
                recommended_interventions=[
                    "Do not stay alone if possible.",
                    "Call local emergency services or go to the nearest emergency department now.",
                    "Reach out to an available crisis helpline immediately.",
                ],
                recommended_action=RecommendedAction.EMERGENCY,
                follow_up_questions=[
                    "Are you in immediate danger or have you made a plan to harm yourself?",
                    "Is there a trusted person who can stay with you right now?",
                    "Can you call emergency services or go to the nearest emergency department now?",
                ],
                disclaimers=[
                    "Mental health screening is supportive triage only and not a diagnosis.",
                    "Suicidal thoughts or self-harm risk require immediate emergency support.",
                ],
            )

        risk_level = "elevated" if severity in {"moderate", "severe"} else "low"
        recommended_action = {
            "minimal": RecommendedAction.SELF_CARE,
            "mild": RecommendedAction.CONSULT_DOCTOR,
            "moderate": RecommendedAction.CONSULT_DOCTOR,
            "severe": RecommendedAction.URGENT_CARE,
        }[severity]
        recommended_interventions = self._recommended_interventions(severity, symptom_domains)
        summary = self._build_summary(severity, symptom_domains)

        return MentalHealthAssessment(
            severity=severity,
            crisis_detected=False,
            risk_level=risk_level,
            possible_concerns=possible_concerns,
            symptom_domains=symptom_domains,
            summary=summary,
            recommended_interventions=recommended_interventions,
            recommended_action=recommended_action,
            follow_up_questions=self._follow_up_questions(symptom_domains),
        )

    def _score_severity(self, combined_text: str, symptom_domains: list[str]) -> int:
        score = len(symptom_domains)
        severe_intensifiers = ["every day", "daily", "constant", "severe", "worsening", "unable", "hopeless"]
        moderate_intensifiers = ["often", "frequent", "panic", "nightmares", "not sleeping", "cannot focus"]
        score += sum(1 for term in severe_intensifiers if term in combined_text)
        score += sum(1 for term in moderate_intensifiers if term in combined_text)
        score += sum(2 for term in _FUNCTIONAL_IMPAIRMENT_PATTERNS if term in combined_text)
        if re.search(r"\b(weeks|months)\b", combined_text):
            score += 1
        return score

    @staticmethod
    def _severity_from_score(score: int) -> Literal["minimal", "mild", "moderate", "severe"]:
        if score <= 1:
            return "minimal"
        if score <= 3:
            return "mild"
        if score <= 6:
            return "moderate"
        return "severe"

    @staticmethod
    def _build_possible_concerns(symptom_domains: list[str]) -> list[str]:
        mapping = {
            "depression": "Depressive symptom pattern",
            "anxiety": "Generalized anxiety symptoms",
            "panic": "Panic attack pattern",
            "stress": "Stress or burnout pattern",
            "sleep": "Sleep disturbance or insomnia pattern",
            "ptsd": "Trauma-related or PTSD-like pattern",
        }
        return [mapping[domain] for domain in symptom_domains if domain in mapping]

    @staticmethod
    def _build_summary(severity: str, symptom_domains: list[str]) -> str:
        if not symptom_domains:
            return "Mental health symptoms were reported, but the pattern is still unclear and needs clinician follow-up if it persists."
        joined = ", ".join(symptom_domains)
        return f"The reported symptoms suggest a {severity} mental health concern involving {joined}."

    @staticmethod
    def _recommended_interventions(severity: str, symptom_domains: list[str]) -> list[str]:
        interventions = {
            "minimal": [
                "Use self-care supports such as sleep hygiene, regular meals, hydration, and reduced stimulant intake.",
                "Track mood, anxiety, sleep, and triggers daily for 1-2 weeks.",
            ],
            "mild": [
                "Begin structured self-help routines such as breathing exercises, grounding, and a consistent sleep schedule.",
                "Consider counseling or a primary care review if symptoms persist beyond 2 weeks.",
            ],
            "moderate": [
                "Schedule counseling or therapist review soon.",
                "Arrange medical review for persistent low mood, panic, or insomnia.",
                "Reduce isolation and involve a trusted support person.",
            ],
            "severe": [
                "Urgent psychiatric or emergency mental health evaluation is recommended.",
                "Have a trusted person support monitoring until professional assessment occurs.",
            ],
        }[severity]
        if "sleep" in symptom_domains and severity != "severe":
            interventions.append("Prioritize same-day sleep safety measures and avoid alcohol or non-prescribed sedatives.")
        if "ptsd" in symptom_domains:
            interventions.append("Seek trauma-informed counseling support and avoid triggers where possible until reviewed.")
        return interventions

    @staticmethod
    def _follow_up_questions(symptom_domains: list[str]) -> list[str]:
        base_questions = [
            "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?",
            "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
            "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
            "Over the last 2 weeks, how often have you been unable to stop or control worrying?",
        ]
        if "panic" in symptom_domains:
            base_questions.append("Do you get sudden episodes of intense fear with chest tightness, palpitations, or shortness of breath?")
        if "sleep" in symptom_domains:
            base_questions.append("How many nights per week do you struggle to fall asleep, stay asleep, or wake too early?")
        if "ptsd" in symptom_domains:
            base_questions.append("Are there flashbacks, nightmares, or avoidance behaviors linked to a traumatic event?")
        return base_questions[:6]
