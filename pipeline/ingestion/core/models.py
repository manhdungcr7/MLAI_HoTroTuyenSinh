"""Domain and data transfer models for the Ingestion Engine.

Follows strict typing, Pydantic v2 validation, and links to DataPassport SSOT.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator


class IngestionStage(str, Enum):
    FETCH = "fetch"
    PARSE = "parse"
    NORMALIZE = "normalize"
    VALIDATE = "validate"
    STAGE = "stage"
    PUBLISH = "publish"


class DocumentFormat(str, Enum):
    PDF = "pdf"
    HTML = "html"
    JSON = "json"
    CSV = "csv"
    TEXT = "text"


class RawDocument(BaseModel):
    """Raw payload retrieved from upstream sources before parsing."""

    doc_id: str
    source_id: str
    url: Optional[str] = None
    format: DocumentFormat
    content_bytes: Optional[bytes] = Field(default=None, exclude=True)
    local_path: Optional[str] = None
    content_hash: str = Field(
        ..., description="SHA-256 hash of the exact retrieved content"
    )
    http_status: Optional[int] = None
    headers: Dict[str, str] = Field(default_factory=dict)
    retrieved_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_content(
        cls,
        doc_id: str,
        source_id: str,
        content: Union[bytes, str],
        format: DocumentFormat,
        url: Optional[str] = None,
        local_path: Optional[Union[str, Path]] = None,
        headers: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RawDocument:
        content_bytes = (
            content.encode("utf-8") if isinstance(content, str) else content
        )
        content_hash = hashlib.sha256(content_bytes).hexdigest()
        return cls(
            doc_id=doc_id,
            source_id=source_id,
            url=url,
            format=format,
            content_bytes=content_bytes,
            local_path=str(local_path) if local_path else None,
            content_hash=content_hash,
            headers=headers or {},
            metadata=metadata or {},
        )


class ExtractedRecord(BaseModel):
    """Raw record directly extracted by a parser before normalization."""

    raw_id: str
    source_id: str
    doc_id: str
    school_raw: str
    major_raw: str
    major_code_raw: Optional[str] = None
    score_raw: Optional[Union[float, str]] = None
    year_raw: Optional[Union[int, str]] = None
    combinations_raw: Optional[str] = None
    method_raw: Optional[str] = None
    quota_raw: Optional[Union[int, float, str]] = None
    tuition_raw: Optional[Union[float, str]] = None
    employment_raw: Optional[Union[float, str]] = None
    page_number: Optional[int] = None
    section_name: Optional[str] = None
    extraction_notes: Optional[str] = None
    provenance_hash: str


class NormalizedProgramRecord(BaseModel):
    """Clean, canonical, domain-compliant program admission record."""

    program_key: str  # Format: {school_code}::{canonical_major_name}
    school_code: str  # Canonical uppercase, e.g. "BKA", "QHE", "NEU"
    school_name: str
    school_province: str
    school_region: Literal["bac", "trung", "nam"]
    school_tier: int = Field(default=2, ge=1, le=3)

    major_code: Optional[str] = None  # 7-digit MoET code or null
    major_name: str
    major_group: str  # cntt, kinh_te, ky_thuat, etc.

    admission_year: int
    cutoff_score: float  # Normalized to 30.0 scale
    original_score: Optional[float] = None
    score_scale: float = 30.0

    combinations: List[str] = Field(default_factory=list)
    admission_method: str = "THPT"

    quota: Optional[int] = None
    tuition_min_mvnd: Optional[float] = None
    tuition_max_mvnd: Optional[float] = None
    employment_rate_pct: Optional[float] = None

    data_quality: Literal["day_du", "thieu_mot_phan", "chi_1_nam", "uoc_luong"] = (
        "day_du"
    )
    is_estimated: bool = False
    source_id: str
    content_hash: str
    data_passport_json: Optional[str] = None


class ValidationResult(BaseModel):
    """Result of running schema and integrity validation on a record."""

    is_valid: bool
    record_key: str
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    sanitized_record: Optional[NormalizedProgramRecord] = None


class IngestionRunSummary(BaseModel):
    """Comprehensive summary and telemetry of an ingestion execution."""

    run_id: str
    source_name: str
    stage: IngestionStage = IngestionStage.PUBLISH
    status: Literal["success", "partial_success", "failed"] = "success"
    started_at: str
    finished_at: Optional[str] = None
    duration_seconds: float = 0.0

    documents_fetched: int = 0
    records_parsed: int = 0
    records_normalized: int = 0
    records_valid: int = 0
    records_rejected: int = 0
    anomalies_detected: int = 0

    staged_path: Optional[str] = None
    published_path: Optional[str] = None
    error_messages: List[str] = Field(default_factory=list)


class DataQualityMetrics(BaseModel):
    """Aggregated dataset quality metrics for reporting and verification."""

    total_programs: int = 0
    distinct_schools: int = 0
    distinct_majors: int = 0
    coverage_tuition_pct: float = 0.0
    coverage_employment_pct: float = 0.0
    coverage_combinations_pct: float = 0.0
    quality_breakdown: Dict[str, int] = Field(default_factory=dict)
    provenance_integrity_pct: float = 100.0
