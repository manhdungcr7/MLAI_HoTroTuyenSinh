// Khớp trực tiếp với backend/app/schemas.py — đổi bên nào phải đổi bên kia.

export interface ExamScores {
  toan?: number | null;
  van?: number | null;
  anh?: number | null;
  ly?: number | null;
  hoa?: number | null;
  sinh?: number | null;
  su?: number | null;
  dia?: number | null;
  /** GDKT&PL (thay GDCD từ chương trình GDPT 2018); giữ khóa cũ để tương thích dữ liệu đã lưu. */
  gdcd?: number | null;
  tin?: number | null;
  cncn?: number | null;
  cnnn?: number | null;
}

/** Phương thức xét tuyển, khớp `pipeline/clean/methods.py`. */
export type AdmissionMethod =
  | "THPT" | "HOC_BA" | "DGNL_HN" | "DGNL_HCM" | "DGNL_SP" | "DGTD" | "DGNL_KHAC"
  | "NANG_KHIEU" | "KET_HOP" | "UU_TIEN" | "RIENG" | "KHAC";

export interface AlternativeScores {
  hoc_ba_gpa?: number | null;
  dgnl_hcm?: number | null;
  dgnl_hn?: number | null;
  dgtd_bk?: number | null;
  ielts?: number | null;
  toeic?: number | null;
  sat?: number | null;
  act?: number | null;
  hsg_tinh?: string | null;
  hsg_quoc_gia?: string | null;
  khoa_hoc_ky_thuat?: string | null;
}

export type PriorityArea = "KV1" | "KV2-NT" | "KV2" | "KV3";
export type PriorityObject = "none" | "uu_tien_1" | "uu_tien_2" | "uu_tien_3";

export interface Priority {
  area: PriorityArea;
  object: PriorityObject;
}

export type RelocationWillingness = "chi_tinh_nha" | "trong_vung" | "khong_gioi_han";
export type PolicyStatus =
  | "none" | "ho_ngheo" | "can_ngheo" | "dan_toc_thieu_so"
  | "khuyet_tat" | "mo_coi" | "vung_dbkk";

export interface FamilyContext {
  home_province: string;
  annual_budget_vnd: number;
  policy_status: PolicyStatus;
  relocation_willingness: RelocationWillingness;
  must_stay_near_home: boolean;
}

export interface MajorPreference {
  major_group: string;
  weight: number;
}

export interface Preferences {
  ranked_majors: MajorPreference[];
  career_importance: number;
  school_prestige_sensitivity: number;
  dream_school_codes: string[];
  excluded_school_codes: string[];
  excluded_major_groups: string[];
}

export interface RiskSettings {
  risk_tolerance: number;
  ambition_level: number;
  weights: Record<string, number> | null;
}

export interface RecommendRequest {
  exam_scores: ExamScores;
  alt_scores: AlternativeScores;
  priority: Priority;
  family: FamilyContext;
  preferences: Preferences;
  risk: RiskSettings;
  max_wishes: number;
}

export interface UtilityBreakdown {
  fit: number;
  cost: number | null; // null = chưa có học phí xác thực
  location: number;
  career: number | null; // null = chưa có dữ liệu việc làm
  capability: number;
}

export interface UtilityMeta {
  total_cost_per_year_vnd?: number;
  tuition_estimated?: boolean;
  budget_ratio?: number;
  career_estimated?: boolean;
  capability_warning_vi?: string | null;
}

export type Role = "mao_hiem" | "vua_tam" | "an_toan";
export type DataQuality = "day_du" | "thieu_mot_phan" | "chi_1_nam" | "uoc_luong";

export interface WishlistItem {
  rank: number;
  school_code: string;
  major_label: string;
  major_group?: string;
  combinations_seen?: string | null;
  role: Role;
  admit_prob: number;
  forecast_p10?: number;
  forecast_p50?: number;
  forecast_p90?: number;
  latest_score?: number;
  latest_year?: number;
  n_years: number;
  data_quality: DataQuality;
  utility: number;
  util_breakdown: UtilityBreakdown;
  util_meta: UtilityMeta;
  // Các trường bổ trợ dữ liệu thực chứng (Data Passport & Portfolio UI)
  user_score?: number;
  school_name?: string;
  tuition_vnd?: number | null;
  employment_rate?: number | null;
  data_passport_url?: string;
  why_option_vi?: string;
  program_id?: string;
  region?: "bac" | "trung" | "nam";
  province?: string;
  source_tier?: "official_pdf" | "aggregator_verified";
}

export interface RecommendResponse {
  wishlist: WishlistItem[];
  p_fail_all: number;
  n_selected: number;
  data_coverage_note_vi: string;
}

export interface MetaResponse {
  n_programs: number;
  n_schools: number;
  data_quality_distribution: Record<string, number>;
  tuition_coverage: number;
  employment_coverage: number;
  national_shock: {
    by_year: Record<string, { median_delta: number; std_delta: number | null; n_programs: number }>;
    overall_std: number;
    overall_median: number;
    warning?: string | null;
  };
  data_source: string;
  known_gaps: string[];
}

