"""
Customer Spec Management API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.database.schema import CustomerSpec, DefectType, DefectCondition

router = APIRouter()


# Pydantic models for API responses
class CustomerSpecSummary(BaseModel):
    id: int
    customer: str
    category3: str
    customized: str
    rms_rev: int
    rms_rev_datetime: str
    defect_type_count: int
    original_filename: Optional[str]

    class Config:
        from_attributes = True


class DefectTypeSummary(BaseModel):
    id: int
    ai_code: str
    defect_name: str
    area: Optional[str]
    side: Optional[str]
    threshold_ok: Optional[float]
    threshold_ng: Optional[float]
    remark: Optional[str]

    class Config:
        from_attributes = True


@router.get("/search-specs")
async def search_specs(
    customer: Optional[str] = Query(None),
    category3: Optional[str] = Query(None),
    customized: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Search customer specs with filters

    Query Parameters:
        customer: Customer name (e.g., SAMSUNG)
        category3: Category (e.g., BOC, MCP)
        customized: Customized type (e.g., None, Waiver)
    """
    query = db.query(CustomerSpec)

    if customer:
        query = query.filter(CustomerSpec.customer.like(f"%{customer}%"))
    if category3:
        query = query.filter(CustomerSpec.category3.like(f"%{category3}%"))
    if customized:
        query = query.filter(CustomerSpec.customized.like(f"%{customized}%"))

    specs = query.order_by(
        CustomerSpec.customer,
        CustomerSpec.category3,
        CustomerSpec.rms_rev.desc()
    ).all()

    # Count defect types for each spec
    results = []
    for spec in specs:
        defect_type_count = db.query(DefectType).filter(
            DefectType.spec_id == spec.id
        ).count()

        results.append(CustomerSpecSummary(
            id=spec.id,
            customer=spec.customer,
            category3=spec.category3,
            customized=spec.customized,
            rms_rev=spec.rms_rev,
            rms_rev_datetime=spec.rms_rev_datetime,
            defect_type_count=defect_type_count,
            original_filename=spec.original_filename
        ))

    return {
        "status": "success",
        "count": len(results),
        "specs": results
    }


