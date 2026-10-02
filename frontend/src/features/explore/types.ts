import { AdmissionMethod, Role, StudentProfile } from "@/engine/types";
import { VIETNAM_PROVINCES } from "@/engine/geo/distance";

/** Khu vực trường: theo vùng, hoặc cùng tỉnh với nhà em. */
export type RegionFilter = "all" | "bac" | "trung" | "nam" | "home";
/** Học phí: theo ngân sách trong hồ sơ hoặc mức trần cố định (triệu/năm). */
export type TuitionFilter = "all" | "budget" | "under_20" | "under_40" | "under_60";
/** Nhóm ngành: "interest" = các nhóm ngành em đã chọn trong hồ sơ. */
export type MajorGroupFilter = string;
export type MethodFilter = "all" | "THPT" | "HOC_BA";
export type CombinationFilter = string;
export type MatchFilter = "all" | "kha_phu_hop" | "an_toan" | "can_co_gang";
export type SortKey = "admit_prob" | "cutoff_desc" | "cutoff_asc" | "tuition_asc" | "employment_desc";

export interface OptionsFilterState {
  searchQuery: string;
  region: RegionFilter;
  tuition: TuitionFilter;
  majorGroup: MajorGroupFilter;
  method: MethodFilter;
  combination: CombinationFilter;
  matchLevel: MatchFilter;
  sortBy: SortKey;
}

export const INITIAL_OPTIONS_FILTER: OptionsFilterState = {
  searchQuery: "",
  region: "all",
  tuition: "all",
  majorGroup: "all",
  method: "all",
  combination: "all",
  matchLevel: "all",
  sortBy: "admit_prob",
};

export function regionOfProvince(province: string | null | undefined): "bac" | "trung" | "nam" | null {
  if (!province) return null;
  return VIETNAM_PROVINCES[province]?.region ?? null;
}

/**
 * Bộ lọc khởi tạo từ ràng buộc em đã khai trong hồ sơ, để danh sách ngay từ đầu là
 * "các ngành thỏa điều kiện của em, xếp theo khả năng đỗ".
 */
export function filtersFromProfile(profile: StudentProfile): OptionsFilterState {
  let region: RegionFilter = "all";
  if (profile.relocationWillingness === "chi_tinh_nha" && profile.homeProvince) region = "home";
  else if (profile.relocationWillingness === "trong_vung") region = regionOfProvince(profile.homeProvince) ?? "all";
  return {
    ...INITIAL_OPTIONS_FILTER,
    region,
    tuition: profile.annualBudgetVnd > 0 ? "budget" : "all",
    majorGroup: (profile.interestMajorGroups?.length ?? 0) > 0 ? "interest" : "all",
  };
}

export interface ProgramDisplayItem {
  id: string;
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorGroup: string;
  combination: string;
  region: "bac" | "trung" | "nam" | null;
  regionLabel: string;
  province: string;
  tuitionDisplay: string;
  tuitionVnd: number | null;
  cutoffDisplay: string;
  cutoffP50: number;
  yearsOfData?: number;
  matchLevel: "kha_phu_hop" | "an_toan" | "can_co_gang";
  matchLabel: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  imageSrc: string;
  dataPassportUrl: string;
  employmentRate: number | null;
  aiExposure: number;
  whyThisOptionVi: string;
  userScore: number;
  admitProbability: number;
  role: Role;
  sourceTier?: "official_pdf" | "aggregator_verified";
  admissionMethod: AdmissionMethod;
  methodInferred: boolean;
  combinationsVerified: boolean;
}
