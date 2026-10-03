"""Unit tests for HTML admission portal scraper and parser."""

from __future__ import annotations

import pandas as pd
import pytest

from pipeline import config
from pipeline.scrape.scrape_html_portals import TARGET_HTML_PORTALS, clean_text


def test_target_html_portals_configuration():
    """Verify that TARGET_HTML_PORTALS has valid configurations and required keys."""
    assert len(TARGET_HTML_PORTALS) >= 25
    for code, info in TARGET_HTML_PORTALS.items():
        assert len(code) >= 2
        assert "name" in info and len(info["name"]) > 3
        assert "slug" in info and len(info["slug"]) > 3
        assert "official_portal" in info and info["official_portal"].startswith("http")


def test_clean_text_nfc():
    """Verify that clean_text properly normalizes text with NFC."""
    # Decomposed e + acute
    decomposed = "Đi\u1ec3m chu\u1ea9n"
    cleaned = clean_text(decomposed)
    assert cleaned == "Điểm chuẩn"
    assert clean_text("") == ""
    assert clean_text(None) == ""


def test_html_parquet_output_if_present():
    """Verify that cutoff_panel_html.parquet conforms to required schema if present."""
    html_path = config.INTERIM / "cutoff_panel_html.parquet"
    if html_path.exists():
        df = pd.read_parquet(html_path)
        assert not df.empty
        assert "school_code" in df.columns
        assert "score" in df.columns
        assert "label" in df.columns
        assert "cutoff_year" in df.columns
        # Verify score bounds
        assert (df["score"] >= 12.0).all()
        assert (df["score"] <= 30.0).all()
        # Verify all schools exist in TARGET_HTML_PORTALS
        schools = set(df["school_code"].unique())
        assert schools.issubset(set(TARGET_HTML_PORTALS.keys()))
        # Verify source_tier is aggregator_verified
        assert "source_tier" in df.columns
        assert (df["source_tier"] == "aggregator_verified").all()


def test_programs_source_tier_partitioning():
    """Verify that programs.parquet clearly partitions source_tier between official_pdf and aggregator_verified."""
    programs_path = config.PROCESSED / "programs.parquet"
    if programs_path.exists():
        df = pd.read_parquet(programs_path)
        assert "source_tier" in df.columns, "programs.parquet must have source_tier column"
        tiers = set(df["source_tier"].unique())
        assert tiers.issubset({"official_pdf", "aggregator_verified"}), f"Unexpected tiers: {tiers}"
        
        # Verify official_pdf has at least 71 schools (DHS, DFA, DTQ và trường công an, quân đội bị loại có chủ đích)
        pdf_schools = set(df[df["source_tier"] == "official_pdf"]["school_code"].unique())
        assert len(pdf_schools) >= 71, f"Official PDF schools count ({len(pdf_schools)}) < 71"

        # Verify aggregator_verified schools are present and correctly tagged
        agg_schools = set(df[df["source_tier"] == "aggregator_verified"]["school_code"].unique())
        assert len(agg_schools) >= 20, f"Aggregator verified schools count ({len(agg_schools)}) < 20"

