"""
AI Judgment Criteria Management API Routes
AI 판정 기준 관리 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database.connection import get_db
from app.database.schema import (
    CustomerSpec, DefectType, DefectCondition,
    MeasurementCondition, Specification, Expression
)

router = APIRouter(prefix="/api/ai-judgment", tags=["AI Judgment Criteria"])


# ========================================
# Pydantic Models
# ========================================

class CustomerSpecListItem(BaseModel):
    id: int
    customer: str
    category3: str
    customized: str
    rms_rev: int
    threshold: Optional[int] = None
    rms_rev_datetime: str

    class Config:
        from_attributes = True


class DefectTypeListItem(BaseModel):
    id: int
    spec_id: int
    ai_code: str
    side: Optional[str] = None
    unit_dummy: Optional[str] = None
    area: Optional[str] = None
    defect_name: str
    multiple: Optional[int] = None  # Changed from str to int to match DB schema
    threshold_ok: Optional[float] = None
    threshold_ng: Optional[float] = None

    class Config:
        from_attributes = True


class ExpressionData(BaseModel):
    id: int
    value: float  # Changed from str to float to match DB schema
    inequality_sign: str

    class Config:
        from_attributes = True


class SpecificationData(BaseModel):
    id: int
    measurement_name: str
    unit: Optional[str] = None
    sub_logical_operator: Optional[str] = None
    parent_spec_id: Optional[int] = None
    expressions: List[ExpressionData] = []
    child_specifications: List['SpecificationData'] = []

    class Config:
        from_attributes = True


class MeasurementConditionData(BaseModel):
    id: int
    idx: int
    measurement_name: Optional[str] = None
    default_result_value: Optional[str] = None
    root_logical_operator: Optional[str] = None
    measurement_condition_value: Optional[float] = None  # Changed from str to float to match DB schema
    measurement_condition_unit: Optional[str] = None
    measurement_condition_inequality_sign: Optional[str] = None
    specifications: List[SpecificationData] = []

    class Config:
        from_attributes = True


class DefectConditionData(BaseModel):
    id: int
    idx: int
    machine_type: Optional[str] = None
    metal_value_percent: Optional[float] = None  # Changed from int to float to match DB schema
    no_measurement_default_result: Optional[str] = None
    measurement_conditions: List[MeasurementConditionData] = []

    class Config:
        from_attributes = True


# ========================================
# API Endpoints
# ========================================

@router.get("/customer-specs")
async def get_customer_specs(
    db: Session = Depends(get_db)
):
    """
    Get all customer specs for the left panel
    왼쪽 패널용 고객사 Spec 목록 조회
    """
    specs = db.query(CustomerSpec).order_by(
        CustomerSpec.customer,
        CustomerSpec.category3,
        CustomerSpec.rms_rev.desc()
    ).all()

    return {
        "status": "success",
        "count": len(specs),
        "data": [CustomerSpecListItem.model_validate(spec) for spec in specs]
    }


@router.get("/defect-types/{spec_id}")
async def get_defect_types_by_spec(
    spec_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all defect types for a specific customer spec
    특정 고객사 Spec의 불량 유형 목록 조회 (중앙 패널)
    """
    # Verify spec exists
    spec = db.query(CustomerSpec).filter(CustomerSpec.id == spec_id).first()
    if not spec:
        raise HTTPException(status_code=404, detail=f"Spec with id {spec_id} not found")

    defect_types = db.query(DefectType).filter(
        DefectType.spec_id == spec_id
    ).order_by(DefectType.ai_code).all()

    return {
        "status": "success",
        "spec_id": spec_id,
        "count": len(defect_types),
        "data": [DefectTypeListItem.model_validate(dt) for dt in defect_types]
    }


