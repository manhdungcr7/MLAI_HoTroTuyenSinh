// Bản nháp CMS lưu trong trình duyệt (localStorage) để không mất nội dung đang nhập khi tải lại, đóng tab hay mất mạng.
// Chỉ lưu nội dung biểu mẫu, không lưu mật khẩu hay token. Mỗi bản nháp ghi kèm email người nhập:
// email khác với người đang đăng nhập thì coi như không có, nên nháp của người khác không hiện ra.
// Mọi thao tác với localStorage đều bọc try/catch vì trình duyệt có thể chặn hoặc đầy bộ nhớ.

export const TIEN_TO_NHAP = "cms:nhap:";
/** Giới hạn độ dài chuỗi lưu (ký tự). Vượt thì không lưu, form vẫn dùng bình thường. */
export const GIOI_HAN_NHAP = 64 * 1024;
const PHIEN_BAN = 1;

export interface BanNhap<T> { du: T; luuLuc: number }
export type LaHopLe<T> = (v: unknown) => v is T;

/** Khóa đầy đủ: `cms:nhap:<loaiForm>:<id>`. `id` nên chứa mã trường để nháp các trường không lẫn nhau. */
export function khoaNhap(loaiForm: string, id: string): string {
  return `${TIEN_TO_NHAP}${loaiForm}:${id}`;
}

/** Ghi bản nháp. Trả về false nếu không ghi được (bị chặn, đầy, quá lớn hoặc chưa rõ người nhập). */
export function ghiBanNhap(khoa: string, email: string, du: unknown, bayGio: number = Date.now()): boolean {
  if (!email) return false;
  try {
    const chuoi = JSON.stringify({ v: PHIEN_BAN, email, luuLuc: bayGio, du });
    if (chuoi.length > GIOI_HAN_NHAP) return false;
    localStorage.setItem(khoa, chuoi);
    return true;
  } catch {
    return false;
  }
}

/** Đọc bản nháp của đúng người này. Sai hình dạng, khác phiên bản hoặc khác email thì trả về null. */
export function docBanNhap<T>(khoa: string, email: string, laHopLe: LaHopLe<T>): BanNhap<T> | null {
  if (!email) return null;
  try {
    const chuoi = localStorage.getItem(khoa);
    if (!chuoi || chuoi.length > GIOI_HAN_NHAP * 2) return null;
    const o: unknown = JSON.parse(chuoi);
    if (typeof o !== "object" || o === null) return null;
    const r = o as Record<string, unknown>;
    if (r.v !== PHIEN_BAN || r.email !== email) return null;
    if (typeof r.luuLuc !== "number" || !Number.isFinite(r.luuLuc)) return null;
    if (!laHopLe(r.du)) return null;
    return { du: r.du, luuLuc: r.luuLuc };
  } catch {
    return null;
  }
}

/** Xóa bản nháp (sau khi lưu/gửi thành công, hoặc khi người dùng bấm Bỏ). */
export function xoaBanNhap(khoa: string): void {
  try {
    localStorage.removeItem(khoa);
  } catch {
    /* trình duyệt chặn: không có gì để xóa */
  }
}

/** Giờ:phút theo giờ máy người dùng, ví dụ "09:05". */
export function gioPhut(luuLuc: number): string {
  const d = new Date(luuLuc);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Hàm kiểm hình dạng cho biểu mẫu mà mọi trường là chuỗi, theo danh sách khóa. */
export function laDoiTuongChuoi<T extends object>(cacKhoa: readonly string[]): LaHopLe<T> {
  return (v): v is T => {
    if (typeof v !== "object" || v === null) return false;
    const r = v as Record<string, unknown>;
    return cacKhoa.every((k) => typeof r[k] === "string");
  };
}
