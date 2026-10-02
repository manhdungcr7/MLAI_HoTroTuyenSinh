"""Business domain event handlers for Nguyện Vọng AI.

Handlers xử lý các tác vụ ngầm khi có sự kiện:
- IngestionCompletedEvent: Ghi audit log, kích hoạt pipeline refresh
- DatasetUpdatedEvent: Zero-Downtime Hot Reload dữ liệu bộ nhớ `_state`
- PortfolioStaleEvent: Đánh dấu danh mục cần tính lại và lưu cảnh báo stale
- TelemetryEvent: Ghi bất đồng bộ vào `user_events` (Non-PII)
"""

from __future__ import annotations

import json
import logging
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from backend.app.events.schemas import DomainEvent

logger = logging.getLogger("events.handlers")

ROOT_DIR = Path(__file__).resolve().parents[3]
DB_PATH = ROOT_DIR / "backend" / "app" / "history.db"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"


def _ensure_audit_tables() -> None:
    """Khởi tạo bảng phụ trợ cho audit và stale tracking nếu chưa có."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_audit_logs (
            id TEXT PRIMARY KEY,
            batch_id TEXT,
            source TEXT NOT NULL,
            schools_count INTEGER,
            programs_count INTEGER,
            duration_seconds REAL,
            status TEXT NOT NULL,
            errors_json TEXT,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_stale_records (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            student_id TEXT,
            portfolio_id TEXT,
            reason TEXT NOT NULL,
            score_drift_delta REAL,
            stale_severity TEXT,
            details_json TEXT,
            resolved INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# Ensure tables on module load
try:
    _ensure_audit_tables()
except Exception as e:
    logger.warning(f"Could not init audit tables: {e}")


# ============================================================================
# 1. INGESTION COMPLETED HANDLER
# ============================================================================

async def handle_ingestion_completed(event: DomainEvent) -> None:
    """Xử lý khi pipeline cào hoặc nhập dữ liệu đề án hoàn tất."""
    payload = event.payload
    batch_id = payload.get("batch_id", event.id)
    source = payload.get("source", "crawler")
    schools_count = payload.get("schools_count", 0)
    programs_count = payload.get("programs_count", 0)
    duration_s = payload.get("duration_seconds", 0.0)
    status = payload.get("status", "success")
    errors = payload.get("errors", [])

    logger.info(
        f"[Handler:IngestionCompleted] Ingestion batch '{batch_id}' from '{source}' "
        f"completed with status={status}: {schools_count} schools, {programs_count} programs in {duration_s:.1f}s."
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO ingestion_audit_logs (
                id, batch_id, source, schools_count, programs_count,
                duration_seconds, status, errors_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.id,
            batch_id,
            source,
            schools_count,
            programs_count,
            duration_s,
            status,
            json.dumps(errors, ensure_ascii=False),
            now_iso,
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"[Handler:IngestionCompleted] Failed to record audit log: {e}")


# ============================================================================
# 2. DATASET UPDATED HANDLER (ZERO-DOWNTIME HOT RELOAD)
# ============================================================================

async def handle_dataset_updated(event: DomainEvent) -> None:
    """Hot-reload dữ liệu bộ nhớ `_state` của FastAPI khi có dataset điểm chuẩn mới."""
    payload = event.payload
    dataset_version = payload.get("dataset_version", "latest")
    total_updated = payload.get("total_programs_updated", 0)
    source = payload.get("source", "dataset-update")

    logger.info(
        f"[Handler:DatasetUpdated] Reloading memory state for version '{dataset_version}' "
        f"({total_updated} updated programs from {source})..."
    )

    parquet_path = PROCESSED_DIR / "programs.parquet"
    shock_path = PROCESSED_DIR / "national_shock.json"

    if not parquet_path.exists():
        logger.warning(f"[Handler:DatasetUpdated] Parquet file not found at {parquet_path}")
        return

    try:
        import pandas as pd
        from backend.app.main import _state

        df = pd.read_parquet(parquet_path)
        _state["programs"] = df.to_dict(orient="records")

        if shock_path.exists():
            _state["national_shock"] = json.loads(shock_path.read_text(encoding="utf-8"))

        n_schools = df["school_code"].nunique()
        quality_counts = df["data_quality"].value_counts().to_dict()
        _state["meta"] = {
            "n_programs": len(df),
            "n_schools": int(n_schools),
            "data_quality_distribution": quality_counts,
            "tuition_coverage": round(float(df["tuition_min_mvnd"].notna().mean()), 3),
            "employment_coverage": round(float(df["employment_rate_pct"].notna().mean()), 3),
            "dataset_version": dataset_version,
            "last_reloaded_at": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(
            f"[Handler:DatasetUpdated] Hot reload SUCCESS: {len(df):,} programs from {n_schools} schools in memory."
        )
    except Exception as e:
        logger.error(f"[Handler:DatasetUpdated] Hot reload failed: {e}")


# ============================================================================
# 3. PORTFOLIO STALE HANDLER
# ============================================================================

async def handle_portfolio_stale(event: DomainEvent) -> None:
    """Ghi nhận sự kiện Stale và chuẩn bị context tái tính toán Closed-Loop."""
    payload = event.payload
    user_id = payload.get("user_id")
    student_id = payload.get("student_id")
    portfolio_id = payload.get("portfolio_id")
    reason = payload.get("reason", "mock_score_updated")
    drift = payload.get("score_drift_delta", 0.0)
    severity = payload.get("stale_severity", "medium")

    logger.info(
        f"[Handler:PortfolioStale] Portfolio stale alert: portfolio_id={portfolio_id}, "
        f"user_id={user_id}, reason={reason}, drift={drift:+.2f}đ, severity={severity}"
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO portfolio_stale_records (
                id, user_id, student_id, portfolio_id, reason,
                score_drift_delta, stale_severity, details_json, resolved, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (
            event.id,
            user_id,
            student_id,
            portfolio_id,
            reason,
            drift,
            severity,
            json.dumps(payload, ensure_ascii=False),
            now_iso,
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"[Handler:PortfolioStale] Failed to record stale record: {e}")


# ============================================================================
# 4. TELEMETRY HANDLER (NON-PII ASYNC RECORDER)
# ============================================================================

async def handle_telemetry_event(event: DomainEvent) -> None:
    """Ghi nhận tương tác người dùng bất đồng bộ vào SQLite (Zero-PII)."""
    payload = event.payload
    event_id = event.id
    event_name = payload.get("event_name", "generic_interaction")
    session_id = payload.get("session_id", "anon-session")
    pseudo_user_id = payload.get("pseudo_user_id", "anon-user")
    page_route = payload.get("page_route", "/")
    entity_id = payload.get("entity_id")
    dwell_time_ms = payload.get("dwell_time_ms")
    meta_payload = payload.get("payload", {})
    shown_candidates = payload.get("shown_candidates", [])
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO user_events (
                id, session_id, pseudo_user_id, event_name, event_timestamp,
                page_route, entity_id, dwell_time_ms, payload_json,
                shown_candidates_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            session_id,
            pseudo_user_id,
            event_name,
            payload.get("event_timestamp", now_iso),
            page_route,
            entity_id,
            dwell_time_ms,
            json.dumps(meta_payload, ensure_ascii=False) if isinstance(meta_payload, (dict, list)) else str(meta_payload),
            json.dumps(shown_candidates, ensure_ascii=False) if isinstance(shown_candidates, list) else str(shown_candidates),
            now_iso,
        ))
        conn.commit()
        conn.close()
        logger.debug(f"[Handler:Telemetry] Recorded event '{event_name}' for {pseudo_user_id}")
    except Exception as e:
        logger.error(f"[Handler:Telemetry] Failed to record telemetry event: {e}")


def register_default_handlers(bus) -> None:
    """Đăng ký tất cả default domain handlers vào EventBus."""
    bus.subscribe("ingestion.completed", handle_ingestion_completed)
    bus.subscribe("dataset.updated", handle_dataset_updated)
    bus.subscribe("portfolio.stale", handle_portfolio_stale)
    bus.subscribe("telemetry.recorded", handle_telemetry_event)
    logger.info("[EventBus] Registered default domain handlers (ingestion, dataset, portfolio, telemetry).")
