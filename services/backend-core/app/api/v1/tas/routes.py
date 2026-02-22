"""
TAS (Technical Action Summary) API Routes
System 이상발생 분석 관리 - AI System 이상발생 이력 CRUD + PPT 생성
"""
import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal

from app.api.v1.tas import database as db
from app.api.v1.tas.ppt_generator import generate_single_pptx, generate_multi_pptx
from app.api.v1.tas.ppt_parser import parse_pptx
from app.api.v1.tas.pdf_parser import parse_pdf

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RecordIn(BaseModel):
    system_group: Literal["NEW", "LEGACY"] = "NEW"
    serial_no: str
    site: str = ""
    manager: str = ""
    issue_date: str = ""
    check_date: str = ""
    action_date: str = ""
    core_version: str = ""
    non_core_version: str = ""
    hw_status: str = ""
    symptom: str = ""
    cause: str = ""
    action: str = ""
    next_plan: str = ""
    author: str = ""
    author_date: str = ""
    reviewer: str = ""
    approver: str = ""


# ---------------------------------------------------------------------------
# Routes: Records CRUD
# ---------------------------------------------------------------------------

@router.get("/records")
def list_records(search: str = "", site: str = "", system_group: str = ""):
    records = db.list_records(search=search, site=site, system_group=system_group)
    sites = db.list_sites(system_group=system_group)
    return {"records": records, "total": len(records), "sites": sites}


@router.get("/records/{record_id}")
def get_record(record_id: int):
    record = db.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.post("/records", status_code=201)
def create_record(body: RecordIn):
    if not body.serial_no.strip():
        raise HTTPException(status_code=422, detail="serial_no is required")
    if db.get_record_by_serial(body.serial_no.strip(), body.system_group):
        raise HTTPException(
            status_code=409,
            detail=f"[{body.system_group}] Serial No. {body.serial_no} already exists"
        )
    data = body.model_dump()
    data["serial_no"] = data["serial_no"].strip()
    new_id = db.create_record(data)
    return db.get_record(new_id)


@router.put("/records/{record_id}")
def update_record(record_id: int, body: RecordIn):
    if not db.get_record(record_id):
        raise HTTPException(status_code=404, detail="Record not found")
    data = body.model_dump()
    db.update_record(record_id, data)
    return db.get_record(record_id)


@router.delete("/records/{record_id}", status_code=204)
def delete_record(record_id: int):
    if not db.get_record(record_id):
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete_record(record_id)


# ---------------------------------------------------------------------------
# Routes: PPT Download
# ---------------------------------------------------------------------------

@router.get("/download/single/{record_id}")
def download_single(record_id: int):
    record = db.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    pptx_bytes = generate_single_pptx(record)
    serial = record["serial_no"]
    grp = record.get("system_group", "NEW")
    filename = f"TAS_{grp}_{serial}.pptx"
    return StreamingResponse(
        iter([pptx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/download/all")
def download_all(search: str = "", site: str = "", system_group: str = ""):
    records = db.list_records(search=search, site=site, system_group=system_group)
    if not records:
        raise HTTPException(status_code=404, detail="No records found")
    pptx_bytes = generate_multi_pptx(records)
    label = system_group or "전체"
    return StreamingResponse(
        iter([pptx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename=TAS_{label}_이력.pptx"},
    )


# ---------------------------------------------------------------------------
# Routes: Migration (PPT/PDF → DB)
# ---------------------------------------------------------------------------

def _run_migration(file_path: str, system_group: str) -> dict:
    """Shared migration logic. Supports both .pptx and .pdf files."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        records = parse_pdf(file_path)
    else:
        records = parse_pptx(file_path)

    inserted, skipped, errors = 0, 0, []
    for rec in records:
        rec["system_group"] = system_group
        if db.get_record_by_serial(rec["serial_no"], system_group):
            skipped += 1
        else:
            try:
                db.create_record(rec)
                inserted += 1
            except Exception as e:
                errors.append(f"{rec['serial_no']}: {str(e)}")
    return {"total": len(records), "inserted": inserted, "skipped": skipped, "errors": errors}


@router.post("/migrate")
async def migrate(
    file: UploadFile = File(...),
    system_group: str = Form("NEW"),
):
    if system_group not in db.GROUPS:
        raise HTTPException(status_code=400, detail=f"system_group must be one of {db.GROUPS}")

    fname = file.filename or ""
    ext = Path(fname).suffix.lower()
    if ext not in (".pptx", ".pdf"):
        raise HTTPException(status_code=400, detail="PPTX 또는 PDF 파일만 업로드 가능합니다")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp_path = tmp.name
            while chunk := await file.read(1024 * 1024):
                tmp.write(chunk)
        return _run_migration(tmp_path, system_group)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
