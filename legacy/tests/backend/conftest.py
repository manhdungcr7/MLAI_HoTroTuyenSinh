import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.main import app  # noqa: E402
from backend.app.security import rate_limiter  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_rate_limit():
    """Bộ giới hạn tốc độ là trạng thái toàn cục: mỗi test bắt đầu và kết thúc với trạng thái sạch."""
    rate_limiter.reset()
    yield
    rate_limiter.reset()


@pytest.fixture
def client():
    return TestClient(app)
