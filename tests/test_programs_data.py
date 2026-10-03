"""Kiểm tra dữ liệu chương trình sau pipeline (data/processed/programs.parquet): cấu trúc, khóa, phân vị, tham số thống kê."""

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PARQUET_PATH = ROOT / "data" / "processed" / "programs.parquet"
SHOCK_PATH = ROOT / "data" / "processed" / "national_shock.json"


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
