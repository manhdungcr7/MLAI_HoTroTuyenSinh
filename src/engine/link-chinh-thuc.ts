// Bộ giải quyết liên kết chính thức & Chống lỗi 404 (Official Admissions Link & Multi-Method Resolver).
// Đảm bảo người dùng và thí sinh luôn tiếp cận được trang tuyển sinh gốc của trường
// ngay cả khi các tệp PDF đề án trên trang tổng hợp thứ cấp bị di dời hoặc lỗi 404.

export interface ThongTinCongTruong {
  maTruong: string;
  tenTruong: string;
  congTuyenSinh: string;
  fanpageHoTro?: string;
  ghiChu?: string;
}

/**
 * Bản đồ cổng thông tin tuyển sinh chính thức của các trường đại học hàng đầu Việt Nam
 */
export const CONG_TUYEN_SINH_CHINH_THUC: Record<string, ThongTinCongTruong> = {
  // Đại học Quốc gia TP.HCM
  QSC: { maTruong: "QSC", tenTruong: "Trường Đại học Công nghệ Thông tin - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.uit.edu.vn" },
  QSB: { maTruong: "QSB", tenTruong: "Trường Đại học Bách khoa - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.hcmut.edu.vn" },
  QST: { maTruong: "QST", tenTruong: "Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.hcmus.edu.vn" },
  QSX: { maTruong: "QSX", tenTruong: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.hcmussh.edu.vn" },
  QSK: { maTruong: "QSK", tenTruong: "Trường Đại học Kinh tế - Luật - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.uel.edu.vn" },
  QSQ: { maTruong: "QSQ", tenTruong: "Trường Đại học Quốc tế - ĐHQG-HCM", congTuyenSinh: "https://tuyensinh.hcmiu.edu.vn" },
  QSY: { maTruong: "QSY", tenTruong: "Khoa Y - ĐHQG-HCM", congTuyenSinh: "https://medvnu.edu.vn/tuyensinh" },

  // Đại học Bách khoa Hà Nội & khối Kỹ thuật phía Bắc
  BKA: { maTruong: "BKA", tenTruong: "Đại học Bách khoa Hà Nội", congTuyenSinh: "https://ts.hust.edu.vn" },
  BVH: { maTruong: "BVH", tenTruong: "Học viện Công nghệ Bưu chính Viễn thông", congTuyenSinh: "https://tuyensinh.ptit.edu.vn" },
  GHA: { maTruong: "GHA", tenTruong: "Trường Đại học Giao thông Vận tải", congTuyenSinh: "https://tuyensinh.utc.edu.vn" },
  DDA: { maTruong: "DDA", tenTruong: "Trường Đại học Hàng hải Việt Nam", congTuyenSinh: "https://tuyensinh.vimaru.edu.vn" },
  MTA: { maTruong: "MTA", tenTruong: "Học viện Kỹ thuật Quân sự", congTuyenSinh: "https://mta.edu.vn/tuyensinh" },

  // Đại học Quốc gia Hà Nội
  QHI: { maTruong: "QHI", tenTruong: "Trường Đại học Công nghệ - ĐHQGHN", congTuyenSinh: "https://uet.vnu.edu.vn/tuyen-sinh" },
  QHT: { maTruong: "QHT", tenTruong: "Trường Đại học Khoa học Tự nhiên - ĐHQGHN", congTuyenSinh: "https://hus.vnu.edu.vn/tuyen-sinh.html" },
  QHX: { maTruong: "QHX", tenTruong: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN", congTuyenSinh: "https://ussh.vnu.edu.vn/vi/tuyen-sinh" },
  QHE: { maTruong: "QHE", tenTruong: "Trường Đại học Kinh tế - ĐHQGHN", congTuyenSinh: "https://ueb.edu.vn/tuyen-sinh" },
  QHF: { maTruong: "QHF", tenTruong: "Trường Đại học Ngoại ngữ - ĐHQGHN", congTuyenSinh: "https://ulis.vnu.edu.vn/tuyen-sinh" },
  QHL: { maTruong: "QHL", tenTruong: "Trường Đại học Luật - ĐHQGHN", congTuyenSinh: "https://law.vnu.edu.vn/tuyen-sinh" },

  // Khối Kinh tế & Ngoại thương
  KHA: { maTruong: "KHA", tenTruong: "Trường Đại học Kinh tế Quốc dân", congTuyenSinh: "https://tuyensinh.neu.edu.vn" },
  NTH: { maTruong: "NTH", tenTruong: "Trường Đại học Ngoại thương (Hà Nội)", congTuyenSinh: "https://tuyensinh.ftu.edu.vn" },
  NTS: { maTruong: "NTS", tenTruong: "Trường Đại học Ngoại thương (Cơ sở II TP.HCM)", congTuyenSinh: "https://cs2.ftu.edu.vn/tuyen-sinh" },
  KSA: { maTruong: "KSA", tenTruong: "Đại học Kinh tế TP.HCM (UEH)", congTuyenSinh: "https://tuyensinh.ueh.edu.vn" },
  TMA: { maTruong: "TMA", tenTruong: "Trường Đại học Thương mại", congTuyenSinh: "https://tuyensinh.tmu.edu.vn" },
  HTC: { maTruong: "HTC", tenTruong: "Học viện Tài chính", congTuyenSinh: "https://hvtc.edu.vn/tuyensinh" },
  NHH: { maTruong: "NHH", tenTruong: "Học viện Ngân hàng", congTuyenSinh: "https://tuyensinh.hvnh.edu.vn" },

  // Khối Y Dược
  YHB: { maTruong: "YHB", tenTruong: "Trường Đại học Y Hà Nội", congTuyenSinh: "https://hmu.edu.vn/tuyensinh" },
  YDS: { maTruong: "YDS", tenTruong: "Đại học Y Dược TP.HCM", congTuyenSinh: "https://ump.edu.vn/tuyen-sinh" },
  YPB: { maTruong: "YPB", tenTruong: "Trường Đại học Y Dược Hải Phòng", congTuyenSinh: "https://hpmu.edu.vn/tuyensinh" },
  YTB: { maTruong: "YTB", tenTruong: "Trường Đại học Y Dược Thái Bình", congTuyenSinh: "https://tbump.edu.vn/tuyen-sinh" },
  YCT: { maTruong: "YCT", tenTruong: "Trường Đại học Y Dược Cần Thơ", congTuyenSinh: "https://ctump.edu.vn/tuyen-sinh" },
  DHY: { maTruong: "DHY", tenTruong: "Trường Đại học Dược Hà Nội", congTuyenSinh: "https://hup.edu.vn/tuyen-sinh" },

  // Khối Sư phạm & Ngoại ngữ
  SPH: { maTruong: "SPH", tenTruong: "Trường Đại học Sư phạm Hà Nội", congTuyenSinh: "https://tuyensinh.hnue.edu.vn" },
  SPS: { maTruong: "SPS", tenTruong: "Trường Đại học Sư phạm TP.HCM", congTuyenSinh: "https://tuyensinh.hcmue.edu.vn" },
  HAN: { maTruong: "HAN", tenTruong: "Trường Đại học Hà Nội", congTuyenSinh: "https://hanu.edu.vn/tuyen-sinh" },
  HHT: { maTruong: "HHT", tenTruong: "Học viện Báo chí và Tuyên truyền", congTuyenSinh: "https://ajc.edu.vn/tuyen-sinh" },
  HVA: { maTruong: "HVA", tenTruong: "Học viện Ngoại giao", congTuyenSinh: "https://dav.edu.vn/tuyen-sinh" },

  // Đại học Vùng
  DDK: { maTruong: "DDK", tenTruong: "Đại học Đà Nẵng", congTuyenSinh: "https://ts.udn.vn" },
  DHH: { maTruong: "DHH", tenTruong: "Đại học Huế", congTuyenSinh: "https://tuyensinh.hueuni.edu.vn" },
  TNA: { maTruong: "TNA", tenTruong: "Đại học Thái Nguyên", congTuyenSinh: "https://tuyensinh.tnu.edu.vn" },
  TDT: { maTruong: "TDT", tenTruong: "Trường Đại học Tôn Đức Thắng", congTuyenSinh: "https://admission.tdtu.edu.vn" },
  DKK: { maTruong: "DKK", tenTruong: "Trường Đại học Cần Thơ", congTuyenSinh: "https://tuyensinh.ctu.edu.vn" },
};

/**
 * Danh sách các liên kết PDF bị xác định là 404 hoặc bị gián đoạn máy chủ
 */
const DANH_SACH_LINK_HONG = new Set<string>([
  "https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-dai-hoc-chinh-quy.pdf",
  "https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-dai-hoc-thuong-mai-2026.pdf",
  "https://images.tuyensinh247.com/picture/2025/0402/thong-tin-tuyen-sinh-dai-hoc-cong-nghiep-tphcm-2025.pdf",
  "https://images.tuyensinh247.com/picture/2025/0426/thong-tin-tuyen-sinh-truong-dai-hoc-khxhnv-dhqghn-2025.pdf",
  "https://images.tuyensinh247.com/picture/2025/0502/thong-tin-tuyen-sinh-dai-hoc-thuy-loi-2025.pdf",
]);

export interface KetQuaGiaiQuyetLink {
  url: string;
  nhanHienThi: string;
  laCongChinhThuc: boolean;
  daKiemChung: boolean;
}

/**
 * Giải quyết liên kết thông minh: nếu URL bị hỏng hoặc thiếu, tự động điều hướng sang cổng tuyển sinh chính thức của trường.
 */
export function giaiQuyetLink(
  maTruong: string | undefined,
  rawUrl: string | undefined | null,
  trang?: number
): KetQuaGiaiQuyetLink {
  const truong = maTruong ? CONG_TUYEN_SINH_CHINH_THUC[maTruong] : undefined;

  // Nếu không có rawUrl hoặc URL nằm trong danh sách hỏng 404
  if (!rawUrl || DANH_SACH_LINK_HONG.has(rawUrl.split("#")[0])) {
    if (truong) {
      return {
        url: truong.congTuyenSinh,
        nhanHienThi: "Cổng tuyển sinh chính thức",
        laCongChinhThuc: true,
        daKiemChung: true,
      };
    }
    return {
      url: "https://moet.gov.vn",
      nhanHienThi: "Cổng thông tin Bộ GD&ĐT",
      laCongChinhThuc: false,
      daKiemChung: false,
    };
  }

  // URL hợp lệ
  const finalUrl = trang && trang > 0 ? `${rawUrl}#page=${trang}` : rawUrl;
  return {
    url: finalUrl,
    nhanHienThi: trang && trang > 0 ? `Đề án tuyển sinh · tr. ${trang}` : "Tài liệu đề án",
    laCongChinhThuc: false,
    daKiemChung: true,
  };
}

/**
 * Thông tin giải thích phương thức xét tuyển đa chiều
 */
export const THONG_TIN_PHUONG_THUC: Record<
  string,
  {
    tenDayDu: string;
    thangDiem: string;
    moTaNgan: string;
    quyDoiThamChieu: string;
  }
> = {
  THPT: {
    tenDayDu: "Điểm thi tốt nghiệp THPT",
    thangDiem: "Thang 30",
    moTaNgan: "Xét tuyển bằng tổng điểm 3 môn trong kỳ thi tốt nghiệp THPT quốc gia do Bộ GD&ĐT tổ chức.",
    quyDoiThamChieu: "Áp dụng công thức cộng điểm ưu tiên khu vực và đối tượng theo Quy chế hiện hành.",
  },
  DGNL_HCM: {
    tenDayDu: "Đánh giá năng lực ĐHQG TP.HCM",
    thangDiem: "Thang 1200",
    moTaNgan: "Kỳ thi ĐGNL do ĐHQG TP.HCM tổ chức, gồm 120 câu hỏi trắc nghiệm khách quan đa lĩnh vực.",
    quyDoiThamChieu: "Thường lấy mốc 600 - 1050 điểm tùy ngành (tương đương khoảng 21 - 28.5 điểm thi THPT).",
  },
  DGNL_HN: {
    tenDayDu: "Đánh giá năng lực ĐHQG Hà Nội (HSA)",
    thangDiem: "Thang 150",
    moTaNgan: "Kỳ thi HSA gồm 3 phần: Tư duy định lượng, Tư duy định tính và Khoa học.",
    quyDoiThamChieu: "Điểm chuẩn dao động 75 - 120/150 điểm.",
  },
  DGTD: {
    tenDayDu: "Đánh giá tư duy Đại học Bách khoa Hà Nội (TSA)",
    thangDiem: "Thang 100",
    moTaNgan: "Kỳ thi đánh giá tư duy Toán học, Đọc hiểu và Khoa học/Giải quyết vấn đề.",
    quyDoiThamChieu: "Điểm chuẩn dao động 50 - 85/100 điểm.",
  },
  HOC_BA: {
    tenDayDu: "Xét tuyển Học bạ THPT",
    thangDiem: "Thang 30",
    moTaNgan: "Xét điểm trung bình các học kỳ THPT (3 kỳ, 5 kỳ hoặc cả năm lớp 12).",
    quyDoiThamChieu: "Thường cạnh tranh rất cao, điểm chuẩn thường cao hơn điểm thi tốt nghiệp từ 1.0 - 3.0 điểm.",
  },
  KET_HOP: {
    tenDayDu: "Xét tuyển kết hợp (Chứng chỉ quốc tế + Điểm thi/Học bạ)",
    thangDiem: "Thang quy đổi",
    moTaNgan: "Kết hợp IELTS (từ 5.0 trở lên), SAT/ACT kết hợp với điểm thi THPT hoặc học bạ.",
    quyDoiThamChieu: "IELTS 6.5 thường được quy đổi tương đương 9.0 - 10.0 môn Tiếng Anh tùy trường.",
  },
};

