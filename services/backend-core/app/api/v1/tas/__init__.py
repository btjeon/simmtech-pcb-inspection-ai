"""
TAS (Technical Action Summary) - System 이상발생 분석 관리
"""
from fastapi import APIRouter
from .routes import router as _tas_router

router = APIRouter()
router.include_router(_tas_router)
