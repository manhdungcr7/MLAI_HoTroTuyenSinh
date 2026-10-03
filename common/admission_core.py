"""Lõi tư vấn tuyển sinh phía backend: cùng quy tắc với frontend/src/engine.

Một ngành của một trường có thể xét nhiều phương thức (điểm thi THPT, học bạ, ĐGNL...), mỗi
phương thức có ngưỡng điểm riêng. Với hồ sơ của học sinh, module này:
  1. tính điểm xét tuyển theo từng phương thức tính được (thi THPT, học bạ),
  2. tính xác suất đỗ cho từng ngành theo phương thức có lợi nhất cho học sinh,
  3. lọc theo ràng buộc (vùng/tỉnh, học phí, nhóm ngành),
  4. xếp theo xác suất và đề xuất danh sách nguyện vọng.

Thuần Python (không pandas), tất định, và được kiểm tra song song với bản TypeScript trong
tests/backend/test_admission_core_parity.py: mọi thay đổi công thức phải sửa cả hai bên.
"""

from __future__ import annotations

import json
import math
import re
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import Any, Iterable, Mapping

ROOT = Path(__file__).resolve().parents[1]
_RULES = json.loads((Path(__file__).parent / "data" / "shared_rules.json").read_text(encoding="utf-8"))
COMBINATION_SUBJECTS: dict[str, list[str]] = _RULES["combinations"]
PROVINCE_REGIONS: dict[str, str] = _RULES["provinceRegions"]

DEFAULT_CATALOG_PATH = ROOT / "frontend" / "src" / "data" / "programs-catalog.json"

DEFAULT_NATIONAL_SHOCK_STD = 1.29
DEFAULT_IDIO_STD = 1.28
SAFE_MIN_PROB = 0.8
REACH_MAX_PROB = 0.4
MIN_VALID_CUTOFF = 12
UNLIMITED_BUDGET_VND = 200_000_000
SCORABLE_METHODS = ("THPT", "HOC_BA")
MAX_WISHES = 15

METHOD_LABELS_VI = {
    "THPT": "Điểm thi tốt nghiệp THPT",
    "HOC_BA": "Học bạ THPT",
    "DGNL_HN": "ĐGNL ĐHQG Hà Nội (HSA)",
    "DGNL_HCM": "ĐGNL ĐHQG TP.HCM (V-ACT)",
    "DGNL_SP": "ĐGNL ĐHSP Hà Nội (SPT)",
    "DGTD": "Đánh giá tư duy Bách khoa (TSA)",
    "DGNL_KHAC": "Đánh giá năng lực (khác)",
    "NANG_KHIEU": "Kết hợp thi năng khiếu",
    "KET_HOP": "Kết hợp chứng chỉ / nhiều tiêu chí",
    "UU_TIEN": "Tuyển thẳng / ưu tiên xét tuyển",
    "RIENG": "Tuyển sinh riêng của trường",
    "KHAC": "Phương thức khác",
}

# --------------------------------------------------------------------------------------
# Làm tròn theo JavaScript để hai bên cho cùng kết quả
# --------------------------------------------------------------------------------------


def js_to_fixed(x: float, digits: int) -> float:
    """Number(x.toFixed(digits)) của JavaScript (làm tròn nửa lên trên giá trị nhị phân chính xác)."""
    quantum = Decimal(1).scaleb(-digits)
    return float(Decimal(x).quantize(quantum, rounding=ROUND_HALF_UP))


def js_math_round(x: float) -> float:
    return math.floor(x + 0.5)


# --------------------------------------------------------------------------------------
# Xác suất (xấp xỉ giải tích Abramowitz & Stegun 7.1.26, như frontend)
# --------------------------------------------------------------------------------------


def normal_cdf(z: float) -> float:
    if z > 6.0:
        return 1.0
    if z < -6.0:
        return 0.0
    b1, b2, b3, b4, b5, p = 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429, 0.2316419
    c2 = 0.3989422804014327
    a = abs(z)
    t = 1.0 / (1.0 + p * a)
    poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t
    cdf = 1.0 - c2 * math.exp(-0.5 * a * a) * poly
    return cdf if z >= 0 else 1.0 - cdf


