"""
Measurement Parameter 기준정보 관리 API
ai_spec_v2.measurement_params 테이블 사용
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pg8000

router = APIRouter(prefix="/measurement-params", tags=["Measurement Parameters"])

# Database connection settings (connection.py와 동일)
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "pcb_inspection_db"
DB_USER = "postgres"
DB_PASSWORD = "0"


# ========== Pydantic Models ==========

class MeasurementParameterBase(BaseModel):
    """Measurement Parameter 기본 모델"""
    name: str
    unit: str
    description: Optional[str] = None


class MeasurementParameterCreate(MeasurementParameterBase):
    """생성용 모델"""
    createdBy: Optional[str] = None


class MeasurementParameterUpdate(BaseModel):
    """수정용 모델"""
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    updatedBy: Optional[str] = None


class MeasurementParameterResponse(MeasurementParameterBase):
    """응답 모델"""
    id: int
    isActive: bool
    createdBy: Optional[str]
    createdAt: datetime
    updatedBy: Optional[str]
    updatedAt: datetime

    class Config:
        from_attributes = True


class MeasurementParameterListResponse(BaseModel):
    """목록 응답 모델"""
    success: bool
    total: int
    data: List[MeasurementParameterResponse]


class DistinctParameterResponse(BaseModel):
    """기존 specifications 테이블에서 distinct한 파라미터 목록"""
    success: bool
    total: int
    data: List[dict]


# ========== Database Helper ==========

def get_db_connection():
    """PostgreSQL 연결 (pg8000 사용)"""
    return pg8000.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


def ensure_table_exists():
    """ai_spec_v2.measurement_params 테이블이 없으면 생성"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_spec_v2.measurement_params (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                unit VARCHAR(50) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        cursor.close()
        conn.close()


# ========== API Endpoints ==========

