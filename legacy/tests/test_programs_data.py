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
        "data_quality"
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


def test_parquet_forecast_is_latest_real_score_and_band_is_valid():
    """Dự báo p50 đúng bằng điểm chuẩn thật gần nhất; biên p10 <= p50 <= p90 và nằm trong thang điểm."""
    df = pd.read_parquet(PARQUET_PATH)
    assert ((df["forecast_p50"] - df["latest_score"]).abs() < 1e-9).all(), "forecast_p50 phải bằng điểm năm gần nhất"
    assert (df["forecast_p10"] <= df["forecast_p50"]).all() and (df["forecast_p50"] <= df["forecast_p90"]).all()
    assert df["forecast_p10"].min() >= 0 and df["forecast_p90"].max() <= 30
    assert (df["years_extrapolated"] >= 1).all()


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
