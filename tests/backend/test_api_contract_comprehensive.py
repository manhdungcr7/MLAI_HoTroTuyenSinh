"""Comprehensive API Contract Test Suite.
Kiểm thử hợp đồng API (Contract Tests) chặt chẽ cho toàn bộ 24 endpoints của FastAPI:
1.  GET  /api/health
2.  GET  /api/meta
3.  POST /api/recommend (Happy path + Pydantic schema validation)
4.  POST /api/recommend (Invalid payload validation -> 422)
5.  GET  /api/history
6.  GET  /api/app-state
7.  POST /api/app-state
8.  DELETE /api/app-state
9.  GET  /api/scenarios
10. POST /api/scenarios
11. PUT  /api/scenarios/{sc_id}
12. DELETE /api/scenarios/{sc_id}
13. GET  /api/study-plan/tasks
14. POST /api/study-plan/tasks
15. PUT  /api/study-plan/tasks/{t_id}
16. DELETE /api/study-plan/tasks/{t_id}
17. GET  /api/scores/mock-tests
18. POST /api/scores/mock-tests
19. DELETE /api/scores/mock-tests/{test_id}
20. GET  /api/recommendations/interactions
21. POST /api/recommendations/interactions (Happy path & 400 validation)
22. POST /api/telemetry/events
23. GET  /api/careers
24. GET  /api/careers/{major_group_code} (Valid + 404)
25. GET  /api/careers/occupation/{occupation_code} (Valid + 404)
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
import pytest
from pydantic import BaseModel, Field, ConfigDict

from backend.app.schemas import RecommendResponse


# ============================================================================
# PYDANTIC RESPONSE CONTRACT SCHEMAS
# ============================================================================

class HealthResponseContract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str
    service: Optional[str] = None
    version: Optional[str] = None
    timestamp: Optional[str] = None
    uptime_seconds: Optional[float] = None
    n_programs: int = Field(..., ge=1)
    n_schools: int = Field(..., ge=1)
    data_quality_distribution: Dict[str, int]
    tuition_coverage: float = Field(..., ge=0.0, le=1.0)
    employment_coverage: float = Field(..., ge=0.0, le=1.0)


class MetaResponseContract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: Optional[str] = None
    service: Optional[str] = None
    version: Optional[str] = None
    n_programs: int = Field(..., ge=1)
    n_schools: int = Field(..., ge=1)
    data_quality_distribution: Dict[str, int]
    tuition_coverage: float = Field(..., ge=0.0, le=1.0)
    employment_coverage: float = Field(..., ge=0.0, le=1.0)
    national_shock: Dict[str, Any]
    data_source: str
    known_gaps: List[str]


class ConsultationHistoryItemContract(BaseModel):
    id: int
    timestamp: str
    request_payload: Dict[str, Any]
    result_summary: Dict[str, Any]


class AppStateResponseContract(BaseModel):
    exists: bool
    state: Optional[Dict[str, Any]] = None
    updated_at: Optional[str] = None


class StatusSuccessContract(BaseModel):
    status: str
    updated_at: Optional[str] = None
    message: Optional[str] = None


class ScenarioItemContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class StudyTaskItemContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    title: str
    subject: str
    progressText: str
    weight: float
    completed: bool
    skipped: bool
    scheduledDate: Optional[str] = None
    note: Optional[str] = None
    createdAt: Optional[str] = None


class MockTestItemContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    testName: str
    testDate: str
    reliabilityTier: str
    scores: Dict[str, Any]
    note: Optional[str] = None
    createdAt: Optional[str] = None


class InteractionsResponseContract(BaseModel):
    favorites: List[str]
    hiddens: List[str]
    compares: List[str]


class TelemetryEventResponseContract(BaseModel):
    status: str
    event_id: str


class CareerCatalogContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    version: str
    total_major_groups: int
    pathways: List[Dict[str, Any]]


class CareerPathwayDetailContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    major_group_code: str
    major_group_name_vi: str
    top_occupations: List[Dict[str, Any]]
    alternative_pathways: List[Dict[str, Any]]


class OccupationDetailContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    major_group_code: str
    major_group_name_vi: str
    occupation: Dict[str, Any]
    alternative_pathways: List[Dict[str, Any]]


# ============================================================================
# TEST CASES
# ============================================================================

def test_contract_get_health(client):
    """GET /api/health phải tuân thủ schema HealthResponseContract."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    contract = HealthResponseContract.model_validate(data)
    assert contract.status == "ok"
    assert contract.n_programs >= 1000
    assert contract.n_schools >= 30


