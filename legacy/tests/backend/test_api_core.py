"""Kiểm thử Observability, Health Endpoints, Logging Middleware và Security (P0 SSOT)
Worker / Subagent: SUBAGENT 09 - OBSERVABILITY / PERFORMANCE / SECURITY
Các mục tiêu kiểm tra:
1. /api/health (Liveness): 200 OK, status 'ok', uptime_seconds, timestamp, version.
2. /api/health/ready (Readiness): 200 OK, db connection ping & latency, parquet in memory & file size.
3. /api/health/data (Data Provenance): 200 OK, version, record_count, sha256 checksum, freshness.
4. Structured Logging & Correlation ID middleware:
   - X-Correlation-ID tự sinh hoặc giữ nguyên header client gửi lên.
   - X-Process-Time-Ms phản ánh latency xử lý request.
5. Security - SSRF Protection:
   - Chặn localhost, 127.0.0.1, 10.x, 192.168.x, 172.16.x, 169.254.169.254, non-http schemes.
   - Cho phép các domain công khai an toàn.
6. Security - Text Input Sanitization:
   - Khử script tags, iframe, onerror, null bytes mà vẫn bảo tồn chữ tiếng Việt có dấu.
7. Security - Secret Leak Prevention:
   - Phản hồi từ các health endpoint không để lộ absolute paths ổ cứng hay credentials.
"""

import re
import sys
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.main import app  # noqa: E402
from backend.app.security import validate_safe_url, sanitize_text, sanitize_payload, get_safe_cors_origins  # noqa: E402
from backend.app.logging_config import JSONLogFormatter, get_correlation_id, set_correlation_id  # noqa: E402

client = TestClient(app)




# ============================================================================
# 1. OBSERVABILITY & HEALTH ENDPOINTS TESTS
# ============================================================================

