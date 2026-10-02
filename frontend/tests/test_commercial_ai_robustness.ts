/**
 * TEST SUITE: COMMERCIAL AI DECISION ROBUSTNESS & EDGE-CASE HARDENING
 * Kiểm thử độ tin cậy và phòng vệ biên cho hệ thống AI thương mại hóa:
 * 1. Chặn biên điểm số (0 - 10 môn thi, 0 - 30 tổng điểm, không crash với NaN/Âm/Vượt trần)
 * 2. Fallback cho chương trình mới n=0 năm lịch sử (Bayes group median + nở dải x1.6)
 * 3. Khoảng tin cậy bất định thỏa dụng (Utility Uncertainty Bounds khi thiếu học phí/việc làm)
 * 4. Báo động Zero-Safety khẩn cấp khi danh mục 100% rủi ro cao
 * 5. Phát hiện chính xác môn thi còn thiếu theo tổ hợp
 * 6. Stress test 200 mẫu ngẫu nhiên (Zero NaN, P luôn trong [0, 1])
 */

import { calculateAdmitProbability, calculatePortfolioFailAll } from "../src/engine/admissions/probability";
import { calculateCompositeScore, calculateRawExamCombinationScore, getMissingSubjectsForCombination } from "../src/engine/scoring/composite";
import { buildCandidateOptions, computeUtilityBreakdown, validatePortfolio } from "../src/engine/decision/optimizer";
import { TargetProgram, WishlistItem, StudentProfile } from "../src/engine/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

console.log("==================================================================");
console.log("🛡️ BẮT ĐẦU KIỂM THỬ ROBUSTNESS AI CHO THƯƠNG MẠI HÓA (WORKSTREAM C)");
console.log("==================================================================\n");

// --- 1. CHẶN BIÊN ĐIỂM SỐ & PHÒNG VỆ INPUT ---
console.log("--- 1. BẢO VỆ CHỐNG BIÊN ĐIỂM SỐ DỊ THƯỜNG ---");

const rawClampHigh = calculateRawExamCombinationScore(
  { toan: 15, ly: 12, hoa: 11, van: 0, anh: 0, su: 0, dia: 0, gdcd: 0, sinh: 0 },
  "A00"
);
assert(rawClampHigh === 30, `Điểm thi vượt trần (>10/môn) phải bị chặn tối đa 30.0 (Thực tế: ${rawClampHigh})`);

const rawClampLow = calculateRawExamCombinationScore(
  { toan: -5, ly: -2, hoa: 3, van: 0, anh: 0, su: 0, dia: 0, gdcd: 0, sinh: 0 },
  "A00"
);
assert(rawClampLow === 3, `Điểm thi âm (<0) phải bị chặn về 0 (Thực tế: ${rawClampLow})`);

const compClampBonus = calculateCompositeScore(
  { toan: 10, ly: 10, hoa: 10, van: 0, anh: 0, su: 0, dia: 0, gdcd: 0, sinh: 0 },
  {},
  { area: "KV1", object: "uu_tien_1" },
  "A00"
);
assert(compClampBonus === 30, `Tổng điểm xét tuyển có điểm ưu tiên không được vượt quá 30.0 (Thực tế: ${compClampBonus})`);

// --- 2. PHÁT HIỆN MÔN THI THIẾU THEO TỔ HỢP ---
console.log("\n--- 2. PHÁT HIỆN MÔN THI THIẾU THEO TỔ HỢP ---");
const missingA00 = getMissingSubjectsForCombination(
  { toan: 8, van: 8, anh: 8, ly: null, hoa: null, sinh: null, su: null, dia: null, gdcd: null },
  "A00"
);
assert(
  missingA00.includes("ly") && missingA00.includes("hoa") && missingA00.length === 2,
  `Thí sinh khối D01 thi A00 phải phát hiện thiếu chính xác Lý, Hóa (Thực tế: ${missingA00.join(", ")})`
);

// --- 3. DỰ PHÒNG N=0 NĂM LỊCH SỬ (BAYES GROUP MEDIAN + NỞ DẢI X1.6) ---
console.log("\n--- 3. CHƯƠNG TRÌNH MỚI N=0 NĂM LỊCH SỬ & DỰ BÁO KHUYẾT ---");

