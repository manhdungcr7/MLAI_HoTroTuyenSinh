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

FORECAST_YEAR = 2027  # năm tuyển sinh cần dự báo; cập nhật cùng probability.ts khi có điểm chuẩn mùa mới
THIN_DATA_MULTIPLIER = 1.3
DEFAULT_NATIONAL_SHOCK_STD = 1.29
DEFAULT_IDIO_STD = 1.28
SAFE_MIN_PROB = 0.8
REACH_MAX_PROB = 0.4
MIN_VALID_CUTOFF = 12
UNLIMITED_BUDGET_VND = 200_000_000
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


def sigma_scale_for(latest_year: int | None, years_of_data: int | None, forecast_year: int = FORECAST_YEAR) -> float:
    """Hệ số nhân độ bất định: căn số năm kể từ dữ liệu gần nhất, và hệ số cho chương trình chỉ có 1 năm dữ liệu."""
    age = max(1, forecast_year - (latest_year if latest_year is not None else forecast_year - 1))
    return math.sqrt(age) * (THIN_DATA_MULTIPLIER if (years_of_data or 0) <= 1 else 1.0)


def admit_probability(
    user_score: float,
    forecast_p50: float,
    beta: float = 1.0,
    shock_std: float = DEFAULT_NATIONAL_SHOCK_STD,
    idio_std: float = DEFAULT_IDIO_STD,
    sigma_scale: float = 1.0,
) -> float:
    if not (math.isfinite(user_score) and math.isfinite(forecast_p50)):
        return 0.5
    beta = beta if math.isfinite(beta) and beta > 0 else 1.0
    shock = shock_std if math.isfinite(shock_std) and shock_std > 0 else DEFAULT_NATIONAL_SHOCK_STD
    idio = idio_std if math.isfinite(idio_std) and idio_std > 0 else DEFAULT_IDIO_STD
    scale = sigma_scale if math.isfinite(sigma_scale) and sigma_scale > 0 else 1.0
    sigma = math.sqrt(max(0.01, beta * beta * shock * shock + idio * idio)) * scale
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
            scale = w.get("sigmaScale") or 1.0
            sigma_i2 = scale * scale * (beta * beta * shock * shock + idio * idio)
            idio_i = math.sqrt(max(0.01, sigma_i2 - beta * beta * shock * shock))
            p = normal_cdf((w["userScore"] - cutoff) / idio_i)
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


def program_method(program: Mapping[str, Any]) -> str:
    return program.get("admissionMethod") or "THPT"


# --------------------------------------------------------------------------------------
# Quy tắc riêng của từng trường (cùng cấu trúc với frontend/src/engine/scoring/school-rules.ts)
# --------------------------------------------------------------------------------------

DEFAULT_RULES: dict[str, dict[str, Any]] = {
    "THPT": {"components": [{"source": "exam_combo", "weight": 1}], "priority": "standard", "englishCertConversion": "common"},
    "HOC_BA": {"components": [{"source": "hocba_combo", "weight": 1}], "priority": "standard"},
}
COMBO_SOURCES = ("exam_combo", "hocba_combo")
EXTERNAL_SCALES = {"dgnl_hcm": 1200, "dgnl_hn": 150, "dgtd_bk": 100}
DEFAULT_BONUS_CAP = 3.0
RULES_DIR = ROOT / "frontend" / "src" / "data" / "school-rules"
_SOURCES = ("exam_combo", "hocba_combo", "dgnl_hcm", "dgnl_hn", "dgtd_bk")
_SCHOOL_RULES: dict[str, dict[str, Any]] = {}


