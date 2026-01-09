# pages/extractors/mask_post_processor.py
"""
마스크 후처리
세계 최고 수준 이미지 처리 알고리즘 적용
"""

import cv2
import numpy as np


class MaskPostProcessor:
    """
    마스크 후처리 클래스
    
    지원 기능:
      - Morphology (Opening, Closing, Erode, Dilate, Gradient)
      - Threshold (Otsu + Offset)
      - Filter (Gaussian, Median, Bilateral)
      - Contour (선택, 병합)
      - 고급 처리 (Convex Hull, Distance Transform, Skeleton)
    """
    
    def __init__(self):
        self.otsu_threshold = None
        # scikit-image 사용 가능 여부 확인
        self._skimage_available = self._check_skimage()
    
    def _check_skimage(self):
        """scikit-image 사용 가능 여부 체크"""
        try:
            import skimage
            return True
        except ImportError:
            return False
    
    # ========== Morphology Operations ==========
    
    def apply_opening(self, mask, kernel_size=3, iterations=1):
        """
        Opening 연산 (Erosion → Dilation)
        작은 노이즈 제거
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=iterations)
    
    def apply_closing(self, mask, kernel_size=3, iterations=1):
        """
        Closing 연산 (Dilation → Erosion)
        작은 구멍 메우기
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=iterations)
    
    def apply_erode(self, mask, kernel_size=3, iterations=1):
        """
        Erosion (침식)
        마스크 축소
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.erode(mask, kernel, iterations=iterations)
    
    def apply_dilate(self, mask, kernel_size=3, iterations=1):
        """
        Dilation (팽창)
        마스크 확대
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.dilate(mask, kernel, iterations=iterations)
    
    def apply_morphological_gradient(self, mask, kernel_size=3):
        """
        Morphological Gradient (Dilation - Erosion)
        경계 강조
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.morphologyEx(mask, cv2.MORPH_GRADIENT, kernel)
    
    def apply_tophat(self, mask, kernel_size=9):
        """
        Top-Hat Transform (Original - Opening)
        밝은 영역 추출
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.morphologyEx(mask, cv2.MORPH_TOPHAT, kernel)
    
    def apply_blackhat(self, mask, kernel_size=9):
        """
        Black-Hat Transform (Closing - Original)
        어두운 영역 추출
        """
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.morphologyEx(mask, cv2.MORPH_BLACKHAT, kernel)
    
    # ========== Threshold Operations ==========
    
    def adjust_threshold_offset(self, gray_roi, offset=0):
        """
        Otsu Threshold + Offset 적용
        
        Args:
            gray_roi: Grayscale ROI 이미지
            offset: 임계값 오프셋 (-255 ~ 255)
        
        Returns:
            Binary mask (uint8)
        """
        # Otsu 임계값 계산
        otsu_val, _ = cv2.threshold(gray_roi, 0, 255,
                                    cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        self.otsu_threshold = int(otsu_val)
        
        # Offset 적용
        threshold = np.clip(self.otsu_threshold + offset, 0, 255)
        
        _, binary = cv2.threshold(gray_roi, threshold, 255, cv2.THRESH_BINARY)
        
        return binary
    
    def apply_adaptive_gaussian(self, gray, block_size=11, c=2):
        """
        Adaptive Gaussian Threshold
        """
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, block_size, c
        )
    
    def apply_adaptive_mean(self, gray, block_size=11, c=2):
        """
        Adaptive Mean Threshold
        """
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY, block_size, c
        )
    
    # ========== Filter Operations ==========
    
    def apply_gaussian_filter(self, mask, kernel_size=5):
        """
        Gaussian Blur
        부드러운 마스크
        """
        if kernel_size % 2 == 0:
            kernel_size += 1
        return cv2.GaussianBlur(mask, (kernel_size, kernel_size), 0)
    
    def apply_median_filter(self, mask, kernel_size=5):
        """
        Median Filter
        노이즈 제거 (salt-and-pepper)
        """
        if kernel_size % 2 == 0:
            kernel_size += 1
        return cv2.medianBlur(mask, kernel_size)
    
    def apply_bilateral_filter(self, mask, d=9, sigma_color=75, sigma_space=75):
        """
        Bilateral Filter
        경계 보존 노이즈 제거
        """
        return cv2.bilateralFilter(mask, d, sigma_color, sigma_space)
    
    # ========== Contour Operations ==========
    
    def select_largest_contour(self, mask):
        """
        가장 큰 Contour만 선택
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask
        
        largest = max(contours, key=cv2.contourArea)
        
        new_mask = np.zeros_like(mask)
        cv2.drawContours(new_mask, [largest], -1, 255, -1)
        
        return new_mask
    
    def select_center_contour(self, mask):
        """
        중앙에 가장 가까운 Contour 선택
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask
        
        h, w = mask.shape[:2]
        center = np.array([w // 2, h // 2])
        
        best_contour = None
        best_dist = float('inf')
        
        for cnt in contours:
            M = cv2.moments(cnt)
            if M['m00'] == 0:
                continue
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            dist = np.linalg.norm(center - np.array([cx, cy]))
            
            if dist < best_dist:
                best_dist = dist
                best_contour = cnt
        
        if best_contour is None:
            return mask
        
        new_mask = np.zeros_like(mask)
        cv2.drawContours(new_mask, [best_contour], -1, 255, -1)
        
        return new_mask
    
    def merge_all_contours(self, mask):
        """
        모든 Contour 병합 (Convex Hull)
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask
        
        # 모든 점 수집
        all_points = np.vstack(contours)
        
        # Convex Hull
        hull = cv2.convexHull(all_points)
        
        new_mask = np.zeros_like(mask)
        cv2.drawContours(new_mask, [hull], -1, 255, -1)
        
        return new_mask
    
    def filter_small_contours(self, mask, min_area=100):
        """
        작은 Contour 제거
        
        Args:
            min_area: 최소 면적 (픽셀)
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask
        
        new_mask = np.zeros_like(mask)
        
        for cnt in contours:
            if cv2.contourArea(cnt) >= min_area:
                cv2.drawContours(new_mask, [cnt], -1, 255, -1)
        
        return new_mask
    
    # ========== Advanced Operations ==========
    
    def apply_convex_hull(self, mask):
        """
        Convex Hull (볼록 껍질)
        각 Contour를 볼록하게 만듦
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return mask
        
        hull_mask = np.zeros_like(mask)
        
        for cnt in contours:
            hull = cv2.convexHull(cnt)
            cv2.drawContours(hull_mask, [hull], -1, 255, -1)
        
        return hull_mask
    
    def refine_with_distance_transform(self, mask, threshold_ratio=0.7):
        """
        Distance Transform 기반 마스크 정제
        중심부만 남기기
        
        Args:
            threshold_ratio: 임계값 비율 (0.0 ~ 1.0)
        """
        # Distance Transform
        dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        # 임계값 적용
        _, refined = cv2.threshold(dist_transform,
                                  threshold_ratio * dist_transform.max(),
                                  255, cv2.THRESH_BINARY)
        
        return refined.astype(np.uint8)
    
    def apply_skeleton(self, mask):
        """
        Skeletonization (골격화)
        마스크를 1픽셀 두께의 골격으로 변환
        
        Note: scikit-image 필요 (선택적 기능)
        """
        if not self._skimage_available:
            print("⚠️  scikit-image가 설치되지 않았습니다.")
            print("   골격화 기능을 사용하려면: pip install scikit-image")
            return mask
        
        try:
            # ★ import를 함수 내부에서 수행 (경고 방지)
            from skimage.morphology import skeletonize
            skeleton = skeletonize(mask // 255).astype(np.uint8) * 255
            return skeleton
        except Exception as e:
            print(f"골격화 실패: {e}")
            return mask
    
    def apply_watershed_refinement(self, mask):
        """
        Watershed 기반 정제
        겹친 객체 분리
        """
        # Distance Transform
        dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        # Sure foreground
        _, sure_fg = cv2.threshold(dist_transform,
                                  0.7 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)
        
        # Sure background
        kernel = np.ones((3, 3), np.uint8)
        sure_bg = cv2.dilate(mask, kernel, iterations=3)
        
        # Unknown
        unknown = cv2.subtract(sure_bg, sure_fg)
        
        # Markers
        _, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0
        
        # Watershed (3채널 필요)
        mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        markers = cv2.watershed(mask_3ch, markers)
        
        # 결과
        refined = np.zeros_like(mask)
        refined[markers > 1] = 255
        
        return refined
    
    # ========== Utility Operations ==========
    
    def invert_mask(self, mask):
        """마스크 반전 (흑백 반전)"""
        return cv2.bitwise_not(mask)
    
    def fill_holes(self, mask):
        """
        구멍 메우기
        Flood Fill 기반
        """
        # Flood Fill
        h, w = mask.shape
        mask_floodfill = mask.copy()
        
        # Mask 크기보다 2픽셀 큰 마스크 생성
        flood_mask = np.zeros((h + 2, w + 2), np.uint8)
        
        # Flood Fill (좌상단 시작)
        cv2.floodFill(mask_floodfill, flood_mask, (0, 0), 255)
        
        # 반전
        mask_floodfill_inv = cv2.bitwise_not(mask_floodfill)
        
        # 원본 + 반전 = 구멍 메움
        filled = mask | mask_floodfill_inv
        
        return filled
    
    def smooth_edges(self, mask, kernel_size=5):
        """
        경계 부드럽게 (Gaussian Blur + Threshold)
        """
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        blurred = cv2.GaussianBlur(mask, (kernel_size, kernel_size), 0)
        _, smoothed = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)
        
        return smoothed
    
    def extract_contour_features(self, mask):
        """
        Contour 특징 추출 (디버깅/분석용)
        
        Returns:
            dict: {
                'count': Contour 개수,
                'areas': 면적 리스트,
                'perimeters': 둘레 리스트,
                'centroids': 중심점 리스트
            }
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
        
        features = {
            'count': len(contours),
            'areas': [],
            'perimeters': [],
            'centroids': []
        }
        
        for cnt in contours:
            features['areas'].append(cv2.contourArea(cnt))
            features['perimeters'].append(cv2.arcLength(cnt, True))
            
            M = cv2.moments(cnt)
            if M['m00'] != 0:
                cx = int(M['m10'] / M['m00'])
                cy = int(M['m01'] / M['m00'])
                features['centroids'].append((cx, cy))
            else:
                features['centroids'].append(None)
        
        return features
    
    def reset_otsu_threshold(self):
        """Otsu 임계값 초기화"""
        self.otsu_threshold = None
    
    def is_skimage_available(self):
        """scikit-image 사용 가능 여부 반환"""
        return self._skimage_available
