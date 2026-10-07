// NGUỒN SỰ THẬT DUY NHẤT cho đường dẫn của CMS. Không viết tay chuỗi "/..." trong tinh-nang.
// Thêm trang mới: thêm mẫu vào MAU, hàm dựng vào DUONG_DAN, rồi đăng ký trong routes.tsx của slice.

export const MAU = {
  truong: "/",
  chiTietTruong: "/truong/:ma",
  duyet: "/duyet",
  tienDo: "/tien-do",
  toi: "/toi",
  nguoi: "/toi/nguoi",
  phanCong: "/toi/phan-cong",
  nhatKy: "/toi/nhat-ky",
} as const;

export const DUONG_DAN = {
  truong: () => "/",
  chiTietTruong: (ma: string) => `/truong/${encodeURIComponent(ma)}`,
  duyet: () => "/duyet",
  tienDo: () => "/tien-do",
  toi: () => "/toi",
  nguoi: () => "/toi/nguoi",
  phanCong: () => "/toi/phan-cong",
  nhatKy: () => "/toi/nhat-ky",
} as const;

export const CAC_TAB = [
  { id: "truong", nhan: "Trường", den: DUONG_DAN.truong(), khop: (p: string) => p === "/" || p.startsWith("/truong") },
  { id: "duyet", nhan: "Duyệt", den: DUONG_DAN.duyet(), khop: (p: string) => p.startsWith("/duyet") },
  { id: "tienDo", nhan: "Tiến độ", den: DUONG_DAN.tienDo(), khop: (p: string) => p.startsWith("/tien-do") },
  { id: "toi", nhan: "Tôi", den: DUONG_DAN.toi(), khop: (p: string) => p.startsWith("/toi") },
] as const;