def validate_school_rule(rule: Mapping[str, Any]) -> list[str]:
    problems: list[str] = []
    if not re.fullmatch(r"[A-Z0-9]{2,5}", str(rule.get("schoolCode", ""))):
        problems.append("mã trường phải gồm 2–5 chữ hoa/số")
    year = rule.get("year")
    if not isinstance(year, int) or year < 2025:
        problems.append("năm tuyển sinh không hợp lệ")
    src = rule.get("source") or {}
    if not re.match(r"https?://", str(src.get("url", ""))):
        problems.append("thiếu đường dẫn văn bản gốc")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(src.get("verifiedAt", ""))):
        problems.append("thiếu ngày kiểm chứng (YYYY-MM-DD)")
    if not src.get("verifiedBy"):
        problems.append("thiếu người kiểm chứng")
    methods = rule.get("methods") or {}
    if not methods:
        problems.append("chưa có phương thức nào")
    for method, m in methods.items():
        comps = m.get("components") or []
        if not comps:
            problems.append(f"{method}: thiếu thành phần điểm")
        total = sum(c.get("weight", 0) for c in comps)
        if comps and abs(total - 1) > 1e-9:
            problems.append(f"{method}: tổng tỷ trọng các thành phần phải bằng 1 (đang {total})")
        for c in comps:
            if c.get("source") not in _SOURCES:
                problems.append(f"{method}: nguồn điểm không hợp lệ \"{c.get('source')}\"")
            if not (0 < c.get("weight", 0) <= 1):
                problems.append(f"{method}: tỷ trọng phải trong (0, 1]")
            if c.get("grades") and c.get("source") != "hocba_combo":
                problems.append(f"{method}: chỉ học bạ mới chọn lớp")
            if c.get("subjectWeights") and c.get("source") not in COMBO_SOURCES:
                problems.append(f"{method}: hệ số môn chỉ dùng cho tổ hợp môn")
            if any(not (w > 0) for w in (c.get("subjectWeights") or {}).values()):
                problems.append(f"{method}: hệ số môn phải dương")
        if m.get("englishCertConversion") not in (None, "common", "none"):
            problems.append(f"{method}: englishCertConversion phải là common hoặc none")
        for t in (m.get("certBonus") or {}).get("ielts", []):
            if not (0 <= t.get("min", -1) <= 9 and 0 <= t.get("points", -1) <= 3):
                problems.append(f"{method}: bảng điểm cộng IELTS không hợp lệ")
        if m.get("priority") not in ("standard", "none"):
            problems.append(f"{method}: priority phải là standard hoặc none")
        if "bonusCap" in m and not (0 <= m["bonusCap"] <= 3):
            problems.append(f"{method}: trần điểm cộng phải trong [0, 3]")
        if "minExamComboTotal" in m and not (0 <= m["minExamComboTotal"] <= 30):
            problems.append(f"{method}: ngưỡng tổng điểm thi phải trong [0, 30]")
    return problems


def register_school_rules(rules: Iterable[Mapping[str, Any]]) -> None:
    for rule in rules:
        problems = validate_school_rule(rule)
        if problems:
            raise ValueError(f"Quy tắc trường {rule.get('schoolCode')} không hợp lệ: {'; '.join(problems)}")
        _SCHOOL_RULES[str(rule["schoolCode"]).upper()] = dict(rule)


def registered_school_rules() -> list[dict[str, Any]]:
    return list(_SCHOOL_RULES.values())


def clear_school_rules() -> None:
    _SCHOOL_RULES.clear()


def load_school_rules(directory: Path | str | None = None) -> list[dict[str, Any]]:
    """Nạp quy tắc từ các file JSON trong thư mục (mặc định: thư mục dùng chung với frontend)."""
    folder = Path(directory or RULES_DIR)
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(folder.glob("*.json"))]


def resolve_method_rule(school_code: str, method: str):
    school = _SCHOOL_RULES.get(school_code.upper())
    own = (school or {}).get("methods", {}).get(method)
    if own:
        return own, "school", (school or {}).get("source")
    fallback = DEFAULT_RULES.get(method)
    return (fallback, "default", None) if fallback else None


def _clamp10(v: float) -> float:
    return max(0.0, min(10.0, v))


def _num_or_none(v: Any) -> float | None:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def _combo_component(component, subjects, profile, needs, allow_cert):
    if component["source"] == "exam_combo":
        if not profile.get("examScores"):
            needs.add("Điểm thi các môn của tổ hợp")
            return None
        sources = [profile["examScores"]]
    elif component.get("grades"):
        sources = []
        for g in component["grades"]:
            grade = (profile.get("hocBaGrades") or {}).get(str(g))
            if not grade:
                needs.add(f"Điểm học bạ lớp {g}")
            else:
                sources.append(grade)
        if len(sources) < len(component["grades"]):
            return None
    else:
        if not profile.get("hocBaScores"):
            needs.add("Điểm học bạ các môn của tổ hợp")
            return None
        sources = [profile["hocBaScores"]]

    weighted, max_total, used_ielts = 0.0, 0.0, False
    ielts = profile.get("ielts") or (profile.get("altScores") or {}).get("ielts")
    for sub in subjects:
        w = (component.get("subjectWeights") or {}).get(sub, 1)
        values = [_num_or_none(s.get(sub)) for s in sources]
        v = sum(values) / len(values) if all(x is not None for x in values) else None
        if sub == "anh" and allow_cert and ielts and ielts >= 5.0:
            converted = ielts_to_english(ielts, v)
            if converted is not None and (v is None or converted > v):
                v, used_ielts = converted, True
        if v is None:
            needs.add(f"Điểm môn {sub}")
            return None
        weighted += w * _clamp10(v)
        max_total += w * 10
    return weighted, max_total, used_ielts


