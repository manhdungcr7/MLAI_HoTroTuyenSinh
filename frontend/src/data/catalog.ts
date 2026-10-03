/**
 * DATA CATALOG SSOT
 *
 * Nạp `programs-catalog.json` do `pipeline/publish.py` xuất từ `data/processed/programs.parquet`.
 * Mỗi dòng là một (trường, ngành, phương thức xét tuyển): điểm chuẩn của các phương thức
 * khác nhau không trộn lẫn. Học phí / tỷ lệ việc làm chỉ có khi đo được từ văn bản (null nếu không).
 * Không có dữ liệu soạn tay nào ghi đè lên số liệu từ đề án.
 */

import "@/data/school-rules";
import { AdmissionMethod, TargetProgram } from "@/engine/types";
import rawCatalog from "./programs-catalog.json";

export interface ProgramCatalogItem extends TargetProgram {
  programKey: string;
  majorLabel: string;
  cutoffs: Record<string, number>;
  latestYear?: number;
  latestScore?: number;
  yearlyTrendDelta: number;
  dataQuality: string;
  schoolProvince: string;
  /** Số năm có điểm chuẩn hợp lệ */
  yearsOfData: number;
  /** false khi đề án không ghi tổ hợp cho dòng này */
  combinationsVerified: boolean;
  /** Ngành có thi năng khiếu: 3 môn văn hoá không đủ để ước tính khả năng đỗ. */
  requiresAptitude: boolean;
}

type RawCatalogItem = Record<string, any>;

export const MIN_VALID_CUTOFF = 12;

// Dòng mà "tên ngành" thực ra là nhãn phương thức/tổ hợp/công thức do bảng PDF bị lệch cột.
const NON_MAJOR_NAME_PATTERN = /^\s*(\(|\+|tổ hợp|phương thức|xét |ptxt|lĩnh vực|\d+\s*$)|\(môn|x\s*\d\s*\)|\/\s*\d/i;
const APTITUDE_MAJOR_PATTERN =
  /năng khiếu|âm nhạc|mỹ thuật|thể chất|thanh nhạc|piano|hội họa|điêu khắc|biểu diễn|diễn viên|đạo diễn|nhiếp ảnh|múa|giáo dục mầm non|huấn luyện thể thao/i;
const MAJOR_CODE = /\b\d{4}\s?\d{3}\b/;

/** Làm sạch tên hiển thị: bỏ mã ngành, số chỉ tiêu, danh sách tổ hợp, hậu tố phương thức. */
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
      .replace(/\s*[-–(]*\s*(xét (kq|kết quả)[^)]*|tốt nghiệp thpt|tn ?thpt|thpt|học bạ|hb|kq thi|pt\s?\d+\w?|ptxt\s?\d*|nl|đgnl|đgtd)\)?\s*$/i, "")
      .replace(/[\s;,]+([A-Z]\d{2}|\d{1,4})$/, "")
      .replace(/^[\s;,-]+|[\s;,-]+$/g, "");
    if (next === s) break;
    s = next;
  }
  return s.length >= 3 ? s : raw;
}

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
  if (displayName.length < 4 || /^\d+$/.test(displayName)) return null;

  const cutoffs = sanitizeCutoffs(item.cutoffs);
  const years = Object.keys(cutoffs).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return null;

  const latestYear = years[years.length - 1];
  const latestScore = cutoffs[String(latestYear)];
  const p50 = typeof item.forecastP50 === "number" && item.forecastP50 >= MIN_VALID_CUTOFF && item.forecastP50 <= 30
    ? item.forecastP50
    : latestScore;
  const p10 = typeof item.forecastP10 === "number" ? Math.min(item.forecastP10, p50) : p50 - 1.5;
  const p90 = typeof item.forecastP90 === "number" ? Math.max(item.forecastP90, p50) : p50 + 1.5;
  const province = item.schoolProvince || "";
  const region = ["bac", "trung", "nam"].includes(item.region) ? item.region : undefined;

  return {
    programId: item.programId,
    programKey: item.programKey || item.programId,
    majorKey: item.majorKey,
    schoolCode: item.schoolCode,
    schoolName: item.schoolName || item.schoolCode,
    region,
    province,
    majorName: displayName,
    majorLabel: displayName,
    majorGroup: item.majorGroup || "other",
    admissionMethod: (item.admissionMethod || "THPT") as AdmissionMethod,
    methodInferred: Boolean(item.methodInferred),
    cutoff2021: cutoffs["2021"] ?? null,
    cutoff2022: cutoffs["2022"] ?? null,
    cutoff2023: cutoffs["2023"] ?? null,
    cutoff2024: cutoffs["2024"] ?? null,
    cutoffs,
    latestYear,
    latestScore,
    forecastP10: round(Math.max(0, p10)),
    forecastP50: round(p50),
    forecastP90: round(Math.min(30, p90)),
    yearlyTrendDelta: 0,
    tuitionVnd: typeof item.tuitionVnd === "number" ? item.tuitionVnd : null,
    employmentRate: typeof item.employmentRate === "number" ? item.employmentRate : null,
    dataQuality: years.length >= 3 ? "day_du" : years.length === 1 ? "chi_1_nam" : "thieu_mot_phan",
    yearsOfData: years.length,
    dataPassport: item.dataPassport || "Đề án tuyển sinh",
    sourceTier: item.sourceTier === "aggregator_verified" ? "aggregator_verified" : "official_pdf",
    sourceUrl: item.sourceUrl ?? null,
    combinations: Array.isArray(item.combinations) ? item.combinations : [],
    combinationsVerified: Boolean(item.combinationsVerified),
    requiresAptitude: APTITUDE_MAJOR_PATTERN.test(item.majorName || "") || item.admissionMethod === "NANG_KHIEU",
    schoolProvince: province,
  };
}

