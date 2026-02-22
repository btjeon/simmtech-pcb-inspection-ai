import sqlite3
import os
from pathlib import Path

# 환경변수로 DB 경로 오버라이드 가능 (단독 TAS 시스템과 DB 공유 시 사용)
# 예: TAS_DB_PATH=C:\Users\gogot\simmtech_tas\tas_backend\data\tas.db
_default_db = Path(__file__).parent / "data" / "tas.db"
DB_PATH = Path(os.environ.get("TAS_DB_PATH", str(_default_db)))

# Valid system groups
GROUPS = ("NEW", "LEGACY")

# Target schema DDL
_TARGET_DDL = """
CREATE TABLE IF NOT EXISTS tas_records (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    system_group     TEXT NOT NULL DEFAULT 'NEW',
    serial_no        TEXT NOT NULL,
    site             TEXT,
    manager          TEXT,
    issue_date       TEXT,
    check_date       TEXT,
    action_date      TEXT,
    core_version     TEXT,
    non_core_version TEXT,
    hw_status        TEXT,
    symptom          TEXT,
    cause            TEXT,
    action           TEXT,
    next_plan        TEXT,
    author           TEXT,
    author_date      TEXT,
    reviewer         TEXT,
    approver         TEXT,
    created_at       TEXT DEFAULT (datetime('now','localtime')),
    updated_at       TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(system_group, serial_no)
);
"""


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _table_has_old_unique(conn) -> bool:
    """True if the table exists with a single-column UNIQUE on serial_no (old schema)."""
    row = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='tas_records'"
    ).fetchone()
    if row is None:
        return False
    return "serial_no" in row[0] and "UNIQUE(system_group" not in row[0]


def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = get_db()

    if _table_has_old_unique(conn):
        # ── Rebuild: replace UNIQUE(serial_no) with UNIQUE(system_group, serial_no) ──
        old_cols = [r[1] for r in conn.execute("PRAGMA table_info(tas_records)").fetchall()]
        if "system_group" not in old_cols:
            conn.execute(
                "ALTER TABLE tas_records ADD COLUMN system_group TEXT NOT NULL DEFAULT 'NEW'"
            )
            conn.execute("UPDATE tas_records SET system_group='NEW'")
            conn.commit()

        conn.executescript("""
            CREATE TABLE tas_records_new (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                system_group     TEXT NOT NULL DEFAULT 'NEW',
                serial_no        TEXT NOT NULL,
                site             TEXT,
                manager          TEXT,
                issue_date       TEXT,
                check_date       TEXT,
                action_date      TEXT,
                core_version     TEXT,
                non_core_version TEXT,
                hw_status        TEXT,
                symptom          TEXT,
                cause            TEXT,
                action           TEXT,
                next_plan        TEXT,
                author           TEXT,
                author_date      TEXT,
                reviewer         TEXT,
                approver         TEXT,
                created_at       TEXT DEFAULT (datetime('now','localtime')),
                updated_at       TEXT DEFAULT (datetime('now','localtime')),
                UNIQUE(system_group, serial_no)
            );
        """)

        conn.execute("""
            INSERT OR IGNORE INTO tas_records_new
                (id, system_group, serial_no, site, manager,
                 issue_date, check_date, action_date,
                 core_version, non_core_version, hw_status,
                 symptom, cause, action, next_plan,
                 author, author_date, reviewer, approver,
                 created_at, updated_at)
            SELECT id, system_group, serial_no, site, manager,
                   issue_date, check_date, action_date,
                   core_version, non_core_version, hw_status,
                   symptom, cause, action, next_plan,
                   author, author_date, reviewer, approver,
                   created_at, updated_at
            FROM tas_records
        """)
        conn.commit()

        conn.executescript("""
            DROP TABLE tas_records;
            ALTER TABLE tas_records_new RENAME TO tas_records;
        """)
    else:
        conn.executescript(_TARGET_DDL)

    conn.executescript("""
        CREATE INDEX IF NOT EXISTS idx_group_serial ON tas_records(system_group, serial_no);
        CREATE INDEX IF NOT EXISTS idx_site          ON tas_records(site);
    """)

    conn.commit()
    conn.close()


def list_records(search: str = "", site: str = "", system_group: str = "") -> list:
    conn = get_db()
    sql = "SELECT * FROM tas_records WHERE 1=1"
    params = []
    if system_group:
        sql += " AND system_group = ?"
        params.append(system_group)
    if search:
        sql += " AND (serial_no LIKE ? OR symptom LIKE ? OR cause LIKE ? OR action LIKE ? OR manager LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like, like, like, like])
    if site:
        sql += " AND site = ?"
        params.append(site)
    sql += " ORDER BY serial_no DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_record(record_id: int) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM tas_records WHERE id=?", (record_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_record_by_serial(serial_no: str, system_group: str = "NEW") -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM tas_records WHERE system_group=? AND serial_no=?",
        (system_group, serial_no)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_record(data: dict) -> int:
    conn = get_db()
    if "system_group" not in data:
        data = {**data, "system_group": "NEW"}
    cols = [c for c in data if c not in ("id", "created_at", "updated_at")]
    sql = f"INSERT INTO tas_records ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})"
    cur = conn.execute(sql, [data[c] for c in cols])
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def update_record(record_id: int, data: dict):
    conn = get_db()
    cols = [c for c in data if c not in ("id", "serial_no", "system_group", "created_at", "updated_at")]
    set_clause = ", ".join(f"{c}=?" for c in cols)
    sql = f"UPDATE tas_records SET {set_clause}, updated_at=datetime('now','localtime') WHERE id=?"
    conn.execute(sql, [data[c] for c in cols] + [record_id])
    conn.commit()
    conn.close()


def delete_record(record_id: int):
    conn = get_db()
    conn.execute("DELETE FROM tas_records WHERE id=?", (record_id,))
    conn.commit()
    conn.close()


def list_sites(system_group: str = "") -> list[str]:
    conn = get_db()
    if system_group:
        rows = conn.execute(
            "SELECT DISTINCT site FROM tas_records WHERE system_group=? AND site IS NOT NULL AND site != '' ORDER BY site",
            (system_group,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT DISTINCT site FROM tas_records WHERE site IS NOT NULL AND site != '' ORDER BY site"
        ).fetchall()
    conn.close()
    return [r[0] for r in rows]
