# pages/extractors/yolo_extractor.py
"""
YOLO 기반 자동 추출 (최종 수정 버전)
"""

import cv2
import numpy as np
from .base_extractor import BaseExtractor, ExtractionMode


class YOLOExtractor(BaseExtractor):
    """
    YOLO Segmentation 모델 기반 자동 추출
    """
    
    def __init__(self, model_path: str):
        """
        Args:
            model_path: YOLO 모델 파일 경로 (.pt)
        """
        super().__init__(ExtractionMode.YOLO)
        self.model_path = model_path
        self.model = None
        self.min_area = 20
    
    def load_model(self):
        """YOLO 모델 로드"""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            
            # Warm-up
            dummy = np.zeros((640, 640, 3), dtype=np.uint8)
            _ = self.model.predict(dummy, imgsz=640, verbose=False)
            
            return True, "모델 로드 성공"
        except Exception as e:
            return False, f"모델 로드 실패: {e}"
    
    def extract(self, image):
        """
        YOLO로 이미지에서 모든 객체 추출
        
        Args:
            image: BGR 이미지 (numpy array)
        
        Returns:
            contours: 추출된 contour 리스트
        """
        if self.model is None:
            print("경고: YOLO 모델이 로드되지 않았습니다.")
            return []
        
        contours = []
        
        try:
            # YOLO 추론
            results = self.model.predict(source=image, verbose=False)
            
            if not results:
                print("YOLO 결과가 없습니다.")
                return []
            
            H, W = image.shape[:2]
            
            for r in results:
                # ★ masks 존재 여부 확인 (중요!)
                if not hasattr(r, 'masks') or r.masks is None:
                    print("경고: Segmentation mask가 없습니다. Detection 전용 모델일 수 있습니다.")
                    continue
                
                # ★ masks.data 접근 (안전하게)
                try:
                    # GPU 텐서를 CPU numpy로 변환
                    if hasattr(r.masks.data, 'cpu'):
                        segs = r.masks.data.cpu().numpy()
                    else:
                        segs = r.masks.data
                    
                    # numpy array가 아닌 경우 변환
                    if not isinstance(segs, np.ndarray):
                        segs = np.array(segs)
                    
                except Exception as e:
                    print(f"masks 데이터 변환 실패: {e}")
                    continue
                
                # 각 마스크 처리
                for seg in segs:
                    try:
                        # 마스크를 uint8로 변환
                        mask = (seg * 255).astype(np.uint8)
                        
                        # 원본 이미지 크기로 resize
                        mask = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST)
                        
                        # 이진화
                        mask = (mask > 127).astype(np.uint8) * 255
                        
                        # Contour 찾기
                        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                                   cv2.CHAIN_APPROX_SIMPLE)
                        
                        # 최소 면적 이상인 contour만 추가
                        for cnt in cnts:
                            if cv2.contourArea(cnt) >= self.min_area:
                                contours.append(cnt)
                    
                    except Exception as e:
                        print(f"개별 마스크 처리 실패: {e}")
                        continue
        
        except Exception as e:
            print(f"YOLO 추출 실패: {e}")
            import traceback
            traceback.print_exc()
        
        return contours
    
    def extract_single(self, image, contour):
        """
        특정 contour에서 마스크 생성
        
        Args:
            image: BGR 이미지
            contour: numpy contour
        
        Returns:
            mask: 이진 마스크
            patch: crop된 패치 이미지
        """
        H, W = image.shape[:2]
        x, y, w, h = cv2.boundingRect(contour)
        
        # 마스크 생성
        mask = np.zeros((H, W), dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)
        
        # 패치 추출
        patch = image[y:y+h, x:x+w].copy()
        mask_roi = mask[y:y+h, x:x+w]
        
        return mask_roi, patch
    
    def extract_mask_from_contour(self, image, contour):
        """
        ★ Contour에서 전체 마스크 추출
        
        Args:
            image: BGR 이미지
            contour: numpy contour
        
        Returns:
            mask: 전체 이미지 크기의 이진 마스크 (uint8, 0 or 255)
        """
        H, W = image.shape[:2]
        
        # 전체 이미지 크기의 빈 마스크 생성
        mask = np.zeros((H, W), dtype=np.uint8)
        
        # Contour를 마스크에 그리기 (내부 채우기)
        cv2.drawContours(mask, [contour], -1, 255, -1)
        
        return mask
    
    def extract_patch_from_contour(self, image, contour):
        """
        Contour에서 패치 이미지 추출
        
        Args:
            image: BGR 이미지
            contour: numpy contour
        
        Returns:
            patch: crop된 패치 이미지 (BGR)
            bbox: (x, y, w, h) Bounding Box
        """
        # Bounding Box 계산
        x, y, w, h = cv2.boundingRect(contour)
        
        # 패치 추출
        patch = image[y:y+h, x:x+w].copy()
        
        return patch, (x, y, w, h)
    
    def extract_mask_and_patch(self, image, contour):
        """
        Contour에서 마스크 + 패치 동시 추출
        
        Args:
            image: BGR 이미지
            contour: numpy contour
        
        Returns:
            mask: 전체 이미지 크기 마스크
            patch: crop된 패치
            mask_roi: crop된 마스크
            bbox: (x, y, w, h)
        """
        H, W = image.shape[:2]
        x, y, w, h = cv2.boundingRect(contour)
        
        # 전체 마스크
        mask = np.zeros((H, W), dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)
        
        # ROI 추출
        patch = image[y:y+h, x:x+w].copy()
        mask_roi = mask[y:y+h, x:x+w]
        
        return mask, patch, mask_roi, (x, y, w, h)
    
    def get_contour_info(self, contour):
        """
        Contour 정보 추출
        
        Args:
            contour: numpy contour
        
        Returns:
            dict: {
                'area': 면적,
                'perimeter': 둘레,
                'bbox': (x, y, w, h),
                'center': (cx, cy)
            }
        """
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        x, y, w, h = cv2.boundingRect(contour)
        
        # 중심점
        M = cv2.moments(contour)
        if M['m00'] != 0:
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
        else:
            cx, cy = x + w // 2, y + h // 2
        
        return {
            'area': area,
            'perimeter': perimeter,
            'bbox': (x, y, w, h),
            'center': (cx, cy)
        }
    
    def set_min_area(self, min_area: int):
        """최소 면적 설정"""
        self.min_area = max(1, min_area)
    
    def is_model_loaded(self) -> bool:
        """모델 로드 여부 확인"""
        return self.model is not None
    
    def get_model_info(self):
        """
        모델 정보 반환
        
        Returns:
            dict: 모델 정보
        """
        if not self.is_model_loaded():
            return {
                'loaded': False,
                'path': self.model_path,
                'min_area': self.min_area
            }
        
        return {
            'loaded': True,
            'path': self.model_path,
            'min_area': self.min_area,
            'model_type': type(self.model).__name__
        }
    
    def check_model_type(self):
        """
        모델 타입 확인 (Detection vs Segmentation)
        
        Returns:
            str: "segmentation", "detection", 또는 "unknown"
        """
        if not self.is_model_loaded():
            return "unknown"
        
        try:
            # 테스트 이미지로 추론
            dummy = np.zeros((640, 640, 3), dtype=np.uint8)
            results = self.model.predict(dummy, verbose=False)
            
            if results and len(results) > 0:
                r = results[0]
                if hasattr(r, 'masks') and r.masks is not None:
                    return "segmentation"
                elif hasattr(r, 'boxes') and r.boxes is not None:
                    return "detection"
            
            return "unknown"
        
        except Exception as e:
            print(f"모델 타입 확인 실패: {e}")
            return "unknown"