def admit_probability(
    user_score: float,
    forecast_p50: float,
    beta: float = 1.0,
    shock_std: float = DEFAULT_NATIONAL_SHOCK_STD,
    idio_std: float = DEFAULT_IDIO_STD,
) -> float:
    if not (math.isfinite(user_score) and math.isfinite(forecast_p50)):
        return 0.5
    beta = beta if math.isfinite(beta) and beta > 0 else 1.0
    shock = shock_std if math.isfinite(shock_std) and shock_std > 0 else DEFAULT_NATIONAL_SHOCK_STD
    idio = idio_std if math.isfinite(idio_std) and idio_std > 0 else DEFAULT_IDIO_STD
    sigma = math.sqrt(max(0.01, beta * beta * shock * shock + idio * idio))
    return normal_cdf((user_score - forecast_p50) / sigma)


def classify_role(prob: float) -> str:
    if prob >= SAFE_MIN_PROB:
        return "an_toan"
    if prob < REACH_MAX_PROB:
        return "mao_hiem"
    return "vua_tam"


_GH_NODES = [
    -4.499990707309, -3.669950373404, -2.967166927906, -2.325732486174, -1.719992575186,
    -1.136115585211, -0.565069583256, 0.0, 0.565069583256, 1.136115585211,
    1.719992575186, 2.325732486174, 2.967166927906, 3.669950373404, 4.499990707309,
]
_GH_WEIGHTS = [
    0.000000001522, 0.000001059116, 0.000100004441, 0.002778068843, 0.030780033873,
    0.158488915796, 0.412028687499, 0.564100308726, 0.412028687499, 0.158488915796,
    0.030780033873, 0.002778068843, 0.000100004441, 0.000001059116, 0.000000001522,
]


def portfolio_fail_all(
    items: Iterable[Mapping[str, float]],
    shock_std: float = DEFAULT_NATIONAL_SHOCK_STD,
    idio_std: float = DEFAULT_IDIO_STD,
) -> float:
    """Xác suất không đỗ nguyện vọng nào, có tính cú sốc điểm chuẩn chung toàn quốc (tích phân Gauss-Hermite)."""
    valid = [w for w in items if math.isfinite(w["userScore"]) and math.isfinite(w["forecastP50"])]
    if not valid:
        return 1.0
    shock = shock_std if shock_std > 0 else DEFAULT_NATIONAL_SHOCK_STD
    idio = idio_std if idio_std > 0 else DEFAULT_IDIO_STD
    total = 0.0
    for x, w_m in zip(_GH_NODES, _GH_WEIGHTS):
        survive = 1.0
        for w in valid:
            beta = w.get("beta") or 1.0
            cutoff = w["forecastP50"] + math.sqrt(2) * beta * shock * x
            p = normal_cdf((w["userScore"] - cutoff) / idio)
            survive *= max(0.0, min(1.0, 1.0 - p))
        total += w_m * survive
    return max(0.0, min(1.0, total / math.sqrt(math.pi)))


# --------------------------------------------------------------------------------------
# Điểm ưu tiên, quy đổi IELTS, điểm theo phương thức
# --------------------------------------------------------------------------------------

_AREA_BONUS = {"KV1": 0.75, "KV2-NT": 0.5, "KV2": 0.25, "KV3": 0.0}
_OBJECT_BONUS = {"uu_tien_1": 2.0, "uu_tien_2": 1.0}


def priority_bonus(area: str, obj: str, raw_total: float) -> float:
    base = min(3.0, _AREA_BONUS.get(area, 0.0) + _OBJECT_BONUS.get(obj, 0.0))
    if base <= 0:
        return 0.0
    if raw_total >= 22.5:
        scale = max(0.0, (30 - raw_total) / 7.5)
        return min(3.0, js_math_round(base * scale * 100) / 100)
    return base


def ielts_to_english(ielts: float | None, base: float | None) -> float | None:
    """Quy đổi IELTS thay môn Tiếng Anh (bảng phổ biến; mỗi trường quy đổi khác nhau). IELTS < 5.0: không quy đổi."""
    if not ielts or ielts < 5.0:
        return base
    floor = 10.0 if ielts >= 7.0 else 9.5 if ielts >= 6.5 else 9.0 if ielts >= 6.0 else 8.5 if ielts >= 5.5 else 7.0
    return max(base or 0.0, floor)


