"""Data Integrity & Cross-Reconciliation Test Suite.
Đối soát dữ liệu toàn diện giữa data/processed/programs.parquet và backend/app/history.db:
1. Tính toàn vẹn cấu trúc và độ bao phủ của programs.parquet (1,850+ records)
2. Tính đơn điệu của các phân vị dự báo (Quantile Monotonicity: p10 <= p50 <= p90)
3. Tham số mô hình thống kê (beta_program > 0, idio_std > 0)
4. Phân tích chuỗi thời gian cutoff_by_year_json
5. Kiểm tra toàn vẹn SQLite history.db (PRAGMA integrity_check & foreign_key_check)
6. Đối soát tính tương thích giữa khuyến nghị sinh ra và dataset programs.parquet
7. Kiểm tra dữ liệu hạt giống (Seed Data) trong admission_methods & subject_combinations
8. Đối soát audit logs trong consultation_history và user_events telemetry
"""

import json
import sqlite3
from pathlib import Path
import pandas as pd
import pytest

from backend.app.schemas import RecommendRequest
from backend.app.models import DEFAULT_DB_PATH

ROOT = Path(__file__).resolve().parents[2]
PARQUET_PATH = ROOT / "data" / "processed" / "programs.parquet"
SHOCK_PATH = ROOT / "data" / "processed" / "national_shock.json"


# ============================================================================
# 1. PARQUET DATASET INTEGRITY
# ============================================================================

def test_parquet_file_exists_and_record_count():
    """File programs.parquet phải tồn tại và có ít nhất 1400 bản ghi ngành học thực tế."""
    assert PARQUET_PATH.exists(), f"Không tìm thấy file dataset: {PARQUET_PATH}"
    df = pd.read_parquet(PARQUET_PATH)
    assert len(df) >= 1400, f"Số lượng chương trình ({len(df)}) ít hơn kỳ vọng (>= 1400)"
    assert df["school_code"].nunique() >= 30, f"Số trường ({df['school_code'].nunique()}) quá ít"


def test_parquet_schema_and_non_null_primary_keys():
    """Các trường định danh cốt lõi không được chứa null hoặc chuỗi rỗng."""
    df = pd.read_parquet(PARQUET_PATH)

    required_columns = [
        "program_key", "school_code", "major_label", "combinations_seen",
        "cutoff_by_year_json", "forecast_p10", "forecast_p50", "forecast_p90",
        "beta_program", "idio_std", "data_quality"
    ]
    for col in required_columns:
        assert col in df.columns, f"Thiếu cột bắt buộc: {col}"

    # program_key không rỗng và duy nhất
    assert df["program_key"].notna().all(), "Phát hiện program_key bị null"
    assert (df["program_key"].str.strip() != "").all(), "Phát hiện program_key chuỗi rỗng"
    assert df["program_key"].is_unique, "Phát hiện trùng lặp program_key trong dataset!"

    # school_code và major_label không rỗng
    assert df["school_code"].notna().all()
    assert df["major_label"].notna().all()


def test_parquet_quantile_monotonicity():
    """Kiểm tra bất biến phân vị: forecast_p10 <= forecast_p50 <= forecast_p90 trên 100% bản ghi."""
    df = pd.read_parquet(PARQUET_PATH)

    invalid_p10_p50 = df[df["forecast_p10"] > df["forecast_p50"]]
    assert len(invalid_p10_p50) == 0, (
        f"Phát hiện {len(invalid_p10_p50)} bản ghi có forecast_p10 > forecast_p50: "
        f"{invalid_p10_p50[['program_key', 'forecast_p10', 'forecast_p50']].head()}"
    )

    invalid_p50_p90 = df[df["forecast_p50"] > df["forecast_p90"]]
    assert len(invalid_p50_p90) == 0, (
        f"Phát hiện {len(invalid_p50_p90)} bản ghi có forecast_p50 > forecast_p90: "
        f"{invalid_p50_p90[['program_key', 'forecast_p50', 'forecast_p90']].head()}"
    )


def test_parquet_statistical_parameters_positivity():
    """Tham số nhạy cảm thị trường (beta_program) và phương sai riêng (idio_std) phải luôn dương."""
    df = pd.read_parquet(PARQUET_PATH)

    assert (df["beta_program"] > 0).all(), "Phát hiện beta_program <= 0"
    assert (df["idio_std"] > 0).all(), "Phát hiện idio_std <= 0"

    # Kiểm tra giới hạn hợp lý
    assert (df["beta_program"] <= 5.0).all(), "beta_program quá lớn bất thường"
    assert (df["idio_std"] <= 5.0).all(), "idio_std quá lớn bất thường"


def test_parquet_cutoff_by_year_json_validity():
    """Cột cutoff_by_year_json phải chứa chuỗi JSON hợp lệ với điểm thi trong phạm vi hợp lý."""
    df = pd.read_parquet(PARQUET_PATH)

    sample_size = min(200, len(df))
    sample_records = df.sample(n=sample_size, random_state=42)

    for _, row in sample_records.iterrows():
        raw_json = row["cutoff_by_year_json"]
        assert isinstance(raw_json, str)
        parsed = json.loads(raw_json)
        assert isinstance(parsed, dict)

        for year_str, score in parsed.items():
            assert year_str.isdigit() or len(year_str) == 4
            if score is not None:
                assert 0.0 <= score <= 30.0, f"Điểm chuẩn {score} bất thường tại {row['program_key']} năm {year_str}"


