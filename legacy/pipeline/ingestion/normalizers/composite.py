"""Composite normalizer that joins School, Major, and Score standardizers."""

from __future__ import annotations

import json
from typing import Optional

from common.data_passport import (
    DataPassport,
    ExtractionMethod,
    SourceType,
    VerificationStatus,
)
from pipeline.ingestion.core.models import (
    ExtractedRecord,
    NormalizedProgramRecord,
)
from pipeline.ingestion.normalizers.base import BaseNormalizer
from pipeline.ingestion.normalizers.major_code import MajorCodeNormalizer
from pipeline.ingestion.normalizers.school import SchoolNormalizer
from pipeline.ingestion.normalizers.score import ScoreNormalizer


class ProgramNormalizer(BaseNormalizer):
    """Integrates school, major code, score, and combo normalization into a canonical record."""

    def normalize(self, record: ExtractedRecord) -> Optional[NormalizedProgramRecord]:
        # 1. Resolve school metadata
        school_info = SchoolNormalizer.resolve_school(record.school_raw)

        # 2. Clean major name and extract MoET 7-digit code
        cleaned_major = MajorCodeNormalizer.clean_major_name(record.major_raw)
        if not cleaned_major:
            return None

        moet_code = MajorCodeNormalizer.extract_and_validate_code(
            record.major_code_raw, record.major_raw
        )

        # 3. Infer major group (1 of 12)
        major_group, is_high_conf = MajorCodeNormalizer.infer_major_group(
            moet_code, cleaned_major
        )

        # 4. Normalize score and combinations
        norm_score, orig_score, scale = ScoreNormalizer.normalize_score(record.score_raw)
        if norm_score is None:
            return None

        combos = ScoreNormalizer.parse_combinations(record.combinations_raw)

        # 5. Parse numerical attributes
        quota_val = None
        if record.quota_raw is not None:
            try:
                quota_val = int(float(str(record.quota_raw).replace(",", ".")))
            except (ValueError, TypeError):
                pass

        tuition_min = None
        if record.tuition_raw is not None:
            try:
                tuition_min = float(str(record.tuition_raw).replace(",", "."))
            except (ValueError, TypeError):
                pass

        emp_rate = None
        if record.employment_raw is not None:
            try:
                emp_val = float(str(record.employment_raw).replace("%", "").replace(",", "."))
                emp_rate = emp_val if emp_val <= 1.0 else emp_val / 100.0
            except (ValueError, TypeError):
                pass

        # 6. Parse admission year
        try:
            year_val = int(record.year_raw) if record.year_raw else 2024
        except (ValueError, TypeError):
            year_val = 2024

        # 7. Evaluate Data Quality Label
        has_tuition = tuition_min is not None
        has_emp = emp_rate is not None
        if has_tuition and has_emp:
            quality = "day_du"
        else:
            quality = "thieu_mot_phan"

        # 8. Generate Data Passport
        passport = DataPassport(
            source_type=SourceType.OFFICIAL_PDF if "pdf" in record.source_id.lower() else SourceType.OFFICIAL_WEB,
            source_url=None,
            publisher=school_info.canonical_name,
            document_title=f"Đề án / Điểm chuẩn Tuyển sinh năm {year_val}",
            page_number=record.page_number,
            section=record.section_name or "Bảng điểm trúng tuyển",
            raw_value=str(record.score_raw),
            normalized_value=norm_score,
            extraction_method=ExtractionMethod.HEURISTIC_TABLE if "pdf" in record.source_id.lower() else ExtractionMethod.REGEX,
            verification_status=VerificationStatus.CROSS_CHECKED,
            confidence=0.95 if is_high_conf else 0.85,
            content_hash=record.provenance_hash,
            parser_version="pipeline.ingestion@2.0.0",
        )

        program_key = f"{school_info.code}::{cleaned_major.lower()}"

        return NormalizedProgramRecord(
            program_key=program_key,
            school_code=school_info.code,
            school_name=school_info.canonical_name,
            school_province=school_info.province,
            school_region=school_info.region,
            school_tier=school_info.tier,
            major_code=moet_code,
            major_name=cleaned_major,
            major_group=major_group,
            admission_year=year_val,
            cutoff_score=norm_score,
            original_score=orig_score,
            score_scale=scale,
            combinations=combos,
            admission_method=record.method_raw or "THPT",
            quota=quota_val,
            tuition_min_mvnd=tuition_min,
            tuition_max_mvnd=tuition_min,
            employment_rate_pct=emp_rate,
            data_quality=quality,
            is_estimated=False,
            source_id=record.source_id,
            content_hash=record.provenance_hash,
            data_passport_json=passport.model_dump_json(),
        )
