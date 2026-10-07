// So sánh nội dung hai bản của cùng một mục để người duyệt thấy đúng chỗ đổi. Thuần TypeScript.
import type { BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { NHAN_DON_VI, soViet } from "./dinh-dang";

const NHAN_O: Record<string, string> = {
  nam: "Năm học", donVi: "Đơn vị", mucThap: "Mức thấp", mucCao: "Mức cao", phamVi: "Áp dụng cho", loTrinhTang: "Lộ trình tăng", ghiChu: "Ghi chú",
  ten: "Tên", tenHocBong: "Tên học bổng", giaTri: "Giá trị", dieuKien: "Điều kiện", hanNop: "Hạn nộp",
  coKyTucXa: "Ký túc xá", giaKyTucThang: "Giá KTX (nghìn/tháng)", khuTroXungQuanh: "Khu trọ", giaTroThang: "Giá trọ (nghìn/tháng)", khoangCachKm: "Cách trường (km)",
  tieuDe: "Tiêu đề", noiDung: "Nội dung", nguoiVietLa: "Người viết là",
  websiteTuyenSinhUrl: "Website tuyển sinh", fanpageUrl: "Fanpage", nhomTuyenSinhChinhThucUrl: "Nhóm tuyển sinh", nhomCongDongUrl: "Nhóm sinh viên",
};
const BO_QUA = new Set(["id", "maTruong", "websiteTuyenSinh", "tenHocBong"]);

const GIA_TRI: Record<string, Record<string, string>> = {
  coKyTucXa: { co: "Có", khong: "Không có", chua_ro: "Chưa rõ" },
  khuTroXungQuanh: { nhieu: "Nhiều", it: "Ít", khong: "Không có", chua_ro: "Chưa rõ" },
  nguoiVietLa: { sinh_vien: "Sinh viên", cuu_sinh_vien: "Cựu sinh viên", phu_huynh: "Phụ huynh" },
  donVi: NHAN_DON_VI,
};

export function hienGiaTri(khoa: string, v: unknown): string {
  if (v === undefined || v === null || v === "") return "(trống)";
  if (typeof v === "string") return GIA_TRI[khoa]?.[v] ?? v;
  if (typeof v === "number") return khoa === "nam" ? String(v) : soViet(v);
  if (Array.isArray(v)) return v.map((x) => (typeof x === "number" ? soViet(x) : String(x))).join(" - ");
  return JSON.stringify(v);
}

export interface DongKhac { khoa: string; nhan: string; cu: string; moi: string }

/** Các ô khác nhau giữa `cu` và `moi`. `cu` rỗng nghĩa là mục mới hoàn toàn: trả mọi ô của `moi` với cột cũ là "(trống)". */
export function soSanhBan(cu: BanGhiCms | null, moi: BanGhiCms): DongKhac[] {
  const a = ((cu?.data ?? {}) as Record<string, unknown>);
  const b = ((moi.data ?? {}) as Record<string, unknown>);
  const khoa = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !BO_QUA.has(k));
  const ra: DongKhac[] = [];
  for (const k of khoa) {
    if (JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null)) continue;
    ra.push({ khoa: k, nhan: NHAN_O[k] ?? k, cu: hienGiaTri(k, a[k]), moi: hienGiaTri(k, b[k]) });
  }
  if (cu && cu.source.url !== moi.source.url) ra.push({ khoa: "source", nhan: "Link nguồn", cu: cu.source.url, moi: moi.source.url });
  return ra;
}
