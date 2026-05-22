from __future__ import annotations

from app.models.diagnosis import Diagnosis

_SPECIALIZATION_KEYWORDS = {
    "psychiatry": ["anxiety", "depression", "panic", "ptsd", "insomnia", "self-harm", "suicid"],
    "dermatology": ["rash", "eczema", "psoriasis", "dermatitis", "acne", "hives", "skin", "lesion", "mole"],
    "ENT": ["sinus", "ear", "throat", "tonsil", "voice", "hearing"],
    "general practice": ["fever", "cough", "fatigue", "headache", "nausea"],
    "emergency medicine": ["chest pain", "difficulty breathing", "stroke", "bleeding", "seizure"],
}


def recommend_specialization(diagnoses: list[Diagnosis], symptoms_text: str = "") -> str:
    haystack = " ".join([symptoms_text, *[diagnosis.name for diagnosis in diagnoses]]).lower()
    for specialization, keywords in _SPECIALIZATION_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return specialization
    return "general practice"
