/**
 * DATA SEED: PERSONA MẪU & HỒ SƠ KHỞI TẠO MẶC ĐỊNH
 */

import { StudentProfile, TargetProgram } from "@/engine/types";
import { GOLDEN_PROGRAMS } from "@/data/universities";

// Target mặc định: ĐH Công nghệ - CNTT (QHI_CN1)
export const PRIMARY_DEFAULT_TARGET: TargetProgram = GOLDEN_PROGRAMS[0];

// Profile mặc định: Nguyễn Văn Minh (Khối A01)
export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: "Nguyễn Văn Minh",
  grade: "Lớp 12A1",
  graduationYear: 2026,
  highSchool: "THPT Chuyên Hà Nội - Amsterdam",
  homeProvince: "Hà Nội",
  examScores: {
    toan: 8.2,
    ly: 8.0,
    anh: 6.7,
    van: 6.5,
    hoa: 6.0,
    sinh: null,
    su: null,
    dia: null,
    gdcd: null,
  },
  altScores: {
    hoc_ba_gpa: 8.5,
    dgnl_hn: 98,
    dgnl_hcm: null,
    dgtd_bk: 68.5,
    ielts: 6.0,
  },
  priority: {
    area: "KV3",
    object: "none",
  },
  annualBudgetVnd: 45000000,
  relocationWillingness: "trong_vung",
  availableHoursPerWeek: 24,
  activeCombination: "A01",
};

// 3 Persona mẫu 1-click trải nghiệm nhanh trên Dashboard
export const SAMPLE_PERSONAS: {
  id: string;
  label: string;
  subLabel: string;
  profile: StudentProfile;
  target: TargetProgram;
}[] = [
  {
    id: "persona_minh_a01",
    label: "Minh (Khối A01 - CNTT)",
    subLabel: "Toán 8.2, Lý 8.0, Anh 6.7 · Tổng 22.9đ · Đích: ĐH Công nghệ",
    profile: DEFAULT_STUDENT_PROFILE,
    target: GOLDEN_PROGRAMS[0], // QHI_CN1
  },
  {
    id: "persona_lan_d01",
    label: "Lan (Khối D01 - Kinh tế)",
    subLabel: "Toán 7.5, Văn 8.2, Anh 8.5 · Tổng 24.2đ · Đích: ĐH Kinh tế Quốc dân",
    profile: {
      name: "Trần Mai Lan",
      grade: "Lớp 12D",
      graduationYear: 2026,
      highSchool: "THPT Chu Văn An",
      homeProvince: "Hà Nội",
      examScores: {
        toan: 7.5,
        van: 8.2,
        anh: 8.5,
        ly: null,
        hoa: null,
        sinh: null,
        su: 7.0,
        dia: 7.5,
        gdcd: 8.5,
      },
      altScores: {
        hoc_ba_gpa: 8.8,
        dgnl_hn: 102,
        dgnl_hcm: null,
        dgtd_bk: null,
        ielts: 7.5,
      },
      priority: {
        area: "KV3",
        object: "none",
      },
      annualBudgetVnd: 50000000,
      relocationWillingness: "trong_vung",
      availableHoursPerWeek: 22,
      activeCombination: "D01",
    },
    target: GOLDEN_PROGRAMS[9] || GOLDEN_PROGRAMS[0], // KHA_CNTT
  },
  {
    id: "persona_hung_a00",
    label: "Hùng (Khối A00 - Bách Khoa)",
    subLabel: "Toán 8.8, Lý 8.5, Hóa 7.8 · Tổng 25.1đ · Đích: Bách Khoa IT1",
    profile: {
      name: "Lê Quốc Hùng",
      grade: "Lớp 12 Chuyên Toán",
      graduationYear: 2026,
      highSchool: "THPT Chuyên KHTN",
      homeProvince: "Hà Nội",
      examScores: {
        toan: 8.8,
        ly: 8.5,
        hoa: 7.8,
        van: 6.0,
        anh: 6.5,
        sinh: null,
        su: null,
        dia: null,
        gdcd: null,
      },
      altScores: {
        hoc_ba_gpa: 9.1,
        dgnl_hn: 110,
        dgnl_hcm: null,
        dgtd_bk: 78.5,
        ielts: 6.0,
      },
      priority: {
        area: "KV2",
        object: "none",
      },
      annualBudgetVnd: 40000000,
      relocationWillingness: "trong_vung",
      availableHoursPerWeek: 28,
      activeCombination: "A00",
    },
    target: GOLDEN_PROGRAMS[4] || GOLDEN_PROGRAMS[0], // BKA_IT1
  },
];

export function getSamplePersona(id: string) {
  return SAMPLE_PERSONAS.find((p) => p.id === id) || SAMPLE_PERSONAS[0];
}
