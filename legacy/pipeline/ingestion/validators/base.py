"""Abstract base class for validators."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from pipeline.ingestion.core.models import NormalizedProgramRecord, ValidationResult


class BaseValidator(ABC):
    """Interface for validating schema conformity and business integrity of records."""

    @abstractmethod
    def validate(self, record: NormalizedProgramRecord) -> ValidationResult:
        """Validate a single record against schema or domain rules."""
        pass