def _combo_score(scores: Mapping[str, Any], combo: str, ielts: float | None, allow_ielts: bool):
    subjects = COMBINATION_SUBJECTS.get(combo)
    if not subjects:
        return None
    total, used_ielts = 0.0, False
    for sub in subjects:
        v = scores.get(sub)
        v = float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
        if sub == "anh" and allow_ielts and ielts and ielts >= 5.0:
            converted = ielts_to_english(ielts, v)
            if converted is not None and (v is None or converted > v):
                v, used_ielts = converted, True
        if v is None or not math.isfinite(v):
            return None
        total += max(0.0, min(10.0, v))
    return min(30.0, js_math_round(total * 100) / 100), used_ielts


def program_method(program: Mapping[str, Any]) -> str:
    return program.get("admissionMethod") or "THPT"


def score_for_program(profile: Mapping[str, Any], program: Mapping[str, Any]) -> dict[str, Any] | None:
    """Điểm tốt nhất của học sinh cho chương trình theo đúng phương thức của ngưỡng điểm.
    None khi phương thức chưa tính được (ĐGNL, năng khiếu, kết hợp...) hoặc thiếu điểm môn."""
    method = program_method(program)
    if method not in SCORABLE_METHODS or program.get("requiresAptitude"):
        return None
    scores = profile.get("examScores") if method == "THPT" else profile.get("hocBaScores")
    if not scores:
        return None
    declared = program.get("combinations") or []
    published = [c for c in declared if c in COMBINATION_SUBJECTS]
    if declared and not published:
        return None
    unverified = not declared
    active = profile.get("activeCombination")
    combos = ([active] if active in COMBINATION_SUBJECTS else []) if unverified else published

    ielts = profile.get("ielts") or (profile.get("altScores") or {}).get("ielts")
    grad = profile.get("graduationYear")
    priority = profile.get("priority") or {}
    best = None
    for combo in combos:
        cs = _combo_score(scores, combo, ielts, method == "THPT")
        if cs is None:
            continue
        raw, used_ielts = cs
        # Từ kỳ thi 2026: tổng điểm thi gốc của tổ hợp phải đạt sàn 15/30, không cộng ưu tiên, không bù bằng IELTS.
        if method == "THPT" and grad is not None and grad >= 2026 and profile.get("minimumScoreException") is not True:
            exam_only = _combo_score(scores, combo, None, False)
            if exam_only is None or exam_only[0] < 15:
                continue
        bonus = priority_bonus(priority.get("area", "KV3"), priority.get("object", "none"), raw) if priority else 0.0
        score = min(30.0, js_math_round((raw + bonus) * 100) / 100)
        if best is None or score > best["score"]:
            best = {
                "method": method, "score": score, "rawScore": raw, "bonus": bonus, "combo": combo,
                "usedIeltsConversion": used_ielts, "comboUnverified": unverified,
            }
    return best


# --------------------------------------------------------------------------------------
# Danh mục chương trình (chuẩn hoá như frontend/src/data/catalog.ts)
# --------------------------------------------------------------------------------------

_NON_MAJOR = re.compile(r"^\s*(\(|\+|tổ hợp|phương thức|xét |ptxt|lĩnh vực|\d+\s*$)|\(môn|x\s*\d\s*\)|\/\s*\d", re.I)
_APTITUDE = re.compile(
    r"năng khiếu|âm nhạc|mỹ thuật|thể chất|thanh nhạc|piano|hội họa|điêu khắc|biểu diễn|diễn viên|đạo diễn|"
    r"nhiếp ảnh|múa|giáo dục mầm non|huấn luyện thể thao", re.I)
_MAJOR_CODE = re.compile(r"\b\d{4}\s?\d{3}\b")
_TRAILING = re.compile(
    r"\s*[-–(]*\s*(xét (kq|kết quả)[^)]*|tốt nghiệp thpt|tn ?thpt|thpt|học bạ|hb|kq thi|pt\s?\d+\w?|ptxt\s?\d*|nl|đgnl|đgtd)\)?\s*$",
    re.I)


