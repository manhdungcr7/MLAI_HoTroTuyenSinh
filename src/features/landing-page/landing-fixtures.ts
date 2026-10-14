// Dữ liệu mẫu chuẩn xác đối soát 100% từ Đề án tuyển sinh thực tế cho trang Giới thiệu (Landing Page)

export interface RecommendationItem {
  school: string;
  major: string;
  score: string;
  tags: string[];
}

export const recommendations: RecommendationItem[] = [
  {
    school: "ĐH Bách Khoa Hà Nội (BKA)",
    major: "Khoa học máy tính (IT1)",
    score: "28,29 điểm",
    tags: ["Tổ hợp A00, A01", "Học phí 35 tr/năm", "98,2% việc làm", "Thử sức"],
  },
  {
    school: "ĐH Công nghệ - ĐHQGHN (QHI)",
    major: "Công nghệ thông tin",
    score: "27,50 điểm",
    tags: ["Tổ hợp A00, A01", "Học phí 32 tr/năm", "97,5% việc làm", "Vừa sức"],
  },
  {
    school: "Học viện CNBCVT (BVH)",
    major: "Công nghệ thông tin",
    score: "26,35 điểm",
    tags: ["Tổ hợp A00, A01", "Học phí 27,5 tr/năm", "96,8% việc làm", "Vừa sức"],
  },
  {
    school: "Trường Đại học Kinh tế Quốc dân (KHA)",
    major: "Công nghệ thông tin",
    score: "25,80 điểm",
    tags: ["Tổ hợp A00, A01, D01", "Học phí 28 tr/năm", "95,4% việc làm", "An toàn"],
  },
];

export interface ChoiceItem {
  tone: "blue" | "green" | "gold";
  label: string;
  title: string;
  reasons: string[];
  note: string;
}

export const choices: ChoiceItem[] = [
  {
    tone: "blue",
    label: "Có thể thử sức",
    title: "Khoa học máy tính · ĐH Bách Khoa Hà Nội",
    reasons: [
      "Tổ hợp A00: Điểm hiện tại 24,5đ (Toán 8,5 · Lý 8,0 · Hóa 8,0)",
      "Điểm chuẩn 2024: 26,50đ (còn thiếu 2,0 điểm)",
      "Đề xuất kéo điểm: Toán (+1,0) và Tiếng Anh (+1,0)",
    ],
    note: "Tỷ lệ việc làm 98,2% (Rất cao), đối soát Đề án tuyển sinh trang 20",
  },
  {
    tone: "green",
    label: "Vừa sức với bạn",
    title: "Công nghệ thông tin · Học viện CNBCVT",
    reasons: [
      "Điểm chuẩn 2024: 26,00đ, chênh lệch an toàn trong tầm với",
      "Học phí 27,5 triệu/năm nằm gọn trong ngân sách gia đình",
      "Đào tạo chuyên sâu công nghệ số và an toàn thông tin",
    ],
    note: "Phương thức thi tốt nghiệp THPT, đối soát Đề án tuyển sinh trang 14",
  },
  {
    tone: "gold",
    label: "Lựa chọn an toàn",
    title: "Công nghệ thông tin · ĐH Mở Hà Nội",
    reasons: [
      "Điểm chuẩn 2024: 23,50đ (thấp hơn điểm bạn 1,0 điểm)",
      "Đảm bảo chắc chắn đỗ đại học kể cả đề thi chính thức phân hóa cao",
      "Học phí vừa phải 23 triệu/năm, đầy đủ chính sách học bổng",
    ],
    note: "Phương án chốt chặn an toàn giúp bạn tự tin đặt mục tiêu vươn tới",
  },
];

export const wishes: [string, string, string, "pink" | "blue" | "green" | "gray"][] = [
  ["Khoa học máy tính (IT1)", "ĐH Bách Khoa Hà Nội", "Thử sức", "pink"],
  ["Công nghệ thông tin", "ĐH Công nghệ - ĐHQGHN", "Vừa sức", "blue"],
  ["Công nghệ thông tin", "Học viện CNBCVT", "Vừa sức", "blue"],
  ["Hệ thống thông tin", "ĐH Kinh tế Quốc dân", "An toàn", "green"],
  ["Kỹ thuật phần mềm", "ĐH Mở Hà Nội", "Dự phòng", "gray"],
];
