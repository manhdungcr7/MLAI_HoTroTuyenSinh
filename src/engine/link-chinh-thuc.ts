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
  QSC: { maTruong: "QSC", tenTruong: "ĐH Công nghệ Thông tin - ĐHQG TP.HCM", congTuyenSinh: "https://tuyensinh.uit.edu.vn" },
  QSB: { maTruong: "QSB", tenTruong: "QSB", congTuyenSinh: "https://tuyensinh.hcmut.edu.vn" },
  QST: { maTruong: "QST", tenTruong: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM", congTuyenSinh: "https://tuyensinh.hcmus.edu.vn" },
  QSX: { maTruong: "QSX", tenTruong: "ĐH KHXH&NV - ĐHQG TP.HCM", congTuyenSinh: "https://tuyensinh.hcmussh.edu.vn" },
  QSK: { maTruong: "QSK", tenTruong: "QSK", congTuyenSinh: "https://tuyensinh.uel.edu.vn" },
  QSQ: { maTruong: "QSQ", tenTruong: "QSQ", congTuyenSinh: "https://tuyensinh.hcmiu.edu.vn" },
  QSY: { maTruong: "QSY", tenTruong: "Khoa Y - ĐHQG TP.HCM", congTuyenSinh: "https://medvnu.edu.vn/tuyensinh" },
  QHI: { maTruong: "QHI", tenTruong: "ĐH Công nghệ - ĐHQGHN", congTuyenSinh: "https://uet.vnu.edu.vn/tuyen-sinh" },
  QHT: { maTruong: "QHT", tenTruong: "ĐH Khoa học Tự nhiên - ĐHQGHN", congTuyenSinh: "https://hus.vnu.edu.vn/tuyen-sinh.html" },
  QHX: { maTruong: "QHX", tenTruong: "ĐH Khoa học Xã hội & Nhân văn - ĐHQGHN", congTuyenSinh: "https://ussh.vnu.edu.vn/vi/tuyen-sinh" },
  QHE: { maTruong: "QHE", tenTruong: "ĐH Kinh tế - ĐHQGHN", congTuyenSinh: "https://ueb.edu.vn/tuyen-sinh" },
  QHF: { maTruong: "QHF", tenTruong: "Trường Đại học Ngoại ngữ - ĐHQGHN", congTuyenSinh: "https://ulis.vnu.edu.vn/tuyen-sinh" },
  QHL: { maTruong: "QHL", tenTruong: "ĐH Luật - ĐHQGHN", congTuyenSinh: "https://law.vnu.edu.vn/tuyen-sinh" },
  QHQ: { maTruong: "QHQ", tenTruong: "Trường Quản trị và Kinh doanh - ĐHQGHN", congTuyenSinh: "https://hsb.edu.vn/tuyen-sinh" },
  QHS: { maTruong: "QHS", tenTruong: "ĐH Giáo dục - ĐHQGHN", congTuyenSinh: "https://education.vnu.edu.vn/tuyen-sinh" },
  QHY: { maTruong: "QHY", tenTruong: "ĐH Y Dược - ĐHQGHN", congTuyenSinh: "https://ump.vnu.edu.vn/tuyen-sinh" },
  BKA: { maTruong: "BKA", tenTruong: "ĐH Bách Khoa Hà Nội", congTuyenSinh: "https://ts.hust.edu.vn" },
  BVH: { maTruong: "BVH", tenTruong: "Học viện Công nghệ Bưu chính Viễn thông", congTuyenSinh: "https://tuyensinh.ptit.edu.vn" },
  GHA: { maTruong: "GHA", tenTruong: "ĐH Giao thông Vận tải", congTuyenSinh: "https://tuyensinh.utc.edu.vn" },
  GSA: { maTruong: "GSA", tenTruong: "ĐH Giao thông Vận tải Cơ sở 2", congTuyenSinh: "https://utc2.edu.vn/tuyen-sinh" },
  GTA: { maTruong: "GTA", tenTruong: "ĐH Công nghệ Giao thông Vận tải", congTuyenSinh: "https://utt.edu.vn/tuyen-sinh" },
  DDA: { maTruong: "DDA", tenTruong: "DDA", congTuyenSinh: "https://tuyensinh.vimaru.edu.vn" },
  MTA: { maTruong: "MTA", tenTruong: "MTA", congTuyenSinh: "https://mta.edu.vn/tuyensinh" },
  DCN: { maTruong: "DCN", tenTruong: "ĐH Công nghiệp Hà Nội", congTuyenSinh: "https://tuyensinh.haui.edu.vn" },
  DCT: { maTruong: "DCT", tenTruong: "Trường Đại học Công Thương TP.HCM", congTuyenSinh: "https://ts.huit.edu.vn" },
  IUH: { maTruong: "IUH", tenTruong: "Trường Đại học Công nghiệp TP.HCM", congTuyenSinh: "https://tuyensinh.iuh.edu.vn" },
  SPK: { maTruong: "SPK", tenTruong: "ĐH Công nghệ Kỹ thuật TP.HCM", congTuyenSinh: "https://tuyensinh.hcmute.edu.vn" },
  KMA: { maTruong: "KMA", tenTruong: "Học viện Kỹ thuật Mật mã", congTuyenSinh: "https://actvn.edu.vn/tuyen-sinh" },
  XDA: { maTruong: "XDA", tenTruong: "ĐH Xây dựng Hà Nội", congTuyenSinh: "https://tuyensinh.huce.edu.vn" },
  XDT: { maTruong: "XDT", tenTruong: "ĐH Xây dựng Miền Trung", congTuyenSinh: "https://muce.edu.vn/tuyen-sinh" },
  TLA: { maTruong: "TLA", tenTruong: "Trường Đại học Thủy Lợi", congTuyenSinh: "https://tuyensinh.tlu.edu.vn" },
  DMT: { maTruong: "DMT", tenTruong: "ĐH Tài nguyên và Môi trường Hà Nội", congTuyenSinh: "https://tuyensinh.hunre.edu.vn" },
  HHK: { maTruong: "HHK", tenTruong: "Học viện Hàng không Việt Nam", congTuyenSinh: "https://tuyensinh.vaa.edu.vn" },
  DSG: { maTruong: "DSG", tenTruong: "ĐH Công nghệ Sài Gòn", congTuyenSinh: "https://stu.edu.vn/vi/tuyen-sinh.html" },
  SDU: { maTruong: "SDU", tenTruong: "ĐH Sao Đỏ", congTuyenSinh: "http://saodo.edu.vn/tuyen-sinh" },
  DKK: { maTruong: "DKK", tenTruong: "ĐH Kinh tế - Kỹ thuật Công nghiệp", congTuyenSinh: "https://tuyensinh.uneti.edu.vn" },
  KHA: { maTruong: "KHA", tenTruong: "Trường Đại học Kinh tế Quốc dân", congTuyenSinh: "https://tuyensinh.neu.edu.vn" },
  NTH: { maTruong: "NTH", tenTruong: "Trường Đại học Ngoại thương", congTuyenSinh: "https://tuyensinh.ftu.edu.vn" },
  NTS: { maTruong: "NTS", tenTruong: "ĐH Ngoại thương (Cơ sở TP.HCM)", congTuyenSinh: "https://cs2.ftu.edu.vn/tuyen-sinh" },
  KSA: { maTruong: "KSA", tenTruong: "KSA", congTuyenSinh: "https://tuyensinh.ueh.edu.vn" },
  TMA: { maTruong: "TMA", tenTruong: "TMA", congTuyenSinh: "https://tuyensinh.tmu.edu.vn" },
  TMU: { maTruong: "TMU", tenTruong: "Trường Đại học Thương mại", congTuyenSinh: "https://tuyensinh.tmu.edu.vn" },
  HTC: { maTruong: "HTC", tenTruong: "Học viện Tài chính", congTuyenSinh: "https://hvtc.edu.vn/tuyensinh" },
  NHH: { maTruong: "NHH", tenTruong: "Học viện Ngân hàng", congTuyenSinh: "https://tuyensinh.hvnh.edu.vn" },
  NHP: { maTruong: "NHP", tenTruong: "Học viện Ngân hàng (Phân viện Phú Yên)", congTuyenSinh: "https://tuyensinh.hvnh.edu.vn" },
  HCS: { maTruong: "HCS", tenTruong: "Học viện Chính sách và Phát triển", congTuyenSinh: "https://apd.edu.vn/tuyen-sinh" },
  MBS: { maTruong: "MBS", tenTruong: "ĐH Mở TP.HCM", congTuyenSinh: "https://tuyensinh.ou.edu.vn" },
  UEF: { maTruong: "UEF", tenTruong: "ĐH Kinh tế - Tài chính TP.HCM (UEF)", congTuyenSinh: "https://www.uef.edu.vn/tuyensinh" },
  DQK: { maTruong: "DQK", tenTruong: "ĐH Kinh doanh và Công nghệ Hà Nội", congTuyenSinh: "https://hubt.edu.vn/tuyen-sinh" },
  YHB: { maTruong: "YHB", tenTruong: "ĐH Y Hà Nội", congTuyenSinh: "https://hmu.edu.vn/tuyensinh" },
  YDS: { maTruong: "YDS", tenTruong: "ĐH Y Dược TP.HCM", congTuyenSinh: "https://ump.edu.vn/tuyen-sinh" },
  YPB: { maTruong: "YPB", tenTruong: "Trường Đại học Y Dược Hải Phòng", congTuyenSinh: "https://hpmu.edu.vn/tuyensinh" },
  YTB: { maTruong: "YTB", tenTruong: "Trường Đại học Y Dược Thái Bình", congTuyenSinh: "https://tbump.edu.vn/tuyen-sinh" },
  YCT: { maTruong: "YCT", tenTruong: "Trường Đại học Y Dược Cần Thơ", congTuyenSinh: "https://ctump.edu.vn/tuyen-sinh" },
  DHY: { maTruong: "DHY", tenTruong: "ĐH Y Dược - ĐH Huế", congTuyenSinh: "https://huemed-univ.edu.vn/tuyen-sinh" },
  DKH: { maTruong: "DKH", tenTruong: "ĐH Dược Hà Nội", congTuyenSinh: "https://hup.edu.vn/tuyen-sinh" },
  DDY: { maTruong: "DDY", tenTruong: "Khoa Y Dược - ĐH Đà Nẵng", congTuyenSinh: "https://smp.udn.vn/tuyen-sinh" },
  TYS: { maTruong: "TYS", tenTruong: "ĐH Y tế Công cộng", congTuyenSinh: "https://huph.edu.vn/tuyen-sinh" },
  SPH: { maTruong: "SPH", tenTruong: "ĐH Sư phạm Hà Nội", congTuyenSinh: "https://tuyensinh.hnue.edu.vn" },
  SPS: { maTruong: "SPS", tenTruong: "ĐH Sư phạm TP.HCM", congTuyenSinh: "https://tuyensinh.hcmue.edu.vn" },
  SP2: { maTruong: "SP2", tenTruong: "ĐH Sư phạm Hà Nội 2", congTuyenSinh: "https://tuyensinh.hpu2.edu.vn" },
  SPD: { maTruong: "SPD", tenTruong: "ĐH Đồng Tháp", congTuyenSinh: "https://tuyensinh.dthu.edu.vn" },
  HAN: { maTruong: "HAN", tenTruong: "HAN", congTuyenSinh: "https://hanu.edu.vn/tuyen-sinh" },
  NHF: { maTruong: "NHF", tenTruong: "Đại học Hà Nội", congTuyenSinh: "https://hanu.edu.vn/tuyen-sinh" },
  HBT: { maTruong: "HBT", tenTruong: "Học viện Báo chí và Tuyên truyền", congTuyenSinh: "https://ajc.edu.vn/tuyen-sinh" },
  HHT: { maTruong: "HHT", tenTruong: "HHT", congTuyenSinh: "https://ajc.edu.vn/tuyen-sinh" },
  HQT: { maTruong: "HQT", tenTruong: "Học viện Ngoại giao", congTuyenSinh: "https://dav.edu.vn/tuyen-sinh" },
  HVA: { maTruong: "HVA", tenTruong: "HVA", congTuyenSinh: "https://dav.edu.vn/tuyen-sinh" },
  HNM: { maTruong: "HNM", tenTruong: "Trường Đại học Thủ Đô Hà Nội", congTuyenSinh: "https://hnmu.edu.vn/tuyen-sinh" },
  HPN: { maTruong: "HPN", tenTruong: "Học viện Phụ Nữ Việt Nam", congTuyenSinh: "https://hvpnvn.edu.vn/tuyen-sinh" },
  SGD: { maTruong: "SGD", tenTruong: "ĐH Sài Gòn", congTuyenSinh: "https://sgu.edu.vn/tuyen-sinh" },
  LPH: { maTruong: "LPH", tenTruong: "ĐH Luật Hà Nội", congTuyenSinh: "https://hlu.edu.vn/tuyen-sinh" },
  LPS: { maTruong: "LPS", tenTruong: "ĐH Luật TP.HCM", congTuyenSinh: "https://tuyensinh.hcmulaw.edu.vn" },
  DNT: { maTruong: "DNT", tenTruong: "ĐH Ngoại ngữ - Tin học TP.HCM (HUFLIT)", congTuyenSinh: "https://tuyensinh.huflit.edu.vn" },
  DDK: { maTruong: "DDK", tenTruong: "ĐH Bách Khoa - ĐH Đà Nẵng", congTuyenSinh: "https://ts.udn.vn" },
  DDF: { maTruong: "DDF", tenTruong: "ĐH Ngoại ngữ - ĐH Đà Nẵng", congTuyenSinh: "https://ufl.udn.vn/vi/tuyen-sinh" },
  DDP: { maTruong: "DDP", tenTruong: "ĐH Sư phạm Kỹ thuật - ĐH Đà Nẵng", congTuyenSinh: "https://ute.udn.vn/tuyensinh" },
  DDQ: { maTruong: "DDQ", tenTruong: "ĐH Kinh tế - ĐH Đà Nẵng", congTuyenSinh: "https://tuyensinh.due.udn.vn" },
  DDS: { maTruong: "DDS", tenTruong: "ĐH Sư phạm - ĐH Đà Nẵng", congTuyenSinh: "https://tuyensinh.ued.udn.vn" },
  DHH: { maTruong: "DHH", tenTruong: "DHH", congTuyenSinh: "https://tuyensinh.hueuni.edu.vn" },
  DHS: { maTruong: "DHS", tenTruong: "ĐH Sư phạm - ĐH Huế", congTuyenSinh: "https://dhsptuyensinh.hueuni.edu.vn" },
  TNA: { maTruong: "TNA", tenTruong: "TNA", congTuyenSinh: "https://tuyensinh.tnu.edu.vn" },
  DTF: { maTruong: "DTF", tenTruong: "Trường Ngoại ngữ - ĐH Thái Nguyên", congTuyenSinh: "https://sfl.tnu.edu.vn/tuyen-sinh" },
  DTN: { maTruong: "DTN", tenTruong: "ĐH Nông Lâm - ĐH Thái Nguyên", congTuyenSinh: "https://tuaf.edu.vn/tuyen-sinh" },
  DTS: { maTruong: "DTS", tenTruong: "Trường Đại học Sư phạm - Đại học Thái Nguyên", congTuyenSinh: "https://tuyensinh.sptn.edu.vn" },
  TCT: { maTruong: "TCT", tenTruong: "Trường Đại học Cần Thơ", congTuyenSinh: "https://tuyensinh.ctu.edu.vn" },
  TDV: { maTruong: "TDV", tenTruong: "ĐH Vinh", congTuyenSinh: "https://vinhuni.edu.vn/tuyen-sinh" },
  TDL: { maTruong: "TDL", tenTruong: "ĐH Đà Lạt", congTuyenSinh: "https://tuyensinh.dlu.edu.vn" },
  TDM: { maTruong: "TDM", tenTruong: "Trường Đại học Thủ Dầu Một", congTuyenSinh: "https://tuyensinh.tdmu.edu.vn" },
  THP: { maTruong: "THP", tenTruong: "ĐH Hải Phòng", congTuyenSinh: "https://dhhp.edu.vn/tuyen-sinh" },
  TSN: { maTruong: "TSN", tenTruong: "ĐH Nha Trang", congTuyenSinh: "https://tuyensinh.ntu.edu.vn" },
  TTN: { maTruong: "TTN", tenTruong: "ĐH Tiền Giang", congTuyenSinh: "https://tgu.edu.vn/tuyen-sinh" },
  DQN: { maTruong: "DQN", tenTruong: "ĐH Quy Nhơn", congTuyenSinh: "https://tuyensinh.qnu.edu.vn" },
  DQH: { maTruong: "DQH", tenTruong: "ĐH Hồng Đức", congTuyenSinh: "https://tuyensinh.hdu.edu.vn" },
  DQB: { maTruong: "DQB", tenTruong: "ĐH Quảng Bình", congTuyenSinh: "https://qbu.edu.vn/tuyen-sinh" },
  DPQ: { maTruong: "DPQ", tenTruong: "ĐH Phạm Văn Đồng", congTuyenSinh: "https://pdu.edu.vn/tuyen-sinh" },
  DPY: { maTruong: "DPY", tenTruong: "ĐH Phú Yên", congTuyenSinh: "https://pyu.edu.vn/tuyen-sinh" },
  DQU: { maTruong: "DQU", tenTruong: "ĐH Quảng Nam", congTuyenSinh: "https://qnamuni.edu.vn/tuyen-sinh" },
  DNU: { maTruong: "DNU", tenTruong: "ĐH Đồng Nai", congTuyenSinh: "http://dnpu.edu.vn/tuyen-sinh" },
  DNB: { maTruong: "DNB", tenTruong: "ĐH Hoa Lư", congTuyenSinh: "http://hualu.edu.vn/tuyen-sinh" },
  DTV: { maTruong: "DTV", tenTruong: "ĐH Trà Vinh", congTuyenSinh: "https://tuyensinh.tvu.edu.vn" },
  DBL: { maTruong: "DBL", tenTruong: "ĐH Bạc Liêu", congTuyenSinh: "https://blu.edu.vn/tuyen-sinh" },
  DCL: { maTruong: "DCL", tenTruong: "ĐH Cửu Long", congTuyenSinh: "https://mku.edu.vn/tuyen-sinh" },
  DLA: { maTruong: "DLA", tenTruong: "Trường Đại học Kinh tế Công nghiệp Long An", congTuyenSinh: "https://tuyensinh.dla.edu.vn" },
  DVD: { maTruong: "DVD", tenTruong: "ĐH Văn hóa Thể thao và Du lịch Thanh Hóa", congTuyenSinh: "https://dvtdt.edu.vn/tuyen-sinh" },
  DVX: { maTruong: "DVX", tenTruong: "Trường Đại học Công nghệ Vạn Xuân", congTuyenSinh: "https://vxut.edu.vn/tuyen-sinh" },
  HVN: { maTruong: "HVN", tenTruong: "Học viện Nông nghiệp Việt Nam", congTuyenSinh: "https://tuyensinh.vnua.edu.vn" },
  NLS: { maTruong: "NLS", tenTruong: "ĐH Nông Lâm TP.HCM", congTuyenSinh: "https://ts.hcmuaf.edu.vn" },
  LNH: { maTruong: "LNH", tenTruong: "ĐH Lâm nghiệp", congTuyenSinh: "https://vnuf.edu.vn/tuyen-sinh" },
  KTS: { maTruong: "KTS", tenTruong: "ĐH Kiến trúc TP.HCM", congTuyenSinh: "https://uah.edu.vn/tuyen-sinh" },
  TDT: { maTruong: "TDT", tenTruong: "TDT", congTuyenSinh: "https://admission.tdtu.edu.vn" },
  FPT: { maTruong: "FPT", tenTruong: "ĐH FPT", congTuyenSinh: "https://daihoc.fpt.edu.vn" },
  DDT: { maTruong: "DDT", tenTruong: "ĐH Duy Tân", congTuyenSinh: "https://tuyensinh.duytan.edu.vn" },
  DVL: { maTruong: "DVL", tenTruong: "ĐH Văn Lang", congTuyenSinh: "https://tuyensinh.vlu.edu.vn" },
  DKC: { maTruong: "DKC", tenTruong: "ĐH Công nghệ TP.HCM (HUTECH)", congTuyenSinh: "https://www.hutech.edu.vn/tuyensinh" },
  HSU: { maTruong: "HSU", tenTruong: "ĐH Hoa Sen", congTuyenSinh: "https://www.hoasen.edu.vn/tuyensinh" },
  HIU: { maTruong: "HIU", tenTruong: "ĐH Quốc tế Hồng Bàng", congTuyenSinh: "https://hiu.vn/tuyen-sinh" },
  NTT: { maTruong: "NTT", tenTruong: "ĐH Nguyễn Tất Thành", congTuyenSinh: "https://tuyensinh.ntt.edu.vn" },
  PKA: { maTruong: "PKA", tenTruong: "Trường Đại học Phenikaa", congTuyenSinh: "https://tuyensinh.phenikaa-uni.edu.vn" },
  SIU: { maTruong: "SIU", tenTruong: "ĐH Quốc tế Sài Gòn", congTuyenSinh: "https://siu.edu.vn/tuyen-sinh" },
  DTL: { maTruong: "DTL", tenTruong: "ĐH Thăng Long", congTuyenSinh: "https://thanglong.edu.vn/tuyen-sinh" },
  DDN: { maTruong: "DDN", tenTruong: "ĐH Đại Nam", congTuyenSinh: "https://tuyensinh.dainam.edu.vn" },
  DDU: { maTruong: "DDU", tenTruong: "ĐH Đông Đô", congTuyenSinh: "https://hdiu.edu.vn/tuyen-sinh" },
  VGU: { maTruong: "VGU", tenTruong: "ĐH Việt - Đức", congTuyenSinh: "https://vgu.edu.vn/vi/admission" },
  VHH: { maTruong: "VHH", tenTruong: "ĐH Văn Hiến", congTuyenSinh: "https://ts.vhu.edu.vn" },
  TTU: { maTruong: "TTU", tenTruong: "ĐH Tân Tạo", congTuyenSinh: "https://ttu.edu.vn/tuyen-sinh" },
  BVU: { maTruong: "BVU", tenTruong: "ĐH Bà Rịa - Vũng Tàu", congTuyenSinh: "https://bvu.edu.vn/tuyen-sinh" },
  DBH: { maTruong: "DBH", tenTruong: "Trường Đại học Quốc tế Bắc Hà", congTuyenSinh: "https://biu.edu.vn/tuyen-sinh" },
  C19: { maTruong: "C19", tenTruong: "Trường Cao đẳng Sư phạm Bắc Ninh", congTuyenSinh: "http://cdspbacninh.edu.vn" },
  C23: { maTruong: "C23", tenTruong: "Trường Cao đẳng Sư phạm Hòa Bình", congTuyenSinh: "http://cdsphoabinh.edu.vn" },
  C25: { maTruong: "C25", tenTruong: "Trường Cao đẳng Sư phạm Nam Định", congTuyenSinh: "http://cdspnamdinh.edu.vn" },
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

