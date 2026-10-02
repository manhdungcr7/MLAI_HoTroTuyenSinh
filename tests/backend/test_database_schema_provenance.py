"""
TEST SUITE: DATABASE SCHEMA, DATA PROVENANCE & CAREER INTELLIGENCE
Kiểm thử toàn diện cho SUBAGENT 07:
1. Tính toàn vẹn 31 bảng quan hệ & các cột Data Provenance (historical_cutoffs, tuitions)
2. Safe Idempotent Migrations (chạy lặp lại không lỗi, không mất dữ liệu)
3. Data Provenance Lifecycle (liên kết nguồn source_id, document_url, page, hash, parser_version)
4. Career Intelligence (occupations, major_occupations, skill_requirements)
5. Dataset Versioning (dataset_versions & release snapshots)
6. PRAGMA foreign_keys = ON enforcement & Foreign Key Integrity
7. Cascade Deletions & Pydantic Validation Constraints
"""

import sys
import uuid
import sqlite3
import pytest
from pathlib import Path
from pydantic import ValidationError

# Force UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.models import (
    DataSourceModel,
    HistoricalCutoffModel,
    TuitionModel,
    OccupationModel,
    MajorOccupationModel,
    SkillRequirementModel,
    DatasetVersionModel,
    UniversityModel,
    MajorModel,
    Repository,
    get_db_connection,
)
from backend.app.migrations import (
    apply_migrations,
    check_foreign_key_integrity,
    get_migration_status,
    get_table_columns,
)


@pytest.fixture
def temp_db(tmp_path):
    """Fixture tạo SQLite database tạm thời phục vụ kiểm thử cô lập."""
    db_file = tmp_path / "test_provenance.db"
    # Áp dụng migration để tạo cấu trúc chuẩn
    apply_migrations(db_file)
    return db_file


# ============================================================================
# 1. SCHEMA STRUCTURE & PROVENANCE COLUMNS
# ============================================================================

def test_schema_tables_and_columns(temp_db):
    """Kiểm tra sự tồn tại của 31 bảng chuẩn hóa và các cột Data Provenance."""
    conn = get_db_connection(temp_db)
    cursor = conn.cursor()

    # 1. Lấy danh sách bảng
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = {row[0] for row in cursor.fetchall()}

    required_tables = {
        "users", "student_profiles", "academic_records", "subject_scores",
        "mock_exam_results", "universities", "majors", "admission_methods",
        "subject_combinations", "data_sources", "historical_cutoffs", "tuitions",
        "locations", "occupations", "major_occupations", "skill_requirements",
        "targets", "preferences", "constraints", "recommendations",
        "recommendation_reasons", "scenarios", "study_plans", "study_tasks",
        "progress_records", "ai_analyses", "analysis_snapshots", "user_feedbacks",
        "user_events", "dataset_versions", "schema_migrations"
    }

    missing_tables = required_tables - tables
    assert not missing_tables, f"Thiếu bảng trong schema: {missing_tables}"

    # 2. Kiểm tra các cột Provenance trong historical_cutoffs
    cutoff_cols = set(get_table_columns(conn, "historical_cutoffs"))
    required_cutoff_provenance = {
        "source_id", "document_url", "page_number",
        "extracted_at", "parser_version", "content_hash"
    }
    missing_cutoff_cols = required_cutoff_provenance - cutoff_cols
    assert not missing_cutoff_cols, f"historical_cutoffs thiếu cột provenance: {missing_cutoff_cols}"

    # 3. Kiểm tra các cột Provenance trong tuitions
    tuition_cols = set(get_table_columns(conn, "tuitions"))
    required_tuition_provenance = {
        "source_id", "document_url", "page_number",
        "extracted_at", "parser_version", "content_hash"
    }
    missing_tuition_cols = required_tuition_provenance - tuition_cols
    assert not missing_tuition_cols, f"tuitions thiếu cột provenance: {missing_tuition_cols}"

    conn.close()


# ============================================================================
# 2. SAFE & IDEMPOTENT MIGRATIONS
# ============================================================================

