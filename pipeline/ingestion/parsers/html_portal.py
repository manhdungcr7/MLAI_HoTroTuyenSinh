"""HTML parser for university admission portals and score tables."""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup

from pipeline.ingestion.core.models import ExtractedRecord, RawDocument
from pipeline.ingestion.parsers.base import BaseParser

logger = logging.getLogger("ingestion.parser.html")

SCORE_PATTERN = re.compile(r"(\d{1,2}(?:[.,]\d{1,2})?)")
YEAR_HEADER_PATTERN = re.compile(r"(202[0-9])")
COMBO_PATTERN = re.compile(r"\b([A-D]\d{2})\b")
MAJOR_CODE_PATTERN = re.compile(r"\b(7\d{6}[A-Za-z]?|[A-Z]{1,3}\d{1,2})\b")


class HtmlPortalParser(BaseParser):
    """Parses HTML tables and admissions cards from official and secondary portals."""

    def __init__(self):
        pass

    def parse(self, raw_doc: RawDocument) -> List[ExtractedRecord]:
        records: List[ExtractedRecord] = []
        html_content = (
            raw_doc.content_bytes.decode("utf-8", errors="replace")
            if raw_doc.content_bytes
            else ""
        )
        if not html_content and raw_doc.local_path:
            with open(raw_doc.local_path, "r", encoding="utf-8", errors="replace") as f:
                html_content = f.read()

        if not html_content:
            return records

        soup = BeautifulSoup(html_content, "html.parser")
        school_code = raw_doc.metadata.get("school_code", raw_doc.source_id.upper())

        # 1. Parse tables
        tables = soup.find_all("table")
        for t_idx, table in enumerate(tables):
            rows = table.find_all("tr")
            if len(rows) < 2:
                continue

            # Analyze header
            header_row = rows[0]
            header_cells = [cell.get_text(strip=True) for cell in header_row.find_all(["th", "td"])]

            col_major_idx = None
            col_code_idx = None
            col_combo_idx = None
            col_quota_idx = None
            col_tuition_idx = None
            col_employment_idx = None
            year_cols: Dict[int, int] = {}

            for idx, col_text in enumerate(header_cells):
                lower = col_text.lower()
                if any(k in lower for k in ["mã ngành", "mã xét tuyển", "mã đkxt"]):
                    col_code_idx = idx
                elif any(k in lower for k in ["tên ngành", "tên chuyên ngành", "ngành đào tạo", "chương trình", "ngành học", "ngành"]):
                    col_major_idx = idx
                elif any(k in lower for k in ["tổ hợp", "khối"]):
                    col_combo_idx = idx
                elif "chỉ tiêu" in lower:
                    col_quota_idx = idx
                elif "học phí" in lower:
                    col_tuition_idx = idx
                elif "việc làm" in lower:
                    col_employment_idx = idx

                # Year detection in header
                year_match = YEAR_HEADER_PATTERN.search(col_text)
                if year_match:
                    year_val = int(year_match.group(1))
                    year_cols[year_val] = idx

            # If no year column was explicitly named, check doc metadata
            fallback_year = raw_doc.metadata.get("year", 2024)

            # Process data rows
            for row in rows[1:]:
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if not cells or len(cells) < 2:
                    continue

                major_name = cells[col_major_idx] if col_major_idx is not None and col_major_idx < len(cells) else ""
                major_code = cells[col_code_idx] if col_code_idx is not None and col_code_idx < len(cells) else None
                combo_str = cells[col_combo_idx] if col_combo_idx is not None and col_combo_idx < len(cells) else ""
                quota_str = cells[col_quota_idx] if col_quota_idx is not None and col_quota_idx < len(cells) else None
                tuition_str = cells[col_tuition_idx] if col_tuition_idx is not None and col_tuition_idx < len(cells) else None
                employment_str = cells[col_employment_idx] if col_employment_idx is not None and col_employment_idx < len(cells) else None

                # If major_name not found by index, look for longest string
                if not major_name:
                    text_cells = [c for c in cells if len(c) > 3 and not c.replace(".", "").isdigit()]
                    if text_cells:
                        major_name = text_cells[0]

                if not major_name or len(major_name) < 4:
                    continue

                # If year columns exist
                if year_cols:
                    for year, c_idx in year_cols.items():
                        if c_idx < len(cells):
                            score_text = cells[c_idx]
                            m = SCORE_PATTERN.search(score_text)
                            if m:
                                try:
                                    score = float(m.group(1).replace(",", "."))
                                    records.append(
                                        ExtractedRecord(
                                            raw_id=f"html_{uuid.uuid4().hex[:8]}",
                                            source_id=raw_doc.source_id,
                                            doc_id=raw_doc.doc_id,
                                            school_raw=school_code,
                                            major_raw=major_name,
                                            major_code_raw=major_code,
                                            score_raw=score,
                                            year_raw=year,
                                            combinations_raw=combo_str,
                                            quota_raw=quota_str,
                                            tuition_raw=tuition_str,
                                            employment_raw=employment_str,
                                            provenance_hash=raw_doc.content_hash,
                                        )
                                    )
                                except ValueError:
                                    pass
                else:
                    # Single year table, search all cells for score
                    for cell_text in cells:
                        m = SCORE_PATTERN.search(cell_text)
                        if m:
                            try:
                                score = float(m.group(1).replace(",", "."))
                                if 10.0 <= score <= 30.0:
                                    records.append(
                                        ExtractedRecord(
                                            raw_id=f"html_{uuid.uuid4().hex[:8]}",
                                            source_id=raw_doc.source_id,
                                            doc_id=raw_doc.doc_id,
                                            school_raw=school_code,
                                            major_raw=major_name,
                                            major_code_raw=major_code,
                                            score_raw=score,
                                            year_raw=fallback_year,
                                            combinations_raw=combo_str,
                                            quota_raw=quota_str,
                                            tuition_raw=tuition_str,
                                            employment_raw=employment_str,
                                            provenance_hash=raw_doc.content_hash,
                                        )
                                    )
                                    break
                            except ValueError:
                                pass

        return records
