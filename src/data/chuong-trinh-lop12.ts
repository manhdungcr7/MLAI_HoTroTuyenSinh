// Chương trình học lớp 12 theo bộ sách KẾT NỐI TRI THỨC, 6 môn: dùng cho kế hoạch học theo tiến độ và chatbot hỏi tiến độ.
//
// NGUỒN: tên chương và tên bài lấy từ mục lục sách trên loigiaihay.com (cào ngày 17/10/2026, xem scripts/ và tuan_docs/23).
// `canNam` là 2 đến 4 ý ngắn do nhóm viết DỰA TRÊN TÊN BÀI, không phải trích từ sách. Chưa có người học môn đó duyệt (daDuyet = false):
// giao diện phải nói rõ "dữ liệu chưa duyệt" và học sinh đối chiếu với sách. Không thêm nội dung nào không suy được từ tên bài.
// Phạm vi: CHỈ lớp 12 và CHỈ bộ Kết nối tri thức. Chủ đề lớp 10–11 hay bộ sách khác KHÔNG có ở đây: chatbot phải nói là chưa có dữ liệu.
import type { MonId } from "@/state/types";

export interface ChuDeHoc {
  /** Mã ổn định, không đổi khi sửa tên. */
  id: string;
  mon: MonId;
  /** Tên chương (hoặc tên bài với Ngữ văn, tên unit với Tiếng Anh), đúng như mục lục sách. Cũng là khóa lưu tiến độ (hoSo.tienDoKienThuc). */
  ten: string;
  nhom?: string;
  /** Tên các bài trong chương, đúng như mục lục sách. */
  bai: string[];
  canNam: string[];
  /** Từ khóa để hiểu câu gõ tự do (không dấu, chữ thường). */
  tuKhoa: string[];
  /** id chủ đề nên vững trước. */
  tienQuyet?: string[];
  daDuyet: boolean;
}

export const NGUON_CHUONG_TRINH = {
  boSach: "Kết nối tri thức",
  lop: 12,
  nguon: "Mục lục sách giáo khoa trên loigiaihay.com",
  ngayLay: "2026-10-17",
  daDoiChieuSachIn: false,
} as const;

const ch = (c: Omit<ChuDeHoc, "daDuyet">): ChuDeHoc => ({ ...c, daDuyet: false });

