"""Score scaler, scale converter (40/100 -> 30), and subject combination normalizer."""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

COMBO_CODE_RE = re.compile(r"\b([A-D]\d{2})\b")

# Mapping of common Vietnamese subject name triplets to combination codes
COMBO_NAME_MAP = {
    "toán, lý, hóa": "A00",
    "toán, vật lý, hóa học": "A00",
    "toán, lý, anh": "A01",
    "toán, vật lý, tiếng anh": "A01",
    "toán, hóa, sinh": "B00",
    "toán, hóa học, sinh học": "B00",
    "văn, sử, địa": "C00",
    "ngữ văn, lịch sử, địa lý": "C00",
    "toán, văn, anh": "D01",
    "toán, ngữ văn, tiếng anh": "D01",
    "toán, văn, nga": "D02",
    "toán, văn, pháp": "D03",
    "toán, văn, trung": "D04",
    "toán, văn, đức": "D05",
    "toán, văn, nhật": "D06",
    "toán, hóa, anh": "D07",
    "toán, hóa học, tiếng anh": "D07",
    "toán, sinh, anh": "D08",
}


class ScoreNormalizer:
    """Standardizes cutoff scores to standard 30-point scale and parses combinations."""

    @classmethod
    def normalize_score(
        cls,
        raw_score: Optional[float],
        scale_hint: Optional[float] = None,
    ) -> Tuple[Optional[float], Optional[float], float]:
        """
        Normalizes a raw score to standard 30.0 scale.
        Returns: (normalized_score, original_score, original_scale)
        """
        if raw_score is None:
            return None, None, 30.0

        try:
            score = float(raw_score)
        except (ValueError, TypeError):
            return None, None, 30.0

        orig_score = score
        orig_scale = scale_hint or 30.0

        # Automatic detection of 40-point scale (score > 30.0 and <= 40.0)
        if (orig_scale == 40.0) or (score > 30.5 and score <= 40.0):
            norm_score = round(score * (30.0 / 40.0), 2)
            return norm_score, orig_score, 40.0

        # Automatic detection of 100-point scale
        if (orig_scale == 100.0) or (score > 40.0 and score <= 100.0):
            norm_score = round(score * (30.0 / 100.0), 2)
            return norm_score, orig_score, 100.0

        # Standard 30-point scale
        return round(score, 2), orig_score, 30.0

    @classmethod
    def parse_combinations(cls, raw_combo: Optional[str]) -> List[str]:
        """Extracts and normalizes subject combination codes (e.g. ['A00', 'A01'])."""
        if not raw_combo:
            return []

        text = str(raw_combo).strip()
        # 1. Direct standard combo regex extraction
        matches = COMBO_CODE_RE.findall(text)
        if matches:
            return sorted(set(matches))

        # 2. Text triplet lookup
        lower = text.lower().replace(";", ",").replace("/", ",")
        for key, code in COMBO_NAME_MAP.items():
            if key in lower:
                return [code]

        return []
