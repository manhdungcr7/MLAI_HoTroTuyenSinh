/**
 * DATA CATALOG SSOT
 * Nạp `programs-catalog.json` (xuất từ pipeline) + ghép thông tin chuẩn hóa của GOLDEN_PROGRAMS,
 * sau đó chạy lớp làm sạch (sanitizeCatalog) để không đưa dữ liệu lỗi / placeholder vào engine.
 *
 * Quy tắc làm sạch (xem ba.md §5.1, chỉ tiêu D5):
 *  - Học phí = 24,000,000 và tỷ lệ việc làm = 92.5 là giá trị điền sẵn của pipeline (≈100% dòng) → null.
 *  - Điểm chuẩn < MIN_VALID_CUTOFF trên thang 30 không hợp lệ (thường là chỉ tiêu bị parse nhầm) → loại.
 *  - Dòng có tên là nhãn phương thức/tổ hợp thay vì tên ngành, hoặc là xét học bạ → loại
 *    (không so sánh được với điểm thi THPT).
 *  - Một số mã trường bị gán sai tên; chỉ sửa những mã có cùng kết luận với
 *    `pipeline/ingestion/normalizers/school.py`. Các mã còn nghi vấn: DATA_REQUIRED.
 */

import { TargetProgram } from "@/engine/types";
import { GOLDEN_PROGRAMS } from "@/data/universities";
import rawCatalog from "./programs-catalog.json";

export interface ProgramCatalogItem extends TargetProgram {
  programKey: string;
  majorLabel: string;
  cutoffs: Record<string, number>;
  latestYear?: number;
  latestScore?: number;
  yearlyTrendDelta: number;
  betaProgram: number;
  idioStd: number;
  dataQuality: string;
  schoolProvince: string;
  /** Số năm có điểm chuẩn hợp lệ sau khi làm sạch */
  yearsOfData: number;
  /** false khi danh sách tổ hợp là mặc định [A00, A01, D01] của pipeline, chưa đối chiếu đề án */
  combinationsVerified: boolean;
}

type RawCatalogItem = Record<string, any>;

export const PLACEHOLDER_TUITION_VND = 24_000_000;
export const PLACEHOLDER_EMPLOYMENT_RATE = 92.5;
export const MIN_VALID_CUTOFF = 12;
const PLACEHOLDER_COMBINATIONS = "A00,A01,D01";

// Tên dòng là nhãn phương thức/tổ hợp hoặc xét học bạ (HB/KHHB) — không so sánh được với điểm thi THPT
const NON_MAJOR_NAME_PATTERN = /^\s*(\(|\+|tổ hợp|phương thức|xét |ptxt|\d+\s*$)|học bạ|\bKHHB\b|\bHB\b/i;
// Ngành cần thi năng khiếu: điểm 3 môn văn hóa không đủ để ước tính khả năng đỗ
const APTITUDE_MAJOR_PATTERN =
  /năng khiếu|âm nhạc|mỹ thuật|thể chất|thanh nhạc|piano|hội họa|điêu khắc|biểu diễn|diễn viên|đạo diễn|nhiếp ảnh|múa|giáo dục mầm non/i;
const MAJOR_CODE = /\b\d{4}\s?\d{3}\b/;

/** Làm sạch tên hiển thị: bỏ mã ngành 7 số, số chỉ tiêu, danh sách tổ hợp, hậu tố phương thức. */
export function cleanMajorName(raw: string): string {
  let s = raw.trim()
    .replace(/^(-\s*|ct chuẩn\s*|chương trình đào tạo ngành\s+)/i, "")
    .replace(/^\d{6,}\S*\s+/, "")
    .replace(/^\d{2}(_[A-Za-z]+(\s[A-Z])?)?\s+/, "");
  const m = s.match(MAJOR_CODE);
  if (m && m.index !== undefined) {
    const before = s.slice(0, m.index).replace(/[\s\-–:_]+$/, "");
    const after = s.slice(m.index + m[0].length).replace(/^[\s\-–:_]+/, "");
    s = before.includes(" ") && before.length >= 6 ? before : after;
    s = s.split(MAJOR_CODE)[0].trim();
  }
  s = s.replace(/\s*[-–]\s*phương thức.*$/i, "");
  for (let i = 0; i < 6; i++) {
    const next = s
      .replace(/\s*[-–(]*\s*(xét (kq|kết quả)[^)]*|tốt nghiệp thpt|tn ?thpt|thpt|pt\s?\d+|ptxt\s?\d*)\)?\s*$/i, "")
      .replace(/[\s;,]+([A-Z]\d{2}|\d{1,4})$/, "")
      .replace(/^[\s;,-]+|[\s;,-]+$/g, "");
    if (next === s) break;
    s = next;
  }
  return s.length >= 3 ? s : raw;
}

