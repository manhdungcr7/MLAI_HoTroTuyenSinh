// Các đoạn chat đã lưu để mở lại: tối đa TOI_DA_DOAN đoạn, đoạn mới nhất đứng đầu. TypeScript thuần, không React.
// Khóa `nvai:*` nên "Xóa hết" xóa luôn. Không nằm trong tệp sao lưu (cùng lý do với lịch sử chat hiện tại, xem hoi-thoai.ts).
import { lamSachLichSu, type KhoChat, type TinNhan } from "./hoi-thoai";

export const KHOA_DOAN_CHAT = "nvai:tu-van-doan";
export const TOI_DA_DOAN = 10;

export interface DoanChat { id: string; tieuDe: string; luc: number; tin: TinNhan[] }

const tieuDeCua = (tin: TinNhan[]): string => {
  const s = (tin.find((t) => t.vai === "em")?.chu ?? "Đoạn chat").replace(/\s+/g, " ").trim();
  return s.length > 48 ? `${s.slice(0, 47).trimEnd()}…` : s;
};

export function docCacDoan(kho: KhoChat): DoanChat[] {
  try {
    const x: unknown = JSON.parse(kho.getItem(KHOA_DOAN_CHAT) ?? "[]");
    if (!Array.isArray(x)) return [];
    return x.flatMap((o): DoanChat[] => {
      if (!o || typeof o !== "object") return [];
      const r = o as Record<string, unknown>;
      const tin = lamSachLichSu(r.tin);
      if (typeof r.id !== "string" || tin.length === 0) return [];
      return [{ id: r.id.slice(0, 40), tieuDe: typeof r.tieuDe === "string" ? r.tieuDe.slice(0, 60) : tieuDeCua(tin), luc: typeof r.luc === "number" ? r.luc : 0, tin }];
    }).slice(0, TOI_DA_DOAN);
  } catch { return []; }
}

const ghi = (kho: KhoChat, ds: DoanChat[]): void => {
  try { if (ds.length) kho.setItem(KHOA_DOAN_CHAT, JSON.stringify(ds.slice(0, TOI_DA_DOAN))); else kho.removeItem(KHOA_DOAN_CHAT); } catch { /* đầy bộ nhớ: bỏ qua, đoạn chat hiện tại vẫn còn */ }
};

/** Cất đoạn chat hiện tại (cần ít nhất một câu hỏi đã có đáp) lên đầu danh sách; quá TOI_DA_DOAN thì bỏ đoạn cũ nhất. */
export function luuDoanChat(kho: KhoChat, tin: TinNhan[], luc = Date.now()): void {
  if (!tin.some((t) => t.vai === "mayChu")) return;
  const ds = docCacDoan(kho);
  ghi(kho, [{ id: `${luc.toString(36)}${Math.random().toString(36).slice(2, 6)}`, tieuDe: tieuDeCua(tin), luc, tin }, ...ds]);
}

/** Lấy một đoạn ra khỏi danh sách (để mở lại hoặc xóa). Trả về đoạn đó, hoặc null nếu không còn. */
export function goDoanChat(kho: KhoChat, id: string): DoanChat | null {
  const ds = docCacDoan(kho), d = ds.find((x) => x.id === id) ?? null;
  if (d) ghi(kho, ds.filter((x) => x.id !== id));
  return d;
}