@router.get("/specifications/{defect_type_id}")
async def get_specifications_by_defect_type(
    defect_type_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all specifications hierarchy for a specific defect type
    특정 불량 유형의 판정 기준 계층 구조 조회 (오른쪽 패널)

    Returns:
        defect_conditions -> measurement_conditions -> specifications -> expressions
    """
    try:
        # Verify defect type exists
        defect_type = db.query(DefectType).filter(DefectType.id == defect_type_id).first()
        if not defect_type:
            raise HTTPException(status_code=404, detail=f"DefectType with id {defect_type_id} not found")

        # Get all defect conditions
        defect_conditions = db.query(DefectCondition).filter(
            DefectCondition.defect_type_id == defect_type_id
        ).order_by(DefectCondition.idx).all()
    except Exception as e:
        print(f"[ERROR] Database query error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    result = []

    try:
        for dc in defect_conditions:
            # Get measurement conditions
            measurement_conditions = db.query(MeasurementCondition).filter(
                MeasurementCondition.defect_condition_id == dc.id
            ).order_by(MeasurementCondition.idx).all()

            mc_list = []
            for mc in measurement_conditions:
                # Get specifications (only parent specifications, not children)
                specifications = db.query(Specification).filter(
                    Specification.measurement_condition_id == mc.id,
                    Specification.parent_spec_id == None
                ).all()

                spec_list = []
                for spec in specifications:
                    # Get expressions
                    expressions = db.query(Expression).filter(
                        Expression.specification_id == spec.id
                    ).all()

                    # Get child specifications recursively
                    child_specs = get_child_specifications(spec.id, db)

                    spec_list.append(SpecificationData(
                        id=spec.id,
                        measurement_name=spec.measurement_name,
                        unit=spec.unit,
                        sub_logical_operator=spec.sub_logical_operator,
                        parent_spec_id=spec.parent_spec_id,
                        expressions=[ExpressionData.model_validate(e) for e in expressions],
                        child_specifications=child_specs
                    ))

                mc_list.append(MeasurementConditionData(
                    id=mc.id,
                    idx=mc.idx,
                    measurement_name=mc.measurement_name,
                    default_result_value=mc.default_result_value,
                    root_logical_operator=mc.root_logical_operator,
                    measurement_condition_value=mc.measurement_condition_value,
                    measurement_condition_unit=mc.measurement_condition_unit,
                    measurement_condition_inequality_sign=mc.measurement_condition_inequality_sign,
                    specifications=spec_list
                ))

            result.append(DefectConditionData(
                id=dc.id,
                idx=dc.idx,
                machine_type=dc.machine_type,
                metal_value_percent=dc.metal_value_percent,
                no_measurement_default_result=dc.no_measurement_default_result,
                measurement_conditions=mc_list
            ))
    except Exception as e:
        print(f"[ERROR] Pydantic model validation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Model validation error: {str(e)}")

    return {
        "status": "success",
        "defect_type_id": defect_type_id,
        "defect_conditions": result
    }


def get_child_specifications(parent_id: int, db: Session) -> List[SpecificationData]:
    """
    Recursively get child specifications
    재귀적으로 하위 Specification 조회
    """
    children = db.query(Specification).filter(
        Specification.parent_spec_id == parent_id
    ).all()

    result = []
    for child in children:
        expressions = db.query(Expression).filter(
            Expression.specification_id == child.id
        ).all()

        grandchildren = get_child_specifications(child.id, db)

        result.append(SpecificationData(
            id=child.id,
            measurement_name=child.measurement_name,
            unit=child.unit,
            sub_logical_operator=child.sub_logical_operator,
            parent_spec_id=child.parent_spec_id,
            expressions=[ExpressionData.model_validate(e) for e in expressions],
            child_specifications=grandchildren
        ))

    return result


@router.get("/stats")
async def get_statistics(db: Session = Depends(get_db)):
    """
    Get statistics for the dashboard
    대시보드용 통계 조회
    """
    total_specs = db.query(func.count(CustomerSpec.id)).scalar()
    total_defect_types = db.query(func.count(DefectType.id)).scalar()
    total_customers = db.query(func.count(func.distinct(CustomerSpec.customer))).scalar()
    total_categories = db.query(func.count(func.distinct(CustomerSpec.category3))).scalar()

    return {
        "status": "success",
        "statistics": {
            "total_specs": total_specs,
            "total_defect_types": total_defect_types,
            "total_customers": total_customers,
            "total_categories": total_categories
        }
    }


# Allow recursive model
SpecificationData.model_rebuild()
