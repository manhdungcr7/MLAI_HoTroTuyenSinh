import { Role } from "@/engine/types";

export type RegionFilter = "all" | "hanoi" | "tphcm" | "mientrung";
export type TuitionFilter = "all" | "under_20" | "under_40" | "under_60";
export type MajorGroupFilter = "all" | "cntt" | "kinh_te" | "ky_thuat" | "y_duoc" | "luat" | "ngon_ngu";
export type CombinationFilter = "all" | "A00" | "A01" | "D01" | "D07" | "B00" | "C00";
export type MatchFilter = "all" | "kha_phu_hop" | "an_toan" | "can_co_gang";

export interface OptionsFilterState {
  searchQuery: string;
  region: RegionFilter;
  tuition: TuitionFilter;
  majorGroup: MajorGroupFilter;
  combination: CombinationFilter;
  matchLevel: MatchFilter;
  sortBy: "utility" | "admit_prob" | "cutoff_desc" | "cutoff_asc" | "tuition_asc" | "employment_desc";
}

export const INITIAL_OPTIONS_FILTER: OptionsFilterState = {
  searchQuery: "",
  region: "all",
  tuition: "all",
  majorGroup: "all",
  combination: "all",
  matchLevel: "all",
  sortBy: "utility",
};

export interface ProgramDisplayItem {
  id: string;
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorGroup: string;
  combination: string;
  region: "hanoi" | "tphcm" | "mientrung";
  regionLabel: string;
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
}
