// Cuộc trò chuyện ở màn Tư vấn: lưu cục bộ, dựng ngữ cảnh nối tiếp gửi kèm. TypeScript thuần, không React.
// Mặc định lịch sử chat KHÔNG nằm trong tệp sao lưu (src/state/sao-luu.ts): đó là hội thoại tạm, dễ tạo lại, và có thể
// chứa câu bạn tự gõ. Chỉ khi bạn tự bật "Kèm lịch sử trò chuyện" ở Cài đặt thì tệp mới mang theo (`lichSuChat`, được
// lamSachLichSu kiểm khi khôi phục). Khóa `nvai:*` nên "Xóa hết", "Hồ sơ mẫu", "Khôi phục" đều xóa nó rồi (nếu tệp có)
// nạp lại lịch sử từ tệp, vì vậy hội thoại của hồ sơ mẫu không lẫn sang hồ sơ thật.
import { GIOI_HAN, LOAI_HANH_DONG, TRANG_THAI_DU_LIEU, type HanhDongDeXuat, type TrangThaiDuLieu } from "@/engine/tu-van";

export const KHOA_CHAT = "nvai:tu-van-chat";
export const TOI_DA_TIN = 30;

/** Trường đề xuất trong câu trả lời, vẽ thành thẻ. `id` là chương trình liên quan (nếu có), `muc` cho biết đúng ngành hay chỉ gần nghĩa. */
export interface TheTruong { ma: string; id?: string; muc?: "chinh-xac" | "lien-quan" }
/** Nút trả lời nhanh: bấm là gửi `cau` như bạn gõ. */
export interface LuaChonNhanh { nhan: string; cau: string }
/** Câu bot vừa hỏi lại và đang chờ: để câu trả lời ngắn của bạn ("23") được hiểu đúng. */
export interface ChoTraLoi { y: "co-hoi-diem"; id: string }

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
  /** Trường đề xuất (thẻ), tối đa 12; hiện 3 thẻ đầu, còn lại sau nút "Xem thêm". */
  the?: TheTruong[];
  /** Hành động đã xác thực từ máy chủ hoặc từ bộ trả lời tự động (chỉ chứa mã có thật). */
  hanhDong?: HanhDongDeXuat[];
  /** Một câu hỏi lại ngắn khi thiếu thông tin. */
  hoiLai?: string;
  luaChon?: LuaChonNhanh[];
  trangThaiDuLieu?: TrangThaiDuLieu;
  cho?: ChoTraLoi;
  /** Tin tự động do lỗi mạng/hết giờ (không phải do chưa bật AI): cho phép "Thử lại". */
  thuLai?: boolean;
  /** Chế độ Tiết kiệm gặp câu cần AI diễn giải: hiện nút bật nhanh chế độ AI. */
  batAI?: boolean;
  /** Dòng ghi chú ngắn dưới tin (ví dụ đã hết lượt AI hôm nay). */
  ghiChu?: string;
}

const ds = (x: unknown, n: number, dai: number): string[] | undefined =>
  Array.isArray(x) ? x.filter((t): t is string => typeof t === "string").slice(0, n).map((t) => t.slice(0, dai)) : undefined;

const mangDoiTuong = (x: unknown): Record<string, unknown>[] => (Array.isArray(x) ? x.filter((e): e is Record<string, unknown> => !!e && typeof e === "object") : []);
export const lamSachThe = (x: unknown): TheTruong[] => mangDoiTuong(x).slice(0, 12).flatMap((e) => (typeof e.ma === "string" && e.ma ? [{
  ma: e.ma.slice(0, 12), ...(typeof e.id === "string" ? { id: e.id.slice(0, 40) } : {}), ...(e.muc === "chinh-xac" || e.muc === "lien-quan" ? { muc: e.muc } : {}),
}] : []));
const lamSachLuaChon = (x: unknown): LuaChonNhanh[] => mangDoiTuong(x).slice(0, 6).flatMap((e) => (typeof e.nhan === "string" && typeof e.cau === "string" && e.nhan && e.cau ? [{ nhan: e.nhan.slice(0, 60), cau: e.cau.slice(0, 200) }] : []));
export const lamSachHanhDong = (x: unknown): HanhDongDeXuat[] => mangDoiTuong(x).slice(0, 3).flatMap((e) => {
  if (!(LOAI_HANH_DONG as readonly unknown[]).includes(e.loai) || typeof e.nhan !== "string" || !e.nhan) return [];
  const ids = Array.isArray(e.ids) ? e.ids.filter((i): i is string => typeof i === "string").slice(0, 3).map((i) => i.slice(0, 40)) : undefined;
  return [{
    loai: e.loai as HanhDongDeXuat["loai"], nhan: e.nhan.slice(0, 40),
    ...(typeof e.maTruong === "string" ? { maTruong: e.maTruong.slice(0, 12) } : {}),
    ...(typeof e.idChuongTrinh === "string" ? { idChuongTrinh: e.idChuongTrinh.slice(0, 40) } : {}),
    ...(ids?.length ? { ids } : {}),
    ...(e.canXacNhan === true ? { canXacNhan: true } : {}),
  }];
});

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
      if (o.batAI === true) t.batAI = true;
      if (typeof o.ghiChu === "string" && o.ghiChu.trim()) t.ghiChu = o.ghiChu.trim().slice(0, 200);
      const the = lamSachThe(o.the); if (the.length) t.the = the;
      const hd = lamSachHanhDong(o.hanhDong); if (hd.length) t.hanhDong = hd;
      if (typeof o.hoiLai === "string" && o.hoiLai.trim()) t.hoiLai = o.hoiLai.trim().slice(0, 200);
      const lc = lamSachLuaChon(o.luaChon); if (lc.length) t.luaChon = lc;
      if ((TRANG_THAI_DU_LIEU as readonly unknown[]).includes(o.trangThaiDuLieu)) t.trangThaiDuLieu = o.trangThaiDuLieu as TrangThaiDuLieu;
      const ch = o.cho as Record<string, unknown> | undefined;
      if (ch && ch.y === "co-hoi-diem" && typeof ch.id === "string") t.cho = { y: "co-hoi-diem", id: ch.id.slice(0, 40) };
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
  r.push("Với điểm hiện tại nên xếp Nguyện Vọng 1 trường nào?");
  if (h.nganhQuanTam.length >= 2) r.push("So sánh hai ngành đang quan tâm");
  r.push("Nên bắt đầu tìm ngành từ đâu?", "Điểm số của mình đang thiếu gì để so sánh?");
  return [...new Set(r)].slice(0, 4);
}
