from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field

_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_ENV_PATH, override=False)


class Settings(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    openai_api_key: str | None = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    anthropic_api_key: str | None = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"))
    llm_provider: str = Field(default_factory=lambda: os.getenv("LLM_PROVIDER", "openai").lower())
    model_name: str = Field(default_factory=lambda: os.getenv("MODEL_NAME", "gpt-4.1-mini"))
    vision_model_name: str = Field(default_factory=lambda: os.getenv("VISION_MODEL_NAME", os.getenv("MODEL_NAME", "gpt-4.1-mini")))
    confidence_threshold: float = Field(default_factory=lambda: float(os.getenv("CONFIDENCE_THRESHOLD", "0.35")))
    max_diagnoses: int = Field(default_factory=lambda: int(os.getenv("MAX_DIAGNOSES", "3")))
    request_timeout_seconds: float = Field(default_factory=lambda: float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30")))

    def model_post_init(self, __context: object) -> None:
        self.llm_provider = self.llm_provider.lower()
        if self.llm_provider not in {"openai", "anthropic"}:
            raise ValueError("LLM_PROVIDER must be 'openai' or 'anthropic'.")
        self.confidence_threshold = min(max(self.confidence_threshold, 0.0), 1.0)
        self.max_diagnoses = max(1, self.max_diagnoses)
        self.request_timeout_seconds = max(5.0, self.request_timeout_seconds)

    @property
    def active_api_key(self) -> str | None:
        if self.llm_provider == "anthropic":
            return self.anthropic_api_key
        return self.openai_api_key


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
