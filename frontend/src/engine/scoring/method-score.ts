/**
 * Điểm xét tuyển của học sinh cho một chương trình, theo đúng quy tắc của trường và phương thức.
 *
 * Mỗi (trường, phương thức) có một MethodRule: quy tắc riêng nếu trường đã được khai báo trong
 * data/school-rules, nếu không thì công thức mặc định (xem school-rules.ts). Kết quả luôn quy về
 * thang 30 để so với điểm chuẩn trong dữ liệu. Thiếu điểm đầu vào thì không tính và nêu rõ thiếu gì.
 */

import { AdmissionMethod, ExamScores, StudentProfile, TargetProgram } from "@/engine/types";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateTotalPriorityBonus, convertIeltsToEnglishScore } from "@/engine/admissions/priority";
import { HocBaGrade, MethodRule, RuleComponent, RuleOrigin, RuleSource, resolveMethodRule } from "@/engine/scoring/school-rules";

export const METHOD_LABELS_VI: Record<AdmissionMethod, string> = {
  THPT: "Điểm thi tốt nghiệp THPT",
  HOC_BA: "Học bạ THPT",
  DGNL_HN: "ĐGNL ĐHQG Hà Nội (HSA)",
  DGNL_HCM: "ĐGNL ĐHQG TP.HCM (V-ACT)",
  DGNL_SP: "ĐGNL ĐHSP Hà Nội (SPT)",
  DGTD: "Đánh giá tư duy Bách khoa (TSA)",
  DGNL_KHAC: "Đánh giá năng lực (khác)",
  NANG_KHIEU: "Kết hợp thi năng khiếu",
  KET_HOP: "Kết hợp chứng chỉ / nhiều tiêu chí",
  UU_TIEN: "Tuyển thẳng / ưu tiên xét tuyển",
  RIENG: "Tuyển sinh riêng của trường",
  KHAC: "Phương thức khác",
};

export const METHOD_SHORT_VI: Record<AdmissionMethod, string> = {
  THPT: "Thi THPT",
  HOC_BA: "Học bạ",
  DGNL_HN: "HSA",
  DGNL_HCM: "V-ACT",
  DGNL_SP: "SPT",
  DGTD: "TSA",
  DGNL_KHAC: "ĐGNL",
  NANG_KHIEU: "Năng khiếu",
  KET_HOP: "Kết hợp",
  UU_TIEN: "Tuyển thẳng",
  RIENG: "Riêng",
  KHAC: "Khác",
};

/** Thang điểm tối đa của các bài ĐGNL/ĐGTD, để quy về thang 30. */
const EXTERNAL_SCALES = { dgnl_hcm: 1200, dgnl_hn: 150, dgtd_bk: 100 } as const;
const COMBO_SOURCES = ["exam_combo", "hocba_combo"];
const DEFAULT_BONUS_CAP = 3;

export interface MethodScore {
  method: AdmissionMethod;
  /** Điểm xét tuyển (đã cộng điểm cộng/ưu tiên), thang 30. */
  score: number;
  /** Điểm học lực quy về thang 30, chưa cộng điểm cộng/ưu tiên. */
  rawScore: number;
  bonus: number;
  /** Tổ hợp môn dùng để tính; chuỗi rỗng khi phương thức không dùng tổ hợp (ví dụ chỉ ĐGNL). */
  combo: string;
  /** true khi môn Tiếng Anh được thay bằng điểm quy đổi IELTS theo bảng phổ biến. */
  usedIeltsConversion: boolean;
  /** true khi đề án không ghi tổ hợp cạnh điểm chuẩn nên tính theo tổ hợp chính của học sinh. */
  comboUnverified: boolean;
  /** "school": quy tắc riêng của trường đã kiểm chứng; "default": công thức chung. */
  ruleOrigin: RuleOrigin;
  ruleSource?: RuleSource;
}

export function programMethod(program: Pick<TargetProgram, "admissionMethod">): AdmissionMethod {
  return program.admissionMethod ?? "THPT";
}

const r2 = (x: number) => Math.round(x * 100) / 100;

