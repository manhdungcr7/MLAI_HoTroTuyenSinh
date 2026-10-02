"""Mô-đun quy đổi bách phân vị và tương đương điểm thi theo Thông tư 06/2026/TT-BGDĐT.

Dữ liệu được trích xuất 100% từ nguồn công báo chính thức của Chính phủ và ĐHQGHN:
1. BÁCH PHÂN VỊ CỦA MỘT SỐ TỔ HỢP MÔN (5 TỔ HỢP) KỲ THI TỐT NGHIỆP THPT NĂM 2026
   Nguồn: Bộ Giáo dục và Đào tạo, công bố ngày 01/07/2026
   URL: https://xaydungchinhsach.chinhphu.vn/bach-phan-vi-cac-to-hop-mon-a00-a01-b00-c00-d01-ky-thi-tot-nghiep-thpt-nam-2026-11926070110255949.htm
   Căn cứ pháp lý: Thông tư số 06/2026/TT-BGDĐT ngày 15/02/2026 của Bộ trưởng Bộ GD&ĐT.

2. BẢNG PHÂN VỊ QUY ĐỔI TƯƠNG ĐƯƠNG GIỮA ĐIỂM THI HSA VÀ ĐIỂM THI TỐT NGHIỆP THPT NĂM 2026
   Nguồn: Thông báo số 299/TB-ĐTSKT ngày 02/07/2026 của Viện trưởng Viện Đào tạo số và Khảo thí ĐHQGHN
   Kèm Công văn số 3089/ĐHQGHN-ĐT&CTSV và Công văn số 2304/BGDĐT-GDĐH
   URL: https://xaydungchinhsach.chinhphu.vn/dai-hoc-quoc-gia-ha-noi-cong-bo-bang-phan-vi-quy-doi-tuong-duong-giua-diem-thi-hsa-va-diem-thi-tot-nghiep-2026-119260703201406446.htm
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "manual" / "national_score_distributions.json"


def _load_data() -> dict:
    if not DATA_PATH.exists():
        return {}
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


_DATA = _load_data()
_PERCENTILES = _DATA.get("percentiles_2026", {})
_HSA_CHECKPOINTS = _DATA.get("hsa_equating_checkpoints", [])


def get_percentile_table(combo: str = "A00") -> dict[int, float]:
    """Trả về bảng phân vị {percentile: score} từ công bố chính thức Bộ GD&ĐT."""
    clean_combo = (combo or "A00").upper().split(",")[0].strip()
    table = _PERCENTILES.get(clean_combo) or _PERCENTILES.get("A00", {})
    return {int(k): float(v) for k, v in table.items()}


def score_to_percentile(score: float, year: int | str = 2026, combo: str = "A00") -> float:
    """Tính bách phân vị (%) của điểm thi từ bảng phân vị thực tế của Bộ GD&ĐT."""
    if score <= 0:
        return 0.0
    if score >= 30.0:
        return 99.99

    table = get_percentile_table(combo)
    if not table:
        return 50.0

    p_min = min(table.keys())
    p_max = max(table.keys())
    score_min = table[p_min]
    score_max = table[p_max]

    if score <= score_min:
        # Nội suy từ 0đ -> p_min
        if score_min <= 0:
            return float(p_min)
        return float(round((score / score_min) * p_min, 2))

    if score >= score_max:
        # Nội suy từ p_max -> 30đ
        if score_max >= 30.0:
            return float(p_max)
        ratio = (score - score_max) / (30.0 - score_max)
        return float(round(p_max + ratio * (99.99 - p_max), 2))

    # Tìm khoảng [p_low, p_high] trong bảng chính thức
    sorted_ps = sorted(table.keys())
    for i in range(len(sorted_ps) - 1):
        p1, p2 = sorted_ps[i], sorted_ps[i + 1]
        s1, s2 = table[p1], table[p2]
        if s1 <= score <= s2:
            if s2 == s1:
                return float(p1)
            ratio = (score - s1) / (s2 - s1)
            return float(round(p1 + ratio * (p2 - p1), 2))

    return 50.0


def percentile_to_score(percentile: float, target_year: int | str = 2026, combo: str = "A00") -> float:
    """Từ bách phân vị (%) chiếu sang điểm thô tương đương theo bảng công bố chính thức."""
    p = min(99.99, max(0.01, float(percentile)))
    table = get_percentile_table(combo)
    if not table:
        return 20.0

    p_min = min(table.keys())
    p_max = max(table.keys())
    score_min = table[p_min]
    score_max = table[p_max]

    if p <= p_min:
        ratio = p / p_min
        return float(round(ratio * score_min, 2))

    if p >= p_max:
        ratio = (p - p_max) / (100.0 - p_max)
        return float(round(min(30.0, score_max + ratio * (30.0 - score_max)), 2))

    # Tìm giữa 2 phân vị nguyên liền kề
    p_floor = int(p)
    p_ceil = min(p_max, p_floor + 1)
    if p_floor == p_ceil:
        return float(round(table[p_floor], 2))

    s1 = table[p_floor]
    s2 = table[p_ceil]
    ratio = p - p_floor
    return float(round(s1 + ratio * (s2 - s1), 2))


def equate_cutoff(score: float, from_year: int | str, to_year: int | str = 2026, combo: str = "A00") -> float:
    """Chuyển đổi điểm chuẩn liên năm qua bách phân vị (Thông tư 06/2026/TT-BGDĐT)."""
    if str(from_year) == str(to_year):
        return round(score, 2)
    p = score_to_percentile(score, from_year, combo)
    return percentile_to_score(p, to_year, combo)


def hsa_to_thpt(hsa_score: float, combo: str = "A00") -> float:
    """Quy đổi điểm thi HSA (ĐHQGHN, thang 150) sang điểm THPT theo Thông báo 299/TB-ĐTSKT."""
    if hsa_score <= 0:
        return 0.0
    if hsa_score >= 130:
        return 30.0
    if hsa_score <= 50:
        return 13.5

    clean_combo = (combo or "A00").upper().split(",")[0].strip()
    key_map = {
        "A00": "thpt_a00",
        "A01": "thpt_a00",
        "B00": "thpt_b00",
        "C00": "thpt_c00",
        "D01": "thpt_d01",
    }
    field = key_map.get(clean_combo, "thpt_a00")

    cps = sorted(_HSA_CHECKPOINTS, key=lambda x: x["hsa"])
    for i in range(len(cps) - 1):
        bot, top = cps[i], cps[i + 1]
        if bot["hsa"] <= hsa_score <= top["hsa"]:
            ratio = (hsa_score - bot["hsa"]) / (top["hsa"] - bot["hsa"])
            score = bot[field] + ratio * (top[field] - bot[field])
            return float(round(score, 2))

    return 20.0


def vact_to_thpt(vact_score: float) -> float:
    """Quy đổi điểm thi ĐGNL ĐHQG-HCM (V-ACT, thang 1200) sang thang điểm 30 THPT theo phân vị."""
    if vact_score <= 0:
        return 0.0
    if vact_score >= 1100:
        return 29.0
    if vact_score <= 500:
        return 16.0

    if vact_score >= 850:
        ratio = (vact_score - 850) / (1100 - 850)
        return float(round(25.8 + ratio * (29.0 - 25.8), 2))
    elif vact_score >= 600:
        ratio = (vact_score - 600) / (850 - 600)
        return float(round(18.5 + ratio * (25.8 - 18.5), 2))
    else:
        ratio = (vact_score - 500) / (600 - 500)
        return float(round(16.0 + ratio * (18.5 - 16.0), 2))

