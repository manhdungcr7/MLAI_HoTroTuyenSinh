/**
 * DATA UNIVERSITIES: TỔ HỢP MÔN & NHÃN VIỆT HÓA
 *
 * Từ kỳ thi 2025 (chương trình GDPT 2018) có thêm Tin học, Công nghệ công nghiệp,
 * Công nghệ nông nghiệp và GDKT&PL (thay GDCD), kéo theo các tổ hợp mã X.
 * Nghĩa các mã X được đối chiếu với định nghĩa ghi trong chính đề án 2025–2026 của
 * các trường (vd "X06 (Toán, Vật lí, Tin học)"). Mã chưa có định nghĩa rõ trong văn bản
 * thì không đưa vào, để không tính điểm sai môn.
 */

export const COMBINATION_SUBJECTS: Record<string, string[]> = {
  A00: ["toan", "ly", "hoa"],
  A01: ["toan", "ly", "anh"],
  A02: ["toan", "ly", "sinh"],
  A07: ["toan", "su", "dia"],
  A08: ["toan", "su", "gdcd"],
  A09: ["toan", "dia", "gdcd"],
  B00: ["toan", "hoa", "sinh"],
  B03: ["toan", "sinh", "van"],
  B08: ["toan", "sinh", "anh"],
  C00: ["van", "su", "dia"],
  C01: ["van", "toan", "ly"],
  C02: ["van", "toan", "hoa"],
  C03: ["van", "toan", "su"],
  C04: ["van", "toan", "dia"],
  C05: ["van", "ly", "hoa"],
  C08: ["van", "hoa", "sinh"],
  C14: ["van", "toan", "gdcd"],
  C19: ["van", "su", "gdcd"],
  C20: ["van", "dia", "gdcd"],
  D01: ["toan", "van", "anh"],
  D07: ["toan", "hoa", "anh"],
  D08: ["toan", "sinh", "anh"],
  D09: ["toan", "su", "anh"],
  D10: ["toan", "dia", "anh"],
  D11: ["van", "ly", "anh"],
  D12: ["van", "hoa", "anh"],
  D13: ["van", "sinh", "anh"],
  D14: ["van", "su", "anh"],
  D15: ["van", "dia", "anh"],
  D66: ["van", "gdcd", "anh"],
  D84: ["toan", "gdcd", "anh"],
  ...buildXCombinations(),
};

/**
 * Khối Toán X01–X24: Toán + môn thứ hai (Văn, Lý, Hóa, Sinh, Sử, Địa) + lần lượt
 * GDKT&PL / Tin / Công nghệ CN / Công nghệ NN. X25–X28: Toán + một trong bốn môn đó + Anh.
 * Khối Văn X70–X81 theo cùng quy luật với môn thứ hai Sử, Địa, rồi + Anh.
 */
function buildXCombinations(): Record<string, string[]> {
  const third = ["gdcd", "tin", "cncn", "cnnn"];
  const out: Record<string, string[]> = {};
  const code = (n: number) => `X${String(n).padStart(2, "0")}`;
  ["van", "ly", "hoa", "sinh", "su", "dia"].forEach((second, i) => {
    third.forEach((t, j) => {
      out[code(1 + i * 4 + j)] = ["toan", second, t];
    });
  });
  third.forEach((t, j) => {
    out[code(25 + j)] = ["toan", t, "anh"];
  });
  out.X53 = ["toan", "gdcd", "tin"];
  out.X66 = ["van", "sinh", "gdcd"];
  ["su", "dia"].forEach((second, i) => {
    third.forEach((t, j) => {
      out[code(70 + i * 4 + j)] = ["van", second, t];
    });
  });
  third.forEach((t, j) => {
    out[code(78 + j)] = ["van", t, "anh"];
  });
  return out;
}

export const SUBJECT_LABELS_VI: Record<string, string> = {
  toan: "Toán",
  van: "Ngữ văn",
  anh: "Tiếng Anh",
  ly: "Vật lý",
  hoa: "Hóa học",
  sinh: "Sinh học",
  su: "Lịch sử",
  dia: "Địa lý",
  gdcd: "GDKT&PL",
  tin: "Tin học",
  cncn: "Công nghệ công nghiệp",
  cnnn: "Công nghệ nông nghiệp",
};

/** Môn thi tốt nghiệp THPT từ 2025: bắt buộc Toán, Ngữ văn + 2 môn tự chọn. */
export const EXAM_REQUIRED_SUBJECTS = ["toan", "van"] as const;
export const EXAM_ELECTIVE_SUBJECTS = ["anh", "ly", "hoa", "sinh", "su", "dia", "gdcd", "tin", "cncn", "cnnn"] as const;

/** Tên đầy đủ của tổ hợp, vd "X06 (Toán, Vật lý, Tin học)". */
export function combinationLabel(code: string): string {
  const subjects = COMBINATION_SUBJECTS[code];
  if (!subjects) return code;
  return `${code} (${subjects.map((s) => SUBJECT_LABELS_VI[s] ?? s).join(", ")})`;
}

export const MAJOR_GROUPS: Record<string, string> = {
  cntt: "Công nghệ thông tin & Khoa học máy tính",
  kinh_te: "Kinh tế, Tài chính & Quản trị kinh doanh",
  y_duoc: "Y khoa, Dược học & Sức khỏe",
  ky_thuat: "Kỹ thuật, Cơ khí & Tự động hóa",
  luat: "Luật & Khoa học xã hội",
  su_pham: "Sư phạm & Ngôn ngữ học",
  truyen_thong: "Truyền thông & Marketing số",
};