type Needs = Set<string>;

function clamp10(v: number): number {
  return Math.max(0, Math.min(10, v));
}

/** Điểm các môn của một thành phần dạng tổ hợp, theo hệ số môn; null nếu thiếu (ghi vào needs). */
function comboComponentScores(
  component: RuleComponent,
  subjects: string[],
  profile: StudentProfile,
  needs: Needs,
  allowCertConversion: boolean,
): { weighted: number; max: number; usedIelts: boolean } | null {
  let sources: ExamScores[];
  if (component.source === "exam_combo") {
    if (!profile.examScores) { needs.add("Điểm thi các môn của tổ hợp"); return null; }
    sources = [profile.examScores];
  } else if (component.grades?.length) {
    sources = [];
    for (const g of component.grades) {
      const grade = profile.hocBaGrades?.[String(g) as "10" | "11" | "12"];
      if (!grade) needs.add(`Điểm học bạ lớp ${g}`);
      else sources.push(grade);
    }
    if (sources.length < component.grades.length) return null;
  } else {
    if (!profile.hocBaScores) { needs.add("Điểm học bạ các môn của tổ hợp"); return null; }
    sources = [profile.hocBaScores];
  }

  let weighted = 0;
  let max = 0;
  let usedIelts = false;
  for (const sub of subjects) {
    const w = component.subjectWeights?.[sub] ?? 1;
    const values = sources.map((s) => s[sub as keyof ExamScores]);
    let v: number | null | undefined;
    if (values.every((x) => typeof x === "number" && Number.isFinite(x))) {
      v = (values as number[]).reduce((a, b) => a + b, 0) / values.length;
    }
    const ielts = profile.altScores?.ielts;
    if (sub === "anh" && allowCertConversion && ielts && ielts >= 5.0) {
      const converted = convertIeltsToEnglishScore(ielts, typeof v === "number" ? v : undefined);
      if (typeof converted === "number" && (typeof v !== "number" || converted > v)) {
        v = converted;
        usedIelts = true;
      }
    }
    if (typeof v !== "number") { needs.add(`Điểm môn ${SUBJECT_LABELS_VI[sub] ?? sub}`); return null; }
    weighted += w * clamp10(v);
    max += w * 10;
  }
  return { weighted, max, usedIelts };
}

interface Evaluation {
  score: MethodScore | null;
  missing: string[];
}

function evaluate(profile: StudentProfile, program: TargetProgram): Evaluation {
  const method = programMethod(program);
  const resolved = resolveMethodRule(program.schoolCode, method);
  if (!resolved) return { score: null, missing: [] };
  // Ngành có thi năng khiếu: điểm văn hoá không phản ánh điểm xét tuyển.
  if ((program as TargetProgram & { requiresAptitude?: boolean }).requiresAptitude) return { score: null, missing: [] };
  const { rule, origin, source } = resolved;

  const needsCombo = rule.components.some((c) => COMBO_SOURCES.includes(c.source));
  let combos: string[] = [""];
  let comboUnverified = false;
  if (needsCombo) {
    const declared = Array.isArray(program.combinations) ? program.combinations : [];
    const published = declared.filter((c) => COMBINATION_SUBJECTS[c]);
    // Đề án ghi tổ hợp nhưng toàn mã năng khiếu (T00, V00...) → không tính được.
    if (declared.length > 0 && published.length === 0) return { score: null, missing: [] };
    comboUnverified = declared.length === 0;
    combos = comboUnverified
      ? (profile.activeCombination && COMBINATION_SUBJECTS[profile.activeCombination] ? [profile.activeCombination] : [])
      : published;
    if (combos.length === 0) return { score: null, missing: ["Tổ hợp xét tuyển"] };
  }

  const missing = new Set<string>();
  let best: MethodScore | null = null;
  for (const combo of combos) {
    const s = scoreCombo(profile, method, rule, combo, missing);
    if (!s) continue;
    if (!best || s.score > best.score) best = { ...s, method, combo, comboUnverified, ruleOrigin: origin, ruleSource: source };
  }
  return { score: best, missing: best ? [] : [...missing] };
}