export const CHU_DE_LOP12: ChuDeHoc[] = [
  // ---------- Toán 12 ----------
  ch({ id: "toan-12-ung-dung-dao-ham", mon: "toan", ten: "Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số", nhom: "Giải tích",
    bai: ["Tính đơn điệu và cực trị của hàm số", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Đường tiệm cận của đồ thị hàm số", "Khảo sát sự biến thiên và vẽ đồ thị hàm số", "Ứng dụng đạo hàm để giải quyết một số vấn đề liên quan đến thực tiễn"],
    canNam: ["Xét tính đơn điệu và tìm cực trị của hàm số bằng đạo hàm", "Tìm giá trị lớn nhất, nhỏ nhất và đường tiệm cận", "Khảo sát, vẽ đồ thị hàm số và giải bài toán thực tiễn"],
    tuKhoa: ["dao ham", "don dieu", "cuc tri", "tiem can", "khao sat ham so", "ve do thi", "do thi ham so", "gtln", "gtnn", "gia tri lon nhat", "gia tri nho nhat"] }),
  ch({ id: "toan-12-vecto-he-truc-toa-do", mon: "toan", ten: "Vectơ và hệ trục tọa độ trong không gian", nhom: "Hình học",
    bai: ["Vectơ trong không gian", "Hệ trục tọa độ trong không gian", "Biểu thức tọa độ của các phép toán vectơ"],
    canNam: ["Vectơ và các phép toán vectơ trong không gian", "Hệ trục tọa độ Oxyz, tọa độ điểm và vectơ", "Biểu thức tọa độ của các phép toán vectơ"],
    tuKhoa: ["vecto", "he truc toa do", "oxyz", "toa do vecto", "toa do diem", "hinh hoc"] }),
  ch({ id: "toan-12-so-dac-trung-mau-ghep-nhom", mon: "toan", ten: "Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm", nhom: "Thống kê và xác suất",
    bai: ["Khoảng biến thiên và khoảng tứ phân vị", "Phương sai và độ lệch chuẩn"],
    canNam: ["Khoảng biến thiên và khoảng tứ phân vị của mẫu số liệu ghép nhóm", "Phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm"],
    tuKhoa: ["thong ke", "mau so lieu", "ghep nhom", "khoang bien thien", "tu phan vi", "phuong sai", "do lech chuan", "so dac trung"] }),
  ch({ id: "toan-12-nguyen-ham-tich-phan", mon: "toan", ten: "Nguyên hàm và tích phân", nhom: "Giải tích",
    bai: ["Nguyên hàm", "Tích phân", "Ứng dụng hình học của tích phân"],
    canNam: ["Nguyên hàm và cách tìm nguyên hàm", "Tích phân và các tính chất", "Ứng dụng hình học của tích phân (diện tích, thể tích)"],
    tuKhoa: ["nguyen ham", "tich phan", "dien tich hinh phang", "the tich vat the"] }),
  ch({ id: "toan-12-phuong-phap-toa-do-khong-gian", mon: "toan", ten: "Phương pháp tọa độ trong không gian", nhom: "Hình học", tienQuyet: ["toan-12-vecto-he-truc-toa-do"],
    bai: ["Phương trình mặt phẳng", "Phương trình đường thẳng trong không gian", "Công thức tính góc trong không gian", "Phương trình mặt cầu"],
    canNam: ["Phương trình mặt phẳng và phương trình đường thẳng trong không gian", "Công thức tính góc trong không gian", "Phương trình mặt cầu"],
    tuKhoa: ["phuong trinh mat phang", "mat phang", "phuong trinh duong thang", "duong thang trong khong gian", "mat cau", "goc trong khong gian", "phuong phap toa do", "hinh hoc khong gian", "hinh hoc"] }),
  ch({ id: "toan-12-xac-suat-co-dieu-kien", mon: "toan", ten: "Xác suất có điều kiện", nhom: "Thống kê và xác suất",
    bai: ["Xác suất có điều kiện", "Công thức xác suất toàn phần và công thức Bayes"],
    canNam: ["Xác suất có điều kiện", "Công thức xác suất toàn phần và công thức Bayes"],
    tuKhoa: ["xac suat", "bayes", "xac suat toan phan", "xac suat co dieu kien"] }),

  // ---------- Vật lí 12 ----------
  ch({ id: "ly-12-vat-li-nhiet", mon: "vatLy", ten: "Vật lí nhiệt", nhom: "Nhiệt học",
    bai: ["Cấu trúc của chất. Sự chuyển thể", "Nội năng. Định luật I của nhiệt động lực học", "Nhiệt độ, thang nhiệt độ, nhiệt kế", "Nhiệt dung riêng", "Nhiệt nóng chảy riêng", "Nhiệt hóa hơi riêng", "Bài tập vật lí nhiệt"],
    canNam: ["Cấu trúc của chất và sự chuyển thể", "Nội năng và định luật I của nhiệt động lực học", "Nhiệt độ, nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hóa hơi riêng"],
    tuKhoa: ["vat li nhiet", "vat ly nhiet", "nhiet dong luc hoc", "noi nang", "nhiet dung rieng", "nhiet nong chay", "nhiet hoa hoi", "chuyen the", "nhiet ke", "nhiet do"] }),
  ch({ id: "ly-12-khi-li-tuong", mon: "vatLy", ten: "Khí lí tưởng", nhom: "Nhiệt học",
    bai: ["Mô hình động học phân tử chất khí", "Định luật Boyle", "Định luật Charles", "Phương trình trạng thái của khí lí tưởng", "Bài tập về khí lí tưởng", "Áp suất khí theo mô hình động học phân tử. Động năng phân tử và nhiệt độ"],
    canNam: ["Mô hình động học phân tử chất khí", "Định luật Boyle, định luật Charles và phương trình trạng thái khí lí tưởng", "Áp suất khí và động năng phân tử"],
    tuKhoa: ["khi li tuong", "khi ly tuong", "boyle", "charles", "phuong trinh trang thai", "dong hoc phan tu", "ap suat khi"] }),
  ch({ id: "ly-12-tu-truong", mon: "vatLy", ten: "Từ trường", nhom: "Điện từ",
    bai: ["Từ trường", "Lực từ tác dụng lên dây dẫn mang dòng điện. Cảm ứng từ", "Từ thông. Hiện tượng cảm ứng điện từ", "Đàn ghi ta điện. Máy biến áp", "Máy phát điện xoay chiều", "Điện từ trường. Mô hình sóng điện từ"],
    canNam: ["Từ trường, lực từ và cảm ứng từ", "Từ thông và hiện tượng cảm ứng điện từ", "Máy biến áp, máy phát điện xoay chiều; điện từ trường và sóng điện từ"],
    tuKhoa: ["tu truong", "luc tu", "cam ung tu", "tu thong", "cam ung dien tu", "may bien ap", "may phat dien", "dien tu truong", "song dien tu", "dien xoay chieu"] }),
  ch({ id: "ly-12-vat-li-hat-nhan", mon: "vatLy", ten: "Vật lí hạt nhân", nhom: "Hạt nhân",
    bai: ["Cấu trúc hạt nhân", "Phản ứng hạt nhân và năng lượng liên kết", "Hiện tượng phóng xạ", "Công nghiệp hạt nhân"],
    canNam: ["Cấu trúc hạt nhân", "Phản ứng hạt nhân và năng lượng liên kết", "Hiện tượng phóng xạ"],
    tuKhoa: ["hat nhan", "phong xa", "phan ung hat nhan", "nang luong lien ket", "cong nghiep hat nhan"] }),

  // ---------- Hóa học 12 ----------
  ch({ id: "hoa-12-ester-lipid", mon: "hoaHoc", ten: "Ester – Lipid", nhom: "Hóa hữu cơ",
    bai: ["Ester – Lipid", "Xà phòng và chất giặt rửa"],
    canNam: ["Ester và lipid", "Xà phòng và chất giặt rửa"],
    tuKhoa: ["ester", "este", "lipid", "lipit", "chat beo", "xa phong", "chat giat rua"] }),
  ch({ id: "hoa-12-carbohydrate", mon: "hoaHoc", ten: "Carbohydrate", nhom: "Hóa hữu cơ",
    bai: ["Giới thiệu về carbohydrate. Glucose và fructose", "Saccharose và maltose", "Tinh bột và cellulose"],
    canNam: ["Glucose và fructose", "Saccharose và maltose", "Tinh bột và cellulose"],
    tuKhoa: ["carbohydrate", "cacbohidrat", "glucose", "glucozo", "fructose", "saccharose", "saccarozo", "maltose", "tinh bot", "cellulose", "xenlulozo"] }),
  ch({ id: "hoa-12-hop-chat-nitrogen", mon: "hoaHoc", ten: "Hợp chất chứa nitrogen", nhom: "Hóa hữu cơ",
    bai: ["Amine", "Amino acid và peptide", "Protein và enzyme"],
    canNam: ["Amine", "Amino acid và peptide", "Protein và enzyme"],
    tuKhoa: ["nitrogen", "amine", "amin", "amino acid", "aminoaxit", "peptide", "peptit", "protein", "enzyme", "enzim"] }),
  ch({ id: "hoa-12-polymer", mon: "hoaHoc", ten: "Polymer", nhom: "Hóa hữu cơ",
    bai: ["Đại cương về polymer", "Vật liệu polymer"],
    canNam: ["Đại cương về polymer", "Vật liệu polymer"],
    tuKhoa: ["polymer", "polime", "vat lieu polymer", "tao to", "cao su", "nhua"] }),
  ch({ id: "hoa-12-pin-dien-dien-phan", mon: "hoaHoc", ten: "Pin điện và điện phân", nhom: "Hóa vô cơ và đại cương",
    bai: ["Thế điện cực và nguồn điện hóa học", "Điện phân"],
    canNam: ["Thế điện cực và nguồn điện hóa học (pin điện)", "Điện phân"],
    tuKhoa: ["pin dien", "dien phan", "the dien cuc", "nguon dien hoa hoc", "dien cuc"] }),
  ch({ id: "hoa-12-dai-cuong-kim-loai", mon: "hoaHoc", ten: "Đại cương về kim loại", nhom: "Hóa vô cơ và đại cương",
    bai: ["Cấu tạo và liên kết trong tinh thể kim loại", "Tính chất vật lí và tính chất hóa học của kim loại", "Kim loại trong tự nhiên và phương pháp tách kim loại", "Hợp kim", "Sự ăn mòn kim loại"],
    canNam: ["Cấu tạo, tính chất vật lí và tính chất hóa học của kim loại", "Phương pháp tách kim loại và hợp kim", "Sự ăn mòn kim loại"],
    tuKhoa: ["dai cuong ve kim loai", "kim loai", "hop kim", "an mon kim loai", "tinh the kim loai"] }),
  ch({ id: "hoa-12-nhom-ia-iia", mon: "hoaHoc", ten: "Nguyên tố nhóm IA và nhóm IIA", nhom: "Hóa vô cơ và đại cương",
    bai: ["Nguyên tố nhóm IA", "Nguyên tố nhóm IIA"],
    canNam: ["Nguyên tố nhóm IA", "Nguyên tố nhóm IIA"],
    tuKhoa: ["nhom ia", "nhom iia", "kim loai kiem", "kiem tho", "nhom 1a", "nhom 2a"] }),
  ch({ id: "hoa-12-kim-loai-chuyen-tiep-phuc-chat", mon: "hoaHoc", ten: "Sơ lược về dãy kim loại chuyển tiếp thứ nhất và phức chất", nhom: "Hóa vô cơ và đại cương",
    bai: ["Đại cương về kim loại chuyển tiếp dãy thứ nhất", "Sơ lược về phức chất", "Một số tính chất và ứng dụng của phức chất"],
    canNam: ["Đại cương về kim loại chuyển tiếp dãy thứ nhất", "Sơ lược về phức chất, tính chất và ứng dụng"],
    tuKhoa: ["kim loai chuyen tiep", "phuc chat"] }),

  // ---------- Sinh học 12 ----------
  ch({ id: "sinh-12-di-truyen-phan-tu", mon: "sinh", ten: "Di truyền phân tử", nhom: "Di truyền học",
    bai: ["DNA và cơ chế tái bản DNA", "Gene, quá trình truyền đạt thông tin di truyền và hệ gene", "Điều hòa biểu hiện của gene", "Đột biến gene", "Công nghệ di truyền", "Thực hành: Tách chiết DNA"],
    canNam: ["DNA và cơ chế tái bản DNA", "Gene, truyền đạt thông tin di truyền và điều hòa biểu hiện gene", "Đột biến gene và công nghệ di truyền"],
    tuKhoa: ["di truyen phan tu", "dna", "adn", "tai ban", "gene", "gen", "dot bien gene", "dieu hoa bieu hien", "cong nghe di truyen"] }),
  ch({ id: "sinh-12-di-truyen-nhiem-sac-the", mon: "sinh", ten: "Di truyền nhiễm sắc thể", nhom: "Di truyền học", tienQuyet: ["sinh-12-di-truyen-phan-tu"],
    bai: ["Cấu trúc và chức năng của NST", "Học thuyết di truyền của Menđel", "Mở rộng học thuyết Menđel", "Di truyền giới tính và di truyền liên kết với giới tính", "Liên kết gene và hoán vị gene", "Đột biến NST", "Di truyền học người và di truyền y học", "Thực hành: Quan sát một số dạng đột biến NST"],
    canNam: ["Cấu trúc, chức năng của NST và học thuyết Menđel (cùng phần mở rộng)", "Di truyền giới tính, liên kết gene và hoán vị gene", "Đột biến NST, di truyền học người và di truyền y học"],
    tuKhoa: ["nhiem sac the", "nst", "mendel", "mendel", "menden", "hoan vi gene", "lien ket gene", "di truyen gioi tinh", "dot bien nst", "di truyen hoc nguoi", "quy luat di truyen"] }),
  ch({ id: "sinh-12-mo-rong-hoc-thuyet-di-truyen-nst", mon: "sinh", ten: "Mở rộng học thuyết di truyền nhiễm sắc thể", nhom: "Di truyền học", tienQuyet: ["sinh-12-di-truyen-nhiem-sac-the"],
    bai: ["Di truyền gene ngoài nhân", "Tương tác giữa kiểu gene với môi trường và thành tựu chọn giống", "Thực hành: Thí nghiệm về thường biến ở cây trồng"],
    canNam: ["Di truyền gene ngoài nhân", "Tương tác giữa kiểu gene với môi trường và thành tựu chọn giống"],
    tuKhoa: ["gene ngoai nhan", "ngoai nhan", "thuong bien", "chon giong", "kieu gene voi moi truong"] }),
  ch({ id: "sinh-12-di-truyen-quan-the", mon: "sinh", ten: "Di truyền quần thể", nhom: "Di truyền học", tienQuyet: ["sinh-12-di-truyen-nhiem-sac-the"],
    bai: ["Di truyền quần thể"],
    canNam: ["Di truyền quần thể"],
    tuKhoa: ["di truyen quan the", "quan the di truyen", "can bang di truyen"] }),
  ch({ id: "sinh-12-bang-chung-hoc-thuyet-tien-hoa", mon: "sinh", ten: "Bằng chứng và các học thuyết tiến hóa", nhom: "Tiến hóa",
    bai: ["Các bằng chứng tiến hóa", "Học thuyết Darwin về chọn lọc tự nhiên và hình thành loài", "Học thuyết tiến hóa tổng hợp hiện đại", "Tiến hóa lớn và quá trình phát sinh chủng loại"],
    canNam: ["Các bằng chứng tiến hóa", "Học thuyết Darwin và học thuyết tiến hóa tổng hợp hiện đại", "Tiến hóa lớn và quá trình phát sinh chủng loại"],
    tuKhoa: ["tien hoa", "darwin", "chon loc tu nhien", "hinh thanh loai", "bang chung tien hoa"] }),
  ch({ id: "sinh-12-moi-truong-sinh-thai-quan-the", mon: "sinh", ten: "Môi trường và sinh thái học quần thể", nhom: "Sinh thái học",
    bai: ["Môi trường và các nhân tố sinh thái", "Sinh thái học quần thể", "Thực hành: Xác định khu vực phân bố, kiểu phân bố cá thể và ước tính kích thước mật độ của quần thể thực vật hoặc động vật ít di chuyển"],
    canNam: ["Môi trường và các nhân tố sinh thái", "Sinh thái học quần thể"],
    tuKhoa: ["moi truong", "nhan to sinh thai", "sinh thai hoc quan the", "quan the sinh vat", "sinh thai quan the"] }),
  ch({ id: "sinh-12-sinh-thai-quan-xa", mon: "sinh", ten: "Sinh thái học quần xã", nhom: "Sinh thái học",
    bai: ["Quần xã sinh vật", "Thực hành: Tìm hiểu một số đặc trưng cơ bản của quần xã trong tự nhiên", "Hệ sinh thái", "Trao đổi chất và chuyển hóa năng lượng trong hệ sinh thái", "Diễn thế", "Sinh quyển, khu sinh học và chu trình sinh - địa - hóa", "Thực hành: Thiết kế một hệ sinh thái nhân tạo"],
    canNam: ["Quần xã sinh vật và hệ sinh thái", "Trao đổi chất và chuyển hóa năng lượng trong hệ sinh thái", "Diễn thế, sinh quyển, khu sinh học và chu trình sinh - địa - hóa"],
    tuKhoa: ["quan xa", "he sinh thai", "dien the", "sinh quyen", "chu trinh sinh dia hoa", "chuoi thuc an", "sinh thai quan xa"] }),
  ch({ id: "sinh-12-phuc-hoi-bao-ton-ben-vung", mon: "sinh", ten: "Sinh thái học phục hồi, bảo tồn và phát triển bền vững", nhom: "Sinh thái học",
    bai: ["Sinh thái học phục hồi và bảo tồn đa dạng", "Phát triển bền vững", "Dự án: Tìm hiểu thực trạng bảo tồn sinh thái ở địa phương và đề xuất giải pháp bảo tồn"],
    canNam: ["Sinh thái học phục hồi và bảo tồn đa dạng sinh học", "Phát triển bền vững"],
    tuKhoa: ["bao ton", "phuc hoi", "phat trien ben vung", "da dang sinh hoc"] }),

  // ---------- Ngữ văn 12 (mỗi bài là một chủ đề) ----------
  ch({ id: "van-12-bai-1", mon: "nguVan", ten: "Bài 1: Khả năng lớn lao của tiểu thuyết", nhom: "Tập 1",
    bai: [], canNam: ["Đặc điểm của thể loại tiểu thuyết", "Đọc hiểu các văn bản trong bài"], tuKhoa: ["tieu thuyet", "bai 1"] }),
  ch({ id: "van-12-bai-2", mon: "nguVan", ten: "Bài 2: Những thế giới thơ", nhom: "Tập 1",
    bai: [], canNam: ["Đặc điểm của thơ", "Đọc hiểu các văn bản thơ trong bài"], tuKhoa: ["the gioi tho", "tho", "bai 2"] }),
  ch({ id: "van-12-bai-3", mon: "nguVan", ten: "Bài 3: Lập luận trong văn bản nghị luận", nhom: "Tập 1",
    bai: [], canNam: ["Cách lập luận trong văn bản nghị luận", "Đọc hiểu văn bản nghị luận"], tuKhoa: ["lap luan", "nghi luan", "bai 3"] }),
  ch({ id: "van-12-bai-4", mon: "nguVan", ten: "Bài 4: Yếu tố kì ảo trong truyện kể", nhom: "Tập 1",
    bai: [], canNam: ["Yếu tố kì ảo trong truyện kể", "Đọc hiểu các truyện kể trong bài"], tuKhoa: ["ki ao", "yeu to ki ao", "truyen ke", "bai 4"] }),
  ch({ id: "van-12-bai-5", mon: "nguVan", ten: "Bài 5: Tiếng cười của hài kịch", nhom: "Tập 1",
    bai: [], canNam: ["Đặc điểm của hài kịch", "Đọc hiểu các văn bản trong bài"], tuKhoa: ["hai kich", "tieng cuoi", "bai 5"] }),
  ch({ id: "van-12-bai-6", mon: "nguVan", ten: "Bài 6: Hồ Chí Minh - \"Văn hóa phải soi đường cho quốc dân đi\"", nhom: "Tập 2",
    bai: [], canNam: ["Văn hóa trong tư tưởng và tác phẩm của Hồ Chí Minh", "Đọc hiểu các văn bản trong bài"], tuKhoa: ["ho chi minh", "van hoa phai soi duong", "bai 6"] }),
  ch({ id: "van-12-bai-7", mon: "nguVan", ten: "Bài 7: Sự thật trong tác phẩm kí", nhom: "Tập 2",
    bai: [], canNam: ["Đặc điểm của thể loại kí", "Đọc hiểu các văn bản kí trong bài"], tuKhoa: ["tac pham ki", "the ki", "ki", "bai 7"] }),
  ch({ id: "van-12-bai-8", mon: "nguVan", ten: "Bài 8: Dữ liệu trong văn bản thông tin", nhom: "Tập 2",
    bai: [], canNam: ["Dữ liệu trong văn bản thông tin", "Đọc hiểu văn bản thông tin"], tuKhoa: ["van ban thong tin", "du lieu trong van ban", "bai 8"] }),
  ch({ id: "van-12-bai-9", mon: "nguVan", ten: "Bài 9: Văn học và cuộc đời", nhom: "Tập 2",
    bai: [], canNam: ["Mối quan hệ giữa văn học và cuộc đời", "Đọc hiểu các văn bản trong bài"], tuKhoa: ["van hoc va cuoc doi", "bai 9"] }),

  // ---------- Tiếng Anh 12 Global Success (mỗi unit là một chủ đề; Review không tách riêng) ----------
  ch({ id: "anh-12-unit-1", mon: "tiengAnh", ten: "Unit 1. Life stories we admire", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về chủ đề cuộc đời đáng ngưỡng mộ", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 1", "life stories"] }),
  ch({ id: "anh-12-unit-2", mon: "tiengAnh", ten: "Unit 2. A multicultural world", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về thế giới đa văn hóa", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 2", "multicultural"] }),
  ch({ id: "anh-12-unit-3", mon: "tiengAnh", ten: "Unit 3. Green living", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về lối sống xanh", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 3", "green living"] }),
  ch({ id: "anh-12-unit-4", mon: "tiengAnh", ten: "Unit 4. Urbanisation", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về đô thị hóa", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 4", "urbanisation", "urbanization"] }),
  ch({ id: "anh-12-unit-5", mon: "tiengAnh", ten: "Unit 5. The world of work", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về thế giới việc làm", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 5", "world of work"] }),
  ch({ id: "anh-12-unit-6", mon: "tiengAnh", ten: "Unit 6. Artificial intelligence", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về trí tuệ nhân tạo", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 6", "artificial intelligence"] }),
  ch({ id: "anh-12-unit-7", mon: "tiengAnh", ten: "Unit 7. The world of mass media", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về truyền thông đại chúng", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 7", "mass media"] }),
  ch({ id: "anh-12-unit-8", mon: "tiengAnh", ten: "Unit 8. Wildlife conservation", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về bảo tồn động vật hoang dã", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 8", "wildlife"] }),
  ch({ id: "anh-12-unit-9", mon: "tiengAnh", ten: "Unit 9. Career paths", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về con đường sự nghiệp", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 9", "career paths"] }),
  ch({ id: "anh-12-unit-10", mon: "tiengAnh", ten: "Unit 10. Lifelong learning", nhom: "Global Success", bai: [],
    canNam: ["Từ vựng và cụm từ về học tập suốt đời", "Đọc hiểu, nghe và viết về chủ đề này"], tuKhoa: ["unit 10", "lifelong"] }),
];