const mockPrograms: TargetProgram[] = [
  // Nhóm CNTT chuẩn đã có dữ liệu
  {
    programId: "p_it_1",
    schoolCode: "BKHN",
    schoolName: "ĐH Bách Khoa",
    majorName: "Khoa học Máy tính",
    majorGroup: "cntt",
    combinations: ["A00"],
    cutoff2021: 23.0,
    cutoff2022: 23.5,
    cutoff2023: 24.0,
    cutoff2024: 24.5,
    forecastP50: 24.0,
    forecastP10: 23.0,
    forecastP90: 25.0,
    tuitionVnd: 35000000,
    employmentRate: 98,
    province: "Hà Nội",
    aiExposure: 0.8,
    leverageScore: 0.85,
    dataPassport: "/passport/p_it_1",
  },
  // Nhóm CNTT mới mở 2026: n=0 năm lịch sử, không có forecastP50
  {
    programId: "p_it_new",
    schoolCode: "NEW_UNI",
    schoolName: "ĐH Công Nghệ Mới",
    majorName: "Trí Tuệ Nhân Tạo Mới",
    majorGroup: "cntt",
    combinations: ["A00"],
    forecastP50: 0,
    forecastP10: 0,
    forecastP90: 0,
    tuitionVnd: 40000000,
    employmentRate: null, // thiếu dữ liệu
    province: "Hà Nội",
    aiExposure: 0.8,
    leverageScore: 0.85,
    dataPassport: "/passport/p_it_new",
  },
];


const mockProfile = {
  examScores: { toan: 8.5, ly: 8.5, hoa: 8.5, van: 7, anh: 8, su: 0, dia: 0, gdcd: 0, sinh: 0 },
  priority: { area: "KV3", object: "none" } as const,
  annualBudgetVnd: 60000000,
  targetProgram: mockPrograms[0],
} as unknown as StudentProfile;

const candidates = buildCandidateOptions(mockPrograms, mockProfile);
const newCandidate = candidates.find((c) => c.programId === "p_it_new");

assert(newCandidate !== undefined, "Chương trình mới n=0 năm phải được đưa vào danh sách ứng viên (không bị drop null)");
assert(
  typeof newCandidate?.cutoffP50 === "number" && !isNaN(newCandidate.cutoffP50) && newCandidate.cutoffP50 > 20,
  `P50 fallback phải lấy từ trung vị nhóm CNTT (>20đ) thay vì 0đ (Thực tế: ${newCandidate?.cutoffP50})`
);
assert(
  (newCandidate?.cutoffP90 ?? 0) - (newCandidate?.cutoffP10 ?? 0) >= 7.0,
  `Dải phân vị của chương trình n=0 năm phải mở rộng x1.6 để phản ánh bất định cao (Độ rộng: ${((newCandidate?.cutoffP90 ?? 0) - (newCandidate?.cutoffP10 ?? 0)).toFixed(1)}đ)`
);
assert(
  Boolean(newCandidate?.whyThisOptionVi.includes("n=0 năm dữ liệu")),
  "Giải thích data-grounded phải nêu rõ lưu ý n=0 năm dữ liệu lịch sử"
);



// --- 4. KHOẢNG BẤT ĐỊNH THỎA DỤNG (UTILITY UNCERTAINTY BOUNDS) ---
console.log("\n--- 4. KHOẢNG BẤT ĐỊNH THỎA DỤNG (UTILITY BOUNDS) ---");
if (newCandidate) {
  const util = computeUtilityBreakdown(newCandidate, mockPrograms[0]);
  assert(util.uncertaintyBounds.hasUncertainData === true, "Phát hiện đúng trường dữ liệu khuyết trong Utility");
  assert(util.uncertaintyBounds.uncertainFields.includes("career"), "Chỉ ra đúng trường thiếu: career");
  assert(
    util.uncertaintyBounds.minUtility <= util.uncertaintyBounds.maxUtility,
    `Cận dưới Min Utility (${util.uncertaintyBounds.minUtility}) phải <= Cận trên Max Utility (${util.uncertaintyBounds.maxUtility})`
  );
}

// --- 5. BÁO ĐỘNG ZERO-SAFETY KHI DANH MỤC 100% RỦI RO ---
console.log("\n--- 5. BÁO ĐỘNG ZERO-SAFETY (KHÔNG CÓ LƯỚI AN TOÀN) ---");
const dangerousWishlist: WishlistItem[] = [
  {
    rank: 1,
    program_id: "p1",
    school_code: "BK",
    school_name: "Bách Khoa",
    major_label: "Khoa học Máy tính",
    major_group: "cntt",
    combinations_seen: "A00",
    admit_prob: 0.15,
    role: "mao_hiem",
    forecast_p50: 29.0,
    forecast_p10: 28.0,
    forecast_p90: 29.5,
    user_score: 25.5,
  } as unknown as WishlistItem,
  {
    rank: 2,
    program_id: "p2",
    school_code: "KHTN",
    school_name: "KHTN",
    major_label: "Trí tuệ Nhân tạo",
    major_group: "cntt",
    combinations_seen: "A00",
    admit_prob: 0.22,
    role: "mao_hiem",
    forecast_p50: 28.5,
    forecast_p10: 27.5,
    forecast_p90: 29.0,
    user_score: 25.5,
  } as unknown as WishlistItem,
];


