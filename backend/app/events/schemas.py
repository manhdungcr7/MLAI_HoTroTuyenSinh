"""Enterprise Domain Event Schemas for Nguyện Vọng AI.

Chuẩn hóa các sự kiện nghiệp vụ bất đồng bộ (Domain Events) tuân theo
CloudEvents / Enterprise Event Schema:
- IngestionCompletedEvent
- DatasetUpdatedEvent
- PortfolioStaleEvent
- TelemetryEvent
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============================================================================
# BASE DOMAIN EVENT
# ============================================================================

class DomainEvent(BaseModel):
    """Event schema chuẩn mực của hệ thống.
    
    Attributes:
        id: Unique identifier của event (UUID v4)
        type: Mã định danh loại sự kiện (e.g., 'ingestion.completed', 'portfolio.stale')
        version: Phiên bản schema của event (mặc định '1.0')
        occurred_at: Thời điểm phát sinh sự kiện theo chuẩn ISO-8601 UTC
        payload: Dữ liệu chi tiết của sự kiện (dictionary linh hoạt)
        producer: Nguồn phát sinh sự kiện (crawler, backend, ui-client, background-worker)
        trace_id: ID truy vết luồng phân tán (distributed tracing)
        idempotency_key: Khóa chống trùng lặp xử lý (nếu có)
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique event identifier")
    type: str = Field(..., description="Event type identifier, e.g. ingestion.completed")
    version: str = Field(default="1.0", description="Schema version")
    occurred_at: str = Field(default_factory=_now_iso, description="ISO-8601 UTC timestamp")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Event specific payload")
    producer: str = Field(default="nguyen-vong-ai-backend", description="Source producer identifier")
    trace_id: Optional[str] = Field(default=None, description="Distributed tracing identifier")
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for deduplication")


# ============================================================================
# 1. INGESTION COMPLETED EVENT
# ============================================================================

class IngestionCompletedPayload(BaseModel):
    """Payload khi pipeline cào hoặc nhập dữ liệu đề án tuyển sinh hoàn tất."""
    batch_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Batch identifier")
    source: str = Field(..., description="Data source name (e.g. 'dean_pdfs_crawler', 'tuyensinh247', 'manual_import')")
    files_processed: int = Field(default=0, ge=0, description="Number of files/PDFs processed")
    schools_count: int = Field(default=0, ge=0, description="Total universities ingested")
    programs_count: int = Field(default=0, ge=0, description="Total academic programs ingested")
    duration_seconds: float = Field(default=0.0, ge=0.0, description="Pipeline run duration in seconds")
    status: Literal["success", "partial", "failure"] = Field(default="success", description="Batch status")
    errors: List[str] = Field(default_factory=list, description="Errors or warnings encountered")
    artefact_path: Optional[str] = Field(default=None, description="Path to generated parquet or json")
    checksum_sha256: Optional[str] = Field(default=None, description="SHA256 checksum of generated dataset")


