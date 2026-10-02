import json
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.main import app, load_data

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture(scope="session", autouse=True)
def init_app_state():
    """Tự động nạp dữ liệu parquet và khởi tạo database cho toàn bộ test session."""
    load_data()


@pytest.fixture
def client():
    """TestClient dùng cho tất cả các test API."""
    return TestClient(app)


@pytest.fixture
def fixtures_dir():
    return FIXTURES_DIR


@pytest.fixture
def valid_recommend_req():
    with open(FIXTURES_DIR / "recommend_request_valid.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def boundary_recommend_req():
    with open(FIXTURES_DIR / "recommend_request_boundary.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_programs():
    with open(FIXTURES_DIR / "sample_programs.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_scenarios():
    with open(FIXTURES_DIR / "sample_scenarios.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_study_tasks():
    with open(FIXTURES_DIR / "sample_study_tasks.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_mock_tests():
    with open(FIXTURES_DIR / "sample_mock_tests.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_app_state():
    with open(FIXTURES_DIR / "sample_app_state.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_telemetry_event():
    with open(FIXTURES_DIR / "sample_telemetry_event.json", encoding="utf-8") as f:
        return json.load(f)
