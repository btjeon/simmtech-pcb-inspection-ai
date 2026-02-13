"""
Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PCB Inspection AI Backend"

    # CORS 설정
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pcb_inspection"

    # MinIO 설정
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "pcb-images"
    MINIO_SECURE: bool = False

    # MLflow 설정
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "pcb-inspection"

    # AI 모델 설정
    MODEL_PATH: str = "./models"
    DEFAULT_MODEL_NAME: str = "pcb_detector_v1"

    # GPU 설정
    USE_GPU: bool = True
    GPU_DEVICE_ID: int = 0

    # OpenAI 설정 (RCA)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # JWT 설정
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
