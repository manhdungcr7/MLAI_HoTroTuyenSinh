import { ExamScores, StudentProfile, TargetProgram, WishlistItem } from "@/engine/types";

const KEY = "nguyen_vong_ai_app_state_v5";
const LEGACY_KEYS = ["nguyen_vong_ai_app_state_v4", "nguyen_vong_ai_decision_state_v3", "nguyen_vong_ai_decision_state_v2"];

export interface PersistedState {
  version: 5;
  profile: StudentProfile;
  wishlist: WishlistItem[];
  target: TargetProgram | null;
}

export function blankProfile(): StudentProfile {
  return {
    name: "",
    grade: "",
    highSchool: "",
    homeProvince: "",
    examScores: {},
    altScores: {},
    priority: { area: "KV3", object: "none" },
    annualBudgetVnd: 0,
    relocationWillingness: "khong_gioi_han",
    availableHoursPerWeek: 0,
    activeCombination: "",
    interestMajorGroups: [],
  };
}

export function blankState(): PersistedState {
  return { version: 5, profile: blankProfile(), wishlist: [], target: null };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Giữ lại điểm hợp lệ (0–10); bỏ giá trị lạ để dữ liệu cũ hỏng không làm sai kết quả. */
function cleanScores(raw: unknown): ExamScores {
  const out: ExamScores = {};
  if (!isObject(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 10) (out as Record<string, number>)[k] = v;
  }
  return out;
}

/** Ghép dữ liệu đã lưu (kể cả bản cũ) vào hồ sơ trống để luôn đủ trường. */
export function sanitize(raw: unknown): PersistedState {
  const blank = blankState();
  if (!isObject(raw)) return blank;
  const p = isObject(raw.profile) ? (raw.profile as Partial<StudentProfile>) : {};
  const profile: StudentProfile = {
    ...blank.profile,
    ...p,
    examScores: cleanScores(p.examScores),
    hocBaScores: cleanScores(p.hocBaScores),
    altScores: isObject(p.altScores) ? { ...blank.profile.altScores, ...p.altScores } : blank.profile.altScores,
    priority: isObject(p.priority) ? { ...blank.profile.priority, ...p.priority } : blank.profile.priority,
    interestMajorGroups: Array.isArray(p.interestMajorGroups) ? p.interestMajorGroups.filter((g) => typeof g === "string") : [],
  };
  if (isObject(p.hocBaGrades)) {
    const grades: NonNullable<StudentProfile["hocBaGrades"]> = {};
    for (const g of ["10", "11", "12"] as const) {
      const scores = cleanScores((p.hocBaGrades as Record<string, unknown>)[g]);
      if (Object.keys(scores).length > 0) grades[g] = scores;
    }
    profile.hocBaGrades = grades;
  }
  const wishlist = Array.isArray(raw.wishlist)
    ? (raw.wishlist as WishlistItem[]).filter((w) => isObject(w) && typeof w.school_code === "string" && typeof w.program_id === "string")
    : [];
  const target = isObject(raw.target ?? raw.primaryTarget) ? ((raw.target ?? raw.primaryTarget) as unknown as TargetProgram) : null;
  return { version: 5, profile, wishlist: wishlist.slice(0, 15).map((w, i) => ({ ...w, rank: i + 1 })), target };
}

export function loadState(): PersistedState {
  try {
    const current = window.localStorage.getItem(KEY);
    if (current) return sanitize(JSON.parse(current));
    for (const legacy of LEGACY_KEYS) {
      const raw = window.localStorage.getItem(legacy);
      if (raw) return sanitize(JSON.parse(raw));
    }
  } catch {
    // Bộ nhớ trình duyệt bị chặn hoặc dữ liệu hỏng: bắt đầu lại từ hồ sơ trống.
  }
  return blankState();
}

export function saveState(state: PersistedState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Không lưu được (chế độ riêng tư, hết dung lượng): ứng dụng vẫn chạy với dữ liệu trong bộ nhớ.
  }
}

export function clearState(): void {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) window.localStorage.removeItem(key);
  } catch {
    // bỏ qua
  }
}
