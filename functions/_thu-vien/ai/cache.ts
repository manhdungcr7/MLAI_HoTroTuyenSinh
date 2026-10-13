// Bậc 1: cache câu trả lời tư vấn trong KV. Lỗi KV không bao giờ làm vỡ tư vấn (đọc lỗi = miss, ghi lỗi = bỏ qua).
import type { KhoKVAI } from "./kieu";

export const TTL_CACHE_GIAY = 6 * 60 * 60;
// Tăng số này mỗi khi đổi prompt/logic bậc thang hoặc dữ liệu gửi AI: câu trả lời cũ (có thể sai) không được phát lại tới 6 giờ.
const PHIEN_BAN_LOGIC = "3";
const TIEN_TO = `tvc${PHIEN_BAN_LOGIC}:`;

export interface BanGhiCache { traLoi: string; nguon: string[]; congDong?: string[]; viecTiep?: string }

/** Bỏ dấu, viết thường, gộp khoảng trắng: "Điểm chuẩn UIT?" và "diem chuan uit" cùng một khóa. */
export const chuanHoaCauHoi = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function bam(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Khóa = câu hỏi chuẩn hóa + id dữ liệu (sắp xếp) + nhãn từng ngành + hồ sơ tóm tắt + phiên bản dữ liệu + ngữ cảnh (các lượt trước: cùng câu "còn ngành kia thì sao?" ở hai cuộc trò chuyện khác nhau phải ra hai khóa khác nhau). */
export async function khoaCache(cauHoi: string, duLieu: { id: string; nhanCuaEm?: string }[], hoSo: unknown, phienBan = "", nguCanh = ""): Promise<string> {
  const ds = duLieu.map((d) => `${d.id}=${d.nhanCuaEm ?? ""}`).sort();
  return TIEN_TO + await bam(JSON.stringify([chuanHoaCauHoi(cauHoi), ds, hoSo ?? null, phienBan, chuanHoaCauHoi(nguCanh)]));
}

export async function docCache(kv: KhoKVAI | undefined, khoa: string): Promise<BanGhiCache | null> {
  if (!kv) return null;
  try {
    const tho = await kv.get(khoa);
    if (!tho) return null;
    const o = JSON.parse(tho) as BanGhiCache;
    return typeof o.traLoi === "string" && o.traLoi && Array.isArray(o.nguon) ? o : null;
  } catch { return null; }
}

export async function ghiCache(kv: KhoKVAI | undefined, khoa: string, v: BanGhiCache): Promise<void> {
  if (!kv || !v.traLoi) return;
  try { await kv.put(khoa, JSON.stringify(v), { expirationTtl: TTL_CACHE_GIAY }); } catch { /* bỏ qua */ }
}
