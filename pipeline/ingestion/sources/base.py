"""Abstract base class for Data Source Connectors."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import RawDocument
from pipeline.ingestion.parsers.base import BaseParser


class BaseSource(ABC):
    """Abstract connector for an upstream data provider."""

    source_id: str

    @abstractmethod
    def fetch_documents(self, context: PipelineContext) -> List[RawDocument]:
        """Fetches raw documents from the source provider."""
        pass

    @abstractmethod
    def get_parser(self) -> BaseParser:
        """Returns the appropriate parser for this source's documents."""
        pass
