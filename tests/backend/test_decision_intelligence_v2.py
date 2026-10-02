"""UNIT TEST SUITE: DECISION INTELLIGENCE ENGINE V2 & TYPED DECISION RESULT V2

Kiểm tra:
1. Pydantic schema validation và tính toàn vẹn của DecisionResultV2.
2. Hàm build_decision_result_v2 và giải thuật phân loại 3 tầng rủi ro.
3. Endpoint POST /api/decision-v2 trên FastAPI backend.
4. Trích xuất số trang Đề án tuyển sinh gốc (parse_data_passport_reference).
5. Phát hiện thiếu dữ liệu (missing_data) và tính toán độ tin cậy động (data_confidence).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from common.decision_result import (
    build_decision_result_v2,
    parse_data_passport_reference,
    DecisionResultV2,
)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_payload():
    return {
        "exam_scores": {
            "toan": 8.8,
            "ly": 8.4,
            "hoa": 8.2,
            "anh": 7.5,
            "van": 7.0,
            "sinh": None,
            "su": None,
            "dia": None,
            "gdcd": None,
        },
        "alt_scores": {
            "ielts": 7.0,
            "hoc_ba_gpa": 8.5,
        },
        "priority": {
            "area": "KV3",
            "object": "none",
        },
        "family": {
            "home_province": "Hà Nội",
            "annual_budget_vnd": 45000000,
            "policy_status": "none",
            "relocation_willingness": "trong_vung",
            "must_stay_near_home": False,
        },
        "preferences": {
            "ranked_majors": [
                {"major_group": "cntt", "weight": 1.0},
                {"major_group": "ky_thuat", "weight": 0.8},
            ],
            "career_importance": 0.8,
            "school_prestige_sensitivity": 0.7,
            "dream_school_codes": ["BKA", "QHI"],
            "excluded_school_codes": [],
            "excluded_major_groups": [],
        },
        "risk": {
            "risk_tolerance": 0.05,
            "ambition_level": 0.5,
        },
        "max_wishes": 15,
    }


def test_parse_data_passport_reference():
    doc, page = parse_data_passport_reference("Đề án Tuyển sinh ĐH Công Nghệ 2024 (Trang 18, Bảng 3)")
    assert page == 18
    assert "ĐH Công Nghệ" in doc

    doc2, page2 = parse_data_passport_reference("Thông báo Điểm chuẩn & Đề án Bách Khoa 2024 (Trang 12)")
    assert page2 == 12

    doc3, page3 = parse_data_passport_reference(None)
    assert page3 == "Phụ lục Đề án"


def test_build_decision_result_v2_unit():
    raw_portfolio = [
        {
            "school_code": "BKA",
            "school_name": "Đại học Bách Khoa Hà Nội",
            "major_label": "Khoa học Máy tính (IT1)",
            "major_group": "cntt",
            "combinations_seen": "A00",
            "role": "mao_hiem",
            "admit_prob": 0.25,
            "utility": 0.92,
            "util_breakdown": {"fit": 1.0, "cost": 0.85, "location": 1.0, "career": 0.98, "capability": 0.25},
            "forecast_p50": 28.60,
            "tuition_vnd": 32000000,
            "employment_rate": 98.9,
            "data_passport_url": "Thông báo Điểm chuẩn & Đề án Bách Khoa 2024 (Trang 12)",
        },
        {
            "school_code": "QHI",
            "school_name": "ĐH Công nghệ - ĐHQGHN",
            "major_label": "Hệ thống thông tin (CN2)",
            "major_group": "cntt",
            "combinations_seen": "A00",
            "role": "vua_tam",
            "admit_prob": 0.65,
            "utility": 0.88,
            "util_breakdown": {"fit": 0.95, "cost": 0.85, "location": 1.0, "career": 0.96, "capability": 0.65},
            "forecast_p50": 26.65,
            "tuition_vnd": 35000000,
            "employment_rate": 96.5,
            "data_passport_url": "Đề án Tuyển sinh ĐH Công Nghệ 2024 (Trang 19, Bảng 3)",
        },
        {
            "school_code": "PTIT",
            "school_name": "Học viện CNBCVT",
            "major_label": "Kỹ thuật Điện tử",
            "major_group": "ky_thuat",
            "combinations_seen": "A00",
            "role": "an_toan",
            "admit_prob": 0.92,
            "utility": 0.82,
            "util_breakdown": {"fit": 0.80, "cost": 0.90, "location": 1.0, "career": 0.94, "capability": 0.92},
            "forecast_p50": 23.50,
            "tuition_vnd": 26000000,
            "employment_rate": 94.0,
            "data_passport_url": "Đề án Tuyển sinh Học viện CNBCVT 2024 (Trang 25)",
        },
    ]

    exam_scores = {"toan": 8.8, "ly": 8.4, "hoa": 8.2}
    result = build_decision_result_v2(
        profile_id="test_profile_01",
        raw_portfolio=raw_portfolio,
        p_fail_all=0.015,
        exam_scores=exam_scores,
        goal={"school_code": "BKA", "major": "IT1"},
        available_weekly_hours=20.0,
        annual_budget_vnd=45000000,
    )

    assert isinstance(result, DecisionResultV2)
    assert result.profile_id == "test_profile_01"
    assert result.data_version == "2026.03-moet-verified"
    assert len(result.recommendations.all) == 3
    assert len(result.recommendations.reach) == 1
    assert len(result.recommendations.target) == 1
    assert len(result.recommendations.safety) == 1

    # Kiểm tra risks
    assert result.risks.p_fail_all == 0.015
    assert result.risks.p_fail_all_pct == 1.5
    assert result.risks.risk_level == "an_toan"

    # Kiểm tra next actions
    assert len(result.next_actions) == 3
    assert result.next_actions[0].priority_tier == 1
    assert result.next_actions[0].recommended_weekly_hours > result.next_actions[1].recommended_weekly_hours

    # Kiểm tra ground truth proposal pages
    assert len(result.explanation.proposal_pages) == 3
    bka_page = next(p for p in result.explanation.proposal_pages if p.school_code == "BKA")
    assert bka_page.page == 12


def test_decision_v2_api_endpoint(client: TestClient, sample_payload: dict):
    response = client.post("/api/decision-v2", json=sample_payload)
    assert response.status_code == 200, response.text
    data = response.json()

    # Kiểm tra các trường cốt lõi của DecisionResult v2
    assert "profile_id" in data
    assert "generated_at" in data
    assert "data_version" in data
    assert data["data_version"] == "2026.03-moet-verified"

    # Kiểm tra recommendations
    recs = data["recommendations"]
    assert "reach" in recs
    assert "target" in recs
    assert "safety" in recs
    assert "all" in recs
    assert len(recs["all"]) > 0

    first_item = recs["all"][0]
    assert "rank" in first_item
    assert "p_admit" in first_item
    assert "utility" in first_item
    assert "utility_breakdown" in first_item
    assert "reason" in first_item

    # Kiểm tra risks
    risks = data["risks"]
    assert "p_fail_all" in risks
    assert "p_fail_all_pct" in risks
    assert "risk_level" in risks
    assert risks["p_fail_all"] >= 0.0 and risks["p_fail_all"] <= 1.0

    # Kiểm tra data confidence & missing data
    assert "data_confidence" in data
    assert "score_pct" in data["data_confidence"]
    assert "missing_data" in data

    # Kiểm tra explanation & proposal pages
    expl = data["explanation"]
    assert "summary_vi" in expl
    assert "rationale_vi" in expl
    assert "proposal_pages" in expl
    assert "ground_truth_sources" in expl

    # Kiểm tra next actions
    assert "next_actions" in data
    assert len(data["next_actions"]) >= 3
    assert data["next_actions"][0]["priority_tier"] == 1
