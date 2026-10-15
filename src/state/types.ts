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

// Các môn thêm (không bắt buộc): để tính các tổ hợp xã hội và tổ hợp mới (C00, D14, X70, X26...). Lưu riêng ở HoSo.diemThem.
export type MonThem = "lichSu" | "diaLy" | "gdktpl" | "tinHoc" | "congNghe";
export const CAC_MON_THEM: MonThem[] = ["lichSu", "diaLy", "gdktpl", "tinHoc", "congNghe"];
export const TEN_MON_THEM: Record<MonThem, string> = {
  lichSu: "Lịch sử", diaLy: "Địa lý", gdktpl: "GD kinh tế và pháp luật", tinHoc: "Tin học", congNghe: "Công nghệ",
};
export const TEN_MON_THEM_NGAN: Record<MonThem, string> = { lichSu: "Sử", diaLy: "Địa", gdktpl: "GDKT&PL", tinHoc: "Tin", congNghe: "C.nghệ" };
export type MonKhoi = MonId | MonThem;
/** Điểm đủ 11 môn (6 môn chính + 5 môn thêm); môn chưa có là null. */
export type DiemDayDu = Record<MonKhoi, number | null> & {
  /** Mức điểm ưu tiên theo quy định (khu vực + đối tượng) của em; chưa chọn thì không có. Tổng điểm so với điểm chuẩn đã tự cộng phần này. */
  uuTien?: number;
};

export type MaToHop = "A00" | "A01" | "D01" | "B00";
export const TO_HOP: Record<MaToHop, MonId[]> = {
  A00: ["toan", "vatLy", "hoaHoc"],
  A01: ["toan", "vatLy", "tiengAnh"],
  D01: ["toan", "nguVan", "tiengAnh"],
  B00: ["toan", "hoaHoc", "sinh"],
};

export type LoaiSoThich = "R" | "I" | "A" | "S" | "E" | "C";
/** Kết quả trắc nghiệm sở thích nghề nghiệp (Holland). diem: 0–9 mỗi nhóm; top: 3 nhóm cao nhất. */
export interface KetQuaSoThich { diem: Record<LoaiSoThich, number>; top: LoaiSoThich[]; luc: string; giaTri?: string[] }

export type VaiDongHanh = "phuHuynh" | "giaoVien" | "tuVan";
/** Lời nhắn của phụ huynh, thầy cô hoặc người tư vấn gửi cho em qua liên kết. */
export interface LoiNhan { id: string; tu: string; vai: VaiDongHanh; noiDung: string; luc: string }

export interface HoSo {
  hoTen: string;
  khoi: 11 | 12 | null;
  tinh: string;
  giaiDoan: string; // chỉ còn dùng để đánh dấu "Đã tốt nghiệp THPT" (chặng thi lại), xem state/chang.ts
  nganhQuanTam: string[]; // chọn 1 hoặc nhiều
  diem: Record<MonId, number | null>;
  diemThem?: Partial<Record<MonThem, number | null>>; // Sử, Địa, GDKT&PL, Tin, Công nghệ (không bắt buộc)
  uuTienTuyenSinh?: { khuVuc: "KV1" | "KV2-NT" | "KV2" | "KV3" | null; doiTuong: "khong" | "UT1" | "UT2" | null }; // điểm ưu tiên khu vực/đối tượng theo quy chế, không bắt buộc
  laMau?: boolean; // hồ sơ trình diễn (người giả), không phải học sinh thật
  soThich?: KetQuaSoThich | null; // trắc nghiệm hướng nghiệp, chưa làm thì để trống
  diemManh: string[];
  canCaiThien: string[];
  nganSach: "duoi30" | "30-60" | "60-100" | "tren100" | null; // triệu đồng / năm
  choO: "oNha" | "oTro" | "kyTucXa" | null;
  khuVuc: string[];
  hocXaNha: boolean | null;
  quanTamViecLam: "rat" | "binhThuong" | "chuaRo" | null;
  hoanTat: boolean;
  // ---- Hồ sơ tuyển sinh đa phương thức (IELTS, ĐGNL, Học bạ, HSG) ----
  chungChiNgoaiNgu?: {
    loai: "IELTS" | "TOEFL" | "TOEIC" | "VSTEP" | "HSK" | "JLPT" | "khac";
    diem: number; // Điểm đạt được (ví dụ IELTS 6.5, 7.0; VSTEP 8.0)
    ngayCap?: string;
  } | null;
  diemDgnl?: {
    hcm?: number | null; // ĐHQG TP.HCM (thang 1200)
    hn?: number | null;  // ĐHQG Hà Nội HSA (thang 150)
    tsa?: number | null; // ĐGTD Bách Khoa TSA (thang 100)
    khac?: number | null;
  } | null;
  hocBa?: {
    dtbLop10?: number | null;
    dtbLop11?: number | null;
    dtbLop12?: number | null;
    dtb3Nam?: number | null;
    hocLuc?: "xuatSac" | "gioi" | "kha" | "trungBinh" | null;
    hanhKiem?: "tot" | "kha" | "trungBinh" | null;
    truongChuyen?: boolean | null;
  } | null;
  giaiThuongHsg?: {
    cap: "quocGia" | "tinh" | "truongChuyen" | null;
    mon?: string;
    giai?: "nhat" | "nhi" | "ba" | "khuyenKhich" | null;
  } | null;
  tienDoKienThuc?: Record<string, "chuaHoc" | "dangHoc" | "namVung" | "canOnTap">;
}

