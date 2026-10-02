/**
 * DATA UNIVERSITIES: TỔ HỢP MÔN & NHÃN VIỆT HÓA
 */

export const COMBINATION_SUBJECTS: Record<string, string[]> = {
  A00: ["toan", "ly", "hoa"],
  A01: ["toan", "ly", "anh"],
  A02: ["toan", "ly", "sinh"],
  B00: ["toan", "hoa", "sinh"],
  C00: ["van", "su", "dia"],
  C01: ["van", "toan", "ly"],
  C03: ["van", "toan", "su"],
  C04: ["van", "toan", "dia"],
  D01: ["toan", "van", "anh"],
  D07: ["toan", "hoa", "anh"],
  D08: ["toan", "sinh", "anh"],
  D09: ["toan", "su", "anh"],
  D10: ["toan", "dia", "anh"],
  D14: ["van", "su", "anh"],
  D15: ["van", "dia", "anh"],
};

export const SUBJECT_LABELS_VI: Record<string, string> = {
  toan: "Toán",
  van: "Ngữ văn",
  anh: "Tiếng Anh",
  ly: "Vật lý",
  hoa: "Hóa học",
  sinh: "Sinh học",
  su: "Lịch sử",
  dia: "Địa lý",
  gdcd: "GDCD",
};

export const MAJOR_GROUPS: Record<string, string> = {
  cntt: "Công nghệ thông tin & Khoa học máy tính",
  kinh_te: "Kinh tế, Tài chính & Quản trị kinh doanh",
  y_duoc: "Y khoa, Dược học & Sức khỏe",
  ky_thuat: "Kỹ thuật, Cơ khí & Tự động hóa",
  luat: "Luật & Khoa học xã hội",
  su_pham: "Sư phạm & Ngôn ngữ học",
  truyen_thong: "Truyền thông & Marketing số",
};
