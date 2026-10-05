"""Ingestion Pipeline orchestrator executing the 6-stage lifecycle:
FETCH -> PARSE -> NORMALIZE -> VALIDATE -> STAGE -> PUBLISH.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Optional

from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import (
    ExtractedRecord,
    IngestionRunSummary,
    IngestionStage,
    NormalizedProgramRecord,
    RawDocument,
)
from pipeline.ingestion.normalizers.composite import ProgramNormalizer
from pipeline.ingestion.sources.base import BaseSource
from pipeline.ingestion.sources.registry import SourceRegistry
from pipeline.ingestion.storage.stage import StagePublisher
from pipeline.ingestion.validators.integrity import IntegrityValidator
from pipeline.ingestion.validators.schema import SchemaValidator

logger = logging.getLogger("ingestion.pipeline")


class IngestionPipeline:
    """Production orchestrator running the full data ingestion lifecycle."""

    def __init__(
        self,
        source: BaseSource,
        normalizer: Optional[ProgramNormalizer] = None,
        schema_validator: Optional[SchemaValidator] = None,
        integrity_validator: Optional[IntegrityValidator] = None,
        publisher: Optional[StagePublisher] = None,
    ):
        self.source = source
        self.normalizer = normalizer or ProgramNormalizer()
        self.schema_validator = schema_validator or SchemaValidator()
        self.integrity_validator = integrity_validator or IntegrityValidator()
        self.publisher = publisher or StagePublisher()

    @classmethod
    def from_source_id(cls, source_id: str) -> IngestionPipeline:
        source_cls = SourceRegistry.get_source_class(source_id)
        if not source_cls:
            available = [s.source_id for s in SourceRegistry.list_sources()]
            raise ValueError(f"Unknown source '{source_id}'. Available sources: {available}")
        return cls(source=source_cls())

    def run(self, context: PipelineContext) -> IngestionRunSummary:
        logger.info(f"=== Starting Ingestion Pipeline: Run {context.run_id} for '{self.source.source_id}' ===")
        staged_path: Optional[Path] = None
        published_path: Optional[Path] = None

        try:
            # -------------------------------------------------------------
            # 1. STAGE: FETCH
            # -------------------------------------------------------------
            logger.info(f"[1/6] FETCH: Retrieving raw documents from {self.source.source_id}...")
            raw_docs: List[RawDocument] = self.source.fetch_documents(context)
            context.fetched_count = len(raw_docs)
            logger.info(f"  -> Fetched {len(raw_docs)} documents.")

            if context.target_stage == IngestionStage.FETCH or not raw_docs:
                return context.finish()

            # -------------------------------------------------------------
            # 2. STAGE: PARSE
            # -------------------------------------------------------------
            logger.info(f"[2/6] PARSE: Extracting records with {self.source.get_parser().__class__.__name__}...")
            parser = self.source.get_parser()
            extracted_records: List[ExtractedRecord] = []
            for doc in raw_docs:
                try:
                    recs = parser.parse(doc)
                    extracted_records.extend(recs)
                except Exception as exc:
                    context.record_error(f"Error parsing document {doc.doc_id}", exc)

            context.parsed_count = len(extracted_records)
            logger.info(f"  -> Parsed {len(extracted_records)} raw records.")

            if context.target_stage == IngestionStage.PARSE or not extracted_records:
                return context.finish()

            # -------------------------------------------------------------
            # 3. STAGE: NORMALIZE
            # -------------------------------------------------------------
            logger.info("[3/6] NORMALIZE: Standardizing school, 7-digit MoET major codes, and scores...")
            normalized_records: List[NormalizedProgramRecord] = []
            for rec in extracted_records:
                try:
                    norm = self.normalizer.normalize(rec)
                    if norm:
                        normalized_records.append(norm)
                except Exception as exc:
                    context.record_error(f"Normalization failed for {rec.raw_id}", exc)

            context.normalized_count = len(normalized_records)
            logger.info(f"  -> Normalized {len(normalized_records)} program records.")

            if context.target_stage == IngestionStage.NORMALIZE or not normalized_records:
                return context.finish()

            # -------------------------------------------------------------
            # 4. STAGE: VALIDATE
            # -------------------------------------------------------------
            logger.info("[4/6] VALIDATE: Enforcing schema contracts, plausible bounds, and anomaly checks...")
            schema_valid_records: List[NormalizedProgramRecord] = []
            for norm in normalized_records:
                # Schema check
                s_res = self.schema_validator.validate(norm)
                if not s_res.is_valid:
                    context.rejected_count += 1
                    logger.debug(f"Schema invalid: {norm.program_key} - {s_res.errors}")
                    continue

                # Integrity bounds check
                i_res = self.integrity_validator.validate(norm)
                if not i_res.is_valid:
                    context.rejected_count += 1
                    logger.debug(f"Integrity invalid: {norm.program_key} - {i_res.errors}")
                    continue

                schema_valid_records.append(norm)

            # Global batch integrity (deduplication & delta shock check)
            deduped_records, batch_anomalies = self.integrity_validator.validate_batch_anomalies(schema_valid_records)
            context.valid_count = len(deduped_records)
            context.anomaly_count = len(batch_anomalies)

            for anomaly in batch_anomalies[:10]:
                logger.warning(f"Batch Anomaly: {anomaly}")

            logger.info(f"  -> Validated {len(deduped_records)} records (Rejected: {context.rejected_count}, Anomalies: {context.anomaly_count}).")

            if context.target_stage == IngestionStage.VALIDATE or not deduped_records:
                return context.finish()

            # -------------------------------------------------------------
            # 5. STAGE: STAGE (INTERIM PARQUET)
            # -------------------------------------------------------------
            logger.info("[5/6] STAGE: Saving interim parquet...")
            staged_path = self.publisher.stage_records(deduped_records, self.source.source_id, context.run_id)
            logger.info(f"  -> Staged to {staged_path}.")

            if context.target_stage == IngestionStage.STAGE or context.dry_run:
                logger.info("Dry-run requested. Halting before publish.")
                return context.finish(staged_path=str(staged_path))

            # -------------------------------------------------------------
            # 6. STAGE: PUBLISH
            # -------------------------------------------------------------
            logger.info("[6/6] PUBLISH: Reconciling into programs.parquet & updating DataPassport manifest...")
            pub_path, metrics = self.publisher.publish(staged_path)
            published_path = pub_path
            logger.info(f"  -> Published dataset: {metrics.total_programs} programs across {metrics.distinct_schools} universities.")
            logger.info(f"     Tuition coverage: {metrics.coverage_tuition_pct}%, Employment coverage: {metrics.coverage_employment_pct}%.")

        except Exception as exc:
            context.record_error("Fatal pipeline error", exc)
            logger.exception("Fatal unhandled pipeline exception")

        summary = context.finish(
            staged_path=str(staged_path) if staged_path else None,
            published_path=str(published_path) if published_path else None,
        )
        logger.info(f"=== Pipeline Completed: Status={summary.status} in {summary.duration_seconds}s ===")
        return summary
