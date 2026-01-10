"""
Customer Spec Management CRUD API Routes
고객 Spec 생성, 수정, 삭제, 복사 기능
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import json

from app.database.connection import get_db
from app.database.schema import (
    CustomerSpec, DefectType, DefectCondition,
    MeasurementCondition, Specification, Expression
)

router = APIRouter()


# ============================================================
# Pydantic Models for Request/Response
# ============================================================

class ExpressionCreate(BaseModel):
    """표현식 생성 모델"""
    value: float
    inequality_sign: str  # gte, lte, gt, lt, eq


class SpecificationCreate(BaseModel):
    """사양 생성 모델"""
    measurement_name: str
    unit: str
    sub_logical_operator: Optional[str] = "None"
    expressions: List[ExpressionCreate] = []
    sub_specifications: Optional[List['SpecificationCreate']] = None


class MeasurementConditionCreate(BaseModel):
    """측정 조건 생성 모델"""
    idx: int
    measurement_name: str
    default_result_value: str
    root_logical_operator: str
    measurement_condition_value: Optional[float] = None
    measurement_condition_unit: Optional[str] = None
    measurement_condition_inequality_sign: Optional[str] = None
    specifications: List[SpecificationCreate] = []


class DefectConditionCreate(BaseModel):
    """불량 조건 생성 모델"""
    idx: int
    machine_type: str
    metal_value_percent: Optional[float] = None
    no_measurement_default_result: str
    measurement_conditions: List[MeasurementConditionCreate] = []


class DefectTypeCreate(BaseModel):
    """불량 유형 생성 모델"""
    ai_code: str
    side: Optional[str] = None
    unit_dummy: Optional[str] = None
    area: Optional[str] = None
    defect_name: str
    multiple: Optional[int] = None
    threshold_ok: Optional[float] = None
    threshold_ng: Optional[float] = None
    remark: Optional[str] = None
    defect_conditions: List[DefectConditionCreate] = []


class CustomerSpecCreate(BaseModel):
    """고객 Spec 생성 모델"""
    customer: str
    category3: str
    customized: str = "None"
    rms_rev: int
    threshold: int = 1
    rms_rev_datetime: str
    is_changed: bool = False
    max_rev: Optional[int] = None
    original_filename: Optional[str] = None
    defect_types: List[DefectTypeCreate] = []


class CustomerSpecUpdate(BaseModel):
    """고객 Spec 수정 모델 (부분 업데이트)"""
    customer: Optional[str] = None
    category3: Optional[str] = None
    customized: Optional[str] = None
    rms_rev: Optional[int] = None
    threshold: Optional[int] = None
    rms_rev_datetime: Optional[str] = None
    is_changed: Optional[bool] = None
    max_rev: Optional[int] = None


# ============================================================
# CREATE: 새로운 Spec 생성
# ============================================================

@router.post("/spec")
async def create_spec(
    spec_data: CustomerSpecCreate,
    db: Session = Depends(get_db)
):
    """
    새로운 고객 Spec 생성

    전체 계층 구조를 포함한 Spec을 생성합니다:
    - CustomerSpec
      - DefectTypes
        - DefectConditions
          - MeasurementConditions
            - Specifications
              - Expressions
    """
    try:
        # CustomerSpec 생성
        new_spec = CustomerSpec(
            customer=spec_data.customer,
            category3=spec_data.category3,
            customized=spec_data.customized,
            rms_rev=spec_data.rms_rev,
            threshold=spec_data.threshold,
            rms_rev_datetime=spec_data.rms_rev_datetime,
            is_changed=spec_data.is_changed,
            max_rev=spec_data.max_rev,
            original_filename=spec_data.original_filename
        )
        db.add(new_spec)
        db.flush()  # ID 생성

        # DefectTypes 생성
        for dt_data in spec_data.defect_types:
            defect_type = DefectType(
                spec_id=new_spec.id,
                ai_code=dt_data.ai_code,
                side=dt_data.side,
                unit_dummy=dt_data.unit_dummy,
                area=dt_data.area,
                defect_name=dt_data.defect_name,
                multiple=dt_data.multiple,
                threshold_ok=dt_data.threshold_ok,
                threshold_ng=dt_data.threshold_ng,
                remark=dt_data.remark
            )
            db.add(defect_type)
            db.flush()

            # DefectConditions 생성
            for dc_data in dt_data.defect_conditions:
                defect_condition = DefectCondition(
                    defect_type_id=defect_type.id,
                    idx=dc_data.idx,
                    machine_type=dc_data.machine_type,
                    metal_value_percent=dc_data.metal_value_percent,
                    no_measurement_default_result=dc_data.no_measurement_default_result
                )
                db.add(defect_condition)
                db.flush()

                # MeasurementConditions 생성
                for mc_data in dc_data.measurement_conditions:
                    measurement_condition = MeasurementCondition(
                        defect_condition_id=defect_condition.id,
                        idx=mc_data.idx,
                        measurement_name=mc_data.measurement_name,
                        default_result_value=mc_data.default_result_value,
                        root_logical_operator=mc_data.root_logical_operator,
                        measurement_condition_value=mc_data.measurement_condition_value,
                        measurement_condition_unit=mc_data.measurement_condition_unit,
                        measurement_condition_inequality_sign=mc_data.measurement_condition_inequality_sign
                    )
                    db.add(measurement_condition)
                    db.flush()

                    # Specifications 생성 (재귀적으로)
                    for spec_create in mc_data.specifications:
                        create_specification_tree(
                            db,
                            measurement_condition.id,
                            None,
                            spec_create
                        )

        db.commit()
        db.refresh(new_spec)

        return {
            "status": "success",
            "message": "Spec created successfully",
            "spec_id": new_spec.id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create spec: {str(e)}")


def create_specification_tree(
    db: Session,
    measurement_condition_id: int,
    parent_spec_id: Optional[int],
    spec_data: SpecificationCreate
):
    """재귀적으로 Specification 트리 생성"""
    # Specification 생성
    specification = Specification(
        measurement_condition_id=measurement_condition_id,
        parent_spec_id=parent_spec_id,
        measurement_name=spec_data.measurement_name,
        unit=spec_data.unit,
        sub_logical_operator=spec_data.sub_logical_operator
    )
    db.add(specification)
    db.flush()

    # Expressions 생성
    for expr_data in spec_data.expressions:
        expression = Expression(
            specification_id=specification.id,
            value=expr_data.value,
            inequality_sign=expr_data.inequality_sign
        )
        db.add(expression)

    # SubSpecifications 재귀 생성
    if spec_data.sub_specifications:
        for sub_spec_data in spec_data.sub_specifications:
            create_specification_tree(
                db,
                measurement_condition_id,
                specification.id,  # 부모 ID 전달
                sub_spec_data
            )


# ============================================================
# UPDATE: Spec 수정
# ============================================================

@router.patch("/spec/{spec_id}")
async def update_spec(
    spec_id: int,
    spec_update: CustomerSpecUpdate,
    db: Session = Depends(get_db)
):
    """
    고객 Spec 메타데이터 수정

    주의: 이 엔드포인트는 Spec의 기본 정보만 수정합니다.
    DefectType 등 하위 구조를 수정하려면 별도 엔드포인트를 사용하세요.
    """
    spec = db.query(CustomerSpec).filter(CustomerSpec.id == spec_id).first()

    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    # 업데이트할 필드만 수정
    update_data = spec_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(spec, field, value)

    spec.updated_at = datetime.now()

    try:
        db.commit()
        db.refresh(spec)

        return {
            "status": "success",
            "message": "Spec updated successfully",
            "spec_id": spec.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update spec: {str(e)}")


# ============================================================
# DELETE: Spec 삭제
# ============================================================

@router.delete("/spec/{spec_id}")
async def delete_spec(
    spec_id: int,
    db: Session = Depends(get_db)
):
    """
    고객 Spec 삭제

    CASCADE 설정으로 인해 관련된 모든 하위 데이터가 자동으로 삭제됩니다:
    - DefectTypes
    - DefectConditions
    - MeasurementConditions
    - Specifications
    - Expressions
    """
    spec = db.query(CustomerSpec).filter(CustomerSpec.id == spec_id).first()

    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    try:
        db.delete(spec)
        db.commit()

        return {
            "status": "success",
            "message": f"Spec {spec_id} and all related data deleted successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete spec: {str(e)}")


# ============================================================
# COPY: Spec 복사 (새 버전 생성)
# ============================================================

@router.post("/spec/{spec_id}/copy")
async def copy_spec(
    spec_id: int,
    new_rev: Optional[int] = None,
    new_customized: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    기존 Spec을 복사하여 새 버전 생성

    Parameters:
        spec_id: 복사할 원본 Spec ID
        new_rev: 새 Rev 번호 (지정하지 않으면 자동으로 +1)
        new_customized: 새 Customized 값 (지정하지 않으면 원본 유지)

    전체 계층 구조가 복사됩니다.
    """
    # 원본 Spec 조회 (모든 관계 포함)
    original_spec = db.query(CustomerSpec).options(
        joinedload(CustomerSpec.defect_types)
    ).filter(CustomerSpec.id == spec_id).first()

    if not original_spec:
        raise HTTPException(status_code=404, detail="Original spec not found")

    try:
        # 새 Rev 계산
        if new_rev is None:
            # 같은 customer/category에서 최대 Rev 찾기
            max_rev = db.query(func.max(CustomerSpec.rms_rev)).filter(
                CustomerSpec.customer == original_spec.customer,
                CustomerSpec.category3 == original_spec.category3,
                CustomerSpec.customized == (new_customized or original_spec.customized)
            ).scalar() or 0
            new_rev = max_rev + 1

        # 새 Spec 생성
        new_spec = CustomerSpec(
            customer=original_spec.customer,
            category3=original_spec.category3,
            customized=new_customized or original_spec.customized,
            rms_rev=new_rev,
            threshold=original_spec.threshold,
            rms_rev_datetime=datetime.now().strftime("%Y%m%d%H%M%S"),
            is_changed=False,
            max_rev=new_rev,
            original_filename=f"COPIED_FROM_{original_spec.id}_{original_spec.original_filename or 'unknown'}"
        )
        db.add(new_spec)
        db.flush()

        # DefectTypes 복사
        for original_dt in original_spec.defect_types:
            copy_defect_type(db, new_spec.id, original_dt)

        db.commit()
        db.refresh(new_spec)

        return {
            "status": "success",
            "message": f"Spec copied successfully from ID {spec_id}",
            "original_spec_id": spec_id,
            "new_spec_id": new_spec.id,
            "new_rev": new_rev
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to copy spec: {str(e)}")


def copy_defect_type(db: Session, new_spec_id: int, original_dt: DefectType):
    """DefectType과 하위 구조 전체 복사"""
    # DefectType 복사
    new_dt = DefectType(
        spec_id=new_spec_id,
        ai_code=original_dt.ai_code,
        side=original_dt.side,
        unit_dummy=original_dt.unit_dummy,
        area=original_dt.area,
        defect_name=original_dt.defect_name,
        multiple=original_dt.multiple,
        threshold_ok=original_dt.threshold_ok,
        threshold_ng=original_dt.threshold_ng,
        remark=original_dt.remark
    )
    db.add(new_dt)
    db.flush()

    # DefectConditions 복사
    for original_dc in original_dt.defect_conditions:
        copy_defect_condition(db, new_dt.id, original_dc)


def copy_defect_condition(db: Session, new_dt_id: int, original_dc: DefectCondition):
    """DefectCondition과 하위 구조 전체 복사"""
    new_dc = DefectCondition(
        defect_type_id=new_dt_id,
        idx=original_dc.idx,
        machine_type=original_dc.machine_type,
        metal_value_percent=original_dc.metal_value_percent,
        no_measurement_default_result=original_dc.no_measurement_default_result
    )
    db.add(new_dc)
    db.flush()

    # MeasurementConditions 복사
    for original_mc in original_dc.measurement_conditions:
        copy_measurement_condition(db, new_dc.id, original_mc)


def copy_measurement_condition(db: Session, new_dc_id: int, original_mc: MeasurementCondition):
    """MeasurementCondition과 하위 구조 전체 복사"""
    new_mc = MeasurementCondition(
        defect_condition_id=new_dc_id,
        idx=original_mc.idx,
        measurement_name=original_mc.measurement_name,
        default_result_value=original_mc.default_result_value,
        root_logical_operator=original_mc.root_logical_operator,
        measurement_condition_value=original_mc.measurement_condition_value,
        measurement_condition_unit=original_mc.measurement_condition_unit,
        measurement_condition_inequality_sign=original_mc.measurement_condition_inequality_sign
    )
    db.add(new_mc)
    db.flush()

    # Specifications 복사 (루트만)
    for original_spec in original_mc.specifications:
        if original_spec.parent_spec_id is None:  # 루트만
            copy_specification_tree(db, new_mc.id, None, original_spec)


def copy_specification_tree(
    db: Session,
    new_mc_id: int,
    new_parent_id: Optional[int],
    original_spec: Specification
):
    """Specification 트리 재귀적 복사"""
    new_spec = Specification(
        measurement_condition_id=new_mc_id,
        parent_spec_id=new_parent_id,
        measurement_name=original_spec.measurement_name,
        unit=original_spec.unit,
        sub_logical_operator=original_spec.sub_logical_operator
    )
    db.add(new_spec)
    db.flush()

    # Expressions 복사
    for original_expr in original_spec.expressions:
        new_expr = Expression(
            specification_id=new_spec.id,
            value=original_expr.value,
            inequality_sign=original_expr.inequality_sign
        )
        db.add(new_expr)

    # SubSpecifications 재귀 복사
    for original_sub in original_spec.sub_specifications:
        copy_specification_tree(db, new_mc_id, new_spec.id, original_sub)
