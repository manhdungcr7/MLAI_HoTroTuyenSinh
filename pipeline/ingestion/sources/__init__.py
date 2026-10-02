"""Sources package initialization and registration."""

from pipeline.ingestion.sources.base import BaseSource
from pipeline.ingestion.sources.registry import DataSourceMetadata, SourceRegistry
from pipeline.ingestion.sources.tuyensinh247 import TuyenSinh247Source
from pipeline.ingestion.sources.university_portal import UniversityPortalSource

__all__ = [
    "BaseSource",
    "DataSourceMetadata",
    "SourceRegistry",
    "TuyenSinh247Source",
    "UniversityPortalSource",
]
