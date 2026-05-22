from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.engine.image_analyzer import ImageAnalyzer
from app.models.diagnosis import RecommendedAction
from app.models.triage import ImageAnalysis

_DERMATOLOGY_MATCHERS: dict[str, list[str]] = {
    "Acne": ["acne", "pimple", "blackhead", "whitehead", "breakout"],
    "Eczema / dermatitis": ["eczema", "dermatitis", "itchy", "dry", "flaky", "inflamed"],
    "Psoriasis": ["psoriasis", "silvery scale", "thick plaque", "scaly plaque"],
    "Fungal infection": ["fungal", "ringworm", "athlete's foot", "itching between", "circular rash"],
    "Allergic reaction / hives": ["hives", "allergic", "swelling", "welts", "after new soap", "after cream"],
    "Suspicious pigmented lesion": ["mole", "dark spot", "changing lesion", "bleeding lesion", "irregular border"],
}

_RED_FLAG_PATTERNS = {
    "needs_biopsy": ["changing mole", "irregular border", "bleeding mole", "black lesion", "non healing ulcer"],
    "urgent_dermatology_referral": ["facial swelling", "blistering", "skin peeling", "rapidly spreading rash", "fever with rash"],
}


class DermatologyRequest(BaseModel):
    symptoms: str = Field(..., min_length=1)
    images: list[str] = Field(default_factory=list)
    duration: str = "not provided"


class DermatologyAssessment(BaseModel):
    urgency: Literal["cosmetic_concern", "treatable_condition", "needs_biopsy", "urgent_dermatology_referral"]
    possible_conditions: list[str] = Field(default_factory=list)
    summary: str
    recommended_action: RecommendedAction = RecommendedAction.CONSULT_DOCTOR
    follow_up_questions: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    image_observations: list[ImageAnalysis] = Field(default_factory=list)
    image_analysis_summary: str = ""
    disclaimers: list[str] = Field(
        default_factory=lambda: [
            "Dermatology assessment is supportive triage only and not a diagnosis.",
            "Skin photos improve triage quality, but suspicious or worsening lesions still need in-person review.",
        ]
    )


class DermatologyAnalyzer:
    def __init__(self, image_analyzer: ImageAnalyzer) -> None:
        self.image_analyzer = image_analyzer

    def analyze(self, symptoms: str, images: list[str], duration: str) -> DermatologyAssessment:
        text = " ".join([symptoms, duration]).lower()
        possible_conditions = [
            condition for condition, keywords in _DERMATOLOGY_MATCHERS.items() if any(keyword in text for keyword in keywords)
        ]
        image_observations = self._analyze_images(images, symptoms)
        red_flags = self._red_flags(text, image_observations)
        urgency = self._urgency(text, possible_conditions, red_flags)
        action = {
            "cosmetic_concern": RecommendedAction.SELF_CARE,
            "treatable_condition": RecommendedAction.CONSULT_DOCTOR,
            "needs_biopsy": RecommendedAction.CONSULT_DOCTOR,
            "urgent_dermatology_referral": RecommendedAction.URGENT_CARE,
        }[urgency]
        summary = self._build_summary(possible_conditions, urgency, duration, image_observations)
        follow_up_questions = self._follow_up_questions(possible_conditions, urgency)

        return DermatologyAssessment(
            urgency=urgency,
            possible_conditions=possible_conditions or ["Unclear skin condition pattern"],
            summary=summary,
            recommended_action=action,
            follow_up_questions=follow_up_questions,
            red_flags=red_flags,
            image_observations=image_observations,
            image_analysis_summary=" ".join(item.summary for item in image_observations if item.summary).strip(),
        )

    def _analyze_images(self, images: list[str], symptoms: str) -> list[ImageAnalysis]:
        analyses: list[ImageAnalysis] = []
        for image_url in images:
            try:
                analyses.append(self.image_analyzer.analyze_image(image_url, f"Skin symptom context: {symptoms}"))
            except Exception as exc:
                analyses.append(
                    ImageAnalysis(
                        observations=[],
                        concerning_features=[],
                        quality_issues=[f"Image analysis unavailable: {exc}"],
                        summary="Skin image could not be analyzed.",
                    )
                )
        return analyses

    @staticmethod
    def _red_flags(text: str, image_observations: list[ImageAnalysis]) -> list[str]:
        red_flags: list[str] = []
        for urgency, patterns in _RED_FLAG_PATTERNS.items():
            if any(pattern in text for pattern in patterns):
                red_flags.append(urgency.replace("_", " "))
        flattened = " ".join(
            item
            for analysis in image_observations
            for item in [*analysis.concerning_features, *analysis.observations, analysis.summary]
            if item
        ).lower()
        if any(term in flattened for term in ["asymmetry", "irregular", "variegated", "ulcerated", "bleeding"]):
            red_flags.append("needs biopsy")
        return list(dict.fromkeys(red_flags))

    @staticmethod
    def _urgency(text: str, possible_conditions: list[str], red_flags: list[str]) -> Literal["cosmetic_concern", "treatable_condition", "needs_biopsy", "urgent_dermatology_referral"]:
        if any(flag == "urgent dermatology referral" for flag in red_flags):
            return "urgent_dermatology_referral"
        if any(flag == "needs biopsy" for flag in red_flags) or "Suspicious pigmented lesion" in possible_conditions:
            return "needs_biopsy"
        if possible_conditions and all(condition == "Acne" for condition in possible_conditions) and "pain" not in text and "fever" not in text:
            return "cosmetic_concern"
        if not possible_conditions and not red_flags:
            return "treatable_condition"
        return "treatable_condition"

    @staticmethod
    def _build_summary(
        possible_conditions: list[str],
        urgency: str,
        duration: str,
        image_observations: list[ImageAnalysis],
    ) -> str:
        condition_summary = ", ".join(possible_conditions) if possible_conditions else "an unclear skin pattern"
        image_note = " Images were reviewed for observational support." if image_observations else " Uploading clear skin images can improve triage quality."
        return f"Symptoms and duration ({duration}) suggest {condition_summary} with {urgency.replace('_', ' ')} priority.{image_note}"

    @staticmethod
    def _follow_up_questions(possible_conditions: list[str], urgency: str) -> list[str]:
        questions = [
            "How long has the rash or skin change been present, and is it spreading?",
            "Is there itching, pain, drainage, fever, or swelling?",
            "Have you started any new soaps, creams, medications, cosmetics, or foods recently?",
        ]
        if "Suspicious pigmented lesion" in possible_conditions or urgency == "needs_biopsy":
            questions.extend(
                [
                    "Has the spot changed in size, color, border, or symmetry?",
                    "Has the lesion bled, crusted, or failed to heal?",
                ]
            )
        return questions[:5]
