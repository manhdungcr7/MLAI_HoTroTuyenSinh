"""Request/response schema for /api/recommend — the 7-dimension input model.

Replaces the old flat {scores, context, preferences} dict from Gemini's
main.py, which only carried: one THPT score, province, budget, one major
group. This schema is the concrete form of the 7 decision dimensions in ba.md §6.1 (F1).
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from typing_extensions import Self

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

Subject = Literal["toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia", "gdcd"]
PriorityArea = Literal["KV1", "KV2-NT", "KV2", "KV3"]        # khu vực ưu tiên
PriorityObject = Literal[
    "none", "uu_tien_1", "uu_tien_2", "uu_tien_3",            # giữ UT3 cho client cũ; engine hiện hành tính 0 điểm
]
RelocationWillingness = Literal["chi_tinh_nha", "trong_vung", "khong_gioi_han"]
PolicyStatus = Literal["none", "ho_ngheo", "can_ngheo", "dan_toc_thieu_so",
                       "khuyet_tat", "mo_coi", "vung_dbkk"]

# --------------------------------------------------------------------------
# 2.4 Tuyển sinh — điểm số theo môn, không phải một con số duy nhất
# --------------------------------------------------------------------------
class ExamScores(BaseModel):
    """Điểm thi THPT theo từng môn (thang 10). Hệ thống tự tính điểm theo
    TỪNG tổ hợp mà mỗi chương trình xét, vì một ngành có thể xét nhiều tổ hợp
    với điểm chuẩn khác nhau."""
    toan: float | None = Field(None, ge=0, le=10)
    van: float | None = Field(None, ge=0, le=10)
    anh: float | None = Field(None, ge=0, le=10)
    ly: float | None = Field(None, ge=0, le=10)
    hoa: float | None = Field(None, ge=0, le=10)
    sinh: float | None = Field(None, ge=0, le=10)
    su: float | None = Field(None, ge=0, le=10)
    dia: float | None = Field(None, ge=0, le=10)
    gdcd: float | None = Field(None, ge=0, le=10)


class AlternativeScores(BaseModel):
    """Điểm các phương thức xét tuyển khác — thang điểm khác nhau, KHÔNG quy
    đổi ngầm về thang 30, mỗi phương thức so sánh với điểm chuẩn cùng thang."""
    hoc_ba_gpa: float | None = Field(None, ge=0, le=10, description="Điểm TB học bạ 3 năm hoặc 5 học kỳ")
    dgnl_hcm: float | None = Field(None, ge=0, le=1200, description="ĐGNL ĐHQG-HCM, thang 1200")
    dgnl_hn: float | None = Field(None, ge=0, le=150, description="ĐGNL ĐHQG-HN, thang 150")
    dgtd_bk: float | None = Field(None, ge=0, le=100, description="ĐGTD Bách Khoa HN, thang 100")
    ielts: float | None = Field(None, ge=0, le=9)


class Priority(BaseModel):
    """Điểm ưu tiên khu vực + đối tượng theo quy định Bộ GD-ĐT — cộng trực
    tiếp vào điểm xét, ảnh hưởng thật đến khả năng đỗ. Bị bỏ sót hoàn toàn ở
    bản trước."""
    area: PriorityArea = "KV3"
    object: PriorityObject = "none"


# --------------------------------------------------------------------------
# 2.7 Hoàn cảnh gia đình + 2.3 Vị trí
# --------------------------------------------------------------------------
class FamilyContext(BaseModel):
    home_province: str = Field(..., description="Tỉnh/thành đang cư trú")
    annual_budget_vnd: int = Field(..., ge=0, description="Ngân sách gia đình có thể chi mỗi năm (học phí + sinh hoạt)")
    policy_status: PolicyStatus = "none"
    relocation_willingness: RelocationWillingness = "trong_vung"
    must_stay_near_home: bool = Field(
        False, description="Lý do gia đình bắt buộc phải ở gần nhà (chăm sóc người thân...) — "
                           "khi True, trọng số vị trí tăng mạnh và độc lập với relocation_willingness")


# --------------------------------------------------------------------------
# 2.1 Mục tiêu học tập + 2.5 Cơ hội nghề nghiệp + 2.6 Năng lực
# --------------------------------------------------------------------------
class MajorPreference(BaseModel):
    major_group: str = Field(..., description="Mã nhóm ngành, vd 'cntt', 'kinh_te'")
    weight: float = Field(1.0, ge=0, le=1, description="Mức độ quan tâm, 1 = cao nhất")


class Preferences(BaseModel):
    ranked_majors: list[MajorPreference] = Field(..., min_length=1, max_length=8)
    career_importance: float = Field(0.5, ge=0, le=1,
                                     description="0 = chỉ quan tâm đam mê, 1 = chỉ quan tâm cơ hội việc làm")
    school_prestige_sensitivity: float = Field(0.5, ge=0, le=1)
    dream_school_codes: list[str] = Field(
        default_factory=list,
        description="Mã trường mơ ước — nếu có, hệ thống cố gắng giữ ít nhất 1 suất dù xác suất đỗ thấp")
    excluded_school_codes: list[str] = Field(default_factory=list)
    excluded_major_groups: list[str] = Field(default_factory=list)


class RiskSettings(BaseModel):
    risk_tolerance: float = Field(
        0.05, ge=0.001, le=0.5,
        description="Xác suất chấp nhận được của việc trượt TẤT CẢ 15 nguyện vọng — "
                    "ràng buộc CỨNG, luôn được tôn trọng bất kể ambition_level")
    ambition_level: float = Field(
        0.5, ge=0.0, le=1.0,
        description="Mức độ muốn thử thách: 0 = ưu tiên tuyệt đối an toàn, "
                    "0.5 = cân bằng mạo hiểm/vừa tầm/an toàn (mặc định), "
                    "1 = tối đa mạo hiểm trong giới hạn risk_tolerance cho phép. "
                    "Học sinh/phụ huynh tự chọn — hệ thống không áp tỷ lệ cứng.")
    weights: dict[str, float] | None = Field(
        None, description="Trọng số 7 chiều tuỳ chỉnh; None = dùng mặc định hệ thống")


# --------------------------------------------------------------------------
# Request / response
# --------------------------------------------------------------------------
class RecommendRequest(BaseModel):
    exam_scores: ExamScores
    alt_scores: AlternativeScores = AlternativeScores()
    priority: Priority = Priority()
    family: FamilyContext
    preferences: Preferences
    risk: RiskSettings = RiskSettings()
    max_wishes: int = Field(15, ge=1, le=15)
    # Mã thí sinh (thiết bị) để lịch sử tư vấn chỉ truy xuất được theo đúng người dùng
    user_id: Optional[str] = Field(None, min_length=4, max_length=64)


class ProgramFactorBreakdown(BaseModel):
    model_config = ConfigDict(extra="allow")
    fit: float = 0.0
    cost: float = 0.0
    location: float = 0.0
    career: float = 0.0
    capability: float = 0.0

UtilityBreakdown = ProgramFactorBreakdown


class ProgramRecommendation(BaseModel):
    """Chi tiết một nguyện vọng được gợi ý trong danh mục 15 nguyện vọng.
    Khớp hoàn toàn với cả runtime của optimize.py lẫn frontend schema."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    rank: int
    school_code: str
    school_name: Optional[str] = None
    major_label: str
    combination: Optional[str] = Field(None, validation_alias=AliasChoices("combination", "combinations_seen"))
    combinations_seen: Optional[str] = Field(None, validation_alias=AliasChoices("combinations_seen", "combination"))
    role: Literal["mao_hiem", "vua_tam", "an_toan"] | str
    admit_prob: float = Field(..., validation_alias=AliasChoices("admit_prob", "admit_probability"))
    admit_probability: Optional[float] = Field(None, validation_alias=AliasChoices("admit_probability", "admit_prob"))
    forecast_p10: Optional[float] = Field(None, validation_alias=AliasChoices("forecast_p10", "predicted_cutoff_p10"))
    forecast_p50: Optional[float] = Field(None, validation_alias=AliasChoices("forecast_p50", "predicted_cutoff_p50"))
    forecast_p90: Optional[float] = Field(None, validation_alias=AliasChoices("forecast_p90", "predicted_cutoff_p90"))
    predicted_cutoff_p10: Optional[float] = Field(None, validation_alias=AliasChoices("predicted_cutoff_p10", "forecast_p10"))
    predicted_cutoff_p50: Optional[float] = Field(None, validation_alias=AliasChoices("predicted_cutoff_p50", "forecast_p50"))
    predicted_cutoff_p90: Optional[float] = Field(None, validation_alias=AliasChoices("predicted_cutoff_p90", "forecast_p90"))
    data_quality: Literal["day_du", "thieu_mot_phan", "chi_1_nam", "uoc_luong"] | str = "uoc_luong"
    utility: Optional[float] = None
    util_breakdown: ProgramFactorBreakdown = Field(..., validation_alias=AliasChoices("util_breakdown", "utility_breakdown"))
    utility_breakdown: Optional[ProgramFactorBreakdown] = Field(None, validation_alias=AliasChoices("utility_breakdown", "util_breakdown"))
    util_meta: Optional[dict[str, Any]] = None
    explanation_vi: Optional[str] = None
    warnings_vi: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def sync_fields(self) -> Self:
        if self.admit_probability is None:
            self.admit_probability = self.admit_prob
        if self.utility_breakdown is None:
            self.utility_breakdown = self.util_breakdown
        if self.predicted_cutoff_p10 is None:
            self.predicted_cutoff_p10 = self.forecast_p10
        if self.predicted_cutoff_p50 is None:
            self.predicted_cutoff_p50 = self.forecast_p50
        if self.predicted_cutoff_p90 is None:
            self.predicted_cutoff_p90 = self.forecast_p90
        if self.combination is None and self.combinations_seen is not None:
            self.combination = str(self.combinations_seen)
        if self.combinations_seen is None and self.combination is not None:
            self.combinations_seen = str(self.combination)
        return self


