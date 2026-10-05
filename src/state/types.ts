// Kiểu dữ liệu dùng chung. Đổi file này phải báo cả nhóm (chỉ người giữ nền được sửa).

export type ToneTen = "xanh" | "luc" | "cam" | "tim" | "do" | "muc";

export type MonId = "toan" | "vatLy" | "hoaHoc" | "sinh" | "nguVan" | "tiengAnh";
export const CAC_MON: MonId[] = ["toan", "vatLy", "hoaHoc", "nguVan", "tiengAnh", "sinh"];
export const TEN_MON: Record<MonId, string> = {
  toan: "Toán", vatLy: "Vật lý", hoaHoc: "Hóa học", sinh: "Sinh học", nguVan: "Ngữ văn", tiengAnh: "Tiếng Anh",
};
export const TEN_MON_NGAN: Record<MonId, string> = {
  toan: "Toán", vatLy: "Lý", hoaHoc: "Hóa", sinh: "Sinh", nguVan: "Văn", tiengAnh: "Anh",
};

export type MaToHop = "A00" | "A01" | "D01" | "B00";
export const TO_HOP: Record<MaToHop, MonId[]> = {
  A00: ["toan", "vatLy", "hoaHoc"],
  A01: ["toan", "vatLy", "tiengAnh"],
  D01: ["toan", "nguVan", "tiengAnh"],
  B00: ["toan", "hoaHoc", "sinh"],
};

export type NguonDiem = "hocBa" | "thiThu" | "danhGiaNangLuc" | "tuDanhGia";

export interface HoSo {
  hoTen: string;
  khoi: 11 | 12 | null;
  tinh: string;
  giaiDoan: string;
  nganhQuanTam: string[]; // chọn 1 hoặc nhiều
  mucTieuHienTai: "chuaChonTruong" | "daCoMoUoc" | "soSanh" | null;
  nguonDiem: NguonDiem;
  diem: Record<MonId, number | null>;
  diemManh: string[];
  canCaiThien: string[];
  cachHoc: string[];
  nganSach: "duoi30" | "30-60" | "60-100" | "tren100" | null; // triệu đồng / năm
  choO: "oNha" | "oTro" | "kyTucXa" | null;
  khuVuc: string[];
  ghiChuChiPhi: string;
  hocXaNha: boolean | null;
  quanTamViecLam: "rat" | "binhThuong" | "chuaRo" | null;
  conDuong: "daiHoc" | "caoDang" | "khac" | null;
  hoanTat: boolean;
}

export type BacHoc = "Đại học" | "Cao đẳng";
export type MucPhuHop = "Phù hợp" | "Có thể thử sức" | "Cần cân nhắc";
export type NhanNguyenVong = "Thử sức" | "Vừa sức" | "An toàn" | "Dự phòng";

export interface LuaChon {
  id: string;
  truong: string; // tên ngắn: UIT
  tenTruong: string; // tên đầy đủ
  nganh: string;
  nhomNganh: string; // dùng cho chip ngành ở Khám phá
  moTa: string;
  bac: BacHoc;
  khuVuc: string; // TP.HCM
  diaChi: string;
  hocPhiMin: number; // triệu đồng / năm
  hocPhiMax: number;
  diemMin: number; // điểm tham khảo năm trước (thang 30)
  diemMax: number;
  namDiem: number;
  coHoiViecLam: "Cao" | "Rất cao" | "Khá";
  moiTruongHoc: string; // ví dụ "Năng động, thiên về thực hành"
  mucPhuHop: MucPhuHop;
  doPhuHop: "Cao" | "Khá cao" | "Trung bình";
  tone: ToneTen; // màu huy hiệu (gradient), không dùng mã màu viết tay
  lyDoPhuHop: string[];
  canLuuY: string[];
  nguon: string;
  daKiemChung: boolean;
}

export interface MucTieuChinh {
  luaChonId: string;
  phuongThuc: "THPT" | "DGNL" | "hocBa";
  maToHop: MaToHop;
  toHop: MonId[]; // 3 môn của tổ hợp
  diemMucTieu: number;
  ngayThi: string; // yyyy-mm-dd
}

// ---------- Lịch ----------
export type LoaiLich = "chinhKhoa" | "hocThem" | "khac" | "tuHoc" | "nghi";

export interface TietCoDinh {
  id: string;
  ten: string;
  loai: Exclude<LoaiLich, "tuHoc" | "nghi">;
  mon?: MonId;
  thu: number; // 1 = Thứ 2 ... 7 = Chủ nhật
  batDau: string; // "07:00"
  ketThuc: string;
}

export interface CauHinhTuHoc {
  gioBatDau: string;
  gioKetThuc: string;
  gioHocToiDaMoiNgay: number;
  thoiDiemTot: "sang" | "chieu" | "toi";
  ngayNghi: number[];
  nghiGiuaBuoi: number; // phút
}

export interface ViecCanHoc {
  id: string;
  mon: MonId;
  tieuDe: string;
  chiTiet: string;
  phut: number;
  mucUuTien: "cao" | "vua" | "thap";
  lyDo: string;
  tieuChi: string[];
  taiLieu: { ten: string; link?: string }[];
  mucTieuBuoi?: string; // một câu: buổi này để làm gì
  cacBuoc?: { phut: number; ten: string }[]; // ví dụ 60' làm bài, 25' chữa lỗi, 5' tóm tắt
}

export type TrangThaiViec = "chua" | "xong" | "doi" | "boQua";

export interface KhoiHoc {
  id: string;
  viecId: string | null;
  ten: string;
  loai: LoaiLich;
  mon?: MonId;
  ngay: string; // yyyy-mm-dd
  batDau: string;
  ketThuc: string;
  ghiChu?: string;
  khoa?: boolean; // em tự chọn giờ, "Xếp lại giúp em" sẽ không động vào
}

export interface LichSuHoanThanh {
  viecId: string;
  ten: string;
  luc: string; // ISO
  trangThai: TrangThaiViec;
}

export type TamTrang = "tot" | "binhThuong" | "met";

export interface NhacNho {
  bat: boolean;
  truocPhut: number;
  nhacChuanBiBai: boolean;
  gioChuanBiBai: string;
}

export interface DiemThi {
  mon: MonId;
  diem: number;
  ngay: string;
}

/** Một tình huống "nếu tăng điểm thì sao" đã lưu để so sánh. */
export interface TinhHuongDaLuu {
  id: string;
  ten: string;
  tongDiem: number;
  congMon: Partial<Record<MonId, number>>;
  nganSachTrieu: number;
  khuVuc: string;
  uuTien: "viecLam" | "hocPhi" | "gan";
  luc: string;
}

/** Một dòng nhắc/cảnh báo có hành động đi kèm. */
export interface CanhBao {
  id: string;
  tone: ToneTen;
  tieuDe: string;
  moTa?: string;
  hanhDong?: { nhan: string; den: string };
}
