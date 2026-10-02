"""Business domain integrity and statistical anomaly validator."""

from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

from pipeline.ingestion import config
from pipeline.ingestion.core.models import NormalizedProgramRecord, ValidationResult
from pipeline.ingestion.validators.base import BaseValidator


class IntegrityValidator(BaseValidator):
    """Enforces domain constraints, plausible ranges, and flags statistical anomalies."""

    def __init__(
        self,
        min_score: float = config.MIN_PLAUSIBLE_SCORE,
        max_score: float = config.MAX_PLAUSIBLE_SCORE,
        min_year: int = config.MIN_VALID_YEAR,
        max_year: int = config.MAX_VALID_YEAR,
        max_delta_shock: float = config.MAX_DELTA_SHOCK_THRESHOLD,
    ):
        self.min_score = min_score
        self.max_score = max_score
        self.min_year = min_year
        self.max_year = max_year
        self.max_delta_shock = max_delta_shock

    def validate(self, record: NormalizedProgramRecord) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Cutoff score plausibility on standard 30-point scale
        if record.cutoff_score < self.min_score:
            errors.append(
                f"Score {record.cutoff_score} is below minimum plausible threshold ({self.min_score}) "
                "— likely an index, table artifact, or corrupted text"
            )
        elif record.cutoff_score > self.max_score:
            errors.append(
                f"Score {record.cutoff_score} exceeds maximum 30-point scale ({self.max_score}) "
                "— unnormalized scale"
            )

        # 2. Admission year sanity
        if record.admission_year < self.min_year or record.admission_year > self.max_year:
            errors.append(
                f"Admission year {record.admission_year} outside valid range [{self.min_year}, {self.max_year}]"
            )

        # 3. Employment rate bounds
        if record.employment_rate_pct is not None:
            if not (0.0 <= record.employment_rate_pct <= 1.0):
                errors.append(
                    f"Employment rate {record.employment_rate_pct} must be ratio within [0.0, 1.0]"
                )

        # 4. Tuition sanity
        if record.tuition_min_mvnd is not None:
            if record.tuition_min_mvnd < 0.0 or record.tuition_min_mvnd > config.MAX_TUITION_MVND:
                errors.append(
                    f"Tuition {record.tuition_min_mvnd}M VNĐ outside plausible range [0.0, {config.MAX_TUITION_MVND}]"
                )

        # 5. Quota sanity
        if record.quota is not None and record.quota <= 0:
            warnings.append(f"Suspicious zero or negative quota: {record.quota}")

        return ValidationResult(
            is_valid=(len(errors) == 0),
            record_key=record.program_key,
            errors=errors,
            warnings=warnings,
            sanitized_record=record if len(errors) == 0 else None,
        )

    def validate_batch_anomalies(
        self, records: List[NormalizedProgramRecord]
    ) -> Tuple[List[NormalizedProgramRecord], List[str]]:
        """
        Runs global batch-level checks:
        1. Duplicate key collision: (program_key, admission_year, method)
        2. Cross-year score delta shock: flag delta > threshold between consecutive years
        """
        seen_keys: Set[Tuple[str, int, str]] = set()
        deduped: List[NormalizedProgramRecord] = []
        anomalies: List[str] = []

        # Track history per program to check shock
        program_history: Dict[str, Dict[int, float]] = {}

        for rec in records:
            key = (rec.program_key, rec.admission_year, rec.admission_method)
            if key in seen_keys:
                anomalies.append(f"Duplicate entry dropped: {key}")
                continue
            seen_keys.add(key)
            deduped.append(rec)

            if rec.program_key not in program_history:
                program_history[rec.program_key] = {}
            program_history[rec.program_key][rec.admission_year] = rec.cutoff_score

        # Check delta shock between consecutive years
        for p_key, years_dict in program_history.items():
            sorted_years = sorted(years_dict.keys())
            for i in range(len(sorted_years) - 1):
                y1 = sorted_years[i]
                y2 = sorted_years[i + 1]
                if y2 == y1 + 1:  # consecutive years
                    delta = abs(years_dict[y2] - years_dict[y1])
                    if delta > self.max_delta_shock:
                        anomalies.append(
                            f"Abnormal delta shock on {p_key}: {delta:.2f} points between {y1} and {y2}"
                        )

        return deduped, anomalies
