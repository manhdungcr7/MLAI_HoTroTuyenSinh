/**
 * Điểm xét tuyển của học sinh cho một chương trình, theo đúng quy tắc của trường và phương thức.
 *
 * Mỗi (trường, phương thức) có một MethodRule: quy tắc riêng nếu trường đã được khai báo trong
 * data/school-rules, nếu không thì công thức mặc định (xem school-rules.ts). Kết quả luôn quy về
 * thang 30 để so với điểm chuẩn trong dữ liệu. Thiếu điểm đầu vào thì không tính và nêu rõ thiếu gì.
 */

import { AdmissionMethod, ExamScores, StudentProfile, TargetProgram } from "@/engine/types";
import { APTITUDE_SUBJECTS, COMBINATION_SUBJECTS, STANDARD_COMBINATIONS, SUBJECT_LABELS_VI, isAptitudeCombination } from "@/data/universities/combinations";
import { calculateTotalPriorityBonus, tableIeltsScore } from "@/engine/admissions/priority";
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
  approximateReason?: string;
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
  rule: MethodRule,
): { weighted: number; max: number; usedIelts: boolean; rawTotal: number } | null {
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
  let rawTotal = 0;
  let usedIelts = false;
  const ielts = profile.altScores?.ielts;
  const toefl = profile.altScores?.toefl;
  const table = rule.ieltsToEnglish;
  for (const sub of subjects) {
    const w = component.subjectWeights?.[sub] ?? 1;
    // Môn năng khiếu chỉ có điểm thi của trường, không có điểm học bạ: luôn lấy điểm năng khiếu đã nhập.
    const isAptitude = (APTITUDE_SUBJECTS as readonly string[]).includes(sub);
    const values = isAptitude ? [profile.examScores?.[sub as keyof ExamScores]] : sources.map((s) => s[sub as keyof ExamScores]);
    let v: number | null | undefined;
    if (values.every((x) => typeof x === "number" && Number.isFinite(x))) {
      v = (values as number[]).reduce((a, b) => a + b, 0) / values.length;
    }
    if (sub === "anh") {
      const candidates = [
        table?.length && ielts ? tableIeltsScore(ielts, table) : null,
        rule.toeflToEnglish?.length && toefl ? tableIeltsScore(toefl, rule.toeflToEnglish) : null,
      ];
      for (const converted of candidates) {
        if (converted !== null && (typeof v !== "number" || converted > v)) {
          v = converted;
          usedIelts = true;
        }
      }
    }
    if (typeof v !== "number") { needs.add(`Điểm ${component.source === "hocba_combo" ? "học bạ" : "thi"} môn ${SUBJECT_LABELS_VI[sub] ?? sub}`); return null; }
    weighted += w * clamp10(v);
    max += w * 10;
    rawTotal += clamp10(v);
  }
  return { weighted, max, usedIelts, rawTotal };
}

interface Evaluation {
  score: MethodScore | null;
  missing: string[];
  /** Mọi tổ hợp tính được (chỉ đầy đủ khi khám phá tổ hợp chưa xác thực). */
  options: MethodScore[];
}

const TEACHER_MIN_EXAM_TOTAL = 18;

function evaluate(profile: StudentProfile, program: TargetProgram, exploreUnverified = false): Evaluation {
  const method = programMethod(program);
  const resolved = resolveMethodRule(program.schoolCode, method, (program as TargetProgram).majorGroup, program.majorName);
  if (!resolved) return { score: null, missing: [], options: [] };
  // Ngành có thi năng khiếu: điểm văn hoá không phản ánh điểm xét tuyển.
  // Ngành thi năng khiếu chỉ tính được khi đề án ghi tổ hợp có môn năng khiếu mà ứng dụng hiểu (V00–V03, T00…, M01…).
  const declaredCombos = Array.isArray(program.combinations) ? program.combinations : [];
  if ((program as TargetProgram & { requiresAptitude?: boolean }).requiresAptitude && !declaredCombos.some((c) => COMBINATION_SUBJECTS[c] && isAptitudeCombination(c))) return { score: null, missing: [], options: [] };
  const { rule, origin, source } = resolved;
  if (rule.unsupportedReason) return { score: null, missing: [], options: [] };

  const needsCombo = rule.components.some((c) => COMBO_SOURCES.includes(c.source));
  let combos: string[] = [""];
  let comboUnverified = false;
  if (needsCombo) {
    const declared = Array.isArray(program.combinations) ? program.combinations : [];
    const published = declared.filter((c) => COMBINATION_SUBJECTS[c]);
    // Đề án ghi tổ hợp nhưng toàn mã năng khiếu (T00, V00...) → không tính được.
    if (declared.length > 0 && published.length === 0) return { score: null, missing: [], options: [] };
    const fromRule = (rule.allowedCombinations ?? []).filter((c) => COMBINATION_SUBJECTS[c]);
    if (declared.length === 0 && fromRule.length > 0) {
      // Trường công bố các tổ hợp được nhận ở mức trường: dữ liệu này đã đối chiếu nên không còn là "chưa xác thực".
      combos = fromRule;
    } else {
      comboUnverified = declared.length === 0;
      combos = comboUnverified
        ? exploreUnverified
          ? STANDARD_COMBINATIONS()
          : (profile.activeCombination && COMBINATION_SUBJECTS[profile.activeCombination] ? [profile.activeCombination] : [])
        : published;
    }
    if (combos.length === 0) return { score: null, missing: ["Tổ hợp xét tuyển"], options: [] };
  }

  const missing = new Set<string>();
  let best: MethodScore | null = null;
  const options: MethodScore[] = [];
  for (const combo of combos) {
    const s = scoreCombo(profile, rule, combo, missing, (program as TargetProgram).majorGroup);
    if (!s) continue;
    const option = { ...s, method, combo, comboUnverified, ruleOrigin: origin, ruleSource: source, approximateReason: rule.approximateReason };
    options.push(option);
    if (!best || option.score > best.score) best = option;
  }
  return { score: best, missing: best ? [] : [...missing], options };
}

