"""Event Bus, Webhooks and Asynchronous Job Pipeline for Nguyện Vọng AI.

Package exports:
- EventBus, event_bus
- DomainEvent, IngestionCompletedEvent, DatasetUpdatedEvent, PortfolioStaleEvent, TelemetryEvent
- WebhookDeliveryRequest, WebhookDeliveryResponse, EventBusMetricsResponse
- compute_hmac_sha256, verify_hmac_signature, verify_timestamp_replay, idempotency_store
- router (FastAPI Webhook router)
- register_default_handlers
"""

from backend.app.events.schemas import (
    DomainEvent,
    IngestionCompletedPayload,
    IngestionCompletedEvent,
    DatasetUpdatedPayload,
    DatasetUpdatedEvent,
    PortfolioStalePayload,
    PortfolioStaleEvent,
    TelemetryPayload,
    TelemetryEvent,
    WebhookDeliveryRequest,
    WebhookDeliveryResponse,
    EventBusMetricsResponse,
)

from backend.app.events.security import (
    compute_hmac_sha256,
    verify_hmac_signature,
    verify_timestamp_replay,
    idempotency_store,
    get_webhook_secret,
)

from backend.app.events.bus import EventBus, event_bus

from backend.app.events.handlers import (
    handle_ingestion_completed,
    handle_dataset_updated,
    handle_portfolio_stale,
    handle_telemetry_event,
    register_default_handlers,
)

from backend.app.events.router import router as webhook_router

__all__ = [
    "DomainEvent",
    "IngestionCompletedPayload",
    "IngestionCompletedEvent",
    "DatasetUpdatedPayload",
    "DatasetUpdatedEvent",
    "PortfolioStalePayload",
    "PortfolioStaleEvent",
    "TelemetryPayload",
    "TelemetryEvent",
    "WebhookDeliveryRequest",
    "WebhookDeliveryResponse",
    "EventBusMetricsResponse",
    "compute_hmac_sha256",
    "verify_hmac_signature",
    "verify_timestamp_replay",
    "idempotency_store",
    "get_webhook_secret",
    "EventBus",
    "event_bus",
    "handle_ingestion_completed",
    "handle_dataset_updated",
    "handle_portfolio_stale",
    "handle_telemetry_event",
    "register_default_handlers",
    "webhook_router",
]
