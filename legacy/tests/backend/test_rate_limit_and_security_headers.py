"""Test Suite for Rate Limiting & Security Headers (Issue #15)."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.security import rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_limiter():
    orig_limit = rate_limiter.limit
    orig_heavy = rate_limiter.heavy_limit
    rate_limiter.reset()
    yield
    rate_limiter.limit = orig_limit
    rate_limiter.heavy_limit = orig_heavy
    rate_limiter.reset()

def test_security_headers_present():
    """Verify standard security headers (X-Content-Type-Options, HSTS, X-Frame-Options)."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in resp.headers

def test_rate_limiting_exceeded_returns_429():
    """Verify that rapid successive requests beyond threshold trigger HTTP 429."""
    # Set low limit for testing
    rate_limiter.limit = 5
    rate_limiter.heavy_limit = 3

    # Send 5 requests to general endpoint
    for i in range(5):
        r = client.get("/api/meta")
        assert r.status_code == 200

    # 6th request must trigger HTTP 429
    r6 = client.get("/api/meta")
    assert r6.status_code == 429
    data = r6.json()
    assert data.get("error") == "rate_limit_exceeded"
    assert "Retry-After" in r6.headers
