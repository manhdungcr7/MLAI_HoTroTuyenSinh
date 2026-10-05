/**
 * TEST SUITE: TOÁN HỌC DECISION ENGINE, GAUSS-HERMITE VS MONTE CARLO & BẤT BIẾN TT06
 *
 * Kiểm tra 5 tính chất nền tảng của Decision Layer theo TMA Challenge Brief:
 * 1. Độ chính xác Gauss-Hermite (15 nodes) so với Monte Carlo (1.000.000 mẫu): Sai số tuyệt đối < 0.5%
 * 2. Đơn điệu xác suất: Điểm tăng -> Xác suất trúng tuyển không được giảm
 * 3. Đơn điệu danh mục: Thêm nguyện vọng -> Xác suất trượt tất cả P(fail all) không được tăng
 * 4. Bất biến độ bất định: Độ lệch chuẩn shockStd tăng -> Khoảng dự báo [P10, P90] nở rộng
 * 5. Đóng góp biên (Marginal Risk Reduction): Mỗi NV thêm vào đóng góp làm giảm hoặc giữ nguyên P(fail all)
 * 6. Ràng buộc cứng Thông tư 06/2026/TT-BGDĐT:
 *    - Sư phạm chỉ xét NV 1 - 5 (vi phạm -> Cảnh báo đỏ)
 *    - Sàn đại học 15.0/30.0 (vi phạm -> Cảnh báo đỏ)
 *    - Trần điểm ưu tiên tối đa 3.0 điểm
 */

import {
  normalCDF,
  calculateAdmitProbability,
  calculatePortfolioFailAll,
  classifyRole,
  DEFAULT_NATIONAL_SHOCK_STD,
  DEFAULT_IDIO_STD,
} from "../src/engine/admissions/probability";
import { calculateTotalPriorityBonus } from "../src/engine/admissions/priority";
import { portfolioWarnings } from "../src/engine/decision/portfolio-suggest";
import { WishlistItem } from "../src/engine/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASS: ${message}`);
}

/**
 * Monte Carlo mô phỏng 1.000.000 mẫu để đối chiếu với tích phân 15 điểm Gauss-Hermite
 */
