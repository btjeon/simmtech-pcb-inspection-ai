# pages/extractors/polygon_extractor.py
"""
수동 폴리곤 드로잉 기반 추출
"""

import cv2
import numpy as np
from .base_extractor import BaseExtractor, ExtractionMode


class PolygonExtractor(BaseExtractor):
    """
    수동 폴리곤 드로잉 기반 추출
    """
    
    def __init__(self):
        super().__init__(ExtractionMode.POLYGON)
    
    def extract(self, image, polygon_points):
        """
        폴리곤 점들로부터 마스크 생성
        
        Args:
            image: BGR 이미지
            polygon_points: [(x1, y1), (x2, y2), ...] 리스트
        
        Returns:
            mask: 이진 마스크 (uint8, 0 or 255)
        """
        if not polygon_points or len(polygon_points) < 3:
            print("경고: 폴리곤 점이 3개 미만입니다.")
            return np.zeros(image.shape[:2], dtype=np.uint8)
        
        H, W = image.shape[:2]
        mask = np.zeros((H, W), dtype=np.uint8)
        
        # 폴리곤을 numpy array로 변환
        pts = np.array(polygon_points, dtype=np.int32)
        
        # 폴리곤 그리기 (내부 채우기)
        cv2.fillPoly(mask, [pts], 255)
        
        return mask
    
    def extract_with_bbox(self, image, polygon_points):
        """
        폴리곤 + Bounding Box 정보 함께 반환
        
        Args:
            image: BGR 이미지
            polygon_points: [(x1, y1), (x2, y2), ...]
        
        Returns:
            mask: 전체 이미지 크기 마스크
            bbox: (x, y, w, h) Bounding Box
            patch: crop된 패치 이미지
            mask_roi: crop된 마스크
        """
        mask = self.extract(image, polygon_points)
        
        if mask is None or mask.max() == 0:
            return mask, None, None, None
        
        # Bounding Box 계산
        pts = np.array(polygon_points, dtype=np.int32)
        x, y, w, h = cv2.boundingRect(pts)
        
        # ROI 추출
        patch = image[y:y+h, x:x+w].copy()
        mask_roi = mask[y:y+h, x:x+w]
        
        return mask, (x, y, w, h), patch, mask_roi
    
    def validate_polygon(self, polygon_points, image_shape):
        """
        폴리곤 유효성 검사
        
        Args:
            polygon_points: [(x1, y1), ...]
            image_shape: (height, width)
        
        Returns:
            bool: 유효 여부
            str: 메시지
        """
        if not polygon_points:
            return False, "폴리곤 점이 없습니다."
        
        if len(polygon_points) < 3:
            return False, "폴리곤 점이 3개 미만입니다."
        
        H, W = image_shape[:2]
        
        # 모든 점이 이미지 내부에 있는지 확인
        for x, y in polygon_points:
            if x < 0 or x >= W or y < 0 or y >= H:
                return False, f"점 ({x}, {y})이 이미지 범위를 벗어났습니다."
        
        # 폴리곤 면적 계산
        pts = np.array(polygon_points, dtype=np.int32)
        area = cv2.contourArea(pts)
        
        if area < 10:
            return False, f"폴리곤 면적이 너무 작습니다 (area={area:.1f})."
        
        return True, "유효한 폴리곤입니다."
    
    def simplify_polygon(self, polygon_points, epsilon=2.0):
        """
        폴리곤 단순화 (Douglas-Peucker)
        
        Args:
            polygon_points: [(x1, y1), ...]
            epsilon: 근사 정확도
        
        Returns:
            simplified_points: 단순화된 점 리스트
        """
        pts = np.array(polygon_points, dtype=np.int32)
        
        # Approximate polygon
        approx = cv2.approxPolyDP(pts, epsilon, closed=True)
        
        # Convert back to list of tuples
        simplified = [(int(p[0][0]), int(p[0][1])) for p in approx]
        
        return simplified
