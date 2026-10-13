// Clef (@cf/cloudflare/clef-omni): mô hình quyết định, chỉ làm TÍN HIỆU THỨ HAI.
// Không đổi nhãn Thử sức/Vừa sức/An toàn/Dự phòng (nhãn code cứng ở src/engine/phan-tich.ts); chỉ gợi ý nên nói tới ứng viên nào.
// Số đo thật (2026-10-13, Workers AI từ xa): cùng đầu vào thì cùng kết quả; ~120-150ms cho 3-60 câu; không cắt state tới ~17k token (300 ứng viên);
// tối đa 64 câu/lượt; state và câu hỏi tiếng Anh là hướng chính (tiếng Việt cũng chạy nhưng lệch nhiều hơn ở câu cấp danh sách).
// Câu cấp cả danh sách bị bão hòa (rủi ro tài chính ~1,9/2 dù ngân sách đủ) nên thiết kế hỏi TỪNG ứng viên.
import { MO_HINH, type KhoAI } from "./kieu";

export type KieuCauHoiClef = "noul" | "choice" | "score";
export interface CauHoiClef { type: KieuCauHoiClef; instructions: string; criteria?: string[] | Record<string, string> }
export interface TraLoiClef {
  /** score: điểm kỳ vọng chuẩn hóa về 0..1 (0 = mức thấp nhất). */
  score?: number;
  /** noul: xác suất 0..1. */
  noul?: number;
  choice?: { chon: string; xacSuat: Record<string, number>; tinCay: number };
}
export interface KetQuaClef { traLoi: Record<string, TraLoiClef>; tokenVao: number }

const MAC_DINH_MS = 4000;
const TOI_DA_CAU = 64;

const laSo = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Đưa answers thật của Clef về kiểu gọn. Đo được: score {score,legend{0:..},probabilities,confidence}; choice {choice,probabilities,confidence}; noul {noul}. */
export function chuanHoaTraLoi(tho: unknown): Record<string, TraLoiClef> {
  const ra: Record<string, TraLoiClef> = {};
  const answers = (tho as { answers?: unknown } | null)?.answers;
  if (!answers || typeof answers !== "object") return ra;
  for (const [id, v] of Object.entries(answers as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const a = v as Record<string, unknown>;
    if (a.type === "score" && laSo(a.score)) {
      const nac = a.legend && typeof a.legend === "object" ? Object.keys(a.legend).length : 0;
      const tran = nac >= 2 ? nac - 1 : 2;
      ra[id] = { score: Math.min(1, Math.max(0, a.score / tran)) };
    } else if (a.type === "noul" && laSo(a.noul)) {
      ra[id] = { noul: Math.min(1, Math.max(0, a.noul)) };
    } else if (a.type === "choice" && typeof a.choice === "string") {
      const xs: Record<string, number> = {};
      if (a.probabilities && typeof a.probabilities === "object") for (const [k, p] of Object.entries(a.probabilities as Record<string, unknown>)) if (laSo(p)) xs[k] = p;
      ra[id] = { choice: { chon: a.choice, xacSuat: xs, tinCay: laSo(a.confidence) ? a.confidence : 0 } };
    }
  }
  return ra;
}

/** Hỏi Clef một lượt. Trả null khi thiếu binding, quá hạn, lỗi hoặc không có câu trả lời dùng được; caller tự rơi về bậc thấp hơn. */
export async function hoiClef(ai: KhoAI | undefined, state: unknown, cauHoi: Record<string, CauHoiClef>, opt?: { hanMs?: number }): Promise<KetQuaClef | null> {
  const so = Object.keys(cauHoi).length;
  if (!ai || so < 1 || so > TOI_DA_CAU) return null;
  let dongHo: ReturnType<typeof setTimeout> | undefined;
  try {
    const han = new Promise<null>((r) => { dongHo = setTimeout(() => r(null), opt?.hanMs ?? MAC_DINH_MS); });
    const tho = await Promise.race([ai.run(MO_HINH.quyetDinh, { model: "clef-omni", state, questions: cauHoi }), han]);
    if (tho === null) return null;
    const traLoi = chuanHoaTraLoi(tho);
    if (!Object.keys(traLoi).length) return null;
    const u = (tho as { usage?: { input_tokens?: unknown } }).usage;
    return { traLoi, tokenVao: laSo(u?.input_tokens) ? u.input_tokens : 0 };
  } catch (e) {
    // Rơi về bậc thấp hơn nhưng để lại dấu vết trong log, không thì lỗi binding/hạn mức bị nuốt âm thầm.
    console.warn(JSON.stringify({ clefLoi: String((e as Error)?.message ?? e).slice(0, 200) }));
    return null;
  } finally {
    if (dongHo) clearTimeout(dongHo);
  }
}

// ---- Quyết định nguyện vọng ----

export type NhanEn = "trial" | "match" | "safe" | "backup";
export interface HoSoEn { grade?: number; totalScore?: number; budgetMillion?: number; province?: string; interests?: string[] }
export interface UngVienEn {
  id: string;
  label: NhanEn;            // nhãn đã tính sẵn bằng code, chỉ là đầu vào
  scoreGap?: number;        // chênh điểm đã tính sẵn
  tuitionMillion?: number;
  sameProvince?: boolean;
  employment?: number;      // 0..1
  interestGroups?: string[];
  communityNote?: string;   // tiếng Anh, ngắn
}
export const HANH_DONG = {
  enter_more_scores: "student has not entered enough subject scores",
  add_safe_option: "list lacks safe or backup options",
  keep_list: "list is balanced and no change is needed",
  review_tuition: "tuition of several candidates exceeds the student's budget",
  widen_region: "too few candidates are in the student's province",
} as const;
export type HanhDong = keyof typeof HANH_DONG;

export interface QuyetDinh {
  /** Rủi ro tài chính 0..1 theo id ứng viên (1 = rủi ro cao). */
  tai: Record<string, number>;
  /** Mức hợp sở thích 0..1 theo id ứng viên (1 = rất hợp). */
  soThich: Record<string, number>;
  /** Việc nên làm tiếp; null khi Clef không đủ tin cậy (< 0,3). Chỉ để gợi ý lời, không đổi danh sách. */
  hanhDong: { chon: HanhDong; tinCay: number } | null;
  /** Tối đa 6 id nên đưa cho LLM nói tới (rủi ro tài chính cao hoặc lệch sở thích). Không phải thứ tự ưu tiên nguyện vọng. */
  uuTienLLM: string[];
}

const TOI_DA_UNG_VIEN = 30; // 2 câu mỗi ứng viên + 1 câu hành động <= 64
const TOI_DA_UU_TIEN = 6;
const NGUONG_TIN_CAY = 0.3;

const bo = (s: string, n: number) => s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "").replace(/\+?\d[\d\s.-]{7,}\d/g, "").slice(0, n).trim();
const lam = (v: unknown): number | undefined => (laSo(v) ? Math.round(v * 100) / 100 : undefined);