def clean_major_name(raw: str) -> str:
    s = raw.strip()
    s = re.sub(r"^(-\s*|ct chuẩn\s*|chương trình đào tạo ngành\s+)", "", s, flags=re.I)
    s = re.sub(r"^\d{6,}\S*\s+", "", s)
    s = re.sub(r"^\d{2}(_[A-Za-z]+(\s[A-Z])?)?\s+", "", s)
    m = _MAJOR_CODE.search(s)
    if m:
        before = re.sub(r"[\s\-–:_]+$", "", s[: m.start()])
        after = re.sub(r"^[\s\-–:_]+", "", s[m.end():])
        s = before if (" " in before and len(before) >= 6) else after
        s = _MAJOR_CODE.split(s)[0].strip()
    s = re.sub(r"\s*[-–]\s*phương thức.*$", "", s, flags=re.I)
    for _ in range(6):
        nxt = _TRAILING.sub("", s)
        nxt = re.sub(r"[\s;,]+([A-Z]\d{2}|\d{1,4})$", "", nxt)
        nxt = re.sub(r"^[\s;,-]+|[\s;,-]+$", "", nxt)
        if nxt == s:
            break
        s = nxt
    return s if len(s) >= 3 else raw


def _num(v: Any) -> float | None:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def normalize_catalog_item(item: Mapping[str, Any]) -> dict[str, Any] | None:
    raw_name = item.get("majorName") or ""
    name = clean_major_name(raw_name)
    if _NON_MAJOR.search(raw_name) or _NON_MAJOR.search(name):
        return None
    if len(name) < 4 or name.isdigit():
        return None
    cutoffs = {
        str(y): float(s) for y, s in (item.get("cutoffs") or {}).items()
        if _num(s) is not None and MIN_VALID_CUTOFF <= s <= 30
    }
    if not cutoffs:
        return None
    years = sorted(int(y) for y in cutoffs)
    latest_score = cutoffs[str(years[-1])]
    fp50 = _num(item.get("forecastP50"))
    p50 = fp50 if fp50 is not None and MIN_VALID_CUTOFF <= fp50 <= 30 else latest_score
    fp10, fp90 = _num(item.get("forecastP10")), _num(item.get("forecastP90"))
    p10 = min(fp10, p50) if fp10 is not None else p50 - 1.5
    p90 = max(fp90, p50) if fp90 is not None else p50 + 1.5
    region = item.get("region") if item.get("region") in ("bac", "trung", "nam") else None
    method = item.get("admissionMethod") or "THPT"
    return {
        "programId": item["programId"],
        "majorKey": item.get("majorKey"),
        "schoolCode": item["schoolCode"],
        "schoolName": item.get("schoolName") or item["schoolCode"],
        "region": region,
        "province": item.get("schoolProvince") or "",
        "majorName": name,
        "majorGroup": item.get("majorGroup") or "other",
        "admissionMethod": method,
        "methodInferred": bool(item.get("methodInferred")),
        "cutoffs": cutoffs,
        "forecastP10": js_to_fixed(max(0.0, p10), 2),
        "forecastP50": js_to_fixed(p50, 2),
        "forecastP90": js_to_fixed(min(30.0, p90), 2),
        "tuitionVnd": _num(item.get("tuitionVnd")),
        "employmentRate": _num(item.get("employmentRate")),
        "betaProgram": js_to_fixed(item.get("betaProgram") or 1.0, 3),
        "yearsOfData": len(years),
        "sourceTier": "aggregator_verified" if item.get("sourceTier") == "aggregator_verified" else "official_pdf",
        "sourceUrl": item.get("sourceUrl"),
        "dataPassport": item.get("dataPassport") or "Đề án tuyển sinh",
        "combinations": list(item.get("combinations") or []),
        "combinationsVerified": bool(item.get("combinationsVerified")),
        "requiresAptitude": bool(_APTITUDE.search(raw_name) or method == "NANG_KHIEU"),
    }


def load_catalog(path: Path | str | None = None) -> list[dict[str, Any]]:
    raw = json.loads(Path(path or DEFAULT_CATALOG_PATH).read_text(encoding="utf-8"))
    out = [normalize_catalog_item(i) for i in raw]
    return [p for p in out if p is not None]


# --------------------------------------------------------------------------------------
# Ứng viên: xác suất đỗ của học sinh cho từng ngành (phương thức tốt nhất)
# --------------------------------------------------------------------------------------


