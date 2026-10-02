"""Enterprise Domain Models & Database Access Layer for Nguyện Vọng AI.

Covers all 24 domain entities with full typing, validation, and SQLite
repository helpers with Foreign Key enforcement and transaction safety.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator

# Đường dẫn mặc định tới database và schema
DB_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = DB_DIR / "history.db"
SCHEMA_SQL_PATH = DB_DIR / "schema.sql"

# ============================================================================
# DOMAIN ENUMS & LITERALS
# ============================================================================

UserRole = Literal["student", "parent", "counselor", "admin"]
AuthProvider = Literal["local", "google", "guest"]
Gender = Literal["nam", "nu", "khac"]
CurrentGrade = Literal["10", "11", "12", "da_tot_nghiep"]
PriorityArea = Literal["KV1", "KV2-NT", "KV2", "KV3"]
PriorityObject = Literal["none", "uu_tien_1", "uu_tien_2", "uu_tien_3"]
PolicyStatus = Literal[
    "none", "ho_ngheo", "can_ngheo", "dan_toc_thieu_so",
    "khuyet_tat", "mo_coi", "vung_dbkk"
]
RelocationWillingness = Literal["chi_tinh_nha", "trong_vung", "khong_gioi_han"]
ConductLevel = Literal["tot", "kha", "trung_binh", "yeu"]
SubjectCode = Literal[
    "toan", "van", "anh", "ly", "hoa", "sinh",
    "su", "dia", "gdcd", "tin_hoc", "cong_nghe"
]
ScoreType = Literal[
    "hoc_ba_hk1", "hoc_ba_hk2", "hoc_ba_ca_nam",
    "thi_thpt_chinh_thuc", "thi_thu_hien_tai", "muc_tieu"
]
ExamType = Literal[
    "thpt_mock", "dgnl_hcm", "dgnl_hn", "dgtd_bk", "ielts", "toefl", "sat"
]
ReliabilityTier = Literal[
    "tier_1_chuan_hoa", "tier_2_so_gd", "tier_3_truong_lop", "tier_4_tu_luyen"
]
UniversityType = Literal["cong_lap", "ngoai_cong_lap", "quoc_te", "lien_ket"]
Region = Literal["bac", "trung", "nam"]
MajorGroupCode = Literal[
    "cntt", "ky_thuat", "kinh_te", "luat", "ngon_ngu", "y_duoc",
    "su_pham", "xa_hoi", "du_lich", "nong_lam", "kien_truc", "the_thao"
]
DegreeLevel = Literal["cu_nhan", "ky_su", "thac_si", "bac_si", "duoc_si"]
DataQuality = Literal["day_du", "thieu_mot_phan", "chi_1_nam", "uoc_luong"]
TuitionProgramType = Literal["chuan", "chat_luong_cao", "tien_tien", "quoc_te"]
TargetType = Literal["dream", "target_primary", "backup"]
TargetStatus = Literal["active", "achieved", "abandoned", "revising"]
EnvironmentPreference = Literal["nang_dong", "nghien_cuu", "quoc_te", "ky_luat"]
WishRole = Literal["mao_hiem", "vua_tam", "an_toan"]
StrategyType = Literal["monte_carlo_portfolio", "quantile_risk_balanced"]
DayOfWeek = Literal["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
SessionType = Literal["deep_work", "speed_drill", "review_mistakes", "mock_test"]
PlanStatus = Literal["active", "paused", "completed"]
AnalysisType = Literal["subject_roi", "gap_analysis", "swot_profile", "shock_resilience"]
FeedbackType = Literal[
    "recommendation_quality", "ui_ux", "feature_request", "actual_admission_result"
]
SourceType = Literal["regulation", "official_pdf", "official_web", "secondary", "estimated_fallback"]
VerificationStatus = Literal["unverified", "cross_checked", "human_audited", "conflict_flagged"]
GrowthOutlook = Literal["rat_cao", "cao", "on_dinh", "giam"]
AIRiskLevel = Literal["thap", "trung_binh", "cao"]
TransitionFriction = Literal["thap", "trung_binh", "cao"]
SkillType = Literal["hard_skill", "soft_skill", "domain_knowledge", "tool_technology"]
ProficiencyLevel = Literal["basic", "intermediate", "advanced", "expert"]
DemandTrend = Literal["tang_manh", "tang_nhe", "on_dinh", "giam"]
DatasetStatus = Literal["draft", "active", "archived", "deprecated"]

# ============================================================================
# 24 PYDANTIC DOMAIN ENTITY MODELS
# ============================================================================

# 1. User
class UserModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: str
    role: UserRole = "student"
    auth_provider: AuthProvider = "guest"
    password_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    last_login_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 2. StudentProfile
class StudentProfileModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    dob: Optional[str] = None
    gender: Gender = "khac"
    phone: Optional[str] = None
    current_grade: CurrentGrade = "12"
    high_school_name: Optional[str] = None
    high_school_code: Optional[str] = None
    home_province: str
    home_district: Optional[str] = None
    priority_area: PriorityArea = "KV3"
    priority_object: PriorityObject = "none"
    policy_status: PolicyStatus = "none"
    available_hours_per_week: float = Field(28.0, ge=0)
    active_combination: str = "A01"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 3. AcademicRecord
class AcademicRecordModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    academic_year: str  # e.g. "2024-2025"
    grade_level: int = Field(..., ge=10, le=12)
    semester: int = Field(0, ge=0, le=2)  # 0: cả năm, 1: HK1, 2: HK2
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    conduct: ConductLevel = "tot"
    transcript_image_url: Optional[str] = None
    is_verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 4. SubjectScore
class SubjectScoreModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    academic_record_id: Optional[str] = None
    subject_code: SubjectCode
    subject_name_vi: str
    score: float = Field(..., ge=0.0, le=10.0)
    score_type: ScoreType
    semester: Optional[int] = None
    grade_level: Optional[int] = None
    exam_year: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 5. MockExamResult
class MockExamResultModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    exam_name: str
    exam_type: ExamType
    exam_date: str
    total_score: float
    max_scale: float = 30.0
    reliability_tier: ReliabilityTier = "tier_2_so_gd"
    reliability_weight: float = Field(1.0, ge=0.1, le=1.0)
    details_json: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 6. Target
class TargetModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    university_id: str
    major_id: str
    admission_method_id: Optional[str] = None
    subject_combination_id: Optional[str] = None
    priority_order: int = Field(1, ge=1)
    target_type: TargetType = "target_primary"
    target_score: Optional[float] = None
    current_gap: Optional[float] = None
    status: TargetStatus = "active"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 7. Preference
class PreferenceModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    major_group_code: MajorGroupCode
    weight: float = Field(1.0, ge=0.0, le=1.0)
    career_importance: float = Field(0.5, ge=0.0, le=1.0)
    school_prestige_sensitivity: float = Field(0.5, ge=0.0, le=1.0)
    holland_r: float = 0.0
    holland_i: float = 0.0
    holland_a: float = 0.0
    holland_s: float = 0.0
    holland_e: float = 0.0
    holland_c: float = 0.0
    environment_preference: EnvironmentPreference = "nang_dong"
    is_favorite: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 8. Constraint
class ConstraintModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    max_annual_budget_vnd: int = Field(..., ge=0)
    relocation_willingness: RelocationWillingness = "trong_vung"
    must_stay_near_home: bool = False
    preferred_regions: Optional[str] = None  # JSON array
    excluded_university_ids: Optional[str] = None  # JSON array
    excluded_major_groups: Optional[str] = None  # JSON array
    max_daily_commute_km: Optional[float] = None
    special_health_conditions: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 9. University
class UniversityModel(BaseModel):
    id: str
    code: str
    name_vi: str
    name_en: Optional[str] = None
    short_name: Optional[str] = None
    type: UniversityType = "cong_lap"
    ranking_national: Optional[int] = None
    province: str
    region: Region
    address: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    admission_url: Optional[str] = None
    dean_doc_url: Optional[str] = None
    established_year: Optional[int] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 10. Major
class MajorModel(BaseModel):
    id: str
    code: str
    name_vi: str
    name_en: Optional[str] = None
    major_group_code: MajorGroupCode
    major_group_name: str
    degree_level: DegreeLevel = "cu_nhan"
    training_duration_years: float = 4.0
    ai_exposure_index: float = Field(0.5, ge=0.0, le=1.0)
    employment_rate_benchmark: Optional[float] = None
    avg_starting_salary_mvnd: Optional[float] = None
    description: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 11. AdmissionMethod
class AdmissionMethodModel(BaseModel):
    id: str
    code: str
    name_vi: str
    scale: float = 30.0
    description: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 12. SubjectCombination
class SubjectCombinationModel(BaseModel):
    id: str
    code: str
    subject_1: str
    subject_2: str
    subject_3: str
    subject_weights_json: Optional[str] = None
    description: Optional[str] = None


# 10. DataSource (Bảo chứng nguồn gốc Data Provenance)
class DataSourceModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    source_type: SourceType = "official_pdf"
    publisher: Optional[str] = None
    document_title: Optional[str] = None
    document_number: Optional[str] = None
    document_url: Optional[str] = None
    published_at: Optional[str] = None
    retrieved_at: Optional[str] = None
    content_hash: Optional[str] = None
    parser_version: str = "pipeline.clean@2.1.0"
    verification_status: VerificationStatus = "cross_checked"
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 11. HistoricalCutoff
class HistoricalCutoffModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    major_id: str
    method_id: str
    combination_id: str
    year: int = Field(..., ge=2018, le=2030)
    cutoff_score: float
    quota: Optional[int] = None
    secondary_criteria: Optional[str] = None
    source_url: Optional[str] = None
    source_id: Optional[str] = None
    document_url: Optional[str] = None
    page_number: Optional[int] = None
    extracted_at: Optional[str] = None
    parser_version: Optional[str] = None
    content_hash: Optional[str] = None
    data_quality: DataQuality = "day_du"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 12. Tuition
class TuitionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    major_id: Optional[str] = None
    academic_year: str
    tuition_min_mvnd: float
    tuition_max_mvnd: float
    cost_per_credit_vnd: Optional[int] = None
    program_type: TuitionProgramType = "chuan"
    is_estimated: bool = False
    escalation_rate_pct: float = 10.0
    source_id: Optional[str] = None
    document_url: Optional[str] = None
    page_number: Optional[int] = None
    extracted_at: Optional[str] = None
    parser_version: Optional[str] = None
    content_hash: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 13. Location
class LocationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    campus_name: str
    province: str
    district: Optional[str] = None
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    monthly_living_cost_estimate_mvnd: float = 4.5
    is_headquarter: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 14. Occupation (Nghề nghiệp & Thị trường lao động)
class OccupationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    title_vi: str
    title_en: Optional[str] = None
    soc_code: Optional[str] = None
    description: Optional[str] = None
    growth_outlook: GrowthOutlook = "cao"
    ai_exposure_score: float = Field(0.5, ge=0.0, le=1.0)
    ai_risk_level: AIRiskLevel = "trung_binh"
    entry_salary_avg_mvnd: Optional[float] = None
    mid_career_salary_avg_mvnd: Optional[float] = None
    work_environment: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 15. MajorOccupation (Ánh xạ Ngành ra Nghề)
class MajorOccupationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    major_id: str
    occupation_id: str
    relevance_score: float = Field(1.0, ge=0.0, le=1.0)
    employment_rate_pct: Optional[float] = None
    transition_friction: TransitionFriction = "thap"
    career_pathway_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 16. SkillRequirement (Kỹ năng cốt lõi theo Nghề)
class SkillRequirementModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    occupation_id: str
    skill_name: str
    skill_type: SkillType = "hard_skill"
    proficiency_level: ProficiencyLevel = "intermediate"
    importance_weight: float = Field(1.0, ge=0.0, le=1.0)
    market_demand_trend: DemandTrend = "tang_manh"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 16. Recommendation
class RecommendationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    session_id: str
    risk_tolerance: float = Field(0.05, ge=0.001, le=0.5)
    ambition_level: float = Field(0.5, ge=0.0, le=1.0)
    max_wishes: int = Field(15, ge=1, le=15)
    p_fail_all: float
    n_selected: int
    strategy_type: StrategyType = "monte_carlo_portfolio"
    request_payload_json: str
    summary_metrics_json: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 17. RecommendationReason
class RecommendationReasonModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recommendation_id: str
    wish_rank: int = Field(..., ge=1, le=15)
    university_id: str
    major_id: str
    combination_id: Optional[str] = None
    role: WishRole
    admit_probability: float = Field(..., ge=0.0, le=1.0)
    predicted_cutoff_p10: Optional[float] = None
    predicted_cutoff_p50: Optional[float] = None
    predicted_cutoff_p90: Optional[float] = None
    user_simulated_score: Optional[float] = None
    score_gap: Optional[float] = None
    fit_utility: float = 0.0
    cost_utility: float = 0.0
    location_utility: float = 0.0
    career_utility: float = 0.0
    capability_utility: float = 0.0
    total_utility: float
    data_quality: DataQuality = "day_du"
    explanation_vi: str
    warnings_vi_json: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 18. Scenario
class ScenarioModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    name: str
    score_deltas_json: str
    national_shock_delta: float = 0.0
    budget_delta_vnd: int = 0
    prev_p_fail_all: Optional[float] = None
    new_p_fail_all: Optional[float] = None
    unlocked_programs_count: int = 0
    promotions_json: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 19. StudyPlan
class StudyPlanModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    recommendation_id: Optional[str] = None
    target_id: Optional[str] = None
    total_available_hours_per_week: float = Field(40.0, gt=0)
    start_date: str
    exam_date: str
    total_weeks: int = Field(..., ge=1)
    current_week: int = Field(1, ge=1)
    time_deduction_json: Optional[str] = None
    convergence_velocity_note: Optional[str] = None
    status: PlanStatus = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 20. StudyTask
class StudyTaskModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    study_plan_id: str
    day_of_week: DayOfWeek
    time_block: str
    subject_code: str
    session_type: SessionType = "deep_work"
    task_title: str
    topic_name: Optional[str] = None
    allocated_hours: float = Field(..., gt=0)
    target_metric: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[str] = None
    actual_hours_spent: Optional[float] = None
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 21. ProgressRecord
class ProgressRecordModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    study_plan_id: Optional[str] = None
    recorded_date: str
    weekly_hours_studied: float
    planned_hours: float
    completion_rate_pct: float
    mock_exam_result_id: Optional[str] = None
    score_snapshot_json: Optional[str] = None
    delta_vs_target: Optional[float] = None
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 22. AIAnalysis
class AIAnalysisModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    recommendation_id: Optional[str] = None
    analysis_type: AnalysisType
    summary_conclusion: str
    roi_metrics_json: Optional[str] = None
    swot_strengths_json: Optional[str] = None
    swot_weaknesses_json: Optional[str] = None
    swot_opportunities_json: Optional[str] = None
    swot_threats_json: Optional[str] = None
    recommended_actions_json: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 23. AnalysisSnapshot
class AnalysisSnapshotModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    snapshot_tag: str
    profile_state_json: str
    exam_scores_json: str
    study_plan_state_json: Optional[str] = None
    recommendation_snapshot_json: Optional[str] = None
    p_fail_all: Optional[float] = None
    snapshot_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 24. UserFeedback
class UserFeedbackModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    profile_id: Optional[str] = None
    recommendation_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    feedback_type: FeedbackType
    feedback_text: Optional[str] = None
    actual_enrolled_university_id: Optional[str] = None
    actual_enrolled_major_id: Optional[str] = None
    actual_admission_year: Optional[int] = None
    was_predicted_in_wishlist: Optional[bool] = None
    predicted_probability: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 29. UserEvent (Telemetry & Flywheel)
class UserEventModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    pseudo_user_id: str
    event_name: str
    event_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    page_route: str
    entity_id: Optional[str] = None
    dwell_time_ms: Optional[int] = None
    payload_json: Optional[str] = None
    shown_candidates_json: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 30. DatasetVersion (Phiên bản bộ dữ liệu)
class DatasetVersionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version_tag: str
    description: Optional[str] = None
    schema_version: str = "2.1.0"
    total_records: int = 0
    checksum: Optional[str] = None
    status: DatasetStatus = "active"
    released_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# 31. SchemaMigration (Nhật ký migration)
class SchemaMigrationModel(BaseModel):
    id: Optional[int] = None
    version: str
    name: str
    applied_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_time_ms: int = 0
    checksum: Optional[str] = None



# ============================================================================
# DATABASE INITIALIZER & REPOSITORY REPOSITORY HELPERS
# ============================================================================

def get_db_connection(db_path: Optional[Union[str, Path]] = None) -> sqlite3.Connection:
    """Trả về SQLite connection với cấu hình row_factory và Foreign Keys BẬT."""
    target_path = Path(db_path) if db_path else DEFAULT_DB_PATH
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_database(db_path: Optional[Union[str, Path]] = None) -> None:
    """Khởi tạo toàn bộ 24 bảng quan hệ, index và seed dữ liệu từ schema.sql."""
    target_path = Path(db_path) if db_path else DEFAULT_DB_PATH
    if not SCHEMA_SQL_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy file DDL: {SCHEMA_SQL_PATH}")

    sql_script = SCHEMA_SQL_PATH.read_text(encoding="utf-8")
    with get_db_connection(target_path) as conn:
        # Migration kiểm tra các cột phụ trước khi tạo index
        def _add_col_if_missing(table: str, col: str, col_type: str):
            tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            if table in tables:
                cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
                if col not in cols:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")

        _add_col_if_missing("historical_cutoffs", "source_id", "TEXT")
        _add_col_if_missing("tuitions", "source_id", "TEXT")
        _add_col_if_missing("scenarios", "data_json", "TEXT")
        _add_col_if_missing("scenarios", "updated_at", "TEXT")
        _add_col_if_missing("study_tasks", "title", "TEXT")
        _add_col_if_missing("study_tasks", "subject", "TEXT")
        _add_col_if_missing("study_tasks", "progress_text", "TEXT")
        _add_col_if_missing("study_tasks", "weight", "INTEGER DEFAULT 1")
        _add_col_if_missing("study_tasks", "completed", "INTEGER DEFAULT 0")
        _add_col_if_missing("study_tasks", "skipped", "INTEGER DEFAULT 0")
        _add_col_if_missing("study_tasks", "scheduled_date", "TEXT")
        _add_col_if_missing("study_tasks", "note", "TEXT")

        conn.executescript(sql_script)
        # Giữ lại bảng consultation_history cũ để tương thích ngược
        conn.execute("""
            CREATE TABLE IF NOT EXISTS consultation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                request_payload TEXT,
                result_summary TEXT
            )
        """)

        conn.commit()


# ============================================================================
# REPOSITORY CRUD UTILITIES
# ============================================================================

class Repository:
    """Truy xuất dữ liệu chuẩn hóa, hướng đối tượng cho Nguyện Vọng AI."""

    def __init__(self, db_path: Optional[Union[str, Path]] = None):
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH

    # --- USER & PROFILE ---
    def create_user(self, user: UserModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO users (id, email, phone, full_name, role, auth_provider,
                                   password_hash, avatar_url, is_active, last_login_at,
                                   created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user.id, user.email, user.phone, user.full_name, user.role,
                    user.auth_provider, user.password_hash, user.avatar_url,
                    1 if user.is_active else 0, user.last_login_at,
                    user.created_at, user.updated_at
                )
            )
            conn.commit()
            return user.id

    def create_student_profile(self, profile: StudentProfileModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO student_profiles (
                    id, user_id, full_name, dob, gender, phone, current_grade,
                    high_school_name, high_school_code, home_province, home_district,
                    priority_area, priority_object, policy_status,
                    available_hours_per_week, active_combination, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    profile.id, profile.user_id, profile.full_name, profile.dob,
                    profile.gender, profile.phone, profile.current_grade,
                    profile.high_school_name, profile.high_school_code,
                    profile.home_province, profile.home_district,
                    profile.priority_area, profile.priority_object,
                    profile.policy_status, profile.available_hours_per_week,
                    profile.active_combination, profile.created_at, profile.updated_at
                )
            )
            conn.commit()
            return profile.id

    def get_profile_by_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM student_profiles WHERE id = ?", (profile_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    # --- ACADEMIC RECORDS & SUBJECT SCORES ---
    def add_subject_scores(self, scores: List[SubjectScoreModel]) -> None:
        with get_db_connection(self.db_path) as conn:
            for s in scores:
                conn.execute(
                    """
                    INSERT INTO subject_scores (
                        id, profile_id, academic_record_id, subject_code,
                        subject_name_vi, score, score_type, semester,
                        grade_level, exam_year, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        s.id, s.profile_id, s.academic_record_id, s.subject_code,
                        s.subject_name_vi, s.score, s.score_type, s.semester,
                        s.grade_level, s.exam_year, s.created_at
                    )
                )
            conn.commit()

    def get_scores_by_profile(self, profile_id: str) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT * FROM subject_scores WHERE profile_id = ? ORDER BY subject_code",
                (profile_id,)
            )
            return [dict(r) for r in cursor.fetchall()]

    # --- MOCK EXAMS ---
    def record_mock_exam(self, exam: MockExamResultModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO mock_exam_results (
                    id, profile_id, exam_name, exam_type, exam_date,
                    total_score, max_scale, reliability_tier, reliability_weight,
                    details_json, notes, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    exam.id, exam.profile_id, exam.exam_name, exam.exam_type,
                    exam.exam_date, exam.total_score, exam.max_scale,
                    exam.reliability_tier, exam.reliability_weight,
                    exam.details_json, exam.notes, exam.created_at
                )
            )
            conn.commit()
            return exam.id

    # --- TARGETS, PREFERENCES & CONSTRAINTS ---
    def set_target(self, target: TargetModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO targets (
                    id, profile_id, university_id, major_id, admission_method_id,
                    subject_combination_id, priority_order, target_type,
                    target_score, current_gap, status, notes, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    target.id, target.profile_id, target.university_id,
                    target.major_id, target.admission_method_id,
                    target.subject_combination_id, target.priority_order,
                    target.target_type, target.target_score, target.current_gap,
                    target.status, target.notes, target.created_at, target.updated_at
                )
            )
            conn.commit()
            return target.id

    def set_constraint(self, constraint: ConstraintModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO constraints (
                    id, profile_id, max_annual_budget_vnd, relocation_willingness,
                    must_stay_near_home, preferred_regions, excluded_university_ids,
                    excluded_major_groups, max_daily_commute_km,
                    special_health_conditions, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    constraint.id, constraint.profile_id, constraint.max_annual_budget_vnd,
                    constraint.relocation_willingness, 1 if constraint.must_stay_near_home else 0,
                    constraint.preferred_regions, constraint.excluded_university_ids,
                    constraint.excluded_major_groups, constraint.max_daily_commute_km,
                    constraint.special_health_conditions, constraint.created_at, constraint.updated_at
                )
            )
            conn.commit()
            return constraint.id

    # --- RECOMMENDATION & REASON ---
    def save_recommendation(
        self,
        recommendation: RecommendationModel,
        reasons: List[RecommendationReasonModel]
    ) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO recommendations (
                    id, profile_id, session_id, risk_tolerance, ambition_level,
                    max_wishes, p_fail_all, n_selected, strategy_type,
                    request_payload_json, summary_metrics_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    recommendation.id, recommendation.profile_id, recommendation.session_id,
                    recommendation.risk_tolerance, recommendation.ambition_level,
                    recommendation.max_wishes, recommendation.p_fail_all,
                    recommendation.n_selected, recommendation.strategy_type,
                    recommendation.request_payload_json, recommendation.summary_metrics_json,
                    recommendation.created_at
                )
            )
            for r in reasons:
                conn.execute(
                    """
                    INSERT INTO recommendation_reasons (
                        id, recommendation_id, wish_rank, university_id, major_id,
                        combination_id, role, admit_probability, predicted_cutoff_p10,
                        predicted_cutoff_p50, predicted_cutoff_p90, user_simulated_score,
                        score_gap, fit_utility, cost_utility, location_utility,
                        career_utility, capability_utility, total_utility,
                        data_quality, explanation_vi, warnings_vi_json, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        r.id, r.recommendation_id, r.wish_rank, r.university_id,
                        r.major_id, r.combination_id, r.role, r.admit_probability,
                        r.predicted_cutoff_p10, r.predicted_cutoff_p50,
                        r.predicted_cutoff_p90, r.user_simulated_score, r.score_gap,
                        r.fit_utility, r.cost_utility, r.location_utility,
                        r.career_utility, r.capability_utility, r.total_utility,
                        r.data_quality, r.explanation_vi, r.warnings_vi_json,
                        r.created_at
                    )
                )
            conn.commit()
            return recommendation.id

    def get_recommendation_with_reasons(self, recommendation_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            rec_cur = conn.execute("SELECT * FROM recommendations WHERE id = ?", (recommendation_id,))
            rec = rec_cur.fetchone()
            if not rec:
                return None
            reasons_cur = conn.execute(
                "SELECT * FROM recommendation_reasons WHERE recommendation_id = ? ORDER BY wish_rank",
                (recommendation_id,)
            )
            return {
                **dict(rec),
                "reasons": [dict(r) for r in reasons_cur.fetchall()]
            }

    # --- STUDY PLAN & TASKS ---
    def save_study_plan(self, plan: StudyPlanModel, tasks: List[StudyTaskModel]) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO study_plans (
                    id, profile_id, recommendation_id, target_id,
                    total_available_hours_per_week, start_date, exam_date,
                    total_weeks, current_week, time_deduction_json,
                    convergence_velocity_note, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    plan.id, plan.profile_id, plan.recommendation_id, plan.target_id,
                    plan.total_available_hours_per_week, plan.start_date, plan.exam_date,
                    plan.total_weeks, plan.current_week, plan.time_deduction_json,
                    plan.convergence_velocity_note, plan.status, plan.created_at, plan.updated_at
                )
            )
            for t in tasks:
                conn.execute(
                    """
                    INSERT INTO study_tasks (
                        id, study_plan_id, day_of_week, time_block, subject_code,
                        session_type, task_title, topic_name, allocated_hours,
                        target_metric, is_completed, completed_at, actual_hours_spent,
                        difficulty_rating, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        t.id, t.study_plan_id, t.day_of_week, t.time_block,
                        t.subject_code, t.session_type, t.task_title, t.topic_name,
                        t.allocated_hours, t.target_metric, 1 if t.is_completed else 0,
                        t.completed_at, t.actual_hours_spent, t.difficulty_rating,
                        t.created_at
                    )
                )
            conn.commit()
            return plan.id

    # --- USER FEEDBACK ---
    def record_feedback(self, feedback: UserFeedbackModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO user_feedbacks (
                    id, user_id, profile_id, recommendation_id, rating,
                    feedback_type, feedback_text, actual_enrolled_university_id,
                    actual_enrolled_major_id, actual_admission_year,
                    was_predicted_in_wishlist, predicted_probability, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    feedback.id, feedback.user_id, feedback.profile_id,
                    feedback.recommendation_id, feedback.rating,
                    feedback.feedback_type, feedback.feedback_text,
                    feedback.actual_enrolled_university_id,
                    feedback.actual_enrolled_major_id, feedback.actual_admission_year,
                    1 if feedback.was_predicted_in_wishlist else (0 if feedback.was_predicted_in_wishlist is False else None),
                    feedback.predicted_probability, feedback.created_at
                )
            )
            conn.commit()
            return feedback.id

    # --- USER TELEMETRY EVENTS ---
    def record_user_event(self, event: UserEventModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO user_events (
                    id, session_id, pseudo_user_id, event_name, event_timestamp,
                    page_route, entity_id, dwell_time_ms, payload_json,
                    shown_candidates_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.id, event.session_id, event.pseudo_user_id, event.event_name,
                    event.event_timestamp, event.page_route, event.entity_id,
                    event.dwell_time_ms, event.payload_json, event.shown_candidates_json,
                    event.created_at
                )
            )
            conn.commit()
            return event.id

    def list_user_events(self, pseudo_user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT * FROM user_events
                WHERE pseudo_user_id = ?
                ORDER BY event_timestamp DESC
                LIMIT ?
                """,
                (pseudo_user_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]

    # --- DATA PROVENANCE (DATA SOURCES & CITATIONS) ---
    def create_data_source(self, source: DataSourceModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO data_sources (
                    id, name, source_type, publisher, document_title, document_number,
                    document_url, published_at, retrieved_at, content_hash, parser_version,
                    verification_status, confidence, notes, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    source.id, source.name, source.source_type, source.publisher,
                    source.document_title, source.document_number, source.document_url,
                    source.published_at, source.retrieved_at, source.content_hash,
                    source.parser_version, source.verification_status, source.confidence,
                    source.notes, source.created_at, source.updated_at
                )
            )
            conn.commit()
            return source.id

    def get_data_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM data_sources WHERE id = ?", (source_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def list_data_sources(self) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM data_sources ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    def record_historical_cutoff(self, cutoff: HistoricalCutoffModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO historical_cutoffs (
                    id, university_id, major_id, method_id, combination_id, year,
                    cutoff_score, quota, secondary_criteria, source_url, source_id,
                    document_url, page_number, extracted_at, parser_version, content_hash,
                    data_quality, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cutoff.id, cutoff.university_id, cutoff.major_id, cutoff.method_id,
                    cutoff.combination_id, cutoff.year, cutoff.cutoff_score, cutoff.quota,
                    cutoff.secondary_criteria, cutoff.source_url, cutoff.source_id,
                    cutoff.document_url, cutoff.page_number, cutoff.extracted_at,
                    cutoff.parser_version, cutoff.content_hash, cutoff.data_quality,
                    cutoff.created_at
                )
            )
            conn.commit()
            return cutoff.id

    def get_historical_cutoffs(self, university_id: str, major_id: str) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT c.*, s.name as source_name, s.publisher as source_publisher
                FROM historical_cutoffs c
                LEFT JOIN data_sources s ON c.source_id = s.id
                WHERE c.university_id = ? AND c.major_id = ?
                ORDER BY c.year DESC
                """,
                (university_id, major_id)
            )
            return [dict(row) for row in cursor.fetchall()]

    def record_tuition(self, tuition: TuitionModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO tuitions (
                    id, university_id, major_id, academic_year, tuition_min_mvnd,
                    tuition_max_mvnd, cost_per_credit_vnd, program_type, is_estimated,
                    escalation_rate_pct, source_id, document_url, page_number,
                    extracted_at, parser_version, content_hash, notes, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tuition.id, tuition.university_id, tuition.major_id, tuition.academic_year,
                    tuition.tuition_min_mvnd, tuition.tuition_max_mvnd, tuition.cost_per_credit_vnd,
                    tuition.program_type, 1 if tuition.is_estimated else 0, tuition.escalation_rate_pct,
                    tuition.source_id, tuition.document_url, tuition.page_number,
                    tuition.extracted_at, tuition.parser_version, tuition.content_hash,
                    tuition.notes, tuition.created_at
                )
            )
            conn.commit()
            return tuition.id

    def get_tuitions(self, university_id: str, major_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            if major_id:
                cursor = conn.execute(
                    """
                    SELECT t.*, s.name as source_name, s.document_url as source_doc_url
                    FROM tuitions t
                    LEFT JOIN data_sources s ON t.source_id = s.id
                    WHERE t.university_id = ? AND (t.major_id = ? OR t.major_id IS NULL)
                    ORDER BY t.academic_year DESC
                    """,
                    (university_id, major_id)
                )
            else:
                cursor = conn.execute(
                    """
                    SELECT t.*, s.name as source_name, s.document_url as source_doc_url
                    FROM tuitions t
                    LEFT JOIN data_sources s ON t.source_id = s.id
                    WHERE t.university_id = ?
                    ORDER BY t.academic_year DESC
                    """,
                    (university_id,)
                )
            return [dict(row) for row in cursor.fetchall()]

    # --- CAREER INTELLIGENCE (OCCUPATIONS & SKILLS) ---
    def create_occupation(self, occ: OccupationModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO occupations (
                    id, code, title_vi, title_en, soc_code, description,
                    growth_outlook, ai_exposure_score, ai_risk_level,
                    entry_salary_avg_mvnd, mid_career_salary_avg_mvnd,
                    work_environment, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    occ.id, occ.code, occ.title_vi, occ.title_en, occ.soc_code, occ.description,
                    occ.growth_outlook, occ.ai_exposure_score, occ.ai_risk_level,
                    occ.entry_salary_avg_mvnd, occ.mid_career_salary_avg_mvnd,
                    occ.work_environment, occ.created_at, occ.updated_at
                )
            )
            conn.commit()
            return occ.id

    def get_occupation_by_id(self, occupation_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM occupations WHERE id = ?", (occupation_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_occupation_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM occupations WHERE code = ?", (code,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def list_occupations(self, limit: int = 50) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM occupations ORDER BY ai_exposure_score DESC LIMIT ?", (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def link_major_occupation(self, link: MajorOccupationModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO major_occupations (
                    id, major_id, occupation_id, relevance_score, employment_rate_pct,
                    transition_friction, career_pathway_notes, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    link.id, link.major_id, link.occupation_id, link.relevance_score,
                    link.employment_rate_pct, link.transition_friction,
                    link.career_pathway_notes, link.created_at
                )
            )
            conn.commit()
            return link.id

    def get_occupations_by_major(self, major_id: str) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT o.*, mo.relevance_score, mo.employment_rate_pct,
                       mo.transition_friction, mo.career_pathway_notes
                FROM occupations o
                JOIN major_occupations mo ON o.id = mo.occupation_id
                WHERE mo.major_id = ?
                ORDER BY mo.relevance_score DESC
                """,
                (major_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def add_skill_requirement(self, skill: SkillRequirementModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO skill_requirements (
                    id, occupation_id, skill_name, skill_type, proficiency_level,
                    importance_weight, market_demand_trend, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    skill.id, skill.occupation_id, skill.skill_name, skill.skill_type,
                    skill.proficiency_level, skill.importance_weight,
                    skill.market_demand_trend, skill.created_at
                )
            )
            conn.commit()
            return skill.id

    def get_skills_by_occupation(self, occupation_id: str) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT * FROM skill_requirements
                WHERE occupation_id = ?
                ORDER BY importance_weight DESC
                """,
                (occupation_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    # --- DATASET VERSIONS ---
    def record_dataset_version(self, version: DatasetVersionModel) -> str:
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO dataset_versions (
                    id, version_tag, description, schema_version, total_records,
                    checksum, status, released_at, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    version.id, version.version_tag, version.description,
                    version.schema_version, version.total_records, version.checksum,
                    version.status, version.released_at, version.created_at
                )
            )
            conn.commit()
            return version.id

    def get_active_dataset_version(self) -> Optional[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT * FROM dataset_versions
                WHERE status = 'active'
                ORDER BY created_at DESC LIMIT 1
                """
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def list_dataset_versions(self) -> List[Dict[str, Any]]:
        with get_db_connection(self.db_path) as conn:
            cursor = conn.execute("SELECT * FROM dataset_versions ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    # --- SYSTEM INTEGRITY ---
    def check_foreign_keys(self) -> List[Dict[str, Any]]:
        """Kiểm tra toàn vẹn khóa ngoại toàn hệ thống."""
        with get_db_connection(self.db_path) as conn:
            from backend.app.migrations import check_foreign_key_integrity
            return check_foreign_key_integrity(conn)
