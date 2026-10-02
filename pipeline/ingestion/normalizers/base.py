"""Abstract base class for normalizers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from pipeline.ingestion.core.models import ExtractedRecord, NormalizedProgramRecord


class BaseNormalizer(ABC):
    """Interface for standardizing extracted records into canonical domain formats."""

    @abstractmethod
    def normalize(self, record: ExtractedRecord) -> Optional[NormalizedProgramRecord]:
        """Convert an extracted raw record into a normalized program record."""
        pass
