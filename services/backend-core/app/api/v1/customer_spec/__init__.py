"""
Customer Spec Management API
"""
from fastapi import APIRouter
from . import spec_routes, spec_crud, spec_json, ai_judgment, measurement_param

router = APIRouter()

# 각 sub-router 등록
router.include_router(spec_routes.router, tags=["Customer Spec Search"])
router.include_router(spec_crud.router, tags=["Customer Spec CRUD"])
router.include_router(spec_json.router, tags=["Customer Spec JSON"])
router.include_router(ai_judgment.router, tags=["AI Judgment"])
router.include_router(measurement_param.router, tags=["Measurement Parameters"])
