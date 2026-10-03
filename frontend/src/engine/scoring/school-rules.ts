/**
 * Quy tắc tính điểm xét tuyển riêng của từng trường.
 *
 * Mỗi trường công bố cách tính khác nhau cho từng phương thức (thang điểm, trọng số môn, điểm học bạ
 * lấy lớp/kỳ nào, thành phần ĐGNL, điểm cộng chứng chỉ...). Quy tắc của một trường là một file JSON
 * khai báo (frontend/src/data/school-rules/<MÃ TRƯỜNG>.json), có nguồn và ngày kiểm chứng; backend Python
 * (common/admission_core.py) đọc đúng các file đó nên hai bên tính giống hệt nhau.
 *
 * Trường chưa có quy tắc dùng công thức MẶC ĐỊNH (tổng 3 môn của tổ hợp + ưu tiên theo quy chế). Kết quả
 * luôn ghi rõ đó là quy tắc riêng của trường hay công thức chung để học sinh biết mức tin cậy.
 */

import { AdmissionMethod } from "@/engine/types";

export type ComponentSource = "exam_combo" | "hocba_combo" | "dgnl_hcm" | "dgnl_hn" | "dgtd_bk";

export type HocBaGrade = 10 | 11 | 12;

export interface RuleComponent {
  source: ComponentSource;
  /** Tỷ trọng của thành phần trong điểm học lực (các thành phần cộng lại bằng 1). */
  weight: number;
  /** Hệ số từng môn của tổ hợp (mặc định 1), ví dụ Toán nhân 2. Chỉ cho exam_combo/hocba_combo. */
  subjectWeights?: Record<string, number>;
  /** Học bạ: các lớp được lấy trung bình. Bỏ trống = điểm trung bình chung học sinh đã nhập. */
  grades?: HocBaGrade[];
}

export interface CertBonus {
  /** Bảng điểm cộng theo IELTS: lấy mức cao nhất đạt được, tính trên thang 30. */
  ielts?: { min: number; points: number }[];
}

export interface MethodRule {
  components: RuleComponent[];
  /** Tổng điểm thi gốc của tổ hợp (thang 30) tối thiểu để được xét. */
  minExamComboTotal?: number;
  certBonus?: CertBonus;
  /** Tổng điểm cộng (chứng chỉ + ưu tiên) tối đa trên thang 30. Mặc định 3 theo quy chế. */
  bonusCap?: number;
  /**
   * "common": chứng chỉ IELTS thay môn Tiếng Anh theo bảng phổ biến (chỉ là ước lượng);
   * "none" (mặc định cho quy tắc riêng): trường tự công bố cách tính, dùng certBonus nếu có.
   */
  englishCertConversion?: "common" | "none";
  /** "standard": ưu tiên khu vực/đối tượng theo quy chế; "none": trường không cộng ưu tiên cho phương thức này. */
  priority: "standard" | "none";
}

export interface RuleSource {
  url: string;
  /** Ngày người kiểm chứng đối chiếu quy tắc với văn bản gốc (YYYY-MM-DD). */
  verifiedAt: string;
  verifiedBy: string;
}

export interface SchoolRule {
  schoolCode: string;
  /** Năm tuyển sinh mà quy tắc áp dụng. */
  year: number;
  source: RuleSource;
  methods: Partial<Record<AdmissionMethod, MethodRule>>;
}

export type RuleOrigin = "school" | "default";

/** Công thức chung khi trường chưa có quy tắc riêng: chỉ định nghĩa cho thi THPT và học bạ. */
export const DEFAULT_RULES: Partial<Record<AdmissionMethod, MethodRule>> = {
  THPT: { components: [{ source: "exam_combo", weight: 1 }], priority: "standard", englishCertConversion: "common" },
  HOC_BA: { components: [{ source: "hocba_combo", weight: 1 }], priority: "standard" },
};

const registry = new Map<string, SchoolRule>();

export function registerSchoolRules(rules: SchoolRule[]): void {
  for (const rule of rules) {
    const problems = validateSchoolRule(rule);
    if (problems.length > 0) throw new Error(`Quy tắc trường ${rule.schoolCode} không hợp lệ: ${problems.join("; ")}`);
    registry.set(rule.schoolCode.toUpperCase(), rule);
  }
}