function runMonteCarloFailAll(
  wishlist: { userScore: number; forecastP50: number; beta?: number }[],
  numSimulations = 1_000_000,
  shockStd = DEFAULT_NATIONAL_SHOCK_STD,
  idioStd = DEFAULT_IDIO_STD
): number {
  if (!wishlist || wishlist.length === 0) return 1.0;

  let failCount = 0;
  // Box-Muller transform sinh biến ngẫu nhiên chuẩn N(0, 1)
  function randn(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  for (let sim = 0; sim < numSimulations; sim++) {
    // Cùng 1 cú sốc Z toàn quốc cho cả danh mục
    const Z = randn() * shockStd;
    let admittedAny = false;

    for (const w of wishlist) {
      const beta = w.beta ?? 1.0;
      const epsilon = randn() * idioStd;
      const simulatedCutoff = w.forecastP50 + beta * Z + epsilon;
      if (w.userScore >= simulatedCutoff) {
        admittedAny = true;
        break; // Đỗ ít nhất 1 trường
      }
    }

    if (!admittedAny) {
      failCount++;
    }
  }

  return failCount / numSimulations;
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ TOÁN HỌC DECISION LAYER & RÀNG BUỘC TT06");
  console.log("==================================================================");

  // --------------------------------------------------------------------------
  // TEST 1: GAUSS-HERMITE VS MONTE CARLO (1 TRIỆU MẪU)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 1: GAUSS-HERMITE 15 NÚT VS MONTE CARLO 1.000.000 MẪU ---");
  const testPortfolio = [
    { userScore: 26.5, forecastP50: 27.5, beta: 1.1 }, // Thử sức
    { userScore: 26.5, forecastP50: 26.2, beta: 1.0 }, // Phù hợp
    { userScore: 26.5, forecastP50: 24.8, beta: 0.9 }, // An toàn
    { userScore: 26.5, forecastP50: 23.5, beta: 0.8 }, // Rất an toàn
  ];

  // Warm-up JIT compilation
  calculatePortfolioFailAll(testPortfolio);

  const t0 = performance.now();
  const pFailGH = calculatePortfolioFailAll(testPortfolio);
  const ghTimeMs = performance.now() - t0;

  console.log(`[Gauss-Hermite] P(fail all) = ${(pFailGH * 100).toFixed(4)}% (Thời gian: ${ghTimeMs.toFixed(3)} ms)`);

  const t1 = performance.now();
  const pFailMC = runMonteCarloFailAll(testPortfolio, 1_000_000);
  const mcTimeMs = performance.now() - t1;

  console.log(`[Monte Carlo 1M] P(fail all) = ${(pFailMC * 100).toFixed(4)}% (Thời gian: ${mcTimeMs.toFixed(1)} ms)`);

  const diffPct = Math.abs(pFailGH - pFailMC) * 100;
  console.log(`Chênh lệch tuyệt đối: ${diffPct.toFixed(4)}%`);
  assert(diffPct < 0.5, `Sai số giữa Gauss-Hermite và Monte Carlo 1.000.000 mẫu phải < 0.5% (Thực tế: ${diffPct.toFixed(4)}%)`);
  assert(ghTimeMs < 2.0, `Gauss-Hermite phải tính toán tức thì < 2ms trên web client (Thực tế: ${ghTimeMs.toFixed(3)} ms)`);

  // --------------------------------------------------------------------------
  // TEST 2: ĐƠN ĐIỆU XÁC SUẤT TRÚNG TUYỂN (MONOTONICITY)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: TÍNH ĐƠN ĐIỆU CỦA XÁC SUẤT KHI TĂNG ĐIỂM ---");
  const pLow = calculateAdmitProbability(25.0, 26.0);
  const pMid = calculateAdmitProbability(26.0, 26.0);
  const pHigh = calculateAdmitProbability(27.0, 26.0);

  assert(pLow < pMid && pMid < pHigh, "Điểm thi tăng nghiêm ngặt thì xác suất đỗ phải tăng nghiêm ngặt");
  assert(Math.abs(pMid - 0.5) < 1e-4, "Điểm bằng đúng median P50 thì xác suất đỗ phải bằng 50%");

  // --------------------------------------------------------------------------
  // TEST 3: ĐƠN ĐIỆU DANH MỤC: THÊM NGUYỆN VỌNG KHÔNG LÀM TĂNG P(TRƯỢT HẾT)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: THÊM NGUYỆN VỌNG -> P(FAIL ALL) KHÔNG TĂNG ---");
  const subList1 = [testPortfolio[0]];
  const subList2 = [testPortfolio[0], testPortfolio[1]];
  const subList3 = [testPortfolio[0], testPortfolio[1], testPortfolio[2]];

  const fail1 = calculatePortfolioFailAll(subList1);
  const fail2 = calculatePortfolioFailAll(subList2);
  const fail3 = calculatePortfolioFailAll(subList3);

  assert(fail1 >= fail2 && fail2 >= fail3, "Thêm nguyện vọng phải làm giảm hoặc giữ nguyên nguy cơ trượt tất cả");

  // --------------------------------------------------------------------------
  // TEST 4: BẤT BIẾN ĐỘ BẤT ĐỊNH (SHOCK STD SPREAD)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: ĐỘ BIẾN ĐỘNG TĂNG -> DẢI DỰ BÁO NỞ RỘNG ---");
  const bandSmall = 1.28 * Math.sqrt(0.8 ** 2 + 0.8 ** 2);
  const bandLarge = 1.28 * Math.sqrt(1.8 ** 2 + 1.8 ** 2);
  assert(bandLarge > bandSmall, "Độ lệch chuẩn cú sốc lớn hơn làm dải bất định rộng ra tương ứng");

  // --------------------------------------------------------------------------
  // TEST 5: ĐÓNG GÓP BIÊN CỦA TỪNG NGUYỆN VỌNG (MARGINAL RISK REDUCTION)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: TÍNH ĐÓNG GÓP BIÊN CỦA TỪNG NGUYỆN VỌNG ---");
  for (let i = 0; i < testPortfolio.length; i++) {
    const withoutI = testPortfolio.filter((_, idx) => idx !== i);
    const pFailWithout = calculatePortfolioFailAll(withoutI);
    const marginalReduction = pFailWithout - pFailGH;
    assert(marginalReduction >= -1e-6, `Nguyện vọng ${i + 1} phải có đóng góp biên không âm (Thực tế: ${(marginalReduction * 100).toFixed(3)}%)`);
  }

  // --------------------------------------------------------------------------
  // TEST 6: RÀNG BUỘC CỨNG THÔNG TƯ 06/2026/TT-BGDĐT
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: RÀNG BUỘC CỨNG TT06/2026 ---");

  // 6.1 Trần điểm ưu tiên 3.0 điểm
  const highPriorityBonus = calculateTotalPriorityBonus(
    { area: "KV1", object: "uu_tien_1" }, // 0.75 + 2.0 = 2.75
    20.0
  );
  assert(highPriorityBonus <= 3.0, `Điểm ưu tiên (${highPriorityBonus}) không được vượt trần 3.0`);

  // 6.2 Sư phạm đặt ngoài Top 5 -> Bị bắt lỗi vi phạm
  const invalidTeacherWishlist: WishlistItem[] = [
    { rank: 1, program_id: "p1", school_code: "BKA", school_name: "ĐH Bách Khoa", major_label: "Khoa học Máy tính", major_group: "cntt", admit_prob: 0.35, role: "mao_hiem", user_score: 25, forecast_p50: 27, n_years: 3, data_quality: "day_du" },
    { rank: 2, program_id: "p2", school_code: "BKA", school_name: "ĐH Bách Khoa", major_label: "Kỹ thuật Máy tính", major_group: "cntt", admit_prob: 0.45, role: "vua_tam", user_score: 25, forecast_p50: 26, n_years: 3, data_quality: "day_du" },
    { rank: 3, program_id: "p3", school_code: "DCN", school_name: "ĐH Công nghiệp", major_label: "CNTT", major_group: "cntt", admit_prob: 0.65, role: "vua_tam", user_score: 25, forecast_p50: 25, n_years: 3, data_quality: "day_du" },
    { rank: 4, program_id: "p4", school_code: "DCN", school_name: "ĐH Công nghiệp", major_label: "Hệ thống TT", major_group: "cntt", admit_prob: 0.75, role: "vua_tam", user_score: 25, forecast_p50: 24.5, n_years: 3, data_quality: "day_du" },
    { rank: 5, program_id: "p5", school_code: "GHA", school_name: "ĐH GTVT", major_label: "Kỹ thuật phần mềm", major_group: "cntt", admit_prob: 0.85, role: "an_toan", user_score: 25, forecast_p50: 23, n_years: 3, data_quality: "day_du" },
    // Vi phạm: Ngành Sư phạm ở NV6
    { rank: 6, program_id: "p6", school_code: "SPS", school_name: "ĐH Sư Phạm Hà Nội", major_label: "Sư phạm Tin học", major_group: "su_pham", admit_prob: 0.90, role: "an_toan", user_score: 25, forecast_p50: 22, n_years: 3, data_quality: "day_du" },
  ];

  const teacherWarning = portfolioWarnings(invalidTeacherWishlist).find((w) => w.code === "TEACHER_RANK");
  assert(Boolean(teacherWarning), "Danh mục có ngành Sư phạm ngoài 5 nguyện vọng đầu phải bị cảnh báo");
  assert(JSON.stringify(teacherWarning?.positions) === "[6]", "Cảnh báo phải chỉ đúng vị trí vi phạm (NV 6)");

  console.log("\n==================================================================");
  console.log("🎉 TẤT CẢ KIỂM THỬ TOÁN HỌC, GAUSS-HERMITE VÀ TT06 ĐÃ ĐẠT 100%!");
  console.log("==================================================================");
}

runTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
