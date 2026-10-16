// Hạn mức lượt AI theo hồ sơ ẩn danh mỗi ngày (giờ Việt Nam), thực thi ở máy chủ bằng D1.
// Nguyên tử: mỗi bước là một D1 batch (một giao dịch). Giữ chỗ chỉ thành công khi đếm < tối đa, nên dù hàng trăm yêu cầu song song
// cũng không vượt hạn mức. AI thành công thì giữ lượt (đã trừ); AI lỗi thì trả lượt. Gửi lại cùng mã yêu cầu không bị trừ hai lần.
import { ngayVN } from "../../src/engine/ngay-vn";

export interface CauD1 { bind(...g: unknown[]): CauD1; first<T = Record<string, unknown>>(): Promise<T | null>; run(): Promise<{ meta?: { changes?: number } }> }
export interface KhoD1HanMuc { prepare(sql: string): CauD1; batch(c: CauD1[]): Promise<{ meta?: { changes?: number } }[]> }

export const LUOT_MAC_DINH = 50;
/** Giữ chỗ quá lâu mà chưa xong (máy chủ chết giữa chừng) thì coi là bỏ, trả lại lượt. Lớn hơn ngân sách 12 giây của một lượt AI. */
export const HET_HAN_GIU_MS = 2 * 60 * 1000;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const laUuid = (x: unknown): x is string => typeof x === "string" && RE_UUID.test(x);

/** AI_QUOTA_DAILY: số nguyên 1..10000, sai hoặc thiếu thì 50. */
export function docHanMuc(v: string | undefined): number {
  const n = Number(v);
  return v !== undefined && Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : LUOT_MAC_DINH;
}

export interface GiuCho { ho: string; yc: string; ngay: string; the: string }
export type KqGiu = { ok: true; giu: GiuCho } | { ok: false; ly: "het-luot" | "trung" };

const sinhThe = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return [...b].map((x) => x.toString(16).padStart(2, "0")).join(""); };

export async function giuLuot(db: KhoD1HanMuc, ho: string, yc: string, toiDa: number, bayGio: number = Date.now()): Promise<KqGiu> {
  const ngay = ngayVN(bayGio), the = sinhThe(), han = bayGio - HET_HAN_GIU_MS, cu = ngayVN(bayGio - 3 * 86_400_000);
  const p = (s: string) => db.prepare(s);
  const kq = await db.batch([
    // 0-1: trả lại lượt của các giữ chỗ bị bỏ quên trong ngày
    p("UPDATE ai_luot_ngay SET dem = MAX(0, dem - (SELECT COUNT(*) FROM ai_yeu_cau WHERE ho_so = ? AND ngay = ? AND trang_thai = 'giu' AND tao_luc < ?)) WHERE ho_so = ? AND ngay = ?").bind(ho, ngay, han, ho, ngay),
    p("DELETE FROM ai_yeu_cau WHERE ho_so = ? AND ngay = ? AND trang_thai = 'giu' AND tao_luc < ?").bind(ho, ngay, han),
    // 2: giữ chỗ chỉ khi còn lượt (trùng mã yêu cầu thì bị bỏ qua, changes = 0)
    p("INSERT OR IGNORE INTO ai_yeu_cau (ho_so, yeu_cau, ngay, the, trang_thai, tao_luc) SELECT ?, ?, ?, ?, 'giu', ? WHERE COALESCE((SELECT dem FROM ai_luot_ngay WHERE ho_so = ? AND ngay = ?), 0) < ?").bind(ho, yc, ngay, the, bayGio, ho, ngay, toiDa),
    // 3: tăng đếm đúng khi dòng giữ chỗ vừa tạo thuộc về yêu cầu này
    p("INSERT INTO ai_luot_ngay (ho_so, ngay, dem) SELECT ?, ?, 1 WHERE EXISTS (SELECT 1 FROM ai_yeu_cau WHERE ho_so = ? AND yeu_cau = ? AND the = ?) ON CONFLICT (ho_so, ngay) DO UPDATE SET dem = dem + 1").bind(ho, ngay, ho, yc, the),
    // 4-5: dọn dữ liệu cũ
    p("DELETE FROM ai_yeu_cau WHERE ngay < ?").bind(cu),
    p("DELETE FROM ai_luot_ngay WHERE ngay < ?").bind(cu),
  ]);
  if ((kq[2]?.meta?.changes ?? 0) > 0) return { ok: true, giu: { ho, yc, ngay, the } };
  const co = await p("SELECT trang_thai FROM ai_yeu_cau WHERE ho_so = ? AND yeu_cau = ?").bind(ho, yc).first();
  return { ok: false, ly: co ? "trung" : "het-luot" };
}

/** AI thành công: đánh dấu xong (lượt đã trừ từ lúc giữ chỗ). */
export async function chotLuot(db: KhoD1HanMuc, g: GiuCho): Promise<void> {
  await db.prepare("UPDATE ai_yeu_cau SET trang_thai = 'xong' WHERE ho_so = ? AND yeu_cau = ? AND the = ? AND trang_thai = 'giu'").bind(g.ho, g.yc, g.the).run();
}

/** AI lỗi hoặc không đáng tính: trả lại lượt và xóa yêu cầu, để gửi lại cùng mã không bị coi là trùng. */
export async function traLaiLuot(db: KhoD1HanMuc, g: GiuCho): Promise<void> {
  await db.batch([
    db.prepare("UPDATE ai_luot_ngay SET dem = dem - 1 WHERE ho_so = ? AND ngay = ? AND dem > 0 AND EXISTS (SELECT 1 FROM ai_yeu_cau WHERE ho_so = ? AND yeu_cau = ? AND the = ? AND trang_thai = 'giu')").bind(g.ho, g.ngay, g.ho, g.yc, g.the),
    db.prepare("DELETE FROM ai_yeu_cau WHERE ho_so = ? AND yeu_cau = ? AND the = ? AND trang_thai = 'giu'").bind(g.ho, g.yc, g.the),
  ]);
}

export async function luotConLai(db: KhoD1HanMuc, ho: string, toiDa: number, bayGio: number = Date.now()): Promise<{ con: number; toiDa: number }> {
  const r = await db.prepare("SELECT dem FROM ai_luot_ngay WHERE ho_so = ? AND ngay = ?").bind(ho, ngayVN(bayGio)).first<{ dem: number }>();
  return { con: Math.max(0, toiDa - Number(r?.dem ?? 0)), toiDa };
}