def test_contract_get_meta(client):
    """GET /api/meta phải tuân thủ schema MetaResponseContract."""
    res = client.get("/api/meta")
    assert res.status_code == 200
    data = res.json()
    contract = MetaResponseContract.model_validate(data)
    assert len(contract.known_gaps) >= 1
    assert "data/labels" in contract.data_source or "Đề án" in contract.data_source


def test_contract_post_recommend_valid(client, valid_recommend_req):
    """POST /api/recommend với request hợp lệ trả về RecommendResponse chặt chẽ."""
    res = client.post("/api/recommend", json=valid_recommend_req)
    assert res.status_code == 200
    data = res.json()
    validated = RecommendResponse.model_validate(data)
    assert 0.0 <= validated.p_fail_all <= 1.0
    assert validated.n_selected == len(validated.wishlist)
    assert 1 <= validated.n_selected <= valid_recommend_req["max_wishes"]
    for item in validated.wishlist:
        assert 0.0 <= item.admit_prob <= 1.0
        assert item.admit_prob == item.admit_probability
        assert item.role in ["mao_hiem", "vua_tam", "an_toan"]


def test_contract_post_recommend_validation_error(client, valid_recommend_req):
    """POST /api/recommend với payload sai luật (điểm > 10.0) phải trả về 422."""
    bad_req = dict(valid_recommend_req)
    bad_req["exam_scores"] = dict(valid_recommend_req["exam_scores"])
    bad_req["exam_scores"]["toan"] = 12.5  # Vượt quá trần 10.0
    res = client.post("/api/recommend", json=bad_req)
    assert res.status_code == 422

    # Ngân sách âm
    bad_budget_req = dict(valid_recommend_req)
    bad_budget_req["family"] = dict(valid_recommend_req["family"])
    bad_budget_req["family"]["annual_budget_vnd"] = -500000
    res2 = client.post("/api/recommend", json=bad_budget_req)
    assert res2.status_code == 422


def test_contract_get_history(client, valid_recommend_req):
    """GET /api/history chỉ trả lịch sử của đúng user_id; thiếu user_id bị từ chối."""
    user_id = f"hist_{uuid.uuid4().hex[:8]}"
    client.post("/api/recommend", json={**valid_recommend_req, "user_id": user_id})
    assert client.get("/api/history").status_code == 422
    assert client.get("/api/history?user_id=anonymous").status_code == 400
    res = client.get(f"/api/history?user_id={user_id}")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        item = ConsultationHistoryItemContract.model_validate(data[0])
        assert "p_fail_all" in item.result_summary


def test_contract_app_state_crud_lifecycle(client, sample_app_state):
    """Vòng đời GET, POST, DELETE /api/app-state tuân thủ schema."""
    user_id = f"test_contract_{uuid.uuid4().hex[:8]}"

    # 1. Ban đầu chưa có
    res_get1 = client.get(f"/api/app-state?user_id={user_id}")
    assert res_get1.status_code == 200
    state_contract1 = AppStateResponseContract.model_validate(res_get1.json())
    assert state_contract1.exists is False
    assert state_contract1.state is None

    # 2. Lưu state
    res_post = client.post(f"/api/app-state?user_id={user_id}", json=sample_app_state)
    assert res_post.status_code == 200
    post_contract = StatusSuccessContract.model_validate(res_post.json())
    assert post_contract.status == "success"

    # 3. Lấy lại state đã lưu
    res_get2 = client.get(f"/api/app-state?user_id={user_id}")
    assert res_get2.status_code == 200
    state_contract2 = AppStateResponseContract.model_validate(res_get2.json())
    assert state_contract2.exists is True
    assert state_contract2.state["profile"]["name"] == sample_app_state["profile"]["name"]

    # 4. Xóa state
    res_del = client.delete(f"/api/app-state?user_id={user_id}")
    assert res_del.status_code == 200
    del_contract = StatusSuccessContract.model_validate(res_del.json())
    assert del_contract.status == "success"