/**
 * Chủ đề THUỘC LỚP 10–11 mà học sinh hay nhắc (ví dụ "dao động sóng" của Vật lí 11). Dùng để chatbot nói ĐÚNG sự thật:
 * "chủ đề này không nằm trong dữ liệu lớp 12", thay vì đoán hoặc bịa. Danh sách ngắn, chỉ ghi tên lớp, không mô tả nội dung.
 */
export const NGOAI_PHAM_VI_LOP12: { mon: MonId; tuKhoa: string[]; ten: string; lop: string }[] = [
  { mon: "vatLy", ten: "Dao động", tuKhoa: ["dao dong"], lop: "11" },
  { mon: "vatLy", ten: "Sóng", tuKhoa: ["song co", "song am", "giao thoa", "song dung", "song"], lop: "11" },
  { mon: "vatLy", ten: "Điện trường", tuKhoa: ["dien truong", "tu dien"], lop: "11" },
  { mon: "vatLy", ten: "Dòng điện, mạch điện", tuKhoa: ["dong dien khong doi", "mach dien"], lop: "11" },
  { mon: "toan", ten: "Hàm số mũ và logarit", tuKhoa: ["logarit", "ham so mu", "mu va logarit", "phuong trinh mu"], lop: "11" },
  { mon: "toan", ten: "Dãy số, cấp số", tuKhoa: ["day so", "cap so cong", "cap so nhan"], lop: "11" },
  { mon: "toan", ten: "Giới hạn", tuKhoa: ["gioi han"], lop: "11" },
  { mon: "toan", ten: "Quan hệ vuông góc trong không gian", tuKhoa: ["quan he vuong goc", "duong thang vuong goc"], lop: "11" },
  { mon: "hoaHoc", ten: "Hydrocarbon, dẫn xuất halogen, alcohol, phenol, carbonyl, carboxylic", tuKhoa: ["hydrocarbon", "hidrocacbon", "ancol", "alcohol", "phenol", "andehit", "axit cacboxylic", "carboxylic", "alkane", "ankan", "alkene", "anken"], lop: "11" },
  { mon: "hoaHoc", ten: "Cân bằng hóa học, nitrogen và sulfur", tuKhoa: ["can bang hoa hoc", "sulfur", "luu huynh", "nito", "amoniac"], lop: "11" },
  { mon: "sinh", ten: "Trao đổi chất, cảm ứng, sinh trưởng, sinh sản", tuKhoa: ["quang hop", "ho hap", "cam ung", "sinh truong", "sinh san", "trao doi chat"], lop: "11" },
];

export const chuDeCuaMon = (mon: MonId): ChuDeHoc[] => CHU_DE_LOP12.filter((c) => c.mon === mon);
export const timChuDeTheoId = (id: string): ChuDeHoc | undefined => CHU_DE_LOP12.find((c) => c.id === id);
export const timChuDeTheoTen = (ten: string): ChuDeHoc | undefined => CHU_DE_LOP12.find((c) => c.ten === ten);
