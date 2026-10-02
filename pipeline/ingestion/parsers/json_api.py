"""JSON API parser for structured university endpoints and open data payloads."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from pipeline.ingestion.core.models import ExtractedRecord, RawDocument
from pipeline.ingestion.parsers.base import BaseParser

logger = logging.getLogger("ingestion.parser.json")


class JsonApiParser(BaseParser):
    """Parses JSON payloads containing admission, quota, cutoff, or tuition lists."""

    def __init__(self):
        pass

    def parse(self, raw_doc: RawDocument) -> List[ExtractedRecord]:
        records: List[ExtractedRecord] = []
        raw_str = (
            raw_doc.content_bytes.decode("utf-8")
            if raw_doc.content_bytes
            else ""
        )
        if not raw_str and raw_doc.local_path:
            with open(raw_doc.local_path, "r", encoding="utf-8") as f:
                raw_str = f.read()

        if not raw_str:
            return records

        try:
            data = json.loads(raw_str)
        except Exception as exc:
            logger.error(f"Failed to decode JSON document {raw_doc.doc_id}: {exc}")
            return records

        # Handle list of items or nested {"data": [...]}
        items = data if isinstance(data, list) else data.get("data", data.get("programs", []))
        if not isinstance(items, list):
            items = [data]

        default_school = raw_doc.metadata.get("school_code", raw_doc.source_id.upper())

        for item in items:
            if not isinstance(item, dict):
                continue

            school = item.get("school_code", item.get("school_name", default_school))
            major = item.get("major_name", item.get("name", item.get("major_raw", "")))
            code = item.get("major_code", item.get("code", None))
            year = item.get("year", item.get("admission_year", 2024))
            score = item.get("cutoff_score", item.get("score", item.get("benchmark", None)))
            combos = item.get("combinations", item.get("combinations_seen", None))
            if isinstance(combos, list):
                combos = ",".join(combos)

            quota = item.get("quota", None)
            tuition = item.get("tuition_min_mvnd", item.get("tuition_2024", None))
            employment = item.get("employment_rate", item.get("employment_rate_pct", None))

            if not major or score is None:
                # Might have historical cutoffs dict: {"2021": 28.0, "2022": 28.5}
                cutoffs_by_year = item.get("cutoffs", item.get("cutoff_by_year", {}))
                if isinstance(cutoffs_by_year, dict) and major:
                    for yr, sc in cutoffs_by_year.items():
                        records.append(
                            ExtractedRecord(
                                raw_id=f"json_{uuid.uuid4().hex[:8]}",
                                source_id=raw_doc.source_id,
                                doc_id=raw_doc.doc_id,
                                school_raw=str(school),
                                major_raw=str(major),
                                major_code_raw=str(code) if code else None,
                                score_raw=float(sc) if sc is not None else None,
                                year_raw=int(yr) if str(yr).isdigit() else 2024,
                                combinations_raw=str(combos) if combos else None,
                                quota_raw=quota,
                                tuition_raw=tuition,
                                employment_raw=employment,
                                provenance_hash=raw_doc.content_hash,
                            )
                        )
                continue

            records.append(
                ExtractedRecord(
                    raw_id=f"json_{uuid.uuid4().hex[:8]}",
                    source_id=raw_doc.source_id,
                    doc_id=raw_doc.doc_id,
                    school_raw=str(school),
                    major_raw=str(major),
                    major_code_raw=str(code) if code else None,
                    score_raw=float(score) if score is not None else None,
                    year_raw=int(year) if str(year).isdigit() else 2024,
                    combinations_raw=str(combos) if combos else None,
                    quota_raw=quota,
                    tuition_raw=tuition,
                    employment_raw=employment,
                    provenance_hash=raw_doc.content_hash,
                )
            )

        return records
