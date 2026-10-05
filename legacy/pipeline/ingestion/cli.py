"""Command Line Interface (CLI) for the Ingestion Framework."""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

# Reconfigure stdout and stderr for Windows console utf-8 support
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import IngestionStage
from pipeline.ingestion.core.pipeline import IngestionPipeline
from pipeline.ingestion.sources.registry import SourceRegistry

# Ensure all default sources are loaded and registered
import pipeline.ingestion.sources  # noqa: F401


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m pipeline.ingestion",
        description="Nguyện Vọng AI - Enterprise Ingestion & ETL Framework",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available sub-commands")

    # Command: list
    subparsers.add_parser("list", help="List all registered data sources and their metadata")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Execute ingestion pipeline for a specific source")
    run_parser.add_argument("source", type=str, help="Source identifier (e.g. 'tuyensinh247', 'university_portal')")
    run_parser.add_argument("--limit", type=int, default=None, help="Limit number of documents/schools to ingest")
    run_parser.add_argument("--offline", action="store_true", help="Run in offline mode using local fixtures/cached documents")
    run_parser.add_argument("--dry-run", action="store_true", help="Execute without publishing changes to programs.parquet")
    run_parser.add_argument(
        "--stage",
        type=str,
        default="publish",
        choices=["fetch", "parse", "normalize", "validate", "stage", "publish"],
        help="Target pipeline stage to execute up to (default: publish)",
    )

    # Command: test
    test_parser = subparsers.add_parser("test", help="Run offline diagnostic test for a source connector")
    test_parser.add_argument("source", type=str, help="Source identifier to test")

    return parser


def handle_list() -> int:
    sources = SourceRegistry.list_sources()
    print("\n" + "=" * 76)
    print("  NGUYỆN VỌNG AI - REGISTERED DATA INGESTION SOURCES (SSOT CATALOG)")
    print("=" * 76)
    for src in sources:
        print(f"\n* Source ID:       {src.source_id}")
        print(f"  Name:            {src.name}")
        print(f"  Type:            {src.source_type}")
        print(f"  Reliability:     {src.reliability_tier}")
        print(f"  Rate Limit:      {src.rate_limit_rps} req/sec")
        print(f"  Description:     {src.description}")
        if src.base_url:
            print(f"  Base URL:        {src.base_url}")
    print("\n" + "=" * 76)
    print(f"Total active sources: {len(sources)}\n")
    return 0


def handle_run(args: argparse.Namespace) -> int:
    source_id = args.source.lower().strip()
    if not SourceRegistry.has_source(source_id):
        print(f"Error: Unknown source '{source_id}'. Run 'python -m pipeline.ingestion list' to view available sources.")
        return 1

    stage_enum = IngestionStage(args.stage)
    context = PipelineContext(
        source_name=source_id,
        limit=args.limit,
        dry_run=args.dry_run,
        offline=args.offline,
        target_stage=stage_enum,
    )

    try:
        pipeline = IngestionPipeline.from_source_id(source_id)
        summary = pipeline.run(context)

        print("\n" + "=" * 60)
        print("  INGESTION EXECUTION SUMMARY")
        print("=" * 60)
        print(f"  Run ID:              {summary.run_id}")
        print(f"  Source:              {summary.source_name}")
        print(f"  Status:              {summary.status.upper()}")
        print(f"  Target Stage:        {summary.stage.value}")
        print(f"  Duration:            {summary.duration_seconds}s")
        print(f"  Documents Fetched:   {summary.documents_fetched}")
        print(f"  Records Parsed:      {summary.records_parsed}")
        print(f"  Records Normalized:  {summary.records_normalized}")
        print(f"  Valid Records:       {summary.records_valid}")
        print(f"  Rejected Records:    {summary.records_rejected}")
        print(f"  Anomalies Detected:  {summary.anomalies_detected}")
        if summary.staged_path:
            print(f"  Staged File:         {summary.staged_path}")
        if summary.published_path:
            print(f"  Published File:      {summary.published_path}")
        print("=" * 60 + "\n")

        return 0 if summary.status in ("success", "partial_success") else 1
    except Exception as exc:
        print(f"\n[FATAL ERROR] Ingestion failed: {exc}")
        return 1


def handle_test(args: argparse.Namespace) -> int:
    source_id = args.source.lower().strip()
    print(f"Running offline diagnostic verification for source '{source_id}'...")
    args.offline = True
    args.dry_run = True
    args.limit = 2
    args.stage = "stage"
    return handle_run(args)


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if not args.command:
        parser.print_help()
        return 0

    if args.command == "list":
        return handle_list()
    elif args.command == "run":
        return handle_run(args)
    elif args.command == "test":
        return handle_test(args)

    return 0


if __name__ == "__main__":
    sys.exit(main())
