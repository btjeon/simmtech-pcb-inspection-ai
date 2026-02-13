"""
RCA (Root Cause Analysis) API Router
PCB 불량 이미지 분석 API
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.rca_service import rca_service

router = APIRouter()


# 저장 요청 모델
class ProcessCheck(BaseModel):
    process: str
    check: str


class AnalysisData(BaseModel):
    defect_detected: bool
    defect_type: str
    severity: str
    confidence: float
    location: str
    analysis: str
    causes: List[str]
    solutions: List[str]
    process_checks: List[ProcessCheck]


class UsageData(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class SaveAnalysisRequest(BaseModel):
    analysis_id: str
    filename: str
    timestamp: str
    analysis: AnalysisData
    usage: Optional[UsageData] = None
    additional_context: Optional[str] = ""


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    additional_context: Optional[str] = Form(default=""),
    save_to_history: Optional[str] = Form(default="true")
):
    """
    PCB 이미지 분석 API

    - file: 분석할 PCB 이미지 파일 (JPG, PNG, BMP 지원)
    - additional_context: 추가 컨텍스트 정보 (선택사항)
    - save_to_history: 분석 결과를 이력에 저장할지 여부 (기본값: true)
    """
    # save_to_history 문자열을 boolean으로 변환
    should_save = save_to_history.lower() in ('true', '1', 'yes')
    # 서비스 가용성 확인
    if not rca_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="RCA 서비스를 사용할 수 없습니다. OpenAI API 키를 설정해주세요."
        )

    # 파일 유형 검증
    allowed_types = ["image/jpeg", "image/png", "image/bmp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_types)}"
        )

    # 파일 읽기
    image_data = await file.read()

    # 파일 크기 제한 (10MB)
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="파일 크기는 10MB를 초과할 수 없습니다."
        )

    # 이미지 분석 수행
    result = await rca_service.analyze_image(
        image_data=image_data,
        content_type=file.content_type,
        filename=file.filename,
        additional_context=additional_context or "",
        save_to_history=should_save
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "분석 중 오류가 발생했습니다.")
        )

    return result


@router.post("/save")
async def save_analysis(request: SaveAnalysisRequest):
    """
    분석 결과를 이력에 저장하는 API

    - 이미 분석된 결과를 나중에 저장할 때 사용
    """
    # 분석 결과를 딕셔너리로 변환
    analysis_result = {
        "defect_detected": request.analysis.defect_detected,
        "defect_type": request.analysis.defect_type,
        "severity": request.analysis.severity,
        "confidence": request.analysis.confidence,
        "location": request.analysis.location,
        "analysis": request.analysis.analysis,
        "causes": request.analysis.causes,
        "solutions": request.analysis.solutions,
        "process_checks": [{"process": pc.process, "check": pc.check} for pc in request.analysis.process_checks]
    }

    usage = {}
    if request.usage:
        usage = {
            "prompt_tokens": request.usage.prompt_tokens,
            "completion_tokens": request.usage.completion_tokens,
            "total_tokens": request.usage.total_tokens
        }

    success = rca_service.save_analysis(
        analysis_id=request.analysis_id,
        filename=request.filename,
        analysis_result=analysis_result,
        usage=usage,
        additional_context=request.additional_context or ""
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="분석 결과 저장에 실패했습니다."
        )

    return {
        "success": True,
        "message": f"분석 ID '{request.analysis_id}'가 저장되었습니다."
    }


@router.get("/history")
async def get_history(limit: int = 50, offset: int = 0):
    """
    분석 이력 조회 API

    - limit: 조회할 최대 개수 (기본값: 50)
    - offset: 시작 위치 (기본값: 0)
    """
    history = rca_service.get_history(limit=limit, offset=offset)
    # 프론트엔드가 배열을 직접 기대하므로 배열 반환
    return history


@router.get("/history/{analysis_id}")
async def get_history_item(analysis_id: str):
    """
    특정 분석 이력 조회 API

    - analysis_id: 분석 ID (예: RCA-20241204-ABCD1234)
    """
    item = rca_service.get_history_item(analysis_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"분석 ID '{analysis_id}'를 찾을 수 없습니다."
        )
    return {
        "success": True,
        "data": item
    }


@router.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str):
    """
    분석 이력 삭제 API

    - analysis_id: 삭제할 분석 ID
    """
    success = rca_service.delete_history_item(analysis_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"분석 ID '{analysis_id}'를 찾을 수 없습니다."
        )
    return {
        "success": True,
        "message": f"분석 ID '{analysis_id}'가 삭제되었습니다."
    }


@router.get("/statistics")
async def get_statistics():
    """
    분석 통계 조회 API
    """
    stats = rca_service.get_statistics()
    # 프론트엔드가 { total, high, medium, low } 형식을 직접 기대
    return stats


@router.get("/status")
async def get_service_status():
    """
    RCA 서비스 상태 확인 API
    """
    return {
        "success": True,
        "available": rca_service.is_available(),
        "message": "서비스 사용 가능" if rca_service.is_available() else "OpenAI API 키가 설정되지 않았습니다."
    }
