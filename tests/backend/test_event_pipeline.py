"""Comprehensive Test Suite for Webhook, Event Bus & Job Pipeline.

Kiểm tra toàn diện:
1. HMAC-SHA256 signature verification (valid, invalid, tampered, prefix formats)
2. Replay protection (tolerance window, expired timestamp, ISO / epoch formats)
3. Idempotency store (key reservation, deduplication, TTL, cached response)
4. Event Bus asynchronous dispatching, wildcard subscription, error isolation, DLQ
5. 4 Core Domain Events: IngestionCompletedEvent, DatasetUpdatedEvent,
   PortfolioStaleEvent, TelemetryEvent (Zero-PII)
6. FastAPI Webhook Router Endpoints:
   - POST /api/webhooks/events (202 Accepted, 401 Unauthorized, 400 Replay, 200 Idempotent Replay)
   - POST /api/webhooks/crawler (Ingestion & Dataset updated chain)
   - GET /api/webhooks/metrics, /api/webhooks/history, /api/webhooks/dead-letter
   - POST /api/scores/mock-tests auto-emission of PortfolioStaleEvent
"""

import asyncio
import json
import sys
import time
from pathlib import Path
from typing import List

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.main import app
from backend.app.events import (
    DomainEvent,
    IngestionCompletedEvent,
    DatasetUpdatedEvent,
    PortfolioStaleEvent,
    TelemetryEvent,
    EventBus,
    event_bus,
    compute_hmac_sha256,
    verify_hmac_signature,
    verify_timestamp_replay,
    idempotency_store,
    get_webhook_secret,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def clean_test_state():
    """Dọn dẹp idempotency và bus state trước mỗi test."""
    idempotency_store.clear()
    event_bus.clear()
    yield
    idempotency_store.clear()
    event_bus.clear()


# ============================================================================
# 1. HMAC-SHA256 VERIFICATION TESTS
# ============================================================================

def test_compute_hmac_sha256():
    raw = b'{"test": "data"}'
    secret = "secret123"
    sig = compute_hmac_sha256(raw, secret)
    assert isinstance(sig, str)
    assert len(sig) == 64  # SHA256 hex is 64 characters
    # Recomputing gives same hash
    assert compute_hmac_sha256(raw, secret) == sig


def test_verify_hmac_signature_valid():
    raw = b'{"event": "test"}'
    secret = "my_custom_secret"
    sig = compute_hmac_sha256(raw, secret)

    # Standard raw hex
    assert verify_hmac_signature(raw, sig, secret=secret) is True
    # With 'sha256=' prefix
    assert verify_hmac_signature(raw, f"sha256={sig}", secret=secret) is True
    # Uppercase hex is also valid
    assert verify_hmac_signature(raw, sig.upper(), secret=secret) is True


def test_verify_hmac_signature_invalid_and_tampered():
    raw = b'{"event": "test"}'
    secret = "my_custom_secret"
    sig = compute_hmac_sha256(raw, secret)

    # Tampered payload
    tampered = b'{"event": "test2"}'
    assert verify_hmac_signature(tampered, sig, secret=secret) is False

    # Wrong secret
    assert verify_hmac_signature(raw, sig, secret="wrong_secret") is False

    # Empty or None signature
    assert verify_hmac_signature(raw, None, secret=secret) is False
    assert verify_hmac_signature(raw, "", secret=secret) is False
    assert verify_hmac_signature(raw, "invalid_hex", secret=secret) is False


# ============================================================================
# 2. REPLAY PROTECTION TESTS
# ============================================================================

def test_verify_timestamp_replay_current_time():
    now = time.time()
    # Exactly now
    assert verify_timestamp_replay(str(now), tolerance_seconds=300, current_time=now) is True
    # 60 seconds ago
    assert verify_timestamp_replay(str(now - 60), tolerance_seconds=300, current_time=now) is True
    # 60 seconds in future (acceptable clock skew)
    assert verify_timestamp_replay(str(now + 60), tolerance_seconds=300, current_time=now) is True


def test_verify_timestamp_replay_expired_and_future():
    now = time.time()
    # 301 seconds ago (exceeds 300s tolerance)
    assert verify_timestamp_replay(str(now - 301), tolerance_seconds=300, current_time=now) is False
    # 301 seconds in future
    assert verify_timestamp_replay(str(now + 301), tolerance_seconds=300, current_time=now) is False


def test_verify_timestamp_replay_iso8601_and_milliseconds():
    now = 1726737000.0  # reference epoch
    # Milliseconds format
    now_ms = now * 1000.0
    assert verify_timestamp_replay(str(now_ms), tolerance_seconds=300, current_time=now) is True

    # ISO-8601 string format
    iso_time = "2024-09-19T09:10:00Z"
    import datetime
    dt = datetime.datetime(2024, 9, 19, 9, 10, 0, tzinfo=datetime.timezone.utc)
    target_now = dt.timestamp()
    assert verify_timestamp_replay(iso_time, tolerance_seconds=300, current_time=target_now) is True

    # Invalid timestamp string
    assert verify_timestamp_replay("not-a-timestamp", tolerance_seconds=300) is False
    assert verify_timestamp_replay(None, tolerance_seconds=300) is False


# ============================================================================
# 3. IDEMPOTENCY STORE TESTS
# ============================================================================

def test_idempotency_store_workflow():
    store = idempotency_store
    key = "idem-test-key-101"
    req_hash = "hash-abc-123"

    # 1. First attempt -> is_new = True, no cached data
    is_new, cached = store.check_or_reserve(key, req_hash, event_id="evt-1", event_type="test.event")
    assert is_new is True
    assert cached is None

    # 2. Mark completed
    resp = {"status": "accepted", "event_id": "evt-1"}
    store.mark_completed(key, resp)

    # 3. Second attempt with same key -> is_new = False, cached data returned
    is_new_2, cached_2 = store.check_or_reserve(key, req_hash)
    assert is_new_2 is False
    assert cached_2 is not None
    assert cached_2.get("status") == "accepted"
    assert cached_2.get("event_id") == "evt-1"


def test_idempotency_store_different_keys():
    store = idempotency_store
    is_new_1, _ = store.check_or_reserve("key-A", "hash-A")
    is_new_2, _ = store.check_or_reserve("key-B", "hash-B")
    assert is_new_1 is True
    assert is_new_2 is True


# ============================================================================
# 4. EVENT BUS DISPATCHING TESTS
# ============================================================================

@pytest.mark.anyio
async def test_event_bus_publish_now_sync_and_async():
    bus = EventBus()
    received_sync: List[str] = []
    received_async: List[str] = []

    def sync_handler(evt: DomainEvent):
        received_sync.append(evt.id)

    async def async_handler(evt: DomainEvent):
        await asyncio.sleep(0.01)
        received_async.append(evt.id)

    bus.subscribe("test.evt", sync_handler)
    bus.subscribe("test.evt", async_handler)

    event = DomainEvent(type="test.evt", payload={"msg": "hello"})
    res = await bus.publish_now(event)

    assert res["success"] is True
    assert res["subscribers_called"] == 2
    assert received_sync == [event.id]
    assert received_async == [event.id]


@pytest.mark.anyio
async def test_event_bus_wildcard_subscriber():
    bus = EventBus()
    all_events: List[str] = []

    def wildcard_handler(evt: DomainEvent):
        all_events.append(evt.type)

    bus.subscribe("*", wildcard_handler)

    await bus.publish_now(DomainEvent(type="event.one"))
    await bus.publish_now(DomainEvent(type="event.two"))

    assert all_events == ["event.one", "event.two"]


@pytest.mark.anyio
async def test_event_bus_worker_queue_background():
    bus = EventBus(worker_concurrency=2)
    received: List[str] = []

    async def worker_handler(evt: DomainEvent):
        received.append(evt.payload.get("data"))

    bus.subscribe("job.task", worker_handler)
    await bus.start()

    try:
        await bus.publish(DomainEvent(type="job.task", payload={"data": "item1"}))
        await bus.publish(DomainEvent(type="job.task", payload={"data": "item2"}))
        await bus.publish(DomainEvent(type="job.task", payload={"data": "item3"}))

        # Drain to ensure all are processed
        await bus.drain(timeout=2.0)
        assert set(received) == {"item1", "item2", "item3"}

        metrics = bus.get_metrics()
        assert metrics["total_published"] == 3
        assert metrics["total_processed"] == 3
        assert metrics["total_failed"] == 0
    finally:
        await bus.stop()


@pytest.mark.anyio
async def test_event_bus_error_isolation_and_dlq():
    bus = EventBus(max_retries=1)
    failed_attempts = 0

    def faulty_handler(evt: DomainEvent):
        nonlocal failed_attempts
        failed_attempts += 1
        raise ValueError("Simulated handler crash")

    bus.subscribe("faulty.event", faulty_handler)
    await bus.start()

    try:
        await bus.publish(DomainEvent(type="faulty.event", payload={"x": 1}))
        await bus.drain(timeout=2.0)

        # 1 initial + 1 retry = 2 attempts
        assert failed_attempts == 2

        metrics = bus.get_metrics()
        assert metrics["total_failed"] == 1
        assert metrics["dead_letter_count"] == 1

        dlq = bus.get_dead_letter_events()
        assert len(dlq) == 1
        assert "Simulated handler crash" in dlq[0]["reason"]
    finally:
        await bus.stop()


# ============================================================================
# 5. BUSINESS DOMAIN EVENTS VALIDATION TESTS
# ============================================================================

def test_ingestion_completed_event_creation():
    event = IngestionCompletedEvent.create(
        source="dean_pdfs_crawler",
        schools_count=58,
        programs_count=1850,
        duration_seconds=124.5,
        status="success",
        artefact_path="data/processed/programs.parquet",
    )
    assert event.type == "ingestion.completed"
    assert event.payload["schools_count"] == 58
    assert event.payload["programs_count"] == 1850
    assert event.payload["status"] == "success"
    assert event.occurred_at is not None


def test_dataset_updated_event_creation():
    event = DatasetUpdatedEvent.create(
        dataset_version="v2026.09-final",
        affected_school_codes=["BKA", "NEU", "QHE"],
        total_programs_updated=150,
        update_type="delta_update",
    )
    assert event.type == "dataset.updated"
    assert event.payload["dataset_version"] == "v2026.09-final"
    assert "BKA" in event.payload["affected_school_codes"]
    assert event.payload["total_programs_updated"] == 150


def test_portfolio_stale_event_creation():
    event = PortfolioStaleEvent.create(
        reason="mock_score_updated",
        user_id="user-123",
        previous_scores={"toan": 7.5, "ly": 7.0, "anh": 8.0},
        new_scores={"toan": 8.5, "ly": 7.0, "anh": 8.0},
        score_drift_delta=1.0,
        affected_combinations=["A00", "A01"],
        stale_severity="high",
    )
    assert event.type == "portfolio.stale"
    assert event.payload["reason"] == "mock_score_updated"
    assert event.payload["score_drift_delta"] == 1.0
    assert event.payload["stale_severity"] == "high"


def test_telemetry_event_privacy_assertion():
    event = TelemetryEvent.create(
        event_name="program_card_expanded",
        session_id="sess-xyz-999",
        pseudo_user_id="anon_hash_c9f2b",
        page_route="/options",
        entity_id="BKA_CNTT",
        dwell_time_ms=4500,
        payload={"filter_combination": "A00"},
        shown_candidates=["BKA_CNTT", "UET_CNTT", "PTIT_CNTT"],
    )
    assert event.type == "telemetry.recorded"
    assert event.payload["privacy_asserted"] is True
    # Must not contain plaintext email or phone
    assert "email" not in event.payload
    assert "phone" not in event.payload
    assert event.payload["shown_candidates"] == ["BKA_CNTT", "UET_CNTT", "PTIT_CNTT"]


# ============================================================================
# 6. FASTAPI WEBHOOK INTEGRATION TESTS (TestClient)
# ============================================================================

client = TestClient(app)


def test_webhook_receive_valid_event():
    secret = get_webhook_secret()
    event_dict = {
        "id": "evt-test-001",
        "type": "telemetry.recorded",
        "payload": {
            "event_name": "what_if_slider_moved",
            "session_id": "sess-test-1",
            "pseudo_user_id": "anon-001",
            "page_route": "/analysis",
        },
    }
    body_bytes = json.dumps(event_dict).encode("utf-8")
    sig = compute_hmac_sha256(body_bytes, secret)
    ts = str(time.time())

    resp = client.post(
        "/api/webhooks/events",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": f"sha256={sig}",
            "X-Webhook-Timestamp": ts,
            "X-Idempotency-Key": "key-evt-001",
        },
    )
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "accepted"
    assert data["event_id"] == "evt-test-001"
    assert data["idempotent_replay"] is False
    assert resp.headers.get("X-Cache") == "MISS"


