from __future__ import annotations

import json
import re
import uuid
from typing import Any

from anthropic import Anthropic
from openai import OpenAI

from app.config import Settings, get_settings
from app.engine.dermatology import DermatologyAnalyzer, DermatologyAssessment, DermatologyRequest
from app.engine.image_analyzer import ImageAnalyzer
from app.engine.mental_health import MentalHealthAssessment, MentalHealthScreenRequest, MentalHealthScreener
from app.engine.progress_tracker import ProgressTracker
from app.engine.prompt_templates import (
    DERMATOLOGY_TRIAGE_PROMPT,
    FOLLOW_UP_QUESTIONS,
    MENTAL_HEALTH_TRIAGE_PROMPT,
    PROGRESS_CHECK_PROMPT,
    TRIAGE_SYSTEM_PROMPT,
    TRIAGE_USER_TEMPLATE,
)
from app.engine.safety import apply_guardrails, build_emergency_response, detect_emergency
from app.engine.specialization_matcher import recommend_specialization
from app.models.diagnosis import Diagnosis, RecommendedAction
from app.models.progress import ProgressAssessment, ProgressCheckIn, ProgressEvaluationRequest
from app.models.triage import ConversationTurn, FollowUpQuestionsResponse, ImageAnalysis, SeverityLevel, TriageRequest, TriageResponse


