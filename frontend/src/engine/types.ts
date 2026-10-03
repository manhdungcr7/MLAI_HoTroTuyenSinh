/** Kiểu dữ liệu dùng chung của ứng dụng. */

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
  /** ĐGNL ĐHQG TP.HCM, thang 1200. */
  dgnl_hcm?: number | null;
  /** ĐGNL ĐHQG Hà Nội, thang 150. */
  dgnl_hn?: number | null;
  /** Đánh giá tư duy Bách khoa, thang 100. */
  dgtd_bk?: number | null;
  ielts?: number | null;
}

export type PriorityArea = "KV1" | "KV2-NT" | "KV2" | "KV3";
export type PriorityObject = "none" | "uu_tien_1" | "uu_tien_2" | "uu_tien_3";

export interface Priority {
  area: PriorityArea;
  object: PriorityObject;
}

export type RelocationWillingness = "chi_tinh_nha" | "trong_vung" | "khong_gioi_han";
export type Role = "mao_hiem" | "vua_tam" | "an_toan";
export type DataQuality = "day_du" | "thieu_mot_phan" | "chi_1_nam" | "uoc_luong";

export const MAJOR_GROUPS: { value: string; label: string }[] = [
  { value: "cntt", label: "Công nghệ thông tin" },
  { value: "ky_thuat", label: "Kỹ thuật, xây dựng" },
  { value: "kinh_te", label: "Kinh tế, quản trị, tài chính" },
  { value: "luat", label: "Luật" },
  { value: "ngon_ngu", label: "Ngôn ngữ" },
  { value: "y_duoc", label: "Y, dược, sức khỏe" },
  { value: "su_pham", label: "Sư phạm" },
  { value: "xa_hoi", label: "Xã hội, báo chí, tâm lý" },
  { value: "du_lich", label: "Du lịch, khách sạn" },
  { value: "nong_lam", label: "Nông, lâm, ngư nghiệp" },
  { value: "kien_truc", label: "Kiến trúc, mỹ thuật" },
  { value: "the_thao", label: "Thể dục thể thao" },
];

export const PROVINCES = [
  "Hà Nội", "TP.HCM", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa",
  "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình",
  "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long", "Khác",
];

export interface StudentProfile {
  name: string;
  grade: string;
  /** Năm dự thi tốt nghiệp THPT; null khi chưa rõ. */
  graduationYear?: number | null;
  /** Học sinh được miễn ngưỡng đầu vào tối thiểu của kỳ thi 2026. */
  minimumScoreException?: boolean | null;
  highSchool: string;
  homeProvince: string;
  /** Điểm thi tốt nghiệp THPT (hoặc điểm thi thử trước kỳ thi). */
  examScores: ExamScores;
  /** Điểm trung bình môn học bạ (thang 10) dùng cho phương thức xét học bạ. */
  hocBaScores?: ExamScores;
  /** Điểm trung bình môn từng lớp (10, 11, 12) cho trường chỉ xét một số lớp. */
  hocBaGrades?: Partial<Record<"10" | "11" | "12", ExamScores>>;
  altScores: AlternativeScores;
  priority: Priority;
  /** Học phí tối đa mỗi năm (VND); 0 = chưa chọn. */
  annualBudgetVnd: number;
  relocationWillingness: RelocationWillingness;
  availableHoursPerWeek: number;
  /** Tổ hợp chính suy từ điểm đã nhập, dùng khi đề án không ghi tổ hợp. */
  activeCombination: string;
  excludedSchoolCodes?: string[];
  excludedMajorGroups?: string[];
  /** Nhóm ngành học sinh quan tâm (MAJOR_GROUPS.value); rỗng = tất cả. */
  interestMajorGroups?: string[];
  /** Chương trình em đánh dấu yêu thích; được ưu tiên khi đề xuất danh sách nguyện vọng. */
  favoriteProgramIds?: string[];
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
  dataPassport: string; // Trích dẫn đề án tuyển sinh gốc
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

/** Một ngành của một trường mà học sinh tính được điểm, kèm xác suất đỗ. */
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
  /** Số năm có điểm chuẩn hợp lệ. */
  yearsOfData?: number;
  /** false = đề án không ghi tổ hợp cạnh điểm chuẩn, hệ thống tính theo tổ hợp chính của học sinh. */
  combinationsVerified?: boolean;
  userScore: number;
  gap: number;
  admitProbability: number;
  tuitionVnd: number | null;
  employmentRate: number | null;
  role: Role;
  dataPassportUrl: string;
  region?: "bac" | "trung" | "nam";
  province?: string;
  admissionMethod?: AdmissionMethod;
  methodInferred?: boolean;
  majorKey?: string;
  sourceTier?: "official_pdf" | "aggregator_verified";
  /** "school": điểm tính theo quy tắc riêng của trường đã kiểm chứng; "default": công thức chung. */
  ruleOrigin?: "school" | "default";
  ruleSource?: string;
  /** true khi điểm Tiếng Anh được thay bằng điểm quy đổi từ IELTS. */
  usedIeltsConversion?: boolean;
  /** Xác suất trường nhận tổ hợp này (ước lượng) khi đề án không ghi tổ hợp; đã nhân vào admitProbability. */
  comboAcceptance?: number;
  /** Hệ số nhân độ bất định theo độ cũ và độ mỏng của dữ liệu (xem sigmaScaleFor). */
  sigmaScale?: number;
}

export interface WishlistItem {
  rank: number;
  program_id: string;
  school_code: string;
  school_name?: string;
  major_label: string;
  major_group?: string;
  combinations_seen?: string | null;
  role: Role;
  admit_prob: number;
  forecast_p10?: number;
  forecast_p50?: number;
  forecast_p90?: number;
  n_years: number;
  data_quality: DataQuality;
  user_score?: number;
  tuition_vnd?: number | null;
  employment_rate?: number | null;
  data_passport_url?: string;
  region?: "bac" | "trung" | "nam";
  province?: string;
  source_tier?: "official_pdf" | "aggregator_verified";
  admission_method?: AdmissionMethod;
  method_inferred?: boolean;
  combinations_verified?: boolean;
  sigma_scale?: number;
}

export interface GapMetric {
  targetProgram: TargetProgram;
  currentCompositeScore: number;
  rawGap: number; // điểm của em - điểm chuẩn dự kiến (>0 là dư, <0 là thiếu)
  admitProbability: number;
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
  deltaScore: number; // +0.5
  unlockedOptionsCount: number; // số ngành mở mới khi tăng điểm
  gapReduction: number; // điểm thu hẹp với mục tiêu
  effortDifficulty: number;
  netRoi: number;
  tier: 1 | 2 | 3;
  explanationVi: string;
}
