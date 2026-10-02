"""Tests for Major Code, School, and Score normalizers."""

from __future__ import annotations

import json
import pytest

from pipeline.ingestion.core.models import ExtractedRecord
from pipeline.ingestion.normalizers.composite import ProgramNormalizer
from pipeline.ingestion.normalizers.major_code import MajorCodeNormalizer
from pipeline.ingestion.normalizers.school import SchoolNormalizer
from pipeline.ingestion.normalizers.score import ScoreNormalizer


def test_major_code_normalizer_7_digits():
    # 1. Exact MoET 7-digit code mappings
    assert MajorCodeNormalizer.infer_major_group("7480201", "CNTT")[0] == "cntt"
    assert MajorCodeNormalizer.infer_major_group("7340101", "Quản trị")[0] == "kinh_te"
    assert MajorCodeNormalizer.infer_major_group("7520114", "Cơ điện tử")[0] == "ky_thuat"
    assert MajorCodeNormalizer.infer_major_group("7720101", "Y khoa")[0] == "y_duoc"
    assert MajorCodeNormalizer.infer_major_group("7140201", "Mầm non")[0] == "su_pham"
    assert MajorCodeNormalizer.infer_major_group("7380101", "Luật")[0] == "luat"
    assert MajorCodeNormalizer.infer_major_group("7220201", "Tiếng Anh")[0] == "ngon_ngu"
    assert MajorCodeNormalizer.infer_major_group("7810301", "TDTT")[0] == "the_thao"

    # 2. Extract code from noisy string
    code = MajorCodeNormalizer.extract_and_validate_code("Mã: 7480201_CLC")
    assert code == "7480201"

    # 3. Clean major name
    clean_name = MajorCodeNormalizer.clean_major_name("- Khoa học Máy tính (IT1) - CTTT")
    assert clean_name == "Khoa học Máy tính"


def test_school_normalizer_canonical_mapping():
    # Test aliases and codes
    hust = SchoolNormalizer.resolve_school("HUST")
    assert hust.code == "BKA"
    assert hust.province == "Hà Nội"
    assert hust.region == "bac"
    assert hust.tier == 1

    uet = SchoolNormalizer.resolve_school("UET")
    assert uet.code == "QHI"
    assert uet.province == "Hà Nội"

    neu = SchoolNormalizer.resolve_school("NEU")
    assert neu.code == "KHA"

    bk_hcm = SchoolNormalizer.resolve_school("BK TPHCM")
    assert bk_hcm.code == "QSG"
    assert bk_hcm.province == "TP.HCM"
    assert bk_hcm.region == "nam"


def test_score_and_combo_normalizer():
    # 1. Standard 30 scale
    score, orig, scale = ScoreNormalizer.normalize_score(28.5)
    assert score == 28.5
    assert scale == 30.0

    # 2. 40-point scale conversion (e.g. 36.0 / 40 -> 27.0 / 30)
    score_40, orig_40, scale_40 = ScoreNormalizer.normalize_score(36.0, scale_hint=40.0)
    assert score_40 == 27.0
    assert scale_40 == 40.0

    # 3. 100-point scale conversion (e.g. 84.0 / 100 -> 25.2 / 30)
    score_100, _, scale_100 = ScoreNormalizer.normalize_score(84.0)
    assert score_100 == 25.2
    assert scale_100 == 100.0

    # 4. Combinations
    combos = ScoreNormalizer.parse_combinations("A00, A01, D01")
    assert combos == ["A00", "A01", "D01"]

    triplet_combo = ScoreNormalizer.parse_combinations("Toán, Lý, Hóa")
    assert triplet_combo == ["A00"]


def test_composite_program_normalizer():
    raw_rec = ExtractedRecord(
        raw_id="ext_123",
        source_id="university_portal",
        doc_id="doc_hust_01",
        school_raw="HUST",
        major_raw="Khoa học máy tính (IT1)",
        major_code_raw="7480101",
        score_raw=28.53,
        year_raw=2024,
        combinations_raw="A00; A01",
        quota_raw="300",
        tuition_raw="30.0",
        employment_raw="98%",
        provenance_hash="abcdef1234567890",
    )

    normalizer = ProgramNormalizer()
    norm_rec = normalizer.normalize(raw_rec)

    assert norm_rec is not None
    assert norm_rec.school_code == "BKA"
    assert norm_rec.school_province == "Hà Nội"
    assert norm_rec.major_code == "7480101"
    assert norm_rec.major_name == "Khoa học máy tính"
    assert norm_rec.major_group == "cntt"
    assert norm_rec.cutoff_score == 28.53
    assert norm_rec.admission_year == 2024
    assert norm_rec.combinations == ["A00", "A01"]
    assert norm_rec.tuition_min_mvnd == 30.0
    assert norm_rec.employment_rate_pct == 0.98
    assert norm_rec.data_quality == "day_du"
    assert norm_rec.content_hash == "abcdef1234567890"

    # Data passport verification
    assert norm_rec.data_passport_json is not None
    passport = json.loads(norm_rec.data_passport_json)
    assert passport["publisher"] == "Đại học Bách Khoa Hà Nội"
    assert passport["normalized_value"] == 28.53
    assert passport["content_hash"] == "abcdef1234567890"
