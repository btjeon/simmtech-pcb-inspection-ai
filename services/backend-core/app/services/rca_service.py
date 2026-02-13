"""
RCA (Root Cause Analysis) Service
PCB 불량 이미지 분석 및 원인 진단 서비스
"""

import base64
import io
import json
import uuid
from datetime import datetime
from typing import Optional, List
from PIL import Image
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.schema import RCAAnalysisHistory
from app.database.connection import SessionLocal


# 이미지 분석용 시스템 프롬프트
IMAGE_ANALYSIS_PROMPT = """You are a PCB (Printed Circuit Board) manufacturing expert and image-based defect analysis specialist.
Analyze the uploaded PCB image to determine if there are any defects, and provide detailed diagnosis if defects are found.

**Analysis Procedure**:
1. Carefully observe the PCB condition in the image
2. Identify defect type (open circuit, short circuit, plating defect, solder mask defect, pinhole, scratch, etc.)
3. Evaluate defect location and severity
4. Provide root cause analysis and solutions

**IMPORTANT: Respond in Korean language for all text fields.**
**Response must be in the following JSON format only**:
{
  "defect_detected": true/false,
  "defect_type": "Defect type name in Korean",
  "severity": "high/medium/low",
  "confidence": 0.0~1.0,
  "location": "Defect location description in Korean",
  "analysis": "Detailed analysis in Korean",
  "causes": [
    "Cause 1 in Korean",
    "Cause 2 in Korean",
    "Cause 3 in Korean"
  ],
  "solutions": [
    "Solution 1 in Korean",
    "Solution 2 in Korean",
    "Solution 3 in Korean"
  ],
  "process_checks": [
    {"process": "Process name in Korean", "check": "Check item in Korean"},
    {"process": "Process name in Korean", "check": "Check item in Korean"}
  ]
}

If the image is not a PCB or there are no defects (normal condition):
{
  "defect_detected": false,
  "defect_type": "Normal (OK)",
  "severity": "low",
  "confidence": 0.95,
  "location": "N/A",
  "analysis": "Normal condition - no defects detected.",
  "causes": [],
  "solutions": [],
  "process_checks": []
}
"""


