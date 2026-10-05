"""Abstract base class for document parsers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from pipeline.ingestion.core.models import ExtractedRecord, RawDocument


class BaseParser(ABC):
    """Abstract interface for extracting structured admission records from raw documents."""

    @abstractmethod
    def parse(self, raw_doc: RawDocument) -> List[ExtractedRecord]:
        """Extract records from raw document payload."""
        pass
