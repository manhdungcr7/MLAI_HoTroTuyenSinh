"""Data source registry and metadata catalog."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional, Type
from pydantic import BaseModel, Field


class DataSourceMetadata(BaseModel):
    """Metadata specification for a data source provider."""

    source_id: str
    name: str
    source_type: str = Field(
        ...,
        description="official_pdf | official_portal | secondary | regulation",
    )
    description: str
    base_url: Optional[str] = None
    rate_limit_rps: float = 2.0
    reliability_tier: str = "tier_2_so_gd"  # tier_1_chuan_hoa, tier_2, tier_3
    is_active: bool = True
    maintainer: str = "NguyenVongAI Data Engineering Team"


class SourceRegistry:
    """Singleton registry holding all active source connectors."""

    _registry: Dict[str, Type[Any]] = {}
    _metadata: Dict[str, DataSourceMetadata] = {}

    @classmethod
    def register(cls, metadata: DataSourceMetadata) -> Callable[[Type[Any]], Type[Any]]:
        """Decorator to register a source connector class."""

        def decorator(subclass: Type[Any]) -> Type[Any]:
            source_id = metadata.source_id.lower().strip()
            cls._registry[source_id] = subclass
            cls._metadata[source_id] = metadata
            return subclass

        return decorator

    @classmethod
    def get_source_class(cls, source_id: str) -> Optional[Type[Any]]:
        return cls._registry.get(source_id.lower().strip())

    @classmethod
    def get_metadata(cls, source_id: str) -> Optional[DataSourceMetadata]:
        return cls._metadata.get(source_id.lower().strip())

    @classmethod
    def list_sources(cls) -> List[DataSourceMetadata]:
        return list(cls._metadata.values())

    @classmethod
    def has_source(cls, source_id: str) -> bool:
        return source_id.lower().strip() in cls._registry
