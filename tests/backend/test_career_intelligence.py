"""Unit tests for Career Intelligence Domain Layer (CareerAI Transfer)."""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.career_schemas import (
    CareerIntelligenceCatalog,
    CareerPathway,
    OccupationMetric,
    SkillRequirement,
    AlternativePathway,
)
from backend.app.main import app

client = TestClient(app)

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "career_pathways.json"
if not DATA_PATH.exists():
    DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "manual" / "career_intelligence.json"


def test_career_dataset_exists_and_parses():
    assert DATA_PATH.exists(), f"Career dataset file not found at {DATA_PATH}"
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    catalog = CareerIntelligenceCatalog.model_validate(data)
    assert catalog.total_major_groups == 12
    assert len(catalog.pathways) == 12


def test_major_groups_integrity_and_bounds():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    catalog = CareerIntelligenceCatalog.model_validate(data)
    expected_groups = {
        "cntt", "ky_thuat", "kinh_te", "luat", "ngon_ngu", "y_duoc",
        "su_pham", "xa_hoi", "du_lich", "nong_lam", "kien_truc", "the_thao"
    }
    actual_groups = {p.major_group_code for p in catalog.pathways}
    assert actual_groups == expected_groups, f"Missing groups: {expected_groups - actual_groups}"

    for pathway in catalog.pathways:
        assert 0.0 <= pathway.career_optionality_index <= 1.0
        assert len(pathway.top_occupations) >= 1
        assert len(pathway.provenance_sources) >= 1

        # Check occupations
        for occ in pathway.top_occupations:
            assert occ.starting_salary_p25_mvnd <= occ.starting_salary_median_mvnd <= occ.starting_salary_p75_mvnd
            assert 0.0 <= occ.ai_exposure_index <= 1.0
            assert occ.demand_index >= 0.0
            assert len(occ.top_hiring_regions) >= 1
            assert len(occ.skills) >= 2

            for skill in occ.skills:
                assert 0.0 <= skill.importance_weight <= 1.0
                assert skill.category in ["technical", "soft", "domain", "language", "tool"]

        # Check alternative pathways
        for alt in pathway.alternative_pathways:
            assert 0.0 <= alt.skill_overlap_pct <= 100.0
            assert alt.transition_difficulty in ["de", "trung_binh", "kho"]
            assert len(alt.bridge_skills) >= 1


def test_api_list_careers():
    response = client.get("/api/careers")
    assert response.status_code == 200
    data = response.json()
    assert "pathways" in data
    assert len(data["pathways"]) == 12


def test_api_get_career_pathway_cntt():
    response = client.get("/api/careers/cntt")
    assert response.status_code == 200
    pathway = response.json()
    assert pathway["major_group_code"] == "cntt"
    assert "top_occupations" in pathway
    occ_codes = [o["occupation_code"] for o in pathway["top_occupations"]]
    assert "SW_ENG" in occ_codes
    assert "AI_DATA_ENG" in occ_codes


def test_api_get_occupation_detail():
    response = client.get("/api/careers/occupation/SW_ENG")
    assert response.status_code == 200
    data = response.json()
    assert data["major_group_code"] == "cntt"
    assert data["occupation"]["occupation_code"] == "SW_ENG"
    assert data["occupation"]["starting_salary_median_mvnd"] >= 15.0
    assert len(data["occupation"]["skills"]) >= 3


def test_api_career_not_found():
    response = client.get("/api/careers/non_existent_group")
    assert response.status_code == 404
    assert "Không tìm thấy" in response.json()["detail"]

    response_occ = client.get("/api/careers/occupation/NON_EXISTENT_OCC")
    assert response_occ.status_code == 404
    assert "Không tìm thấy" in response_occ.json()["detail"]
