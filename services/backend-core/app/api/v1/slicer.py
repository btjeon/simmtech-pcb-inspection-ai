# ============================================================
#   이미지 슬라이서 API 라우터 (FastAPI)
#   PCB Inspection AI - 백엔드 API
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from tkinter import Tk, filedialog
import os
from PIL import Image
import math
from concurrent.futures import ThreadPoolExecutor
import time
from typing import Optional
import base64
from io import BytesIO

# Router 생성
router = APIRouter()


# ============================================================
# Request/Response Models
# ============================================================
class ImageSelectResponse(BaseModel):
    success: bool
    imagePath: Optional[str] = None
    imageSize: Optional[dict] = None
    imagePreview: Optional[str] = None  # base64 encoded thumbnail
    message: Optional[str] = None
    error: Optional[str] = None


class FolderSelectResponse(BaseModel):
    success: bool
    folderPath: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


class SlicingRequest(BaseModel):
    imagePath: str
    outputFolder: str
    sliceWidth: int = 512
    sliceHeight: int = 512
    overlapRatio: int = 0
    fileFormat: str = 'jpg'
    namingPattern: str = 'slice_{row}_{col}'


class SlicingResponse(BaseModel):
    success: bool
    totalSlices: Optional[int] = None
    rows: Optional[int] = None
    cols: Optional[int] = None
    elapsedTime: Optional[float] = None
    outputFolder: Optional[str] = None
    thumbnails: Optional[list] = None  # List of base64 encoded thumbnails (max 20)
    error: Optional[str] = None


# ============================================================
# 이미지 파일 선택 (파일 다이얼로그)
# ============================================================
@router.post('/select-image', response_model=ImageSelectResponse)
async def select_image():
    """이미지 파일 선택 다이얼로그를 열고 선택된 파일 경로 반환"""
    try:
        # Tkinter 루트 윈도우 생성 (숨김)
        root = Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        # 파일 선택 다이얼로그
        file_path = filedialog.askopenfilename(
            title="이미지 선택",
            filetypes=[
                ("All Images", "*.bmp *.png *.jpg *.jpeg *.gif *.tif *.tiff *.webp"),
                ("BMP Files", "*.bmp"),
                ("PNG Files", "*.png"),
                ("JPG Files", "*.jpg *.jpeg"),
                ("TIFF Files", "*.tif *.tiff"),
                ("WEBP Files", "*.webp"),
                ("All Files", "*.*")
            ]
        )

        root.destroy()

        if not file_path:
            return ImageSelectResponse(
                success=False,
                message='파일을 선택하지 않았습니다.'
            )

        # 이미지 크기 읽기 및 썸네일 생성
        try:
            with Image.open(file_path) as img:
                width, height = img.size
                img_format = img.format or 'Unknown'

                # 썸네일 생성 (max 300px)
                img.thumbnail((300, 300))
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

            return ImageSelectResponse(
                success=True,
                imagePath=file_path,
                imageSize={'width': width, 'height': height, 'format': img_format},
                imagePreview=f"data:image/jpeg;base64,{img_base64}"
            )

        except Exception as e:
            return ImageSelectResponse(
                success=False,
                error=f'이미지를 읽을 수 없습니다: {str(e)}'
            )

    except Exception as e:
        return ImageSelectResponse(
            success=False,
            error=f'파일 선택 중 오류 발생: {str(e)}'
        )


# ============================================================
# 출력 폴더 선택 (폴더 다이얼로그)
# ============================================================
@router.post('/select-folder', response_model=FolderSelectResponse)
async def select_folder():
    """출력 폴더 선택 다이얼로그를 열고 선택된 폴더 경로 반환"""
    try:
        # Tkinter 루트 윈도우 생성 (숨김)
        root = Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        # 폴더 선택 다이얼로그
        folder_path = filedialog.askdirectory(title="출력 폴더 선택")

        root.destroy()

        if not folder_path:
            return FolderSelectResponse(
                success=False,
                message='폴더를 선택하지 않았습니다.'
            )

        return FolderSelectResponse(
            success=True,
            folderPath=folder_path
        )

    except Exception as e:
        return FolderSelectResponse(
            success=False,
            error=f'폴더 선택 중 오류 발생: {str(e)}'
        )


