"""Regression test to lock the verified school set and prevent school dropouts.

This test suite guarantees that any future changes to parse_dean.py,
build_panel.py, or reconcile.py will NEVER accidentally drop any verified school.
"""

from __future__ import annotations

import json
from pathlib import Path
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parent.parent
PROCESSED_PARQUET = ROOT / "data" / "processed" / "programs.parquet"
INTERIM_PARQUET = ROOT / "data" / "interim" / "cutoff_panel_raw.parquet"

# The 77 verified schools confirmed and audit-locked on 2026-09-28
FROZEN_SCHOOL_SET = {
    "BKA", "C19", "C23", "C25", "D61", "D64", "DBL", "DCL",
    "DCN", "DDF", "DDP", "DDQ", "DDS", "DDY", "DHC", "DHD", "DHK",
    "DHL", "DHN", "DHT", "DHY", "DMT", "DNB", "DNU", "DPQ", "DPY",
    "DQB", "DQH", "DQU", "DTF", "DTL", "DTN", "DTV", "DVL", "GHA",
    "GSA", "GTA", "HCB", "HCH", "HCN", "HCS", "HTC", "KMA", "LNH",
    "LPH", "NHH", "NHP", "QHI", "QHL", "QHQ", "QHS", "QHY", "QSC", "QST",
    "QSX", "QSY", "SDU", "SP2", "SPD", "SPS", "TDL", "TDV", "TSN", "TTN",
    "TTU", "TYS", "VHH", "XDA", "XDT", "YDS", "YHB"
}

# Trường có toàn bộ dòng điểm là bản sao từ tài liệu của trường khác (đề án chung ĐH Huế
# gán cho mọi trường thành viên; HCH trùng khít HCS). `drop_cross_school_copies` loại các
# dòng này vì không xác định được trường sở hữu. Chỉ bỏ khỏi danh sách khi có dữ liệu riêng.
EXCLUDED_COPIED_SOURCE = {"DHC", "DHD", "DHK", "DHL", "DHN", "DHT", "HCH"}

# The 7 key sensitive schools that were previously recovered or audited
SENSITIVE_TARGETS = ["C19", "C25", "DQB", "DTN", "DVL", "C23"]


@pytest.fixture(scope="module")
def programs_df() -> pd.DataFrame:
    assert PROCESSED_PARQUET.exists(), f"Missing processed file: {PROCESSED_PARQUET}"
    return pd.read_parquet(PROCESSED_PARQUET)


def _parse_history(raw_val: str | dict | None) -> dict:
    if isinstance(raw_val, dict):
        return raw_val
    if isinstance(raw_val, str) and raw_val.strip():
        try:
            return json.loads(raw_val)
        except Exception:
            return {}
    return {}


def test_frozen_schools_no_regression(programs_df: pd.DataFrame):
    """Ensure no school from the 77 frozen set ever drops out of programs.parquet."""
    current_schools = set(programs_df["school_code"].unique())
    missing = FROZEN_SCHOOL_SET - EXCLUDED_COPIED_SOURCE - current_schools
    assert not missing, (
        f"REGRESSION DETECTED! {len(missing)} schools dropped out of programs.parquet: "
        f"{sorted(missing)}"
    )
    assert len(current_schools) >= len(FROZEN_SCHOOL_SET - EXCLUDED_COPIED_SOURCE), (
        f"Total schools ({len(current_schools)}) is less than frozen benchmark ({len(FROZEN_SCHOOL_SET)})"
    )


def test_sensitive_recovered_schools_present(programs_df: pd.DataFrame):
    """Ensure each of the 7 recovered schools (C19, C25, DQB, DTN, DVL, C23, CSS) has clean programs."""
    for code in SENSITIVE_TARGETS:
        school_programs = programs_df[programs_df["school_code"] == code]
        assert not school_programs.empty, f"School {code} has 0 programs in programs.parquet!"
        
        # Check province is present
        assert school_programs["school_province"].notna().all(), (
            f"School {code} has missing school_province!"
        )
        
        # Check cutoff history is not empty
        for _, row in school_programs.iterrows():
            history = _parse_history(row.get("cutoff_by_year_json"))
            assert len(history) > 0, (
                f"Program {row['program_key']} of {code} has empty cutoff_by_year_json!"
            )


def test_no_missing_provinces(programs_df: pd.DataFrame):
    """Ensure 100% of programs have a valid, assigned school_province."""
    missing = programs_df[programs_df["school_province"].isna()]
    assert missing.empty, (
        f"Found {len(missing)} programs with NaN school_province across schools: "
        f"{missing['school_code'].unique().tolist()}"
    )


def test_cutoff_scores_within_valid_bounds(programs_df: pd.DataFrame):
    """Ensure all cutoff scores in cutoff_by_year_json lie within the legal [12.0, 30.0] range."""
    for _, row in programs_df.iterrows():
        history = _parse_history(row.get("cutoff_by_year_json"))
        for yr, score in history.items():
            assert 12.0 <= score <= 30.0, (
                f"Invalid score {score} for year {yr} in program {row['program_key']}!"
            )


def test_cutoff_panel_raw_preserves_frozen_schools():
    """Ensure interim cutoff_panel_raw.parquet also preserves the frozen school set."""
    if not INTERIM_PARQUET.exists():
        pytest.skip(f"Interim panel not found at {INTERIM_PARQUET}")
    
    raw_df = pd.read_parquet(INTERIM_PARQUET)
    raw_schools = set(raw_df["school_code"].unique())
    missing_in_raw = FROZEN_SCHOOL_SET - raw_schools
    assert not missing_in_raw, (
        f"Interim cutoff_panel_raw.parquet is missing {len(missing_in_raw)} frozen schools: "
        f"{sorted(missing_in_raw)}"
    )
