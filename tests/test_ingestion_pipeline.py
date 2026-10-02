"""End-to-end pipeline execution and integration tests."""

from __future__ import annotations

import json
from pathlib import Path
import pandas as pd
import pytest

from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import IngestionStage
from pipeline.ingestion.core.pipeline import IngestionPipeline
from pipeline.ingestion.fetchers.http import ResumableHttpFetcher
from pipeline.ingestion.fetchers.rate_limiter import TokenBucketRateLimiter
from pipeline.ingestion.storage.stage import StagePublisher


def test_token_bucket_rate_limiter():
    limiter = TokenBucketRateLimiter(requests_per_second=10.0, burst_size=2)
    # First 2 tokens should be immediate
    wait1 = limiter.acquire(1)
    wait2 = limiter.acquire(1)
    assert wait1 < 0.2
    assert wait2 < 0.2


def test_fetcher_local_file_hash(tmp_path: Path):
    test_file = tmp_path / "test_doc.html"
    test_file.write_text("<html><body>Test Document</body></html>", encoding="utf-8")

    fetcher = ResumableHttpFetcher(cache_dir=tmp_path / "cache")
    doc = fetcher.fetch(
        url_or_path=str(test_file),
        doc_id="test_local_doc",
        source_id="test_source",
    )

    assert doc.doc_id == "test_local_doc"
    assert doc.content_hash is not None
    assert len(doc.content_hash) == 64
    assert doc.http_status == 200
    assert doc.local_path is not None
    assert Path(doc.local_path).exists()


def test_e2e_pipeline_offline_execution(tmp_path: Path):
    # Setup temporary stage and processed directory for clean isolation
    stage_dir = tmp_path / "interim"
    processed_dir = tmp_path / "processed"
    stage_dir.mkdir(parents=True)
    processed_dir.mkdir(parents=True)

    publisher = StagePublisher(stage_dir=stage_dir, processed_dir=processed_dir)

    pipeline = IngestionPipeline.from_source_id("university_portal")
    pipeline.publisher = publisher

    context = PipelineContext(
        source_name="university_portal",
        limit=2,
        dry_run=False,
        offline=True,
        target_stage=IngestionStage.PUBLISH,
    )

    summary = pipeline.run(context)

    # Assertions
    assert summary.status in ("success", "partial_success")
    assert summary.documents_fetched >= 1
    assert summary.records_parsed >= 1
    assert summary.records_valid >= 1
    assert summary.staged_path is not None
    assert summary.published_path is not None

    # Verify staged parquet file
    staged_parquet = Path(summary.staged_path)
    assert staged_parquet.exists()
    staged_df = pd.read_parquet(staged_parquet)
    assert not staged_df.empty
    assert "school_code" in staged_df.columns
    assert "cutoff_score" in staged_df.columns
    assert "data_passport_json" in staged_df.columns

    # Verify published parquet file
    pub_parquet = Path(summary.published_path)
    assert pub_parquet.exists()
    pub_df = pd.read_parquet(pub_parquet)
    assert not pub_df.empty
    assert "program_key" in pub_df.columns
    assert "cutoff_by_year_json" in pub_df.columns
    assert "school_province" in pub_df.columns
    assert pub_df["school_province"].iloc[0] == "Hà Nội"

    # Verify DataPassport manifest was generated
    manifest_path = processed_dir / "data_passport_manifest.json"
    assert manifest_path.exists()
    manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest_data["total_verified_records"] > 0