@router.get("/spec/{spec_id}")
async def get_spec_detail(
    spec_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific customer spec"""
    spec = db.query(CustomerSpec).options(
        joinedload(CustomerSpec.defect_types)
    ).filter(CustomerSpec.id == spec_id).first()

    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    return {
        "status": "success",
        "spec": {
            "id": spec.id,
            "customer": spec.customer,
            "category3": spec.category3,
            "customized": spec.customized,
            "rms_rev": spec.rms_rev,
            "threshold": spec.threshold,
            "rms_rev_datetime": spec.rms_rev_datetime,
            "is_changed": spec.is_changed,
            "max_rev": spec.max_rev,
            "original_filename": spec.original_filename,
            "created_at": spec.created_at.isoformat() if spec.created_at else None,
            "defect_types": [
                DefectTypeSummary(
                    id=dt.id,
                    ai_code=dt.ai_code,
                    defect_name=dt.defect_name,
                    area=dt.area,
                    side=dt.side,
                    threshold_ok=dt.threshold_ok,
                    threshold_ng=dt.threshold_ng,
                    remark=dt.remark
                )
                for dt in spec.defect_types
            ]
        }
    }


@router.get("/defect-type/{defect_type_id}")
async def get_defect_type_detail(
    defect_type_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific defect type including all conditions"""
    defect_type = db.query(DefectType).options(
        joinedload(DefectType.defect_conditions)
    ).filter(DefectType.id == defect_type_id).first()

    if not defect_type:
        raise HTTPException(status_code=404, detail="Defect type not found")

    # Build full nested structure
    defect_conditions_data = []
    for dc in defect_type.defect_conditions:
        measurement_conditions_data = []
        for mc in dc.measurement_conditions:
            specifications_data = []
            for spec in mc.specifications:
                if spec.parent_spec_id is None:  # Only root specifications
                    specifications_data.append(build_specification_tree(spec))

            measurement_conditions_data.append({
                "id": mc.id,
                "idx": mc.idx,
                "measurement_name": mc.measurement_name,
                "default_result_value": mc.default_result_value,
                "root_logical_operator": mc.root_logical_operator,
                "measurement_condition_value": mc.measurement_condition_value,
                "measurement_condition_unit": mc.measurement_condition_unit,
                "measurement_condition_inequality_sign": mc.measurement_condition_inequality_sign,
                "specifications": specifications_data
            })

        defect_conditions_data.append({
            "id": dc.id,
            "idx": dc.idx,
            "machine_type": dc.machine_type,
            "metal_value_percent": dc.metal_value_percent,
            "no_measurement_default_result": dc.no_measurement_default_result,
            "measurement_conditions": measurement_conditions_data
        })

    return {
        "status": "success",
        "defect_type": {
            "id": defect_type.id,
            "ai_code": defect_type.ai_code,
            "side": defect_type.side,
            "unit_dummy": defect_type.unit_dummy,
            "area": defect_type.area,
            "defect_name": defect_type.defect_name,
            "multiple": defect_type.multiple,
            "threshold_ok": defect_type.threshold_ok,
            "threshold_ng": defect_type.threshold_ng,
            "remark": defect_type.remark,
            "defect_conditions": defect_conditions_data
        }
    }


def build_specification_tree(spec):
    """Recursively build specification tree including sub-specifications"""
    expressions_data = [
        {
            "value": expr.value,
            "inequality_sign": expr.inequality_sign
        }
        for expr in spec.expressions
    ]

    sub_specifications_data = [
        build_specification_tree(sub_spec)
        for sub_spec in spec.sub_specifications
    ]

    return {
        "id": spec.id,
        "measurement_name": spec.measurement_name,
        "unit": spec.unit,
        "sub_logical_operator": spec.sub_logical_operator,
        "expressions": expressions_data,
        "sub_specifications": sub_specifications_data if sub_specifications_data else None
    }


@router.get("/customers")
async def get_customers(db: Session = Depends(get_db)):
    """Get list of unique customers"""
    customers = db.query(CustomerSpec.customer).distinct().order_by(CustomerSpec.customer).all()
    return {
        "status": "success",
        "customers": [c[0] for c in customers]
    }


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get list of unique categories"""
    categories = db.query(CustomerSpec.category3).distinct().order_by(CustomerSpec.category3).all()
    return {
        "status": "success",
        "categories": [c[0] for c in categories]
    }


@router.get("/defect-codes")
async def get_defect_codes(
    customer: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of AI defect codes with filters"""
    query = db.query(DefectType.ai_code, DefectType.defect_name).distinct()

    if customer or category:
        query = query.join(CustomerSpec)
        if customer:
            query = query.filter(CustomerSpec.customer == customer)
        if category:
            query = query.filter(CustomerSpec.category3 == category)

    codes = query.order_by(DefectType.ai_code).all()

    return {
        "status": "success",
        "codes": [{"ai_code": c[0], "defect_name": c[1]} for c in codes]
    }


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get database statistics"""
    spec_count = db.query(CustomerSpec).count()
    defect_type_count = db.query(DefectType).count()
    defect_condition_count = db.query(DefectCondition).count()

    customer_counts = db.query(
        CustomerSpec.customer,
        db.func.count(CustomerSpec.id)
    ).group_by(CustomerSpec.customer).order_by(CustomerSpec.customer).all()

    category_counts = db.query(
        CustomerSpec.category3,
        db.func.count(CustomerSpec.id)
    ).group_by(CustomerSpec.category3).order_by(CustomerSpec.category3).all()

    return {
        "status": "success",
        "stats": {
            "total_specs": spec_count,
            "total_defect_types": defect_type_count,
            "total_defect_conditions": defect_condition_count,
            "by_customer": [{"customer": c[0], "count": c[1]} for c in customer_counts],
            "by_category": [{"category": c[0], "count": c[1]} for c in category_counts]
        }
    }