export const MAJOR_GROUPS: { value: string; label: string }[] = [
  { value: "cntt", label: "Công nghệ thông tin / Máy tính" },
  { value: "ky_thuat", label: "Kỹ thuật / Cơ khí / Điện / Xây dựng" },
  { value: "kinh_te", label: "Kinh tế / Quản trị / Tài chính" },
  { value: "luat", label: "Luật" },
  { value: "ngon_ngu", label: "Ngôn ngữ" },
  { value: "y_duoc", label: "Y Dược / Sức khoẻ" },
  { value: "su_pham", label: "Sư phạm" },
  { value: "xa_hoi", label: "Xã hội / Báo chí / Tâm lý" },
  { value: "du_lich", label: "Du lịch / Khách sạn / Dịch vụ" },
  { value: "nong_lam", label: "Nông Lâm Ngư nghiệp" },
  { value: "kien_truc", label: "Kiến trúc / Mỹ thuật" },
  { value: "the_thao", label: "Thể dục Thể thao" },
];

export const PROVINCES = [
  "Hà Nội", "TP.HCM", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa",
  "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình",
  "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long", "Khác",
];

// ============================================================================
// EXTENDED DECISION INTELLIGENCE MODELS (9-STEP JOURNEY & CLOSED-LOOP)
// ============================================================================

export interface StudentProfile {
  name: string;
  grade: string;
  /** Năm dự thi tốt nghiệp THPT; null khi chưa rõ. */
  graduationYear?: number | null;
  /** User-confirmed exception to the 2026 minimum-score source rule. */
  minimumScoreException?: boolean | null;
  highSchool: string;
  homeProvince: string;
  /** Điểm thi tốt nghiệp THPT (hoặc điểm dự kiến/thi thử trước kỳ thi). */
  examScores: ExamScores;
  /** Điểm trung bình môn học bạ (thang 10) dùng cho phương thức xét học bạ. */
  hocBaScores?: ExamScores;
  altScores: AlternativeScores;
  priority: Priority;
  annualBudgetVnd: number;
  relocationWillingness: RelocationWillingness;
  availableHoursPerWeek: number;
  activeCombination: string;     // VD: "A01", "A00", "D01"
  targetProgram?: TargetProgram | null;
  id?: string;
  familyConstraints?: {
    annualBudgetVnd?: number;
    mustStayNearHome?: boolean;
    relocationWillingness?: string;
    availableWeeklyHours?: number;
  };
  locationConstraint?: string;
  excludedSchoolCodes?: string[];
  excludedMajorGroups?: string[];
  /** Nhóm ngành học sinh quan tâm (MAJOR_GROUPS.value); rỗng = chưa biết */
  interestMajorGroups?: string[];
  rankedMajors?: string[];
  careerImportance?: number;
  prestigeSensitivity?: number;
  dreamSchools?: string[];
}

export interface TargetProgram {
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorGroup: string;
  cutoff2021?: number | null;
  cutoff2022?: number | null;
  cutoff2023?: number | null;
  cutoff2024?: number | null;
  forecastP10: number;
  forecastP50: number;
  forecastP90: number;
  tuitionVnd: number | null; // null = chưa có dữ liệu học phí đã xác thực
  employmentRate: number | null; // null = chưa có dữ liệu việc làm
  aiExposure: number; // 0.0 - 1.0 (mức độ ảnh hưởng của AI 2030)
  leverageScore: number; // 1.0 - 10.0
  dataPassport: string; // Trích dẫn Đề án tuyển sinh gốc
  combinations: string[];
  region?: "bac" | "trung" | "nam";
  province?: string;
  /** Phương thức của ngưỡng điểm này; thiếu = điểm thi THPT. */
  admissionMethod?: AdmissionMethod;
  /** true khi đề án không ghi phương thức và hệ thống suy luận là điểm thi THPT. */
  methodInferred?: boolean;
  /** Khóa (trường, ngành) chung cho mọi phương thức của cùng một ngành. */
  majorKey?: string;
  sourceTier?: "official_pdf" | "aggregator_verified";
  sourceUrl?: string | null;
}

export interface GapMetric {
  targetProgram: TargetProgram;
  currentCompositeScore: number;
  rawGap: number; // current - forecastP50 (>0 là an toàn, <0 là thiếu điểm)
  gapStatus: "thach_thuc" | "vua_tam" | "an_toan";
  statusLabelVi: string;
  statusColor: string;
  historicalTrend: "tang_nhiet" | "on_dinh" | "ha_nhiet";
  yearlyDeltas: { year: string; score: number }[];
  p10: number;
  p50: number;
  p90: number;
}