class RCAService:
    """RCA 서비스 클래스"""

    def __init__(self):
        self.client: Optional[OpenAI] = None
        self._initialize_client()

    def _initialize_client(self):
        """OpenAI 클라이언트 초기화"""
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def is_available(self) -> bool:
        """서비스 사용 가능 여부"""
        return self.client is not None

    def _encode_image(self, image_data: bytes, content_type: str) -> tuple[str, str]:
        """
        이미지를 base64로 인코딩
        BMP는 PNG로 변환
        """
        if 'bmp' in content_type.lower():
            image = Image.open(io.BytesIO(image_data))
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)
            return base64.b64encode(buffer.getvalue()).decode('utf-8'), 'image/png'

        return base64.b64encode(image_data).decode('utf-8'), content_type

    def _save_to_db(self, analysis_id: str, filename: str, analysis_result: dict,
                   usage: dict, additional_context: str = "") -> bool:
        """분석 결과를 DB에 저장"""
        try:
            db = SessionLocal()
            history = RCAAnalysisHistory(
                analysis_id=analysis_id,
                filename=filename,
                defect_detected=analysis_result.get("defect_detected", False),
                defect_type=analysis_result.get("defect_type", ""),
                severity=analysis_result.get("severity", "medium"),
                confidence=analysis_result.get("confidence", 0.0),
                location=analysis_result.get("location", ""),
                analysis=analysis_result.get("analysis", ""),
                causes=analysis_result.get("causes", []),
                solutions=analysis_result.get("solutions", []),
                process_checks=analysis_result.get("process_checks", []),
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                additional_context=additional_context
            )
            db.add(history)
            db.commit()
            db.close()
            return True
        except Exception as e:
            print(f"DB save error: {e}")
            return False

    def save_analysis(self, analysis_id: str, filename: str, analysis_result: dict,
                     usage: dict, additional_context: str = "") -> bool:
        """외부에서 호출 가능한 분석 결과 저장 메서드"""
        return self._save_to_db(analysis_id, filename, analysis_result, usage, additional_context)

    async def analyze_image(
        self,
        image_data: bytes,
        content_type: str,
        filename: str,
        additional_context: str = "",
        save_to_history: bool = True
    ) -> dict:
        """
        PCB 이미지 분석

        Args:
            image_data: 이미지 바이너리 데이터
            content_type: MIME 타입
            filename: 파일명
            additional_context: 추가 컨텍스트

        Returns:
            분석 결과 딕셔너리
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "OpenAI API key is not configured."
            }

        # 파일명 안전하게 처리 (한글 등 비ASCII 문자 포함 가능)
        try:
            safe_filename = filename.encode('utf-8').decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            safe_filename = "image_file"

        try:
            # 이미지 인코딩
            image_base64, image_type = self._encode_image(image_data, content_type)

            # 사용자 메시지 구성
            user_message = "Analyze this PCB image for defects and provide results in JSON format. Respond in Korean for all text fields."
            if additional_context:
                user_message += f"\n\nAdditional context: {additional_context}"

            # OpenAI API 호출
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": IMAGE_ANALYSIS_PROMPT
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": user_message
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{image_type};base64,{image_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )

            # 응답 파싱
            response_text = response.choices[0].message.content

            # JSON 추출 시도
            try:
                # JSON 블록 추출
                if "```json" in response_text:
                    json_str = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    json_str = response_text.split("```")[1].split("```")[0].strip()
                else:
                    json_str = response_text.strip()

                analysis_result = json.loads(json_str)
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 텍스트 응답 반환
                analysis_result = {
                    "defect_detected": True,
                    "defect_type": "Analysis Complete",
                    "severity": "medium",
                    "confidence": 0.8,
                    "location": "Entire image",
                    "analysis": response_text,
                    "causes": [],
                    "solutions": [],
                    "process_checks": []
                }

            # 분석 ID 생성
            analysis_id = f"RCA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            result = {
                "success": True,
                "id": analysis_id,
                "filename": safe_filename,
                "timestamp": datetime.now().isoformat(),
                "analysis": analysis_result,
                "usage": usage,
                "saved": save_to_history
            }

            # DB에 저장 (save_to_history가 True일 때만)
            if save_to_history:
                self._save_to_db(analysis_id, safe_filename, analysis_result, usage, additional_context)

            return result

        except Exception as e:
            error_msg = str(e)
            try:
                error_msg = error_msg.encode('utf-8', errors='replace').decode('utf-8')
            except:
                error_msg = "An error occurred during analysis."
            return {
                "success": False,
                "error": error_msg
            }

    def get_history(self, limit: int = 50, offset: int = 0) -> List[dict]:
        """분석 이력 조회 (DB에서)"""
        try:
            db = SessionLocal()
            histories = db.query(RCAAnalysisHistory)\
                .order_by(RCAAnalysisHistory.created_at.desc())\
                .offset(offset)\
                .limit(limit)\
                .all()

            result = []
            for h in histories:
                result.append({
                    "success": True,
                    "id": h.analysis_id,
                    "filename": h.filename,
                    "timestamp": h.created_at.isoformat() if h.created_at else "",
                    "analysis": {
                        "defect_detected": h.defect_detected,
                        "defect_type": h.defect_type,
                        "severity": h.severity,
                        "confidence": h.confidence,
                        "location": h.location,
                        "analysis": h.analysis,
                        "causes": h.causes or [],
                        "solutions": h.solutions or [],
                        "process_checks": h.process_checks or []
                    },
                    "usage": {
                        "prompt_tokens": h.prompt_tokens,
                        "completion_tokens": h.completion_tokens,
                        "total_tokens": h.total_tokens
                    }
                })
            db.close()
            return result
        except Exception as e:
            print(f"DB query error: {e}")
            return []

    def get_history_item(self, analysis_id: str) -> Optional[dict]:
        """특정 분석 이력 조회 (DB에서)"""
        try:
            db = SessionLocal()
            h = db.query(RCAAnalysisHistory)\
                .filter(RCAAnalysisHistory.analysis_id == analysis_id)\
                .first()
            db.close()

            if not h:
                return None

            return {
                "success": True,
                "id": h.analysis_id,
                "filename": h.filename,
                "timestamp": h.created_at.isoformat() if h.created_at else "",
                "analysis": {
                    "defect_detected": h.defect_detected,
                    "defect_type": h.defect_type,
                    "severity": h.severity,
                    "confidence": h.confidence,
                    "location": h.location,
                    "analysis": h.analysis,
                    "causes": h.causes or [],
                    "solutions": h.solutions or [],
                    "process_checks": h.process_checks or []
                },
                "usage": {
                    "prompt_tokens": h.prompt_tokens,
                    "completion_tokens": h.completion_tokens,
                    "total_tokens": h.total_tokens
                }
            }
        except Exception as e:
            print(f"DB query error: {e}")
            return None

    def delete_history_item(self, analysis_id: str) -> bool:
        """분석 이력 삭제 (DB에서)"""
        try:
            db = SessionLocal()
            h = db.query(RCAAnalysisHistory)\
                .filter(RCAAnalysisHistory.analysis_id == analysis_id)\
                .first()
            if h:
                db.delete(h)
                db.commit()
                db.close()
                return True
            db.close()
            return False
        except Exception as e:
            print(f"DB delete error: {e}")
            return False

    def get_statistics(self) -> dict:
        """통계 정보 (DB에서)"""
        try:
            db = SessionLocal()
            total = db.query(RCAAnalysisHistory).count()
            high = db.query(RCAAnalysisHistory).filter(RCAAnalysisHistory.severity == "high").count()
            medium = db.query(RCAAnalysisHistory).filter(RCAAnalysisHistory.severity == "medium").count()
            low = db.query(RCAAnalysisHistory).filter(RCAAnalysisHistory.severity == "low").count()
            db.close()

            return {
                "total": total,
                "high": high,
                "medium": medium,
                "low": low
            }
        except Exception as e:
            print(f"DB stats error: {e}")
            return {
                "total": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            }


# 싱글톤 인스턴스
rca_service = RCAService()
