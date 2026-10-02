"""
MODULE: SCHEMA MIGRATIONS & DATA PROVENANCE RUNNER (SSOT)
Hệ thống di chuyển lược đồ dữ liệu an toàn (Non-Destructive Migrations),
quản lý bảo chứng nguồn gốc (Data Provenance), Career Intelligence
và kiểm tra tính toàn vẹn khóa ngoại (Foreign Key Integrity).
"""

import sys
import time
import hashlib
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "history.db"
SCHEMA_SQL_PATH = Path(__file__).resolve().parent / "schema.sql"


def compute_script_checksum(content: str) -> str:
    """Tính mã băm SHA-256 cho nội dung script."""
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()[:16]


def get_table_columns(conn: sqlite3.Connection, table_name: str) -> List[str]:
    """Lấy danh sách các cột hiện có của một bảng."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info('{table_name}')")
        return [row[1] for row in cursor.fetchall()]
    except sqlite3.OperationalError:
        return []


def add_column_if_missing(
    conn: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_type: str
) -> bool:
    """Bổ sung một cột mới vào bảng hiện có một cách an toàn nếu chưa tồn tại."""
    cols = get_table_columns(conn, table_name)
    if column_name not in cols:
        conn.execute(f"ALTER TABLE '{table_name}' ADD COLUMN {column_name} {column_type}")
        return True
    return False


def ensure_migration_table(conn: sqlite3.Connection) -> None:
    """Tạo bảng lưu vết migration nếu chưa tồn tại."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            execution_time_ms INTEGER DEFAULT 0,
            checksum TEXT
        )
    """)
    conn.commit()


def get_applied_migrations(conn: sqlite3.Connection) -> List[str]:
    """Danh sách các phiên bản migration đã áp dụng."""
    ensure_migration_table(conn)
    cursor = conn.cursor()
    cursor.execute("SELECT version FROM schema_migrations ORDER BY id ASC")
    return [row[0] for row in cursor.fetchall()]


# ============================================================================
# MIGRATION DEFINITIONS (CHẶT CHẼ, KHÔNG PHÁ HỦY DỮ LIỆU)
# ============================================================================

def migration_001_core_schema(conn: sqlite3.Connection) -> None:
    """Migration 001: Tạo các bảng cốt lõi từ schema.sql nếu chưa tồn tại."""
    if SCHEMA_SQL_PATH.exists():
        sql_content = SCHEMA_SQL_PATH.read_text(encoding="utf-8")
        conn.executescript(sql_content)
    # Bảo toàn tương thích ngược cho bảng consultation_history
    conn.execute("""
        CREATE TABLE IF NOT EXISTS consultation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            request_payload TEXT,
            result_summary TEXT
        )
    """)
    # Bổ sung các cột phụ UI nếu chưa có
    add_column_if_missing(conn, "scenarios", "data_json", "TEXT")
    add_column_if_missing(conn, "scenarios", "updated_at", "TEXT")
    add_column_if_missing(conn, "study_tasks", "title", "TEXT")
    add_column_if_missing(conn, "study_tasks", "subject", "TEXT")
    add_column_if_missing(conn, "study_tasks", "progress_text", "TEXT")
    add_column_if_missing(conn, "study_tasks", "weight", "INTEGER DEFAULT 1")
    add_column_if_missing(conn, "study_tasks", "completed", "INTEGER DEFAULT 0")
    add_column_if_missing(conn, "study_tasks", "skipped", "INTEGER DEFAULT 0")
    add_column_if_missing(conn, "study_tasks", "scheduled_date", "TEXT")
    add_column_if_missing(conn, "study_tasks", "note", "TEXT")


def migration_002_user_events(conn: sqlite3.Connection) -> None:
    """Migration 002: Bảng telemetry & user events stream."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            pseudo_user_id TEXT NOT NULL,
            event_name TEXT NOT NULL,
            event_timestamp TEXT NOT NULL,
            page_route TEXT NOT NULL,
            entity_id TEXT,
            dwell_time_ms INTEGER,
            payload_json TEXT,
            shown_candidates_json TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_pseudo_user ON user_events(pseudo_user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_name_time ON user_events(event_name, event_timestamp)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON user_events(session_id)")


def migration_003_provenance_and_data_sources(conn: sqlite3.Connection) -> None:
    """Migration 003: Quản lý nguồn dữ liệu (Data Sources) và bổ sung provenance vào Điểm chuẩn / Học phí."""
    # 1. Bảng data_sources
    conn.execute("""
        CREATE TABLE IF NOT EXISTS data_sources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL DEFAULT 'official_pdf'
                CHECK (source_type IN ('regulation', 'official_pdf', 'official_web', 'secondary', 'estimated_fallback')),
            publisher TEXT,
            document_title TEXT,
            document_number TEXT,
            document_url TEXT,
            published_at TEXT,
            retrieved_at TEXT,
            content_hash TEXT,
            parser_version TEXT DEFAULT 'pipeline.clean@2.1.0',
            verification_status TEXT NOT NULL DEFAULT 'cross_checked'
                CHECK (verification_status IN ('unverified', 'cross_checked', 'human_audited', 'conflict_flagged')),
            confidence REAL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_data_sources_publisher ON data_sources(publisher)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(source_type)")

    # 2. Bổ sung các cột Data Provenance an toàn vào historical_cutoffs
    add_column_if_missing(conn, "historical_cutoffs", "source_id", "TEXT REFERENCES data_sources(id) ON DELETE SET NULL")
    add_column_if_missing(conn, "historical_cutoffs", "document_url", "TEXT")
    add_column_if_missing(conn, "historical_cutoffs", "page_number", "INTEGER")
    add_column_if_missing(conn, "historical_cutoffs", "extracted_at", "TEXT")
    add_column_if_missing(conn, "historical_cutoffs", "parser_version", "TEXT")
    add_column_if_missing(conn, "historical_cutoffs", "content_hash", "TEXT")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_cutoffs_source_id ON historical_cutoffs(source_id)")

    # 3. Bổ sung các cột Data Provenance an toàn vào tuitions
    add_column_if_missing(conn, "tuitions", "source_id", "TEXT REFERENCES data_sources(id) ON DELETE SET NULL")
    add_column_if_missing(conn, "tuitions", "document_url", "TEXT")
    add_column_if_missing(conn, "tuitions", "page_number", "INTEGER")
    add_column_if_missing(conn, "tuitions", "extracted_at", "TEXT")
    add_column_if_missing(conn, "tuitions", "parser_version", "TEXT")
    add_column_if_missing(conn, "tuitions", "content_hash", "TEXT")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tuitions_source_id ON tuitions(source_id)")

    # 4. Seed dữ liệu nguồn tuyển sinh chuẩn quốc gia nếu chưa có
    conn.execute("""
        INSERT OR IGNORE INTO data_sources (
            id, name, source_type, publisher, document_title, document_number,
            document_url, published_at, verification_status, confidence, parser_version
        ) VALUES
        ('SRC_MOET_REG_2024', 'Quy chế Tuyển sinh ĐH 2024', 'regulation', 'Bộ GD&ĐT',
         'Quy chế tuyển sinh đại học, tuyển sinh cao đẳng ngành Giáo dục Mầm non', 'Thông tư 08/2022/TT-BGDĐT',
         'https://moet.gov.vn/van-ban/vbdh/Pages/chi-tiet-van-ban.aspx?ItemID=8123', '2022-06-06', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
        ('SRC_BKA_DEAN_2024', 'Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024', 'official_pdf', 'ĐH Bách Khoa Hà Nội',
         'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 2145/QĐ-ĐHBK',
         'https://ts.hust.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-15', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
        ('SRC_NEU_DEAN_2024', 'Đề án Tuyển sinh ĐH Kinh tế Quốc dân 2024', 'official_pdf', 'ĐH Kinh tế Quốc dân',
         'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 892/QĐ-ĐHKTQD',
         'https://daotao.neu.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-10', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
        ('SRC_UET_DEAN_2024', 'Đề án Tuyển sinh ĐH Công nghệ - ĐHQGHN 2024', 'official_pdf', 'Trường ĐH Công nghệ - ĐHQGHN',
         'Đề án Tuyển sinh Đại học chính quy năm 2024', 'QĐ số 412/QĐ-ĐHCN',
         'https://uet.vnu.edu.vn/tuyen-sinh-2024.pdf', '2024-05-12', 'cross_checked', 0.98, 'pipeline.clean@2.1.0'),
        ('SRC_HCMUS_DEAN_2024', 'Đề án Tuyển sinh ĐH KHTN - ĐHQG-HCM 2024', 'official_pdf', 'Trường ĐH Khoa học Tự nhiên - ĐHQG TP.HCM',
         'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 638/QĐ-KHTN',
         'https://hcmus.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-08', 'cross_checked', 0.98, 'pipeline.clean@2.1.0')
    """)


def migration_004_career_intelligence(conn: sqlite3.Connection) -> None:
    """Migration 004: Cơ sở dữ liệu hướng nghiệp (Occupations, Major Mappings, Skill Requirements)."""
    # 1. Bảng occupations (Nghề nghiệp)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS occupations (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            title_vi TEXT NOT NULL,
            title_en TEXT,
            soc_code TEXT,
            description TEXT,
            growth_outlook TEXT DEFAULT 'cao'
                CHECK (growth_outlook IN ('rat_cao', 'cao', 'on_dinh', 'giam')),
            ai_exposure_score REAL DEFAULT 0.5
                CHECK (ai_exposure_score >= 0.0 AND ai_exposure_score <= 1.0),
            ai_risk_level TEXT DEFAULT 'trung_binh'
                CHECK (ai_risk_level IN ('thap', 'trung_binh', 'cao')),
            entry_salary_avg_mvnd REAL,
            mid_career_salary_avg_mvnd REAL,
            work_environment TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_occupations_code ON occupations(code)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_occupations_ai_risk ON occupations(ai_risk_level)")

    # 2. Bảng major_occupations (Ánh xạ Ngành -> Nghề)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS major_occupations (
            id TEXT PRIMARY KEY,
            major_id TEXT NOT NULL,
            occupation_id TEXT NOT NULL,
            relevance_score REAL DEFAULT 1.0
                CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
            employment_rate_pct REAL,
            transition_friction TEXT DEFAULT 'thap'
                CHECK (transition_friction IN ('thap', 'trung_binh', 'cao')),
            career_pathway_notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE,
            FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
            UNIQUE (major_id, occupation_id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_major_occupations_major ON major_occupations(major_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_major_occupations_occ ON major_occupations(occupation_id)")

    # 3. Bảng skill_requirements (Kỹ năng yêu cầu theo Nghề)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skill_requirements (
            id TEXT PRIMARY KEY,
            occupation_id TEXT NOT NULL,
            skill_name TEXT NOT NULL,
            skill_type TEXT NOT NULL DEFAULT 'hard_skill'
                CHECK (skill_type IN ('hard_skill', 'soft_skill', 'domain_knowledge', 'tool_technology')),
            proficiency_level TEXT DEFAULT 'intermediate'
                CHECK (proficiency_level IN ('basic', 'intermediate', 'advanced', 'expert')),
            importance_weight REAL DEFAULT 1.0
                CHECK (importance_weight >= 0.0 AND importance_weight <= 1.0),
            market_demand_trend TEXT DEFAULT 'tang_manh'
                CHECK (market_demand_trend IN ('tang_manh', 'tang_nhe', 'on_dinh', 'giam')),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_skills_occ ON skill_requirements(occupation_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_skills_type ON skill_requirements(skill_type)")

    # 4. Seed dữ liệu nghề nghiệp phổ biến
    conn.execute("""
        INSERT OR IGNORE INTO occupations (
            id, code, title_vi, title_en, soc_code, description,
            growth_outlook, ai_exposure_score, ai_risk_level,
            entry_salary_avg_mvnd, mid_career_salary_avg_mvnd, work_environment
        ) VALUES
        ('OCC_SWE', '2512-SWE', 'Kỹ sư phát triển phần mềm', 'Software Engineer', '15-1252',
         'Thiết kế, xây dựng và tối ưu hóa hệ thống phần mềm, dịch vụ backend/frontend.',
         'rat_cao', 0.65, 'trung_binh', 15.0, 38.0, 'Văn phòng / Hybrid'),
        ('OCC_DATA_ENG', '2512-DE', 'Kỹ sư dữ liệu', 'Data Engineer', '15-1259',
         'Xây dựng pipeline ETL/ELT, kho dữ liệu lớn Lakehouse và hạ tầng phân tích.',
         'rat_cao', 0.50, 'thap', 16.5, 42.0, 'Văn phòng / Cloud'),
        ('OCC_AI_SPEC', '2511-AIML', 'Chuyên viên Trí tuệ Nhân tạo & Học máy', 'AI/ML Specialist', '15-1221',
         'Huấn luyện, tinh chỉnh mô hình máy học, LLM, Computer Vision và tích hợp ứng dụng.',
         'rat_cao', 0.80, 'thap', 18.0, 50.0, 'Phòng thí nghiệm / Tech Lab'),
        ('OCC_DATA_ANALYST', '2513-DA', 'Chuyên viên phân tích dữ liệu', 'Data Analyst', '15-2051',
         'Khai thác dữ liệu kinh doanh, xây dựng dashboard trực quan và dự báo chỉ số.',
         'cao', 0.70, 'trung_binh', 13.0, 28.0, 'Văn phòng kinh doanh'),
        ('OCC_FIN_ANALYST', '2413-FA', 'Chuyên viên phân tích tài chính', 'Financial Analyst', '13-2051',
         'Định giá doanh nghiệp, phân tích danh mục đầu tư và kiểm soát rủi ro tài chính.',
         'cao', 0.60, 'trung_binh', 14.0, 32.0, 'Ngân hàng / Quỹ đầu tư'),
        ('OCC_AUTO_ENG', '2152-ROBOT', 'Kỹ sư Tự động hóa & Robot', 'Automation & Robotics Engineer', '17-2199',
         'Lập trình điều khiển PLC, thiết kế cánh tay robot công nghiệp và dây chuyền thông minh.',
         'cao', 0.40, 'thap', 14.5, 30.0, 'Nhà máy thông minh / R&D Lab'),
        ('OCC_MED_DOCTOR', '2211-GP', 'Bác sĩ đa khoa / chuyên khoa', 'General Practitioner / Physician', '29-1216',
         'Khám, chẩn đoán, điều trị bệnh và chăm sóc sức khỏe cộng đồng.',
         'rat_cao', 0.30, 'thap', 12.0, 35.0, 'Bệnh viện / Phòng khám')
    """)

    # 5. Seed kỹ năng cho các nghề
    conn.execute("""
        INSERT OR IGNORE INTO skill_requirements (
            id, occupation_id, skill_name, skill_type, proficiency_level, importance_weight, market_demand_trend
        ) VALUES
        ('SKL_SWE_PY', 'OCC_SWE', 'Python / Java / Golang', 'hard_skill', 'advanced', 0.95, 'tang_manh'),
        ('SKL_SWE_ARCH', 'OCC_SWE', 'Thiết kế kiến trúc hệ thống & Clean Code', 'hard_skill', 'intermediate', 0.90, 'tang_manh'),
        ('SKL_SWE_GIT', 'OCC_SWE', 'Git / CI-CD / Docker', 'tool_technology', 'intermediate', 0.85, 'tang_manh'),
        ('SKL_DE_SQL', 'OCC_DATA_ENG', 'SQL nâng cao & Data Modeling', 'hard_skill', 'advanced', 0.95, 'tang_manh'),
        ('SKL_DE_SPARK', 'OCC_DATA_ENG', 'Apache Spark / DuckDB / Airflow', 'tool_technology', 'intermediate', 0.90, 'tang_manh'),
        ('SKL_AI_MATH', 'OCC_AI_SPEC', 'Đại số tuyến tính & Xác suất thống kê', 'domain_knowledge', 'advanced', 0.95, 'tang_manh'),
        ('SKL_AI_PYTORCH', 'OCC_AI_SPEC', 'PyTorch / Transformers / HuggingFace', 'tool_technology', 'advanced', 0.95, 'tang_manh'),
        ('SKL_FA_MODEL', 'OCC_FIN_ANALYST', 'Mô hình hóa tài chính & DCF', 'hard_skill', 'advanced', 0.90, 'on_dinh')
    """)


def migration_005_dataset_versioning(conn: sqlite3.Connection) -> None:
    """Migration 005: Bảng quản lý phiên bản Dataset và snapshot."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dataset_versions (
            id TEXT PRIMARY KEY,
            version_tag TEXT NOT NULL UNIQUE,
            description TEXT,
            schema_version TEXT NOT NULL DEFAULT '2.1.0',
            total_records INTEGER DEFAULT 0,
            checksum TEXT,
            status TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('draft', 'active', 'archived', 'deprecated')),
            released_at TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dataset_versions_tag ON dataset_versions(version_tag)")

    # Seed bản snapshot đầu tiên
    conn.execute("""
        INSERT OR IGNORE INTO dataset_versions (
            id, version_tag, description, schema_version, total_records, status, released_at
        ) VALUES (
            'DSV_2026_09_V1', '2026.09-release',
            'Dữ liệu tuyển sinh chuẩn hóa 2024-2025 tích hợp Data Provenance & Career Intelligence',
            '2.1.0', 1250, 'active', '2026-09-17'
        )
    """)


# Registry các migration theo thứ tự nghiêm ngặt
MIGRATIONS: List[Tuple[str, str, Any]] = [
    ("001_core_schema", "Khởi tạo 24 bảng cốt lõi và tương thích consultation_history", migration_001_core_schema),
    ("002_user_events", "Bổ sung bảng telemetry user_events stream", migration_002_user_events),
    ("003_provenance_and_data_sources", "Bổ sung data_sources và các cột Data Provenance", migration_003_provenance_and_data_sources),
    ("004_career_intelligence", "Bổ sung Career Intelligence (occupations, major_occupations, skills)", migration_004_career_intelligence),
    ("005_dataset_versioning", "Bổ sung quản lý phiên bản dataset_versions", migration_005_dataset_versioning),
]


# ============================================================================
# MIGRATION EXECUTION & INTEGRITY CHECK ENGINE
# ============================================================================

def check_foreign_key_integrity(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Kiểm tra tính toàn vẹn khóa ngoại trên toàn bộ cơ sở dữ liệu.
    Trả về danh sách các vi phạm nếu có (rỗng nếu 100% hợp lệ).
    """
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA foreign_key_check;")
    violations = []
    for row in cursor.fetchall():
        # row: (table, rowid, parent_table, fkid)
        violations.append({
            "table": row[0],
            "rowid": row[1],
            "parent_table": row[2],
            "foreign_key_index": row[3],
        })
    return violations


def apply_migrations(
    target_db: Optional[Union[str, Path, sqlite3.Connection]] = None
) -> List[str]:
    """
    Áp dụng toàn bộ các migration chưa chạy vào cơ sở dữ liệu.
    Đảm bảo 100% an toàn, không phá hủy dữ liệu (Idempotent & Non-destructive).
    """
    is_external_conn = isinstance(target_db, sqlite3.Connection)
    conn = target_db if is_external_conn else sqlite3.connect(str(target_db or DEFAULT_DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON;")

    applied_now: List[str] = []
    try:
        ensure_migration_table(conn)
        already_applied = set(get_applied_migrations(conn))

        for version, name, func in MIGRATIONS:
            if version in already_applied:
                continue

            start_t = time.perf_counter()
            # Thực thi migration function
            func(conn)
            elapsed_ms = int((time.perf_counter() - start_t) * 1000)

            checksum = compute_script_checksum(f"{version}_{name}")
            conn.execute(
                """
                INSERT INTO schema_migrations (version, name, applied_at, execution_time_ms, checksum)
                VALUES (?, ?, ?, ?, ?)
                """,
                (version, name, datetime.now(timezone.utc).isoformat(), elapsed_ms, checksum)
            )
            conn.commit()
            applied_now.append(version)

        # Kiểm tra tính toàn vẹn khóa ngoại sau khi migrate
        violations = check_foreign_key_integrity(conn)
        if violations:
            raise sqlite3.IntegrityError(f"Phát hiện {len(violations)} vi phạm Foreign Key sau migration: {violations}")

        return applied_now
    finally:
        if not is_external_conn:
            conn.close()


def get_migration_status(
    target_db: Optional[Union[str, Path, sqlite3.Connection]] = None
) -> List[Dict[str, Any]]:
    """Tra cứu trạng thái tất cả các migration."""
    is_external_conn = isinstance(target_db, sqlite3.Connection)
    conn = target_db if is_external_conn else sqlite3.connect(str(target_db or DEFAULT_DB_PATH))
    try:
        ensure_migration_table(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT version, name, applied_at, execution_time_ms, checksum FROM schema_migrations")
        applied_map = {row[0]: {
            "name": row[1],
            "applied_at": row[2],
            "execution_time_ms": row[3],
            "checksum": row[4],
        } for row in cursor.fetchall()}

        status_list = []
        for version, name, _ in MIGRATIONS:
            is_applied = version in applied_map
            status_list.append({
                "version": version,
                "name": name,
                "is_applied": is_applied,
                "applied_at": applied_map[version]["applied_at"] if is_applied else None,
                "execution_time_ms": applied_map[version]["execution_time_ms"] if is_applied else 0,
            })
        return status_list
    finally:
        if not is_external_conn:
            conn.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    db_arg = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
    flag = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1].startswith("--") else "--status"

    target = db_arg or DEFAULT_DB_PATH
    print(f"[MIGRATIONS] Kết nối cơ sở dữ liệu: {target}")

    if flag == "--migrate":
        print("[MIGRATIONS] Đang thực thi migrations an toàn...")
        applied = apply_migrations(target)
        print(f"[MIGRATIONS] Hoàn tất! Đã áp dụng {len(applied)} migrations mới: {applied}")
    elif flag == "--check-fk":
        conn = sqlite3.connect(str(target))
        violations = check_foreign_key_integrity(conn)
        conn.close()
        if violations:
            print(f"[CẢNH BÁO] Phát hiện {len(violations)} vi phạm Foreign Key!")
            for v in violations:
                print(f"  - Bảng: {v['table']}, rowid: {v['rowid']}, tham chiếu: {v['parent_table']}")
        else:
            print("[THÀNH CÔNG] Foreign Key Integrity: 100% HỢP LỆ (0 vi phạm).")
    else:
        statuses = get_migration_status(target)
        print("\n--- BẢNG TRẠNG THÁI MIGRATION ---")
        for s in statuses:
            status_icon = "✓ ĐÃ CHẠY" if s["is_applied"] else "○ CHƯA CHẠY"
            print(f"[{status_icon}] {s['version']} - {s['name']} ({s.get('applied_at') or 'N/A'})")
