"""Structured Logging & Correlation ID Module — Nguyện Vọng AI Backend
Cung cấp:
1. ContextVar lưu trữ correlation_id theo từng request (async context-safe).
2. JSONFormatter định dạng log theo cấu trúc JSON chuẩn máy đọc được.
3. StructuredLoggingMiddleware cho FastAPI ghi log access latency & gán header.
"""

from __future__ import annotations

import contextvars
import json
import logging
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variable lưu trữ correlation_id của request hiện tại
_CORRELATION_ID_CTX: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "correlation_id", default=None
)


def get_correlation_id() -> Optional[str]:
    """Lấy correlation_id của request hiện tại trong async context."""
    return _CORRELATION_ID_CTX.get()


def set_correlation_id(correlation_id: str) -> None:
    """Thiết lập correlation_id cho async context hiện tại."""
    _CORRELATION_ID_CTX.set(correlation_id)


class JSONLogFormatter(logging.Formatter):
    """Formatter chuyển đổi mọi log record thành chuỗi JSON một dòng."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Bổ sung correlation_id nếu có
        cid = getattr(record, "correlation_id", None) or get_correlation_id()
        if cid:
            log_data["correlation_id"] = cid

        # Bổ sung các thông số hiệu năng HTTP nếu có
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "client_ip"):
            log_data["client_ip"] = record.client_ip

        # Exception stack trace nếu xảy ra lỗi
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


def setup_logger(name: str = "backend.app", level: int = logging.INFO) -> logging.Logger:
    """Khởi tạo logger sử dụng JSONFormatter."""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Tránh duplicate handlers nếu hàm được gọi nhiều lần
    if not any(isinstance(h.formatter, JSONLogFormatter) for h in logger.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONLogFormatter())
        logger.addHandler(handler)
        logger.propagate = False

    return logger


logger = setup_logger()


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware trích xuất/tạo Correlation ID, đo thời gian xử lý và ghi structured log."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 1. Trích xuất hoặc khởi tạo Correlation ID
        cid = (
            request.headers.get("X-Correlation-ID")
            or request.headers.get("X-Request-ID")
            or str(uuid.uuid4())
        )
        set_correlation_id(cid)
        request.state.correlation_id = cid

        # 2. Thu thập thông tin client
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        # 3. Đo đạc thời gian xử lý chính xác cao
        start_time = time.perf_counter()

        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            logger.error(
                f"Unhandled exception during {method} {path}: {exc}",
                exc_info=True,
                extra={"correlation_id": cid, "method": method, "path": path, "client_ip": client_ip},
            )
            raise
        finally:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Gán header phản hồi cho client truy vết
            if "response" in locals():
                response.headers["X-Correlation-ID"] = cid
                response.headers["X-Process-Time-Ms"] = str(duration_ms)

            # Ghi structured access log
            extra_fields = {
                "correlation_id": cid,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
            }
            logger.info(
                f"{method} {path} - {status_code} ({duration_ms}ms)",
                extra=extra_fields,
            )