const validation = validatePortfolio(dangerousWishlist, 50000000, 0.05);
const zeroSafetyWarning = validation.warnings.find((w) => w.code === "ZERO_SAFETY_WARNING");
assert(zeroSafetyWarning !== undefined, "Phải kích hoạt mã cảnh báo ZERO_SAFETY_WARNING khi danh mục 100% Thử sức");
assert(zeroSafetyWarning?.level === "red", "Cảnh báo ZERO_SAFETY_WARNING phải có mức độ nghiêm trọng màu ĐỎ");

// --- 6. STRESS TEST 200 MẪU NGẪU NHIÊN VỚI INPUT PHI LÝ ---
console.log("\n--- 6. STRESS TEST 200 MẪU NGẪU NHIÊN (ZERO CRASH & ZERO NAN) ---");
let stressPass = true;

for (let i = 0; i < 200; i++) {
  const arbitraryScore = (Math.random() - 0.3) * 50; // [-15, 35]
  const arbitraryCutoff = (Math.random() - 0.2) * 45; // [-9, 36]
  const arbitraryShock = (Math.random() - 0.1) * 5; // Có thể âm hoặc 0
  const arbitraryIdio = (Math.random() - 0.1) * 5;

  const prob = calculateAdmitProbability(arbitraryScore, arbitraryCutoff, 1.0, arbitraryShock, arbitraryIdio);
  if (isNaN(prob) || prob < 0 || prob > 1) {
    stressPass = false;
    console.error(`Lỗi tại mẫu ${i}: score=${arbitraryScore}, cutoff=${arbitraryCutoff}, prob=${prob}`);
    break;
  }
}
assert(stressPass, "200 mẫu ngẫu nhiên gồm cả số âm, số vượt trần, phương sai bất thường đều trả về P ∈ [0, 1] và không NaN");

// Stress test calculatePortfolioFailAll với mảng chứa phần tử lạ
const weirdWishlist = [
  { userScore: NaN, forecastP50: 25 },
  { userScore: 26, forecastP50: NaN },
  { userScore: -10, forecastP50: 20 },
  { userScore: 28, forecastP50: 22 },
];
const failAllWeird = calculatePortfolioFailAll(weirdWishlist);
assert(!isNaN(failAllWeird) && failAllWeird >= 0 && failAllWeird <= 1, `calculatePortfolioFailAll bảo vệ an toàn trước NaN (Thực tế: ${failAllWeird})`);

// --- 7. DUAL-LAYER GROUNDED EXPLAINER & HALLUCINATION GUARDRAIL (WORKSTREAM E) ---
console.log("\n--- 7. LỚP BẢO VỆ KÉP CHỐNG HALLUCINATION TRONG AI GIẢI THÍCH ---");
import { verifyAndEnforceGroundedNarrative, generateGroundedLlmExplanation, GroundedFactsheet } from "../src/engine/explain/grounded-explainer";

const fact: GroundedFactsheet = {
  userScore: 27.5,
  forecastP50: 26.5,
  forecastP10: 25.0,
  forecastP90: 28.0,
  gap: 1.0,
  admitProbabilityPct: 78,
  pFailAllPct: 2.1,
  tuitionMillionVnd: 35,
  rank: 1,
  schoolCode: "BKHN",
  majorName: "Khoa học Máy tính",
};

// Trường hợp 1: Văn bản tuân thủ 100% factsheet
const truthfulText = "Với 27.50 điểm xét tuyển, bạn cao hơn 1.00đ so với P50 26.50đ của Khoa học Máy tính (BKHN). Xác suất đỗ ước tính 78% trong dải [25.00đ - 28.00đ], học phí 35 triệu/năm.";
const truthResult = verifyAndEnforceGroundedNarrative(truthfulText, fact);
assert(truthResult.isValid === true, "Văn bản chứa đúng số liệu thật phải được xác thực hợp lệ (isValid = true)");
assert(truthResult.source === "llm_verified", "Nguồn giải thích phải là 'llm_verified'");

