from __future__ import annotations

import pytest

from app.config import Settings
from app.engine.triage_engine import TriageEngine


@pytest.fixture()
def ai_settings() -> Settings:
    return Settings(
        openai_api_key="test-key",
        anthropic_api_key=None,
        llm_provider="openai",
        model_name="test-model",
        vision_model_name="test-vision-model",
        confidence_threshold=0.35,
        max_diagnoses=3,
        request_timeout_seconds=30,
    )


@pytest.fixture()
def engine(ai_settings: Settings) -> TriageEngine:
    return TriageEngine(settings=ai_settings)
