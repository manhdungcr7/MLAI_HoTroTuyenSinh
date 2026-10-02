/**
 * MODULE ADMISSIONS: XÁC SUẤT TRÚNG TUYỂN & TÍCH PHÂN RỦI RO DANH MỤC
 * Đảm bảo: File < 350 lines, Zero UI dependencies, Pure Math & Deterministic.
 */

export const DEFAULT_NATIONAL_SHOCK_STD = 1.29; // Cú sốc đề thi khó/dễ toàn quốc (mặc định)
export const DEFAULT_IDIO_STD = 1.28;           // Nhiễu riêng của từng trường đại học (mặc định)

let activeNationalShockStd = DEFAULT_NATIONAL_SHOCK_STD;
let activeIdioStd = DEFAULT_IDIO_STD;

export function configureShockParameters(shockStd?: number | null, idioStd?: number | null) {
  if (typeof shockStd === "number" && shockStd > 0) activeNationalShockStd = shockStd;
  if (typeof idioStd === "number" && idioStd > 0) activeIdioStd = idioStd;
}

export function getActiveNationalShockStd(): number {
  return activeNationalShockStd;
}

export function getActiveIdioStd(): number {
  return activeIdioStd;
}

export const NATIONAL_SHOCK_STD = DEFAULT_NATIONAL_SHOCK_STD;
export const IDIO_STD = DEFAULT_IDIO_STD;

// Ngưỡng phân nhóm dùng chung cho mọi màn hình (Thử sức / Phù hợp / An toàn)
export const SAFE_MIN_PROB = 0.8;
export const REACH_MAX_PROB = 0.4;

export type AdmissionRole = "mao_hiem" | "vua_tam" | "an_toan";

export function classifyRole(admitProbability: number): AdmissionRole {
  if (admitProbability >= SAFE_MIN_PROB) return "an_toan";
  if (admitProbability < REACH_MAX_PROB) return "mao_hiem";
  return "vua_tam";
}

// ============================================================================
// 15 ĐIỂM NÚT VÀ TRỌNG SỐ GAUSS-HERMITE CHO TÍCH PHÂN P(FAIL ALL)
// Nghiệm chuẩn xác từ đa thức trực giao Hermite (roots_hermite 15, tổng trọng số = sqrt(pi))
// ============================================================================
export const GH_NODES = [
  -4.499990707309, -3.669950373404, -2.967166927906, -2.325732486174, -1.719992575186,
  -1.136115585211, -0.565069583256, 0.0, 0.565069583256, 1.136115585211,
  1.719992575186, 2.325732486174, 2.967166927906, 3.669950373404, 4.499990707309,
];

export const GH_WEIGHTS = [
  0.000000001522, 0.000001059116, 0.000100004441, 0.002778068843, 0.030780033873,
  0.158488915796, 0.412028687499, 0.564100308726, 0.412028687499, 0.158488915796,
  0.030780033873, 0.002778068843, 0.000100004441, 0.000001059116, 0.000000001522,
];

/**
 * Hàm phân phối chuẩn tích lũy Gaussian CDF Phi(z)
 * Xấp xỉ giải tích Abramowitz & Stegun 7.1.26 - Sai số cực đại < 1.5 x 10^-7, latency < 0.001ms.
 */
export function normalCDF(z: number): number {
  if (z > 6.0) return 1.0;
  if (z < -6.0) return 0.0;

  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c2 = 0.3989422804014327; // 1 / sqrt(2 * PI)

  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1.0 - c2 * Math.exp(-0.5 * absZ * absZ) * poly;

  return z >= 0 ? cdf : 1.0 - cdf;
}

/**
 * Tính xác suất trúng tuyển từng nguyện vọng (Closed-form)
 * Bảo vệ chống số NaN, Infinite, hoặc tham số phương sai phi lý.
 */
export function calculateAdmitProbability(
  userScore: number,
  forecastP50: number,
  beta = 1.0,
  shockStd = getActiveNationalShockStd(),
  idioStd = getActiveIdioStd()
): number {
  if (typeof userScore !== "number" || !Number.isFinite(userScore) ||
      typeof forecastP50 !== "number" || !Number.isFinite(forecastP50)) {
    return 0.5; // Trung lập an toàn khi dữ liệu khuyết
  }

  const safeBeta = Number.isFinite(beta) && beta > 0 ? beta : 1.0;
  const safeShock = Number.isFinite(shockStd) && shockStd > 0 ? shockStd : DEFAULT_NATIONAL_SHOCK_STD;
  const safeIdio = Number.isFinite(idioStd) && idioStd > 0 ? idioStd : DEFAULT_IDIO_STD;

  const variance = safeBeta * safeBeta * safeShock * safeShock + safeIdio * safeIdio;
  const sigma = Math.sqrt(Math.max(0.01, variance));
  const z = (userScore - forecastP50) / sigma;
  return normalCDF(z);
}

/**
 * Tính xác suất trượt tất cả P(Fail All) qua 15 điểm nút Gauss-Hermite
 * Hoàn toàn xác định (không lấy mẫu ngẫu nhiên)
 */
export function calculatePortfolioFailAll(
  wishlist: { userScore: number; forecastP50: number; beta?: number }[],
  shockStd = getActiveNationalShockStd(),
  idioStd = getActiveIdioStd()
): number {
  if (!wishlist || wishlist.length === 0) return 1.0;

  // Lọc sạch các nguyện vọng có dữ liệu không hợp lệ
  const validWishlist = wishlist.filter(
    (w) => typeof w.userScore === "number" && Number.isFinite(w.userScore) &&
           typeof w.forecastP50 === "number" && Number.isFinite(w.forecastP50)
  );
  if (validWishlist.length === 0) return 1.0;

  const safeShock = Number.isFinite(shockStd) && shockStd > 0 ? shockStd : DEFAULT_NATIONAL_SHOCK_STD;
  const safeIdio = Number.isFinite(idioStd) && idioStd > 0 ? idioStd : DEFAULT_IDIO_STD;

  let totalIntegral = 0;
  const sqrtPi = Math.sqrt(Math.PI);
  const sqrt2 = Math.SQRT2;

  for (let m = 0; m < 15; m++) {
    const x_m = GH_NODES[m];
    const w_m = GH_WEIGHTS[m];
    let jointSurvivalAtNode = 1.0;

    for (const w of validWishlist) {
      const beta = Number.isFinite(w.beta) && (w.beta ?? 0) > 0 ? (w.beta as number) : 1.0;
      const conditionalCutoff = w.forecastP50 + sqrt2 * beta * safeShock * x_m;
      const z_cond = (w.userScore - conditionalCutoff) / safeIdio;
      const p_admit_cond = normalCDF(z_cond);
      jointSurvivalAtNode *= Math.max(0.0, Math.min(1.0, 1.0 - p_admit_cond));
    }

    totalIntegral += w_m * jointSurvivalAtNode;
  }

  const pFailAll = totalIntegral / sqrtPi;
  return Math.max(0.0, Math.min(1.0, pFailAll));
}

