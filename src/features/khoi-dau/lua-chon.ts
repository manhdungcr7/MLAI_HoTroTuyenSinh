// Danh sách lựa chọn cho các bước tạo hồ sơ. Giá trị lưu vào HoSo giữ nguyên như hồ sơ mẫu đang dùng.
import {
  Atom, BedDouble, BookOpen, Building2, Calculator, ChartColumn, CircleHelp, FlaskConical, GraduationCap, HeartPulse,
  House, Languages, Laptop, Leaf, Palette, School, Signpost, Target, Wrench, type LucideIcon,
} from "lucide-react";
import type { HoSo, MaToHop, MonId, NguonDiem, ToneTen } from "@/state/types";

export type LuaChonCoIcon<T> = { gia: T; nhan: string; phu?: string; icon?: LucideIcon };

/** 34 tỉnh, thành phố (sau sắp xếp đơn vị hành chính 2025). Thành phố trực thuộc trung ương xếp trước. */
export const THANH_PHO = ["Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế"];
export const TINH = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh",
  "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
];

export const NGANH: LuaChonCoIcon<string>[] = [
  { gia: "CNTT", nhan: "CNTT", icon: Laptop },
  { gia: "Kinh tế", nhan: "Kinh tế", icon: ChartColumn },
  { gia: "Y dược", nhan: "Y dược", icon: HeartPulse },
  { gia: "Thiết kế", nhan: "Thiết kế", icon: Palette },
  { gia: "Kỹ thuật", nhan: "Kỹ thuật", icon: Wrench },
  { gia: "Sư phạm", nhan: "Sư phạm", icon: School },
  { gia: "Ngôn ngữ", nhan: "Ngôn ngữ", icon: Languages },
];

export const MUC_TIEU_HIEN_TAI: LuaChonCoIcon<NonNullable<HoSo["mucTieuHienTai"]>>[] = [
  { gia: "chuaChonTruong", nhan: "Chưa biết chọn trường", icon: CircleHelp },
  { gia: "daCoMoUoc", nhan: "Đã có trường mơ ước", icon: Target },
  { gia: "soSanh", nhan: "Muốn so sánh vài trường", icon: ChartColumn },
];

export const GIAI_DOAN = ["Đang học lớp 11", "Đang học lớp 12", "Ôn thi THPT", "Đã tốt nghiệp THPT"];

export const NGUON_DIEM: LuaChonCoIcon<NguonDiem>[] = [
  { gia: "hocBa", nhan: "Học bạ" }, { gia: "thiThu", nhan: "Thi thử" },
  { gia: "danhGiaNangLuc", nhan: "Đánh giá năng lực" }, { gia: "tuDanhGia", nhan: "Tự đánh giá" },
];

export const ICON_MON: Record<MonId, LucideIcon> = {
  toan: Calculator, vatLy: Atom, hoaHoc: FlaskConical, nguVan: BookOpen, tiengAnh: Languages, sinh: Leaf,
};
export const TONE_MON: Record<MonId, ToneTen> = {
  toan: "xanh", vatLy: "tim", hoaHoc: "luc", nguVan: "do", tiengAnh: "xanh", sinh: "luc",
};
export const ICON_TO_HOP: Record<MaToHop, LucideIcon> = { A00: FlaskConical, A01: Atom, D01: BookOpen, B00: Leaf };
export const TONE_TO_HOP: Record<MaToHop, ToneTen> = { A00: "xanh", A01: "tim", D01: "luc", B00: "cam" };

export const DIEM_MANH = ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh", "Sáng tạo", "Giao tiếp", "Kiên trì"];
export const CAN_CAI_THIEN = ["Toán", "Vật lý", "Hóa học", "Ngữ văn", "Tiếng Anh", "Sinh học", "Diễn đạt", "Quản lý thời gian", "Tập trung"];
export const CACH_HOC = ["Học qua bài tập", "Học theo dự án", "Thảo luận nhóm", "Xem video"];

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

export const CON_DUONG: LuaChonCoIcon<NonNullable<HoSo["conDuong"]>>[] = [
  { gia: "daiHoc", nhan: "Đại học", icon: GraduationCap },
  { gia: "caoDang", nhan: "Cao đẳng", icon: School },
  { gia: "khac", nhan: "Khác", icon: Signpost },
];

export const TOI_DA_GHI_CHU = 200;
