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
  /** Nhóm ngành (majorGroup) không được cộng điểm chứng chỉ, ví dụ sư phạm. */
  excludedMajorGroups?: string[];
  /** Bảng điểm cộng theo IELTS: lấy mức cao nhất đạt được, tính trên thang 30. */
  ielts?: { min: number; points: number }[];
}

export interface MethodRule {
  /**
   * Lý do phương thức này chưa tính được (ví dụ trường chưa công bố bảng quy đổi học bạ). Có trường này thì không
   * tính xác suất cho phương thức đó thay vì đoán; `components` có thể để trống.
   */
  unsupportedReason?: string;
  components: RuleComponent[];
  /** Tổng điểm thi gốc của tổ hợp (thang 30) tối thiểu để được xét. */
  minExamComboTotal?: number;
  certBonus?: CertBonus;
  /** Tổng điểm cộng (chứng chỉ + ưu tiên) tối đa trên thang 30. Mặc định 3 theo quy chế. */
  bonusCap?: number;
  /**
   * Bảng quy đổi IELTS sang điểm môn Tiếng Anh (thang 10) do chính trường công bố. Không có bảng này thì KHÔNG quy đổi
   * (nhiều trường không cho dùng chứng chỉ thay điểm thi, và mỗi trường quy đổi một khác).
   */
  ieltsToEnglish?: { min: number; score: number }[];
  /**
   * Hệ số quy đổi nhân vào điểm học lực (trước điểm cộng/ưu tiên), khi trường quy đổi phương thức này về thang điểm
   * chung (ví dụ học bạ nhân 5/6). Điểm chuẩn của phương thức đó nằm trên thang đã quy đổi.
   */
  scoreFactor?: number;
  /**
   * Các tổ hợp trường nhận cho phương thức này. Dùng khi đề án không ghi tổ hợp cạnh từng ngành: thay vì tính theo tổ
   * hợp tốt nhất của học sinh (có thể là tổ hợp trường không nhận), chỉ thử các tổ hợp này.
   */
  allowedCombinations?: string[];
  /** Ngưỡng tổng điểm 3 môn học bạ (thang 30, không hệ số) để được xét theo phương thức học bạ. */
  minHocBaComboTotal?: number;
  /** "standard": ưu tiên khu vực/đối tượng theo quy chế; "none": trường không cộng ưu tiên cho phương thức này. */
  priority: "standard" | "none";
}

export interface RuleSource {
  url: string;
  /** Tên văn bản gốc đã đối chiếu. */
  document?: string;
  /** Mã băm SHA-256 của file văn bản đã đối chiếu, để người rà soát mở đúng bản. */
  sha256?: string;
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
  THPT: { components: [{ source: "exam_combo", weight: 1 }], priority: "standard" },
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
    if (m.unsupportedReason !== undefined) {
      if (!m.unsupportedReason.trim()) problems.push(`${method}: lý do không tính được không được để trống`);
      continue;
    }
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
    for (const c of m.allowedCombinations ?? []) if (!/^[A-Z]\d{2}$/.test(c)) problems.push(`${method}: mã tổ hợp không hợp lệ "${c}"`);
    if (m.scoreFactor !== undefined && !(m.scoreFactor > 0 && m.scoreFactor <= 3)) problems.push(`${method}: hệ số quy đổi phải trong (0, 3]`);
    for (const t of m.ieltsToEnglish ?? []) if (!(t.min >= 0 && t.min <= 9 && t.score >= 0 && t.score <= 10)) problems.push(`${method}: bảng quy đổi IELTS sang điểm Tiếng Anh không hợp lệ`);
    if (m.minHocBaComboTotal !== undefined && !(m.minHocBaComboTotal >= 0 && m.minHocBaComboTotal <= 30)) problems.push(`${method}: ngưỡng tổng điểm học bạ phải trong [0, 30]`);
    for (const t of m.certBonus?.ielts ?? []) if (!(t.min >= 0 && t.min <= 9 && t.points >= 0 && t.points <= 3)) problems.push(`${method}: bảng điểm cộng IELTS không hợp lệ`);
    if (m.priority !== "standard" && m.priority !== "none") problems.push(`${method}: priority phải là standard hoặc none`);
    if (m.bonusCap !== undefined && !(m.bonusCap >= 0 && m.bonusCap <= 3)) problems.push(`${method}: trần điểm cộng phải trong [0, 3]`);
    if (m.minExamComboTotal !== undefined && !(m.minExamComboTotal >= 0 && m.minExamComboTotal <= 30)) problems.push(`${method}: ngưỡng tổng điểm thi phải trong [0, 30]`);
  }
  return problems;
}