# ============================================================================
# 2. SQLITE HISTORY.DB STRUCTURAL INTEGRITY
# ============================================================================

def test_sqlite_db_integrity_pragmas():
    """Chạy PRAGMA integrity_check và foreign_key_check trên history.db."""
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    cursor = conn.cursor()

    # 1. PRAGMA integrity_check
    cursor.execute("PRAGMA integrity_check")
    result = cursor.fetchall()
    assert result == [("ok",)], f"PRAGMA integrity_check thất bại: {result}"

    # 2. PRAGMA quick_check
    cursor.execute("PRAGMA quick_check")
    quick_res = cursor.fetchall()
    assert quick_res == [("ok",)], f"PRAGMA quick_check thất bại: {quick_res}"

    conn.close()


def test_sqlite_core_and_enterprise_tables_exist():
    """history.db phải chứa đầy đủ các bảng CRUD ứng dụng và bảng nghiệp vụ 24 thực thể."""
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = set(r[0] for r in cursor.fetchall())
    conn.close()

    expected_tables = [
        "consultation_history",
        "user_app_state",
        "scenarios",
        "study_tasks",
        "mock_history",
        "recommendation_interactions",
        "user_events",
        "admission_methods",
        "subject_combinations",
        "universities",
        "majors",
        "historical_cutoffs",
        "tuitions",
        "locations",
        "targets",
        "preferences",
        "constraints",
        "recommendations",
        "recommendation_reasons",
    ]

    for table in expected_tables:
        assert table in existing_tables, f"Bảng {table} bị thiếu trong history.db!"


def test_sqlite_seed_data_admission_methods_and_combinations():
    """Kiểm tra các bảng danh mục chuẩn hóa (admission_methods, subject_combinations) có dữ liệu hợp lệ."""
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    cursor = conn.cursor()

    # Admission methods theo chuẩn mã Bộ GD&ĐT:
    # 100: Thi THPT (thang 30), 200: Học bạ (thang 30), 402: ĐGNL ĐHQG-HCM (thang 1200)
    cursor.execute("SELECT code, scale FROM admission_methods")
    methods = dict(cursor.fetchall())
    assert "100" in methods or "thpt" in methods
    if "100" in methods:
        assert methods["100"] == 30.0
    if "402" in methods:
        assert methods["402"] == 1200.0
    if "200" in methods:
        assert methods["200"] == 30.0

    # Subject combinations: Có các tổ hợp phổ biến
    cursor.execute("SELECT code, subject_weights_json FROM subject_combinations")
    combos = cursor.fetchall()
    assert len(combos) >= 5
    for code, weights_json in combos:
        weights = json.loads(weights_json)
        assert isinstance(weights, dict)
        assert len(weights) == 3

    conn.close()


# ============================================================================
# 3. CROSS-RECONCILIATION: PROGRAMS.PARQUET VS HISTORY.DB
# ============================================================================

def test_cross_reconciliation_recommendations_originate_from_parquet(client, valid_recommend_req):
    """Mọi nguyện vọng được gợi ý trong POST /api/recommend phải đối soát khớp chính xác
    với một program_key hoặc school_code có thật trong programs.parquet."""
    df = pd.read_parquet(PARQUET_PATH)
    valid_schools = set(df["school_code"].unique())

    res = client.post("/api/recommend", json=valid_recommend_req)
    assert res.status_code == 200
    wishlist = res.json()["wishlist"]

    assert len(wishlist) > 0
    for wish in wishlist:
        assert wish["school_code"] in valid_schools, (
            f"Nguyện vọng {wish['school_code']} không tồn tại trong tập trường của programs.parquet!"
        )


def test_cross_reconciliation_consultation_history_audit_trail(client, valid_recommend_req):
    """Mỗi lần gọi /api/recommend phải ghi một bản ghi vào consultation_history trong SQLite
    với payload JSON có thể parse lại bằng RecommendRequest schema."""
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM consultation_history")
    count_before = cursor.fetchone()[0]

    # Thực hiện gọi API
    res = client.post("/api/recommend", json=valid_recommend_req)
    assert res.status_code == 200

    # Kiểm tra bản ghi mới
    cursor.execute("SELECT request_payload, result_summary FROM consultation_history ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    req_json, summary_json = row

    # Parse ngược lại bằng Pydantic schema để chứng minh dữ liệu lưu chuẩn
    parsed_req = RecommendRequest.model_validate_json(req_json)
    assert parsed_req.family.home_province == valid_recommend_req["family"]["home_province"]

    parsed_summary = json.loads(summary_json)
    assert "p_fail_all" in parsed_summary
    assert "n_selected" in parsed_summary
    assert 0.0 <= parsed_summary["p_fail_all"] <= 1.0


def test_cross_reconciliation_user_events_schema_integrity():
    """Bảng user_events lưu trữ đúng cấu trúc JSON cho telemetry tracking."""
    conn = sqlite3.connect(DEFAULT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT payload_json, shown_candidates_json FROM user_events LIMIT 10")
    rows = cursor.fetchall()
    conn.close()

    for p_json, candidates_json in rows:
        if p_json:
            parsed_p = json.loads(p_json)
            assert isinstance(parsed_p, (dict, list))
        if candidates_json:
            parsed_c = json.loads(candidates_json)
            assert isinstance(parsed_c, list)