@router.get("/distinct-from-specs", response_model=DistinctParameterResponse)
async def get_distinct_parameters_from_specs():
    """
    기존 ai_spec_v2.specifications 테이블에서
    DISTINCT한 measurement_name, unit 조합 조회
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT DISTINCT
                measurement_name,
                unit
            FROM ai_spec_v2.specifications
            WHERE measurement_name IS NOT NULL
            ORDER BY measurement_name
        """)

        rows = cursor.fetchall()

        data = []
        for row in rows:
            data.append({
                "name": row[0],
                "unit": row[1] if row[1] else ""
            })

        return DistinctParameterResponse(
            success=True,
            total=len(data),
            data=data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.get("", response_model=MeasurementParameterListResponse)
async def list_measurement_parameters(
    search: Optional[str] = Query(None, description="검색어 (name, unit, description)"),
    isActive: Optional[bool] = Query(None, description="활성 상태 필터"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Measurement Parameter 목록 조회
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 기본 쿼리
        query = """
            SELECT id, name, unit, description, is_active,
                   created_by, created_at, updated_by, updated_at
            FROM ai_spec_v2.measurement_params
            WHERE 1=1
        """
        params = []

        # 검색 조건
        if search:
            query += " AND (name ILIKE %s OR unit ILIKE %s OR description ILIKE %s)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])

        # 활성 상태 필터
        if isActive is not None:
            query += " AND is_active = %s"
            params.append(isActive)

        # 정렬 및 페이징
        query += " ORDER BY name ASC LIMIT %s OFFSET %s"
        params.extend([limit, skip])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # 전체 카운트
        count_query = "SELECT COUNT(*) FROM ai_spec_v2.measurement_params WHERE 1=1"
        count_params = []

        if search:
            count_query += " AND (name ILIKE %s OR unit ILIKE %s OR description ILIKE %s)"
            count_params.extend([search_pattern, search_pattern, search_pattern])

        if isActive is not None:
            count_query += " AND is_active = %s"
            count_params.append(isActive)

        if count_params:
            cursor.execute(count_query, count_params)
        else:
            cursor.execute(count_query)
        total = cursor.fetchone()[0]

        # 응답 데이터 변환
        data = []
        for row in rows:
            data.append(MeasurementParameterResponse(
                id=row[0],
                name=row[1],
                unit=row[2],
                description=row[3],
                isActive=row[4],
                createdBy=row[5],
                createdAt=row[6],
                updatedBy=row[7],
                updatedAt=row[8]
            ))

        return MeasurementParameterListResponse(
            success=True,
            total=total,
            data=data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.get("/{param_id}", response_model=MeasurementParameterResponse)
async def get_measurement_parameter(param_id: str):
    """
    Measurement Parameter 상세 조회
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, name, unit, description, is_active,
                   created_by, created_at, updated_by, updated_at
            FROM ai_spec_v2.measurement_params
            WHERE id = %s
        """, (param_id,))

        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Measurement Parameter를 찾을 수 없습니다.")

        return MeasurementParameterResponse(
            id=row[0],
            name=row[1],
            unit=row[2],
            description=row[3],
            isActive=row[4],
            createdBy=row[5],
            createdAt=row[6],
            updatedBy=row[7],
            updatedAt=row[8]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.post("", response_model=MeasurementParameterResponse)
async def create_measurement_parameter(data: MeasurementParameterCreate):
    """
    Measurement Parameter 신규 등록
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 중복 체크 (name + unit 조합)
        cursor.execute(
            "SELECT id FROM ai_spec_v2.measurement_params WHERE name = %s AND unit = %s",
            (data.name, data.unit)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"이미 존재하는 Parameter입니다: {data.name} ({data.unit})")

        # 신규 등록
        cursor.execute("""
            INSERT INTO ai_spec_v2.measurement_params (name, unit, description, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, unit, description, is_active,
                      created_by, created_at, updated_by, updated_at
        """, (data.name, data.unit, data.description, data.createdBy))

        row = cursor.fetchone()
        conn.commit()

        return MeasurementParameterResponse(
            id=row[0],
            name=row[1],
            unit=row[2],
            description=row[3],
            isActive=row[4],
            createdBy=row[5],
            createdAt=row[6],
            updatedBy=row[7],
            updatedAt=row[8]
        )

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"등록 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.post("/bulk-import")
async def bulk_import_from_specs(createdBy: Optional[str] = None):
    """
    기존 specifications 테이블에서 DISTINCT한 파라미터를
    measurement_parameters 테이블로 일괄 등록
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 기존 specs에서 distinct 조회
        cursor.execute("""
            SELECT DISTINCT
                measurement_name,
                unit
            FROM ai_spec_v2.specifications
            WHERE measurement_name IS NOT NULL
        """)

        rows = cursor.fetchall()

        imported = 0
        skipped = 0

        for row in rows:
            name = row[0]
            unit = row[1] if row[1] else ""

            # 이미 존재하는지 확인 (name + unit 조합)
            cursor.execute(
                "SELECT id FROM ai_spec_v2.measurement_params WHERE name = %s AND unit = %s",
                (name, unit)
            )

            if cursor.fetchone():
                skipped += 1
                continue

            # 신규 등록
            cursor.execute("""
                INSERT INTO ai_spec_v2.measurement_params (name, unit, created_by)
                VALUES (%s, %s, %s)
            """, (name, unit, createdBy))

            imported += 1

        conn.commit()

        return {
            "success": True,
            "message": f"{imported}개 등록, {skipped}개 스킵 (이미 존재)",
            "imported": imported,
            "skipped": skipped
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"일괄 등록 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.put("/{param_id}", response_model=MeasurementParameterResponse)
async def update_measurement_parameter(param_id: str, data: MeasurementParameterUpdate):
    """
    Measurement Parameter 수정
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 존재 여부 확인
        cursor.execute(
            "SELECT id FROM ai_spec_v2.measurement_params WHERE id = %s",
            (param_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Measurement Parameter를 찾을 수 없습니다.")

        # 중복 체크 (name + unit 조합, 다른 레코드에 동일 조합이 있는지)
        if data.name is not None or data.unit is not None:
            # 현재 값 조회
            cursor.execute(
                "SELECT name, unit FROM ai_spec_v2.measurement_params WHERE id = %s",
                (param_id,)
            )
            current = cursor.fetchone()
            new_name = data.name if data.name is not None else current[0]
            new_unit = data.unit if data.unit is not None else current[1]

            cursor.execute(
                "SELECT id FROM ai_spec_v2.measurement_params WHERE name = %s AND unit = %s AND id != %s",
                (new_name, new_unit, param_id)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"이미 존재하는 Parameter입니다: {new_name} ({new_unit})")

        # 업데이트할 필드 동적 생성
        update_fields = []
        params = []

        if data.name is not None:
            update_fields.append("name = %s")
            params.append(data.name)

        if data.unit is not None:
            update_fields.append("unit = %s")
            params.append(data.unit)

        if data.description is not None:
            update_fields.append("description = %s")
            params.append(data.description)

        if data.isActive is not None:
            update_fields.append("is_active = %s")
            params.append(data.isActive)

        if data.updatedBy is not None:
            update_fields.append("updated_by = %s")
            params.append(data.updatedBy)

        update_fields.append("updated_at = CURRENT_TIMESTAMP")

        if not update_fields:
            raise HTTPException(status_code=400, detail="수정할 항목이 없습니다.")

        params.append(param_id)

        query = f"""
            UPDATE ai_spec_v2.measurement_params
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, name, unit, description, is_active,
                      created_by, created_at, updated_by, updated_at
        """

        cursor.execute(query, params)
        row = cursor.fetchone()
        conn.commit()

        return MeasurementParameterResponse(
            id=row[0],
            name=row[1],
            unit=row[2],
            description=row[3],
            isActive=row[4],
            createdBy=row[5],
            createdAt=row[6],
            updatedBy=row[7],
            updatedAt=row[8]
        )

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"수정 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.delete("/{param_id}")
async def delete_measurement_parameter(param_id: str):
    """
    Measurement Parameter 삭제 (비활성화)
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id FROM ai_spec_v2.measurement_params WHERE id = %s",
            (param_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Measurement Parameter를 찾을 수 없습니다.")

        # Soft delete (is_active = false)
        cursor.execute(
            "UPDATE ai_spec_v2.measurement_params SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (param_id,)
        )
        conn.commit()

        return {"success": True, "message": "삭제 완료 (비활성화)"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.delete("/{param_id}/permanent")
async def permanently_delete_measurement_parameter(param_id: str):
    """
    Measurement Parameter 영구 삭제
    """
    ensure_table_exists()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id FROM ai_spec_v2.measurement_params WHERE id = %s",
            (param_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Measurement Parameter를 찾을 수 없습니다.")

        cursor.execute(
            "DELETE FROM ai_spec_v2.measurement_params WHERE id = %s",
            (param_id,)
        )
        conn.commit()

        return {"success": True, "message": "영구 삭제 완료"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()