def test_safe_migrations_idempotency(tmp_path):
    """Kiểm tra cơ chế migration an toàn: chạy nhiều lần không lỗi, không ghi đè dữ liệu."""
    db_file = tmp_path / "test_migrate.db"

    # Lần 1: Chạy migration trên db mới
    applied_1 = apply_migrations(db_file)
    assert len(applied_1) == 5
    assert "001_core_schema" in applied_1
    assert "003_provenance_and_data_sources" in applied_1
    assert "004_career_intelligence" in applied_1

    # Thêm một bản ghi dữ liệu mẫu
    repo = Repository(db_file)
    source = DataSourceModel(
        id="SRC_TEST_CUSTOM",
        name="Đề án kiểm thử",
        source_type="official_pdf",
        publisher="ĐH Kiểm thử"
    )
    repo.create_data_source(source)

    # Lần 2: Chạy lại migration trên cùng db
    applied_2 = apply_migrations(db_file)
    assert len(applied_2) == 0, "Migration lần 2 không được áp dụng lại các bước đã hoàn thành"

    # Xác minh dữ liệu không bị mất mát
    retrieved = repo.get_data_source("SRC_TEST_CUSTOM")
    assert retrieved is not None
    assert retrieved["publisher"] == "ĐH Kiểm thử"

    # Kiểm tra trạng thái migration
    statuses = get_migration_status(db_file)
    assert all(s["is_applied"] for s in statuses)


# ============================================================================
# 3. DATA PROVENANCE LIFECYCLE & TRACEABILITY
# ============================================================================

