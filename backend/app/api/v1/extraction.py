"""
Defect Extraction API
불량 이미지 추출 (YOLO, BOX AUTO, POLYGON)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Literal
import cv2
import numpy as np
from pathlib import Path
import base64
import io
from PIL import Image

from app.extractors import (
    YOLOExtractor,
    BoxAutoExtractor,
    PolygonExtractor,
    MaskPostProcessor,
    ExtractionMode
)

router = APIRouter(prefix="/extraction", tags=["Defect Extraction"])

# Global extractor instances (singleton pattern)
_yolo_extractor: Optional[YOLOExtractor] = None
_mask_processor = MaskPostProcessor()


# ========== Request/Response Models ==========

class YOLOLoadModelRequest(BaseModel):
    """YOLO 모델 로드 요청"""
    modelPath: str


class YOLOExtractRequest(BaseModel):
    """YOLO 추출 요청"""
    defectImagePath: str
    outputPath: str
    confidence: float = 0.25


class YOLOExtractResponse(BaseModel):
    """YOLO 추출 응답"""
    success: bool
    message: str
    totalImages: int
    totalContours: int
    results: List[dict]


class ImageNavigationRequest(BaseModel):
    """이미지 네비게이션 요청"""
    imageIndex: int
    contourIndex: int


class MaskPostProcessRequest(BaseModel):
    """Mask 후처리 요청"""
    operation: Literal[
        "gv_offset", "morphology_open", "morphology_close",
        "invert", "select_center", "select_largest"
    ]
    params: Optional[dict] = None


class BoxAutoExtractRequest(BaseModel):
    """BOX AUTO 추출 요청"""
    x: int
    y: int
    w: int
    h: int
    method: Literal["grabcut", "watershed", "threshold", "canny", "kmeans"] = "grabcut"


class PolygonExtractRequest(BaseModel):
    """POLYGON 추출 요청"""
    points: List[List[int]]  # [[x1, y1], [x2, y2], ...]


# ========== YOLO Endpoints ==========

@router.post("/yolo/load-model")
async def load_yolo_model(request: YOLOLoadModelRequest):
    """
    YOLO 모델 로드

    - 모델 파일(.pt)을 메모리에 로드
    - GPU 사용 가능 시 자동으로 GPU 사용
    """
    global _yolo_extractor

    try:
        model_path = Path(request.modelPath)

        if not model_path.exists():
            raise HTTPException(status_code=404, detail=f"모델 파일을 찾을 수 없습니다: {request.modelPath}")

        # YOLO extractor 생성 및 모델 로드
        _yolo_extractor = YOLOExtractor(str(model_path))
        success, message = _yolo_extractor.load_model()

        if not success:
            raise HTTPException(status_code=500, detail=message)

        # 모델 타입 확인
        model_type = _yolo_extractor.check_model_type()

        return {
            "success": True,
            "message": "YOLO 모델 로드 완료",
            "modelPath": str(model_path),
            "modelType": model_type,
            "modelInfo": _yolo_extractor.get_model_info()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 로드 실패: {str(e)}")


@router.post("/yolo/extract", response_model=YOLOExtractResponse)
async def extract_with_yolo(request: YOLOExtractRequest):
    """
    YOLO로 불량 영역 추출

    - 폴더 내 모든 이미지 처리
    - Contour 추출 및 저장
    - 결과를 JSON으로 반환
    """
    global _yolo_extractor

    if _yolo_extractor is None or not _yolo_extractor.is_model_loaded():
        raise HTTPException(status_code=400, detail="YOLO 모델을 먼저 로드해주세요")

    try:
        defect_path = Path(request.defectImagePath)
        output_path = Path(request.outputPath)

        if not defect_path.exists():
            raise HTTPException(status_code=404, detail=f"입력 경로를 찾을 수 없습니다: {request.defectImagePath}")

        # 출력 폴더 생성
        output_path.mkdir(parents=True, exist_ok=True)

        # 이미지 파일 목록
        image_files = list(defect_path.glob("*.jpg")) + \
                     list(defect_path.glob("*.png")) + \
                     list(defect_path.glob("*.bmp"))

        if not image_files:
            raise HTTPException(status_code=404, detail="처리할 이미지가 없습니다")

        results = []
        total_contours = 0

        # 각 이미지 처리
        for idx, img_file in enumerate(image_files):
            # 이미지 읽기
            image = cv2.imread(str(img_file))

            if image is None:
                continue

            # YOLO로 contour 추출
            contours = _yolo_extractor.extract(image)

            total_contours += len(contours)

            # 결과 저장
            result_data = {
                "imageIndex": idx,
                "imagePath": str(img_file),
                "imageName": img_file.name,
                "contourCount": len(contours),
                "contours": []
            }

            # 각 contour에 대한 정보
            for c_idx, contour in enumerate(contours):
                contour_info = _yolo_extractor.get_contour_info(contour)

                # Mask 및 Patch 추출
                mask, patch, mask_roi, bbox = _yolo_extractor.extract_mask_and_patch(image, contour)

                result_data["contours"].append({
                    "contourIndex": c_idx,
                    "area": contour_info["area"],
                    "perimeter": contour_info["perimeter"],
                    "bbox": contour_info["bbox"],
                    "center": contour_info["center"]
                })

            results.append(result_data)

        return YOLOExtractResponse(
            success=True,
            message=f"{len(image_files)}개 이미지에서 {total_contours}개 contour 추출 완료",
            totalImages=len(image_files),
            totalContours=total_contours,
            results=results
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"추출 실패: {str(e)}")


@router.post("/yolo/get-preview")
async def get_yolo_preview(request: ImageNavigationRequest):
    """
    특정 이미지/Contour의 4분할 프리뷰 반환

    - 원본 이미지
    - YOLO Patch 후보
    - Mask
    - Mask 적용 Patch

    Returns: Base64 인코딩된 이미지 4개
    """
    global _yolo_extractor

    if _yolo_extractor is None:
        raise HTTPException(status_code=400, detail="YOLO 모델이 로드되지 않았습니다")

    try:
        # TODO: 실제 이미지 및 contour 데이터 가져오기
        # 현재는 mock 응답 반환

        return {
            "success": True,
            "imageIndex": request.imageIndex,
            "contourIndex": request.contourIndex,
            "previews": {
                "original": "",  # Base64 이미지
                "yoloPatch": "",
                "mask": "",
                "maskedPatch": ""
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프리뷰 생성 실패: {str(e)}")


# ========== Mask Post-Processing Endpoints ==========

@router.post("/mask/post-process")
async def post_process_mask(request: MaskPostProcessRequest):
    """
    Mask 후처리 적용

    지원 연산:
    - gv_offset: GV Offset 조절
    - morphology_open: Opening 연산
    - morphology_close: Closing 연산
    - invert: 마스크 반전
    - select_center: 중앙 contour 선택
    - select_largest: 최대 contour 선택
    """
    try:
        # TODO: 실제 마스크 데이터에 후처리 적용
        # 현재는 mock 응답

        return {
            "success": True,
            "operation": request.operation,
            "message": f"{request.operation} 적용 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"후처리 실패: {str(e)}")


@router.get("/mask/operations")
async def get_available_operations():
    """
    사용 가능한 Mask 후처리 연산 목록 반환
    """
    return {
        "morphology": [
            {"id": "opening", "name": "Opening", "description": "작은 노이즈 제거"},
            {"id": "closing", "name": "Closing", "description": "작은 구멍 메우기"},
            {"id": "erode", "name": "Erosion", "description": "마스크 축소"},
            {"id": "dilate", "name": "Dilation", "description": "마스크 확대"},
            {"id": "gradient", "name": "Gradient", "description": "경계 강조"},
            {"id": "tophat", "name": "Top-Hat", "description": "밝은 영역 추출"},
            {"id": "blackhat", "name": "Black-Hat", "description": "어두운 영역 추출"}
        ],
        "threshold": [
            {"id": "otsu_offset", "name": "Otsu + Offset", "description": "자동 임계값 + 오프셋"},
            {"id": "adaptive_gaussian", "name": "Adaptive Gaussian", "description": "적응형 가우시안"},
            {"id": "adaptive_mean", "name": "Adaptive Mean", "description": "적응형 평균"}
        ],
        "filter": [
            {"id": "gaussian", "name": "Gaussian Blur", "description": "부드러운 마스크"},
            {"id": "median", "name": "Median Filter", "description": "노이즈 제거"},
            {"id": "bilateral", "name": "Bilateral Filter", "description": "경계 보존 노이즈 제거"}
        ],
        "contour": [
            {"id": "select_largest", "name": "최대 Contour", "description": "가장 큰 contour만 선택"},
            {"id": "select_center", "name": "중앙 Contour", "description": "중앙에 가까운 contour 선택"},
            {"id": "merge_all", "name": "전체 병합", "description": "모든 contour 병합"},
            {"id": "filter_small", "name": "작은 것 제거", "description": "최소 면적 이하 제거"}
        ],
        "advanced": [
            {"id": "convex_hull", "name": "Convex Hull", "description": "볼록 껍질"},
            {"id": "distance_transform", "name": "Distance Transform", "description": "중심부만 남기기"},
            {"id": "skeleton", "name": "Skeleton", "description": "골격화"},
            {"id": "watershed", "name": "Watershed", "description": "겹친 객체 분리"}
        ]
    }


# ========== BOX AUTO Endpoints ==========

@router.post("/box-auto/extract")
async def extract_with_box_auto(request: BoxAutoExtractRequest):
    """
    BOX AUTO로 자동 분할

    지원 알고리즘:
    - grabcut: GrabCut (반복 개선)
    - watershed: Watershed (Distance Transform)
    - threshold: Adaptive Threshold (다중 병합)
    - canny: Canny Edge 기반
    - kmeans: K-Means Clustering
    """
    try:
        extractor = BoxAutoExtractor(method=request.method)

        # TODO: 실제 이미지 데이터로 처리
        # 현재는 mock 응답

        return {
            "success": True,
            "method": request.method,
            "bbox": {
                "x": request.x,
                "y": request.y,
                "w": request.w,
                "h": request.h
            },
            "message": f"{request.method} 알고리즘으로 분할 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOX AUTO 추출 실패: {str(e)}")


@router.get("/box-auto/methods")
async def get_box_auto_methods():
    """BOX AUTO 사용 가능한 알고리즘 목록"""
    return {
        "methods": [
            {
                "id": "grabcut",
                "name": "GrabCut",
                "description": "반복 개선 (정확도 85% → 95%)",
                "recommended": True
            },
            {
                "id": "watershed",
                "name": "Watershed",
                "description": "Distance Transform 기반",
                "recommended": False
            },
            {
                "id": "threshold",
                "name": "Adaptive Threshold Multi",
                "description": "3가지 방법 병합",
                "recommended": False
            },
            {
                "id": "canny",
                "name": "Canny Edge",
                "description": "경계가 명확한 객체에 효과적",
                "recommended": False
            },
            {
                "id": "kmeans",
                "name": "K-Means Clustering",
                "description": "색상 기반 분할",
                "recommended": False
            }
        ]
    }


# ========== POLYGON Endpoints ==========

@router.post("/polygon/extract")
async def extract_with_polygon(request: PolygonExtractRequest):
    """
    POLYGON으로 수동 추출

    - 사용자가 그린 다각형 점들로 마스크 생성
    - 유효성 검사 포함
    """
    try:
        extractor = PolygonExtractor()

        # 폴리곤 점 변환
        polygon_points = [(int(p[0]), int(p[1])) for p in request.points]

        # TODO: 실제 이미지에 적용
        # 현재는 유효성 검사만 수행

        # 간단한 유효성 검사
        if len(polygon_points) < 3:
            raise HTTPException(status_code=400, detail="폴리곤 점이 3개 미만입니다")

        return {
            "success": True,
            "pointCount": len(polygon_points),
            "message": "폴리곤 마스크 생성 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"POLYGON 추출 실패: {str(e)}")


@router.post("/polygon/validate")
async def validate_polygon(request: PolygonExtractRequest):
    """
    폴리곤 유효성 검사

    - 점 개수 확인
    - 면적 계산
    - 범위 확인
    """
    try:
        polygon_points = [(int(p[0]), int(p[1])) for p in request.points]

        if len(polygon_points) < 3:
            return {
                "valid": False,
                "message": "폴리곤 점이 3개 미만입니다"
            }

        # 면적 계산
        pts = np.array(polygon_points, dtype=np.int32)
        area = cv2.contourArea(pts)

        if area < 10:
            return {
                "valid": False,
                "message": f"폴리곤 면적이 너무 작습니다 (area={area:.1f})"
            }

        return {
            "valid": True,
            "area": area,
            "pointCount": len(polygon_points),
            "message": "유효한 폴리곤입니다"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검증 실패: {str(e)}")


# ========== Save Endpoint ==========

@router.post("/save")
async def save_mask_and_patch():
    """
    현재 Mask 및 Patch 저장

    - 자동 번호 매기기 (defect_{id:05d}.png)
    - Mask와 Patch를 별도 파일로 저장
    """
    try:
        # TODO: 실제 저장 로직 구현

        return {
            "success": True,
            "savedFiles": [
                "defect_00001_mask.png",
                "defect_00001_patch.png"
            ],
            "message": "저장 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")
