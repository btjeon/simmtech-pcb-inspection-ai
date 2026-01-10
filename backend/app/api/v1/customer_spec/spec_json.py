"""
Customer Spec JSON Import/Export API Routes
JSON 파일 업로드 및 다운로드 기능
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, Optional, List
import json
import tempfile
import os
from datetime import datetime

from app.database.connection import get_db
from app.database.schema import (
    CustomerSpec, DefectType, DefectCondition,
    MeasurementCondition, Specification, Expression
)

router = APIRouter()


# ============================================================
# JSON 업로드 (Import)
# ============================================================

@router.post("/upload-json")
async def upload_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    JSON 파일을 업로드하여 데이터베이스에 저장

    JSON 구조:
    {
        "customer": "SAMSUNG",
        "category3": "BOC",
        "customized": "None",
        "rms_rev": 42,
        "threshold": 1,
        "rms_rev_datetime": "20251015114000",
        "DefectTypes": [...]
    }
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are allowed")

    try:
        # JSON 파일 읽기
        content = await file.read()
        json_data = json.loads(content.decode('utf-8-sig'))

        # 필수 필드 확인
        required_fields = ['customer', 'category3', 'DefectTypes']
        for field in required_fields:
            if field not in json_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )

        # CustomerSpec 생성
        new_spec = CustomerSpec(
            customer=json_data.get('customer'),
            category3=json_data.get('category3'),
            customized=json_data.get('customized', 'None'),
            rms_rev=json_data.get('rms_rev', 1),
            threshold=json_data.get('threshold', 1),
            rms_rev_datetime=json_data.get('rms_rev_datetime', datetime.now().strftime("%Y%m%d%H%M%S")),
            is_changed=json_data.get('is_changed', False),
            max_rev=json_data.get('max_rev'),
            original_filename=file.filename
        )
        db.add(new_spec)
        db.flush()

        # DefectTypes 생성
        defect_count = 0
        for dt_data in json_data.get('DefectTypes', []):
            import_defect_type(db, new_spec.id, dt_data)
            defect_count += 1

        db.commit()
        db.refresh(new_spec)

        return {
            "status": "success",
            "message": "JSON file imported successfully",
            "spec_id": new_spec.id,
            "customer": new_spec.customer,
            "category": new_spec.category3,
            "rev": new_spec.rms_rev,
            "defect_types_count": defect_count,
            "filename": file.filename
        }

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to import JSON: {str(e)}")


def import_defect_type(db: Session, spec_id: int, dt_data: Dict[str, Any]):
    """JSON에서 DefectType 및 하위 구조 import"""
    defect_type = DefectType(
        spec_id=spec_id,
        ai_code=dt_data.get('ai_code'),
        side=dt_data.get('side'),
        unit_dummy=dt_data.get('unit_dummy'),
        area=dt_data.get('area'),
        defect_name=dt_data.get('defect_name'),
        multiple=dt_data.get('multiple'),
        threshold_ok=dt_data.get('threshold_ok'),
        threshold_ng=dt_data.get('threshold_ng'),
        remark=dt_data.get('remark')
    )
    db.add(defect_type)
    db.flush()

    # DefectConditions
    for dc_data in dt_data.get('DefectConditions', []):
        import_defect_condition(db, defect_type.id, dc_data)


def import_defect_condition(db: Session, defect_type_id: int, dc_data: Dict[str, Any]):
    """JSON에서 DefectCondition 및 하위 구조 import"""
    defect_condition = DefectCondition(
        defect_type_id=defect_type_id,
        idx=dc_data.get('idx'),
        machine_type=dc_data.get('machine_type'),
        metal_value_percent=dc_data.get('metal_value_percent'),
        no_measurement_default_result=dc_data.get('no_measurement_default_result')
    )
    db.add(defect_condition)
    db.flush()

    # MeasurementConditions
    for mc_data in dc_data.get('MeasurementConditions', []):
        import_measurement_condition(db, defect_condition.id, mc_data)


def import_measurement_condition(db: Session, defect_condition_id: int, mc_data: Dict[str, Any]):
    """JSON에서 MeasurementCondition 및 하위 구조 import"""
    measurement_condition = MeasurementCondition(
        defect_condition_id=defect_condition_id,
        idx=mc_data.get('idx'),
        measurement_name=mc_data.get('measurement_name'),
        default_result_value=mc_data.get('default_result_value'),
        root_logical_operator=mc_data.get('root_logical_operator'),
        measurement_condition_value=mc_data.get('measurement_condition_value'),
        measurement_condition_unit=mc_data.get('measurement_condition_unit'),
        measurement_condition_inequality_sign=mc_data.get('measurement_condition_inequality_sign')
    )
    db.add(measurement_condition)
    db.flush()

    # Specifications
    for spec_data in mc_data.get('Specifications', []):
        import_specification_tree(db, measurement_condition.id, None, spec_data)


def import_specification_tree(
    db: Session,
    measurement_condition_id: int,
    parent_spec_id: Optional[int],
    spec_data: Dict[str, Any]
):
    """JSON에서 Specification 트리 재귀적 import"""
    specification = Specification(
        measurement_condition_id=measurement_condition_id,
        parent_spec_id=parent_spec_id,
        measurement_name=spec_data.get('measurement_name'),
        unit=spec_data.get('unit'),
        sub_logical_operator=spec_data.get('sub_logical_operator', 'None')
    )
    db.add(specification)
    db.flush()

    # Expressions
    for expr_data in spec_data.get('Expression', []):
        expression = Expression(
            specification_id=specification.id,
            value=expr_data.get('value'),
            inequality_sign=expr_data.get('inequality_sign')
        )
        db.add(expression)

    # SubSpecifications
    for sub_spec_data in spec_data.get('SubSpecifications', []):
        import_specification_tree(db, measurement_condition_id, specification.id, sub_spec_data)


# ============================================================
# JSON 다운로드 (Export)
# ============================================================

@router.get("/spec/{spec_id}/export-json")
async def export_json(
    spec_id: int,
    db: Session = Depends(get_db)
):
    """
    특정 Spec을 JSON 파일로 다운로드

    전체 계층 구조를 JSON 형식으로 export합니다.
    """
    # Spec 조회 (모든 관계 포함)
    spec = db.query(CustomerSpec).options(
        joinedload(CustomerSpec.defect_types)
    ).filter(CustomerSpec.id == spec_id).first()

    if not spec:
        raise HTTPException(status_code=404, detail="Spec not found")

    try:
        # JSON 구조 생성
        json_data = {
            "customer": spec.customer,
            "category3": spec.category3,
            "customized": spec.customized,
            "rms_rev": spec.rms_rev,
            "threshold": spec.threshold,
            "rms_rev_datetime": spec.rms_rev_datetime,
            "is_changed": spec.is_changed,
            "max_rev": spec.max_rev,
            "DefectTypes": []
        }

        # DefectTypes 추가
        for dt in spec.defect_types:
            json_data["DefectTypes"].append(export_defect_type(db, dt))

        # 파일명 생성
        filename = f"{spec.customer}_{spec.category3}_{spec.customized}_Rev_{spec.rms_rev}_{spec.rms_rev_datetime}.json"

        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json', encoding='utf-8') as tmp_file:
            json.dump(json_data, tmp_file, ensure_ascii=False, indent=2)
            tmp_path = tmp_file.name

        # 파일 응답
        return FileResponse(
            path=tmp_path,
            media_type='application/json',
            filename=filename,
            background=None  # 파일 전송 후 자동 삭제
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export JSON: {str(e)}")


def export_defect_type(db: Session, dt: DefectType) -> Dict[str, Any]:
    """DefectType을 JSON 구조로 변환"""
    return {
        "ai_code": dt.ai_code,
        "side": dt.side,
        "unit_dummy": dt.unit_dummy,
        "area": dt.area,
        "defect_name": dt.defect_name,
        "multiple": dt.multiple,
        "threshold_ok": dt.threshold_ok,
        "threshold_ng": dt.threshold_ng,
        "remark": dt.remark,
        "DefectConditions": [export_defect_condition(db, dc) for dc in dt.defect_conditions]
    }


def export_defect_condition(db: Session, dc: DefectCondition) -> Dict[str, Any]:
    """DefectCondition을 JSON 구조로 변환"""
    return {
        "idx": dc.idx,
        "machine_type": dc.machine_type,
        "metal_value_percent": dc.metal_value_percent,
        "no_measurement_default_result": dc.no_measurement_default_result,
        "MeasurementConditions": [export_measurement_condition(db, mc) for mc in dc.measurement_conditions]
    }


def export_measurement_condition(db: Session, mc: MeasurementCondition) -> Dict[str, Any]:
    """MeasurementCondition을 JSON 구조로 변환"""
    return {
        "idx": mc.idx,
        "measurement_name": mc.measurement_name,
        "default_result_value": mc.default_result_value,
        "root_logical_operator": mc.root_logical_operator,
        "measurement_condition_value": mc.measurement_condition_value,
        "measurement_condition_unit": mc.measurement_condition_unit,
        "measurement_condition_inequality_sign": mc.measurement_condition_inequality_sign,
        "Specifications": [
            export_specification_tree(spec)
            for spec in mc.specifications
            if spec.parent_spec_id is None  # 루트만
        ]
    }


def export_specification_tree(spec: Specification) -> Dict[str, Any]:
    """Specification 트리를 재귀적으로 JSON 구조로 변환"""
    return {
        "measurement_name": spec.measurement_name,
        "unit": spec.unit,
        "sub_logical_operator": spec.sub_logical_operator,
        "Expression": [
            {
                "value": expr.value,
                "inequality_sign": expr.inequality_sign
            }
            for expr in spec.expressions
        ],
        "SubSpecifications": [
            export_specification_tree(sub_spec)
            for sub_spec in spec.sub_specifications
        ] if spec.sub_specifications else []
    }


# ============================================================
# Bulk JSON 업로드 (여러 파일)
# ============================================================

@router.post("/upload-multiple-json")
async def upload_multiple_json(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    여러 JSON 파일을 한 번에 업로드

    Returns:
        - imported: 성공적으로 import된 파일 목록
        - failed: 실패한 파일 목록 및 에러 메시지
    """
    results = {
        "imported": [],
        "failed": [],
        "total": len(files)
    }

    for file in files:
        if not file.filename.endswith('.json'):
            results["failed"].append({
                "filename": file.filename,
                "error": "Not a JSON file"
            })
            continue

        try:
            # 각 파일 import 시도
            content = await file.read()
            json_data = json.loads(content.decode('utf-8-sig'))

            new_spec = CustomerSpec(
                customer=json_data.get('customer'),
                category3=json_data.get('category3'),
                customized=json_data.get('customized', 'None'),
                rms_rev=json_data.get('rms_rev', 1),
                threshold=json_data.get('threshold', 1),
                rms_rev_datetime=json_data.get('rms_rev_datetime', datetime.now().strftime("%Y%m%d%H%M%S")),
                is_changed=json_data.get('is_changed', False),
                max_rev=json_data.get('max_rev'),
                original_filename=file.filename
            )
            db.add(new_spec)
            db.flush()

            defect_count = 0
            for dt_data in json_data.get('DefectTypes', []):
                import_defect_type(db, new_spec.id, dt_data)
                defect_count += 1

            db.commit()

            results["imported"].append({
                "filename": file.filename,
                "spec_id": new_spec.id,
                "customer": new_spec.customer,
                "category": new_spec.category3,
                "defect_types": defect_count
            })

        except Exception as e:
            db.rollback()
            results["failed"].append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "status": "success",
        "results": results,
        "summary": {
            "total": results["total"],
            "imported": len(results["imported"]),
            "failed": len(results["failed"])
        }
    }
