from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="AITriage Backend", env="APP_NAME")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", env="API_V1_PREFIX")
    database_url: str = Field(default="sqlite:///./aitriage.db", env="DATABASE_URL")
    jwt_secret_key: str = Field(default="change-me", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    ai_service_url: str = Field(default="http://localhost:8080", env="AI_SERVICE_URL")
    create_tables_on_startup: bool = Field(default=True, env="CREATE_TABLES_ON_STARTUP")
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:19006",
            "http://127.0.0.1:3000",
        ],
        env="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()