def test_webhook_receive_invalid_hmac():
    event_dict = {"id": "evt-002", "type": "ingestion.completed"}
    body_bytes = json.dumps(event_dict).encode("utf-8")
    ts = str(time.time())

    resp = client.post(
        "/api/webhooks/events",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": "sha256=invalid_wrong_hash_1234567890abcdef",
            "X-Webhook-Timestamp": ts,
        },
    )
    assert resp.status_code == 401
    assert "Invalid webhook HMAC-SHA256 signature" in resp.json()["detail"]


def test_webhook_receive_expired_timestamp():
    secret = get_webhook_secret()
    event_dict = {"id": "evt-003", "type": "dataset.updated"}
    body_bytes = json.dumps(event_dict).encode("utf-8")
    sig = compute_hmac_sha256(body_bytes, secret)
    expired_ts = str(time.time() - 600)  # 10 minutes ago (> 300s window)

    resp = client.post(
        "/api/webhooks/events",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
            "X-Webhook-Timestamp": expired_ts,
        },
    )
    assert resp.status_code == 400
    assert "tolerance window" in resp.json()["detail"]


def test_webhook_receive_idempotency_deduplication():
    secret = get_webhook_secret()
    event_dict = {
        "id": "evt-idem-999",
        "type": "portfolio.stale",
        "payload": {"reason": "dataset_updated", "stale_severity": "high"},
    }
    body_bytes = json.dumps(event_dict).encode("utf-8")
    sig = compute_hmac_sha256(body_bytes, secret)
    ts = str(time.time())
    idem_key = "idempotency-key-unique-999"

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": sig,
        "X-Webhook-Timestamp": ts,
        "X-Idempotency-Key": idem_key,
    }

    # 1. First Call: 202 Accepted
    resp1 = client.post("/api/webhooks/events", content=body_bytes, headers=headers)
    assert resp1.status_code == 202
    assert resp1.headers.get("X-Cache") == "MISS"
    assert resp1.json()["idempotent_replay"] is False

    # 2. Second Call: 200 OK with cached idempotent result
    resp2 = client.post("/api/webhooks/events", content=body_bytes, headers=headers)
    assert resp2.status_code == 200
    assert resp2.headers.get("X-Cache") == "HIT-IDEMPOTENT"
    data2 = resp2.json()
    assert data2["idempotent_replay"] is True
    assert data2["status"] == "duplicate"
    assert data2["event_id"] == "evt-idem-999"


