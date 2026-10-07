// NGUỒN SỰ THẬT DUY NHẤT cho đường dẫn của CMS Nguyện Vọng AI.
// Năm mục chính: Tổng quan, Dữ liệu trường, Phê duyệt, Xuất bản, Hệ thống.

export const MAU = {
  tongQuan: "/",
  truong: "/truong",
  chiTietTruong: "/truong/:ma",
  duyet: "/duyet",
  xuatBan: "/xuat-ban",
  heThong: "/he-thong",
} as const;

export const DUONG_DAN = {
  tongQuan: () => "/",
  truong: (loc?: "thieu-hoc-phi" | "thieu-noi-luu-tru" | "chua-co-kenh" | "giao-cho-toi") => (loc ? `/truong?loc=${loc}` : "/truong"),
  chiTietTruong: (ma: string) => `/truong/${encodeURIComponent(ma)}`,
  duyet: (trangThai?: "cho" | "nhap" | "duyet") => (trangThai ? `/duyet?trang-thai=${trangThai}` : "/duyet"),
  xuatBan: () => "/xuat-ban",
  heThong: () => "/he-thong",
} as const;

/** `nhan` là tên đầy đủ (menu bên), `nhanNgan` vừa thanh dưới của điện thoại 360px. `chiQtv`: cộng tác viên không thấy. */
export const CAC_TAB = [
  { id: "tongQuan", nhan: "Tổng quan", nhanNgan: "Tổng quan", den: DUONG_DAN.tongQuan(), chiQtv: false, khop: (p: string) => p === "/" },
  { id: "truong", nhan: "Dữ liệu trường", nhanNgan: "Trường", den: DUONG_DAN.truong(), chiQtv: false, khop: (p: string) => p.startsWith("/truong") },
  { id: "duyet", nhan: "Phê duyệt", nhanNgan: "Phê duyệt", den: DUONG_DAN.duyet(), chiQtv: false, khop: (p: string) => p.startsWith("/duyet") },
  { id: "xuatBan", nhan: "Xuất bản", nhanNgan: "Xuất bản", den: DUONG_DAN.xuatBan(), chiQtv: true, khop: (p: string) => p.startsWith("/xuat-ban") },
  { id: "heThong", nhan: "Hệ thống", nhanNgan: "Hệ thống", den: DUONG_DAN.heThong(), chiQtv: true, khop: (p: string) => p.startsWith("/he-thong") },
] as const;
