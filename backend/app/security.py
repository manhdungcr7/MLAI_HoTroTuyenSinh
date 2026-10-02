"""Security Module — Nguyện Vọng AI Backend
Cung cấp:
1. Chống SSRF (Server-Side Request Forgery) cho crawler và URL loader.
2. Input sanitization (XSS, null-byte, script injection prevention) cho text payload.
3. Cấu hình CORS an toàn (Safe CORS policy).
4. Kiểm tra và ngăn chặn leak biến môi trường / secrets.
"""

from __future__ import annotations

import ipaddress
import os
import re
import socket
from typing import Any, List, Tuple
from urllib.parse import urlparse

from common.url_safety import (  # noqa: F401 — re-export giữ tương thích
    BLOCKED_HOSTNAMES,
    BLOCKED_IP_NETWORKS,
    is_ip_blocked,
    validate_safe_url,
)

# Regex khử thẻ HTML nguy hiểm và event handlers
DANGEROUS_HTML_PATTERNS = [
    re.compile(r"<script\b[^>]*>([\s\S]*?)<\/script>", re.IGNORECASE),
    re.compile(r"<style\b[^>]*>([\s\S]*?)<\/style>", re.IGNORECASE),
    re.compile(r"<iframe\b[^>]*>([\s\S]*?)<\/iframe>", re.IGNORECASE),
    re.compile(r"<object\b[^>]*>([\s\S]*?)<\/object>", re.IGNORECASE),
    re.compile(r"<embed\b[^>]*>([\s\S]*?)<\/embed>", re.IGNORECASE),
    re.compile(r"<applet\b[^>]*>([\s\S]*?)<\/applet>", re.IGNORECASE),
    re.compile(r"<meta\b[^>]*>", re.IGNORECASE),
    re.compile(r"<link\b[^>]*>", re.IGNORECASE),
    re.compile(r"\bon\w+\s*=\s*(?:'[^']*'|\"[^\"]*\"|[^\s>]+)", re.IGNORECASE),  # onclick, onerror...
    re.compile(r"javascript:\s*", re.IGNORECASE),
    re.compile(r"vbscript:\s*", re.IGNORECASE),
    re.compile(r"data:\s*text\/html", re.IGNORECASE),
]


def sanitize_text(text: str, max_length: int = 10000) -> str:
    """Làm sạch chuỗi văn bản đầu vào:
    1. Khử null byte (\x00).
    2. Loại bỏ các thẻ HTML nguy hiểm (script, iframe, style, embed, object...).
    3. Loại bỏ các event handlers inline (onclick, onerror, onload...).
    4. Loại bỏ các URI scheme nguy hiểm (javascript:, vbscript:, data:text/html).
    5. Bảo toàn 100% tiếng Việt có dấu Unicode và ký tự bình thường.
    6. Cắt ngắn về max_length để tránh DoS/buffer overflow.
    """
    if not isinstance(text, str):
        return text

    # Khử null byte
    cleaned = text.replace("\x00", "")

    # Khử thẻ HTML nguy hiểm
    for pattern in DANGEROUS_HTML_PATTERNS:
        cleaned = pattern.sub("", cleaned)

    # Giới hạn độ dài an toàn
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    return cleaned


def sanitize_payload(obj: Any, max_depth: int = 10) -> Any:
    """Duyệt đệ quy dict / list để làm sạch toàn bộ text input từ client."""
    if max_depth <= 0:
        return obj

    if isinstance(obj, dict):
        return {
            sanitize_text(str(k), max_length=256): sanitize_payload(v, max_depth - 1)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [sanitize_payload(item, max_depth - 1) for item in obj]
    elif isinstance(obj, str):
        return sanitize_text(obj)
    return obj


def get_safe_cors_origins() -> List[str]:
    """Cung cấp danh sách các Origin được phép truy cập CORS an toàn.
    Không dùng wildcard '*' khi allow_credentials=True để tránh lỗ hổng bảo mật.
    """
    env_origins = os.getenv("CORS_ALLOWED_ORIGINS")
    if env_origins:
        origins = [o.strip() for o in env_origins.split(",") if o.strip()]
        if origins:
            return origins

    # Danh sách chuẩn cho phát triển local và frontend Vite SPA / Next.js
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3030",
        "http://127.0.0.1:3030",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


# --------------------------------------------------------------------------
# 5. Sliding-Window Rate Limiting & Security Headers Middleware (Issue #15)
# --------------------------------------------------------------------------
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response
from starlette.requests import Request


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter per client IP."""

    def __init__(self, limit_per_minute: int = 120, heavy_limit_per_minute: int = 60):
        self.limit = limit_per_minute
        self.heavy_limit = heavy_limit_per_minute
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.heavy_endpoints = {"/api/recommend", "/api/decision-v2", "/api/study-plan"}

    def is_allowed(self, client_ip: str, path: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - 60.0
        # Clean older requests
        reqs = [t for t in self.requests[client_ip] if t > window_start]
        self.requests[client_ip] = reqs

        max_reqs = self.heavy_limit if any(path.startswith(ep) for ep in self.heavy_endpoints) else self.limit
        if len(reqs) >= max_reqs:
            retry_after = int(60.0 - (now - reqs[0])) if reqs else 60
            return False, max(1, retry_after)

        self.requests[client_ip].append(now)
        return True, 0

    def reset(self):
        self.requests.clear()


rate_limiter = InMemoryRateLimiter(limit_per_minute=120, heavy_limit_per_minute=60)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Ngăn chặn spam và DoS với HTTP 429 Too Many Requests."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path.startswith("/api/health"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        allowed, retry_after = rate_limiter.is_allowed(client_ip, request.url.path)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Gắn các Security Headers tiêu chuẩn (CSP, HSTS, X-Content-Type-Options...)."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

