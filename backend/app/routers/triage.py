from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.triage import TriageResult
from app.models.user import User
from app.schemas.triage import TriageResultCreate, TriageResultResponse

router = APIRouter(prefix="/triage", tags=["triage"])


def _placeholder_triage(symptoms_text: str, image_urls: List[str]) -> dict:
    text = symptoms_text.lower()
    if any(keyword in text for keyword in ["rash", "skin", "itch", "acne"]):
        diagnoses = ["Dermatitis", "Acne flare"]
        recommended_action = "Schedule a dermatology consultation"
    elif any(keyword in text for keyword in ["anxious", "anxiety", "stress", "panic", "sad"]):
        diagnoses = ["Anxiety symptoms", "Stress response"]
        recommended_action = "Schedule a mental health consultation"
    else:
        diagnoses = ["General review required"]
        recommended_action = "Schedule a general consultation"

    return {
        "ai_analysis": {
            "status": "placeholder",
            "summary": "Rule-based placeholder response until AI triage service is integrated.",
            "received_image_count": len(image_urls),
        },
        "possible_diagnoses": diagnoses,
        "confidence_score": 0.45,
        "recommended_action": recommended_action,
    }


@router.post("/", response_model=TriageResultResponse, status_code=status.HTTP_201_CREATED)
def submit_triage(
    payload: TriageResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TriageResultResponse:
    placeholder = _placeholder_triage(payload.symptoms_text, payload.image_urls)
    triage_result = TriageResult(
        patient_id=current_user.id,
        symptoms_text=payload.symptoms_text,
        image_urls=payload.image_urls,
        ai_analysis=placeholder["ai_analysis"],
        possible_diagnoses=placeholder["possible_diagnoses"],
        confidence_score=placeholder["confidence_score"],
        recommended_action=placeholder["recommended_action"],
    )
    db.add(triage_result)
    db.commit()
    db.refresh(triage_result)
    return triage_result


@router.get("/{triage_result_id}", response_model=TriageResultResponse)
def get_triage_result(
    triage_result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TriageResultResponse:
    triage_result = db.get(TriageResult, triage_result_id)
    if triage_result is None or triage_result.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Triage result not found")
    return triage_result
