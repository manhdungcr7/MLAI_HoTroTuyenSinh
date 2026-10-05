"""Parser for Vietnamese official university admission scheme (Đề án tuyển sinh) PDFs.

Extracts cutoff score tables (Layout A and Layout B), tuition tables, and employment tables.
"""

from __future__ import annotations

import io
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

import pdfplumber

from pipeline.ingestion.core.models import ExtractedRecord, RawDocument
from pipeline.ingestion.parsers.base import BaseParser

logger = logging.getLogger("ingestion.parser.pdf")

YEAR_HEADER_RE = re.compile(r"N[ăa]m\s*20(2[0-9])", re.IGNORECASE)
SCORE_TOKEN_RE = re.compile(r"(?<!\d)(\d{1,2}(?:[.,]\d{1,2})?)(?!\d)")
COMBO_TOKEN_RE = re.compile(r"\b([A-D]\d{2})\b")
MAJOR_CODE_RE = re.compile(r"7\d{6}[A-Za-z]?")


class PdfSchemeParser(BaseParser):
    """Parses multi-page admission scheme PDFs using pdfplumber with layout detection."""

    def __init__(self):
        pass

    def _clean_text(self, cell: Any) -> str:
        if not cell:
            return ""
        return str(cell).replace("\n", " ").strip()

    def _extract_header_layout(self, table: List[List[Any]]) -> Optional[Dict[int, Dict[str, int]]]:
        """Scans the first 3 rows of a table to map column indices to admission years."""
        header_rows = table[: min(4, len(table))]
        year_to_cols: Dict[int, Dict[str, int]] = {}

        # Look for "Năm 202X" in headers
        for r_idx, row in enumerate(header_rows):
            for c_idx, cell in enumerate(row):
                text = self._clean_text(cell)
                m = YEAR_HEADER_RE.search(text)
                if m:
                    year = 2000 + int(m.group(1))
                    if year not in year_to_cols:
                        year_to_cols[year] = {"score": c_idx}

        # Check sub-headers if multiple rows (e.g. Chỉ tiêu | Trúng tuyển | Điểm trúng tuyển)
        if len(header_rows) >= 2:
            for r in header_rows[1:]:
                for c_idx, cell in enumerate(r):
                    text = self._clean_text(cell).lower()
                    if "điểm" in text or "diem" in text:
                        # find which year column group this belongs to
                        closest_year = None
                        min_dist = 999
                        for y, mapping in year_to_cols.items():
                            dist = c_idx - mapping["score"]
                            if 0 <= dist < min_dist:
                                min_dist = dist
                                closest_year = y
                        if closest_year:
                            year_to_cols[closest_year]["score"] = c_idx

        return year_to_cols if year_to_cols else None

    def parse(self, raw_doc: RawDocument) -> List[ExtractedRecord]:
        records: List[ExtractedRecord] = []
        school_code = raw_doc.metadata.get("school_code", raw_doc.source_id.upper())

        # Load PDF via local file path or in-memory bytes
        pdf_source = raw_doc.local_path or (
            io.BytesIO(raw_doc.content_bytes) if raw_doc.content_bytes else None
        )
        if not pdf_source:
            logger.error(f"Cannot parse PDF doc {raw_doc.doc_id}: no file or content bytes")
            return records

        try:
            with pdfplumber.open(pdf_source) as pdf:
                for page_idx, page in enumerate(pdf.pages, start=1):
                    tables = page.extract_tables()
                    if not tables:
                        continue

                    for table in tables:
                        if not table or len(table) < 2:
                            continue

                        header_map = self._extract_header_layout(table)
                        if not header_map:
                            continue

                        # Header found! Process body rows
                        current_major_label = ""
                        current_major_code = None

                        for row in table[1:]:
                            if not row or not any(row):
                                continue

                            first_cells_text = " ".join(self._clean_text(c) for c in row[:3])
                            if any(k in first_cells_text.lower() for k in ["điểm trúng tuyển", "tên ngành", "mã ngành"]):
                                continue

                            # Detect major code
                            code_match = MAJOR_CODE_RE.search(first_cells_text)
                            if code_match:
                                current_major_code = code_match.group(0)

                            # Determine major label
                            # Usually col 1 or 2 is Major Name
                            potential_names = [self._clean_text(c) for c in row[1:3] if self._clean_text(c)]
                            if potential_names:
                                for name in potential_names:
                                    if len(name) > 3 and not name.isdigit():
                                        current_major_label = name
                                        break

                            if not current_major_label:
                                continue

                            # Extract combinations
                            combos = COMBO_TOKEN_RE.findall(" ".join(self._clean_text(c) for c in row))
                            combo_str = ",".join(sorted(set(combos))) if combos else None

                            # Extract scores for each year mapped in header
                            for year, col_map in header_map.items():
                                score_col = col_map.get("score")
                                if score_col is not None and score_col < len(row):
                                    cell_val = self._clean_text(row[score_col])
                                    # Look for float or decimal score
                                    score_matches = SCORE_TOKEN_RE.findall(cell_val)
                                    if score_matches:
                                        raw_score_str = score_matches[0].replace(",", ".")
                                        try:
                                            score_val = float(raw_score_str)
                                        except ValueError:
                                            continue

                                        rec_id = f"ext_{uuid.uuid4().hex[:8]}"
                                        records.append(
                                            ExtractedRecord(
                                                raw_id=rec_id,
                                                source_id=raw_doc.source_id,
                                                doc_id=raw_doc.doc_id,
                                                school_raw=school_code,
                                                major_raw=current_major_label,
                                                major_code_raw=current_major_code,
                                                score_raw=score_val,
                                                year_raw=year,
                                                combinations_raw=combo_str,
                                                method_raw="THPT",
                                                page_number=page_idx,
                                                section_name="Bảng điểm trúng tuyển",
                                                provenance_hash=raw_doc.content_hash,
                                            )
                                        )

        except Exception as exc:
            logger.error(f"Error extracting PDF table from doc {raw_doc.doc_id}: {exc}")

        return records