export interface SubjectRoiMetric {
  subject: keyof ExamScores;
  subjectVi: string;
  currentScore: number;
  simulatedScore: number;
  deltaScore: number; // +0.5 hoặc +1.0
  unlockedOptionsCount: number; // số ngành mở mới khi tăng điểm
  gapReduction: number; // điểm thu hẹp với mục tiêu
  effortDifficulty: number; // hệ số trở lực nỗ lực
  netRoi: number; // điểm ROI tổng hợp
  tier: 1 | 2 | 3; // Tier 1: Đòn bẩy vàng (60% time), Tier 2: Bổ trợ (30%), Tier 3: Duy trì (10%)
  explanationVi: string;
}

export interface CandidateOption {
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorGroup: string;
  combination: string;
  cutoffP50: number;
  cutoffP10?: number;
  cutoffP90?: number;
  /** Số năm có điểm chuẩn hợp lệ (undefined = không rõ) */
  yearsOfData?: number;
  /** false = danh sách tổ hợp là mặc định của nguồn dữ liệu, chưa đối chiếu đề án */
  combinationsVerified?: boolean;
  userScore: number;
  gap: number;
  admitProbability: number;
  tuitionVnd: number | null;
  employmentRate: number | null;
  aiExposure: number;
  role: Role;
  whyThisOptionVi: string;
  dataPassportUrl: string;
  region?: "bac" | "trung" | "nam";
  province?: string;
  admissionMethod?: AdmissionMethod;
  methodInferred?: boolean;
  majorKey?: string;
  sourceTier?: "official_pdf" | "aggregator_verified";
}

export interface StudyPlanSlot {
  id?: string;
  dayOfWeek: "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "CN";
  timeBlock: "Sáng (08:00 - 10:00)" | "Chiều (14:00 - 16:00)" | "Tối (19:30 - 21:30)" | string;
  subject: keyof ExamScores | "buffer_review" | string;
  subjectVi: string;
  hours: number;
  sessionType: "Deep Work" | "Speed Drill" | "Review & Lỗi sai" | "Thi thử Mock Test";
  weeklyGoalVi: string;
  completed?: boolean;
}

export interface SubjectAllocation {
  subject: keyof ExamScores | "buffer_review" | string;
  subjectVi: string;
  hoursPerWeek: number;
  percentage: number;
  tier: 1 | 2 | 3;
  priorityReasonVi: string;
  roiScore?: number;
  currentScore?: number;
  targetScore?: number;
  gap?: number;
  feasibility?: number;
  statusBadge?: "bottleneck" | "safe" | "maintain";
}

export interface TimeDeduction {
  totalWeeklyHours: number; // 168
  sleepHours: number;       // default 52.5 (7.5h/ngày)
  schoolHours: number;      // default 30.0
  extraClassesHours: number;// default 12.0
  livingHours: number;      // default 21.0
  availableHours: number;   // 168 - (sleep + school + extra + living)
}

export interface WeeklyMicroGoal {
  id: string;
  subject: keyof ExamScores | "buffer_review" | string;
  subjectVi: string;
  topic: string;
  targetMetric: string;
  estimatedGain: string;
  allocatedBlocks: number;
  completed?: boolean;
}

export interface ClosedLoopScoreChange {
  subject: keyof ExamScores;
  subjectVi: string;
  previous: number;
  newScore: number;
  smoothed: number;
  delta: number;
}

export interface ClosedLoopBandPromotion {
  rank: number;
  schoolCode: string;
  majorName: string;
  previousProb: number;
  newProb: number;
  previousRole: string;
  newRole: string;
  badge: string;
}

export interface ClosedLoopAllocationShift {
  subjectVi: string;
  hoursDelta: number;
  reason: string;
}

export interface ClosedLoopDiff {
  testName: string;
  testDate: string;
  reliabilityTier: string;
  reliabilityWeight: number;
  scoreChanges: ClosedLoopScoreChange[];
  portfolioImpact: {
    previousPFailAll: number;
    newPFailAll: number;
    failRiskDelta: number;
    promotions: ClosedLoopBandPromotion[];
  };
  allocationShifts: ClosedLoopAllocationShift[];
  decisionReasoning: string;
}

export interface StudyPlan {
  totalAvailableHours: number;
  allocations: SubjectAllocation[];
  schedule: StudyPlanSlot[];
  lastUpdated: string;
  convergenceVelocityNote: string;
  timeDeduction?: TimeDeduction;
  microGoals?: WeeklyMicroGoal[];
}

export interface DecisionEngineState {
  profile: StudentProfile;
  target: TargetProgram;
  gapAnalysis: GapMetric;
  subjectRoiList: SubjectRoiMetric[];
  candidates: CandidateOption[];
  wishlist: WishlistItem[];
  pFailAll: number;
  studyPlan: StudyPlan;
  whatIfDelta: ExamScores;
  isRecalculating: boolean;
  historyLogs: { timestamp: string; note: string; newScore: number }[];
  isSampleMode?: boolean;
  hasUserData?: boolean;
}
