// NGUỒN SỰ THẬT DUY NHẤT cho đường dẫn. Mọi link, nút, điều hướng trong app PHẢI dùng DUONG_DAN.
// Không viết tay chuỗi "/..." trong src/features hay src/components (tests/kiem-tra-route.ts sẽ báo lỗi).
// Thêm trang mới: thêm mẫu vào MAU, hàm dựng vào DUONG_DAN, rồi đăng ký trong routes.tsx của slice.

/** Mẫu đường dẫn dùng khi khai báo route. */
export const MAU = {
  chao: "/chao",
  batDau: "/bat-dau/:buoc",
  homNay: "/",
  hoSo: "/ho-so",
  hoSoCaiDat: "/ho-so/cai-dat",
  khamPha: "/kham-pha",
  boLoc: "/kham-pha/bo-loc",
  chiTiet: "/kham-pha/:id",
  soSanh: "/so-sanh",
  nguyenVong: "/nguyen-vong",
  nguyenVongAnToan: "/nguyen-vong/an-toan",
  thuTinhHuong: "/thu-tinh-huong",
  thuTinhHuongKetQua: "/thu-tinh-huong/ket-qua",
  diemThiThu: "/diem-thi-thu",
  diemThiThuKetQua: "/diem-thi-thu/ket-qua",
  keHoach: "/ke-hoach",
  mucTieu: "/ke-hoach/muc-tieu",
  monKeoDiem: "/ke-hoach/muc-tieu/mon-keo-diem",
  tuan: "/ke-hoach/tuan",
  viec: "/ke-hoach/viec/:id",
  tienDo: "/ke-hoach/tien-do",
  caiDatLichHoc: "/ke-hoach/cai-dat/lich-hoc",
  caiDatTuHoc: "/ke-hoach/cai-dat/tu-hoc",
  nhacNho: "/ke-hoach/cai-dat/nhac-nho",
  thietKe: "/thiet-ke",
  tuVan: "/tu-van",
} as const;

export type BuocBatDau = 1 | 2 | 3;

/** Hàm dựng đường dẫn thật. */
export const DUONG_DAN = {
  chao: () => "/chao",
  batDau: (buoc: BuocBatDau = 1) => `/bat-dau/${buoc}`,
  homNay: () => "/",
  hoSo: () => "/ho-so",
  hoSoCaiDat: () => "/ho-so/cai-dat",
  khamPha: () => "/kham-pha",
  boLoc: () => "/kham-pha/bo-loc",
  chiTiet: (id: string) => `/kham-pha/${id}`,
  /** So sánh 2 lựa chọn; bỏ trống thì dùng cặp em đã chọn gần nhất. */
  soSanh: (a?: string, b?: string) => (a && b ? `/so-sanh?a=${a}&b=${b}` : "/so-sanh"),
  nguyenVong: () => "/nguyen-vong",
  nguyenVongAnToan: () => "/nguyen-vong/an-toan",
  thuTinhHuong: () => "/thu-tinh-huong",
  thuTinhHuongKetQua: () => "/thu-tinh-huong/ket-qua",
  diemThiThu: () => "/diem-thi-thu",
  diemThiThuKetQua: () => "/diem-thi-thu/ket-qua",
  /** Gốc của tab Kế hoạch: tự chuyển tới Kế hoạch tuần (có mục tiêu) hoặc Mục tiêu (chưa có). */
  keHoach: () => "/ke-hoach",
  mucTieu: () => "/ke-hoach/muc-tieu",
  monKeoDiem: () => "/ke-hoach/muc-tieu/mon-keo-diem",
  /** Kế hoạch tuần. xem = "lich" mở thẳng chế độ Lịch, mặc định là danh sách việc. */
  tuan: (xem?: "lich" | "viec") => (xem === "lich" ? "/ke-hoach/tuan?xem=lich" : "/ke-hoach/tuan"),
  viec: (id: string) => `/ke-hoach/viec/${id}`,
  tienDo: () => "/ke-hoach/tien-do",
  caiDatLichHoc: () => "/ke-hoach/cai-dat/lich-hoc",
  caiDatTuHoc: () => "/ke-hoach/cai-dat/tu-hoc",
  nhacNho: () => "/ke-hoach/cai-dat/nhac-nho",
  thietKe: () => "/thiet-ke",
  tuVan: () => "/tu-van",
} as const;

/** 5 tab ở thanh dưới. Thứ tự và tên cố định cho cả ứng dụng. */
export const CAC_TAB = [
  { id: "homNay", nhan: "Hôm nay", den: DUONG_DAN.homNay(), khop: (p: string) => p === "/" },
  { id: "khamPha", nhan: "Khám phá", den: DUONG_DAN.khamPha(), khop: (p: string) => p.startsWith("/kham-pha") || p.startsWith("/so-sanh") },
  { id: "nguyenVong", nhan: "Nguyện vọng", den: DUONG_DAN.nguyenVong(), khop: (p: string) => p.startsWith("/nguyen-vong") || p.startsWith("/thu-tinh-huong") || p.startsWith("/diem-thi-thu") },
  { id: "keHoach", nhan: "Kế hoạch", den: DUONG_DAN.keHoach(), khop: (p: string) => p.startsWith("/ke-hoach") },
  { id: "hoSo", nhan: "Hồ sơ", den: DUONG_DAN.hoSo(), khop: (p: string) => p.startsWith("/ho-so") },
] as const;

/** 3 mục chuyển nhanh ở đầu mọi trang thuộc tab Kế hoạch (trừ trang cài đặt và chi tiết việc). */
export const CAC_MUC_KE_HOACH = [
  { id: "mucTieu", nhan: "Mục tiêu", den: DUONG_DAN.mucTieu(), khop: (p: string) => p.startsWith("/ke-hoach/muc-tieu") },
  { id: "tuan", nhan: "Kế hoạch tuần", den: DUONG_DAN.tuan(), khop: (p: string) => p.startsWith("/ke-hoach/tuan") },
  { id: "tienDo", nhan: "Tiến độ", den: DUONG_DAN.tienDo(), khop: (p: string) => p.startsWith("/ke-hoach/tien-do") },
] as const;
