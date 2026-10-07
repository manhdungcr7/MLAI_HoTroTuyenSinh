// Định dạng bản ghi thông tin để hiển thị: học phí, nơi lưu trú, trạng thái. Thuần TypeScript.
import { NHAN_LOAI, type LoaiThongTin, type ThongTinLoai, type ThongTinTruong, type TrangThaiBai } from "@/data/dong-gop-kiem-tra";

/** Số kiểu Việt: dấu phẩy thập phân, dấu chấm hàng nghìn (1.234,5). */
export function soViet(n: number): string {
  const lam = Math.round(n * 100) / 100;
  const [nguyen, le] = String(lam).split(".");
  const nghin = nguyen.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return le ? `${nghin},${le}` : nghin;
}

export const NHAN_DON_VI = { trieu_nam: "triệu/năm", trieu_tin_chi: "triệu/tín chỉ" } as const;

/** "28 - 35 triệu/năm" hoặc "30 triệu/năm" khi hai mức bằng nhau. */
export function dinhDangHocPhi(d: ThongTinLoai<"hoc_phi">["duLieu"]): string {
  const khoang = d.mucThap === d.mucCao ? soViet(d.mucThap) : `${soViet(d.mucThap)} - ${soViet(d.mucCao)}`;
  return `${khoang} ${NHAN_DON_VI[d.donVi]}`;
}

/** "2025 - 2026" từ năm học bắt đầu. */
export const dinhDangNamHoc = (nam: number | undefined): string => (nam === undefined ? "Chưa ghi năm" : `${nam} - ${nam + 1}`);

const NHAN_KTX = { co: "Có ký túc xá", khong: "Không có ký túc xá", chua_ro: "Chưa rõ về ký túc xá" } as const;
const NHAN_TRO = { nhieu: "Nhiều khu trọ xung quanh", it: "Ít khu trọ xung quanh", khong: "Không có khu trọ gần", chua_ro: "Chưa rõ về khu trọ" } as const;
export const NHAN_CHON_KTX = NHAN_KTX;
export const NHAN_CHON_TRO = NHAN_TRO;

/** Giá nghìn đồng/tháng thành chữ gọn: "600 - 900 nghìn/tháng", hoặc "1,2 - 2 triệu/tháng" khi từ 1 triệu trở lên. */
export function dinhDangGiaThang(k: readonly [number, number]): string {
  const [a, b] = k;
  const trieu = (x: number) => soViet(x / 1000);
  if (a >= 1000 && b >= 1000) return `${a === b ? trieu(a) : `${trieu(a)} - ${trieu(b)}`} triệu/tháng`;
  return `${a === b ? soViet(a) : `${soViet(a)} - ${soViet(b)}`} nghìn/tháng`;
}

/** Các dòng mô tả nơi lưu trú, mỗi dòng một ý. */
export function dongNoiLuuTru(d: ThongTinLoai<"noi_luu_tru">["duLieu"]): string[] {
  const ra: string[] = [];
  ra.push(NHAN_KTX[d.coKyTucXa] + (d.giaKyTucThang ? `, ${dinhDangGiaThang(d.giaKyTucThang)}` : ""));
  ra.push(NHAN_TRO[d.khuTroXungQuanh] + (d.giaTroThang ? `, ${dinhDangGiaThang(d.giaTroThang)}` : ""));
  if (d.khoangCachKm !== undefined) ra.push(`Cách trường khoảng ${soViet(d.khoangCachKm)} km`);
  if (d.ghiChu) ra.push(d.ghiChu);
  return ra;
}

export const NHAN_TRANG_THAI: Record<TrangThaiBai, string> = { nhap: "Nháp", cho: "Chờ duyệt", duyet: "Đã duyệt", an: "Đã ẩn" };
export const TONE_TRANG_THAI = { nhap: "muc", cho: "cam", duyet: "luc", an: "do" } as const;

/** Tiêu đề ngắn của một bản ghi, dùng ở thẻ. */
export function tieuDeBanGhi(t: ThongTinTruong): string {
  switch (t.loai) {
    case "hoc_phi": return `Học phí ${dinhDangNamHoc(t.nam)}: ${t.duLieu.phamVi}`;
    case "hoc_bong": return t.duLieu.ten;
    case "noi_luu_tru": return "Nơi lưu trú";
    case "review": return t.duLieu.tieuDe;
    case "luu_y": case "khac": return t.duLieu.tieuDe;
  }
}

/** Các dòng nội dung của một bản ghi (đã định dạng) để hiện trong thẻ duyệt. */
export function dongNoiDung(t: ThongTinTruong): string[] {
  switch (t.loai) {
    case "hoc_phi": {
      const d = t.duLieu;
      return [dinhDangHocPhi(d), ...(d.loTrinhTang ? [`Lộ trình tăng: ${d.loTrinhTang}`] : []), ...(d.ghiChu ? [d.ghiChu] : [])];
    }
    case "hoc_bong": {
      const d = t.duLieu;
      return [`Giá trị: ${d.giaTri}`, `Điều kiện: ${d.dieuKien}`, ...(d.hanNop ? [`Hạn nộp: ${d.hanNop}`] : [])];
    }
    case "noi_luu_tru": return dongNoiLuuTru(t.duLieu);
    case "review": {
      const nguoi = { sinh_vien: "Sinh viên", cuu_sinh_vien: "Cựu sinh viên", phu_huynh: "Phụ huynh" } as const;
      return [t.duLieu.noiDung, ...(t.duLieu.nguoiVietLa ? [`Người viết: ${nguoi[t.duLieu.nguoiVietLa]}`] : [])];
    }
    case "luu_y": case "khac": return [t.duLieu.noiDung];
  }
}

export const nhanLoai = (l: LoaiThongTin): string => NHAN_LOAI[l];

/** Nhãn mục tiến độ: "kenh" là Kênh chính thức, còn lại theo loại thông tin. */
export const nhanMuc = (m: "kenh" | LoaiThongTin): string => (m === "kenh" ? "Kênh chính thức" : NHAN_LOAI[m]);

/** Học phí theo năm: năm mới nhất lên đầu, cùng năm thì theo phạm vi. Bỏ bản ghi đã ẩn nếu `boAn`. */
export function hocPhiGiamDanTheoNam(ds: readonly ThongTinTruong[], boAn = false): ThongTinLoai<"hoc_phi">[] {
  return ds
    .filter((x): x is ThongTinLoai<"hoc_phi"> => x.loai === "hoc_phi" && !(boAn && x.trangThai === "an"))
    .sort((a, b) => (b.nam ?? 0) - (a.nam ?? 0) || a.duLieu.phamVi.localeCompare(b.duLieu.phamVi, "vi"));
}

/** Thời điểm kiểu "07/10/2026 14:30" theo giờ máy. */
export function dinhDangLuc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${hai(d.getDate())}/${hai(d.getMonth() + 1)}/${d.getFullYear()} ${hai(d.getHours())}:${hai(d.getMinutes())}`;
}