function scoreCombo(
  profile: StudentProfile,
  method: AdmissionMethod,
  rule: MethodRule,
  combo: string,
  missing: Needs,
): Pick<MethodScore, "score" | "rawScore" | "bonus" | "usedIeltsConversion"> | null {
  const subjects = combo ? COMBINATION_SUBJECTS[combo] : [];
  const allowConversion = (rule.englishCertConversion ?? "none") === "common";
  let base = 0;
  let usedIelts = false;
  let examRaw: number | null = null;

  for (const c of rule.components) {
    let value30: number;
    if (c.source === "exam_combo" || c.source === "hocba_combo") {
      const cs = comboComponentScores(c, subjects, profile, missing, allowConversion && c.source === "exam_combo");
      if (!cs) return null;
      value30 = (cs.weighted / cs.max) * 30;
      usedIelts = usedIelts || cs.usedIelts;
      if (c.source === "exam_combo") {
        // Tổng điểm thi gốc 3 môn (không hệ số, không quy đổi chứng chỉ) để kiểm ngưỡng đầu vào.
        const own = profile.examScores;
        examRaw = own ? subjects.reduce((s, sub) => s + clamp10(Number(own[sub as keyof ExamScores] ?? 0)), 0) : null;
      }
    } else {
      const v = c.source === "dgnl_hcm" ? profile.altScores?.dgnl_hcm : c.source === "dgnl_hn" ? profile.altScores?.dgnl_hn : profile.altScores?.dgtd_bk;
      if (typeof v !== "number" || !Number.isFinite(v)) {
        missing.add(c.source === "dgnl_hcm" ? "Điểm ĐGNL ĐHQG-HCM" : c.source === "dgnl_hn" ? "Điểm ĐGNL ĐHQG Hà Nội" : "Điểm ĐGTD Bách khoa");
        return null;
      }
      value30 = (Math.max(0, Math.min(EXTERNAL_SCALES[c.source], v)) / EXTERNAL_SCALES[c.source]) * 30;
    }
    base += c.weight * value30;
  }
  base = Math.min(30, r2(base));

  // Từ kỳ thi 2026: tổng điểm thi gốc của tổ hợp phải đạt sàn 15/30; trường có thể đặt ngưỡng riêng cao hơn.
  const usesExam = rule.components.some((c) => c.source === "exam_combo");
  if (usesExam && examRaw !== null && profile.graduationYear != null && profile.graduationYear >= 2026 && profile.minimumScoreException !== true) {
    if (r2(examRaw) < Math.max(15, rule.minExamComboTotal ?? 0)) return null;
  } else if (usesExam && examRaw !== null && rule.minExamComboTotal !== undefined && r2(examRaw) < rule.minExamComboTotal) {
    return null;
  }
  void method;

  let certPoints = 0;
  const ielts = profile.altScores?.ielts;
  if (ielts && rule.certBonus?.ielts) {
    for (const t of rule.certBonus.ielts) if (ielts >= t.min && t.points > certPoints) certPoints = t.points;
  }
  const priority = rule.priority === "standard" && profile.priority ? calculateTotalPriorityBonus(profile.priority, base) : 0;
  const bonus = r2(Math.min(rule.bonusCap ?? DEFAULT_BONUS_CAP, certPoints + priority));
  return { score: Math.min(30, r2(base + bonus)), rawScore: base, bonus, usedIeltsConversion: usedIelts };
}

/** Điểm tốt nhất của học sinh cho chương trình (chọn tổ hợp có lợi nhất). null nếu chưa tính được. */
export function scoreForProgram(profile: StudentProfile, program: TargetProgram): MethodScore | null {
  return evaluate(profile, program).score;
}

/** Học sinh cần bổ sung điểm gì để tính được chương trình này (rỗng nếu đã tính được hoặc không tính được vì lý do khác). */
export function missingInputsForProgram(profile: StudentProfile, program: TargetProgram): string[] {
  return evaluate(profile, program).missing;
}

export type { HocBaGrade };
