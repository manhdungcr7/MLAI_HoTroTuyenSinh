"""Normalizers package initialization."""

from pipeline.ingestion.normalizers.base import BaseNormalizer
from pipeline.ingestion.normalizers.composite import ProgramNormalizer
from pipeline.ingestion.normalizers.major_code import MajorCodeNormalizer
from pipeline.ingestion.normalizers.school import SchoolNormalizer
from pipeline.ingestion.normalizers.score import ScoreNormalizer

__all__ = [
    "BaseNormalizer",
    "ProgramNormalizer",
    "MajorCodeNormalizer",
    "SchoolNormalizer",
    "ScoreNormalizer",
]