# ============================================================
# 이미지 슬라이싱 처리
# ============================================================
@router.post('/process', response_model=SlicingResponse)
async def process_image_slicing(request: SlicingRequest):
    """이미지를 지정된 크기로 분할하여 저장"""
    try:
        # 파라미터 추출
        image_path = request.imagePath
        output_folder = request.outputFolder
        slice_width = request.sliceWidth
        slice_height = request.sliceHeight
        overlap_ratio = request.overlapRatio
        file_format = request.fileFormat
        naming_pattern = request.namingPattern

        # 입력 검증
        if not image_path or not os.path.exists(image_path):
            return SlicingResponse(
                success=False,
                error='유효하지 않은 이미지 경로입니다.'
            )

        if not output_folder:
            return SlicingResponse(
                success=False,
                error='출력 폴더를 지정해주세요.'
            )

        # Overlap 픽셀 계산
        if overlap_ratio < 0:
            overlap_ratio = 0
        if overlap_ratio >= 100:
            overlap_ratio = 99

        overlap_x_px = int(slice_width * (overlap_ratio / 100))
        overlap_y_px = int(slice_height * (overlap_ratio / 100))

        step_x = max(1, slice_width - overlap_x_px)
        step_y = max(1, slice_height - overlap_y_px)

        # 출력 폴더 생성
        os.makedirs(output_folder, exist_ok=True)

        # 시작 시간
        start_time = time.time()

        # 이미지 열기
        img = Image.open(image_path).convert("RGB")
        img_width, img_height = img.size

        # 행/열 계산
        cols = math.ceil((img_width - slice_width) / step_x) + 1
        rows = math.ceil((img_height - slice_height) / step_y) + 1

        # 슬라이스 작업 목록 생성
        tasks = []
        for r in range(rows):
            for c in range(cols):
                left = c * step_x
                upper = r * step_y
                right = left + slice_width
                lower = upper + slice_height

                crop_box = (
                    max(left, 0),
                    max(upper, 0),
                    min(right, img_width),
                    min(lower, img_height)
                )

                paste_x = 0 if left >= 0 else abs(left)
                paste_y = 0 if upper >= 0 else abs(upper)

                # 파일명 생성
                filename = naming_pattern.replace('{row}', str(r))
                filename = filename.replace('{col}', str(c))
                filename = filename.replace('{index}', str(r * cols + c))
                filename = f"{filename}.{file_format}"

                tasks.append((crop_box, paste_x, paste_y, filename))

        # 슬라이스 처리 함수
        def process_slice(task):
            crop_box, paste_x, paste_y, filename = task
            cropped_img = img.crop(crop_box)
            padded_img = Image.new("RGB", (slice_width, slice_height), (0, 0, 0))
            padded_img.paste(cropped_img, (paste_x, paste_y))

            output_path = os.path.join(output_folder, filename)

            # 파일 형식에 따라 저장
            if file_format.lower() in ['jpg', 'jpeg']:
                padded_img.save(output_path, 'JPEG', quality=95)
            elif file_format.lower() == 'png':
                padded_img.save(output_path, 'PNG')
            elif file_format.lower() == 'bmp':
                padded_img.save(output_path, 'BMP')
            else:
                padded_img.save(output_path)

        # 병렬 처리
        max_workers = min(os.cpu_count() or 4, 8)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            executor.map(process_slice, tasks)

        # 완료 시간
        end_time = time.time()
        elapsed_time = end_time - start_time

        # 결과 썸네일 생성 (최대 20개)
        thumbnails = []
        thumbnail_count = min(20, len(tasks))
        for i in range(thumbnail_count):
            _, _, _, filename = tasks[i]
            result_path = os.path.join(output_folder, filename)
            try:
                with Image.open(result_path) as result_img:
                    result_img.thumbnail((150, 150))
                    buffered = BytesIO()
                    result_img.save(buffered, format="JPEG")
                    thumb_base64 = base64.b64encode(buffered.getvalue()).decode()
                    thumbnails.append({
                        'filename': filename,
                        'data': f"data:image/jpeg;base64,{thumb_base64}"
                    })
            except:
                pass

        return SlicingResponse(
            success=True,
            totalSlices=len(tasks),
            rows=rows,
            cols=cols,
            elapsedTime=round(elapsed_time, 2),
            outputFolder=output_folder,
            thumbnails=thumbnails
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return SlicingResponse(
            success=False,
            error=f'슬라이싱 처리 중 오류 발생: {str(e)}'
        )
