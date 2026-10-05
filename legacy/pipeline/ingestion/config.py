"""Configuration for the Enterprise Ingestion Framework.

Defines storage paths, network parameters, rate limits, and fallback taxonomies.
"""

from __future__ import annotations

import os
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"

RAW_DIR = DATA_DIR / "raw"
INGESTION_RAW_DIR = RAW_DIR / "ingestion"
DEANS_DIR = RAW_DIR / "deans"

INTERIM_DIR = DATA_DIR / "interim"
INGESTION_STAGE_DIR = INTERIM_DIR / "ingestion"

PROCESSED_DIR = DATA_DIR / "processed"
PROGRAMS_PARQUET = PROCESSED_DIR / "programs.parquet"
NATIONAL_SHOCK_JSON = PROCESSED_DIR / "national_shock.json"
DATA_PASSPORT_MANIFEST = PROCESSED_DIR / "data_passport_manifest.json"

MANUAL_DIR = DATA_DIR / "manual"
MAJOR_GROUPS_CSV = MANUAL_DIR / "major_groups.csv"

LOGS_DIR = ROOT_DIR / "artifacts" / "ingestion_logs"

# Ensure all directories exist
for directory in (
    INGESTION_RAW_DIR,
    INGESTION_STAGE_DIR,
    PROCESSED_DIR,
    MANUAL_DIR,
    LOGS_DIR,
    DEANS_DIR,
):
    directory.mkdir(parents=True, exist_ok=True)

# HTTP & Network Defaults
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_FACTOR = 1.5
DEFAULT_REQUESTS_PER_SECOND = 2.0  # Polite rate limit for educational servers
DEFAULT_USER_AGENT = (
    "NguyenVongAI-IngestionBot/2.0 (+https://nguyenvongai.edu.vn/bot; "
    "admission-research-audit)"
)

# Integrity Bounds
MIN_VALID_YEAR = 2018
MAX_VALID_YEAR = 2026
MIN_PLAUSIBLE_SCORE = 10.0
MAX_PLAUSIBLE_SCORE = 30.0
MAX_DELTA_SHOCK_THRESHOLD = 5.0
MAX_TUITION_MVND = 500.0