def test_contract_scenarios_crud_lifecycle(client, sample_scenarios):
    """Vòng đời GET, POST, PUT, DELETE /api/scenarios."""
    sc = sample_scenarios[0]
    sc_id = f"sc-test-{uuid.uuid4().hex[:6]}"
    payload = dict(sc)
    payload["id"] = sc_id

    # 1. Create
    res_post = client.post("/api/scenarios", json=payload)
    assert res_post.status_code == 200
    post_data = res_post.json()
    assert post_data["status"] == "success"
    assert post_data["id"] == sc_id

    # 2. List
    res_list = client.get("/api/scenarios")
    assert res_list.status_code == 200
    items = [ScenarioItemContract.model_validate(item) for item in res_list.json()]
    assert any(i.id == sc_id for i in items)

    # 3. Update
    res_put = client.put(f"/api/scenarios/{sc_id}", json={"name": "Kịch bản cập nhật"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "success"

    # 4. Delete
    res_del = client.delete(f"/api/scenarios/{sc_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"


def test_contract_study_tasks_crud_lifecycle(client, sample_study_tasks):
    """Vòng đời GET, POST, PUT, DELETE /api/study-plan/tasks."""
    task = sample_study_tasks[0]
    task_id = f"task-test-{uuid.uuid4().hex[:6]}"
    payload = dict(task)
    payload["id"] = task_id

    # 1. Create
    res_post = client.post("/api/study-plan/tasks", json=payload)
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "success"

    # 2. List
    res_list = client.get("/api/study-plan/tasks")
    assert res_list.status_code == 200
    tasks = [StudyTaskItemContract.model_validate(t) for t in res_list.json()]
    assert any(t.id == task_id for t in tasks)

    # 3. Update
    res_put = client.put(f"/api/study-plan/tasks/{task_id}", json={"completed": True, "progressText": "5/5"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "success"

    # 4. Delete
    res_del = client.delete(f"/api/study-plan/tasks/{task_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"


def test_contract_mock_tests_crud_lifecycle(client, sample_mock_tests):
    """Vòng đời GET, POST, DELETE /api/scores/mock-tests."""
    mock_item = sample_mock_tests[0]

    # 1. Record
    res_post = client.post("/api/scores/mock-tests", json=mock_item)
    assert res_post.status_code == 200
    post_data = res_post.json()
    assert post_data["status"] == "success"
    record_id = post_data["id"]

    # 2. List
    res_list = client.get("/api/scores/mock-tests")
    assert res_list.status_code == 200
    tests = [MockTestItemContract.model_validate(t) for t in res_list.json()]
    assert any(str(t.id) == str(record_id) for t in tests)

    # 3. Delete
    res_del = client.delete(f"/api/scores/mock-tests/{record_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"


def test_contract_recommendations_interactions(client):
    """GET và POST /api/recommendations/interactions."""
    prog_id = f"PROG_TEST_{uuid.uuid4().hex[:6]}"

    # Missing program_id -> 400
    res_bad = client.post("/api/recommendations/interactions", json={"is_favorite": True})
    assert res_bad.status_code == 400

    # Valid post
    res_ok = client.post("/api/recommendations/interactions", json={
        "program_id": prog_id,
        "is_favorite": True,
        "is_hidden": False,
        "is_compared": True
    })
    assert res_ok.status_code == 200
    assert res_ok.json() == {"status": "success", "program_id": prog_id}

    # List interactions
    res_get = client.get("/api/recommendations/interactions")
    assert res_get.status_code == 200
    interactions = InteractionsResponseContract.model_validate(res_get.json())
    assert prog_id in interactions.favorites
    assert prog_id in interactions.compares
    assert prog_id not in interactions.hiddens


def test_contract_telemetry_events(client, sample_telemetry_event):
    """POST /api/telemetry/events."""
    res = client.post("/api/telemetry/events", json=sample_telemetry_event)
    assert res.status_code == 200
    contract = TelemetryEventResponseContract.model_validate(res.json())
    assert contract.status == "recorded"
    assert len(contract.event_id) > 0


def test_contract_careers_endpoints(client):
    """GET /api/careers, GET /api/careers/{major_group_code}, GET /api/careers/occupation/{occupation_code}."""
    # 1. Catalog
    res_cat = client.get("/api/careers")
    assert res_cat.status_code == 200
    catalog = CareerCatalogContract.model_validate(res_cat.json())
    assert catalog.total_major_groups >= 1
    assert len(catalog.pathways) >= 1

    first_group = catalog.pathways[0]["major_group_code"]

    # 2. Major group pathway
    res_path = client.get(f"/api/careers/{first_group}")
    assert res_path.status_code == 200
    pathway = CareerPathwayDetailContract.model_validate(res_path.json())
    assert pathway.major_group_code.lower() == first_group.lower()

    # 404 for invalid major group
    res_bad_grp = client.get("/api/careers/non_existent_group_xyz")
    assert res_bad_grp.status_code == 404

    # 3. Occupation detail
    first_occ = pathway.top_occupations[0]["occupation_code"]
    res_occ = client.get(f"/api/careers/occupation/{first_occ}")
    assert res_occ.status_code == 200
    occ = OccupationDetailContract.model_validate(res_occ.json())
    assert occ.occupation["occupation_code"] == first_occ

    # 404 for invalid occupation
    res_bad_occ = client.get("/api/careers/occupation/NON_EXISTENT_OCC_XYZ")
    assert res_bad_occ.status_code == 404
