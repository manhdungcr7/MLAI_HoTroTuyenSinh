"""Tests for Schema and Domain Integrity validators."""

from __future__ import annotations

import pytest

from pipeline.ingestion.core.models import NormalizedProgramRecord
from pipeline.ingestion.validators.integrity import IntegrityValidator
from pipeline.ingestion.validators.schema import SchemaValidator


def create_sample_record(**overrides) -> NormalizedProgramRecord:
    data = {
        "program_key": "BKA::khoa hoc may tinh",
        "school_code": "BKA",
        "school_name": "Đại học Bách Khoa Hà Nội",
        "school_province": "Hà Nội",
        "school_region": "bac",
        "school_tier": 1,
        "major_code": "7480101",
        "major_name": "Khoa học máy tính",
        "major_group": "cntt",
        "admission_year": 2024,
        "cutoff_score": 28.53,
        "score_scale": 30.0,
        "combinations": ["A00", "A01"],
        "admission_method": "THPT",
        "quota": 300,
        "tuition_min_mvnd": 30.0,
        "tuition_max_mvnd": 30.0,
        "employment_rate_pct": 0.98,
        "data_quality": "day_du",
        "is_estimated": False,
        "source_id": "university_portal",
        "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    }
    data.update(overrides)
    return NormalizedProgramRecord(**data)


def test_schema_validator_rules():
    validator = SchemaValidator()

    # 1. Valid record passes
    rec = create_sample_record()
    res = validator.validate(rec)
    assert res.is_valid is True
    assert len(res.errors) == 0

    # 2. Invalid major group fails
    rec_bad_group = create_sample_record(major_group="invalid_group_xyz")
    res_bad = validator.validate(rec_bad_group)
    assert res_bad.is_valid is False
    assert any("Invalid major_group" in e for e in res_bad.errors)

    # 3. Short school code fails
    rec_bad_school = create_sample_record(school_code="X")
    assert validator.validate(rec_bad_school).is_valid is False

    # 4. Short content hash fails
    rec_bad_hash = create_sample_record(content_hash="short_hash")
    assert validator.validate(rec_bad_hash).is_valid is False


def test_integrity_validator_domain_bounds():
    validator = IntegrityValidator()

    # 1. Score < 10.0 rejected (likely table index artifact)
    rec_low_score = create_sample_record(cutoff_score=4.5)
    res_low = validator.validate(rec_low_score)
    assert res_low.is_valid is False
    assert any("below minimum plausible threshold" in e for e in res_low.errors)

    # 2. Score > 30.0 rejected (unnormalized)
    rec_high_score = create_sample_record(cutoff_score=35.0)
    res_high = validator.validate(rec_high_score)
    assert res_high.is_valid is False
    assert any("exceeds maximum 30-point scale" in e for e in res_high.errors)

    # 3. Invalid year rejected
    rec_bad_year = create_sample_record(admission_year=2010)
    assert validator.validate(rec_bad_year).is_valid is False

    # 4. Employment rate > 1.0 rejected
    rec_bad_emp = create_sample_record(employment_rate_pct=98.0)
    assert validator.validate(rec_bad_emp).is_valid is False


def test_batch_anomalies_and_deduplication():
    validator = IntegrityValidator(max_delta_shock=4.0)

    rec1 = create_sample_record(admission_year=2023, cutoff_score=22.0)
    rec2 = create_sample_record(admission_year=2024, cutoff_score=28.5)  # delta = 6.5 > 4.0
    rec3_dup = create_sample_record(admission_year=2024, cutoff_score=28.5)  # duplicate

    deduped, anomalies = validator.validate_batch_anomalies([rec1, rec2, rec3_dup])

    # Deduped should have 2 records
    assert len(deduped) == 2
    assert any("Duplicate entry dropped" in a for a in anomalies)
    assert any("Abnormal delta shock" in a for a in anomalies)
