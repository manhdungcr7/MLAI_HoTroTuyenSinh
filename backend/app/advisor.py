"""API tư vấn tuyển sinh: từ hồ sơ học sinh → danh sách ngành xếp theo xác suất đỗ.

Cùng lõi với frontend (common/admission_core.py được đối chiếu tự động với engine TypeScript),
dùng cho ứng dụng di động, tích hợp bên ngoài và kiểm chứng độc lập.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from common import admission_core as core

router = APIRouter(prefix="/api/advisor", tags=["advisor"])

SHOCK_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "national_shock.json"

Score = Field(None, ge=0, le=10)


class SubjectScores(BaseModel):
    """Điểm môn thang 10. Chỉ nhập các môn em thi/học."""
    model_config = ConfigDict(extra="ignore")
    toan: float | None = Score
    van: float | None = Score
    anh: float | None = Score
    ly: float | None = Score
    hoa: float | None = Score
    sinh: float | None = Score
    su: float | None = Score
    dia: float | None = Score
    gdcd: float | None = Score
    tin: float | None = Score
    cncn: float | None = Score
    cnnn: float | None = Score


class PriorityIn(BaseModel):
    area: Literal["KV1", "KV2-NT", "KV2", "KV3"] = "KV3"
    object: Literal["none", "uu_tien_1", "uu_tien_2", "uu_tien_3"] = "none"


class AltScoresIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ielts: float | None = Field(None, ge=0, le=9)


class AdvisorProfile(BaseModel):
    """Hồ sơ học sinh. Tên trường giống StudentProfile của frontend."""
    model_config = ConfigDict(extra="ignore")
    examScores: SubjectScores | None = None
    hocBaScores: SubjectScores | None = None
    altScores: AltScoresIn = Field(default_factory=AltScoresIn)
    activeCombination: str | None = None
    priority: PriorityIn = Field(default_factory=PriorityIn)
    graduationYear: int | None = Field(None, ge=2020, le=2040)
    minimumScoreException: bool | None = None
    homeProvince: str | None = None
    relocationWillingness: Literal["chi_tinh_nha", "trong_vung", "khong_gioi_han"] = "khong_gioi_han"
    annualBudgetVnd: int = Field(0, ge=0)
    interestMajorGroups: list[str] = Field(default_factory=list, max_length=20)
    excludedSchoolCodes: list[str] = Field(default_factory=list, max_length=200)
    excludedMajorGroups: list[str] = Field(default_factory=list, max_length=20)

    def to_core(self) -> dict[str, Any]:
        data = self.model_dump()
        for key in ("examScores", "hocBaScores"):
            data[key] = {k: v for k, v in (data[key] or {}).items() if v is not None}
        return data


class SearchFilters(BaseModel):
    region: Literal["all", "bac", "trung", "nam"] = "all"
    method: Literal["all", "THPT", "HOC_BA"] = "all"
    majorGroup: str | None = None
    combination: str | None = None
    tier: Literal["all", "an_toan", "vua_tam", "mao_hiem"] = "all"
    query: str | None = Field(None, max_length=100)
    applyProfileConstraints: bool = True


class SearchRequest(BaseModel):
    profile: AdvisorProfile
    filters: SearchFilters = Field(default_factory=SearchFilters)
    limit: int = Field(50, ge=1, le=200)
    offset: int = Field(0, ge=0)


class PortfolioRequest(BaseModel):
    profile: AdvisorProfile
    programIds: list[str] | None = Field(
        None, max_length=core.MAX_WISHES,
        description="Danh sách nguyện vọng em tự xếp (theo thứ tự). Bỏ trống để hệ thống đề xuất.",
    )


@lru_cache(maxsize=1)
def _catalog() -> list[dict[str, Any]]:
    try:
        return core.load_catalog()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Danh mục chương trình chưa được nạp") from exc


def _shock() -> tuple[float, float]:
    try:
        data = json.loads(SHOCK_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return core.DEFAULT_NATIONAL_SHOCK_STD, core.DEFAULT_IDIO_STD
    return (
        float(data.get("overall_std") or core.DEFAULT_NATIONAL_SHOCK_STD),
        float(data.get("idio_std_overall") or core.DEFAULT_IDIO_STD),
    )


def _public(c: dict[str, Any]) -> dict[str, Any]:
    out = {k: v for k, v in c.items() if k not in ("sourceUrl",)}
    out["methodLabel"] = core.METHOD_LABELS_VI.get(c["admissionMethod"], c["admissionMethod"])
    out["probabilityPercent"] = core.round_pct(c["admitProbability"])
    out["source"] = c.get("sourceUrl")
    return out


def _not_computable(programs: list[dict[str, Any]], candidates: list[dict[str, Any]], profile: dict[str, Any]) -> dict[str, int]:
    """Ngành có ngưỡng điểm nhưng chưa tính được cho học sinh, và lý do."""
    computed = {c["majorKey"] or c["programId"] for c in candidates}
    counts = {"hocBaMissingScores": 0, "examMissingScores": 0, "methodNotSupported": 0}
    seen: set[str] = set()
    for p in programs:
        key = p["majorKey"] or p["programId"]
        if key in computed or key in seen:
            continue
        method = core.program_method(p)
        if method not in core.SCORABLE_METHODS or p["requiresAptitude"]:
            counts["methodNotSupported"] += 1
        elif core.score_for_program(profile, p) is None:
            counts["hocBaMissingScores" if method == "HOC_BA" else "examMissingScores"] += 1
        else:
            continue
        seen.add(key)
    return counts


@router.post("/search")
def search(req: SearchRequest) -> dict[str, Any]:
    """Mọi ngành của mọi trường thỏa ràng buộc, xếp theo xác suất đỗ (phương thức tốt nhất cho học sinh)."""
    programs = _catalog()
    profile = req.profile.to_core()
    shock, idio = _shock()
    candidates = core.build_candidates(programs, profile, shock, idio)
    not_computable = _not_computable(programs, candidates, profile)

    pool = [c for c in candidates if core.matches_constraints(c, profile)] if req.filters.applyProfileConstraints else candidates
    f = req.filters
    q = (f.query or "").strip().lower()
    items = [
        c for c in pool
        if (f.region == "all" or c["region"] == f.region)
        and (f.method == "all" or c["admissionMethod"] == f.method)
        and (not f.majorGroup or c["majorGroup"] == f.majorGroup)
        and (not f.combination or c["combination"] == f.combination)
        and (f.tier == "all" or c["role"] == f.tier)
        and (not q or q in f"{c['schoolName']} {c['schoolCode']} {c['majorName']}".lower())
    ]
    ranked = core.rank_candidates(items)
    tiers = {"an_toan": 0, "vua_tam": 0, "mao_hiem": 0}
    for c in ranked:
        tiers[c["role"]] += 1
    return {
        "total": len(ranked),
        "tiers": tiers,
        "computableBeforeConstraints": len(candidates),
        "notComputable": not_computable,
        "items": [_public(c) for c in ranked[req.offset: req.offset + req.limit]],
        "disclaimer": "Xác suất là ước lượng thống kê từ điểm chuẩn các năm trước, không phải cam kết. "
                      "Đối chiếu đề án tuyển sinh chính thức của trường trước khi nộp nguyện vọng.",
    }


@router.post("/portfolio")
def portfolio(req: PortfolioRequest) -> dict[str, Any]:
    """Đề xuất (hoặc đánh giá) danh sách tối đa 15 nguyện vọng và xác suất không đỗ nguyện vọng nào."""
    programs = _catalog()
    profile = req.profile.to_core()
    shock, idio = _shock()
    candidates = core.build_candidates(programs, profile, shock, idio)
    by_id = {c["programId"]: c for c in candidates}

    if req.programIds is not None:
        missing = [pid for pid in req.programIds if pid not in by_id]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Không tính được xác suất cho {len(missing)} chương trình (sai mã hoặc thiếu điểm): {missing[:5]}",
            )
        if len(set(req.programIds)) != len(req.programIds):
            raise HTTPException(status_code=422, detail="Danh sách có chương trình bị trùng")
        items = [by_id[pid] for pid in req.programIds]
        mode = "evaluate"
    else:
        matched = [c for c in candidates if core.matches_constraints(c, profile)]
        items = core.suggest_portfolio(matched, bool(profile["interestMajorGroups"]))
        mode = "suggest"

    summary = core.portfolio_summary(items, shock, idio)
    warnings: list[str] = []
    if items and summary["counts"]["an_toan"] < 2:
        warnings.append("Có dưới 2 nguyện vọng an toàn (xác suất từ 80%).")
    if summary["shadowedPositions"]:
        warnings.append(
            "Các nguyện vọng sau vị trí gần như chắc đỗ (≥ 95%) hầu như không bao giờ được xét: "
            + ", ".join(f"#{i + 1}" for i in summary["shadowedPositions"])
        )
    teacher_late = [i + 1 for i, c in enumerate(items) if c["majorGroup"] == "su_pham" and i >= 5]
    if teacher_late:
        warnings.append("Nguyện vọng ngành sư phạm phải nằm trong 5 vị trí đầu: " + ", ".join(f"#{n}" for n in teacher_late))
    return {
        "mode": mode,
        "pFailAll": summary["pFailAll"],
        "counts": summary["counts"],
        "warnings": warnings,
        "items": [{"rank": i + 1, **_public(c)} for i, c in enumerate(items)],
    }


@router.get("/methods")
def methods() -> dict[str, Any]:
    """Các phương thức xét tuyển hệ thống hiểu, phương thức nào đã tính được xác suất, và số liệu danh mục."""
    programs = _catalog()
    by_method: dict[str, int] = {}
    for p in programs:
        by_method[p["admissionMethod"]] = by_method.get(p["admissionMethod"], 0) + 1
    return {
        "methods": [
            {
                "code": code,
                "label": label,
                "probabilityComputed": code in core.SCORABLE_METHODS,
                "programs": by_method.get(code, 0),
            }
            for code, label in core.METHOD_LABELS_VI.items()
        ],
        "catalog": {
            "programs": len(programs),
            "schools": len({p["schoolCode"] for p in programs}),
            "withTuition": sum(p["tuitionVnd"] is not None for p in programs),
            "withVerifiedCombinations": sum(p["combinationsVerified"] for p in programs),
        },
    }


@router.get("/programs/{program_id}")
def program_detail(program_id: str) -> dict[str, Any]:
    for p in _catalog():
        if p["programId"] == program_id:
            return {**{k: v for k, v in p.items() if k != "sourceUrl"}, "source": p["sourceUrl"],
                    "methodLabel": core.METHOD_LABELS_VI.get(p["admissionMethod"])}
    raise HTTPException(status_code=404, detail="Không tìm thấy chương trình")
