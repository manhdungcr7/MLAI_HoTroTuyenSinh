"""Abstract base class for document fetchers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from pipeline.ingestion.core.models import RawDocument


class BaseFetcher(ABC):
    """Interface for retrieving raw documents from remote or local storage."""

    @abstractmethod
    def fetch(
        self,
        url_or_path: str,
        doc_id: str,
        source_id: str,
        format_hint: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RawDocument:
        """Fetch the document, returning a RawDocument with SHA-256 hash."""
        pass
