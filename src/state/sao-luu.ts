// Xuất và khôi phục dữ liệu của em (một tệp JSON). Dữ liệu chỉ nằm trên máy em, nên đây là cách duy nhất để chuyển sang máy khác hoặc giữ bản dự phòng.
import { chuanHoa } from "./chuan-hoa";
import type { AppState } from "./store";

const NHAN = "nguyen-vong-ai";
const PHIEN_BAN = 2;
const laObj = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v);

export function taoBanSaoLuu(s: AppState, luc = new Date()): string {
  return JSON.stringify({ app: NHAN, phienBan: PHIEN_BAN, luc: luc.toISOString(), duLieu: s }, null, 2);
}

export type KetQuaDoc = { ok: true; s: AppState } | { ok: false; lyDo: string };

/** Đọc tệp sao lưu. Chỉ nhận tệp do chính app tạo ra; trường thiếu được điền giá trị mặc định để bản cũ vẫn dùng được. */
export function docBanSaoLuu(text: string): KetQuaDoc {
  let j: unknown;
  try { j = JSON.parse(text); } catch { return { ok: false, lyDo: "Tệp này không đọc được. Bạn chọn đúng tệp sao lưu của Nguyện Vọng AI nhé." }; }
  const o = j as { app?: unknown; phienBan?: unknown; duLieu?: Partial<AppState> } | null;
  if (!o || o.app !== NHAN || typeof o.duLieu !== "object" || o.duLieu === null) return { ok: false, lyDo: "Đây không phải tệp sao lưu của Nguyện Vọng AI." };
  if (typeof o.phienBan !== "number" || o.phienBan > PHIEN_BAN) return { ok: false, lyDo: "Tệp sao lưu này tạo bởi phiên bản mới hơn, bạn cập nhật ứng dụng rồi thử lại." };
  const d = o.duLieu;
  const dangMang = (k: keyof AppState) => d[k] === undefined || Array.isArray(d[k]);
  if (!(["nguyenVong", "yeuThich", "soSanh", "diemThi", "tinhHuong", "coDinh", "viec", "khoiHoc", "lichSu", "loiNhan"] as const).every(dangMang) || typeof d.hoSo !== "object" || d.hoSo === null)
    return { ok: false, lyDo: "Tệp sao lưu bị hỏng hoặc thiếu dữ liệu." };
  const st = (d.hoSo as { soThich?: { diem?: Record<string, unknown>; top?: unknown } | null }).soThich;
  if (st && (typeof st.diem !== "object" || st.diem === null || !["R", "I", "A", "S", "E", "C"].every((k) => typeof st.diem![k] === "number") || !Array.isArray(st.top)))
    return { ok: false, lyDo: "Kết quả trắc nghiệm trong tệp sao lưu bị hỏng." };
  const dungKieu = (k: "cauHinh" | "nhacNho" | "trangThaiViec") => d[k] === undefined || laObj(d[k]);
  if (!dungKieu("cauHinh") || !dungKieu("nhacNho") || !dungKieu("trangThaiViec") || (d.hoSo as { diem?: unknown }).diem !== undefined && !laObj((d.hoSo as { diem?: unknown }).diem))
    return { ok: false, lyDo: "Tệp sao lưu bị hỏng: phần cài đặt hoặc điểm số sai dạng." };
  const s = chuanHoa(d); // gộp sâu với mặc định, loại giá trị sai kiểu/NaN, cắt độ dài
  if (d.mucTieu !== undefined && d.mucTieu !== null && s.mucTieu === null) return { ok: false, lyDo: "Mục tiêu trong tệp sao lưu bị hỏng (ngày thi hoặc điểm không hợp lệ)." };
  return { ok: true, s };
}
