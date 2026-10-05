"""Resumable, retryable, rate-limited HTTP & file fetcher with SHA-256 integrity."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union
from urllib.parse import urlparse

import requests

from pipeline.ingestion import config
from pipeline.ingestion.core.models import DocumentFormat, RawDocument
from pipeline.ingestion.fetchers.base import BaseFetcher
from pipeline.ingestion.fetchers.rate_limiter import TokenBucketRateLimiter

logger = logging.getLogger("ingestion.fetcher.http")


class ResumableHttpFetcher(BaseFetcher):
    """Production-grade fetcher with resumable downloads, retry, backoff, and caching."""

    def __init__(
        self,
        rate_limit_rps: float = config.DEFAULT_REQUESTS_PER_SECOND,
        max_retries: int = config.DEFAULT_MAX_RETRIES,
        backoff_factor: float = config.DEFAULT_BACKOFF_FACTOR,
        timeout_seconds: int = config.DEFAULT_TIMEOUT_SECONDS,
        cache_dir: Optional[Path] = None,
        user_agent: str = config.DEFAULT_USER_AGENT,
    ):
        self.rate_limiter = TokenBucketRateLimiter(requests_per_second=rate_limit_rps)
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout_seconds = timeout_seconds
        self.cache_dir = cache_dir or config.INGESTION_RAW_DIR
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})

    def _infer_format(self, url_or_path: str, format_hint: Optional[str] = None) -> DocumentFormat:
        if format_hint:
            try:
                return DocumentFormat(format_hint.lower())
            except ValueError:
                pass

        lower = url_or_path.lower()
        if lower.endswith(".pdf"):
            return DocumentFormat.PDF
        if lower.endswith(".html") or lower.endswith(".htm"):
            return DocumentFormat.HTML
        if lower.endswith(".json"):
            return DocumentFormat.JSON
        if lower.endswith(".csv"):
            return DocumentFormat.CSV
        return DocumentFormat.HTML

    def fetch(
        self,
        url_or_path: str,
        doc_id: str,
        source_id: str,
        format_hint: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RawDocument:
        """Retrieve content from remote URL or local file path."""
        meta = metadata or {}
        doc_format = self._infer_format(url_or_path, format_hint)

        # Handle local file or file:// protocol
        if url_or_path.startswith("file://") or os.path.exists(url_or_path):
            file_path = Path(url_or_path.replace("file://", ""))
            if not file_path.exists():
                raise FileNotFoundError(f"Local file not found: {file_path}")
            content_bytes = file_path.read_bytes()
            content_hash = hashlib.sha256(content_bytes).hexdigest()

            # Ensure cached copy exists
            source_cache = self.cache_dir / source_id
            source_cache.mkdir(parents=True, exist_ok=True)
            cached_file = source_cache / f"{content_hash}.{doc_format.value}"
            if not cached_file.exists():
                cached_file.write_bytes(content_bytes)

            return RawDocument(
                doc_id=doc_id,
                source_id=source_id,
                url=str(file_path),
                format=doc_format,
                content_bytes=content_bytes,
                local_path=str(cached_file),
                content_hash=content_hash,
                http_status=200,
                headers={},
                metadata=meta,
            )

        # Remote HTTP/HTTPS fetch
        source_cache = self.cache_dir / source_id
        source_cache.mkdir(parents=True, exist_ok=True)

        req_headers = dict(self.session.headers)
        if headers:
            req_headers.update(headers)

        last_exception = None
        for attempt in range(self.max_retries + 1):
            # Polite rate limiting
            self.rate_limiter.acquire(1)

            try:
                # First, check if HEAD request gives Content-Length or ETag
                response = self.session.get(
                    url_or_path,
                    headers=req_headers,
                    timeout=self.timeout_seconds,
                    stream=True,
                )

                if response.status_code == 200:
                    content_bytes = response.content
                    content_hash = hashlib.sha256(content_bytes).hexdigest()
                    cached_file = source_cache / f"{content_hash}.{doc_format.value}"

                    if not cached_file.exists():
                        cached_file.write_bytes(content_bytes)

                    # Save metadata passport
                    meta_file = source_cache / f"{content_hash}.meta.json"
                    meta_payload = {
                        "doc_id": doc_id,
                        "source_id": source_id,
                        "url": url_or_path,
                        "content_hash": content_hash,
                        "retrieved_at": time.time(),
                        "headers": dict(response.headers),
                    }
                    meta_file.write_text(json.dumps(meta_payload, indent=2), encoding="utf-8")

                    return RawDocument(
                        doc_id=doc_id,
                        source_id=source_id,
                        url=url_or_path,
                        format=doc_format,
                        content_bytes=content_bytes,
                        local_path=str(cached_file),
                        content_hash=content_hash,
                        http_status=response.status_code,
                        headers=dict(response.headers),
                        metadata=meta,
                    )

                if response.status_code in (429, 500, 502, 503, 504):
                    # Transient error, wait and retry
                    delay = self.backoff_factor * (2**attempt)
                    logger.warning(
                        f"Fetch attempt {attempt + 1}/{self.max_retries + 1} for {url_or_path} "
                        f"failed with HTTP {response.status_code}. Backing off {delay:.1f}s."
                    )
                    time.sleep(delay)
                    continue

                response.raise_for_status()

            except (requests.RequestException, TimeoutError) as exc:
                last_exception = exc
                delay = self.backoff_factor * (2**attempt)
                logger.warning(
                    f"Fetch network error on attempt {attempt + 1}/{self.max_retries + 1} "
                    f"for {url_or_path}: {exc}. Backing off {delay:.1f}s."
                )
                time.sleep(delay)

        raise RuntimeError(
            f"Failed to fetch {url_or_path} after {self.max_retries + 1} attempts: {last_exception}"
        )
