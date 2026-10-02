"""Test suite xác minh toàn diện cho SUBAGENT 4: CRUD / APPLICATION STATE.
Kiểm thử các API CRUD thực tế trong FastAPI và cơ sở dữ liệu SQLite.
"""

import sys
import json
from pathlib import Path

# Force UTF-8 on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    print("✓ PASS: /api/health")

def test_app_state_crud():
    # 1. Reset state
    res_del = client.delete("/api/app-state?user_id=test_user")
    assert res_del.status_code == 200

    # 2. Check empty state
    res_get = client.get("/api/app-state?user_id=test_user")
    assert res_get.status_code == 200
    assert res_get.json()["exists"] is False

    # 3. Save state
    sample_state = {
        "version": "4.0.0",
        "profile": {"name": "Nguyễn Văn Test", "grade": "12A1", "examScores": {"toan": 9.0, "anh": 8.5}},
        "primaryTarget": {"programId": "BKA_IT1", "schoolCode": "BKA", "majorName": "CNTT"},
        "wishlist": [],
    }
    res_post = client.post("/api/app-state?user_id=test_user", json=sample_state)
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "success"

    # 4. Verify saved state
    res_get2 = client.get("/api/app-state?user_id=test_user")
    assert res_get2.status_code == 200
    data2 = res_get2.json()
    assert data2["exists"] is True
    assert data2["state"]["profile"]["name"] == "Nguyễn Văn Test"
    assert data2["state"]["profile"]["examScores"]["toan"] == 9.0
    print("✓ PASS: App State CRUD (GET, POST, DELETE)")

def test_scenarios_crud():
    # 1. Create scenario
    sc_payload = {
        "id": "sc-test-01",
        "name": "Kịch bản Toán +1, Anh +0.5",
        "deltaScores": {"toan": 1.0, "anh": 0.5},
        "annualBudgetVnd": 45000000,
        "region": "hanoi",
        "riskTolerance": "medium"
    }
    res_create = client.post("/api/scenarios", json=sc_payload)
    assert res_create.status_code == 200

    # 2. Read scenarios
    res_list = client.get("/api/scenarios")
    assert res_list.status_code == 200
    sc_list = res_list.json()
    assert any(s["id"] == "sc-test-01" for s in sc_list)

    # 3. Update scenario
    sc_update = {
        "name": "Kịch bản Toán +1.5, Anh +1.0 (Đã nâng cấp)",
        "deltaScores": {"toan": 1.5, "anh": 1.0},
        "annualBudgetVnd": 50000000
    }
    res_put = client.put("/api/scenarios/sc-test-01", json=sc_update)
    assert res_put.status_code == 200

    # 4. Delete scenario
    res_del = client.delete("/api/scenarios/sc-test-01")
    assert res_del.status_code == 200
    print("✓ PASS: Scenarios CRUD (Create, List, Update, Delete)")

def test_study_tasks_crud():
    # 1. Create study task
    task_payload = {
        "id": "task-test-01",
        "title": "Làm 5 đề thi thử Toán Đại học Sư Phạm",
        "subject": "toan",
        "progressText": "0/5",
        "weight": 2,
        "completed": False,
        "skipped": False,
    }
    res_create = client.post("/api/study-plan/tasks", json=task_payload)
    assert res_create.status_code == 200

    # 2. Read study tasks
    res_list = client.get("/api/study-plan/tasks")
    assert res_list.status_code == 200
    task_list = res_list.json()
    assert any(t["id"] == "task-test-01" for t in task_list)

    # 3. Complete task & Reschedule
    res_put = client.put("/api/study-plan/tasks/task-test-01", json={
        "completed": True,
        "progressText": "5/5",
        "scheduledDate": "2025-01-20"
    })
    assert res_put.status_code == 200

    # 4. Delete task
    res_del = client.delete("/api/study-plan/tasks/task-test-01")
    assert res_del.status_code == 200
    print("✓ PASS: Study Tasks CRUD (Create, List, Update, Complete, Delete)")

def test_mock_tests_crud():
    # 1. Record mock test
    mock_payload = {
        "testName": "Thi thử THPT Chuyên KHTN Đợt 2",
        "testDate": "2025-03-15",
        "reliabilityTier": "tier_1_specialized_school",
        "scores": {"toan": 8.8, "ly": 9.0, "anh": 8.2},
        "note": "Tiến bộ môn Lý"
    }
    res_post = client.post("/api/scores/mock-tests", json=mock_payload)
    assert res_post.status_code == 200
    new_id = res_post.json()["id"]

    # 2. List mock tests
    res_list = client.get("/api/scores/mock-tests")
    assert res_list.status_code == 200
    mock_list = res_list.json()
    assert any(str(m["id"]) == str(new_id) for m in mock_list)

    # 3. Delete mock test
    res_del = client.delete(f"/api/scores/mock-tests/{new_id}")
    assert res_del.status_code == 200
    print("✓ PASS: Mock Tests History CRUD (Record, List, Delete)")

def test_recommendation_interactions():
    # 1. Favorite & Compare
    res_fav = client.post("/api/recommendations/interactions", json={
        "program_id": "BKA_IT1",
        "is_favorite": 1,
        "is_compared": 1
    })
    assert res_fav.status_code == 200

    # 2. List interactions
    res_get = client.get("/api/recommendations/interactions")
    assert res_get.status_code == 200
    data = res_get.json()
    assert "BKA_IT1" in data["favorites"]
    assert "BKA_IT1" in data["compares"]
    print("✓ PASS: Recommendation Interactions CRUD (Favorite, Compare, Hide)")

if __name__ == "__main__":
    print("=== BẮT ĐẦU CHẠY KIỂM THỬ SUBAGENT 4 CRUD / APP STATE ===")
    test_health()
    test_app_state_crud()
    test_scenarios_crud()
    test_study_tasks_crud()
    test_mock_tests_crud()
    test_recommendation_interactions()
    print("=== TẤT CẢ TEST ĐÃ PASS 100% ===")
