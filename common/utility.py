"""Hàm lợi ích 7 chiều — viết lại hoàn toàn, thay bản nhị phân cũ.

Bảy chiều theo đúng đề bài: mục tiêu học tập, học phí, vị trí, tuyển sinh,
cơ hội nghề nghiệp, năng lực, hoàn cảnh gia đình. "Tuyển sinh" (khả năng đỗ)
được tính riêng trong common/simulate.py — hàm này chỉ tính "tôi có MUỐN học ở
đây không", không trộn với "tôi có ĐỖ được không" (utility và xác suất đỗ được
nhân với nhau ở tầng tối ưu, không cộng gộp ở đây).

MINH BẠCH VỀ NGUỒN CỦA CÁC BẢNG THAM SỐ:
`data/manual/major_groups.csv` (hồ sơ môn học điển hình theo nhóm ngành) và
`data/manual/major_similarity.csv` (độ tương đồng giữa các nhóm ngành) là quy
tắc do người biên soạn thủ công dựa trên hiểu biết chung, KHÔNG PHẢI dữ liệu
đo lường/cào được. Khác về bản chất với điểm chuẩn/học phí (vốn phải là số
thật) — đây là tham số PHƯƠNG PHÁP của thuật toán, tương tự trọng số một rubric
tư vấn hướng nghiệp. Nếu hiển thị trực tiếp cho người dùng, phải ghi rõ "ước
lượng theo quy tắc chung, không phải số đo riêng cho ngành/trường cụ thể".
"""

from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path

import pandas as pd


def _is_missing(v) -> bool:
    """True for both Python None and pandas/numpy NaN.

    Parquet round-trips a missing numeric column as float('nan'), not None -
    `v is not None` silently passes NaN through, which then blows up later at
    `round(nan)` deep inside cost_score. Every "is this value present" check
    in this module goes through here instead of a bare `is None`.
    """
    return v is None or (isinstance(v, float) and v != v)

MANUAL_DIR = Path(__file__).resolve().parents[1] / "data" / "manual"
SUBJECT_KEYS = ["toan", "ly", "hoa", "sinh", "van", "anh", "su", "dia"]

# City-tier monthly living cost (VNĐ/năm, ước lượng mức sinh hoạt phổ biến -
# KHÔNG phải số đo, dùng như tham số mặc định, học sinh có thể tự nhập khác
# đi trong `family.annual_budget_vnd` đã bao gồm sinh hoạt phí thực tế của họ).
CITY_TIER_LIVING_COST_VND = {
    "dac_biet": 45_000_000,   # Hà Nội, TP.HCM
    "loai_1": 32_000_000,     # Đà Nẵng, Hải Phòng, Cần Thơ, Huế...
    "loai_khac": 22_000_000,
}
SPECIAL_CITIES = {"Hà Nội", "TP.HCM", "TP. Hồ Chí Minh", "Thành phố Hồ Chí Minh"}
TIER1_CITIES = {"Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Thừa Thiên Huế"}


@lru_cache(maxsize=1)
def _major_profiles() -> pd.DataFrame:
    path = MANUAL_DIR / "major_groups.csv"
    return pd.read_csv(path).set_index("major_group")


@lru_cache(maxsize=1)
def _distance_table() -> dict[tuple[str, str], float]:
    """(tỉnh A, tỉnh B) -> khoảng cách km. Xây từ data/manual/province_distance.csv
    nếu có; nếu chưa có file (chưa biên soạn), trả về bảng rỗng và mọi cặp
    tỉnh khác nhau dùng khoảng cách mặc định 300km (giả định ƯỚC TÍNH, chưa có bảng khoảng cách)."""
    path = MANUAL_DIR / "province_distance.csv"
    if not path.exists():
        return {}
    df = pd.read_csv(path)
    out = {}
    for _, r in df.iterrows():
        out[(r["province_a"], r["province_b"])] = float(r["distance_km"])
        out[(r["province_b"], r["province_a"])] = float(r["distance_km"])
    return out


def city_tier(city: str | None) -> str:
    if not city:
        return "loai_khac"
    if city in SPECIAL_CITIES:
        return "dac_biet"
    if city in TIER1_CITIES:
        return "loai_1"
    return "loai_khac"