/** Dựng state tiếng Anh chỉ từ trường trong danh sách trắng: không tên, không liên hệ. Ứng viên đặt khóa c0, c1... để không lộ id nội bộ. */
export function dungStateEn(hoSo: HoSoEn, ungVien: UngVienEn[]): { student: Record<string, unknown>; candidates: Record<string, unknown>[] } {
  const student = {
    grade: lam(hoSo.grade), totalScore: lam(hoSo.totalScore), budgetMillion: lam(hoSo.budgetMillion),
    province: typeof hoSo.province === "string" ? bo(hoSo.province, 40) : undefined,
    interests: Array.isArray(hoSo.interests) ? hoSo.interests.slice(0, 6).map((x) => bo(String(x), 40)) : undefined,
  };
  const candidates = ungVien.slice(0, TOI_DA_UNG_VIEN).map((u, i) => ({
    id: `c${i}`, label: u.label, scoreGap: lam(u.scoreGap), tuitionMillion: lam(u.tuitionMillion), sameProvince: u.sameProvince, employment: lam(u.employment),
    interestGroups: Array.isArray(u.interestGroups) ? u.interestGroups.slice(0, 4).map((x) => bo(String(x), 40)) : undefined,
    communityNote: typeof u.communityNote === "string" && u.communityNote ? bo(u.communityNote, 160) : undefined,
  }));
  return JSON.parse(JSON.stringify({ student, candidates }));
}

export function dungCauHoiEn(n: number): Record<string, CauHoiClef> {
  const q: Record<string, CauHoiClef> = {};
  for (let i = 0; i < n; i++) {
    q[`fin_c${i}`] = { type: "score", criteria: ["low", "medium", "high"], instructions: `Is the tuition of candidate c${i} (tuitionMillion) a financial risk given the student's budgetMillion? Higher means more risk.` };
    q[`int_c${i}`] = { type: "score", criteria: ["poor", "fair", "good"], instructions: `How well do the interestGroups of candidate c${i} match the student's interests?` };
  }
  q.next_action = { type: "choice", criteria: { ...HANH_DONG }, instructions: "What is the single best next action for this student's candidate list?" };
  return q;
}

/** Một lượt hỏi: rủi ro tài chính + hợp sở thích cho từng ứng viên, và một hành động tiếp theo cho cả danh sách. Trả null để caller bỏ tín hiệu này. */
export async function quyetDinhNguyenVong(ai: KhoAI | undefined, hoSoEn: HoSoEn, ungVien: UngVienEn[], opt?: { hanMs?: number }): Promise<QuyetDinh | null> {
  const dung = ungVien.slice(0, TOI_DA_UNG_VIEN);
  if (!ai || !dung.length) return null;
  const kq = await hoiClef(ai, dungStateEn(hoSoEn, dung), dungCauHoiEn(dung.length), opt);
  if (!kq) return null;
  const tai: Record<string, number> = {}, soThich: Record<string, number> = {};
  dung.forEach((u, i) => {
    const f = kq.traLoi[`fin_c${i}`]?.score, t = kq.traLoi[`int_c${i}`]?.score;
    if (f !== undefined) tai[u.id] = f;
    if (t !== undefined) soThich[u.id] = t;
  });
  if (!Object.keys(tai).length && !Object.keys(soThich).length) return null;
  const c = kq.traLoi.next_action?.choice;
  const hanhDong = c && c.tinCay >= NGUONG_TIN_CAY && c.chon in HANH_DONG ? { chon: c.chon as HanhDong, tinCay: c.tinCay } : null;
  const uuTienLLM = dung
    .map((u, i) => ({ id: u.id, d: (tai[u.id] ?? 0) + (1 - (soThich[u.id] ?? 1)), i }))
    .filter((x) => x.d >= 0.5)
    .sort((a, b) => b.d - a.d || a.i - b.i)
    .slice(0, TOI_DA_UU_TIEN)
    .map((x) => x.id);
  return { tai, soThich, hanhDong, uuTienLLM };
}