def test_data_provenance_traceability(temp_db):
    """Kiểm tra khả năng truy vết nguồn gốc con số Điểm chuẩn & Học phí tới Đề án gốc."""
    repo = Repository(temp_db)

    # 1. Tạo Nguồn văn bản Đề án (Data Source)
    source = DataSourceModel(
        id="SRC_HUST_2024_PDF",
        name="Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024",
        source_type="official_pdf",
        publisher="Đại học Bách Khoa Hà Nội",
        document_title="Đề án Tuyển sinh trình độ Đại học năm 2024",
        document_number="QĐ 2145/QĐ-ĐHBK",
        document_url="https://ts.hust.edu.vn/de-an-2024.pdf",
        published_at="2024-05-15",
        content_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        parser_version="pipeline.clean@2.1.0",
        verification_status="human_audited",
        confidence=1.0,
        notes="Dấu đỏ xác thực bởi Hội đồng Tuyển sinh Bách Khoa"
    )
    repo.create_data_source(source)

    # 2. Tạo Trường và Ngành mẫu
    with get_db_connection(temp_db) as conn:
        conn.execute("""
            INSERT OR IGNORE INTO universities (id, code, name_vi, type, province, region, address)
            VALUES ('UNIV_BKA', 'BKA', 'Đại học Bách Khoa Hà Nội', 'cong_lap', 'Hà Nội', 'bac', 'Hà Nội')
        """)
        conn.execute("""
            INSERT OR IGNORE INTO majors (id, code, name_vi, major_group_code, major_group_name)
            VALUES ('MAJ_IT1', '7480201', 'Khoa học Máy tính (IT1)', 'cntt', 'Công nghệ thông tin')
        """)
        conn.commit()

    # 3. Ghi nhận Điểm chuẩn liên kết nguồn gốc Provenance chi tiết
    cutoff = HistoricalCutoffModel(
        id=str(uuid.uuid4()),
        university_id="UNIV_BKA",
        major_id="MAJ_IT1",
        method_id="PT100",
        combination_id="A00",
        year=2024,
        cutoff_score=29.42,
        quota=300,
        source_id="SRC_HUST_2024_PDF",
        document_url="https://ts.hust.edu.vn/de-an-2024.pdf",
        page_number=45,
        extracted_at="2024-05-16T10:00:00Z",
        parser_version="pipeline.clean@2.1.0",
        content_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        data_quality="day_du"
    )
    repo.record_historical_cutoff(cutoff)

    # 4. Ghi nhận Học phí liên kết nguồn gốc Provenance
    tuition = TuitionModel(
        id=str(uuid.uuid4()),
        university_id="UNIV_BKA",
        major_id="MAJ_IT1",
        academic_year="2024-2025",
        tuition_min_mvnd=24.0,
        tuition_max_mvnd=30.0,
        program_type="chuan",
        source_id="SRC_HUST_2024_PDF",
        document_url="https://ts.hust.edu.vn/de-an-2024.pdf",
        page_number=62,
        extracted_at="2024-05-16T10:00:00Z",
        parser_version="pipeline.clean@2.1.0",
        content_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    repo.record_tuition(tuition)

    # 5. Truy vấn và xác thực liên kết JOIN
    cutoffs = repo.get_historical_cutoffs("UNIV_BKA", "MAJ_IT1")
    assert len(cutoffs) == 1
    c0 = cutoffs[0]
    assert c0["cutoff_score"] == 29.42
    assert c0["source_id"] == "SRC_HUST_2024_PDF"
    assert c0["source_name"] == "Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024"
    assert c0["source_publisher"] == "Đại học Bách Khoa Hà Nội"
    assert c0["page_number"] == 45
    assert c0["content_hash"] == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    tuitions = repo.get_tuitions("UNIV_BKA", "MAJ_IT1")
    assert len(tuitions) == 1
    t0 = tuitions[0]
    assert t0["tuition_min_mvnd"] == 24.0
    assert t0["source_id"] == "SRC_HUST_2024_PDF"
    assert t0["source_name"] == "Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024"
    assert t0["page_number"] == 62


# ============================================================================
# 4. CAREER INTELLIGENCE (OCCUPATIONS, MAPPINGS, SKILLS)
# ============================================================================

def test_career_intelligence_flow(temp_db):
    """Kiểm tra mô hình hướng nghiệp: Nghề nghiệp -> Ánh xạ Ngành -> Kỹ năng cốt lõi."""
    repo = Repository(temp_db)

    # 1. Tạo Nghề nghiệp
    occ = OccupationModel(
        id="OCC_CLOUD_ARCH",
        code="2512-CLOUD",
        title_vi="Kiến trúc sư Điện toán Đám mây",
        title_en="Cloud Solutions Architect",
        growth_outlook="rat_cao",
        ai_exposure_score=0.45,
        ai_risk_level="thap",
        entry_salary_avg_mvnd=22.0,
        mid_career_salary_avg_mvnd=55.0,
        work_environment="Tech Enterprise / Hybrid"
    )
    repo.create_occupation(occ)

    # 2. Tạo Ngành đào tạo
    with get_db_connection(temp_db) as conn:
        conn.execute("""
            INSERT OR IGNORE INTO majors (id, code, name_vi, major_group_code, major_group_name)
            VALUES ('MAJ_CLOUD_NET', '7480202', 'An toàn thông tin & Mạng máy tính', 'cntt', 'Công nghệ thông tin')
        """)
        conn.commit()

    # 3. Ánh xạ Ngành sang Nghề (Major Occupation Mapping)
    link = MajorOccupationModel(
        id=str(uuid.uuid4()),
        major_id="MAJ_CLOUD_NET",
        occupation_id="OCC_CLOUD_ARCH",
        relevance_score=0.95,
        employment_rate_pct=88.5,
        transition_friction="thap",
        career_pathway_notes="Lộ trình: Kỹ sư DevOps -> Cloud Engineer -> Cloud Solutions Architect"
    )
    repo.link_major_occupation(link)

    # 4. Thêm Kỹ năng yêu cầu (Skill Requirements)
    skill_aws = SkillRequirementModel(
        id=str(uuid.uuid4()),
        occupation_id="OCC_CLOUD_ARCH",
        skill_name="AWS / Azure Infrastructure Architecture",
        skill_type="hard_skill",
        proficiency_level="expert",
        importance_weight=0.98,
        market_demand_trend="tang_manh"
    )
    skill_k8s = SkillRequirementModel(
        id=str(uuid.uuid4()),
        occupation_id="OCC_CLOUD_ARCH",
        skill_name="Kubernetes & Container Orchestration",
        skill_type="tool_technology",
        proficiency_level="advanced",
        importance_weight=0.92,
        market_demand_trend="tang_manh"
    )
    repo.add_skill_requirement(skill_aws)
    repo.add_skill_requirement(skill_k8s)

    # 5. Truy vấn và xác thực thông tin hướng nghiệp
    careers = repo.get_occupations_by_major("MAJ_CLOUD_NET")
    assert len(careers) == 1
    c0 = careers[0]
    assert c0["title_vi"] == "Kiến trúc sư Điện toán Đám mây"
    assert c0["relevance_score"] == 0.95
    assert c0["employment_rate_pct"] == 88.5

    skills = repo.get_skills_by_occupation("OCC_CLOUD_ARCH")
    assert len(skills) == 2
    assert skills[0]["skill_name"] == "AWS / Azure Infrastructure Architecture"
    assert skills[0]["importance_weight"] == 0.98


# ============================================================================
# 5. DATASET VERSIONING SSOT
# ============================================================================

def test_dataset_versioning_tracking(temp_db):
    """Kiểm tra quản lý phiên bản dataset và truy xuất snapshot."""
    repo = Repository(temp_db)

    # Seed mặc định từ migration
    active_ver = repo.get_active_dataset_version()
    assert active_ver is not None
    assert active_ver["status"] == "active"

    # Tạo phiên bản mới
    new_ver = DatasetVersionModel(
        id="DSV_2026_10_TEST",
        version_tag="2026.10-preview",
        description="Bổ sung dữ liệu tuyển sinh đợt bổ sung",
        schema_version="2.1.0",
        total_records=1500,
        status="active"
    )
    repo.record_dataset_version(new_ver)

    versions = repo.list_dataset_versions()
    assert len(versions) >= 2
    assert any(v["version_tag"] == "2026.10-preview" for v in versions)


# ============================================================================
# 6. PRAGMA FOREIGN KEYS ENFORCEMENT & INTEGRITY
# ============================================================================

def test_foreign_key_enforcement_and_integrity(temp_db):
    """Kiểm tra PRAGMA foreign_keys = ON bắt buộc và bắt lỗi vi phạm toàn vẹn."""
    conn = get_db_connection(temp_db)

    # 1. Bật foreign keys và kiểm tra không có vi phạm ban đầu
    violations = check_foreign_key_integrity(conn)
    assert len(violations) == 0, f"Cơ sở dữ liệu ban đầu có vi phạm: {violations}"

    # 2. Cố tình chèn điểm chuẩn với source_id KHÔNG TỒN TẠI
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("""
            INSERT INTO historical_cutoffs (
                id, university_id, major_id, method_id, combination_id, year,
                cutoff_score, source_id
            ) VALUES (
                'CUTOFF_BAD', 'UNIV_BKA', 'MAJ_IT1', 'PT100', 'A00', 2024,
                28.0, 'SRC_DOES_NOT_EXIST'
            )
        """)

    # 3. Cố tình chèn major_occupations với occupation_id KHÔNG TỒN TẠI
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("""
            INSERT INTO major_occupations (id, major_id, occupation_id)
            VALUES ('MO_BAD', 'MAJ_IT1', 'OCC_NON_EXISTENT')
        """)

    # 4. Cố tình chèn skill_requirements với occupation_id KHÔNG TỒN TẠI
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("""
            INSERT INTO skill_requirements (id, occupation_id, skill_name)
            VALUES ('SKL_BAD', 'OCC_NON_EXISTENT', 'Quantum Computing')
        """)

    conn.close()


def test_cascade_delete_integrity(temp_db):
    """Kiểm tra cơ chế xóa xếp tầng (Cascade Delete) của nghề nghiệp và kỹ năng."""
    repo = Repository(temp_db)

    # Tạo nghề nghiệp tạm
    occ = OccupationModel(
        id="OCC_TEMP_DELETE",
        code="TEMP-01",
        title_vi="Nghề tạm thử nghiệm"
    )
    repo.create_occupation(occ)

    # Thêm kỹ năng
    skill = SkillRequirementModel(
        id="SKL_TEMP_01",
        occupation_id="OCC_TEMP_DELETE",
        skill_name="Kỹ năng thử nghiệm"
    )
    repo.add_skill_requirement(skill)

    # Kiểm tra tồn tại
    assert len(repo.get_skills_by_occupation("OCC_TEMP_DELETE")) == 1

    # Xóa occupation
    with get_db_connection(temp_db) as conn:
        conn.execute("DELETE FROM occupations WHERE id = 'OCC_TEMP_DELETE'")
        conn.commit()

    # Kỹ năng phải tự động bị xóa theo CASCADE
    assert len(repo.get_skills_by_occupation("OCC_TEMP_DELETE")) == 0


# ============================================================================
# 7. PYDANTIC VALIDATION CONSTRAINTS
# ============================================================================

def test_pydantic_validation_constraints():
    """Kiểm tra các ràng buộc nghiệp vụ trong Pydantic models."""
    # Confidence phải trong khoảng 0.0 - 1.0
    with pytest.raises(ValidationError):
        DataSourceModel(
            name="Nguồn lỗi",
            confidence=1.5  # Lỗi: > 1.0
        )

    # Year tuyển sinh phải trong khoảng 2018 - 2030
    with pytest.raises(ValidationError):
        HistoricalCutoffModel(
            university_id="U1",
            major_id="M1",
            method_id="PT100",
            combination_id="A00",
            year=2035,  # Lỗi: > 2030
            cutoff_score=25.0
        )

    # AI exposure score phải trong khoảng 0.0 - 1.0
    with pytest.raises(ValidationError):
        OccupationModel(
            code="TEST",
            title_vi="Nghề test",
            ai_exposure_score=-0.2  # Lỗi: < 0.0
        )
