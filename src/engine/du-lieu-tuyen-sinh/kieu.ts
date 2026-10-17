// Kiểu dữ liệu chuẩn cho Kiến trúc Dữ liệu Tuyển sinh CMS & Web
// Độc lập môi trường (Chạy được trên Node, Cloudflare Workers/Pages Functions, Trình duyệt)

export type TrangThaiCms =
  | "DRAFT"        // Đang soạn thảo
  | "SUBMITTED"    // Đã gửi chờ duyệt
  | "IN_REVIEW"    // Đang được kiểm tra
  | "APPROVED"     // Đã duyệt, chờ vào snapshot
  | "PUBLISHED"    // Đã xuất bản lên snapshot công khai
  | "REJECTED"     // Bị từ chối (có lý do)
  | "ARCHIVED"     // Đã lưu trữ (không dùng)
  | "SUPERSEDED";  // Bị thay thế bởi phiên bản mới hơn

export type LoaiThucTheCms =
  | "school"        // Thông tin trường (kênh, địa chỉ, tổng quan)
  | "tuition"       // Học phí theo năm/ngành
  | "scholarship"   // Học bổng
  | "admission"     // Phương thức & chỉ tiêu tuyển sinh
  | "cutoff_score"  // Điểm chuẩn bổ sung/hiệu chỉnh
  | "announcement"  // Thông báo tuyển sinh quan trọng
  | "deadline"      // Hạn nộp hồ sơ, thi ĐGNL
  | "contact"       // Kênh liên hệ, Zalo, Fanpage chính thức
  | "noi_luu_tru"   // Ký túc xá, khu trọ, khoảng cách (thông tin cộng đồng, có nguồn)
  | "review"        // Đánh giá của sinh viên/cựu sinh viên (có nguồn)
  | "luu_y";        // Lưu ý quan trọng cho thí sinh

export type MucDoQuanTrong = "normal" | "important" | "critical";

export type VaiTroCms = "contributor" | "editor" | "reviewer" | "admin";

/** Nguồn kiểm chứng bắt buộc để đảm bảo tính xác thực */
export interface NguonKiemChung {
  url: string;
  tieuDe: string;
  donViCongBo: string;
  ngayCongBo?: string;
  ngayKiemChung: string;
  nguoiKiemChung?: string;
  ghiChu?: string;
}

/** Bản ghi CMS hoàn chỉnh với đầy đủ Provenance & Versioning */
export interface BanGhiCms<T = unknown> {
  id: string;
  entityType: LoaiThucTheCms;
  entityId: string; // mã trường (QSC, BKA) hoặc mã ngành (QSC-7480201)
  version: number;
  status: TrangThaiCms;

  data: T;

  source: NguonKiemChung;
  importance: MucDoQuanTrong;
  changeNote: string;
  rejectionReason?: string;
  previousVersionId?: string;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;

  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
}

/** Domain Snapshots: Dữ liệu phân vùng theo miền */
export interface SnapshotTruong {
  maTruong: string;
  tenTruong?: string;
  websiteChinhThuc?: string;
  websiteTuyenSinh?: string;
  fanpageUrl?: string;
  nhomZaloUrl?: string;
  nhomFacebookUrl?: string;
  /** Nhóm do trường lập (Facebook hoặc Zalo) và nhóm sinh viên/cộng đồng, đúng tên hai ô trong CMS. */
  nhomTuyenSinhChinhThucUrl?: string;
  nhomCongDongUrl?: string;
  diaChi?: string;
  kyTucXa?: {
    coKyTuc: boolean;
    giaThangMin?: number;
    giaThangMax?: number;
    ghiChu?: string;
  };
  ghiChu?: string;
  nguon?: NguonKiemChung;
  capNhatLuc: string;
}

export interface SnapshotHocPhi {
  id: string; // schoolId hoặc majorId
  maTruong: string;
  maNganh?: string;
  nam: number;
  mucThap: number; // triệu VNĐ
  mucCao: number;
  donVi: "trieu_nam" | "trieu_tin_chi";
  /** Học phí áp dụng cho ai (ví dụ "Chương trình chuẩn"); CMS bắt buộc nhập. */
  phamVi?: string;
  loTrinhTang?: string;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

export interface SnapshotHocBong {
  id: string;
  maTruong: string;
  tenHocBong: string;
  giaTri: string;
  dieuKien: string;
  hanNop?: string;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

export interface SnapshotTuyenSinh {
  id: string;
  maTruong: string;
  maNganh?: string;
  nam: number;
  phuongThuc: string; // THPT, DGNL, HOC_BA, XET_TUYEN_THANG...
  chiTieu?: number;
  toHop?: string[];
  dieuKienNhanHoSo?: string;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

export interface SnapshotThongBao {
  id: string;
  maTruong?: string;
  tieuDe: string;
  tomTat: string;
  linkChiTiet?: string;
  mucDo: MucDoQuanTrong;
  ngayHetHan?: string;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

export interface SnapshotDiemChuanHieuChinh {
  id: string; // majorId
  maTruong: string;
  maNganh: string;
  nam: number;
  phuongThuc: string;
  toHop: string;
  diemChuan: number;
  /** Bản cũ không có trường này: chưa xác định loại điểm, không suy từ trị số. */
  loaiDiem?: "diem_chuan" | "diem_san" | "du_kien" | "chua_ro";
  thangDiem?: number;
  tieuChiPhu?: string;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

/** Thông tin cộng đồng đã duyệt (nơi lưu trú, đánh giá, lưu ý). Luôn hiển thị kèm nhãn "chưa phải số liệu chính thức". */
export interface SnapshotCongDong {
  id: string;
  loai: "noi_luu_tru" | "review" | "luu_y";
  maTruong: string;
  noiDung: Record<string, unknown>;
  nguon: NguonKiemChung;
  capNhatLuc: string;
}

/** Tóm tắt thay đổi để Web hiển thị thông báo nghiệp vụ */
export interface ThayDoiSnapshot {
  entityType: LoaiThucTheCms;
  entityId: string;
  field: string;
  importance: MucDoQuanTrong;
  title: string;
  summary: string;
  updatedAt: string;
}

/** Metadata cho từng dataset trong Manifest */
export interface DatasetMeta {
  version: string;
  hash: string; // SHA-256
  url: string;
  size: number;
  recordCount: number;
  updatedAt: string;
}

/** Manifest.json: Điểm kiểm tra phiên bản siêu nhẹ cho Frontend */
export interface ManifestTuyenSinh {
  schemaVersion: number;
  dataVersion: string; // định dạng YYYY.MM.DD.increment (vd: 2026.10.07.01)
  generatedAt: string;
  datasets: {
    schools: DatasetMeta;
    tuition: DatasetMeta;
    scholarships: DatasetMeta;
    admissions: DatasetMeta;
    announcements: DatasetMeta;
    cutoffScores: DatasetMeta;
    /** Có từ phiên bản 2026.10.07 trở đi; bản manifest cũ không có trường này. */
    community?: DatasetMeta;
  };
  recentChanges: ThayDoiSnapshot[];
}

/** Nhật ký kiểm toán CMS (Audit Log) */
export interface NhatKyKiemToanCms {
  id?: number | string;
  actorId: string;
  actorEmail: string;
  action: "CREATE" | "SUBMIT" | "START_REVIEW" | "APPROVE" | "REJECT" | "PUBLISH" | "ROLLBACK" | "ARCHIVE";
  entityType: LoaiThucTheCms;
  entityId: string;
  version: number;
  changedFields?: string[];
  note?: string;
  timestamp: string;
}