type ComboScore = Pick<MethodScore, "score" | "rawScore" | "bonus" | "usedIeltsConversion">;

function scoreCombo(profile: StudentProfile, rule: MethodRule, combo: string, missing: Needs, majorGroup: string): ComboScore | null {
  if (rule.certMode !== "either") return scoreComboOnce(profile, rule, combo, missing, majorGroup);
  // Chứng chỉ chỉ được dùng một lần: quy đổi thành điểm môn Tiếng Anh hoặc lấy điểm cộng, chọn cách có lợi hơn.
  const converted = scoreComboOnce(profile, { ...rule, certBonus: undefined }, combo, missing, majorGroup);
  const bonus = scoreComboOnce(profile, { ...rule, ieltsToEnglish: undefined, toeflToEnglish: undefined }, combo, missing, majorGroup);
  if (converted && bonus) return converted.score >= bonus.score ? converted : bonus;
  return converted ?? bonus;
}

function scoreComboOnce(
  profile: StudentProfile,
  rule: MethodRule,
  combo: string,
  missing: Needs,
  majorGroup: string,
): ComboScore | null {
  const subjects = combo ? COMBINATION_SUBJECTS[combo] : [];
  let base = 0;
  let usedIelts = false;
  let examRaw: number | null = null;
  let hocBaRaw: number | null = null;

  for (const c of rule.components) {
    let value30: number;
    if (c.source === "exam_combo" || c.source === "hocba_combo") {
      const cs = comboComponentScores(c, subjects, profile, missing, rule);
      if (!cs) return null;
      value30 = (cs.weighted / cs.max) * 30;
      usedIelts = usedIelts || cs.usedIelts;
      if (c.source === "hocba_combo") hocBaRaw = r2(cs.rawTotal);
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
  base = Math.min(30, r2(base * (rule.scoreFactor ?? 1)));

  // Từ kỳ thi 2026: tổng điểm thi gốc của tổ hợp phải đạt sàn 15/30; trường có thể đặt ngưỡng riêng cao hơn.
  const usesExam = rule.components.some((c) => c.source === "exam_combo");
  if (usesExam && examRaw !== null && profile.graduationYear != null && profile.graduationYear >= 2026 && profile.minimumScoreException !== true) {
    if (r2(examRaw) < Math.max(15, rule.minExamComboTotal ?? 0)) return null;
  } else if (usesExam && examRaw !== null && rule.minExamComboTotal !== undefined && r2(examRaw) < rule.minExamComboTotal) {
    return null;
  }
  if (rule.minHocBaComboTotal !== undefined && hocBaRaw !== null && hocBaRaw < rule.minHocBaComboTotal) return null;

  // Ngành sư phạm (đề án 2026 của nhiều trường): ngưỡng đầu vào 18 điểm không tính ưu tiên/điểm cộng; xét học bạ cần học lực lớp 12 giỏi.
  if (majorGroup === "su_pham") {
    if (usesExam && examRaw !== null && r2(examRaw) < TEACHER_MIN_EXAM_TOTAL) return null;
    if (hocBaRaw !== null && profile.academicRank && profile.academicRank !== "gioi") return null;
  }

  let certPoints = 0;
  const ielts = profile.altScores?.ielts;
  if (ielts && rule.certBonus?.ielts && !rule.certBonus.excludedMajorGroups?.includes(majorGroup)) {
    for (const t of rule.certBonus.ielts) if (ielts >= t.min && t.points > certPoints) certPoints = t.points;
  }
  const toeflScore = profile.altScores?.toefl;
  if (toeflScore && rule.certBonus?.toefl && !rule.certBonus.excludedMajorGroups?.includes(majorGroup)) {
    for (const t of rule.certBonus.toefl) if (toeflScore >= t.min && t.points > certPoints) certPoints = t.points;
  }
  const award = profile.award ? rule.awardBonus?.[profile.award] ?? 0 : 0;
  certPoints += award;
  const priority = rule.priority === "standard" && profile.priority ? calculateTotalPriorityBonus(profile.priority, base) : 0;
  const bonus = r2(Math.min(rule.bonusCap ?? DEFAULT_BONUS_CAP, certPoints + priority));
  return { score: Math.min(30, r2(base + bonus)), rawScore: base, bonus, usedIeltsConversion: usedIelts };
}

/** Điểm tốt nhất của học sinh cho chương trình (chọn tổ hợp có lợi nhất). null nếu chưa tính được. */
export function scoreForProgram(profile: StudentProfile, program: TargetProgram): MethodScore | null {
  return evaluate(profile, program).score;
}

/**
 * Mọi cách tính được cho chương trình. Với chương trình chưa rõ tổ hợp, trả về điểm theo từng tổ hợp học sinh có điểm
 * (để nhân với xác suất trường nhận tổ hợp đó); các chương trình khác chỉ có tổ hợp trường công bố.
 */
export function scoreOptionsForProgram(profile: StudentProfile, program: TargetProgram): MethodScore[] {
  return evaluate(profile, program, true).options;
}

/** Học sinh cần bổ sung điểm gì để tính được chương trình này (rỗng nếu đã tính được hoặc không tính được vì lý do khác). */
export function missingInputsForProgram(profile: StudentProfile, program: TargetProgram): string[] {
  return evaluate(profile, program).missing;
}

export type { HocBaGrade };
