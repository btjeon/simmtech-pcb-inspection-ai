"""
FastAPI Main Application
AI/ML 전용 백엔드 - GPU 기반 추론 및 학습
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import inference, training, models, images, datasets, extraction
from app.api.v1 import customer_spec, slicer, rca, tas
from app.api.v1.tas import database as tas_db
from app.core.config import settings
from app.database.connection import engine
from app.database.schema import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 이벤트"""
    # 시작 시: DB 테이블 생성
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")
    # TAS SQLite DB 초기화
    try:
        tas_db.init_db()
        print("TAS database initialized successfully")
    except Exception as e:
        print(f"TAS database initialization error: {e}")
    yield
    # 종료 시: 정리 작업 (필요시)

# FastAPI 앱 생성
app = FastAPI(
    title="PCB Inspection AI Backend",
    description="AI/ML 전용 백엔드 - 추론, 학습, 이미지 처리",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(inference.router, prefix="/api/v1", tags=["AI Inference"])
app.include_router(training.router, prefix="/api/v1", tags=["AI Training"])
app.include_router(models.router, prefix="/api/v1", tags=["Model Management"])
app.include_router(images.router, prefix="/api/v1", tags=["Image Processing"])
app.include_router(datasets.router, prefix="/api/v1", tags=["Dataset Management"])
app.include_router(extraction.router, prefix="/api/v1", tags=["Defect Extraction"])
app.include_router(customer_spec.router, prefix="/api/v1/customer-spec", tags=["Customer Spec Management"])
app.include_router(slicer.router, prefix="/api/v1/slicer", tags=["Image Slicer"])
app.include_router(rca.router, prefix="/api/v1/rca", tags=["RCA Analysis"])
app.include_router(tas.router, prefix="/api/v1/tas", tags=["TAS - System 이상발생 분석"])


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "PCB Inspection AI Backend",
        "version": "2.0.0",
        "service": "AI/ML Processing"
    }


@app.get("/api/ai/health")
async def health_check():
    """헬스 체크"""
    import torch

    return {
        "status": "healthy",
        "service": "AI Backend",
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