export function clearSchoolRules(): void {
  registry.clear();
}

export function getSchoolRule(schoolCode: string): SchoolRule | undefined {
  return registry.get(schoolCode.toUpperCase());
}

export function listSchoolRules(): SchoolRule[] {
  return [...registry.values()];
}

export function resolveMethodRule(
  schoolCode: string,
  method: AdmissionMethod,
): { rule: MethodRule; origin: RuleOrigin; source?: RuleSource } | null {
  const school = getSchoolRule(schoolCode);
  const own = school?.methods[method];
  if (own) return { rule: own, origin: "school", source: school?.source };
  const fallback = DEFAULT_RULES[method];
  return fallback ? { rule: fallback, origin: "default" } : null;
}

const SOURCES: ComponentSource[] = ["exam_combo", "hocba_combo", "dgnl_hcm", "dgnl_hn", "dgtd_bk"];

/** Kiểm tra cấu trúc quy tắc; trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateSchoolRule(rule: SchoolRule): string[] {
  const problems: string[] = [];
  if (!/^[A-Z0-9]{2,5}$/.test(rule.schoolCode)) problems.push("mã trường phải gồm 2–5 chữ hoa/số");
  if (!Number.isInteger(rule.year) || rule.year < 2025) problems.push("năm tuyển sinh không hợp lệ");
  if (!rule.source?.url || !/^https?:\/\//.test(rule.source.url)) problems.push("thiếu đường dẫn văn bản gốc");
  if (!rule.source?.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(rule.source.verifiedAt)) problems.push("thiếu ngày kiểm chứng (YYYY-MM-DD)");
  if (!rule.source?.verifiedBy) problems.push("thiếu người kiểm chứng");
  const methods = Object.entries(rule.methods ?? {});
  if (methods.length === 0) problems.push("chưa có phương thức nào");
  for (const [method, m] of methods) {
    if (!m) continue;
    if (!m.components?.length) problems.push(`${method}: thiếu thành phần điểm`);
    const total = (m.components ?? []).reduce((s, c) => s + c.weight, 0);
    if (Math.abs(total - 1) > 1e-9) problems.push(`${method}: tổng tỷ trọng các thành phần phải bằng 1 (đang ${total})`);
    for (const c of m.components ?? []) {
      if (!SOURCES.includes(c.source)) problems.push(`${method}: nguồn điểm không hợp lệ "${c.source}"`);
      if (!(c.weight > 0 && c.weight <= 1)) problems.push(`${method}: tỷ trọng phải trong (0, 1]`);
      if (c.grades && c.source !== "hocba_combo") problems.push(`${method}: chỉ học bạ mới chọn lớp`);
      if (c.subjectWeights && c.source !== "exam_combo" && c.source !== "hocba_combo") problems.push(`${method}: hệ số môn chỉ dùng cho tổ hợp môn`);
      for (const w of Object.values(c.subjectWeights ?? {})) if (!(w > 0)) problems.push(`${method}: hệ số môn phải dương`);
    }
    if (m.englishCertConversion !== undefined && m.englishCertConversion !== "common" && m.englishCertConversion !== "none") problems.push(`${method}: englishCertConversion phải là common hoặc none`);
    for (const t of m.certBonus?.ielts ?? []) if (!(t.min >= 0 && t.min <= 9 && t.points >= 0 && t.points <= 3)) problems.push(`${method}: bảng điểm cộng IELTS không hợp lệ`);
    if (m.priority !== "standard" && m.priority !== "none") problems.push(`${method}: priority phải là standard hoặc none`);
    if (m.bonusCap !== undefined && !(m.bonusCap >= 0 && m.bonusCap <= 3)) problems.push(`${method}: trần điểm cộng phải trong [0, 3]`);
    if (m.minExamComboTotal !== undefined && !(m.minExamComboTotal >= 0 && m.minExamComboTotal <= 30)) problems.push(`${method}: ngưỡng tổng điểm thi phải trong [0, 30]`);
  }
  return problems;
}
