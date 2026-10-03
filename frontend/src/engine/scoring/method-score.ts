/**
 * Điểm xét tuyển của học sinh cho một chương trình, theo đúng phương thức của ngưỡng điểm.
 *
 * Một ngưỡng điểm học bạ không so được với điểm thi THPT và ngược lại, nên mọi engine
 * (gợi ý, xếp nguyện vọng, khoảng cách, đòn bẩy môn) dùng chung hàm này.
 * Chỉ tính được hai phương thức có cùng thang 30 từ điểm môn: thi THPT và học bạ.
 * ĐGNL/ĐGTD/năng khiếu/kết hợp cần bảng quy đổi hoặc điểm riêng của từng trường → trả null.
 */

import { AdmissionMethod, ExamScores, StudentProfile, TargetProgram } from "@/engine/types";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";
import { calculateTotalPriorityBonus, convertIeltsToEnglishScore } from "@/engine/admissions/priority";

export const SCORABLE_METHODS: AdmissionMethod[] = ["THPT", "HOC_BA"];

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

export interface MethodScore {
  method: AdmissionMethod;
  /** Điểm xét tuyển (đã cộng ưu tiên), thang 30. */
  score: number;
  /** Tổng 3 môn chưa cộng ưu tiên. */
  rawScore: number;
  bonus: number;
  combo: string;
  /** true khi môn Tiếng Anh được thay bằng điểm quy đổi IELTS (bảng chung, mỗi trường khác nhau). */
  usedIeltsConversion: boolean;
  /**
   * true khi đề án không ghi tổ hợp cạnh điểm chuẩn: điểm được tính theo tổ hợp chính của
   * học sinh, cần kiểm tra trường có xét tổ hợp đó không.
   */
  comboUnverified: boolean;
}

export function programMethod(program: Pick<TargetProgram, "admissionMethod">): AdmissionMethod {
  return program.admissionMethod ?? "THPT";
}

function subjectScores(profile: StudentProfile, method: AdmissionMethod): ExamScores | null {
  if (method === "THPT") return profile.examScores ?? null;
  if (method === "HOC_BA") return profile.hocBaScores ?? null;
  return null;
}

function comboScore(
  scores: ExamScores,
  combo: string,
  ielts: number | null | undefined,
  allowIelts: boolean
): { raw: number; usedIelts: boolean } | null {
  const subjects = COMBINATION_SUBJECTS[combo];
  if (!subjects) return null;
  let total = 0;
  let usedIelts = false;
  for (const sub of subjects) {
    let v = scores[sub as keyof ExamScores];
    if (sub === "anh" && allowIelts && ielts && ielts >= 5.0) {
      const converted = convertIeltsToEnglishScore(ielts, v);
      if (typeof converted === "number" && (typeof v !== "number" || converted > v)) {
        v = converted;
        usedIelts = true;
      }
    }
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    total += Math.max(0, Math.min(10, v));
  }
  return { raw: Math.min(30, Math.round(total * 100) / 100), usedIelts };
}

/**
 * Điểm tốt nhất của học sinh cho chương trình (chọn tổ hợp có lợi nhất trong các tổ hợp
 * trường công bố). null khi phương thức không tính được hoặc học sinh thiếu môn.
 */
export function scoreForProgram(profile: StudentProfile, program: TargetProgram): MethodScore | null {
  const method = programMethod(program);
  if (!SCORABLE_METHODS.includes(method)) return null;
  // Ngành có thi năng khiếu: điểm 3 môn văn hoá không phản ánh điểm xét tuyển.
  if ((program as TargetProgram & { requiresAptitude?: boolean }).requiresAptitude) return null;
  const scores = subjectScores(profile, method);
  if (!scores) return null;
  const published = (Array.isArray(program.combinations) ? program.combinations : [])
    .filter((c) => COMBINATION_SUBJECTS[c]);
  const hasPublishedCombos = Array.isArray(program.combinations) && program.combinations.length > 0;
  // Đề án ghi tổ hợp nhưng toàn mã năng khiếu (T00, V00...) → 3 môn văn hoá không tính được.
  if (hasPublishedCombos && published.length === 0) return null;
  const comboUnverified = !hasPublishedCombos;
  const combos = comboUnverified
    ? (profile.activeCombination && COMBINATION_SUBJECTS[profile.activeCombination] ? [profile.activeCombination] : [])
    : published;

  let best: MethodScore | null = null;
  for (const combo of combos) {
    const cs = comboScore(scores, combo, profile.altScores?.ielts, method === "THPT");
    if (!cs) continue;
    // Từ kỳ thi 2026, tổng điểm thi gốc của tổ hợp phải đạt sàn 15/30 — không cộng ưu tiên
    // và không được bù bằng điểm quy đổi chứng chỉ.
    if (method === "THPT" && profile.graduationYear != null && profile.graduationYear >= 2026 &&
      profile.minimumScoreException !== true) {
      const examOnly = comboScore(scores, combo, null, false);
      if (!examOnly || examOnly.raw < 15) continue;
    }
    const bonus = profile.priority ? calculateTotalPriorityBonus(profile.priority, cs.raw) : 0;
    const score = Math.min(30, Math.round((cs.raw + bonus) * 100) / 100);
    if (!best || score > best.score) {
      best = { method, score, rawScore: cs.raw, bonus, combo, usedIeltsConversion: cs.usedIelts, comboUnverified };
    }
  }
  return best;
}

/** Học sinh đã nhập đủ điểm để dùng phương thức này cho ít nhất một tổ hợp chưa. */
export function hasScoresForMethod(profile: StudentProfile, method: AdmissionMethod): boolean {
  const scores = subjectScores(profile, method);
  if (!scores) return false;
  return Object.keys(COMBINATION_SUBJECTS).some((c) => comboScore(scores, c, null, false) !== null);
}