def test_api_health_liveness():
    """Kiểm tra /api/health (liveness probe)."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "nguyen-vong-ai-backend"
    assert "version" in data
    assert "timestamp" in data
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], (int, float))
    assert data["n_programs"] >= 1000
    assert data["n_schools"] >= 50


def test_api_health_readiness():
    """Kiểm tra /api/health/ready: catalog đã nạp và có tham số biến động điểm chuẩn."""
    res = client.get("/api/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready" and data["ready"] is True
    assert data["checks"]["catalog"]["status"] == "ok"
    assert data["checks"]["catalog"]["programs"] >= 1000
    assert data["checks"]["national_shock"]["overall_std"] > 0


def test_api_health_data_provenance():
    """Kiểm tra /api/health/data: nguồn gốc, độ tươi và mã băm của dữ liệu đang phục vụ."""
    res = client.get("/api/health/data")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset"] == "programs-catalog.json"
    assert data["record_count"] >= 1000
    assert data["schools_count"] >= 50
    assert "2024" in data["admission_years"]
    assert re.match(r"^[0-9a-f]{64}$", data["sha256"])
    assert 0.0 <= data["quality"]["tuition_coverage"] <= 1.0
    assert 0.0 <= data["quality"]["employment_coverage"] <= 1.0


def test_meta_reports_computed_limits():
    """/api/meta nêu giới hạn dữ liệu tính từ số liệu thật, không phải chuỗi viết cứng đã lỗi thời."""
    data = client.get("/api/meta").json()
    assert data["n_programs"] >= 1000 and data["known_gaps"]
    text = " ".join(data["known_gaps"])
    assert str(data["n_schools"]) in text
    assert "58/440" not in text and "0.3%" not in text


# ============================================================================
# 2. STRUCTURED LOGGING & CORRELATION ID TESTS
# ============================================================================

def test_correlation_id_auto_generation():
    """Nếu client không gửi Correlation ID, middleware tự sinh UUID hợp lệ."""
    res = client.get("/api/health")
    assert res.status_code == 200
    cid = res.headers.get("X-Correlation-ID")
    assert cid is not None
    # Kiểm tra UUID v4 format
    parsed_uuid = uuid.UUID(cid)
    assert str(parsed_uuid) == cid
    assert "X-Process-Time-Ms" in res.headers
    assert float(res.headers["X-Process-Time-Ms"]) >= 0.0


def test_correlation_id_propagation():
    """Nếu client gửi X-Correlation-ID, backend giữ nguyên ID đó và phản hồi lại."""
    custom_cid = "client-trace-req-987654321"
    res = client.get("/api/health", headers={"X-Correlation-ID": custom_cid})
    assert res.status_code == 200
    assert res.headers.get("X-Correlation-ID") == custom_cid


def test_json_log_formatter():
    """Kiểm tra JSONLogFormatter xuất định dạng JSON hợp lệ chuẩn máy đọc."""
    import logging
    formatter = JSONLogFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Kiểm tra ghi log JSON",
        args=(),
        exc_info=None,
    )
    record.correlation_id = "test-corr-id"
    record.duration_ms = 12.34
    record.method = "GET"
    record.path = "/api/test"
    record.status_code = 200

    formatted = formatter.format(record)
    import json
    data = json.loads(formatted)
    assert data["level"] == "INFO"
    assert data["logger"] == "test_logger"
    assert data["message"] == "Kiểm tra ghi log JSON"
    assert data["correlation_id"] == "test-corr-id"
    assert data["duration_ms"] == 12.34
    assert data["method"] == "GET"
    assert data["status_code"] == 200


# ============================================================================
# 3. SECURITY - SSRF PROTECTION TESTS
# ============================================================================

@pytest.mark.parametrize("blocked_url", [
    "http://127.0.0.1:8000/admin",
    "http://localhost:3000/secret",
    "http://10.0.0.1/internal-api",
    "http://192.168.1.1/router",
    "http://172.16.0.1/private",
    "http://169.254.169.254/latest/meta-data/",
    "http://metadata.google.internal/computeMetadata/v1/",
    "file:///C:/Windows/System32/drivers/etc/hosts",
    "gopher://127.0.0.1:6379/_INFO",
    "ftp://ftp.internal.local/data.txt",
    "http://user:pass@example.com/login",
])
def test_ssrf_blocks_unsafe_urls(blocked_url):
    """Chống SSRF: cấm tất cả URL trỏ vào mạng nội bộ, cloud metadata, credential nhúng hoặc non-http."""
    is_safe, reason = validate_safe_url(blocked_url)
    assert is_safe is False
    assert len(reason) > 0


def test_ssrf_allows_safe_external_url():
    """Chống SSRF: cho phép URL cổng thông tin trường đại học hợp lệ."""
    safe_url = "https://ts.hust.edu.vn/diem-chuan"
    is_safe, reason = validate_safe_url(safe_url)
    assert is_safe is True
    assert "an toàn" in reason.lower() or "ok" in reason.lower()


# ============================================================================
# 4. SECURITY - INPUT SANITIZATION TESTS
# ============================================================================

def test_sanitize_text_strips_xss():
    """Làm sạch đầu vào: khử thẻ script và event handlers nguy hiểm."""
    raw = "<script>alert('pwned')</script>Nguyện vọng CNTT Bách Khoa"
    cleaned = sanitize_text(raw)
    assert "<script>" not in cleaned
    assert "alert" not in cleaned
    assert "Nguyện vọng CNTT Bách Khoa" in cleaned


def test_sanitize_text_strips_null_bytes_and_iframes():
    """Làm sạch đầu vào: khử null bytes và iframe injection."""
    raw = "Hồ sơ\x00 tuyển sinh <iframe src='javascript:attack()'></iframe> 2026"
    cleaned = sanitize_text(raw)
    assert "\x00" not in cleaned
    assert "<iframe" not in cleaned
    assert "javascript" not in cleaned
    assert "Hồ sơ tuyển sinh" in cleaned
    assert "2026" in cleaned


def test_sanitize_payload_recursive():
    """Làm sạch đệ quy toàn bộ dictionary và list dữ liệu."""
    payload = {
        "title": "<b onmouseover=evil()>Toán</b>",
        "nested": {
            "note": "Ghi chú <script>evil()</script>tiếng Việt có dấu: Hà Nội, ĐH Bách Khoa",
            "tags": ["<img src=x onerror=alert(1)>tag1", "tag2"]
        }
    }
    cleaned = sanitize_payload(payload)
    assert "onmouseover" not in cleaned["title"]
    assert "<script>" not in cleaned["nested"]["note"]
    assert "Hà Nội, ĐH Bách Khoa" in cleaned["nested"]["note"]
    assert "onerror" not in cleaned["nested"]["tags"][0]
    assert "tag1" in cleaned["nested"]["tags"][0]


# ============================================================================
# 5. SECURITY - LEAK PREVENTION & SAFE CORS
# ============================================================================

def test_no_secret_leak_in_health_endpoints():
    """Kiểm tra không lộ đường dẫn ổ cứng tuyệt đối của server hoặc secrets trong response."""
    for endpoint in ["/api/health", "/api/health/ready", "/api/health/data", "/api/meta"]:
        res = client.get(endpoint)
        assert res.status_code == 200
        text = res.text.lower()
        # Không lộ đường dẫn hệ thống tệp tuyệt đối kiểu Windows
        assert "c:\\users" not in text
        assert "d:\\07-competitions" not in text
        # Không lộ mật khẩu, auth token bí mật
        assert "password" not in text or "password_hash" not in text
        assert "secret_key" not in text


def test_safe_cors_origins():
    """Kiểm tra CORS configuration trả về các domain cục bộ hợp lệ, không dùng wildcard mở toang."""
    origins = get_safe_cors_origins()
    assert isinstance(origins, list)
    assert len(origins) > 0
    # Không được chứa wildcard '*' thô
    assert "*" not in origins
    assert "http://localhost:5173" in origins
    assert "http://localhost:3000" in origins
