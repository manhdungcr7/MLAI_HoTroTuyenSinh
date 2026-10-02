"""Nguyện Vọng AI - Enterprise Data Ingestion Framework.

Provides modular sources, rate-limited resumable fetchers, schema validators,
multi-format parsers, and atomic dataset publishers.
"""

from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import (
    DocumentFormat,
    ExtractedRecord,
    IngestionRunSummary,
    IngestionStage,
    NormalizedProgramRecord,
    RawDocument,
    ValidationResult,
)
from pipeline.ingestion.core.pipeline import IngestionPipeline
from pipeline.ingestion.fetchers.http import ResumableHttpFetcher
from pipeline.ingestion.normalizers.composite import ProgramNormalizer
from pipeline.ingestion.sources.base import BaseSource
from pipeline.ingestion.sources.registry import DataSourceMetadata, SourceRegistry
from pipeline.ingestion.storage.stage import StagePublisher
from pipeline.ingestion.validators.integrity import IntegrityValidator
from pipeline.ingestion.validators.schema import SchemaValidator

# Register default sources
import pipeline.ingestion.sources  # noqa: F401

__all__ = [
    "IngestionPipeline",
    "PipelineContext",
    "IngestionStage",
    "DocumentFormat",
    "RawDocument",
    "ExtractedRecord",
    "NormalizedProgramRecord",
    "ValidationResult",
    "IngestionRunSummary",
    "BaseSource",
    "SourceRegistry",
    "DataSourceMetadata",
    "ResumableHttpFetcher",
    "ProgramNormalizer",
    "SchemaValidator",
    "IntegrityValidator",
    "StagePublisher",
]
