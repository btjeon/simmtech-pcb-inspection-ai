# pages/extractors/base_extractor.py
"""
추출기 기본 클래스 및 Enum
"""

from enum import Enum
from abc import ABC, abstractmethod


class ExtractionMode(Enum):
    """추출 모드"""
    YOLO = "yolo"
    BOX_AUTO = "box_auto"
    POLYGON = "polygon"


class BaseExtractor(ABC):
    """
    추출기 기본 클래스
    모든 추출기는 이 클래스를 상속받아야 함
    """
    
    def __init__(self, mode: ExtractionMode):
        """
        Args:
            mode: ExtractionMode Enum
        """
        self.mode = mode
    
    @abstractmethod
    def extract(self, *args, **kwargs):
        """
        추출 메서드 (서브클래스에서 구현 필요)
        
        Returns:
            mask: 이진 마스크 (numpy array, uint8)
        """
        pass
    
    def get_mode(self) -> ExtractionMode:
        """현재 모드 반환"""
        return self.mode
    
    def get_mode_name(self) -> str:
        """현재 모드 이름 반환"""
        return self.mode.value