def build_candidates(
    programs: list[dict[str, Any]],
    profile: Mapping[str, Any],
    shock_std: float = DEFAULT_NATIONAL_SHOCK_STD,
    idio_std: float = DEFAULT_IDIO_STD,
) -> list[dict[str, Any]]:
    budget = profile.get("annualBudgetVnd") or 0
    excluded_schools = {c.strip().upper() for c in profile.get("excludedSchoolCodes") or []}
    excluded_groups = {g.strip().lower() for g in profile.get("excludedMajorGroups") or []}

    by_group: dict[str, list[float]] = {}
    for p in programs:
        if p["forecastP50"] and p["forecastP50"] >= 10 and p["majorGroup"]:
            by_group.setdefault(p["majorGroup"].strip().lower(), []).append(p["forecastP50"])
    medians = {g: sorted(v)[len(v) // 2] for g, v in by_group.items()}

    candidates: list[dict[str, Any]] = []
    for p in programs:
        if p["schoolCode"].strip().upper() in excluded_schools or p["majorGroup"].strip().lower() in excluded_groups:
            continue
        if budget > 0 and p["tuitionVnd"] is not None and p["tuitionVnd"] > budget:
            continue
        ms = score_for_program(profile, p)
        if ms is None or ms["score"] <= 0:
            continue
        p50, p10, p90 = p["forecastP50"], p["forecastP10"], p["forecastP90"]
        years = p["yearsOfData"]
        fallback = medians.get(p["majorGroup"].strip().lower()) or 21.0
        if not p50 or p50 < 10:
            p50 = fallback
            p10 = max(12.0, js_to_fixed(p50 - 2.5 * 1.6, 2))
            p90 = min(30.0, js_to_fixed(p50 + 2.5 * 1.6, 2))
        elif years == 0:
            half = max(1.0, ((p90 if p90 is not None else p50 + 1.5) - (p10 if p10 is not None else p50 - 1.5)) / 2)
            p10 = max(12.0, js_to_fixed(p50 - half * 1.6, 2))
            p90 = min(30.0, js_to_fixed(p50 + half * 1.6, 2))
        prob = admit_probability(ms["score"], p50, shock_std=shock_std, idio_std=idio_std)
        candidates.append({
            "programId": p["programId"],
            "majorKey": p["majorKey"],
            "schoolCode": p["schoolCode"],
            "schoolName": p["schoolName"],
            "majorName": p["majorName"],
            "majorGroup": p["majorGroup"],
            "combination": ms["combo"],
            "combinationsVerified": not ms["comboUnverified"],
            "admissionMethod": ms["method"],
            "methodInferred": p["methodInferred"],
            "userScore": js_to_fixed(ms["score"], 2),
            "cutoffP50": p50,
            "cutoffP10": p10,
            "cutoffP90": p90,
            "yearsOfData": years,
            "gap": js_to_fixed(ms["score"] - p50, 2),
            "admitProbability": js_to_fixed(prob, 3),
            "role": classify_role(prob),
            "tuitionVnd": p["tuitionVnd"],
            "employmentRate": p["employmentRate"],
            "region": p["region"],
            "province": p["province"],
            "sourceTier": p["sourceTier"],
            "sourceUrl": p["sourceUrl"],
            "usedIeltsConversion": ms["usedIeltsConversion"],
        })

    best: dict[str, dict[str, Any]] = {}
    for c in candidates:
        key = c["majorKey"] or c["programId"]
        prev = best.get(key)
        if prev is None or c["admitProbability"] > prev["admitProbability"]:
            best[key] = c
    return list(best.values())


def region_of_province(province: str | None) -> str | None:
    return PROVINCE_REGIONS.get(province) if province else None


def matches_constraints(c: Mapping[str, Any], profile: Mapping[str, Any]) -> bool:
    home = profile.get("homeProvince")
    reloc = profile.get("relocationWillingness") or "khong_gioi_han"
    if reloc == "chi_tinh_nha" and home and c["province"] != home:
        return False
    if reloc == "trong_vung" and home:
        region = region_of_province(home)
        if region and c["region"] != region:
            return False
    budget = profile.get("annualBudgetVnd") or 0
    if 0 < budget < UNLIMITED_BUDGET_VND and c["tuitionVnd"] and c["tuitionVnd"] > budget:
        return False
    interest = profile.get("interestMajorGroups") or []
    if interest and c["majorGroup"] not in interest:
        return False
    return True


def rank_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Xếp theo xác suất (làm tròn 1%), cùng mức thì ngành điểm chuẩn cao hơn trước."""
    return sorted(candidates, key=lambda c: (-round_pct(c["admitProbability"]), -c["cutoffP50"]))


def round_pct(prob: float) -> int:
    return int(js_math_round(prob * 100))


# --------------------------------------------------------------------------------------
# Đề xuất danh sách nguyện vọng
# --------------------------------------------------------------------------------------

_REACH_MIN = 0.1
_MAX_PER_SCHOOL = 3


def _by_cutoff(l: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(l, key=lambda c: (-c["cutoffP50"], -c["admitProbability"]))


def _round_robin(l: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for c in _by_cutoff(l):
        groups.setdefault(c["majorGroup"], []).append(c)
    queues = list(groups.values())
    out: list[dict[str, Any]] = []
    while any(queues):
        for q in queues:
            if q:
                out.append(q.pop(0))
    return out


def _teacher_training_first_five(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    is_teacher = lambda c: c["majorGroup"] == "su_pham"  # noqa: E731
    head, tail = items[:5], items[5:]
    rest = [c for c in tail if not is_teacher(c)]
    for late in [c for c in tail if is_teacher(c)]:
        slot = next((i for i in range(len(head) - 1, -1, -1) if not is_teacher(head[i])), -1)
        if slot < 0:
            rest.append(late)
            continue
        displaced = head[slot]
        head[slot] = late
        rest.insert(0, displaced)
    return head + rest


def suggest_portfolio(matched: list[dict[str, Any]], has_interest: bool, size: int = MAX_WISHES) -> list[dict[str, Any]]:
    order = _by_cutoff if has_interest else _round_robin
    tiers = {
        "reach": order([c for c in matched if _REACH_MIN <= c["admitProbability"] < REACH_MAX_PROB]),
        "fit": order([c for c in matched if REACH_MAX_PROB <= c["admitProbability"] < SAFE_MIN_PROB]),
        "safe": order([c for c in matched if c["admitProbability"] >= SAFE_MIN_PROB]),
    }
    per_school: dict[str, int] = {}
    chosen: list[dict[str, Any]] = []

    def take(l: list[dict[str, Any]], n: int) -> None:
        for c in l:
            if n <= 0 or len(chosen) >= size:
                return
            if any(c is x for x in chosen):
                continue
            if per_school.get(c["schoolCode"], 0) >= _MAX_PER_SCHOOL:
                continue
            chosen.append(c)
            per_school[c["schoolCode"]] = per_school.get(c["schoolCode"], 0) + 1
            n -= 1

    take(tiers["safe"], int(js_math_round(size * 0.4)))
    take(tiers["fit"], int(js_math_round(size * 0.33)))
    take(tiers["reach"], int(js_math_round(size * 0.27)))
    take(tiers["fit"], size)
    take(tiers["safe"], size)
    take(tiers["reach"], size)

    ordered = _teacher_training_first_five(_by_cutoff(chosen))
    first_sure = next((i for i, c in enumerate(ordered) if c["admitProbability"] >= 0.95), -1)
    return ordered[: first_sure + 1] if first_sure >= 0 else ordered


def portfolio_summary(items: list[dict[str, Any]], shock_std: float, idio_std: float) -> dict[str, Any]:
    p_fail = portfolio_fail_all(
        [{"userScore": c["userScore"], "forecastP50": c["cutoffP50"]} for c in items], shock_std, idio_std
    ) if items else 1.0
    counts = {"an_toan": 0, "vua_tam": 0, "mao_hiem": 0}
    for c in items:
        counts[c["role"]] += 1
    shadowed = []
    first_sure = next((i for i, c in enumerate(items) if c["admitProbability"] >= 0.95), -1)
    if first_sure >= 0:
        shadowed = list(range(first_sure + 1, len(items)))
    return {"pFailAll": p_fail, "counts": counts, "shadowedPositions": shadowed}
