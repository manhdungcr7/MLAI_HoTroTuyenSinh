"""Tests for HTML, JSON, and PDF parsers without requiring network access."""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from pipeline.ingestion.core.models import DocumentFormat, RawDocument
from pipeline.ingestion.parsers.html_portal import HtmlPortalParser
from pipeline.ingestion.parsers.json_api import JsonApiParser

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "ingestion"


def test_html_portal_parser_with_table():
    html_file = FIXTURES_DIR / "sample_admission_table.html"
    assert html_file.exists(), f"Missing fixture {html_file}"

    content = html_file.read_bytes()
    raw_doc = RawDocument.from_content(
        doc_id="doc_test_html",
        source_id="university_portal",
        content=content,
        format=DocumentFormat.HTML,
        metadata={"school_code": "BKA"},
    )

    parser = HtmlPortalParser()
    records = parser.parse(raw_doc)

    assert len(records) >= 5
    first = records[0]
    assert first.school_raw == "BKA"
    assert "Công nghệ thông tin" in first.major_raw
    assert first.major_code_raw == "7480201"
    assert first.score_raw in (28.29, 28.53)
    assert first.quota_raw == "350"
    assert first.tuition_raw == "32.5"
    assert first.employment_raw == "98.5%"
    assert first.provenance_hash == raw_doc.content_hash


def test_json_api_parser_with_feed():
    json_file = FIXTURES_DIR / "sample_admission_feed.json"
    assert json_file.exists(), f"Missing fixture {json_file}"

    content = json_file.read_bytes()
    raw_doc = RawDocument.from_content(
        doc_id="doc_test_json",
        source_id="university_portal",
        content=content,
        format=DocumentFormat.JSON,
        metadata={"school_code": "BKA"},
    )

    parser = JsonApiParser()
    records = parser.parse(raw_doc)

    assert len(records) == 4
    first = records[0]
    assert first.school_raw == "BKA"
    assert first.major_code_raw == "7480201"
    assert "Khoa học Máy tính" in first.major_raw
    assert first.score_raw == 28.53
    assert first.year_raw == 2024
    assert first.quota_raw == 300
    assert first.tuition_raw == 30.0
    assert first.employment_raw == 0.98


def test_pdf_scheme_parser_with_pdf():
    pdf_file = FIXTURES_DIR / "sample_scheme.pdf"
    assert pdf_file.exists(), f"Missing fixture {pdf_file}"

    from pipeline.ingestion.parsers.pdf_scheme import PdfSchemeParser

    raw_doc = RawDocument.from_content(
        doc_id="doc_test_pdf",
        source_id="tuyensinh247",
        content=pdf_file.read_bytes(),
        format=DocumentFormat.PDF,
        local_path=str(pdf_file),
        metadata={"school_code": "BKA"},
    )

    parser = PdfSchemeParser()
    records = parser.parse(raw_doc)

    assert len(records) >= 3
    first = records[0]
    assert first.school_raw == "BKA"
    assert first.major_code_raw == "7480201"
    assert "Khoa hoc may tinh" in first.major_raw
    assert first.score_raw in (29.42, 28.53)
    assert first.provenance_hash == raw_doc.content_hash
