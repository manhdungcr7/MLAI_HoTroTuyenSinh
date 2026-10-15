// Cuộc trò chuyện ở màn Tư vấn: lưu cục bộ, dựng ngữ cảnh nối tiếp gửi kèm. TypeScript thuần, không React.
// Mặc định lịch sử chat KHÔNG nằm trong tệp sao lưu (src/state/sao-luu.ts): đó là hội thoại tạm, dễ tạo lại, và có thể
// chứa câu bạn tự gõ. Chỉ khi bạn tự bật "Kèm lịch sử trò chuyện" ở Cài đặt thì tệp mới mang theo (`lichSuChat`, được
// lamSachLichSu kiểm khi khôi phục). Khóa `nvai:*` nên "Xóa hết", "Hồ sơ mẫu", "Khôi phục" đều xóa nó rồi (nếu tệp có)
// nạp lại lịch sử từ tệp, vì vậy hội thoại của hồ sơ mẫu không lẫn sang hồ sơ thật.
import { GIOI_HAN } from "@/engine/tu-van";

export const KHOA_CHAT = "nvai:tu-van-chat";
export const TOI_DA_TIN = 30;

export interface TinNhan {
  vai: "em" | "mayChu";
  chu: string;
  nguon?: string[];
  cheDo?: "ai" | "tuDong";
  tang?: "cache" | "llm";
  congDong?: string[];
  viecTiep?: string;
  /** Mã các ngành đã gửi kèm ở lượt này (ghi trên tin của máy), để câu nối tiếp giữ đúng ngành. */
  idDuLieu?: string[];
  /** Tin tự động do lỗi mạng/hết giờ (không phải do chưa bật AI): cho phép "Thử lại". */
  thuLai?: boolean;
}

const ds = (x: unknown, n: number, dai: number): string[] | undefined =>
  Array.isArray(x) ? x.filter((t): t is string => typeof t === "string").slice(0, n).map((t) => t.slice(0, dai)) : undefined;

/** Đọc lịch sử từ dữ liệu thô; bỏ mọi tin sai hình dạng, chỉ giữ TOI_DA_TIN tin gần nhất. */
export function lamSachLichSu(x: unknown): TinNhan[] {
  if (!Array.isArray(x)) return [];
  const r: TinNhan[] = [];
  for (const m of x) {
    if (!m || typeof m !== "object") continue;
    const o = m as Record<string, unknown>;
    if ((o.vai !== "em" && o.vai !== "mayChu") || typeof o.chu !== "string" || !o.chu.trim()) continue;
    const t: TinNhan = { vai: o.vai, chu: o.chu.slice(0, 4000) };
    if (o.vai === "mayChu") {
      const nguon = ds(o.nguon, 12, 40); if (nguon) t.nguon = nguon;
      if (o.cheDo === "ai" || o.cheDo === "tuDong") t.cheDo = o.cheDo;
      if (o.tang === "cache" || o.tang === "llm") t.tang = o.tang;
      const cd = ds(o.congDong, 12, 60); if (cd) t.congDong = cd;
      if (typeof o.viecTiep === "string") t.viecTiep = o.viecTiep.slice(0, 300);
      const id = ds(o.idDuLieu, 12, 40); if (id) t.idDuLieu = id;
      if (o.thuLai === true) t.thuLai = true;
    }
    r.push(t);
  }
  return r.slice(-TOI_DA_TIN);
}

export const catLichSu = (t: TinNhan[]): TinNhan[] => t.slice(-TOI_DA_TIN);

export interface KhoChat { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export function docLichSu(kho: KhoChat): TinNhan[] {
  try { const t = kho.getItem(KHOA_CHAT); return t ? lamSachLichSu(JSON.parse(t)) : []; } catch { return []; }
}

/** Ghi lịch sử; rỗng thì xóa khóa. Trả false khi không ghi được (đầy bộ nhớ, chế độ riêng tư). */
export function ghiLichSu(kho: KhoChat, t: TinNhan[]): boolean {
  try {
    if (t.length === 0) kho.removeItem(KHOA_CHAT); else kho.setItem(KHOA_CHAT, JSON.stringify(catLichSu(t)));
    return true;
  } catch { return false; }
}

const gon = (t: string, n: number) => { const s = t.replace(/\s+/g, " ").trim(); return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s; };

/**
 * Ngữ cảnh gửi kèm: màn hình đang hỏi + vài lượt gần nhất (câu hỏi và câu trả lời rút gọn), tổng không quá GIOI_HAN.nguCanh.
 * Mỗi lượt là hai dòng "Em hỏi: …" và "Mình đáp: …"; máy chủ đọc dòng "Em hỏi:" cuối làm chủ đề của câu nối tiếp.
 * Lượt cũ nhất bị bỏ trước khi vượt giới hạn. Chỉ lấy các cặp hỏi–đáp đã hoàn tất.
 */
export function taoNguCanh(manHinh: string, tin: TinNhan[], gioiHan = GIOI_HAN.nguCanh): string {
  const dau = gon(manHinh, 60);
  const luot: string[] = [];
  for (let i = tin.length - 1; i >= 1 && luot.length < 3; i--) {
    if (tin[i].vai !== "mayChu" || tin[i - 1].vai !== "em") continue;
    luot.unshift(`Em hỏi: ${gon(tin[i - 1].chu, 110)}\nMình đáp: ${gon(tin[i].chu, 170)}`);
    i--;
  }
  const ghep = (l: string[]) => (l.length ? `${dau}\nCác lượt trước:\n${l.join("\n")}` : dau);
  while (luot.length > 0 && ghep(luot).length > gioiHan) luot.shift();
  return ghep(luot).slice(0, gioiHan);
}

/** Mã ngành lượt trước để giữ cho câu nối tiếp: ngành được trích nguồn trước, rồi các ngành còn lại đã gửi kèm. */
export function nganhLuotTruoc(tin: TinNhan[], toiDa = 8): string[] {
  for (let i = tin.length - 1; i >= 0; i--) {
    const t = tin[i];
    if (t.vai !== "mayChu") continue;
    const r = [...new Set([...(t.nguon ?? []), ...(t.idDuLieu ?? [])])];
    if (r.length) return r.slice(0, toiDa);
  }
  return [];
}

/** Câu hỏi mẫu ở trạng thái trống, sinh từ hồ sơ (nguyện vọng, ngành quan tâm), không viết cứng tên trường. */
export function goiYBanDau(h: { soNguyenVong: number; nganhQuanTam: string[] }): string[] {
  const r: string[] = [];
  if (h.soNguyenVong > 0) r.push("Danh sách nguyện vọng của mình có cân bằng không?");
  if (h.nganhQuanTam[0]) r.push(`Điểm của mình đã đủ cho ngành ${h.nganhQuanTam[0]} chưa?`);
  r.push("Với điểm hiện tại nên xếp NV1 trường nào?");
  if (h.nganhQuanTam.length >= 2) r.push("So sánh hai ngành đang quan tâm");
  r.push("Nên bắt đầu tìm ngành từ đâu?", "Điểm số của mình đang thiếu gì để so sánh?");
  return [...new Set(r)].slice(0, 4);
}