# --------------------------------------------------------------------------
# 2.1 Mục tiêu học tập (fit) — xếp hạng sở thích × độ tương đồng ngành
# --------------------------------------------------------------------------
def fit_score(program_major_group: str, ranked_majors: list[dict]) -> float:
    """ranked_majors: [{"major_group": "cntt", "weight": 1.0}, ...] theo thứ
    tự quan tâm giảm dần. Điểm giảm dần theo thứ hạng (decay), và một ngành
    KHÁC nhóm nhưng có hồ sơ môn học gần giống vẫn được điểm một phần thay vì
    bị loại (bản cũ cho thẳng 0.2 cho mọi thứ ngoài danh sách)."""
    if not ranked_majors:
        return 0.5  # không khai báo sở thích -> trung lập, không phạt

    profiles = _major_profiles()
    best = 0.0
    for rank, pref in enumerate(ranked_majors):
        target = pref["major_group"]
        w = pref.get("weight", 1.0)
        decay = 1.0 / (1 + 0.6 * rank)  # NV thích nhất giảm chậm, các NV sau giảm nhanh hơn
        if target == program_major_group:
            sim = 1.0
        elif target in profiles.index and program_major_group in profiles.index:
            a = profiles.loc[target, [f"subject_profile_{s}" for s in SUBJECT_KEYS]].to_numpy(float)
            b = profiles.loc[program_major_group, [f"subject_profile_{s}" for s in SUBJECT_KEYS]].to_numpy(float)
            denom = (float((a**2).sum()) ** 0.5) * (float((b**2).sum()) ** 0.5)
            sim = float((a * b).sum()) / denom if denom > 1e-9 else 0.0
        else:
            sim = 0.15  # nhóm ngành không rõ trong bảng -> điểm sàn thấp, không phải 0
        best = max(best, w * decay * sim)
    return min(1.0, best)


# --------------------------------------------------------------------------
# 2.2 Học phí + 2.7 Hoàn cảnh gia đình
# --------------------------------------------------------------------------
def cost_score(tuition_min_mvnd: float | None, tuition_max_mvnd: float | None,
               school_city: str | None, home_province: str | None,
               annual_budget_vnd: int, policy_status: str) -> tuple[float, dict]:
    tuition = None
    if not _is_missing(tuition_min_mvnd) and not _is_missing(tuition_max_mvnd):
        tuition = (float(tuition_min_mvnd) + float(tuition_max_mvnd)) / 2.0 * 1_000_000
    tuition_is_estimated = tuition is None
    if tuition is None:
        tuition = 22_000_000  # trung vị ước lượng toàn quốc khi thiếu, gắn cờ riêng

    if policy_status in ("ho_ngheo", "can_ngheo", "dan_toc_thieu_so", "vung_dbkk"):
        tuition *= 0.4  # nhiều diện chính sách được miễn giảm phần lớn học phí công lập
    elif policy_status in ("khuyet_tat", "mo_coi"):
        tuition *= 0.6

    living = 0 if (school_city and school_city == home_province) else CITY_TIER_LIVING_COST_VND[city_tier(school_city)]
    total_cost = tuition + living

    ratio = total_cost / max(annual_budget_vnd, 1)
    if ratio <= 0.7:
        score = 1.0
    elif ratio <= 1.0:
        score = 1.0 - (ratio - 0.7) * 1.0          # 0.7 -> 1.0 : điểm giảm 1.0 -> 0.7
    elif ratio <= 1.5:
        score = 0.7 - (ratio - 1.0) * 1.0           # 1.0 -> 1.5 : điểm giảm 0.7 -> 0.2
    else:
        score = max(0.0, 0.2 - (ratio - 1.5) * 0.4)

    return score, {
        "total_cost_per_year_vnd": round(total_cost),
        "tuition_estimated": tuition_is_estimated,
        "budget_ratio": round(ratio, 2),
    }


# --------------------------------------------------------------------------
# 2.3 Vị trí + relocation_willingness + must_stay_near_home
# --------------------------------------------------------------------------
def location_score(school_province: str | None, home_province: str | None,
                   relocation_willingness: str, must_stay_near_home: bool) -> float:
    if _is_missing(school_province) or _is_missing(home_province) or not school_province or not home_province:
        return 0.5
    if school_province == home_province:
        return 1.0

    dist = _distance_table().get((home_province, school_province), 300.0)

    if must_stay_near_home:
        # Ngoài tỉnh nhà coi như không đạt, phạt rất nặng bất kể khoảng cách xa gần
        return max(0.0, 0.15 - dist / 4000.0)

    if relocation_willingness == "chi_tinh_nha":
        return max(0.05, 0.3 - dist / 3000.0)
    if relocation_willingness == "trong_vung":
        # trong vòng ~400km coi như "cùng vùng", xa hơn giảm dần
        return max(0.15, 1.0 - max(0.0, dist - 400) / 1200.0)
    # khong_gioi_han
    return max(0.4, 1.0 - dist / 3000.0)