// Trường hợp 2: Văn bản bịa đặt số liệu (Hallucination)
const hallucinatedText = "Với 27.5 điểm xét tuyển, ngành này lấy điểm chuẩn 29.8 điểm và học phí lên tới 95 triệu/năm.";
const fakeResult = verifyAndEnforceGroundedNarrative(hallucinatedText, fact);
assert(fakeResult.isValid === false, "Phải phát hiện chính xác số liệu bịa đặt (isValid = false)");
assert(fakeResult.hallucinatedTokens.includes("29.8"), "Bắt chính xác token ảo 29.8");
assert(fakeResult.hallucinatedTokens.includes("95"), "Bắt chính xác token ảo 95");
assert(fakeResult.source === "deterministic_fallback", "Lập tức kích hoạt fallback về bản mẫu xác định 100% dữ liệu thật");
assert(fakeResult.explanationText.includes("26.50đ"), "Bản fallback phải chứa đúng số liệu P50 thật (26.50đ)");

// Trường hợp 3: Gọi API Explainer bất đồng bộ khi không cấu hình endpoint -> Fallback an toàn về deterministic
const asyncResult = await generateGroundedLlmExplanation(fact);
assert(asyncResult.isValid === true, "Async explainer fallback an toàn (isValid = true)");
assert(asyncResult.source === "deterministic_fallback", "Async explainer chọn đúng deterministic_fallback khi không có remote LLM");
assert(asyncResult.explanationText.includes("27.50đ"), "Bản fallback bất đồng bộ chứa đúng số liệu điểm xét tuyển");

// --- 8. THU THẬP PHẢN HỒI KẾT QUẢ THỰC TẾ & NGHỊ ĐỊNH 13 (WORKSTREAM B) ---
console.log("\n--- 8. HỆ THỐNG TELEMETRY VÒNG LẶP THỰC CHỨNG & NGHỊ ĐỊNH 13 ---");
import {
  recordPredictionSnapshot,
  updateActualAdmissionOutcome,
  getStoredTelemetryRecords,
  exportAnonymizedTelemetryJson,
  calculateLocalCalibrationMetrics,
} from "../src/engine/feedback/outcome-collector";

// Giả lập localStorage trong môi trường Node.js / tsx
const memoryStore: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => memoryStore[k] || null,
    setItem: (k: string, v: string) => { memoryStore[k] = v; },
    removeItem: (k: string) => { delete memoryStore[k]; },
  },
} as unknown as Window;

const sessionId = recordPredictionSnapshot(
  mockProfile,
  dangerousWishlist,
  0.021,
  "A00",
  25.5
);
assert(typeof sessionId === "string" && sessionId.length > 5, "Tạo thành công phiên ghi nhận dự báo ẩn danh");

const records = getStoredTelemetryRecords();
assert(records.length === 1, "Bản ghi telemetry được lưu trữ an toàn trong localStorage");
assert(records[0].scoreSnapshot.totalCompositeScore === 25.5, "Lưu đúng điểm số thí sinh");

// Cập nhật kết quả tuyển sinh tháng 7 (đỗ NV2)
const updated = updateActualAdmissionOutcome(sessionId, {
  admittedRank: 2,
  admittedSchoolCode: "KHTN",
  admittedMajorName: "Trí tuệ Nhân tạo",
  actualCutoffScore: 25.2,
  outcomeRecordedAt: new Date().toISOString(),
  feedbackRating: 5,
  studentNote: "Đúng như dự báo của hệ thống!",
});
assert(updated === true, "Cập nhật thành công kết quả trúng tuyển thực tế");

const metrics = calculateLocalCalibrationMetrics();
assert(metrics.completedCases === 1, "Tính toán đúng số ca kiểm chứng hoàn tất (completedCases = 1)");
assert(metrics.brierScore !== null && metrics.brierScore >= 0, `Brier score thực nghiệm được tính toán chính xác (${metrics.brierScore})`);

const exportedJson = exportAnonymizedTelemetryJson();
assert(exportedJson.includes("Decree_13_2023_ND_CP"), "Dữ liệu xuất khẩu ghi rõ tuân thủ Nghị định 13/2023/NĐ-CP");
assert(!exportedJson.includes("cccd") && !exportedJson.includes("phoneNumber"), "Dữ liệu xuất khẩu tuyệt đối không chứa trường định danh cá nhân");

console.log("\n==================================================================");
console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}

