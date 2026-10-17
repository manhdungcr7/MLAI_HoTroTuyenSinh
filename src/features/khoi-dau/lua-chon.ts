// Danh sách lựa chọn cho các bước tạo hồ sơ. Giá trị lưu vào HoSo giữ nguyên như hồ sơ mẫu đang dùng.
import {
  Atom, BedDouble, BookOpen, Building2, Calculator, ChartColumn, CircleHelp, Clapperboard, Compass, Dumbbell, FlaskConical, Flame, Gavel, HardHat,
  HeartPulse, House, Landmark, Languages, Laptop, Leaf, MapPin, Megaphone, Minus, Palette, Plane, Ruler, School, Signpost, Stethoscope, Truck,
  Umbrella, Users, Wrench, type LucideIcon,
} from "lucide-react";
import type { HoSo, MaToHop, MonId, ToneTen } from "@/state/types";

export type LuaChonCoIcon<T> = { gia: T; nhan: string; phu?: string; icon?: LucideIcon };

/** 34 tỉnh, thành phố (theo đơn vị hành chính mới nhất). Thành phố trực thuộc trung ương xếp trước. */
export const THANH_PHO = ["Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế"];
export const TINH = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh",
  "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
];

export interface NhomNganhItem {
  nhom: string;
  danhSach: { gia: string; nhan: string }[];
}

export const PHAN_NHOM_NGANH: NhomNganhItem[] = [
  {
    nhom: "🌟 Công nghệ, Kỹ thuật & Khoa học",
    danhSach: [
      { gia: "CNTT", nhan: "Công nghệ thông tin / Khoa học máy tính" },
      { gia: "Kỹ thuật", nhan: "Kỹ thuật / Cơ khí / Điện - Điện tử / Tự động hóa" },
      { gia: "Xây dựng", nhan: "Xây dựng / Kiến trúc công trình / Giao thông" },
      { gia: "Khoa học tự nhiên", nhan: "Toán / Vật lý / Hóa học / Sinh học / Môi trường & Tài nguyên" },
      { gia: "Logistics", nhan: "Logistics / Vận tải / Quản lý chuỗi cung ứng" },
    ],
  },
  {
    nhom: "💼 Kinh tế, Quản trị & Dịch vụ",
    danhSach: [
      { gia: "Kinh tế", nhan: "Kinh tế / Quản trị kinh doanh / Thương mại" },
      { gia: "Tài chính", nhan: "Tài chính - Ngân hàng / Kế toán / Kiểm toán" },
      { gia: "Marketing", nhan: "Marketing / Thương mại điện tử / Truyền thông / PR" },
      { gia: "Du lịch", nhan: "Du lịch / Quản trị khách sạn & Nhà hàng" },
    ],
  },
  {
    nhom: "🩺 Y Dược & Chăm sóc sức khỏe",
    danhSach: [
      { gia: "Y Dược", nhan: "Y khoa / Dược học / Răng Hàm Mặt / Y học cổ truyền" },
      { gia: "Điều dưỡng", nhan: "Điều dưỡng / Kỹ thuật y học / Dinh dưỡng / Y tế công cộng" },
    ],
  },
  {
    nhom: "📚 Xã hội, Luật, Ngôn ngữ & Sư phạm",
    danhSach: [
      { gia: "Sư phạm", nhan: "Sư phạm / Giáo dục học / Quản lý giáo dục" },
      { gia: "Luật", nhan: "Luật / Luật kinh tế / Luật quốc tế" },
      { gia: "Ngôn ngữ", nhan: "Ngôn ngữ (Anh, Trung, Nhật, Hàn...) / Đông phương học" },
      { gia: "Báo chí", nhan: "Báo chí / Xuất bản / Truyền hình" },
      { gia: "Xã hội", nhan: "Tâm lý học / Xã hội học / Văn học / Lịch sử / Quan hệ quốc tế" },
    ],
  },
  {
    nhom: "🎨 Mỹ thuật, Thiết kế & Ứng dụng",
    danhSach: [
      { gia: "Thiết kế", nhan: "Thiết kế đồ họa, nội thất, thời trang / Âm nhạc / Điện ảnh" },
      { gia: "Kiến trúc", nhan: "Kiến trúc & Quy hoạch không gian đô thị" },
      { gia: "Nông Lâm", nhan: "Nông Lâm Ngư nghiệp / Công nghệ sinh học / Thú y / Thực phẩm" },
      { gia: "Thể thao", nhan: "Thể dục thể thao / Huấn luyện thể chất" },
    ],
  },
];

export const TAT_CA_NGANH = PHAN_NHOM_NGANH.flatMap((n) => n.danhSach);

export const NGANH: LuaChonCoIcon<string>[] = [
  { gia: "CNTT", nhan: "CNTT", icon: Laptop },
  { gia: "Kinh tế", nhan: "Kinh tế", icon: ChartColumn },
  { gia: "Y Dược", nhan: "Y Dược", icon: HeartPulse },
  { gia: "Thiết kế", nhan: "Thiết kế", icon: Palette },
  { gia: "Kỹ thuật", nhan: "Kỹ thuật", icon: Wrench },
  { gia: "Sư phạm", nhan: "Sư phạm", icon: School },
  { gia: "Ngôn ngữ", nhan: "Ngôn ngữ", icon: Languages },
  { gia: "Luật", nhan: "Luật", icon: Signpost },
];

