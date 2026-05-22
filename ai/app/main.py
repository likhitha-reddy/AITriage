from __future__ import annotations

from fastapi import FastAPI

from app.config import get_settings
from app.routers.triage import router as triage_router

settings = get_settings()
app = FastAPI(
    title="AITriage AI Engine",
    version="0.1.0",
    description="AI triage microservice for symptom intake, image review, and progress tracking.",
)
app.include_router(triage_router)


@app.get("/health")
def health_check() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "provider": settings.llm_provider,
        "model": settings.model_name,
        "configured": bool(settings.active_api_key),
    }
