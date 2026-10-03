/**
 * MODULE ADMISSIONS: XÁC SUẤT TRÚNG TUYỂN & TÍCH PHÂN RỦI RO DANH MỤC
 * Đảm bảo: File < 350 lines, Zero UI dependencies, Pure Math & Deterministic.
 */

/** Năm tuyển sinh cần dự báo; dữ liệu càng cũ so với năm này thì độ bất định càng lớn. */
export const FORECAST_YEAR = 2027;
/** Chương trình chỉ có 1 năm dữ liệu dao động mạnh hơn (đo trên hai năm giữ lại: 1.14 và 1.47 lần). */
export const THIN_DATA_MULTIPLIER = 1.3;

/**
 * Hệ số nhân độ bất định của một chương trình: căn bậc hai số năm kể từ dữ liệu gần nhất (độ lệch tích lũy
 * như bước ngẫu nhiên) và hệ số cho chương trình chỉ có 1 năm dữ liệu. Cùng công thức với pipeline/features/build.py.
 */
export function sigmaScaleFor(latestYear: number | undefined | null, yearsOfData: number | undefined | null): number {
  const age = Math.max(1, FORECAST_YEAR - (latestYear ?? FORECAST_YEAR - 1));
  return Math.sqrt(age) * ((yearsOfData ?? 0) <= 1 ? THIN_DATA_MULTIPLIER : 1);
}

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
  idioStd = getActiveIdioStd(),
  sigmaScale = 1.0
): number {
  if (typeof userScore !== "number" || !Number.isFinite(userScore) ||
      typeof forecastP50 !== "number" || !Number.isFinite(forecastP50)) {
    return 0.5; // Trung lập an toàn khi dữ liệu khuyết
  }

  const safeBeta = Number.isFinite(beta) && beta > 0 ? beta : 1.0;
  const safeShock = Number.isFinite(shockStd) && shockStd > 0 ? shockStd : DEFAULT_NATIONAL_SHOCK_STD;
  const safeIdio = Number.isFinite(idioStd) && idioStd > 0 ? idioStd : DEFAULT_IDIO_STD;

  const variance = safeBeta * safeBeta * safeShock * safeShock + safeIdio * safeIdio;
  const safeScale = Number.isFinite(sigmaScale) && sigmaScale > 0 ? sigmaScale : 1.0;
  const sigma = Math.sqrt(Math.max(0.01, variance)) * safeScale;
  const z = (userScore - forecastP50) / sigma;
  return normalCDF(z);
}

/**
 * Tính xác suất trượt tất cả P(Fail All) qua 15 điểm nút Gauss-Hermite
 * Hoàn toàn xác định (không lấy mẫu ngẫu nhiên)
 */
/**
 * Phần phương sai riêng của điểm chuẩn (ngoài cú sốc chung toàn quốc) dùng chung giữa các ngành của cùng một trường.
 * Đo từ dữ liệu: sau khi trừ mức thay đổi trung bình toàn quốc, hiệp phương sai giữa các ngành cùng trường cùng năm
 * bằng khoảng 23% phương sai (15.329 cặp, các năm 2023–2025). Nhiều ngành cùng trường vì vậy không độc lập hoàn toàn.
 */
export const SCHOOL_SHARED_VARIANCE_SHARE = 0.23;

export function calculatePortfolioFailAll(
  wishlist: { userScore: number; forecastP50: number; beta?: number; sigmaScale?: number; schoolCode?: string }[],
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
  const rho = SCHOOL_SHARED_VARIANCE_SHARE;

  // Nhóm theo trường: ngành cùng trường dùng chung một cú sốc riêng của trường. Ngành không rõ trường tự thành một nhóm.
  const groups = new Map<string, typeof validWishlist>();
  validWishlist.forEach((w, i) => {
    const key = w.schoolCode ? `s:${w.schoolCode}` : `i:${i}`;
    const list = groups.get(key);
    if (list) list.push(w);
    else groups.set(key, [w]);
  });

  let totalIntegral = 0;
  const sqrtPi = Math.sqrt(Math.PI);
  const sqrt2 = Math.SQRT2;

  for (let m = 0; m < 15; m++) {
    const x_m = GH_NODES[m];
    const w_m = GH_WEIGHTS[m];
    let jointSurvivalAtNode = 1.0;

    for (const group of groups.values()) {
      // Với cú sốc chung đã biết, các trường độc lập nhau: kỳ vọng theo cú sốc của trường rồi nhân các trường lại.
      const shared = group.length > 1;
      let schoolSurvival = 0;
      const innerNodes = shared ? 15 : 1;
      for (let k = 0; k < innerNodes; k++) {
        const z2 = shared ? sqrt2 * GH_NODES[k] : 0;
        const wk = shared ? GH_WEIGHTS[k] / sqrtPi : 1;
        let survive = 1.0;
        for (const w of group) {
          const beta = Number.isFinite(w.beta) && (w.beta ?? 0) > 0 ? (w.beta as number) : 1.0;
          const scale = Number.isFinite(w.sigmaScale) && (w.sigmaScale ?? 0) > 0 ? (w.sigmaScale as number) : 1.0;
          // Độ bất định riêng của chương trình khớp với xác suất từng nguyện vọng: σ_i² = (β·shock)² + idio_i².
          const sigmaI2 = scale * scale * (beta * beta * safeShock * safeShock + safeIdio * safeIdio);
          const idioI = Math.sqrt(Math.max(0.01, sigmaI2 - beta * beta * safeShock * safeShock));
          const sharedPart = shared ? Math.sqrt(rho) * idioI * z2 : 0;
          const ownStd = shared ? Math.sqrt(1 - rho) * idioI : idioI;
          const conditionalCutoff = w.forecastP50 + sqrt2 * beta * safeShock * x_m + sharedPart;
          const pAdmit = normalCDF((w.userScore - conditionalCutoff) / ownStd);
          survive *= Math.max(0.0, Math.min(1.0, 1.0 - pAdmit));
        }
        schoolSurvival += wk * survive;
      }
      jointSurvivalAtNode *= schoolSurvival;
    }

    totalIntegral += w_m * jointSurvivalAtNode;
  }

  const pFailAll = totalIntegral / sqrtPi;
  return Math.max(0.0, Math.min(1.0, pFailAll));
}