def test_crawler_webhook_endpoint():
    payload = {
        "batch_id": "batch-crawl-2026",
        "source": "dean_pdfs_crawler",
        "schools_count": 58,
        "programs_count": 1850,
        "duration_seconds": 95.2,
        "status": "success",
        "auto_trigger_dataset_updated": True,
    }
    body_bytes = json.dumps(payload).encode("utf-8")
    secret = get_webhook_secret()
    sig = compute_hmac_sha256(body_bytes, secret)

    resp = client.post(
        "/api/webhooks/crawler",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
        },
    )
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "accepted"
    assert "Crawler ingestion event received" in data["message"]


def test_webhook_metrics_and_history_endpoints():
    # Metrics endpoint
    m_resp = client.get("/api/webhooks/metrics")
    assert m_resp.status_code == 200
    m_data = m_resp.json()
    assert "queue_size" in m_data
    assert "total_published" in m_data
    assert "subscribers_count" in m_data

    # History endpoint
    h_resp = client.get("/api/webhooks/history")
    assert h_resp.status_code == 200
    h_data = h_resp.json()
    assert "events" in h_data

    # Dead-letter endpoint
    dl_resp = client.get("/api/webhooks/dead-letter")
    assert dl_resp.status_code == 200
    dl_data = dl_resp.json()
    assert "dead_letters" in dl_data
    assert isinstance(dl_data["dead_letters"], list)


def test_mock_test_creates_portfolio_stale_event():
    """Kiểm tra khi lưu mock test thì PortfolioStaleEvent được phát sinh vào Event Bus."""
    mock_payload = {
        "testName": "Thi thử Khảo sát Sở GD Hà Nội Lần 1",
        "testDate": "2026-05-15",
        "reliabilityTier": "tier_2_provincial_highschool",
        "scores": {"toan": 9.0, "van": 8.0, "anh": 9.2},
        "note": "Điểm tăng vượt bậc",
    }
    resp = client.post("/api/scores/mock-tests", json=mock_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"

    # Kiểm tra recent events trên Event Bus xem có portfolio.stale không
    recent = event_bus.get_recent_events()
    stale_events = [e for e in recent if e["type"] == "portfolio.stale"]
    assert len(stale_events) >= 1
    assert stale_events[0]["status"] in ("enqueued", "processed")
