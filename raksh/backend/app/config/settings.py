import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "RAKSH"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://raksh:raksh_secret@db:5432/raksh"
    DATABASE_SYNC_URL: str = "postgresql://raksh:raksh_secret@db:5432/raksh"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET: str = "change-this-to-a-strong-random-secret-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SMTP (Outlook)
    SMTP_HOST: str = "smtp.office365.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "raksh.bug@outlook.com"
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True

    # AI Model
    AI_MODEL_PATH: str = "models/phishing-detection"
    AI_CONFIDENCE_THRESHOLD: float = 0.5
    AI_BATCH_SIZE: int = 8
    AI_MAX_TEXT_LENGTH: int = 512

    # CORS
    CORS_ORIGINS: str = "http://localhost:5500,http://localhost:8000,http://localhost,null,file://"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    # Encryption
    ENCRYPTION_KEY: str = ""

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    LOG_DIR: Path = Path(BASE_DIR) / "logs"
    UPLOAD_DIR: Path = Path(BASE_DIR) / "uploads"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
