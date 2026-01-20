"""
Defect Extraction API
불량 이미지 추출 (YOLO, BOX AUTO, POLYGON)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any
import cv2
import numpy as np
from pathlib import Path
import base64
import io
import os
import time
from PIL import Image
import tkinter as tk
from tkinter import filedialog

from app.extractors import (
    YOLOExtractor,
    BoxAutoExtractor,
    PolygonExtractor,
    MaskPostProcessor,
    ExtractionMode
)

router = APIRouter(prefix="/extraction", tags=["Defect Extraction"])

# ========== Global State ==========

# Extractor instances
_yolo_extractor: Optional[YOLOExtractor] = None
_mask_processor = MaskPostProcessor()

# 현재 작업 상태 (세션 기반)
_current_session: Dict[str, Any] = {
    "image": None,           # 현재 로드된 이미지 (numpy array)
    "image_path": None,      # 이미지 경로
    "mask": None,            # 현재 마스크
    "contours": [],          # 추출된 contours
    "current_contour_idx": 0,
    "results": []            # YOLO 결과 목록
}


# ========== Helper Functions ==========

def numpy_to_base64(img: np.ndarray, format: str = "PNG") -> str:
    """numpy 이미지를 base64 문자열로 변환"""
    if img is None:
        return ""

    # Grayscale인 경우 3채널로 변환
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    # BGR to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # PIL Image로 변환
    pil_img = Image.fromarray(img_rgb)

    # BytesIO로 저장
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format)
    buffer.seek(0)

    # base64 인코딩
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return f"data:image/{format.lower()};base64,{img_base64}"


def create_thumbnail(img: np.ndarray, max_size: int = 200) -> str:
    """썸네일 생성"""
    if img is None:
        return ""

    h, w = img.shape[:2]
    scale = min(max_size / w, max_size / h)

    if scale < 1:
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h))

    return numpy_to_base64(img, "JPEG")


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


class ImageLoadRequest(BaseModel):
    """이미지 로드 요청"""
    imagePath: str


class ImageUploadBase64Request(BaseModel):
    """Base64 이미지 업로드 요청"""
    imageData: str  # base64 encoded image (data:image/xxx;base64,xxxxx)


class MaskPostProcessRequest(BaseModel):
    """Mask 후처리 요청"""
    operation: str
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
    points: List[List[float]]  # [[x1, y1], [x2, y2], ...] - float도 허용


class SaveRequest(BaseModel):
    """저장 요청"""
    outputFolder: str
    prefix: str = "defect"


# ========== Image Selection Endpoints ==========

@router.post("/select-image")
async def select_image_file():
    """
    파일 다이얼로그로 이미지 선택
    """
    global _current_session

    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        file_path = filedialog.askopenfilename(
            title="이미지 파일 선택",
            filetypes=[
                ("이미지 파일", "*.bmp;*.png;*.jpg;*.jpeg;*.gif;*.tiff;*.webp"),
                ("모든 파일", "*.*")
            ]
        )

        root.destroy()

        if not file_path:
            return {"success": False, "message": "파일이 선택되지 않았습니다."}

        # 이미지 로드
        image = cv2.imread(file_path)
        if image is None:
            return {"success": False, "error": f"이미지를 읽을 수 없습니다: {file_path}"}

        # 세션 업데이트
        _current_session["image"] = image
        _current_session["image_path"] = file_path
        _current_session["mask"] = None
        _current_session["contours"] = []

        h, w = image.shape[:2]

        return {
            "success": True,
            "imagePath": file_path,
            "imageSize": {"width": w, "height": h},
            "imagePreview": create_thumbnail(image, 300)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/load-image")
async def load_image(request: ImageLoadRequest):
    """
    경로로 이미지 로드
    """
    global _current_session

    try:
        if not os.path.exists(request.imagePath):
            raise HTTPException(status_code=404, detail=f"파일을 찾을 수 없습니다: {request.imagePath}")

        image = cv2.imread(request.imagePath)
        if image is None:
            raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다.")

        _current_session["image"] = image
        _current_session["image_path"] = request.imagePath
        _current_session["mask"] = None
        _current_session["contours"] = []

        h, w = image.shape[:2]

        return {
            "success": True,
            "imagePath": request.imagePath,
            "imageSize": {"width": w, "height": h},
            "imagePreview": create_thumbnail(image, 300)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-image-base64")
async def upload_image_base64(request: ImageUploadBase64Request):
    """
    Base64 이미지 업로드 (프론트엔드에서 직접 로드한 이미지)
    """
    global _current_session

    try:
        # data:image/xxx;base64,xxxxx 형식에서 base64 데이터 추출
        image_data = request.imageData
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # base64 디코딩
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="이미지를 디코딩할 수 없습니다.")

        _current_session["image"] = image
        _current_session["image_path"] = "uploaded_image"
        _current_session["mask"] = None
        _current_session["contours"] = []

        h, w = image.shape[:2]

        return {
            "success": True,
            "message": "이미지 업로드 완료",
            "imageSize": {"width": w, "height": h}
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")


# ========== YOLO Endpoints ==========

@router.post("/yolo/select-model")
async def select_yolo_model():
    """
    파일 다이얼로그로 YOLO 모델 선택
    """
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        file_path = filedialog.askopenfilename(
            title="YOLO 모델 파일 선택",
            filetypes=[
                ("YOLO 모델", "*.pt"),
                ("모든 파일", "*.*")
            ]
        )

        root.destroy()

        if not file_path:
            return {"success": False, "message": "파일이 선택되지 않았습니다."}

        return {"success": True, "modelPath": file_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/yolo/load-model")
async def load_yolo_model(request: YOLOLoadModelRequest):
    """
    YOLO 모델 로드
    """
    global _yolo_extractor

    try:
        model_path = Path(request.modelPath)

        if not model_path.exists():
            raise HTTPException(status_code=404, detail=f"모델 파일을 찾을 수 없습니다: {request.modelPath}")

        _yolo_extractor = YOLOExtractor(str(model_path))
        success, message = _yolo_extractor.load_model()

        if not success:
            raise HTTPException(status_code=500, detail=message)

        model_type = _yolo_extractor.check_model_type()

        return {
            "success": True,
            "message": "YOLO 모델 로드 완료",
            "modelPath": str(model_path),
            "modelType": model_type,
            "modelInfo": _yolo_extractor.get_model_info()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 로드 실패: {str(e)}")


@router.post("/yolo/extract")
async def extract_with_yolo():
    """
    현재 로드된 이미지에서 YOLO로 추출
    """
    global _yolo_extractor, _current_session

    if _yolo_extractor is None or not _yolo_extractor.is_model_loaded():
        raise HTTPException(status_code=400, detail="YOLO 모델을 먼저 로드해주세요")

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지를 먼저 로드해주세요")

    try:
        image = _current_session["image"]

        # YOLO로 contour 추출
        contours = _yolo_extractor.extract(image)

        _current_session["contours"] = contours
        _current_session["current_contour_idx"] = 0

        # 첫 번째 contour의 마스크 생성
        if contours:
            mask = _yolo_extractor.extract_mask_from_contour(image, contours[0])
            _current_session["mask"] = mask

        # 결과 정보
        results = []
        for idx, cnt in enumerate(contours):
            info = _yolo_extractor.get_contour_info(cnt)
            results.append({
                "contourIndex": idx,
                "area": info["area"],
                "perimeter": info["perimeter"],
                "bbox": info["bbox"],
                "center": info["center"]
            })

        return {
            "success": True,
            "message": f"{len(contours)}개 contour 추출 완료",
            "totalContours": len(contours),
            "contours": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"추출 실패: {str(e)}")


@router.post("/yolo/extract-folder", response_model=YOLOExtractResponse)
async def extract_folder_with_yolo(request: YOLOExtractRequest):
    """
    폴더 내 모든 이미지에서 YOLO로 추출
    """
    global _yolo_extractor

    if _yolo_extractor is None or not _yolo_extractor.is_model_loaded():
        raise HTTPException(status_code=400, detail="YOLO 모델을 먼저 로드해주세요")

    try:
        defect_path = Path(request.defectImagePath)
        output_path = Path(request.outputPath)

        if not defect_path.exists():
            raise HTTPException(status_code=404, detail=f"입력 경로를 찾을 수 없습니다: {request.defectImagePath}")

        output_path.mkdir(parents=True, exist_ok=True)

        # 이미지 파일 목록
        image_files = list(defect_path.glob("*.jpg")) + \
                     list(defect_path.glob("*.png")) + \
                     list(defect_path.glob("*.bmp"))

        if not image_files:
            raise HTTPException(status_code=404, detail="처리할 이미지가 없습니다")

        results = []
        total_contours = 0

        for idx, img_file in enumerate(image_files):
            image = cv2.imread(str(img_file))
            if image is None:
                continue

            contours = _yolo_extractor.extract(image)
            total_contours += len(contours)

            result_data = {
                "imageIndex": idx,
                "imagePath": str(img_file),
                "imageName": img_file.name,
                "contourCount": len(contours),
                "contours": []
            }

            for c_idx, contour in enumerate(contours):
                contour_info = _yolo_extractor.get_contour_info(contour)
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"추출 실패: {str(e)}")


@router.post("/yolo/navigate")
async def navigate_yolo_contour(request: ImageNavigationRequest):
    """
    특정 contour로 이동
    """
    global _yolo_extractor, _current_session

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지가 로드되지 않았습니다")

    contours = _current_session.get("contours", [])
    if not contours:
        raise HTTPException(status_code=400, detail="추출된 contour가 없습니다")

    if request.contourIndex < 0 or request.contourIndex >= len(contours):
        raise HTTPException(status_code=400, detail=f"잘못된 contour 인덱스: {request.contourIndex}")

    try:
        image = _current_session["image"]
        contour = contours[request.contourIndex]

        # 마스크 생성
        mask = _yolo_extractor.extract_mask_from_contour(image, contour)
        _current_session["mask"] = mask
        _current_session["current_contour_idx"] = request.contourIndex

        # 프리뷰 생성
        mask, patch, mask_roi, bbox = _yolo_extractor.extract_mask_and_patch(image, contour)

        # 마스크 적용 패치
        masked_patch = cv2.bitwise_and(patch, patch, mask=mask_roi)

        return {
            "success": True,
            "contourIndex": request.contourIndex,
            "totalContours": len(contours),
            "bbox": bbox,
            "previews": {
                "original": create_thumbnail(image, 300),
                "patch": create_thumbnail(patch, 200),
                "mask": create_thumbnail(mask_roi, 200),
                "maskedPatch": create_thumbnail(masked_patch, 200)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이동 실패: {str(e)}")


@router.get("/yolo/get-preview")
async def get_current_preview():
    """
    현재 선택된 contour의 4분할 프리뷰 반환
    """
    global _yolo_extractor, _current_session

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지가 로드되지 않았습니다")

    contours = _current_session.get("contours", [])
    if not contours:
        return {
            "success": True,
            "hasContours": False,
            "previews": {
                "original": create_thumbnail(_current_session["image"], 300),
                "patch": "",
                "mask": "",
                "maskedPatch": ""
            }
        }

    try:
        image = _current_session["image"]
        idx = _current_session.get("current_contour_idx", 0)
        contour = contours[idx]

        mask, patch, mask_roi, bbox = _yolo_extractor.extract_mask_and_patch(image, contour)
        masked_patch = cv2.bitwise_and(patch, patch, mask=mask_roi)

        return {
            "success": True,
            "hasContours": True,
            "contourIndex": idx,
            "totalContours": len(contours),
            "bbox": bbox,
            "previews": {
                "original": create_thumbnail(image, 300),
                "patch": create_thumbnail(patch, 200),
                "mask": create_thumbnail(mask_roi, 200),
                "maskedPatch": create_thumbnail(masked_patch, 200)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프리뷰 생성 실패: {str(e)}")


# ========== BOX AUTO Endpoints ==========

@router.post("/box-auto/extract")
async def extract_with_box_auto(request: BoxAutoExtractRequest):
    """
    BOX AUTO로 자동 분할
    """
    global _current_session

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지를 먼저 로드해주세요")

    try:
        image = _current_session["image"]
        h, w = image.shape[:2]

        # 범위 검증
        if request.x < 0 or request.y < 0 or request.x + request.w > w or request.y + request.h > h:
            raise HTTPException(status_code=400, detail="박스가 이미지 범위를 벗어났습니다")

        # BoxAutoExtractor로 분할
        extractor = BoxAutoExtractor(method=request.method)
        mask = extractor.extract(image, request.x, request.y, request.w, request.h)

        _current_session["mask"] = mask

        # ROI 추출
        patch = image[request.y:request.y+request.h, request.x:request.x+request.w].copy()
        mask_roi = mask[request.y:request.y+request.h, request.x:request.x+request.w]
        masked_patch = cv2.bitwise_and(patch, patch, mask=mask_roi)

        return {
            "success": True,
            "method": request.method,
            "bbox": {
                "x": request.x,
                "y": request.y,
                "w": request.w,
                "h": request.h
            },
            "previews": {
                "original": create_thumbnail(image, 300),
                "patch": create_thumbnail(patch, 200),
                "mask": create_thumbnail(mask_roi, 200),
                "maskedPatch": create_thumbnail(masked_patch, 200)
            },
            "message": f"{request.method} 알고리즘으로 분할 완료"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOX AUTO 추출 실패: {str(e)}")


@router.get("/box-auto/methods")
async def get_box_auto_methods():
    """BOX AUTO 사용 가능한 알고리즘 목록"""
    return {
        "methods": [
            {"id": "grabcut", "name": "GrabCut", "description": "반복 개선 (정확도 85% → 95%)", "recommended": True},
            {"id": "watershed", "name": "Watershed", "description": "Distance Transform 기반", "recommended": False},
            {"id": "threshold", "name": "Adaptive Threshold Multi", "description": "3가지 방법 병합", "recommended": False},
            {"id": "canny", "name": "Canny Edge", "description": "경계가 명확한 객체에 효과적", "recommended": False},
            {"id": "kmeans", "name": "K-Means Clustering", "description": "색상 기반 분할", "recommended": False}
        ]
    }


# ========== POLYGON Endpoints ==========

@router.post("/polygon/extract")
async def extract_with_polygon(request: PolygonExtractRequest):
    """
    POLYGON으로 수동 추출
    """
    global _current_session

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지를 먼저 로드해주세요")

    try:
        image = _current_session["image"]

        # 폴리곤 점 변환
        polygon_points = [(int(p[0]), int(p[1])) for p in request.points]

        # PolygonExtractor로 마스크 생성
        extractor = PolygonExtractor()

        # 유효성 검사
        valid, msg = extractor.validate_polygon(polygon_points, image.shape)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)

        # 마스크 생성
        mask, bbox, patch, mask_roi = extractor.extract_with_bbox(image, polygon_points)

        _current_session["mask"] = mask

        if patch is not None:
            masked_patch = cv2.bitwise_and(patch, patch, mask=mask_roi)

            return {
                "success": True,
                "pointCount": len(polygon_points),
                "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2], "h": bbox[3]},
                "previews": {
                    "original": create_thumbnail(image, 300),
                    "patch": create_thumbnail(patch, 200),
                    "mask": create_thumbnail(mask_roi, 200),
                    "maskedPatch": create_thumbnail(masked_patch, 200)
                },
                "message": "폴리곤 마스크 생성 완료"
            }
        else:
            return {
                "success": True,
                "pointCount": len(polygon_points),
                "message": "폴리곤 마스크 생성 완료 (빈 영역)"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"POLYGON 추출 실패: {str(e)}")


@router.post("/polygon/validate")
async def validate_polygon(request: PolygonExtractRequest):
    """
    폴리곤 유효성 검사
    """
    try:
        polygon_points = [(int(p[0]), int(p[1])) for p in request.points]

        if len(polygon_points) < 3:
            return {"valid": False, "message": "폴리곤 점이 3개 미만입니다"}

        pts = np.array(polygon_points, dtype=np.int32)
        area = cv2.contourArea(pts)

        if area < 10:
            return {"valid": False, "message": f"폴리곤 면적이 너무 작습니다 (area={area:.1f})"}

        return {
            "valid": True,
            "area": float(area),
            "pointCount": len(polygon_points),
            "message": "유효한 폴리곤입니다"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검증 실패: {str(e)}")


# ========== Mask Post-Processing Endpoints ==========

@router.post("/mask/post-process")
async def post_process_mask(request: MaskPostProcessRequest):
    """
    Mask 후처리 적용
    """
    global _current_session, _mask_processor

    if _current_session["mask"] is None:
        raise HTTPException(status_code=400, detail="마스크가 없습니다. 먼저 추출을 수행해주세요.")

    try:
        mask = _current_session["mask"].copy()
        params = request.params or {}

        # 연산 적용
        operation = request.operation

        # Morphology
        if operation == "opening":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            mask = _mask_processor.apply_opening(mask, kernel_size, iterations)

        elif operation == "closing":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            mask = _mask_processor.apply_closing(mask, kernel_size, iterations)

        elif operation == "erode":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            mask = _mask_processor.apply_erode(mask, kernel_size, iterations)

        elif operation == "dilate":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            mask = _mask_processor.apply_dilate(mask, kernel_size, iterations)

        elif operation == "gradient":
            kernel_size = params.get("kernelSize", 3)
            mask = _mask_processor.apply_morphological_gradient(mask, kernel_size)

        elif operation == "tophat":
            kernel_size = params.get("kernelSize", 9)
            mask = _mask_processor.apply_tophat(mask, kernel_size)

        elif operation == "blackhat":
            kernel_size = params.get("kernelSize", 9)
            mask = _mask_processor.apply_blackhat(mask, kernel_size)

        # Filter
        elif operation == "gaussian":
            kernel_size = params.get("kernelSize", 5)
            mask = _mask_processor.apply_gaussian_filter(mask, kernel_size)
            _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

        elif operation == "median":
            kernel_size = params.get("kernelSize", 5)
            mask = _mask_processor.apply_median_filter(mask, kernel_size)

        elif operation == "bilateral":
            d = params.get("d", 9)
            sigma_color = params.get("sigmaColor", 75)
            sigma_space = params.get("sigmaSpace", 75)
            mask = _mask_processor.apply_bilateral_filter(mask, d, sigma_color, sigma_space)
            _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

        # Contour
        elif operation == "select_largest":
            mask = _mask_processor.select_largest_contour(mask)

        elif operation == "select_center":
            mask = _mask_processor.select_center_contour(mask)

        elif operation == "merge_all":
            mask = _mask_processor.merge_all_contours(mask)

        elif operation == "filter_small":
            min_area = params.get("minArea", 100)
            mask = _mask_processor.filter_small_contours(mask, min_area)

        # Advanced
        elif operation == "convex_hull":
            mask = _mask_processor.apply_convex_hull(mask)

        elif operation == "distance_transform":
            threshold_ratio = params.get("thresholdRatio", 0.7)
            mask = _mask_processor.refine_with_distance_transform(mask, threshold_ratio)

        elif operation == "skeleton":
            mask = _mask_processor.apply_skeleton(mask)

        elif operation == "watershed":
            mask = _mask_processor.apply_watershed_refinement(mask)

        # Utility
        elif operation == "invert":
            mask = _mask_processor.invert_mask(mask)

        elif operation == "fill_holes":
            mask = _mask_processor.fill_holes(mask)

        elif operation == "smooth_edges":
            kernel_size = params.get("kernelSize", 5)
            mask = _mask_processor.smooth_edges(mask, kernel_size)

        else:
            raise HTTPException(status_code=400, detail=f"알 수 없는 연산: {operation}")

        # 결과 저장
        _current_session["mask"] = mask

        # 프리뷰 생성
        image = _current_session["image"]
        masked_image = None
        if image is not None:
            masked_image = cv2.bitwise_and(image, image, mask=mask)

        return {
            "success": True,
            "operation": operation,
            "previews": {
                "mask": create_thumbnail(mask, 200),
                "maskedImage": create_thumbnail(masked_image, 300) if masked_image is not None else ""
            },
            "message": f"{operation} 적용 완료"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"후처리 실패: {str(e)}")


@router.post("/mask/reset")
async def reset_mask():
    """
    마스크 초기화 (원래 추출 상태로)
    """
    global _current_session, _yolo_extractor

    contours = _current_session.get("contours", [])
    if contours and _yolo_extractor:
        idx = _current_session.get("current_contour_idx", 0)
        image = _current_session["image"]
        mask = _yolo_extractor.extract_mask_from_contour(image, contours[idx])
        _current_session["mask"] = mask

        return {
            "success": True,
            "message": "마스크 초기화 완료",
            "preview": create_thumbnail(mask, 200)
        }
    else:
        _current_session["mask"] = None
        return {"success": True, "message": "마스크 초기화 완료"}


@router.get("/mask/operations")
async def get_available_operations():
    """
    사용 가능한 Mask 후처리 연산 목록 반환
    """
    return {
        "morphology": [
            {"id": "opening", "name": "Opening", "description": "작은 노이즈 제거", "params": ["kernelSize", "iterations"]},
            {"id": "closing", "name": "Closing", "description": "작은 구멍 메우기", "params": ["kernelSize", "iterations"]},
            {"id": "erode", "name": "Erosion", "description": "마스크 축소", "params": ["kernelSize", "iterations"]},
            {"id": "dilate", "name": "Dilation", "description": "마스크 확대", "params": ["kernelSize", "iterations"]},
            {"id": "gradient", "name": "Gradient", "description": "경계 강조", "params": ["kernelSize"]},
            {"id": "tophat", "name": "Top-Hat", "description": "밝은 영역 추출", "params": ["kernelSize"]},
            {"id": "blackhat", "name": "Black-Hat", "description": "어두운 영역 추출", "params": ["kernelSize"]}
        ],
        "filter": [
            {"id": "gaussian", "name": "Gaussian Blur", "description": "부드러운 마스크", "params": ["kernelSize"]},
            {"id": "median", "name": "Median Filter", "description": "노이즈 제거", "params": ["kernelSize"]},
            {"id": "bilateral", "name": "Bilateral Filter", "description": "경계 보존 노이즈 제거", "params": ["d", "sigmaColor", "sigmaSpace"]}
        ],
        "contour": [
            {"id": "select_largest", "name": "최대 Contour", "description": "가장 큰 contour만 선택", "params": []},
            {"id": "select_center", "name": "중앙 Contour", "description": "중앙에 가까운 contour 선택", "params": []},
            {"id": "merge_all", "name": "전체 병합", "description": "모든 contour 병합", "params": []},
            {"id": "filter_small", "name": "작은 것 제거", "description": "최소 면적 이하 제거", "params": ["minArea"]}
        ],
        "advanced": [
            {"id": "convex_hull", "name": "Convex Hull", "description": "볼록 껍질", "params": []},
            {"id": "distance_transform", "name": "Distance Transform", "description": "중심부만 남기기", "params": ["thresholdRatio"]},
            {"id": "skeleton", "name": "Skeleton", "description": "골격화 (scikit-image 필요)", "params": []},
            {"id": "watershed", "name": "Watershed", "description": "겹친 객체 분리", "params": []}
        ],
        "utility": [
            {"id": "invert", "name": "반전", "description": "흑백 반전", "params": []},
            {"id": "fill_holes", "name": "구멍 메우기", "description": "내부 구멍 채우기", "params": []},
            {"id": "smooth_edges", "name": "경계 부드럽게", "description": "Gaussian + Threshold", "params": ["kernelSize"]}
        ]
    }


# ========== Save Endpoints ==========

@router.post("/select-output-folder")
async def select_output_folder():
    """
    출력 폴더 선택 다이얼로그
    """
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        folder_path = filedialog.askdirectory(title="출력 폴더 선택")

        root.destroy()

        if not folder_path:
            return {"success": False, "message": "폴더가 선택되지 않았습니다."}

        return {"success": True, "folderPath": folder_path}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/save")
async def save_mask_and_patch(request: SaveRequest):
    """
    현재 Mask 및 Patch 저장
    """
    global _current_session

    if _current_session["mask"] is None:
        raise HTTPException(status_code=400, detail="저장할 마스크가 없습니다.")

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지가 로드되지 않았습니다.")

    try:
        output_folder = Path(request.outputFolder)
        output_folder.mkdir(parents=True, exist_ok=True)

        # 기존 파일 수 확인하여 번호 매기기
        existing_files = list(output_folder.glob(f"{request.prefix}_*_mask.png"))
        next_id = len(existing_files) + 1

        mask = _current_session["mask"]
        image = _current_session["image"]

        # Bounding Box 계산
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        saved_files = []

        if contours:
            # 가장 큰 contour 사용
            largest = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest)

            # ROI 추출
            patch = image[y:y+h, x:x+w].copy()
            mask_roi = mask[y:y+h, x:x+w]

            # 파일명 생성
            mask_filename = f"{request.prefix}_{next_id:05d}_mask.png"
            patch_filename = f"{request.prefix}_{next_id:05d}_patch.png"

            # 저장
            mask_path = output_folder / mask_filename
            patch_path = output_folder / patch_filename

            cv2.imwrite(str(mask_path), mask_roi)
            cv2.imwrite(str(patch_path), patch)

            saved_files = [mask_filename, patch_filename]

        return {
            "success": True,
            "savedFiles": saved_files,
            "outputFolder": str(output_folder),
            "message": f"저장 완료: {', '.join(saved_files)}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")


@router.post("/save-all")
async def save_all_contours(request: SaveRequest):
    """
    모든 추출된 contour 저장
    """
    global _current_session, _yolo_extractor

    if _current_session["image"] is None:
        raise HTTPException(status_code=400, detail="이미지가 로드되지 않았습니다.")

    contours = _current_session.get("contours", [])
    if not contours:
        raise HTTPException(status_code=400, detail="저장할 contour가 없습니다.")

    try:
        output_folder = Path(request.outputFolder)
        output_folder.mkdir(parents=True, exist_ok=True)

        image = _current_session["image"]
        saved_files = []

        for idx, contour in enumerate(contours):
            mask, patch, mask_roi, bbox = _yolo_extractor.extract_mask_and_patch(image, contour)

            mask_filename = f"{request.prefix}_{idx+1:05d}_mask.png"
            patch_filename = f"{request.prefix}_{idx+1:05d}_patch.png"

            cv2.imwrite(str(output_folder / mask_filename), mask_roi)
            cv2.imwrite(str(output_folder / patch_filename), patch)

            saved_files.extend([mask_filename, patch_filename])

        return {
            "success": True,
            "totalSaved": len(contours),
            "savedFiles": saved_files,
            "outputFolder": str(output_folder),
            "message": f"{len(contours)}개 contour 저장 완료"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")


# ========== Session Info Endpoint ==========

@router.get("/session-info")
async def get_session_info():
    """
    현재 세션 정보 반환
    """
    global _current_session, _yolo_extractor

    return {
        "hasImage": _current_session["image"] is not None,
        "imagePath": _current_session.get("image_path"),
        "imageSize": {
            "width": _current_session["image"].shape[1] if _current_session["image"] is not None else 0,
            "height": _current_session["image"].shape[0] if _current_session["image"] is not None else 0
        } if _current_session["image"] is not None else None,
        "hasMask": _current_session["mask"] is not None,
        "contourCount": len(_current_session.get("contours", [])),
        "currentContourIndex": _current_session.get("current_contour_idx", 0),
        "yoloModelLoaded": _yolo_extractor is not None and _yolo_extractor.is_model_loaded()
    }