class TriageEngine:
    def __init__(self, settings: Settings | None = None, image_analyzer: ImageAnalyzer | None = None) -> None:
        self.settings = settings or get_settings()
        self.image_analyzer = image_analyzer or ImageAnalyzer(self.settings)
        self.mental_health_screener = MentalHealthScreener()
        self.dermatology_analyzer = DermatologyAnalyzer(self.image_analyzer)
        self.progress_tracker = ProgressTracker(self.mental_health_screener)
        self._triage_records: dict[str, TriageResponse] = {}
        self._conversation_records: dict[str, list[ConversationTurn]] = {}

    def analyze_symptoms(self, request: TriageRequest) -> TriageResponse:
        triage_id = request.triage_id or str(uuid.uuid4())
        combined_history = self._merge_conversation_history(triage_id, request.conversation_history)
        enriched_request = request.model_copy(update={"triage_id": triage_id, "conversation_history": combined_history})
        detected_domain = self._detect_domain(enriched_request)

        if detect_emergency(enriched_request.symptoms_text, enriched_request.medical_history):
            emergency_response = build_emergency_response(
                "Emergency symptoms were identified from the patient history.",
                triage_id=triage_id,
                detected_domain=detected_domain,
            )
            self._store_triage_context(enriched_request, emergency_response)
            return emergency_response

        image_observations = self._analyze_images(enriched_request)
        general_payload = self._generate_general_payload(enriched_request, image_observations, detected_domain)
        general_response = self._build_triage_response(general_payload, image_observations, triage_id, detected_domain)
        specialized_response = self._specialized_response(enriched_request, detected_domain)

        combined_response = self._merge_triage_responses(general_response, specialized_response, triage_id, detected_domain)
        combined_response.referral_specialization = recommend_specialization(
            combined_response.possible_diagnoses,
            enriched_request.symptoms_text,
        )
        guarded_response = apply_guardrails(combined_response, enriched_request, self.settings.confidence_threshold, self.settings.max_diagnoses)
        guarded_response.follow_up_questions = self._generate_follow_up_questions(enriched_request, guarded_response)
        self._store_triage_context(enriched_request, guarded_response)
        return guarded_response

    def screen_mental_health(self, request: MentalHealthScreenRequest) -> MentalHealthAssessment:
        return self.mental_health_screener.screen(request.symptoms, request.patient_history)

    def assess_dermatology(self, request: DermatologyRequest) -> DermatologyAssessment:
        return self.dermatology_analyzer.analyze(request.symptoms, request.images, request.duration)

    def assess_progress(self, request: ProgressEvaluationRequest | ProgressCheckIn) -> ProgressAssessment:
        if isinstance(request, ProgressCheckIn):
            if detect_emergency(request.symptoms_current, request.new_symptoms):
                return ProgressAssessment(
                    trend="worsening",
                    recommendation="Emergency warning signs were detected. Seek urgent in-person evaluation immediately.",
                    needs_reconsultation=True,
                )
            prompt = PROGRESS_CHECK_PROMPT.format(
                symptoms_current=request.symptoms_current,
                improvement_rating=request.improvement_rating,
                new_symptoms=", ".join(request.new_symptoms) if request.new_symptoms else "none",
            )
            payload = self._call_llm_json(
                "You review patient follow-up progress conservatively and recommend clinician follow-up when appropriate.",
                prompt,
            )
            assessment = ProgressAssessment.model_validate(payload)
            if request.improvement_rating <= 3 or request.new_symptoms:
                assessment.needs_reconsultation = True
                if "doctor" not in assessment.recommendation.lower() and "clinician" not in assessment.recommendation.lower():
                    assessment.recommendation = f"{assessment.recommendation} Please check in with a clinician."
            return assessment
        return self.progress_tracker.evaluate_progress(request.check_ins, request.original_triage)

    def get_follow_up_questions(self, triage_id: str) -> FollowUpQuestionsResponse:
        response = self._triage_records[triage_id]
        return FollowUpQuestionsResponse(
            triage_id=triage_id,
            detected_domain=response.detected_domain,
            follow_up_questions=response.follow_up_questions,
        )

    def _generate_general_payload(
        self,
        request: TriageRequest,
        image_observations: list[ImageAnalysis],
        detected_domain: str,
    ) -> dict[str, Any]:
        system_prompt = self._system_prompt_for_domain(detected_domain)
        user_prompt = TRIAGE_USER_TEMPLATE.format(
            domain_hint=detected_domain,
            symptoms_text=request.symptoms_text,
            patient_age=request.patient_age if request.patient_age is not None else "unknown",
            patient_gender=request.patient_gender or "not provided",
            medical_history=", ".join(request.medical_history) if request.medical_history else "none provided",
            image_observations=json.dumps([image.model_dump() for image in image_observations], ensure_ascii=False),
            conversation_history=json.dumps([turn.model_dump() for turn in request.conversation_history], ensure_ascii=False),
        )
        if self.settings.active_api_key:
            try:
                return self._call_llm_json(system_prompt, user_prompt)
            except Exception:
                pass
        return self._heuristic_general_payload(request.symptoms_text, detected_domain)

    def _specialized_response(self, request: TriageRequest, detected_domain: str) -> TriageResponse | None:
        if detected_domain == "mental_health":
            assessment = self.mental_health_screener.screen(
                request.symptoms_text,
                "; ".join(request.medical_history),
            )
            return self._mental_health_to_triage_response(assessment, request.triage_id or "")
        if detected_domain == "dermatology":
            duration = self._extract_duration(request.symptoms_text, request.medical_history)
            assessment = self.dermatology_analyzer.analyze(request.symptoms_text, request.image_urls, duration)
            return self._dermatology_to_triage_response(assessment, request.triage_id or "")
        return None

    def _merge_triage_responses(
        self,
        general_response: TriageResponse,
        specialized_response: TriageResponse | None,
        triage_id: str,
        detected_domain: str,
    ) -> TriageResponse:
        if specialized_response is None:
            general_response.triage_id = triage_id
            general_response.detected_domain = detected_domain
            return general_response

        diagnosis_map: dict[str, Diagnosis] = {}
        for diagnosis in [*specialized_response.possible_diagnoses, *general_response.possible_diagnoses]:
            existing = diagnosis_map.get(diagnosis.name)
            if existing is None or diagnosis.probability > existing.probability:
                diagnosis_map[diagnosis.name] = diagnosis
        diagnoses = list(diagnosis_map.values())
        follow_up_questions = list(dict.fromkeys([*specialized_response.follow_up_questions, *general_response.follow_up_questions]))
        disclaimers = list(dict.fromkeys([*general_response.disclaimers, *specialized_response.disclaimers]))
        image_observations = specialized_response.image_observations or general_response.image_observations
        severity_level = self._max_severity(general_response.severity_level, specialized_response.severity_level)
        recommended_action = self._max_action(general_response.recommended_action, specialized_response.recommended_action)

        return TriageResponse(
            triage_id=triage_id,
            detected_domain=detected_domain,
            possible_diagnoses=diagnoses,
            confidence_scores={diagnosis.name: diagnosis.probability for diagnosis in diagnoses},
            severity_level=severity_level,
            recommended_action=recommended_action,
            follow_up_questions=follow_up_questions,
            referral_specialization=specialized_response.referral_specialization or general_response.referral_specialization,
            image_observations=image_observations,
            disclaimers=disclaimers,
        )

    def _generate_follow_up_questions(self, request: TriageRequest, response: TriageResponse) -> list[str]:
        fallback_questions = self._fallback_follow_up_questions(request, response)
        if not self.settings.active_api_key:
            return fallback_questions
        prompt = FOLLOW_UP_QUESTIONS.format(
            symptoms_text=request.symptoms_text,
            detected_domain=response.detected_domain,
            assessment_summary=json.dumps(response.model_dump(exclude={"image_observations"}), ensure_ascii=False),
            conversation_history=json.dumps([turn.model_dump() for turn in request.conversation_history], ensure_ascii=False),
        )
        try:
            payload = self._call_llm_json("You generate only follow-up triage questions in JSON.", prompt)
            questions = list(payload.get("questions") or [])
            return list(dict.fromkeys([*questions, *fallback_questions]))[:5]
        except Exception:
            return fallback_questions

    def _fallback_follow_up_questions(self, request: TriageRequest, response: TriageResponse) -> list[str]:
        if response.detected_domain == "mental_health":
            questions = [
                "How long have these mood, anxiety, or sleep symptoms been affecting daily life?",
                "Have you had any thoughts of self-harm, suicide, or feeling unsafe?",
                "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
                "Over the last 2 weeks, how often have you felt nervous, anxious, or unable to control worrying?",
            ]
        elif response.detected_domain == "dermatology":
            questions = [
                "How long has the skin change been present, and is it spreading or changing?",
                "Is there itch, pain, blistering, bleeding, or fever?",
                "Have you uploaded clear skin photos, or can you share if the lesion changed in color, border, or size?",
            ]
        else:
            questions = [
                "When did the symptoms start, and are they improving or worsening?",
                "Are there any new red-flag symptoms such as severe pain, fainting, or difficulty breathing?",
                "What treatments or medicines have already been tried?",
            ]
        existing = response.follow_up_questions or []
        return list(dict.fromkeys([*existing, *questions]))[:5]

    def _merge_conversation_history(self, triage_id: str, incoming: list[ConversationTurn]) -> list[ConversationTurn]:
        stored = list(self._conversation_records.get(triage_id, []))
        seen = {(turn.role, turn.content) for turn in stored}
        for turn in incoming:
            key = (turn.role, turn.content)
            if key not in seen:
                stored.append(turn)
                seen.add(key)
        return stored

    def _store_triage_context(self, request: TriageRequest, response: TriageResponse) -> None:
        triage_id = response.triage_id or request.triage_id or str(uuid.uuid4())
        conversation_history = self._merge_conversation_history(triage_id, request.conversation_history)
        conversation_history.append(ConversationTurn(role="user", content=request.symptoms_text))
        if response.possible_diagnoses:
            summary = ", ".join(diagnosis.name for diagnosis in response.possible_diagnoses[:3])
        else:
            summary = response.referral_specialization or "triage review"
        conversation_history.append(ConversationTurn(role="assistant", content=f"Triage summary: {summary}"))
        self._conversation_records[triage_id] = conversation_history[-12:]
        response.triage_id = triage_id
        self._triage_records[triage_id] = response

    def _detect_domain(self, request: TriageRequest) -> str:
        combined_text = " ".join([request.symptoms_text, *request.medical_history]).lower()
        mental_keywords = ["anxiety", "depress", "panic", "stress", "insomnia", "sleep", "ptsd", "trauma", "hopeless"]
        dermatology_keywords = ["rash", "skin", "eczema", "psoriasis", "acne", "mole", "itchy", "lesion", "fungal"]
        mental_score = sum(1 for keyword in mental_keywords if keyword in combined_text)
        dermatology_score = sum(1 for keyword in dermatology_keywords if keyword in combined_text)
        if request.image_urls and dermatology_score:
            dermatology_score += 1
        if mental_score > dermatology_score and mental_score > 0:
            return "mental_health"
        if dermatology_score > 0:
            return "dermatology"
        return "general"

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

    def _build_triage_response(
        self,
        payload: dict[str, Any],
        image_observations: list[ImageAnalysis],
        triage_id: str,
        detected_domain: str,
    ) -> TriageResponse:
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
            triage_id=triage_id,
            detected_domain=detected_domain,
            possible_diagnoses=diagnoses,
            confidence_scores=confidence_scores,
            severity_level=payload.get("severity_level", SeverityLevel.MODERATE),
            recommended_action=payload.get("recommended_action", RecommendedAction.CONSULT_DOCTOR),
            follow_up_questions=list(payload.get("follow_up_questions") or []),
            referral_specialization=payload.get("referral_specialization"),
            image_observations=image_observations,
            disclaimers=list(payload.get("disclaimers") or []),
        )

    def _mental_health_to_triage_response(self, assessment: MentalHealthAssessment, triage_id: str) -> TriageResponse:
        severity_level = {
            "minimal": SeverityLevel.MILD,
            "mild": SeverityLevel.MILD,
            "moderate": SeverityLevel.MODERATE,
            "severe": SeverityLevel.EMERGENCY if assessment.crisis_detected else SeverityLevel.HIGH,
        }[assessment.severity]
        diagnoses = [
            Diagnosis(
                name=concern,
                icd_code_hint=None,
                probability=0.8 if assessment.crisis_detected else 0.65,
                description=assessment.summary,
                urgency="emergency" if assessment.crisis_detected else "urgent" if assessment.severity == "severe" else "routine",
            )
            for concern in (assessment.possible_concerns or ["Mental health symptom cluster"])
        ]
        disclaimers = [*assessment.disclaimers, *assessment.crisis_resources]
        return TriageResponse(
            triage_id=triage_id,
            detected_domain="mental_health",
            possible_diagnoses=diagnoses,
            confidence_scores={diagnosis.name: diagnosis.probability for diagnosis in diagnoses},
            severity_level=severity_level,
            recommended_action=assessment.recommended_action,
            follow_up_questions=assessment.follow_up_questions,
            referral_specialization=assessment.referral_specialization,
            disclaimers=disclaimers,
        )

    def _dermatology_to_triage_response(self, assessment: DermatologyAssessment, triage_id: str) -> TriageResponse:
        severity_level = {
            "cosmetic_concern": SeverityLevel.MILD,
            "treatable_condition": SeverityLevel.MODERATE,
            "needs_biopsy": SeverityLevel.HIGH,
            "urgent_dermatology_referral": SeverityLevel.HIGH,
        }[assessment.urgency]
        urgency = "urgent" if assessment.urgency in {"needs_biopsy", "urgent_dermatology_referral"} else "routine"
        diagnoses = [
            Diagnosis(
                name=condition,
                icd_code_hint=None,
                probability=0.7 if condition != "Unclear skin condition pattern" else 0.45,
                description=assessment.summary,
                urgency=urgency,
            )
            for condition in assessment.possible_conditions
        ]
        return TriageResponse(
            triage_id=triage_id,
            detected_domain="dermatology",
            possible_diagnoses=diagnoses,
            confidence_scores={diagnosis.name: diagnosis.probability for diagnosis in diagnoses},
            severity_level=severity_level,
            recommended_action=assessment.recommended_action,
            follow_up_questions=assessment.follow_up_questions,
            referral_specialization="dermatology",
            image_observations=assessment.image_observations,
            disclaimers=assessment.disclaimers,
        )

    def _heuristic_general_payload(self, symptoms_text: str, detected_domain: str) -> dict[str, Any]:
        symptoms_lower = symptoms_text.lower()
        if detected_domain == "mental_health":
            diagnoses = [{
                "name": "Mental health symptom pattern",
                "icd_code_hint": None,
                "probability": 0.55,
                "description": "Symptoms could reflect a mental health concern needing structured screening.",
                "urgency": "routine",
            }]
            referral = "psychiatry"
        elif detected_domain == "dermatology":
            diagnoses = [{
                "name": "Inflammatory skin condition",
                "icd_code_hint": None,
                "probability": 0.58,
                "description": "Symptoms could reflect a skin condition needing image-supported dermatology review.",
                "urgency": "routine",
            }]
            referral = "dermatology"
        elif any(term in symptoms_lower for term in ["cough", "sore throat", "fever"]):
            diagnoses = [{
                "name": "Upper respiratory illness pattern",
                "icd_code_hint": None,
                "probability": 0.52,
                "description": "Symptoms could reflect a common upper respiratory illness, but worsening symptoms need clinician review.",
                "urgency": "routine",
            }]
            referral = "general practice"
        else:
            diagnoses = [{
                "name": "Unclear symptom pattern",
                "icd_code_hint": None,
                "probability": 0.4,
                "description": "The symptom pattern is not specific enough for more confident triage.",
                "urgency": "routine",
            }]
            referral = "general practice"
        return {
            "possible_diagnoses": diagnoses,
            "confidence_scores": {item["name"]: item["probability"] for item in diagnoses},
            "severity_level": "moderate" if detected_domain != "general" else "mild",
            "recommended_action": "CONSULT_DOCTOR" if detected_domain != "general" else "SELF_CARE",
            "follow_up_questions": [],
            "referral_specialization": referral,
            "disclaimers": ["Fallback triage logic was used because model output was unavailable."],
        }

    @staticmethod
    def _extract_duration(symptoms_text: str, medical_history: list[str]) -> str:
        combined = " ".join([symptoms_text, *medical_history])
        match = re.search(r"(\b\d+\s+(?:day|days|week|weeks|month|months|year|years)\b)", combined.lower())
        if match:
            return match.group(1)
        return "not provided"

    @staticmethod
    def _system_prompt_for_domain(detected_domain: str) -> str:
        if detected_domain == "mental_health":
            return MENTAL_HEALTH_TRIAGE_PROMPT
        if detected_domain == "dermatology":
            return DERMATOLOGY_TRIAGE_PROMPT
        return TRIAGE_SYSTEM_PROMPT

    @staticmethod
    def _max_severity(first: SeverityLevel, second: SeverityLevel) -> SeverityLevel:
        ranking = {
            SeverityLevel.MILD: 1,
            SeverityLevel.MODERATE: 2,
            SeverityLevel.HIGH: 3,
            SeverityLevel.EMERGENCY: 4,
        }
        return first if ranking[first] >= ranking[second] else second

    @staticmethod
    def _max_action(first: RecommendedAction, second: RecommendedAction) -> RecommendedAction:
        ranking = {
            RecommendedAction.SELF_CARE: 1,
            RecommendedAction.CONSULT_DOCTOR: 2,
            RecommendedAction.URGENT_CARE: 3,
            RecommendedAction.EMERGENCY: 4,
        }
        return first if ranking[first] >= ranking[second] else second

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
