import json
import os
from functools import lru_cache
from typing import List
from urllib.parse import urlparse

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_service_url(value: str) -> str:
    normalized = value.strip().rstrip("/")
    if not normalized:
        return "http://localhost:8001"
    if "://" not in normalized:
        normalized = f"http://{normalized.lstrip('/')}"
    parsed = urlparse(normalized)
    if not parsed.netloc and parsed.path:
        normalized = f"http://{parsed.path.lstrip('/')}"
    return normalized.rstrip("/")


class Settings(BaseSettings):
    app_name: str = Field(default="AITriage Backend")
    environment: str = Field(default="development")
    debug: bool = Field(default=True)
    api_v1_prefix: str = Field(default="/api/v1")
    database_url: str = Field(default="sqlite:///./aitriage.db")
    jwt_secret_key: str = Field(default="change-me", validation_alias=AliasChoices("JWT_SECRET_KEY", "JWT_SECRET"))
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    refresh_token_expire_days: int = Field(default=7)
    ai_service_url: str = Field(default="http://localhost:8001")
    create_tables_on_startup: bool = Field(default=True)
    render: bool = Field(default=False, validation_alias=AliasChoices("RENDER"))
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:19006,http://127.0.0.1:3000,http://localhost:8081,exp://127.0.0.1:19000"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.cors_origins:
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def parse_database_url(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("ai_service_url", mode="before")
    @classmethod
    def parse_ai_service_url(cls, value: str) -> str:
        if isinstance(value, str):
            return _normalize_service_url(value)
        return value

    @model_validator(mode="after")
    def apply_render_defaults(self) -> "Settings":
        self.ai_service_url = _normalize_service_url(self.ai_service_url)
        if self.render and self.environment == "development":
            self.environment = "production"
        if self.render and os.getenv("CREATE_TABLES_ON_STARTUP") is None:
            self.create_tables_on_startup = False
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
