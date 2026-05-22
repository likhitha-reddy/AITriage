from __future__ import annotations

from typing import Iterable

from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.triage import SeverityLevel, TriageRequest, TriageResponse

EMERGENCY_KEYWORDS = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "can't breathe",
    "cannot breathe",
    "blue lips",
    "severe bleeding",
    "passed out",
    "fainted",
    "stroke",
    "one-sided weakness",
    "seizure",
    "suicidal",
    "suicide",
    "self-harm",
    "kill myself",
    "end my life",
    "overdose",
]

DEFAULT_DISCLAIMERS = [
    "This assessment is AI-generated triage support and not a medical diagnosis.",
    "If symptoms worsen, new red flags appear, or you feel unsafe, seek urgent in-person care.",
]
CRISIS_SUPPORT_MESSAGE = (
    "If you may harm yourself or someone else, call emergency services now. "
    "If you are in the U.S. or Canada, call or text 988 for immediate crisis support."
)


def detect_emergency(text: str, medical_history: Iterable[str] | None = None) -> bool:
    combined = " ".join([text, *(medical_history or [])]).lower()
    return any(keyword in combined for keyword in EMERGENCY_KEYWORDS)


def build_emergency_response(
    reason: str | None = None,
    triage_id: str | None = None,
    detected_domain: str = "emergency",
) -> TriageResponse:
    diagnosis_name = "Potential emergency warning signs"
    details = reason or "Emergency warning signs were detected in the submitted information."
    return TriageResponse(
        triage_id=triage_id,
        detected_domain=detected_domain,
        possible_diagnoses=[
            Diagnosis(
                name=diagnosis_name,
                icd_code_hint=None,
                probability=1.0,
                description="Possible emergency presentation requiring immediate in-person evaluation.",
                urgency="emergency",
            )
        ],
        confidence_scores={diagnosis_name: 1.0},
        severity_level=SeverityLevel.EMERGENCY,
        recommended_action=RecommendedAction.EMERGENCY,
        follow_up_questions=[
            "Call emergency services or go to the nearest emergency department now.",
            CRISIS_SUPPORT_MESSAGE,
        ],
        referral_specialization="emergency medicine",
        disclaimers=[*DEFAULT_DISCLAIMERS, CRISIS_SUPPORT_MESSAGE, details],
    )


def _soften_description(name: str, description: str) -> str:
    cleaned = (description or "").strip()
    if not cleaned:
        cleaned = "The symptom pattern needs clinician review."
    replacements = {
        "is consistent with": "could be consistent with",
        "consistent with": "could be consistent with",
        "diagnosis": "clinical concern",
        "definitely": "possibly",
    }
    lowered = cleaned.lower()
    for old, new in replacements.items():
        lowered = lowered.replace(old, new)
    if lowered.startswith(("possible", "may", "might", "could", "suggestive")):
        return lowered[0].upper() + lowered[1:]
    return f"Possible {name}: {lowered}"


def _normalize_diagnoses(diagnoses: list[Diagnosis], threshold: float, max_diagnoses: int) -> list[Diagnosis]:
    normalized: list[Diagnosis] = []
    for diagnosis in sorted(diagnoses, key=lambda item: item.probability, reverse=True):
        if diagnosis.probability < threshold:
            continue
        normalized.append(
            Diagnosis(
                name=diagnosis.name,
                icd_code_hint=diagnosis.icd_code_hint,
                probability=min(max(diagnosis.probability, threshold), 0.85),
                description=_soften_description(diagnosis.name, diagnosis.description),
                urgency=diagnosis.urgency,
            )
        )
        if len(normalized) >= max_diagnoses:
            break
    return normalized


def apply_guardrails(
    response: TriageResponse,
    request: TriageRequest,
    threshold: float,
    max_diagnoses: int,
) -> TriageResponse:
    if detect_emergency(request.symptoms_text, request.medical_history):
        return build_emergency_response(
            "Emergency symptoms were detected before completing routine triage.",
            triage_id=response.triage_id,
            detected_domain=response.detected_domain,
        )

    diagnoses = _normalize_diagnoses(response.possible_diagnoses, threshold, max_diagnoses)
    if not diagnoses:
        diagnoses = [
            Diagnosis(
                name="Unclear symptom pattern",
                icd_code_hint=None,
                probability=max(threshold, 0.4),
                description="Possible need for clinician review because the symptom pattern was not clear enough for reliable triage.",
                urgency="routine",
            )
        ]

    severity = SeverityLevel(response.severity_level)
    recommended_action = response.recommended_action
    if severity == SeverityLevel.EMERGENCY:
        recommended_action = RecommendedAction.EMERGENCY
    elif severity == SeverityLevel.HIGH and recommended_action in {RecommendedAction.SELF_CARE, RecommendedAction.CONSULT_DOCTOR}:
        recommended_action = RecommendedAction.URGENT_CARE
    elif severity in {SeverityLevel.MODERATE, SeverityLevel.HIGH} and recommended_action == RecommendedAction.SELF_CARE:
        recommended_action = RecommendedAction.CONSULT_DOCTOR

    if response.recommended_action == RecommendedAction.SELF_CARE and len(diagnoses) > 1:
        recommended_action = RecommendedAction.CONSULT_DOCTOR

    confidence_scores = {diagnosis.name: diagnosis.probability for diagnosis in diagnoses}
    disclaimers = list(dict.fromkeys([*DEFAULT_DISCLAIMERS, *response.disclaimers]))
    follow_up_questions = list(dict.fromkeys(response.follow_up_questions))[:5]

    return TriageResponse(
        triage_id=response.triage_id,
        detected_domain=response.detected_domain,
        possible_diagnoses=diagnoses,
        confidence_scores=confidence_scores,
        severity_level=severity,
        recommended_action=recommended_action,
        follow_up_questions=follow_up_questions,
        referral_specialization=response.referral_specialization,
        image_observations=response.image_observations,
        disclaimers=disclaimers,
    )