WishlistItem = ProgramRecommendation


class RecommendResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    wishlist: list[ProgramRecommendation]
    p_fail_all: float
    n_selected: int
    data_coverage_note_vi: str



# --------------------------------------------------------------------------
# Application State, Scenarios, Study Tasks, Mock Tests Schemas
# --------------------------------------------------------------------------
class StandardStatusResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    status: str
    id: Optional[str] = None
    message: Optional[str] = None
    updated_at: Optional[str] = None


class AppStateResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    exists: bool
    state: Optional[dict[str, Any]] = None
    updated_at: Optional[str] = None


class ScenarioPayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: Optional[str] = None
    name: str = "Kịch bản mới"
    profile_id: Optional[str] = "default"
    deltaScores: Optional[dict[str, float]] = None
    annualBudgetVnd: Optional[int] = None
    region: Optional[str] = None
    riskTolerance: Optional[str] = None


class StudyTaskPayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: Optional[str] = None
    study_plan_id: Optional[str] = "default_plan"
    day_of_week: Optional[str] = "T2"
    time_block: Optional[str] = "08:00 – 10:00"
    subject: Optional[str] = "toan"
    title: Optional[str] = "Nhiệm vụ học tập"
    weight: Optional[Union[int, float]] = 1
    progressText: Optional[str] = "0/1"
    completed: Optional[bool] = False
    skipped: Optional[bool] = False
    scheduledDate: Optional[str] = None
    note: Optional[str] = None


class StudyTaskResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    title: Optional[str] = None
    subject: Optional[str] = None
    progressText: Optional[str] = None
    weight: Optional[Union[int, float]] = 1
    completed: bool = False
    skipped: bool = False
    scheduledDate: Optional[str] = None
    note: Optional[str] = None
    createdAt: Optional[str] = None


class MockTestRecordRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: Optional[str] = None
    testName: str = "Bài thi thử"
    testDate: Optional[str] = None
    reliabilityTier: Optional[str] = "tier_2_provincial_highschool"
    scores: dict[str, Optional[float]] = Field(default_factory=dict)
    note: Optional[str] = ""


class MockTestResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    testName: str
    testDate: str
    reliabilityTier: str
    scores: dict[str, Optional[float]] = Field(default_factory=dict)
    note: Optional[str] = None
    createdAt: Optional[str] = None
    timestamp: Optional[str] = None


class InteractionUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    program_id: str
    is_favorite: Optional[int] = None
    is_hidden: Optional[int] = None
    is_compared: Optional[int] = None


class InteractionsResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    favorites: list[str]
    hiddens: list[str]
    compares: list[str]


class ApiErrorResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    status: str = "error"
    error_code: str
    detail: Any
    correlation_id: Optional[str] = None


# --------------------------------------------------------------------------
# Career Intelligence Schemas (Benchmark & Transfer from CareerAI)
# --------------------------------------------------------------------------
from backend.app.career_schemas import (  # noqa: E402
    SkillRequirement,
    OccupationMetric,
    AlternativePathway,
    CareerPathway,
    CareerIntelligenceCatalog,
)

from common.decision_result import (  # noqa: E402
    DecisionRecommendationItem,
    DecisionRecommendationsGroup,
    DecisionRiskWarning,
    DecisionRiskReport,
    DecisionMissingDataWarning,
    DecisionConfidenceFactor,
    DecisionConfidenceReport,
    DecisionGroundTruthSource,
    DecisionProposalPage,
    DecisionExplanationV2,
    DecisionNextAction,
    DecisionResultV2,
)

__all__ = [
    "ExamScores",
    "AlternativeScores",
    "Priority",
    "FamilyContext",
    "MajorPreference",
    "Preferences",
    "RiskSettings",
    "RecommendRequest",
    "ProgramFactorBreakdown",
    "UtilityBreakdown",
    "ProgramRecommendation",
    "WishlistItem",
    "RecommendResponse",
    "StandardStatusResponse",
    "AppStateResponse",
    "ScenarioPayload",
    "StudyTaskPayload",
    "StudyTaskResponse",
    "MockTestRecordRequest",
    "MockTestResponse",
    "InteractionUpdatePayload",
    "InteractionsResponse",
    "ApiErrorResponse",
    "SkillRequirement",
    "OccupationMetric",
    "AlternativePathway",
    "CareerPathway",
    "CareerIntelligenceCatalog",
    "DecisionRecommendationItem",
    "DecisionRecommendationsGroup",
    "DecisionRiskWarning",
    "DecisionRiskReport",
    "DecisionMissingDataWarning",
    "DecisionConfidenceFactor",
    "DecisionConfidenceReport",
    "DecisionGroundTruthSource",
    "DecisionProposalPage",
    "DecisionExplanationV2",
    "DecisionNextAction",
    "DecisionResultV2",
]

