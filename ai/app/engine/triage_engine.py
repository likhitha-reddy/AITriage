from __future__ import annotations

import json
import re
from typing import Any

from anthropic import Anthropic
from openai import OpenAI

from app.config import Settings, get_settings
from app.engine.image_analyzer import ImageAnalyzer
from app.engine.prompt_templates import PROGRESS_CHECK_PROMPT, TRIAGE_SYSTEM_PROMPT, TRIAGE_USER_TEMPLATE
from app.engine.safety import apply_guardrails, build_emergency_response, detect_emergency
from app.engine.specialization_matcher import recommend_specialization
from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.progress import ProgressAssessment, ProgressCheckIn
from app.models.triage import ImageAnalysis, SeverityLevel, TriageRequest, TriageResponse


class TriageEngine:
    def __init__(self, settings: Settings | None = None, image_analyzer: ImageAnalyzer | None = None) -> None:
        self.settings = settings or get_settings()
        self.image_analyzer = image_analyzer or ImageAnalyzer(self.settings)

    def analyze_symptoms(self, request: TriageRequest) -> TriageResponse:
        if detect_emergency(request.symptoms_text, request.medical_history):
            return build_emergency_response("Emergency symptoms were identified from the patient history.")

        image_observations = self._analyze_images(request)
        user_prompt = TRIAGE_USER_TEMPLATE.format(
            symptoms_text=request.symptoms_text,
            patient_age=request.patient_age if request.patient_age is not None else "unknown",
            patient_gender=request.patient_gender or "not provided",
            medical_history=", ".join(request.medical_history) if request.medical_history else "none provided",
            image_observations=json.dumps([image.model_dump() for image in image_observations], ensure_ascii=False),
        )
        payload = self._call_llm_json(TRIAGE_SYSTEM_PROMPT, user_prompt)
        response = self._build_triage_response(payload, image_observations)
        response.referral_specialization = recommend_specialization(response.possible_diagnoses, request.symptoms_text)
        return apply_guardrails(response, request, self.settings.confidence_threshold, self.settings.max_diagnoses)

    def assess_progress(self, check_in: ProgressCheckIn) -> ProgressAssessment:
        if detect_emergency(check_in.symptoms_current, check_in.new_symptoms):
            return ProgressAssessment(
                trend="worsening",
                recommendation="Emergency warning signs were detected. Seek urgent in-person evaluation immediately.",
                needs_reconsultation=True,
            )

        prompt = PROGRESS_CHECK_PROMPT.format(
            symptoms_current=check_in.symptoms_current,
            improvement_rating=check_in.improvement_rating,
            new_symptoms=", ".join(check_in.new_symptoms) if check_in.new_symptoms else "none",
        )
        payload = self._call_llm_json(
            "You review patient follow-up progress conservatively and recommend clinician follow-up when appropriate.",
            prompt,
        )
        assessment = ProgressAssessment.model_validate(payload)
        if check_in.improvement_rating <= 3 or check_in.new_symptoms:
            assessment.needs_reconsultation = True
            if "doctor" not in assessment.recommendation.lower() and "clinician" not in assessment.recommendation.lower():
                assessment.recommendation = f"{assessment.recommendation} Please check in with a clinician."
        return assessment

    def _analyze_images(self, request: TriageRequest) -> list[ImageAnalysis]:
        image_observations: list[ImageAnalysis] = []
        for image_url in request.image_urls:
            try:
                image_observations.append(self.image_analyzer.analyze_image(image_url, request.symptoms_text))
            except Exception as exc:
                image_observations.append(
                    ImageAnalysis(
                        observations=[],
                        concerning_features=[],
                        quality_issues=[f"Image analysis unavailable: {exc}"],
                        summary="Image could not be analyzed.",
                    )
                )
        return image_observations

    def _build_triage_response(self, payload: dict[str, Any], image_observations: list[ImageAnalysis]) -> TriageResponse:
        raw_diagnoses = payload.get("possible_diagnoses") or []
        diagnoses: list[Diagnosis] = []
        confidence_scores = payload.get("confidence_scores") or {}

        for item in raw_diagnoses:
            if isinstance(item, dict):
                diagnoses.append(Diagnosis.model_validate(item))
                continue
            if isinstance(item, str):
                diagnoses.append(
                    Diagnosis(
                        name=item,
                        icd_code_hint=None,
                        probability=float(confidence_scores.get(item, 0.4)),
                        description=f"Possible pattern requiring clinician review for {item}.",
                        urgency="routine",
                    )
                )

        if not confidence_scores:
            confidence_scores = {diagnosis.name: diagnosis.probability for diagnosis in diagnoses}

        return TriageResponse(
            possible_diagnoses=diagnoses,
            confidence_scores=confidence_scores,
            severity_level=payload.get("severity_level", SeverityLevel.MODERATE),
            recommended_action=payload.get("recommended_action", RecommendedAction.CONSULT_DOCTOR),
            follow_up_questions=list(payload.get("follow_up_questions") or []),
            referral_specialization=payload.get("referral_specialization"),
            image_observations=image_observations,
            disclaimers=list(payload.get("disclaimers") or []),
        )

    def _call_llm_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if self.settings.llm_provider == "anthropic":
            if not self.settings.anthropic_api_key:
                raise RuntimeError("ANTHROPIC_API_KEY is not configured.")
            return self._anthropic_json_request(system_prompt, user_prompt)
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        return self._openai_json_request(system_prompt, user_prompt)

    def _openai_json_request(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        client = OpenAI(api_key=self.settings.openai_api_key, timeout=self.settings.request_timeout_seconds)
        response = client.chat.completions.create(
            model=self.settings.model_name,
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        return self._extract_json(content)

    def _anthropic_json_request(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        client = Anthropic(api_key=self.settings.anthropic_api_key, timeout=self.settings.request_timeout_seconds)
        response = client.messages.create(
            model=self.settings.model_name,
            max_tokens=1400,
            temperature=0,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        content = "\n".join(block.text for block in response.content if getattr(block, "type", None) == "text")
        return self._extract_json(content)

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any]:
        stripped = content.strip()
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", stripped, re.DOTALL)
            if not match:
                raise ValueError("Model response did not include valid JSON.")
            return json.loads(match.group(0))
