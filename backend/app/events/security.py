"""Security primitives for Webhook receivers and Event Pipeline.

Includes:
- HMAC-SHA256 signature verification with constant-time comparison
- Timestamp replay protection with tolerance window
- SQLite-backed Idempotency engine with TTL and deduplication
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

# Default Secret for local dev / testing. In production, provide via WEBHOOK_SECRET env
DEFAULT_WEBHOOK_SECRET = "nguyen_vong_ai_webhook_secret_dev_2026"
DEFAULT_TOLERANCE_SECONDS = 300  # 5 minutes replay window
DEFAULT_IDEMPOTENCY_TTL_SECONDS = 86400  # 24 hours

ROOT_DIR = Path(__file__).resolve().parents[3]
DB_PATH = ROOT_DIR / "backend" / "app" / "history.db"


def get_webhook_secret() -> str:
    """Lấy Webhook secret từ môi trường hoặc secret mặc định."""
    return os.getenv("WEBHOOK_SECRET", DEFAULT_WEBHOOK_SECRET)


def compute_hmac_sha256(raw_body: bytes, secret: Optional[str] = None) -> str:
    """Tính toán chữ ký HMAC-SHA256 từ chuỗi byte thô."""
    secret_key = secret if secret is not None else get_webhook_secret()
    digest = hmac.new(secret_key.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return digest


def verify_hmac_signature(
    raw_body: bytes,
    signature_header: Optional[str],
    secret: Optional[str] = None,
) -> bool:
    """Xác minh chữ ký HMAC-SHA256 với timing-attack resistance (constant-time).
    
    Hỗ trợ format:
    - 'sha256=<hexdigest>'
    - '<hexdigest>'
    """
    if not signature_header:
        return False

    sig = signature_header.strip()
    if sig.startswith("sha256="):
        sig = sig[7:].strip()

    expected_sig = compute_hmac_sha256(raw_body, secret=secret)
    return hmac.compare_digest(sig.lower(), expected_sig.lower())


def verify_timestamp_replay(
    timestamp_header: Optional[str],
    tolerance_seconds: int = DEFAULT_TOLERANCE_SECONDS,
    current_time: Optional[float] = None,
) -> bool:
    """Kiểm tra chống tấn công phát lại (Replay Attack Protection).
    
    Header có thể là:
    - Unix epoch timestamp (dạng int/float giây hoặc mili giây)
    - Chuỗi thời gian chuẩn ISO-8601 UTC
    
    Yêu cầu: |t_request - t_current| <= tolerance_seconds.
    """
    if not timestamp_header:
        return False

    now = current_time if current_time is not None else time.time()

    ts_val: float
    try:
        # Thử parse epoch number
        raw = float(timestamp_header.strip())
        # Nếu lớn hơn 10^11 thì khả năng là milliseconds
        if raw > 1e11:
            raw = raw / 1000.0
        ts_val = raw
    except ValueError:
        # Thử parse ISO-8601
        try:
            iso_str = timestamp_header.strip()
            if iso_str.endswith("Z"):
                iso_str = iso_str[:-1] + "+00:00"
            dt = datetime.fromisoformat(iso_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            ts_val = dt.timestamp()
        except Exception:
            return False

    drift = abs(now - ts_val)
    return drift <= tolerance_seconds


# ============================================================================
# SQLITE-BACKED IDEMPOTENCY ENGINE
# ============================================================================

class IdempotencyStore:
    """Kho lưu trữ trạng thái Idempotency trên SQLite đảm bảo Exactly-Once / At-Most-Once.
    
    Hỗ trợ lock thread-safe và tự động dọn dẹp các key đã hết hạn (TTL).
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._ensure_table()

    def _ensure_table(self) -> None:
        """Đảm bảo bảng webhook_idempotency tồn tại."""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("""
                CREATE TABLE IF NOT EXISTS webhook_idempotency (
                    idempotency_key TEXT PRIMARY KEY,
                    event_id TEXT,
                    event_type TEXT,
                    request_hash TEXT,
                    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
                    response_json TEXT,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL
                )
            """)
            c.execute("""
                CREATE INDEX IF NOT EXISTS idx_idempotency_expires 
                ON webhook_idempotency(expires_at)
            """)
            conn.commit()
            conn.close()

    def check_or_reserve(
        self,
        idempotency_key: str,
        request_hash: str,
        event_id: Optional[str] = None,
        event_type: Optional[str] = None,
        ttl_seconds: int = DEFAULT_IDEMPOTENCY_TTL_SECONDS,
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Kiểm tra khóa idempotency.
        
        Returns:
            (is_new, cached_response)
            - is_new = True: Key mới hoặc đã hết hạn, đã reserve thành công ('processing').
            - is_new = False: Key đã tồn tại (duplicate). Nếu status='completed', cached_response
              chứa dữ liệu kết quả trước đó.
        """
        now = time.time()
        expires_at = now + ttl_seconds

        with self._lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            # Xóa các key đã hết hạn trước đó
            c.execute("DELETE FROM webhook_idempotency WHERE expires_at < ?", (now,))

            c.execute("""
                SELECT status, response_json, request_hash 
                FROM webhook_idempotency 
                WHERE idempotency_key = ?
            """, (idempotency_key,))
            row = c.fetchone()

            if row is not None:
                status, resp_json, stored_hash = row
                conn.close()
                cached_data = None
                if resp_json:
                    try:
                        cached_data = json.loads(resp_json)
                    except Exception:
                        cached_data = {"raw": resp_json}
                return False, cached_data

            # Chưa có -> reserve với status 'processing'
            c.execute("""
                INSERT INTO webhook_idempotency (
                    idempotency_key, event_id, event_type, request_hash,
                    status, response_json, created_at, expires_at
                ) VALUES (?, ?, ?, ?, 'processing', NULL, ?, ?)
            """, (idempotency_key, event_id, event_type, request_hash, now, expires_at))
            conn.commit()
            conn.close()
            return True, None

    def mark_completed(self, idempotency_key: str, response_data: Dict[str, Any]) -> None:
        """Đánh dấu request idempotency đã hoàn tất thành công kèm kết quả trả về."""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("""
                UPDATE webhook_idempotency
                SET status = 'completed', response_json = ?
                WHERE idempotency_key = ?
            """, (json.dumps(response_data, ensure_ascii=False), idempotency_key))
            conn.commit()
            conn.close()

    def mark_failed(self, idempotency_key: str, error_message: str) -> None:
        """Đánh dấu request idempotency thất bại để có thể retry sau."""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("""
                UPDATE webhook_idempotency
                SET status = 'failed', response_json = ?
                WHERE idempotency_key = ?
            """, (json.dumps({"error": error_message}, ensure_ascii=False), idempotency_key))
            conn.commit()
            conn.close()

    def clear(self) -> None:
        """Xóa toàn bộ bản ghi idempotency (dùng cho unit test)."""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("DELETE FROM webhook_idempotency")
            conn.commit()
            conn.close()


# Global default instance
idempotency_store = IdempotencyStore()
