"""Hợp đồng API tư vấn: tìm ngành theo xác suất, đề xuất/đánh giá danh sách nguyện vọng."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from common import admission_core as core
from backend.app.security import rate_limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def _fresh_rate_limit():
    """Bộ giới hạn tốc độ là trạng thái toàn cục: trả về trạng thái sạch trước và sau mỗi test để không ảnh hưởng test khác."""
    rate_limiter.reset()
    yield
    rate_limiter.reset()

PROFILE = {
    "examScores": {"toan": 8, "ly": 7.5, "anh": 7.25, "hoa": 7, "van": 6.5},
    "hocBaScores": {"toan": 8.8, "ly": 8.5, "anh": 8.4, "hoa": 8.6, "van": 8},
    "activeCombination": "A01",
    "homeProvince": "Nghệ An",
    "interestMajorGroups": ["cntt"],
}


def test_search_ranks_by_probability_and_applies_constraints():
    r = client.post("/api/advisor/search", json={"profile": PROFILE, "limit": 200})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    assert all(item["majorGroup"] == "cntt" for item in body["items"])
    pct = [item["probabilityPercent"] for item in body["items"]]
    banded = [min(97, v) for v in pct]  # từ 97% trở lên xếp theo điểm chuẩn
    assert banded == sorted(banded, reverse=True)
    assert sum(body["tiers"].values()) == body["total"]
    assert set(body["notComputable"]) == {"methodNotSupported", "missingInputs"}


def test_search_without_scores_returns_empty_not_error():
    r = client.post("/api/advisor/search", json={"profile": {}})
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_search_filters_and_pagination():
    base = client.post("/api/advisor/search", json={"profile": PROFILE, "limit": 5}).json()
    assert len(base["items"]) == min(5, base["total"])
    page2 = client.post("/api/advisor/search", json={"profile": PROFILE, "limit": 5, "offset": 5}).json()
    ids1 = {i["programId"] for i in base["items"]}
    ids2 = {i["programId"] for i in page2["items"]}
    assert ids1.isdisjoint(ids2)
    hb = client.post("/api/advisor/search", json={"profile": PROFILE, "filters": {"method": "HOC_BA"}, "limit": 200}).json()
    assert all(i["admissionMethod"] == "HOC_BA" for i in hb["items"])


def test_search_rejects_invalid_scores():
    r = client.post("/api/advisor/search", json={"profile": {"examScores": {"toan": 11}}})
    assert r.status_code in (400, 422)


def test_portfolio_suggestion_is_valid_and_bounded():
    r = client.post("/api/advisor/portfolio", json={"profile": PROFILE})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "suggest"
    assert 1 <= len(body["items"]) <= 15
    assert [i["rank"] for i in body["items"]] == list(range(1, len(body["items"]) + 1))
    assert 0.0 <= body["pFailAll"] <= 1.0
    assert len({i["programId"] for i in body["items"]}) == len(body["items"])


def test_portfolio_evaluates_user_ordering():
    suggested = client.post("/api/advisor/portfolio", json={"profile": PROFILE}).json()["items"]
    ids = [i["programId"] for i in suggested][:3]
    r = client.post("/api/advisor/portfolio", json={"profile": PROFILE, "programIds": ids})
    assert r.status_code == 200
    assert r.json()["mode"] == "evaluate"
    assert [i["programId"] for i in r.json()["items"]] == ids


def test_portfolio_rejects_unknown_and_duplicate_programs():
    assert client.post("/api/advisor/portfolio", json={"profile": PROFILE, "programIds": ["khong-ton-tai"]}).status_code == 422
    suggested = client.post("/api/advisor/portfolio", json={"profile": PROFILE}).json()["items"]
    pid = suggested[0]["programId"]
    assert client.post("/api/advisor/portfolio", json={"profile": PROFILE, "programIds": [pid, pid]}).status_code == 422


def test_portfolio_rejects_more_than_15():
    r = client.post("/api/advisor/portfolio", json={"profile": PROFILE, "programIds": [f"x{i}" for i in range(16)]})
    assert r.status_code in (400, 422)


def test_methods_and_program_detail():
    m = client.get("/api/advisor/methods").json()
    computed = {x["code"] for x in m["methods"] if x["probabilityComputed"]}
    assert {"THPT", "HOC_BA"} <= computed
    assert m["catalog"]["programs"] > 1000
    pid = client.post("/api/advisor/search", json={"profile": PROFILE, "limit": 1}).json()["items"][0]["programId"]
    d = client.get(f"/api/advisor/programs/{pid}")
    assert d.status_code == 200 and d.json()["cutoffs"]
    assert client.get("/api/advisor/programs/khong-ton-tai").status_code == 404


def test_meta_known_gaps_are_computed_not_stale():
    gaps = client.get("/api/meta").json()["known_gaps"]
    text = " ".join(gaps)
    assert "58/440" not in text and "0.3%" not in text


def test_search_accepts_named_major_award_and_dgnl_fields():
    profile = {**PROFILE, "interestMajorGroups": [], "interestMajorNames": ["khoa hoc may tinh"], "award": "tinh_nhat",
               "academicRank": "gioi", "conduct": "gioi", "altScores": {"ielts": 6.5, "dgnl_hcm": 950}}
    r = client.post("/api/advisor/search", json={"profile": profile, "limit": 50})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    assert all("khoa hoc may tinh" in core.fold(item["majorName"]) for item in body["items"])


def test_search_rejects_unknown_award():
    r = client.post("/api/advisor/search", json={"profile": {**PROFILE, "award": "vo_dich"}, "limit": 5})
    assert r.status_code == 422