// Bảng đối chiếu tỉnh/thành phố và vùng miền cho 100% 57 trường đại học trong hệ thống
export const SCHOOL_PROVINCES: Record<string, { schoolName: string; province: string; region: "bac" | "trung" | "nam" }> = {
  ANS: { schoolName: "Học viện An ninh Nhân dân", province: "Hà Nội", region: "bac" },
  BKA: { schoolName: "ĐH Bách Khoa Hà Nội", province: "Hà Nội", region: "bac" },
  C19: { schoolName: "ĐH Khoa học Tự nhiên - ĐHQGHN", province: "Hà Nội", region: "bac" },
  C23: { schoolName: "Trường CĐ Sư phạm Hòa Bình", province: "Hòa Bình", region: "bac" },
  C25: { schoolName: "Trường CĐ Sư phạm Nam Định", province: "Nam Định", region: "bac" },
  CSS: { schoolName: "ĐH Cảnh sát Nhân dân", province: "TP.HCM", region: "nam" },
  D61: { schoolName: "Học viện Ngân hàng", province: "Hà Nội", region: "bac" },
  D64: { schoolName: "ĐH Thương mại", province: "Hà Nội", region: "bac" },
  DBL: { schoolName: "ĐH Bạc Liêu", province: "Bạc Liêu", region: "nam" },
  DCN: { schoolName: "ĐH Công nghiệp Hà Nội", province: "Hà Nội", region: "bac" },
  DDF: { schoolName: "ĐH Ngoại ngữ - ĐH Đà Nẵng", province: "Đà Nẵng", region: "trung" },
  DDP: { schoolName: "ĐH Sư phạm Kỹ thuật - ĐH Đà Nẵng", province: "Đà Nẵng", region: "trung" },
  DDQ: { schoolName: "ĐH Kinh tế - ĐH Đà Nẵng", province: "Đà Nẵng", region: "trung" },
  DDS: { schoolName: "ĐH Sư phạm - ĐH Đà Nẵng", province: "Đà Nẵng", region: "trung" },
  DDY: { schoolName: "Khoa Y Dược - ĐH Đà Nẵng", province: "Đà Nẵng", region: "trung" },
  DFA: { schoolName: "ĐH Tài chính - Marketing", province: "TP.HCM", region: "nam" },
  DHC: { schoolName: "ĐH Nông Lâm - ĐH Huế", province: "Huế", region: "trung" },
  DHD: { schoolName: "ĐH Ngoại ngữ - ĐH Huế", province: "Huế", region: "trung" },
  DHK: { schoolName: "ĐH Kinh tế - ĐH Huế", province: "Huế", region: "trung" },
  DHL: { schoolName: "ĐH Luật - ĐH Huế", province: "Huế", region: "trung" },
  DHN: { schoolName: "ĐH Nghệ thuật - ĐH Huế", province: "Huế", region: "trung" },
  DHS: { schoolName: "ĐH Sư phạm - ĐH Huế", province: "Huế", region: "trung" },
  DHY: { schoolName: "ĐH Y Dược - ĐH Huế", province: "Huế", region: "trung" },
  DPY: { schoolName: "ĐH Phú Yên", province: "Phú Yên", region: "trung" },
  DQB: { schoolName: "ĐH Quảng Bình", province: "Quảng Bình", region: "trung" },
  DQH: { schoolName: "ĐH Hồng Đức", province: "Thanh Hóa", region: "trung" },
  DTL: { schoolName: "ĐH Thăng Long", province: "Hà Nội", region: "bac" },
  DTN: { schoolName: "ĐH Tây Nguyên", province: "Đắk Lắk", region: "trung" },
  DTV: { schoolName: "ĐH Trà Vinh", province: "Trà Vinh", region: "nam" },
  DVL: { schoolName: "ĐH Văn Lang", province: "TP.HCM", region: "nam" },
  GHA: { schoolName: "ĐH Giao thông Vận tải", province: "Hà Nội", region: "bac" },
  GSA: { schoolName: "ĐH Giao thông Vận tải Cơ sở 2", province: "TP.HCM", region: "nam" },
  GTA: { schoolName: "ĐH Giao thông Vận tải", province: "Hà Nội", region: "bac" },
  HCB: { schoolName: "Học viện Cán bộ TP.HCM", province: "TP.HCM", region: "nam" },
  HCN: { schoolName: "ĐH Công nghiệp TP.HCM", province: "TP.HCM", region: "nam" },
  HCS: { schoolName: "Học viện Chính sách và Phát triển", province: "Hà Nội", region: "bac" },
  HHT: { schoolName: "Học viện Hậu cần", province: "Hà Nội", region: "bac" },
  HTC: { schoolName: "Học viện Tài chính", province: "Hà Nội", region: "bac" },
  LPH: { schoolName: "ĐH Luật Hà Nội", province: "Hà Nội", region: "bac" },
  QHI: { schoolName: "ĐH Công nghệ - ĐHQGHN", province: "Hà Nội", region: "bac" },
  QHL: { schoolName: "ĐH Luật - ĐHQGHN", province: "Hà Nội", region: "bac" },
  QHQ: { schoolName: "ĐH Kinh tế - ĐHQGHN", province: "Hà Nội", region: "bac" },
  QHY: { schoolName: "ĐH Y Dược - ĐHQGHN", province: "Hà Nội", region: "bac" },
  QST: { schoolName: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM", province: "TP.HCM", region: "nam" },
  QSX: { schoolName: "ĐH KHXH&NV - ĐHQG TP.HCM", province: "TP.HCM", region: "nam" },
  QSY: { schoolName: "Khoa Y - ĐHQG TP.HCM", province: "TP.HCM", region: "nam" },
  SDU: { schoolName: "ĐH Sao Đỏ", province: "Hải Dương", region: "bac" },
  SPD: { schoolName: "ĐH Đồng Tháp", province: "Đồng Tháp", region: "nam" },
  SPS: { schoolName: "ĐH Sư phạm TP.HCM", province: "TP.HCM", region: "nam" },
  TDV: { schoolName: "ĐH Vinh", province: "Nghệ An", region: "trung" },
  TSN: { schoolName: "ĐH Nha Trang", province: "Khánh Hòa", region: "trung" },
  TTN: { schoolName: "ĐH Tiền Giang", province: "Tiền Giang", region: "nam" },
  TTU: { schoolName: "ĐH Tân Tạo", province: "Long An", region: "nam" },
  TYS: { schoolName: "ĐH Y tế Công cộng", province: "Hà Nội", region: "bac" },
  VHH: { schoolName: "ĐH Văn Hiến", province: "TP.HCM", region: "nam" },
  XDA: { schoolName: "ĐH Xây dựng Hà Nội", province: "Hà Nội", region: "bac" },
  YHB: { schoolName: "ĐH Y Hà Nội", province: "Hà Nội", region: "bac" },
};

function round(n: number, digits = 2): number {
  return Number(n.toFixed(digits));
}

function sanitizeCutoffs(cutoffs: Record<string, number> | undefined): Record<string, number> {
  const clean: Record<string, number> = {};
  for (const [year, score] of Object.entries(cutoffs || {})) {
    if (typeof score === "number" && score >= MIN_VALID_CUTOFF && score <= 30) clean[year] = score;
  }
  return clean;
}

function toCatalogItem(item: RawCatalogItem): ProgramCatalogItem | null {
  const displayName = cleanMajorName(item.majorName || "");
  if (NON_MAJOR_NAME_PATTERN.test(item.majorName || "") || NON_MAJOR_NAME_PATTERN.test(displayName)) return null;
  if (APTITUDE_MAJOR_PATTERN.test(item.majorName || "")) return null;

  // Loại trừ dữ liệu bóc tách trùng lặp / rác:
  // 1. Trường chuyên biệt Đại học Huế (Nông Lâm DHC, Ngoại ngữ DHD, Kinh tế DHK, Luật DHL, Nghệ thuật DHN)
  //    bị crawler clone toàn bộ ngành CNTT từ trường khác thuộc ĐH Huế.
  if (["DHC", "DHD", "DHK", "DHL", "DHN"].includes(item.schoolCode) && item.majorGroup === "cntt") return null;

  // 2. Dòng bắt đầu bằng dấu gạch ngang và có số chỉ tiêu ở cuối từ bảng điểm chuẩn bóc tách lỗi
  if (/^\s*-\s*/.test(item.majorName || "") && /\s+\d{1,3}$/.test(item.majorName || "")) return null;

  // 3. Tên ngành ngắn bất thường hoặc chỉ có ký tự số
  if (displayName.length < 4 || /^\d+$/.test(displayName)) return null;

  const cutoffs = sanitizeCutoffs(item.cutoffs);
  const years = Object.keys(cutoffs).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return null;

  const latestYear = years[years.length - 1];
  const latestScore = cutoffs[String(latestYear)];

  // Pipeline đặt P50 = điểm năm gần nhất; giữ nguyên độ rộng dải nhưng neo lại nếu năm gần nhất bị loại
  const spreadLow = Math.max(0.5, (item.forecastP50 ?? latestScore) - (item.forecastP10 ?? latestScore - 1.2));
  const spreadHigh = Math.max(0.5, (item.forecastP90 ?? latestScore + 1.2) - (item.forecastP50 ?? latestScore));
  const p50 = typeof item.forecastP50 === "number" && item.forecastP50 >= MIN_VALID_CUTOFF && item.forecastP50 <= 30
    ? item.forecastP50
    : latestScore;

  const schoolMeta = SCHOOL_PROVINCES[item.schoolCode];
  const golden = GOLDEN_PROGRAMS.find(
    (g) => g.schoolCode === item.schoolCode && g.majorName.toLowerCase().includes(String(item.majorName).toLowerCase().slice(0, 10))
  );

  const tuitionVnd = item.tuitionVnd && item.tuitionVnd !== PLACEHOLDER_TUITION_VND ? item.tuitionVnd : null;
  const employmentRate =
    item.employmentRate && item.employmentRate !== PLACEHOLDER_EMPLOYMENT_RATE ? item.employmentRate : null;
  const province = golden?.province || schoolMeta?.province || item.schoolProvince || "Hà Nội";
  const region = golden?.region || schoolMeta?.region || item.region || (["bac", "trung", "nam"].includes(item.region) ? item.region : "bac");
  const schoolName = golden?.schoolName || schoolMeta?.schoolName || item.schoolName;

  return {
    programId: golden ? golden.programId : item.programId,
    programKey: item.programKey || item.programId,
    schoolCode: item.schoolCode,
    schoolName,
    region,
    province,

    majorName: golden ? golden.majorName : displayName,
    majorLabel: golden ? golden.majorName : displayName, // tên đã làm sạch (tên gốc còn trong programKey)
    majorGroup: golden ? golden.majorGroup : item.majorGroup,
    cutoff2021: golden?.cutoff2021 ?? cutoffs["2021"] ?? null,
    cutoff2022: golden?.cutoff2022 ?? cutoffs["2022"] ?? null,
    cutoff2023: golden?.cutoff2023 ?? cutoffs["2023"] ?? null,
    cutoff2024: golden?.cutoff2024 ?? cutoffs["2024"] ?? null,
    cutoffs,
    latestYear,
    latestScore,
    forecastP10: golden ? golden.forecastP10 : round(p50 - spreadLow),
    forecastP50: golden ? golden.forecastP50 : round(p50),
    forecastP90: golden ? golden.forecastP90 : round(Math.min(30, p50 + spreadHigh)),
    yearlyTrendDelta: round(item.yearlyTrendDelta || 0),
    tuitionVnd: golden ? golden.tuitionVnd : tuitionVnd,
    employmentRate: golden ? golden.employmentRate : employmentRate,
    aiExposure: golden ? golden.aiExposure : item.aiExposure,
    leverageScore: golden ? golden.leverageScore : item.leverageScore,
    betaProgram: round(item.betaProgram || 1.0),
    idioStd: round(item.idioStd || 1.28, 3),
    dataQuality: years.length >= 3 ? "day_du" : years.length === 1 ? "chi_1_nam" : "thieu_mot_phan",
    yearsOfData: years.length,
    dataPassport: golden ? golden.dataPassport : item.dataPassport,
    combinations: golden ? golden.combinations : item.combinations,
    combinationsVerified: Boolean(golden) || (item.combinations || []).join(",") !== PLACEHOLDER_COMBINATIONS,
    schoolProvince: province,
  };
}

export const ALL_PROGRAMS_CATALOG: ProgramCatalogItem[] = (rawCatalog as RawCatalogItem[])
  .map(toCatalogItem)
  .filter((p): p is ProgramCatalogItem => p !== null);

const GOLDEN_CATALOG_ITEMS: ProgramCatalogItem[] = GOLDEN_PROGRAMS.map(
  (g): ProgramCatalogItem => {
    const cutoffs: Record<string, number> = {};
    ([["2021", g.cutoff2021], ["2022", g.cutoff2022], ["2023", g.cutoff2023], ["2024", g.cutoff2024]] as const).forEach(
      ([year, v]) => {
        if (typeof v === "number") cutoffs[year] = v;
      }
    );
    const years = Object.keys(cutoffs).map(Number);
    const latestYear = years.length > 0 ? Math.max(...years) : undefined;
    return {
      ...g,
      programKey: g.programId,
      majorLabel: g.majorName,
      cutoffs,
      latestYear,
      latestScore: latestYear ? cutoffs[String(latestYear)] : undefined,
      yearlyTrendDelta: 0,
      betaProgram: 1.0,
      idioStd: 1.28,
      dataQuality: "day_du",
      yearsOfData: 4,
      combinationsVerified: true,
      region: g.region || "bac",
      schoolProvince: g.province || "Hà Nội",
    };
  }
);

/**
 * Tập chương trình DUY NHẤT cho mọi engine (gợi ý, khám phá, so sánh, what-if, ROI):
 * Các chương trình chuẩn hóa GOLDEN được ưu tiên lên đầu, kế đến là catalog đã làm sạch.
 */
export const DECISION_PROGRAM_POOL: ProgramCatalogItem[] = [
  ...GOLDEN_CATALOG_ITEMS,
  ...ALL_PROGRAMS_CATALOG.filter(
    (c) =>
      !GOLDEN_PROGRAMS.some(
        (g) => g.programId === c.programId || (g.schoolCode === c.schoolCode && g.majorName.toLowerCase() === c.majorName.toLowerCase())
      )
  ),
];

/** Thống kê minh bạch cho trang Dữ liệu & nguồn */
export const CATALOG_STATS = {
  rawRows: (rawCatalog as RawCatalogItem[]).length,
  usableRows: ALL_PROGRAMS_CATALOG.length,
  schools: new Set(ALL_PROGRAMS_CATALOG.map((p) => p.schoolCode)).size,
  withTuition: ALL_PROGRAMS_CATALOG.filter((p) => p.tuitionVnd !== null).length,
  withEmployment: ALL_PROGRAMS_CATALOG.filter((p) => p.employmentRate !== null).length,
  latestYear: Math.max(...ALL_PROGRAMS_CATALOG.map((p) => p.latestYear ?? 0)),
};
