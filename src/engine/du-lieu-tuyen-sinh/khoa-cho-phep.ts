// Bộ lọc `data` của bản ghi CMS trước khi lên snapshot công khai: chỉ các khóa dữ liệu tuyển sinh đã biết được đi qua,
// và các ô chữ tự do không được chứa số điện thoại hay email. TypeScript thuần, dùng được ở Function lẫn trình duyệt.
import { coThongTinCaNhan } from "../../data/dong-gop-kiem-tra";

const CHUNG = ["id", "maTruong", "nam", "linkNguon"];
/** Khóa được phép theo loại thực thể (gồm khóa biểu mẫu CMS và khóa ứng dụng học sinh đọc). */
export const KHOA_CHO_PHEP: Record<string, readonly string[]> = {
  school: [...CHUNG, "tenTruong", "websiteChinhThuc", "websiteTuyenSinh", "websiteTuyenSinhUrl", "fanpageUrl", "nhomZaloUrl", "nhomFacebookUrl", "nhomTuyenSinhChinhThucUrl", "nhomCongDongUrl", "diaChi", "kyTucXa", "ghiChu"],
  tuition: [...CHUNG, "maNganh", "tenNganh", "donVi", "mucThap", "mucCao", "phamVi", "loTrinhTang", "ghiChu"],
  scholarship: [...CHUNG, "ten", "tenHocBong", "giaTri", "dieuKien", "hanNop"],
  admission: [...CHUNG, "maNganh", "tenNganh", "phuongThuc", "chiTieu", "toHop", "dieuKienNhanHoSo"],
  announcement: [...CHUNG, "tieuDe", "tomTat", "linkChiTiet", "mucDo", "ngayHetHan"],
  cutoff_score: [...CHUNG, "tenNganh", "maNganh", "phuongThuc", "toHop", "diemChuan", "tieuChiPhu"],
  noi_luu_tru: [...CHUNG, "coKyTucXa", "giaKyTucThang", "khuTroXungQuanh", "giaTroThang", "khoangCachKm", "ghiChu"],
  review: [...CHUNG, "tieuDe", "noiDung", "nguoiVietLa"],
  luu_y: [...CHUNG, "tieuDe", "noiDung"],
};

/** Các ô chữ tự do: nơi người nhập hay dán số điện thoại hoặc email. */
const O_CHU_TU_DO = ["ghiChu", "noiDung", "tieuDe", "tomTat", "dieuKien", "giaTri", "phamVi", "loTrinhTang", "nguoiVietLa", "diaChi", "dieuKienNhanHoSo", "tieuChiPhu", "ten", "tenHocBong", "tenNganh"];

const chuTrong = (v: unknown): string[] => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v as Record<string, unknown>).flatMap(chuTrong) : []);

/** Khóa nằm ngoài danh sách cho phép của loại thực thể; loại chưa biết thì không lọc (trả rỗng). */
export function khoaLa(entityType: string, data: Record<string, unknown>): string[] {
  const cho = KHOA_CHO_PHEP[entityType];
  return cho ? Object.keys(data).filter((k) => !cho.includes(k)) : [];
}

/** Tên ô chữ chứa số điện thoại hoặc email, hoặc null. Với `school`, kiểm cả ô lồng nhau (kyTucXa.ghiChu). */
export function oChuCoThongTinCaNhan(data: Record<string, unknown>): string | null {
  for (const k of [...O_CHU_TU_DO, "kyTucXa"]) if (chuTrong(data[k]).some(coThongTinCaNhan)) return k;
  return null;
}

/** Giữ khóa được phép và bỏ ô chữ có thông tin cá nhân. Dùng khi dựng snapshot (phòng dữ liệu cũ đã lưu trước khi có bộ kiểm). */
export function locChoSnapshotCongKhai(entityType: string, data: Record<string, unknown>): Record<string, unknown> {
  const cho = KHOA_CHO_PHEP[entityType];
  const ra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (cho && !cho.includes(k)) continue;
    if ((O_CHU_TU_DO.includes(k) || k === "kyTucXa") && chuTrong(v).some(coThongTinCaNhan)) continue;
    ra[k] = v;
  }
  return ra;
}
