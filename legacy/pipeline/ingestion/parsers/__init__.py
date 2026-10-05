"""Parser package initialization."""

from pipeline.ingestion.parsers.base import BaseParser
from pipeline.ingestion.parsers.html_portal import HtmlPortalParser
from pipeline.ingestion.parsers.json_api import JsonApiParser
from pipeline.ingestion.parsers.pdf_scheme import PdfSchemeParser

__all__ = [
    "BaseParser",
    "HtmlPortalParser",
    "JsonApiParser",
    "PdfSchemeParser",
]
