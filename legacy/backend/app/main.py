"""Nguyện Vọng AI API.

Tư vấn chọn ngành cho học sinh lớp 12: từ điểm và điều kiện của học sinh, tính xác suất đỗ cho từng
ngành của từng trường theo phương thức có lợi nhất rồi xếp thứ tự (xem backend/app/advisor.py).
Dữ liệu là catalog điểm chuẩn từ đề án tuyển sinh công khai do pipeline sinh ra; không có dữ liệu giả.
"""

from __future__ import annotations

import hashlib
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from common import admission_core as core  # noqa: E402
from backend.app.advisor import catalog, router as advisor_router, shock_parameters  # noqa: E402
from backend.app.security import (  # noqa: E402
    RateLimitingMiddleware,
    SecurityHeadersMiddleware,
    get_safe_cors_origins,
)
from backend.app.logging_config import StructuredLoggingMiddleware  # noqa: E402

_START_TIME = datetime.now(timezone.utc)

app = FastAPI(
    title="Nguyện Vọng AI API",
    description="Tư vấn chọn ngành đại học theo xác suất đỗ, tính theo quy tắc từng phương thức xét tuyển.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_safe_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Request-ID", "X-Process-Time-Ms"],
)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitingMiddleware)
app.include_router(advisor_router)


def _correlation_id(request: Request) -> str:
    return getattr(request.state, "correlation_id", None) or request.headers.get("X-Correlation-ID") or str(uuid.uuid4())


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    cid = _correlation_id(request)
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "error_code": f"HTTP_{exc.status_code}", "detail": exc.detail, "correlation_id": cid},
        headers={"X-Correlation-ID": cid, "X-Request-ID": cid},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    cid = _correlation_id(request)
    return JSONResponse(
        status_code=422,
        content={"status": "error", "error_code": "VALIDATION_ERROR", "detail": exc.errors(), "correlation_id": cid},
        headers={"X-Correlation-ID": cid, "X-Request-ID": cid},
    )


def _catalog_stats() -> dict:
    programs = catalog()
    by_method: dict[str, int] = {}
    for p in programs:
        by_method[p["admissionMethod"]] = by_method.get(p["admissionMethod"], 0) + 1
    return {
        "n_programs": len(programs),
        "n_schools": len({p["schoolCode"] for p in programs}),
        "programs_by_method": by_method,
        "tuition_coverage": round(sum(p["tuitionVnd"] is not None for p in programs) / max(1, len(programs)), 3),
        "employment_coverage": round(sum(p["employmentRate"] is not None for p in programs) / max(1, len(programs)), 3),
        "verified_combinations": round(sum(p["combinationsVerified"] for p in programs) / max(1, len(programs)), 3),
        "schools_with_own_rules": len(core.registered_school_rules()),
    }


def _known_gaps(stats: dict) -> list[str]:
    """Giới hạn dữ liệu tính từ số liệu thật đang nạp, không viết cứng."""
    return [
        f"Mới có {stats['n_schools']} trường với điểm chuẩn công bố trong đề án tuyển sinh; nhiều trường chưa có dữ liệu.",
        f"Học phí xác thực cho {round(100 * stats['tuition_coverage'])}% chương trình, tỷ lệ việc làm cho "
        f"{round(100 * stats['employment_coverage'])}%; phần thiếu được ghi rõ, không điền số ước đoán.",
        f"Chỉ {round(100 * stats['verified_combinations'])}% chương trình có tổ hợp xét tuyển được ghi cạnh điểm chuẩn; "
        "phần còn lại tính theo tổ hợp tốt nhất của học sinh và được gắn cờ cần kiểm tra.",
        f"Mới {stats['schools_with_own_rules']} trường có quy tắc tính điểm riêng đã kiểm chứng; "
        "các trường còn lại dùng công thức chung (tổng điểm tổ hợp + ưu tiên theo quy chế).",
        "Xác suất đỗ mới tính được cho điểm thi THPT, học bạ và các phương thức có quy tắc riêng của trường; "
        "ĐGNL, năng khiếu, tuyển thẳng và xét kết hợp chưa có dữ liệu cùng thang điểm để so sánh.",
    ]


@app.get("/api/health")
def health_check() -> dict:
    """Liveness: tiến trình API đang chạy."""
    return {
        "status": "ok",
        "service": "nguyen-vong-ai-backend",
        "version": "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round((datetime.now(timezone.utc) - _START_TIME).total_seconds(), 2),
        **{k: v for k, v in _catalog_stats().items() if k in ("n_programs", "n_schools")},
    }


@app.get("/api/health/ready")
def readiness_check(response: Response) -> dict:
    """Readiness: catalog đã nạp và có tham số biến động điểm chuẩn."""
    checks: dict[str, dict] = {}
    try:
        n = len(catalog())
        checks["catalog"] = {"status": "ok" if n > 0 else "empty", "programs": n}
    except HTTPException:
        checks["catalog"] = {"status": "missing_file"}
    shock = shock_parameters()
    checks["national_shock"] = {"status": "ok", "overall_std": shock[0], "idio_std": shock[1]}
    ready = all(c["status"] == "ok" for c in checks.values())
    if not ready:
        response.status_code = 503
    return {"status": "ready" if ready else "not_ready", "ready": ready, "timestamp": datetime.now(timezone.utc).isoformat(), "checks": checks}


@app.get("/api/health/data")
def data_provenance_check() -> dict:
    """Nguồn gốc và độ tươi của dữ liệu đang phục vụ."""
    path = core.DEFAULT_CATALOG_PATH
    if not path.exists():
        raise HTTPException(status_code=503, detail="Catalog chương trình chưa được tạo")
    raw = json.loads(path.read_text(encoding="utf-8"))
    stats = _catalog_stats()
    years = sorted({int(y) for item in raw for y in (item.get("cutoffs") or {})})
    return {
        "dataset": path.name,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "file_size_bytes": path.stat().st_size,
        "last_updated": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
        "record_count": stats["n_programs"],
        "schools_count": stats["n_schools"],
        "admission_years": [str(y) for y in years],
        "source": "Đề án tuyển sinh đại học công khai của từng trường (PDF và cổng thông tin chính thức), qua pipeline làm sạch có kiểm tra.",
        "quality": {k: v for k, v in stats.items() if k.endswith("coverage") or k == "verified_combinations"},
    }


@app.get("/api/meta")
def meta() -> dict:
    """Thống kê và giới hạn dữ liệu, để người dùng biết mức tin cậy."""
    stats = _catalog_stats()
    overall_std, idio_std = shock_parameters()
    return {
        **stats,
        "national_shock": {"overall_std": overall_std, "idio_std_overall": idio_std},
        "data_source": "Đề án tuyển sinh công khai của từng trường.",
        "known_gaps": _known_gaps(stats),
    }
