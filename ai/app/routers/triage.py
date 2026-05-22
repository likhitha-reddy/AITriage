from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.engine.triage_engine import TriageEngine
from app.models.progress import ProgressAssessment, ProgressCheckIn
from app.models.triage import TriageRequest, TriageResponse

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


@router.post("/triage/progress", response_model=ProgressAssessment)
def submit_progress(check_in: ProgressCheckIn) -> ProgressAssessment:
    try:
        return engine.assess_progress(check_in)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Progress analysis failed: {exc}") from exc
