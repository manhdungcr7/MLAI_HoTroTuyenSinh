"""Schema compliance and typing validator."""

from __future__ import annotations

from typing import List, Set

from pipeline.ingestion.core.models import NormalizedProgramRecord, ValidationResult
from pipeline.ingestion.validators.base import BaseValidator

VALID_MAJOR_GROUPS: Set[str] = {
    "cntt", "ky_thuat", "kinh_te", "luat", "ngon_ngu", "y_duoc",
    "su_pham", "xa_hoi", "du_lich", "nong_lam", "kien_truc", "the_thao"
}

VALID_REGIONS: Set[str] = {"bac", "trung", "nam"}


class SchemaValidator(BaseValidator):
    """Enforces structural schema and field integrity."""

    def validate(self, record: NormalizedProgramRecord) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Non-empty critical identifiers
        if not record.school_code or len(record.school_code) < 2:
            errors.append(f"Invalid school_code: '{record.school_code}'")

        if not record.major_name or len(record.major_name) < 3:
            errors.append(f"Invalid major_name: '{record.major_name}'")

        if not record.program_key or "::" not in record.program_key:
            errors.append(f"Malformed program_key: '{record.program_key}'")

        # 2. Enum & domain taxonomy checks
        if record.major_group not in VALID_MAJOR_GROUPS:
            errors.append(f"Invalid major_group: '{record.major_group}', must be one of {VALID_MAJOR_GROUPS}")

        if record.school_region not in VALID_REGIONS:
            errors.append(f"Invalid school_region: '{record.school_region}'")

        if record.school_tier not in (1, 2, 3):
            errors.append(f"Invalid school_tier: {record.school_tier}, must be 1, 2, or 3")

        # 3. Content hash check
        if not record.content_hash or len(record.content_hash) < 16:
            errors.append("Missing or truncated content_hash (SHA-256 requirement)")

        # 4. Warnings for missing enrichment
        if not record.combinations:
            warnings.append("No subject combinations specified")

        if record.tuition_min_mvnd is None:
            warnings.append("Missing tuition disclosure")

        if record.employment_rate_pct is None:
            warnings.append("Missing employment rate disclosure")

        return ValidationResult(
            is_valid=(len(errors) == 0),
            record_key=record.program_key,
            errors=errors,
            warnings=warnings,
            sanitized_record=record if len(errors) == 0 else None,
        )