/** Toàn bộ chương trình–phương thức có ngưỡng điểm hợp lệ. */
export const ALL_PROGRAMS_CATALOG: ProgramCatalogItem[] = (rawCatalog as RawCatalogItem[])
  .map(toCatalogItem)
  .filter((p): p is ProgramCatalogItem => p !== null);

/** Tập chương trình dùng cho mọi engine (gợi ý, khám phá, so sánh, what-if, đòn bẩy môn). */
export const DECISION_PROGRAM_POOL: ProgramCatalogItem[] = ALL_PROGRAMS_CATALOG;


/** Tra cứu chương trình theo id. */
export function findProgramById(programId: string | null | undefined): ProgramCatalogItem | undefined {
  if (!programId) return undefined;
  return ALL_PROGRAMS_CATALOG.find((p) => p.programId === programId);
}

/** Thống kê minh bạch cho trang Dữ liệu & nguồn */
export const CATALOG_STATS = {
  rawRows: (rawCatalog as RawCatalogItem[]).length,
  usableRows: ALL_PROGRAMS_CATALOG.length,
  schools: new Set(ALL_PROGRAMS_CATALOG.map((p) => p.schoolCode)).size,
  majors: new Set(ALL_PROGRAMS_CATALOG.map((p) => p.majorKey || `${p.schoolCode}::${p.majorName}`)).size,
  withTuition: ALL_PROGRAMS_CATALOG.filter((p) => p.tuitionVnd !== null).length,
  withEmployment: ALL_PROGRAMS_CATALOG.filter((p) => p.employmentRate !== null).length,
  officialPdf: ALL_PROGRAMS_CATALOG.filter((p) => p.sourceTier === "official_pdf").length,
  aggregator: ALL_PROGRAMS_CATALOG.filter((p) => p.sourceTier === "aggregator_verified").length,
  byMethod: ALL_PROGRAMS_CATALOG.reduce<Record<string, number>>((acc, p) => {
    const m = p.admissionMethod ?? "THPT";
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {}),
  latestYear: Math.max(...ALL_PROGRAMS_CATALOG.map((p) => p.latestYear ?? 0)),
};