export type BacHoc = "Đại học" | "Cao đẳng";
export type MucPhuHop = "Phù hợp" | "Có thể thử sức" | "Cần cân nhắc";
export type NhanNguyenVong = "Thử sức" | "Vừa sức" | "An toàn" | "Dự phòng";

export interface NguonNam {
  nam: string; // năm của tài liệu
  loai: "deAn" | "diemChuan"; // đề án tuyển sinh của trường, hay trang công bố điểm chuẩn
  url: string;
  tai?: string; // năm của đề án chứa điểm này (đề án năm sau thường công bố điểm chuẩn năm trước)
  trang?: number; // trang trong file PDF nơi ngành này xuất hiện
}

export interface LuaChon {
  id: string;
  truong: string; // tên ngắn: UIT
  tenTruong: string; // tên đầy đủ
  nganh: string;
  nhomNganh: string; // dùng cho chip ngành ở Khám phá
  moTa: string;
  bac: BacHoc;
  khuVuc: string; // TP.HCM
  diaChi?: string; // chưa có trong đề án thì để trống, không điền thay
  hocPhiMin?: number; // triệu đồng / năm; để trống khi đề án chưa công bố học phí theo ngành
  hocPhiMax?: number;
  diemMin: number; // điểm tham khảo năm trước (thang 30)
  diemMax: number;
  namDiem: number;
  coHoiViecLam?: "Cao" | "Rất cao" | "Khá"; // chỉ có khi đo được từ dữ liệu việc làm
  moiTruongHoc?: string; // ví dụ "Năng động, thiên về thực hành"
  mucPhuHop?: MucPhuHop; // dữ liệu mẫu cũ; dữ liệu thật tính từ hồ sơ của em (xem features/kham-pha/phu-hop.ts)
  doPhuHop?: "Cao" | "Khá cao" | "Trung bình";
  tone: ToneTen; // màu huy hiệu (gradient), không dùng mã màu viết tay
  lyDoPhuHop: string[];
  canLuuY: string[];
  nguon: string;
  daKiemChung: boolean;
  ngayCapNhat?: string;
  linkNguon?: string;
  donViXacThuc?: string;
  // ---- Dữ liệu thật (có khi nạp từ du-lieu-that.json) ----
  maTruong?: string; // mã trường tuyển sinh, ví dụ QSC
  phuongThuc?: string; // THPT, HOC_BA, DGNL_HCM...
  toHopXet?: string[]; // tổ hợp đề án ghi cho ngành này; rỗng = đề án chưa ghi rõ
  diemTheoNam?: Record<string, number>; // điểm chuẩn từng năm có thật
  diemDuKien?: number | null; // điểm chuẩn dự kiến năm tới (bằng năm gần nhất)
  nguonCap?: "official_pdf" | "aggregator_verified"; // đề án chính thức hay trang tổng hợp
  tiLeViecLam?: number; // phần trăm sinh viên có việc làm theo khảo sát trong đề án của trường
  nguonViecLam?: { nam: string; url: string; trang: number }; // trang đề án nêu tỷ lệ có việc làm (nếu trích được)
  nguonHocPhi?: { nam: string; url: string; trang: number }; // trang đề án nêu học phí của ngành này
  /** Học phí là ước tính theo trường/khối ngành, chưa có văn bản của trường để đối chiếu: hiện "≈ … (ước tính)", không có link nguồn. */
  hocPhiUocTinh?: boolean;
  nguonTheoNam?: NguonNam[]; // liên kết tới tài liệu gốc của từng năm (đề án PDF, có số trang nếu tìm được)
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
  tuan?: string; // thứ 2 của tuần mà việc này thuộc về; không có = việc dùng cho mọi tuần (dữ liệu cũ)
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