# --------------------------------------------------------------------------
# 2.5 Cơ hội nghề nghiệp
# --------------------------------------------------------------------------
def career_score(employment_rate_pct: float | None, major_group_median_pct: float | None,
                 quota_trend: float | None) -> tuple[float, bool]:
    """Trả về (điểm, is_estimated). Khi trường không công bố tỷ lệ việc làm,
    dùng trung vị nhóm ngành TOÀN QUỐC tính từ chính dữ liệu đã cào (không
    phải hằng số bịa như bản cũ), và báo is_estimated=True."""
    is_estimated = _is_missing(employment_rate_pct)
    rate = employment_rate_pct if not is_estimated else (
        major_group_median_pct if not _is_missing(major_group_median_pct) else 85.0)
    base = max(0.0, min(1.0, (rate - 70.0) / 30.0))
    if not _is_missing(quota_trend):
        # chỉ tiêu tăng qua các năm là tín hiệu nhu cầu ngành tăng -> cộng nhẹ
        base = min(1.0, base + max(-0.1, min(0.1, quota_trend * 0.05)))
    return base, is_estimated


# --------------------------------------------------------------------------
# 2.6 Năng lực — hồ sơ điểm mạnh môn học so với hồ sơ điển hình của ngành
# --------------------------------------------------------------------------
def capability_score(exam_scores: dict, program_major_group: str) -> tuple[float, str | None]:
    """Trả về (điểm phù hợp năng lực, cảnh báo nếu lệch nhiều)."""
    profiles = _major_profiles()
    if program_major_group not in profiles.index:
        return 0.5, None

    vals = {s: exam_scores.get(s) for s in SUBJECT_KEYS if exam_scores.get(s) is not None}
    if len(vals) < 3:
        return 0.5, None  # chưa đủ điểm môn để đánh giá

    avg = sum(vals.values()) / len(vals)
    student_profile = {s: (v - avg) for s, v in vals.items()}  # điểm mạnh tương đối

    row = profiles.loc[program_major_group]
    target_profile = {s: row[f"subject_profile_{s}"] for s in SUBJECT_KEYS}

    num = sum(student_profile.get(s, 0) * target_profile[s] for s in SUBJECT_KEYS)
    denom_a = math.sqrt(sum(v**2 for v in student_profile.values())) or 1e-9
    denom_b = math.sqrt(sum(v**2 for v in target_profile.values())) or 1e-9
    cos_sim = num / (denom_a * denom_b)
    score = max(0.0, min(1.0, (cos_sim + 1) / 2))

    warning = None
    if score < 0.35:
        strong = max(vals, key=vals.get)
        warning = (f"Ngành này thường phù hợp với thế mạnh khác — điểm {strong} của em "
                   "nổi trội nhưng không phải yếu tố chính của nhóm ngành này. "
                   "Không sao nếu em thực sự đam mê, nhưng nên cân nhắc kỹ.")
    return score, warning


# --------------------------------------------------------------------------
# Tổng hợp
# --------------------------------------------------------------------------
DEFAULT_WEIGHTS = {
    "fit": 0.28,
    "cost": 0.22,
    "location": 0.14,
    "career": 0.18,
    "capability": 0.18,
}


def calculate_utility(program: dict, family: dict, preferences: dict,
                      exam_scores: dict, weights: dict | None = None) -> dict:
    w = {**DEFAULT_WEIGHTS, **(weights or {})}

    if program.get("major_group") in preferences.get("excluded_major_groups", []):
        return {"utility": 0.0, "breakdown": {}, "excluded": True}
    if program.get("school_code") in preferences.get("excluded_school_codes", []):
        return {"utility": 0.0, "breakdown": {}, "excluded": True}

    f = fit_score(program.get("major_group", ""), preferences.get("ranked_majors", []))
    c, cost_meta = cost_score(
        program.get("tuition_min_mvnd"), program.get("tuition_max_mvnd"),
        program.get("school_province"), family.get("home_province"),
        family["annual_budget_vnd"], family.get("policy_status", "none"))
    loc = location_score(
        program.get("school_province"), family.get("home_province"),
        family.get("relocation_willingness", "trong_vung"),
        family.get("must_stay_near_home", False))
    career, career_estimated = career_score(
        program.get("employment_rate_pct"), program.get("major_group_median_employment_pct"),
        program.get("quota_trend"))
    cap, cap_warning = capability_score(exam_scores, program.get("major_group", ""))

    career_importance = preferences.get("career_importance", 0.5)
    # career_importance trượt trọng số giữa fit và career, không phá vỡ tổng
    fit_w = w["fit"] * (1.5 - career_importance)
    career_w = w["career"] * (0.5 + career_importance)

    utility = (fit_w * f + w["cost"] * c + w["location"] * loc
              + career_w * career + w["capability"] * cap)
    utility = utility / (fit_w + w["cost"] + w["location"] + career_w + w["capability"])

    return {
        "utility": round(utility, 4),
        "excluded": False,
        "breakdown": {
            "fit": round(f, 3),
            "cost": round(c, 3),
            "location": round(loc, 3),
            "career": round(career, 3),
            "capability": round(cap, 3),
        },
        "meta": {
            **cost_meta,
            "career_estimated": career_estimated,
            "capability_warning_vi": cap_warning,
        },
    }
