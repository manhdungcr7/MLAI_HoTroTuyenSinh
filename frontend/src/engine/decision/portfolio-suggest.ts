import { CandidateOption, WishlistItem } from "@/engine/types";

export const MAX_WISHES = 15;
const SAFE_MIN = 0.8;
const FIT_MIN = 0.4;
const REACH_MIN = 0.1;
const MAX_PER_SCHOOL = 3;

export function candidateToWishlistItem(option: CandidateOption, rank: number): WishlistItem {
  const nYears = option.yearsOfData ?? 0;
  return {
    rank,
    program_id: option.programId,
    school_code: option.schoolCode,
    school_name: option.schoolName,
    major_label: option.majorName,
    major_group: option.majorGroup,
    combinations_seen: option.combination,
    role: option.role,
    admit_prob: option.admitProbability,
    forecast_p50: option.cutoffP50,
    forecast_p10: option.cutoffP10,
    forecast_p90: option.cutoffP90,
    n_years: nYears,
    data_quality: nYears >= 3 ? "day_du" : nYears === 1 ? "chi_1_nam" : "thieu_mot_phan",
    user_score: option.userScore,
    tuition_vnd: option.tuitionVnd,
    employment_rate: option.employmentRate,
    data_passport_url: option.dataPassportUrl,
    region: option.region,
    province: option.province,
    source_tier: option.sourceTier ?? "official_pdf",
    admission_method: option.admissionMethod,
    method_inferred: option.methodInferred,
    combinations_verified: option.combinationsVerified,
  };
}

const byCutoffDesc = (a: CandidateOption, b: CandidateOption) =>
  b.cutoffP50 - a.cutoffP50 || b.admitProbability - a.admitProbability;

/** Lấy lần lượt từ các nhóm ngành để danh sách không dồn vào một lĩnh vực khi học sinh chưa chọn nhóm ngành. */
function roundRobinByGroup(list: CandidateOption[]): CandidateOption[] {
  const groups = new Map<string, CandidateOption[]>();
  for (const c of [...list].sort(byCutoffDesc)) {
    const g = groups.get(c.majorGroup) ?? [];
    g.push(c);
    groups.set(c.majorGroup, g);
  }
  const out: CandidateOption[] = [];
  const queues = Array.from(groups.values());
  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

/** Quy định hiện có trong ứng dụng: nguyện vọng sư phạm phải nằm trong 5 vị trí đầu. */
function enforceTeacherTrainingFirstFive(items: CandidateOption[]): CandidateOption[] {
  const isTeacher = (c: CandidateOption) => c.majorGroup === "su_pham";
  const head = items.slice(0, 5);
  const tail = items.slice(5);
  const rest = tail.filter((c) => !isTeacher(c));
  for (const late of tail.filter(isTeacher)) {
    let slot = -1;
    for (let i = head.length - 1; i >= 0; i--) if (!isTeacher(head[i])) { slot = i; break; }
    if (slot < 0) { rest.push(late); continue; }
    const [displaced] = head.splice(slot, 1, late);
    rest.unshift(displaced);
  }
  return [...head, ...rest];
}

export interface PortfolioSuggestion {
  items: CandidateOption[];
  /** true nếu danh sách chưa chọn nhóm ngành nên được trộn đều giữa các lĩnh vực */
  mixedFields: boolean;
}

/**
 * Đề xuất danh sách tối đa 15 nguyện vọng từ các ngành đã thỏa ràng buộc:
 * ~4 thử sức (10–40%), ~5 vừa tầm (40–80%), ~6 an toàn (≥ 80%), thiếu nhóm nào thì bù từ nhóm kế cận.
 * Mỗi trường tối đa 3 nguyện vọng. Thứ tự: điểm chuẩn cao → thấp (ngành "mơ ước" hơn lên trước),
 * vì hệ thống xét từ nguyện vọng 1 xuống, đỗ ở đâu trước thì dừng ở đó.
 */
export function suggestPortfolio(matched: CandidateOption[], hasInterest: boolean, size = MAX_WISHES): PortfolioSuggestion {
  const order = (l: CandidateOption[]) => (hasInterest ? [...l].sort(byCutoffDesc) : roundRobinByGroup(l));
  const tiers = {
    reach: order(matched.filter((c) => c.admitProbability >= REACH_MIN && c.admitProbability < FIT_MIN)),
    fit: order(matched.filter((c) => c.admitProbability >= FIT_MIN && c.admitProbability < SAFE_MIN)),
    safe: order(matched.filter((c) => c.admitProbability >= SAFE_MIN)),
  };
  const perSchool = new Map<string, number>();
  const chosen: CandidateOption[] = [];
  const take = (list: CandidateOption[], n: number) => {
    for (const c of list) {
      if (n <= 0 || chosen.length >= size) return;
      if (chosen.includes(c)) continue;
      if ((perSchool.get(c.schoolCode) ?? 0) >= MAX_PER_SCHOOL) continue;
      chosen.push(c);
      perSchool.set(c.schoolCode, (perSchool.get(c.schoolCode) ?? 0) + 1);
      n -= 1;
    }
  };
  // An toàn lấy các ngành điểm CAO nhất trong nhóm an toàn: tốt nhất em vẫn chắc đỗ.
  take(tiers.safe, Math.round(size * 0.4));
  take(tiers.fit, Math.round(size * 0.33));
  take(tiers.reach, Math.round(size * 0.27));
  // Bù chỗ trống: vừa tầm → an toàn → thử sức.
  take(tiers.fit, size);
  take(tiers.safe, size);
  take(tiers.reach, size);

  const sorted = enforceTeacherTrainingFirstFive([...chosen].sort(byCutoffDesc));
  // Nguyện vọng đứng sau một ngành gần như chắc đỗ (≥ 95%) hầu như không bao giờ được xét → không đề xuất.
  const firstSure = sorted.findIndex((c) => c.admitProbability >= 0.95);
  const useful = firstSure >= 0 ? sorted.slice(0, firstSure + 1) : sorted;
  return { items: useful, mixedFields: !hasInterest };
}

export type PortfolioWarningCode = "FEW_SAFE" | "SHADOWED" | "TEACHER_RANK";

export interface PortfolioWarning {
  code: PortfolioWarningCode;
  /** Vị trí nguyện vọng (bắt đầu từ 1) liên quan đến cảnh báo. */
  positions: number[];
}

const SHADOW_PROB = 0.95;
const MIN_SAFE = 2;
const TEACHER_MAX_RANK = 5;

/** Các vấn đề của danh sách nguyện vọng: thiếu nguyện vọng chắc đỗ, nguyện vọng không bao giờ được xét, sư phạm xếp quá thấp. */
export function portfolioWarnings(items: WishlistItem[]): PortfolioWarning[] {
  const warnings: PortfolioWarning[] = [];
  if (items.length === 0) return warnings;
  if (items.filter((w) => w.role === "an_toan").length < MIN_SAFE) warnings.push({ code: "FEW_SAFE", positions: [] });
  const firstSure = items.findIndex((w) => w.admit_prob >= SHADOW_PROB);
  if (firstSure >= 0 && firstSure < items.length - 1) {
    warnings.push({ code: "SHADOWED", positions: items.slice(firstSure + 1).map((_, i) => firstSure + i + 2) });
  }
  const teacherLate = items.map((w, i) => (w.major_group === "su_pham" && i >= TEACHER_MAX_RANK ? i + 1 : 0)).filter(Boolean);
  if (teacherLate.length > 0) warnings.push({ code: "TEACHER_RANK", positions: teacherLate });
  return warnings;
}
