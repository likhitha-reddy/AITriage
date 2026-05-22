from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.engine.dermatology import DermatologyAssessment, DermatologyRequest
from app.engine.mental_health import MentalHealthAssessment, MentalHealthScreenRequest
from app.engine.triage_engine import TriageEngine
from app.models.progress import ProgressAssessment, ProgressEvaluationRequest
from app.models.triage import FollowUpQuestionsResponse, TriageRequest, TriageResponse

router = APIRouter(tags=["triage"])
engine = TriageEngine()


@router.post("/triage", response_model=TriageResponse)
def submit_triage(request: TriageRequest) -> TriageResponse:
    try:
        return engine.analyze_symptoms(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Triage analysis failed: {exc}") from exc


@router.post("/triage/mental-health", response_model=MentalHealthAssessment)
def submit_mental_health_screen(request: MentalHealthScreenRequest) -> MentalHealthAssessment:
    try:
        return engine.screen_mental_health(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mental health screening failed: {exc}") from exc


@router.post("/triage/dermatology", response_model=DermatologyAssessment)
def submit_dermatology_assessment(request: DermatologyRequest) -> DermatologyAssessment:
    try:
        return engine.assess_dermatology(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dermatology assessment failed: {exc}") from exc


@router.post("/triage/progress", response_model=ProgressAssessment)
def submit_progress(request: ProgressEvaluationRequest) -> ProgressAssessment:
    try:
        return engine.assess_progress(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Progress analysis failed: {exc}") from exc


@router.get("/triage/follow-up-questions/{triage_id}", response_model=FollowUpQuestionsResponse)
def get_follow_up_questions(triage_id: str) -> FollowUpQuestionsResponse:
    try:
        return engine.get_follow_up_questions(triage_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Triage record not found.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Follow-up question generation failed: {exc}") from exc
