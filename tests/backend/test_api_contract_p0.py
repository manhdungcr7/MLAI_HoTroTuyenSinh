"""Kiểm thử xác minh sửa lỗi P0 Schema & Type Mismatch Backend FastAPI.
Worker 05: Sửa lỗi P0 Schema & Type Mismatch
- ProgramRecommendation & RecommendResponse schema (admit_prob, util_breakdown, forecast_p*, optional explanation_vi)
- DELETE /api/scores/mock-tests/{test_id} hỗ trợ string ID từ frontend
- POST /api/recommend trả về response_model chuẩn không bị lỗi ValidationError
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.main import app, load_data
from backend.app.schemas import (
    ProgramRecommendation,
    RecommendResponse,
    WishlistItem,
    ProgramFactorBreakdown,
)

client = TestClient(app)


def test_program_recommendation_schema_dual_compatibility():
    """Kiểm tra ProgramRecommendation chấp nhận cả format mới (optimize.py)
    và format cũ (WishlistItem legacy)."""
    # 1. New runtime format from optimize.py
    runtime_payload = {
        "rank": 1,
        "school_code": "BKA",
        "major_label": "Khoa học Máy tính",
        "combinations_seen": "A00, A01",
        "role": "mao_hiem",
        "admit_prob": 0.42,
        "forecast_p10": 26.5,
        "forecast_p50": 27.5,
        "forecast_p90": 28.5,
        "data_quality": "day_du",
        "utility": 0.88,
        "util_breakdown": {
            "fit": 0.95,
            "cost": 0.80,
            "location": 0.70,
            "career": 0.90,
            "capability": 0.85,
        },
        "util_meta": {"tuition_estimated": False},
        # explanation_vi is absent
    }
    rec = ProgramRecommendation.model_validate(runtime_payload)
    assert rec.rank == 1
    assert rec.admit_prob == 0.42
    assert rec.admit_probability == 0.42  # Synced
    assert rec.util_breakdown.fit == 0.95
    assert rec.utility_breakdown.fit == 0.95  # Synced
    assert rec.forecast_p50 == 27.5
    assert rec.predicted_cutoff_p50 == 27.5  # Synced
    assert rec.combination == "A00, A01"  # Synced from combinations_seen
    assert rec.explanation_vi is None  # Optional field defaults to None

    # 2. Legacy format
    legacy_payload = {
        "rank": 2,
        "school_code": "NEU",
        "school_name": "Đại học Kinh tế Quốc dân",
        "major_label": "Kinh tế quốc tế",
        "combination": "D01",
        "role": "vua_tam",
        "admit_probability": 0.65,
        "predicted_cutoff_p10": 25.0,
        "predicted_cutoff_p50": 26.0,
        "predicted_cutoff_p90": 27.0,
        "data_quality": "day_du",
        "utility_breakdown": {
            "fit": 0.85,
            "cost": 0.75,
            "location": 0.90,
            "career": 0.80,
            "capability": 0.80,
        },
        "explanation_vi": "Phù hợp năng lực môn Anh",
    }
    legacy_rec = ProgramRecommendation.model_validate(legacy_payload)
    assert legacy_rec.admit_prob == 0.65  # Synced from admit_probability
    assert legacy_rec.admit_probability == 0.65
    assert legacy_rec.forecast_p50 == 26.0  # Synced from predicted_cutoff_p50
    assert legacy_rec.util_breakdown.fit == 0.85  # Synced from utility_breakdown
    assert legacy_rec.combinations_seen == "D01"
    assert legacy_rec.explanation_vi == "Phù hợp năng lực môn Anh"

    # 3. WishlistItem alias check
    assert WishlistItem is ProgramRecommendation


def test_delete_mock_test_string_id():
    """Kiểm tra DELETE /api/scores/mock-tests/{test_id} chấp nhận kiểu str (UUID hoặc timestamp string)."""
    # Xóa với chuỗi UUID
    uuid_str = "mock-uuid-test-2026-worker05"
    res = client.delete(f"/api/scores/mock-tests/{uuid_str}")
    assert res.status_code == 200
    assert res.json() == {"status": "success", "id": uuid_str}

    # Xóa với ID số dạng chuỗi
    num_str = "99999"
    res_num = client.delete(f"/api/scores/mock-tests/{num_str}")
    assert res_num.status_code == 200
    assert res_num.json() == {"status": "success", "id": num_str}


def test_recommend_endpoint_full_contract():
    """Kiểm tra POST /api/recommend trả về dữ liệu đúng schema RecommendResponse."""
    load_data()
    payload = {
        "exam_scores": {"toan": 8.0, "ly": 7.5, "hoa": 6.8, "van": 6.5, "anh": 7.0},
        "alt_scores": {},
        "priority": {"area": "KV2", "object": "none"},
        "family": {
            "home_province": "Hà Nội",
            "annual_budget_vnd": 35_000_000,
            "policy_status": "none",
            "relocation_willingness": "trong_vung",
            "must_stay_near_home": False,
        },
        "preferences": {
            "ranked_majors": [
                {"major_group": "cntt", "weight": 1.0},
                {"major_group": "ky_thuat", "weight": 0.7},
            ],
            "career_importance": 0.5,
            "school_prestige_sensitivity": 0.5,
            "dream_school_codes": [],
            "excluded_school_codes": [],
            "excluded_major_groups": [],
        },
        "risk": {"risk_tolerance": 0.05, "ambition_level": 0.5, "weights": None},
        "max_wishes": 5,
    }

    res = client.post("/api/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Xác thực schema bằng RecommendResponse
    validated = RecommendResponse.model_validate(data)
    assert len(validated.wishlist) == data["n_selected"]
    assert 0.0 <= validated.p_fail_all <= 1.0

    # Kiểm tra các trường quan trọng trong item đầu tiên
    first = validated.wishlist[0]
    assert hasattr(first, "admit_prob")
    assert hasattr(first, "admit_probability")
    assert first.admit_prob == first.admit_probability
    assert hasattr(first, "forecast_p50")
    assert hasattr(first, "util_breakdown")
    assert hasattr(first, "utility_breakdown")