def _score_combo(profile, rule, combo, needs):
    subjects = COMBINATION_SUBJECTS.get(combo, []) if combo else []
    allow_conversion = (rule.get("englishCertConversion") or "none") == "common"
    base, used_ielts, exam_raw = 0.0, False, None
    alt = profile.get("altScores") or {}
    for c in rule["components"]:
        if c["source"] in COMBO_SOURCES:
            cs = _combo_component(c, subjects, profile, needs, allow_conversion and c["source"] == "exam_combo")
            if cs is None:
                return None
            weighted, max_total, used = cs
            value30 = (weighted / max_total) * 30
            used_ielts = used_ielts or used
            if c["source"] == "exam_combo":
                own = profile.get("examScores")
                exam_raw = sum(_clamp10(_num_or_none(own.get(s)) or 0.0) for s in subjects) if own else None
        else:
            v = _num_or_none(alt.get(c["source"]))
            if v is None:
                needs.add(c["source"])
                return None
            scale = EXTERNAL_SCALES[c["source"]]
            value30 = (max(0.0, min(float(scale), v)) / scale) * 30
        base += c["weight"] * value30
    base = min(30.0, js_math_round(base * 100) / 100)

    grad = profile.get("graduationYear")
    uses_exam = any(c["source"] == "exam_combo" for c in rule["components"])
    min_total = rule.get("minExamComboTotal")
    if uses_exam and exam_raw is not None and grad is not None and grad >= 2026 and profile.get("minimumScoreException") is not True:
        if js_math_round(exam_raw * 100) / 100 < max(15, min_total or 0):
            return None
    elif uses_exam and exam_raw is not None and min_total is not None and js_math_round(exam_raw * 100) / 100 < min_total:
        return None

    cert_points = 0.0
    ielts = profile.get("ielts") or alt.get("ielts")
    if ielts:
        for t in (rule.get("certBonus") or {}).get("ielts", []):
            if ielts >= t["min"] and t["points"] > cert_points:
                cert_points = t["points"]
    priority = profile.get("priority") or {}
    pri = priority_bonus(priority.get("area", "KV3"), priority.get("object", "none"), base) if rule["priority"] == "standard" and priority else 0.0
    bonus = js_math_round(min(rule.get("bonusCap", DEFAULT_BONUS_CAP), cert_points + pri) * 100) / 100
    return {
        "score": min(30.0, js_math_round((base + bonus) * 100) / 100),
        "rawScore": base, "bonus": bonus, "usedIeltsConversion": used_ielts,
    }


def evaluate_program(profile: Mapping[str, Any], program: Mapping[str, Any]):
    """(điểm tốt nhất theo quy tắc của trường, các đầu vào còn thiếu)."""
    method = program_method(program)
    resolved = resolve_method_rule(program["schoolCode"], method)
    if resolved is None or program.get("requiresAptitude"):
        return None, []
    rule, origin, source = resolved
    needs_combo = any(c["source"] in COMBO_SOURCES for c in rule["components"])
    combos: list[str] = [""]
    unverified = False
    if needs_combo:
        declared = program.get("combinations") or []
        published = [c for c in declared if c in COMBINATION_SUBJECTS]
        if declared and not published:
            return None, []
        unverified = not declared
        active = profile.get("activeCombination")
        combos = ([active] if active in COMBINATION_SUBJECTS else []) if unverified else published
        if not combos:
            return None, ["Tổ hợp xét tuyển"]
    missing: set[str] = set()
    best = None
    for combo in combos:
        s = _score_combo(profile, rule, combo, missing)
        if s is None:
            continue
        if best is None or s["score"] > best["score"]:
            best = {**s, "method": method, "combo": combo, "comboUnverified": unverified,
                    "ruleOrigin": origin, "ruleSource": source}
    return best, ([] if best else sorted(missing))


def score_for_program(profile: Mapping[str, Any], program: Mapping[str, Any]):
    return evaluate_program(profile, program)[0]


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
        "latestYear": years[-1],
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
        sigma_scale = sigma_scale_for(p["latestYear"], years)
        prob = admit_probability(ms["score"], p50, shock_std=shock_std, idio_std=idio_std, sigma_scale=sigma_scale)
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
            "sigmaScale": sigma_scale,
            "ruleOrigin": ms["ruleOrigin"],
            "ruleSource": (ms["ruleSource"] or {}).get("url") if ms["ruleSource"] else None,
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
_MAX_FAVORITES = 6


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


def suggest_portfolio(
    matched: list[dict[str, Any]], has_interest: bool, favorite_ids: Iterable[str] = (), size: int = MAX_WISHES
) -> list[dict[str, Any]]:
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
    favorites = set(favorite_ids)
    take(_by_cutoff([c for c in matched if c["programId"] in favorites and c["admitProbability"] >= _REACH_MIN]), _MAX_FAVORITES)
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
        [{"userScore": c["userScore"], "forecastP50": c["cutoffP50"], "sigmaScale": c["sigmaScale"]} for c in items], shock_std, idio_std
    ) if items else 1.0
    counts = {"an_toan": 0, "vua_tam": 0, "mao_hiem": 0}
    for c in items:
        counts[c["role"]] += 1
    shadowed = []
    first_sure = next((i for i, c in enumerate(items) if c["admitProbability"] >= 0.95), -1)
    if first_sure >= 0:
        shadowed = list(range(first_sure + 1, len(items)))
    return {"pFailAll": p_fail, "counts": counts, "shadowedPositions": shadowed}
