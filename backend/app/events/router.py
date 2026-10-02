"""FastAPI Webhook & Event Ingestion Router.

Endpoints:
- POST /api/webhooks/events: Tiếp nhận DomainEvent từ các dịch vụ ngoài hoặc microservices với
  xác thực HMAC-SHA256, kiểm tra Replay Attack và Idempotency.
- POST /api/webhooks/crawler: Endpoint chuyên dụng cho pipeline cào đề án tuyển sinh.
- GET /api/webhooks/metrics: Giám sát trạng thái Event Bus & Background Worker.
- GET /api/webhooks/history: Xem lịch sử event vừa xử lý.
- GET /api/webhooks/dead-letter: Kiểm tra các event lỗi đưa vào DLQ.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from backend.app.events.bus import event_bus
from backend.app.events.schemas import (
    DatasetUpdatedEvent,
    DomainEvent,
    EventBusMetricsResponse,
    IngestionCompletedEvent,
    WebhookDeliveryResponse,
)
from backend.app.events.security import (
    compute_hmac_sha256,
    idempotency_store,
    verify_hmac_signature,
    verify_timestamp_replay,
)

logger = logging.getLogger("events.router")
router = APIRouter(prefix="/api/webhooks", tags=["Webhooks & Events"])

# Cấu hình bảo mật qua biến môi trường
REQUIRE_HMAC = os.getenv("WEBHOOK_REQUIRE_HMAC", "true").lower() in ("true", "1", "yes")
REQUIRE_TIMESTAMP = os.getenv("WEBHOOK_REQUIRE_TIMESTAMP", "true").lower() in ("true", "1", "yes")


class CrawlerWebhookPayload(BaseModel):
    """Payload từ crawler/ingestion pipeline."""
    batch_id: Optional[str] = None
    source: str = Field(default="dean_pdfs_crawler", description="Source identifier")
    schools_count: int = Field(default=0, ge=0)
    programs_count: int = Field(default=0, ge=0)
    files_processed: int = Field(default=0, ge=0)
    duration_seconds: float = Field(default=0.0, ge=0.0)
    status: str = Field(default="success")
    errors: List[str] = Field(default_factory=list)
    dataset_version: Optional[str] = None
    auto_trigger_dataset_updated: bool = Field(
        default=True, description="Automatically trigger dataset.updated if success"
    )


@router.post(
    "/events",
    response_model=WebhookDeliveryResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Tiếp nhận Domain Event an toàn qua Webhook",
)
async def receive_webhook_event(
    request: Request,
    response: Response,
    x_webhook_signature: Optional[str] = Header(None, alias="x-webhook-signature"),
    x_signature_256: Optional[str] = Header(None, alias="x-signature-256"),
    x_hub_signature_256: Optional[str] = Header(None, alias="x-hub-signature-256"),
    x_webhook_timestamp: Optional[str] = Header(None, alias="x-webhook-timestamp"),
    x_timestamp: Optional[str] = Header(None, alias="x-timestamp"),
    x_idempotency_key: Optional[str] = Header(None, alias="x-idempotency-key"),
):
    """Tiếp nhận và xác thực Webhook:
    1. Kiểm tra Replay Attack qua timestamp (tolerance window 300s).
    2. Kiểm tra chữ ký số HMAC-SHA256 constant-time.
    3. Kiểm tra tính lũy thừa (Idempotency) để chống duplicate side-effects.
    4. Đẩy sự kiện vào Event Bus để xử lý bất đồng bộ trong background.
    """
    raw_body = await request.body()
    if not raw_body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty request body",
        )

    # 1. Replay Protection
    timestamp_hdr = x_webhook_timestamp or x_timestamp
    if timestamp_hdr is not None:
        if not verify_timestamp_replay(timestamp_hdr):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook timestamp outside acceptable tolerance window (replay protection)",
            )
    elif REQUIRE_TIMESTAMP and not os.getenv("TESTING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required timestamp header (X-Webhook-Timestamp)",
        )

    # 2. HMAC-SHA256 Verification
    sig_hdr = x_webhook_signature or x_signature_256 or x_hub_signature_256
    if REQUIRE_HMAC:
        if not sig_hdr:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing webhook HMAC signature header (X-Webhook-Signature)",
            )
        if not verify_hmac_signature(raw_body, sig_hdr):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook HMAC-SHA256 signature",
            )

    # Parse JSON body thành DomainEvent
    try:
        data = json.loads(raw_body.decode("utf-8"))
        # Hỗ trợ cả { "event": { ... } } và direct { "type": ..., "payload": ... }
        if "event" in data and isinstance(data["event"], dict):
            event_obj = DomainEvent.model_validate(data["event"])
        else:
            event_obj = DomainEvent.model_validate(data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Malformed DomainEvent schema: {e}",
        )

    # 3. Idempotency Check
    idempotency_key = (
        x_idempotency_key
        or event_obj.idempotency_key
        or event_obj.id
    )
    req_hash = hashlib.sha256(raw_body).hexdigest()

    is_new, cached_data = idempotency_store.check_or_reserve(
        idempotency_key=idempotency_key,
        request_hash=req_hash,
        event_id=event_obj.id,
        event_type=event_obj.type,
    )

    if not is_new:
        response.headers["X-Cache"] = "HIT-IDEMPOTENT"
        response.status_code = status.HTTP_200_OK
        logger.info(f"[Webhook] Duplicate request for idempotency key '{idempotency_key}' (cached replay).")
        return WebhookDeliveryResponse(
            status="duplicate",
            event_id=event_obj.id,
            event_type=event_obj.type,
            message="Event already processed (idempotent replay)",
            idempotent_replay=True,
        )

    # 4. Enqueue Event onto Event Bus
    try:
        await event_bus.publish(event_obj)
        resp_payload = {
            "status": "accepted",
            "event_id": event_obj.id,
            "event_type": event_obj.type,
            "message": f"Event '{event_obj.type}' accepted for background processing",
            "idempotent_replay": False,
        }
        idempotency_store.mark_completed(idempotency_key, resp_payload)
        response.headers["X-Cache"] = "MISS"
        return WebhookDeliveryResponse(**resp_payload)
    except Exception as exc:
        idempotency_store.mark_failed(idempotency_key, str(exc))
        logger.exception(f"[Webhook] Failed to enqueue event {event_obj.id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish event: {exc}",
        )


@router.post(
    "/crawler",
    response_model=WebhookDeliveryResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Webhook dành riêng cho Crawler/Scraper Ingestion Pipeline",
)
async def crawler_pipeline_webhook(
    request: Request,
    payload: CrawlerWebhookPayload,
    x_webhook_signature: Optional[str] = Header(None, alias="x-webhook-signature"),
):
    """Endpoint thuận tiện nhận thông báo khi crawler chạy xong."""
    raw_body = await request.body()
    # Luôn bắt buộc chữ ký HMAC: không có chữ ký = không chấp nhận sự kiện ingestion
    if not x_webhook_signature or not verify_hmac_signature(raw_body, x_webhook_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid crawler webhook signature",
        )

    # 1. Phát IngestionCompletedEvent
    ingestion_event = IngestionCompletedEvent.create(
        batch_id=payload.batch_id,
        source=payload.source,
        schools_count=payload.schools_count,
        programs_count=payload.programs_count,
        files_processed=payload.files_processed,
        duration_seconds=payload.duration_seconds,
        status=payload.status,  # type: ignore
        errors=payload.errors,
    )
    await event_bus.publish(ingestion_event)

    # 2. Nếu thành công và có cờ auto_trigger -> phát DatasetUpdatedEvent
    if payload.status == "success" and payload.auto_trigger_dataset_updated:
        dataset_event = DatasetUpdatedEvent.create(
            dataset_version=payload.dataset_version or f"v{payload.batch_id or 'latest'}",
            total_programs_updated=payload.programs_count,
            source=f"crawler:{payload.source}",
            changes_summary=f"Crawled {payload.schools_count} schools, {payload.programs_count} programs",
        )
        await event_bus.publish(dataset_event)

    return WebhookDeliveryResponse(
        status="accepted",
        event_id=ingestion_event.id,
        event_type=ingestion_event.type,
        message="Crawler ingestion event received and dispatched to background pipeline.",
    )


@router.get(
    "/metrics",
    response_model=EventBusMetricsResponse,
    summary="Xem chỉ số vận hành của Event Bus & Worker",
)
def get_event_bus_metrics():
    """Xem số lượng event trong hàng đợi, đã xử lý, lỗi và subscribers."""
    metrics = event_bus.get_metrics()
    return EventBusMetricsResponse(**metrics)


@router.get(
    "/history",
    summary="Xem danh sách event được xử lý gần đây",
)
def get_event_history(limit: int = 50):
    """Lấy log chẩn đoán các event gần nhất từ ring-buffer."""
    events = event_bus.get_recent_events()
    return {"total": len(events), "events": events[:limit]}


@router.get(
    "/dead-letter",
    summary="Kiểm tra Dead-Letter Queue (DLQ)",
)
def get_dead_letter_queue():
    """Danh sách các event xử lý thất bại sau nhiều lần thử lại."""
    dlq = event_bus.get_dead_letter_events()
    return {"count": len(dlq), "dead_letters": dlq}