export const ICON_MON: Record<MonId, LucideIcon> = {
  toan: Calculator, vatLy: Atom, hoaHoc: FlaskConical, nguVan: BookOpen, tiengAnh: Languages, sinh: Leaf,
};
export const TONE_MON: Record<MonId, ToneTen> = {
  toan: "xanh", vatLy: "tim", hoaHoc: "luc", nguVan: "cam", tiengAnh: "xanh", sinh: "luc",
};
export const ICON_TO_HOP: Record<MaToHop, LucideIcon> = { A00: FlaskConical, A01: Atom, D01: BookOpen, B00: Leaf };
export const TONE_TO_HOP: Record<MaToHop, ToneTen> = { A00: "xanh", A01: "tim", D01: "luc", B00: "cam" };

export const DIEM_MANH = ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh", "Sáng tạo", "Giao tiếp", "Kiên trì"];
export const CAN_CAI_THIEN = ["Toán", "Vật lý", "Hóa học", "Ngữ văn", "Tiếng Anh", "Sinh học", "Diễn đạt", "Quản lý thời gian", "Tập trung"];

export const NGAN_SACH: LuaChonCoIcon<NonNullable<HoSo["nganSach"]>>[] = [
  { gia: "duoi30", nhan: "Dưới 30 triệu" }, { gia: "30-60", nhan: "30 – 60 triệu" },
  { gia: "60-100", nhan: "60 – 100 triệu" }, { gia: "tren100", nhan: "Trên 100 triệu" },
];

export const CHO_O: LuaChonCoIcon<NonNullable<HoSo["choO"]>>[] = [
  { gia: "oNha", nhan: "Ở nhà", icon: House },
  { gia: "oTro", nhan: "Ở trọ", icon: Building2 },
  { gia: "kyTucXa", nhan: "Ký túc xá", icon: BedDouble },
];

/** Khu vực trùng cách ghi của dữ liệu trường (TP.HCM, Hà Nội, Đà Nẵng) để Khám phá lọc được. */
export const KHU_VUC = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Tỉnh khác"];

export const HOC_XA_NHA: LuaChonCoIcon<boolean>[] = [{ gia: true, nhan: "Có" }, { gia: false, nhan: "Không" }];

export const VIEC_LAM: LuaChonCoIcon<NonNullable<HoSo["quanTamViecLam"]>>[] = [
  { gia: "rat", nhan: "Rất quan tâm" }, { gia: "binhThuong", nhan: "Bình thường" }, { gia: "chuaRo", nhan: "Chưa rõ" },
];


/** Biểu tượng và tông cho thẻ nhóm ngành ở Bước 1 (khóa trùng `gia` của TAT_CA_NGANH). */
export const ICON_NGANH: Record<string, { icon: LucideIcon; tone: ToneTen }> = {
  CNTT: { icon: Laptop, tone: "xanh" }, "Kỹ thuật": { icon: Wrench, tone: "xanh" }, "Xây dựng": { icon: HardHat, tone: "cam" },
  "Khoa học tự nhiên": { icon: FlaskConical, tone: "tim" }, Logistics: { icon: Truck, tone: "luc" },
  "Kinh tế": { icon: ChartColumn, tone: "cam" }, "Tài chính": { icon: Landmark, tone: "luc" }, Marketing: { icon: Megaphone, tone: "do" },
  "Du lịch": { icon: Umbrella, tone: "xanh" }, "Y Dược": { icon: Stethoscope, tone: "do" }, "Điều dưỡng": { icon: HeartPulse, tone: "luc" },
  "Sư phạm": { icon: School, tone: "tim" }, "Luật": { icon: Gavel, tone: "cam" }, "Ngôn ngữ": { icon: Languages, tone: "xanh" },
  "Báo chí": { icon: Clapperboard, tone: "do" }, "Xã hội": { icon: Users, tone: "tim" }, "Thiết kế": { icon: Palette, tone: "tim" },
  "Kiến trúc": { icon: Ruler, tone: "cam" }, "Nông Lâm": { icon: Leaf, tone: "luc" }, "Thể thao": { icon: Dumbbell, tone: "xanh" },
};

/** Biểu tượng cho các chip ở Bước 3 (giá trị lưu vào HoSo giữ nguyên). */
export const KHU_VUC_CO_ICON: LuaChonCoIcon<string>[] = KHU_VUC.map((x) => ({ gia: x, nhan: x, icon: x === "Tỉnh khác" ? Compass : MapPin }));
export const HOC_XA_NHA_CO_ICON: LuaChonCoIcon<boolean>[] = [{ gia: true, nhan: "Có", icon: Plane }, { gia: false, nhan: "Không", icon: House }];
export const VIEC_LAM_CO_ICON: LuaChonCoIcon<NonNullable<HoSo["quanTamViecLam"]>>[] = [
  { gia: "rat", nhan: "Rất quan tâm", icon: Flame }, { gia: "binhThuong", nhan: "Bình thường", icon: Minus }, { gia: "chuaRo", nhan: "Chưa rõ", icon: CircleHelp },
];
