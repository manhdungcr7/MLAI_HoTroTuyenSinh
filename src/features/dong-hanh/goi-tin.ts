// Chế độ đồng hành không cần tài khoản: dữ liệu nằm trong phần "#" của đường dẫn, không gửi lên máy chủ nào.
//  - Em tạo liên kết chứa bản tóm tắt (GoiChiaSe) gửi cho phụ huynh, thầy cô, người tư vấn.
//  - Họ mở liên kết, xem, viết lời nhắn và gửi lại một liên kết khác (LoiNhan).
//  - Em mở liên kết lời nhắn thì lời nhắn được lưu vào hồ sơ.
// Mọi thứ đọc từ đường dẫn là dữ liệu không tin cậy: kiểm tra hình dạng, cắt độ dài, chỉ hiển thị dạng chữ.
import type { LoiNhan, VaiDongHanh } from "@/state/types";
import type { MucTomTat } from "@/features/hanh-trinh/tom-tat";

export const CAC_VAI: { gia: VaiDongHanh; nhan: string }[] = [
  { gia: "phuHuynh", nhan: "Phụ huynh" },
  { gia: "giaoVien", nhan: "Thầy cô" },
  { gia: "tuVan", nhan: "Người tư vấn" },
];
export const TEN_VAI: Record<VaiDongHanh, string> = { phuHuynh: "Phụ huynh", giaoVien: "Thầy cô", tuVan: "Người tư vấn" };

export const TOI_DA_LOI_NHAN = 600;
export const TOI_DA_TEN = 40;
const TOI_DA_DO_DAI_LIEN_KET = 12000;

export interface GoiChiaSe {
  v: 1;
  /** Tên em, chỉ có khi em chọn kèm. */
  ten?: string;
  luc: string;
  muc: MucTomTat[];
  chiSo: { ten: string; giaTri: string }[];
}

// ---------- Mã hóa dạng chữ an toàn trong đường dẫn (UTF-8 → base64url) ----------

export function maHoa(doiTuong: unknown): string {
  const byte = new TextEncoder().encode(JSON.stringify(doiTuong));
  let nhiPhan = "";
  byte.forEach((b) => { nhiPhan += String.fromCharCode(b); });
  return btoa(nhiPhan).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function giaiMa(chu: string | null | undefined): unknown {
  if (!chu || chu.length > TOI_DA_DO_DAI_LIEN_KET) return null;
  try {
    const b64 = chu.replace(/-/g, "+").replace(/_/g, "/");
    const nhiPhan = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const byte = Uint8Array.from(nhiPhan, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(byte));
  } catch { return null; }
}

const cat = (x: unknown, toiDa: number): string => (typeof x === "string" ? x.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, toiDa) : "");
const laNgay = (x: unknown) => typeof x === "string" && !Number.isNaN(Date.parse(x));

// ---------- Gói chia sẻ ----------

export function taoGoiChiaSe(muc: MucTomTat[], chiSo: { ten: string; giaTri: string }[], luc: Date, ten?: string): GoiChiaSe {
  return { v: 1, ...(ten?.trim() ? { ten: ten.trim().slice(0, TOI_DA_TEN) } : {}), luc: luc.toISOString(), muc, chiSo };
}

export function docGoiChiaSe(chu: string | null | undefined): GoiChiaSe | null {
  const o = giaiMa(chu) as Partial<GoiChiaSe> | null;
  if (!o || typeof o !== "object" || o.v !== 1 || !laNgay(o.luc) || !Array.isArray(o.muc) || !Array.isArray(o.chiSo)) return null;
  const muc = o.muc.slice(0, 10).map((k) => ({
    tieuDe: cat((k as MucTomTat)?.tieuDe, 80),
    dong: Array.isArray((k as MucTomTat)?.dong) ? (k as MucTomTat).dong.slice(0, 14).map((d) => cat(d, 320)).filter(Boolean) : [],
  })).filter((k) => k.tieuDe && k.dong.length);
  const chiSo = o.chiSo.slice(0, 6).map((c) => ({ ten: cat(c?.ten, 60), giaTri: cat(c?.giaTri, 30) })).filter((c) => c.ten);
  if (muc.length === 0) return null;
  const ten = cat(o.ten, TOI_DA_TEN).trim();
  return { v: 1, ...(ten ? { ten } : {}), luc: o.luc as string, muc, chiSo };
}

// ---------- Lời nhắn gửi lại cho em ----------

export function taoLoiNhan(tu: string, vai: VaiDongHanh, noiDung: string, luc: Date): Omit<LoiNhan, "id"> | null {
  const t = tu.trim().slice(0, TOI_DA_TEN), n = noiDung.trim().slice(0, TOI_DA_LOI_NHAN);
  if (!t || !n || !CAC_VAI.some((v) => v.gia === vai)) return null;
  return { tu: t, vai, noiDung: n, luc: luc.toISOString() };
}

/** Đọc lời nhắn từ đường dẫn. id là dấu vân tay của nội dung, để mở cùng một liên kết hai lần không lưu hai bản. */
export function docLoiNhan(chu: string | null | undefined): LoiNhan | null {
  const o = giaiMa(chu) as Partial<LoiNhan> | null;
  if (!o || typeof o !== "object" || !laNgay(o.luc) || !CAC_VAI.some((v) => v.gia === o.vai)) return null;
  const tu = cat(o.tu, TOI_DA_TEN).trim(), noiDung = cat(o.noiDung, TOI_DA_LOI_NHAN).trim();
  if (!tu || !noiDung) return null;
  return { id: vanTay(`${tu}|${o.vai}|${o.luc}|${noiDung}`), tu, vai: o.vai as VaiDongHanh, noiDung, luc: o.luc as string };
}

function vanTay(chu: string): string {
  let h = 5381;
  for (let i = 0; i < chu.length; i++) h = ((h * 33) ^ chu.charCodeAt(i)) >>> 0;
  return `ln-${h.toString(36)}`;
}

/** Đường dẫn đầy đủ để gửi đi (đang chạy trong trình duyệt). `duongDan` là phần sau dấu "#", ví dụ "/dong-hanh?d=...". */
export function lienKetDayDu(duongDan: string): string {
  return `${window.location.origin}${window.location.pathname}#${duongDan}`;
}