class IngestionCompletedEvent(DomainEvent):
    """Sự kiện phát sinh sau khi crawler hoặc pipeline cào đề án tuyển sinh hoàn tất."""
    type: str = Field(default="ingestion.completed")
    payload: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def create(
        cls,
        source: str,
        schools_count: int,
        programs_count: int,
        duration_seconds: float = 0.0,
        status: Literal["success", "partial", "failure"] = "success",
        files_processed: int = 0,
        errors: Optional[List[str]] = None,
        artefact_path: Optional[str] = None,
        checksum_sha256: Optional[str] = None,
        batch_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> "IngestionCompletedEvent":
        p = IngestionCompletedPayload(
            batch_id=batch_id or str(uuid.uuid4()),
            source=source,
            files_processed=files_processed,
            schools_count=schools_count,
            programs_count=programs_count,
            duration_seconds=duration_seconds,
            status=status,
            errors=errors or [],
            artefact_path=artefact_path,
            checksum_sha256=checksum_sha256,
        )
        return cls(
            type="ingestion.completed",
            payload=p.model_dump(),
            idempotency_key=idempotency_key,
        )


# ============================================================================
# 2. DATASET UPDATED EVENT
# ============================================================================

class DatasetUpdatedPayload(BaseModel):
    """Payload khi dữ liệu điểm chuẩn, chỉ tiêu hoặc national shock được cập nhật mới."""
    dataset_version: str = Field(..., description="New dataset version tag, e.g. 'v2026.09.1' or commit hash")
    year: int = Field(default=2026, description="Target admission year")
    affected_school_codes: List[str] = Field(default_factory=list, description="Schools with updated cutoffs")
    total_programs_updated: int = Field(default=0, ge=0, description="Count of updated programs")
    update_type: Literal["full_refresh", "delta_update", "shock_recalculated"] = Field(
        default="full_refresh", description="Nature of dataset update"
    )
    source: str = Field(default="pipeline.clean.reconcile", description="Triggering source")
    changes_summary: Optional[str] = Field(default=None, description="Human-readable changelog summary")


class DatasetUpdatedEvent(DomainEvent):
    """Sự kiện phát sinh khi điểm chuẩn mới được nạp vào hệ thống.
    
    Kích hoạt:
    - Zero-Downtime Hot Reload biến bộ nhớ _state['programs'] trong FastAPI
    - Đánh dấu các danh mục nguyện vọng (portfolio) đang lưu bị stale
    """
    type: str = Field(default="dataset.updated")
    payload: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def create(
        cls,
        dataset_version: str,
        year: int = 2026,
        affected_school_codes: Optional[List[str]] = None,
        total_programs_updated: int = 0,
        update_type: Literal["full_refresh", "delta_update", "shock_recalculated"] = "full_refresh",
        source: str = "pipeline",
        changes_summary: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> "DatasetUpdatedEvent":
        p = DatasetUpdatedPayload(
            dataset_version=dataset_version,
            year=year,
            affected_school_codes=affected_school_codes or [],
            total_programs_updated=total_programs_updated,
            update_type=update_type,
            source=source,
            changes_summary=changes_summary,
        )
        return cls(
            type="dataset.updated",
            payload=p.model_dump(),
            idempotency_key=idempotency_key,
        )


# ============================================================================
# 3. PORTFOLIO STALE EVENT
# ============================================================================

class PortfolioStalePayload(BaseModel):
    """Payload khi danh mục 15 nguyện vọng bị lỗi thời do điểm thi thử hoặc điểm chuẩn thay đổi."""
    user_id: Optional[str] = Field(default=None, description="User ID if authenticated")
    student_id: Optional[str] = Field(default=None, description="Student profile ID")
    portfolio_id: Optional[str] = Field(default=None, description="Saved scenario or portfolio ID")
    reason: Literal["mock_score_updated", "dataset_updated", "weight_reallocated", "manual_refresh"] = Field(
        ..., description="Root cause of staleness"
    )
    previous_scores: Dict[str, Optional[float]] = Field(default_factory=dict, description="Old score map")
    new_scores: Dict[str, Optional[float]] = Field(default_factory=dict, description="New updated score map")
    score_drift_delta: float = Field(default=0.0, description="Score change in primary combination")
    affected_combinations: List[str] = Field(default_factory=list, description="Affected subject groups (e.g. A00, D01)")
    stale_severity: Literal["low", "medium", "high"] = Field(
        default="medium", description="Impact on pass probabilities"
    )
    recommendation_stale: bool = Field(default=True, description="Whether recalculation is strongly advised")


class PortfolioStaleEvent(DomainEvent):
    """Sự kiện phát sinh khi điểm thi thử thay đổi làm thay đổi xác suất trúng tuyển.
    
    Kích hoạt:
    - Đánh dấu trạng thái Stale trên UI
    - Kích hoạt Closed-Loop Recommendation Engine tính toán lại danh mục
    - Gửi thông báo/gợi ý điều chỉnh chiến lược Reach / Target / Safety
    """
    type: str = Field(default="portfolio.stale")
    payload: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def create(
        cls,
        reason: Literal["mock_score_updated", "dataset_updated", "weight_reallocated", "manual_refresh"],
        user_id: Optional[str] = None,
        student_id: Optional[str] = None,
        portfolio_id: Optional[str] = None,
        previous_scores: Optional[Dict[str, Optional[float]]] = None,
        new_scores: Optional[Dict[str, Optional[float]]] = None,
        score_drift_delta: float = 0.0,
        affected_combinations: Optional[List[str]] = None,
        stale_severity: Literal["low", "medium", "high"] = "medium",
        idempotency_key: Optional[str] = None,
    ) -> "PortfolioStaleEvent":
        p = PortfolioStalePayload(
            user_id=user_id,
            student_id=student_id,
            portfolio_id=portfolio_id,
            reason=reason,
            previous_scores=previous_scores or {},
            new_scores=new_scores or {},
            score_drift_delta=score_drift_delta,
            affected_combinations=affected_combinations or [],
            stale_severity=stale_severity,
        )
        return cls(
            type="portfolio.stale",
            payload=p.model_dump(),
            idempotency_key=idempotency_key,
        )


# ============================================================================
# 4. TELEMETRY EVENT
# ============================================================================

class TelemetryPayload(BaseModel):
    """Payload ghi nhận tương tác người dùng, hoàn toàn không PII (Zero-PII Privacy)."""
    event_name: str = Field(..., description="Action name, e.g. 'program_card_expanded', 'what_if_slider_changed'")
    session_id: str = Field(..., description="Ephemeral session UUID")
    pseudo_user_id: str = Field(..., description="Salted hash or anonymous token — NO email/phone/real name")
    page_route: str = Field(..., description="Application path, e.g. '/dashboard', '/options'")
    entity_id: Optional[str] = Field(default=None, description="Interacted school code, major code or task ID")
    dwell_time_ms: Optional[int] = Field(default=None, ge=0, description="Dwell / view time in milliseconds")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Metadata parameters (strictly non-PII)")
    shown_candidates: List[str] = Field(
        default_factory=list, description="IDs of candidates displayed at that moment (for Inverse Propensity Scoring)"
    )
    privacy_asserted: bool = Field(default=True, description="Strict assertion that no PII is included")


class TelemetryEvent(DomainEvent):
    """Sự kiện ghi nhận hành vi tương tác client không chứa thông tin định danh (Non-PII).
    
    Phục vụ:
    - Data Flywheel tối ưu hóa bảng xếp hạng theo Inverse Propensity Scoring (IPS)
    - Phân tích luồng ra quyết định của học sinh
    """
    type: str = Field(default="telemetry.recorded")
    payload: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def create(
        cls,
        event_name: str,
        session_id: str,
        pseudo_user_id: str,
        page_route: str,
        entity_id: Optional[str] = None,
        dwell_time_ms: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
        shown_candidates: Optional[List[str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> "TelemetryEvent":
        p = TelemetryPayload(
            event_name=event_name,
            session_id=session_id,
            pseudo_user_id=pseudo_user_id,
            page_route=page_route,
            entity_id=entity_id,
            dwell_time_ms=dwell_time_ms,
            payload=payload or {},
            shown_candidates=shown_candidates or [],
            privacy_asserted=True,
        )
        return cls(
            type="telemetry.recorded",
            payload=p.model_dump(),
            idempotency_key=idempotency_key,
        )


# ============================================================================
# WEBHOOK TRANSPORT SCHEMAS
# ============================================================================

class WebhookDeliveryRequest(BaseModel):
    """Envelop cho webhook delivery."""
    event: DomainEvent = Field(..., description="The domain event being delivered")


class WebhookDeliveryResponse(BaseModel):
    """Phản hồi sau khi tiếp nhận webhook."""
    status: Literal["accepted", "processed", "duplicate", "failed"] = "accepted"
    event_id: str
    event_type: str
    message: str
    processed_at: str = Field(default_factory=_now_iso)
    idempotent_replay: bool = False


class EventBusMetricsResponse(BaseModel):
    """Thống kê vận hành của Event Bus."""
    is_running: bool
    queue_size: int
    total_published: int
    total_processed: int
    total_failed: int
    dead_letter_count: int
    subscribers_count: Dict[str, int]
    uptime_seconds: float
