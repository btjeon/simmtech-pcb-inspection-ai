"""
Parse existing PDF files into dict records for DB migration.
Uses pdfplumber to extract tables from each page.
Structure per TAS record page:
  Table 0: title (ignored)
  Table 1: 7 rows x 4 cols — main data
  Table 2: 4 rows x 4 cols — signature info
"""
import re
from pathlib import Path
import pdfplumber


def _strip(text: str) -> str:
    return text.strip().lstrip("□ ").strip() if text else ""


def _after_colon(text: str) -> str:
    if text and ":" in text:
        return text.split(":", 1)[1].strip()
    return _strip(text)


def _cell(table, r, c) -> str:
    try:
        val = table[r][c]
        return val.strip() if val else ""
    except (IndexError, AttributeError):
        return ""


def _parse_main_table(table) -> dict:
    data = {}

    data["serial_no"] = _after_colon(_cell(table, 0, 1)).replace(" ", "")
    data["site"]      = _after_colon(_cell(table, 0, 2))
    data["manager"]   = _after_colon(_cell(table, 0, 3))

    data["issue_date"]  = _after_colon(_strip(_cell(table, 1, 1)))
    data["check_date"]  = _after_colon(_strip(_cell(table, 1, 2)))
    data["action_date"] = _after_colon(_strip(_cell(table, 1, 3)))

    data["core_version"]     = _after_colon(_strip(_cell(table, 2, 1)))
    data["non_core_version"] = _after_colon(_strip(_cell(table, 2, 2)))
    data["hw_status"]        = _after_colon(_strip(_cell(table, 2, 3)))

    data["symptom"]   = _cell(table, 3, 1)
    data["cause"]     = _cell(table, 4, 1)
    data["action"]    = _cell(table, 5, 1)
    data["next_plan"] = _cell(table, 6, 1)

    return data


def _parse_sign_table(table) -> dict:
    return {
        "author_date": _cell(table, 1, 1),
        "author":      _cell(table, 2, 1),
        "reviewer":    _cell(table, 2, 2),
        "approver":    _cell(table, 2, 3),
    }


def _parse_page(page) -> dict | None:
    """Parse a single PDF page. Returns record dict or None if not a TAS slide."""
    tables = page.extract_tables()

    main_table = None
    sign_table = None
    for tbl in tables:
        if not tbl:
            continue
        nrows = len(tbl)
        ncols = len(tbl[0]) if tbl[0] else 0
        if nrows >= 7 and ncols >= 4:
            main_table = tbl
        elif nrows == 4 and ncols >= 4:
            sign_table = tbl

    if main_table is None:
        return None

    serial_cell = _cell(main_table, 0, 1)
    if "Serial No" not in serial_cell:
        return None

    data = _parse_main_table(main_table)

    if not re.match(r"\d{4}-\d+", data.get("serial_no", "")):
        m = re.search(r"(\d{4}-\d+)", serial_cell)
        if m:
            data["serial_no"] = m.group(1)
        else:
            return None

    if sign_table:
        data.update(_parse_sign_table(sign_table))
    else:
        data.update({"author_date": "", "author": "", "reviewer": "", "approver": ""})

    return data


def parse_pdf(pdf_path: str | Path) -> list[dict]:
    """Parse all TAS record pages from a PDF file. Returns list of dicts."""
    records = []
    seen = set()

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            rec = _parse_page(page)
            if rec and rec["serial_no"] not in seen:
                seen.add(rec["serial_no"])
                records.append(rec)

    return records
