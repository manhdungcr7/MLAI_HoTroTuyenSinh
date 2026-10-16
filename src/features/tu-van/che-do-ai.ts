// Chế độ AI do người dùng tự chọn, định danh hồ sơ ẩn danh và số lượt AI gần nhất máy chủ báo. TypeScript thuần (không React), có test.
// Lưu ở localStorage khóa nvai:*. Hạn mức thật nằm ở máy chủ (functions/_thu-vien/han-muc-ai.ts), phía này chỉ để hiển thị và bỏ qua lời gọi thừa.
// Giới hạn: chưa có đăng nhập nên "hồ sơ" = mã ngẫu nhiên theo trình duyệt; xóa dữ liệu trình duyệt hoặc "Xóa hết" = hồ sơ mới. Sau này thay bằng mã tài khoản.
import { ngayVN } from "@/engine/ngay-vn";

export type CheDoAI = "ai" | "tietKiem";
export const CHE_DO_MAC_DINH: CheDoAI = "ai";
export const LUOT_AI_MOI_NGAY = 50;

export const KHOA_CHE_DO = "nvai:ai-che-do";
export const KHOA_ID_HO_SO = "nvai:ai-ho-so";
export const KHOA_LUOT = "nvai:ai-luot";
/** Ba khóa này giữ nguyên khi đổi hồ sơ mẫu hoặc khôi phục sao lưu; chỉ "Xóa hết" mới cấp mã hồ sơ mới. */
export const KHOA_AI = [KHOA_CHE_DO, KHOA_ID_HO_SO, KHOA_LUOT] as const;
export const SU_KIEN_AI = "nvai-ai-doi";

export interface KhoAI { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export interface Luot { con: number; toiDa: number }
interface LuotLuu extends Luot { ngay: string }

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const laUuid = (x: unknown): x is string => typeof x === "string" && RE_UUID.test(x);

/** UUID v4. Dùng crypto.randomUUID khi có, không thì tự sinh từ getRandomValues. */
export function uuidMoi(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (c) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const thu = <T>(f: () => T, du: T): T => { try { return f(); } catch { return du; } };
const baoDoi = () => thu(() => { if (typeof window !== "undefined") window.dispatchEvent(new Event(SU_KIEN_AI)); }, undefined);

/** Giá trị lạ hoặc thiếu (hồ sơ cũ, tệp khôi phục) đều là chế độ mặc định. */
export function docCheDo(kho: KhoAI | null | undefined): CheDoAI {
  const v = kho ? thu(() => kho.getItem(KHOA_CHE_DO), null) : null;
  return v === "tietKiem" ? "tietKiem" : v === "ai" ? "ai" : CHE_DO_MAC_DINH;
}

export function datCheDo(kho: KhoAI, c: CheDoAI): void {
  thu(() => kho.setItem(KHOA_CHE_DO, c), undefined);
  baoDoi();
}

/** Mã hồ sơ ẩn danh của trình duyệt này; chưa có thì sinh và lưu. Không lưu được (chế độ riêng tư) thì dùng mã tạm của phiên. */
let maTam: string | null = null;
export function idHoSoAI(kho: KhoAI | null | undefined): string {
  const cu = kho ? thu(() => kho.getItem(KHOA_ID_HO_SO), null) : null;
  if (laUuid(cu)) return cu;
  const moi = uuidMoi();
  if (kho) {
    thu(() => kho.setItem(KHOA_ID_HO_SO, moi), undefined);
    if (thu(() => kho.getItem(KHOA_ID_HO_SO), null) === moi) return moi;
  }
  maTam = maTam ?? moi; // không ghi được: giữ một mã cho cả phiên
  return maTam;
}

/** "Xóa hết": bỏ chế độ, mã hồ sơ và số lượt; lần gọi sau sẽ cấp mã mới. */
export function datLaiHoSoAI(kho: KhoAI): void {
  maTam = null;
  for (const k of KHOA_AI) thu(() => kho.removeItem(k), undefined);
  baoDoi();
}

/** Số lượt máy chủ báo gần nhất, chỉ tin khi còn trong cùng ngày giờ Việt Nam. */
export function docLuot(kho: KhoAI | null | undefined, bayGio: number = Date.now()): Luot | null {
  const t = kho ? thu(() => kho.getItem(KHOA_LUOT), null) : null;
  if (!t) return null;
  try {
    const o = JSON.parse(t) as Partial<LuotLuu>;
    if (o.ngay !== ngayVN(bayGio) || !Number.isInteger(o.con) || !Number.isInteger(o.toiDa)) return null;
    const toiDa = Math.max(1, o.toiDa!);
    return { con: Math.min(toiDa, Math.max(0, o.con!)), toiDa };
  } catch { return null; }
}

export function ghiLuot(kho: KhoAI, l: Luot, bayGio: number = Date.now()): void {
  thu(() => kho.setItem(KHOA_LUOT, JSON.stringify({ ngay: ngayVN(bayGio), con: l.con, toiDa: l.toiDa } satisfies LuotLuu)), undefined);
  baoDoi();
}

/** Nhãn chip trong khung chat. */
export function nhanChip(c: CheDoAI, l: Luot | null): string {
  if (c === "tietKiem") return "AI: tắt";
  const x = l ?? { con: LUOT_AI_MOI_NGAY, toiDa: LUOT_AI_MOI_NGAY };
  return `AI: còn ${x.con}/${x.toiDa}`;
}

/** Bối cảnh một lượt hỏi: chế độ, mã hồ sơ, lượt gần nhất và cách ghi lại. Không có thì lấy mặc định (chế độ AI, mã tạm, chưa biết lượt). */
export interface PhienAI {
  cheDo: CheDoAI;
  idHoSo: string;
  luot: Luot | null;
  ghiLuot?: (l: Luot) => void;
  /** Dùng cho test. */
  fetch?: typeof fetch;
  bayGio?: number;
}

/** Bối cảnh đọc tại thời điểm gửi (không giữ giá trị cũ trong closure): chế độ, mã hồ sơ, lượt gần nhất; ghi lượt mới vào kho. */
export function phienHienTai(kho: KhoAI, bayGio: number = Date.now()): PhienAI {
  return { cheDo: docCheDo(kho), idHoSo: idHoSoAI(kho), luot: docLuot(kho, bayGio), ghiLuot: (l) => ghiLuot(kho, l, bayGio), bayGio };
}
