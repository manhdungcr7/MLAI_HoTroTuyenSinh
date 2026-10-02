import {
  ExamScores,
  AlternativeScores,
  Priority,
  RelocationWillingness,
  TargetProgram,
  StudentProfile,
} from "@/engine/types";

/**
 * UserDecisionProfile: Trạng thái hồ sơ người dùng thực tế
 * Mặc định ở Blank State: tất cả điểm rỗng null, ngân sách null, target null.
 */
export interface UserDecisionProfile {
  name: string;
  grade: string;
  highSchool: string;
  homeProvince: string;
  examScores: ExamScores;
  altScores: AlternativeScores;
  priority: Priority;
  annualBudgetVnd: number;
  relocationWillingness: RelocationWillingness;
  availableHoursPerWeek: number;
  activeCombination: string;
  targetProgram: TargetProgram | null;
}

/**
 * SamplePersonaState: Cấu trúc của Persona mẫu kích hoạt khi bấm nút trải nghiệm
 */
export interface SamplePersonaState {
  id: string;
  label: string;
  subLabel: string;
  combination: "A01" | "D01" | "A00" | string;
  domainName: string;
  tag: string;
  profile: UserDecisionProfile;
  target: TargetProgram;
  highlights: string[];
  description: string;
}

/**
 * Blank State mặc định chuẩn của hệ thống khi mở app
 * Điểm rỗng null, ngân sách null, target null.
 */
export const BLANK_USER_DECISION_PROFILE: UserDecisionProfile = {
  name: "",
  grade: "",
  highSchool: "",
  homeProvince: "",
  examScores: {
    toan: null,
    van: null,
    anh: null,
    ly: null,
    hoa: null,
    sinh: null,
    su: null,
    dia: null,
    gdcd: null,
  },
  altScores: {
    hoc_ba_gpa: null,
    dgnl_hn: null,
    dgnl_hcm: null,
    dgtd_bk: null,
    ielts: null,
  },
  priority: {
    area: "KV3",
    object: "none",
  },
  annualBudgetVnd: 0,
  relocationWillingness: "trong_vung",
  availableHoursPerWeek: 0,
  activeCombination: "A01",
  targetProgram: null,
};
