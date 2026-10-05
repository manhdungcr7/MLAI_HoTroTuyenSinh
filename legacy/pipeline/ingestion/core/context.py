"""Pipeline execution context and telemetry tracker."""

from __future__ import annotations

import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline.ingestion import config
from pipeline.ingestion.core.models import IngestionRunSummary, IngestionStage


class PipelineContext:
    """Manages the state, logger, metrics, and parameters of a pipeline run."""

    def __init__(
        self,
        source_name: str,
        limit: Optional[int] = None,
        dry_run: bool = False,
        offline: bool = False,
        target_stage: IngestionStage = IngestionStage.PUBLISH,
    ):
        self.run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        self.source_name = source_name
        self.limit = limit
        self.dry_run = dry_run
        self.offline = offline
        self.target_stage = target_stage
        self.start_time = datetime.now(timezone.utc)
        self.custom_state: Dict[str, Any] = {}

        # Telemetry counts
        self.fetched_count = 0
        self.parsed_count = 0
        self.normalized_count = 0
        self.valid_count = 0
        self.rejected_count = 0
        self.anomaly_count = 0
        self.errors: List[str] = []

        # Setup logger
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f"ingestion.{self.source_name}.{self.run_id}")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            fmt = logging.Formatter(
                "[%(asctime)s][%(levelname)s][%(name)s] %(message)s",
                datefmt="%H:%M:%S",
            )
            handler.setFormatter(fmt)
            logger.addHandler(handler)

            # Also file handler in artifacts/ingestion_logs
            log_file = config.LOGS_DIR / f"{self.run_id}.log"
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(fmt)
            logger.addHandler(file_handler)

        return logger

    def record_error(self, message: str, exc: Optional[Exception] = None) -> None:
        if exc:
            full_msg = f"{message}: {type(exc).__name__} - {str(exc)}"
        else:
            full_msg = message
        self.errors.append(full_msg)
        self.logger.error(full_msg)

    def finish(
        self,
        staged_path: Optional[str] = None,
        published_path: Optional[str] = None,
    ) -> IngestionRunSummary:
        finish_time = datetime.now(timezone.utc)
        duration = (finish_time - self.start_time).total_seconds()
        status = "failed" if (self.errors and self.valid_count == 0) else (
            "partial_success" if self.errors or self.rejected_count > 0 else "success"
        )
        return IngestionRunSummary(
            run_id=self.run_id,
            source_name=self.source_name,
            stage=self.target_stage,
            status=status,
            started_at=self.start_time.isoformat(),
            finished_at=finish_time.isoformat(),
            duration_seconds=round(duration, 2),
            documents_fetched=self.fetched_count,
            records_parsed=self.parsed_count,
            records_normalized=self.normalized_count,
            records_valid=self.valid_count,
            records_rejected=self.rejected_count,
            anomalies_detected=self.anomaly_count,
            staged_path=staged_path,
            published_path=published_path,
            error_messages=self.errors[:50],  # cap at 50 errors
        )
