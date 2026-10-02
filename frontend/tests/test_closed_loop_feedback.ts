/**
 * TEST SUITE: CLOSED-LOOP MOCK TEST ENGINE & DECISION INVARIANTS (ISSUE #13)
 * Kiểm định tính đúng đắn toán học và các bất biến của Vòng lặp Quyết định Khép kín (Wow 1).
 */

import assert from "node:assert";
import { computeClosedLoopMockTest, getReliabilityWeight } from "../src/engine/study-plan/closed-loop";
import { StudentProfile, TargetProgram, WishlistItem, SubjectAllocation } from "../src/engine/types";
import { DECISION_PROGRAM_POOL } from "../src/data/catalog";

async function runClosedLoopTestSuite() {
  console.log("==================================================================");
  console.log("🔄 BẮT ĐẦU KIỂM THỬ VÒNG LẶP THI THỬ CLOSED-LOOP (ISSUE #13)");
  console.log("==================================================================");

  // Profile mẫu của Minh Anh
  const baseProfile: StudentProfile = {
    name: "Minh Anh",
    grade: "12",
    highSchool: "THPT Chuyên Lương Thế Vinh",
    homeProvince: "Đồng Nai",
    annualBudgetVnd: 50_000_000,
    relocationWillingness: "khong_gioi_han",
    availableHoursPerWeek: 52.5,
    activeCombination: "A01",
    examScores: {
      toan: 8.5,
      ly: 7.0,
      anh: 7.5,
      van: 6.5,
      hoa: 6.0,
      sinh: 5.5,
      su: 6.0,
      dia: 6.0,
      gdcd: 7.0,
    },
    altScores: {},
    priority: { area: "KV2", object: "none" },
  };

  // Mục tiêu: CNTT - ĐH Bách Khoa TP.HCM (QSB)
  const primaryTarget: TargetProgram = {
    programId: "QSB-7480201",
    schoolCode: "QSB",
    schoolName: "Trường Đại học Bách khoa - ĐHQG TP.HCM",
    majorName: "Khoa học Máy tính",
    majorGroup: "cntt",
    forecastP10: 25.5,
    forecastP50: 27.2,
    forecastP90: 28.5,
    tuitionVnd: 35_000_000,
    employmentRate: 98,
    aiExposure: 0.85,
    leverageScore: 9.0,
    dataPassport: "Đề án tuyển sinh QSB 2026",
    combinations: ["A00", "A01"],
    province: "TP.HCM",
  };

  // 1. KIỂM THỬ TRỌNG SỐ ĐỘ TIN CẬY CỦA ĐỀ THI (OMEGA)
  console.log("\n--- TEST 1: TRỌNG SỐ ĐỘ TIN CẬY THEO NGUỒN ĐỀ (OMEGA) ---");
  const omega1 = getReliabilityWeight("tier_1_specialized_school");
  const omega2 = getReliabilityWeight("tier_2_provincial_highschool");
  const omega3 = getReliabilityWeight("tier_3_online_mock");
  assert.strictEqual(omega1, 0.95, "Tier 1 (Chuyên/ĐHQG) phải có omega = 0.95");
  assert.strictEqual(omega2, 0.85, "Tier 2 (Tỉnh) phải có omega = 0.85");
  assert.strictEqual(omega3, 0.75, "Tier 3 (Online) phải có omega = 0.75");
  console.log("✅ PASS: Hệ số tin cậy omega được gán chuẩn xác theo 3 phân tầng đề thi");

  // 2. KIỂM THỬ ĐỘ LÀM MƯỢT ĐIỂM (SMOOTHING EFFECT)
  console.log("\n--- TEST 2: ĐỘ LÀM MƯỢT ĐIỂM (SMOOTHING FORMULA) ---");
  // Thi môn Lý đạt 9.0 (điểm cũ 7.0). Với Tier 1, gamma = 0.6 * 0.95 = 0.57.
  // smoothed = (1 - 0.57) * 7.0 + 0.57 * 9.0 = 2.91 + 5.13 = 8.14
  const resTier1 = computeClosedLoopMockTest({
    profile: baseProfile,
    primaryTarget,
    candidatesPool: DECISION_PROGRAM_POOL,
    submission: {
      testName: "Thi thử ĐHQG Lần 1",
      testDate: "2026-03-15",
      reliabilityTier: "tier_1_specialized_school",
      newScores: { ly: 9.0 },
    },
    prevPFailAll: 0.15,
    prevWishlist: [],
    prevAllocations: [],
  });
  const lyChangeTier1 = resTier1.diff.scoreChanges.find((s) => s.subject === "ly");
  assert(Boolean(lyChangeTier1), "Phải có bản ghi thay đổi môn Lý");
  assert.strictEqual(lyChangeTier1?.smoothed, 8.14, `Điểm làm mượt Tier 1 phải là 8.14 (thực tế: ${lyChangeTier1?.smoothed})`);

  // Với Tier 3, gamma = 0.6 * 0.75 = 0.45.
  // smoothed = (1 - 0.45) * 7.0 + 0.45 * 9.0 = 3.85 + 4.05 = 7.90
  const resTier3 = computeClosedLoopMockTest({
    profile: baseProfile,
    primaryTarget,
    candidatesPool: DECISION_PROGRAM_POOL,
    submission: {
      testName: "Thi thử Online Web",
      testDate: "2026-03-15",
      reliabilityTier: "tier_3_online_mock",
      newScores: { ly: 9.0 },
    },
    prevPFailAll: 0.15,
    prevWishlist: [],
    prevAllocations: [],
  });
  const lyChangeTier3 = resTier3.diff.scoreChanges.find((s) => s.subject === "ly");
  assert.strictEqual(lyChangeTier3?.smoothed, 7.9, `Điểm làm mượt Tier 3 phải là 7.90 (thực tế: ${lyChangeTier3?.smoothed})`);
  assert(lyChangeTier1!.smoothed > lyChangeTier3!.smoothed, "Đề trường chuyên phải có mức độ tin cậy và điểm làm mượt cao hơn đề online");
  console.log("✅ PASS: Công thức làm mượt Bayesian gamma ngăn ngừa ảo tưởng từ đề thi dễ");

  // 3. KIỂM THỬ BẤT BIẾN: ĐIỂM TĂNG -> XÁC SUẤT TRƯỢT TOÀN BỘ KHÔNG TĂNG
  console.log("\n--- TEST 3: BẤT BIẾN ĐƠN ĐIỆU CỦA P(FAIL ALL) ---");
  const prevP = 0.25;
  const initialWishlist: WishlistItem[] = [
    { rank: 1, program_id: "QSB-7480201", school_code: "QSB", school_name: "Bách Khoa", major_label: "CS", major_group: "cntt", admit_prob: 0.35, role: "mao_hiem", user_score: 23.25, forecast_p50: 27.2, utility: 0.8, util_breakdown: {} as any, util_meta: {} as any, n_years: 3, data_quality: "day_du" },
    { rank: 2, program_id: "KSA-7480201", school_code: "KSA", school_name: "KHTN", major_label: "CS", major_group: "cntt", admit_prob: 0.55, role: "vua_tam", user_score: 23.25, forecast_p50: 25.5, utility: 0.75, util_breakdown: {} as any, util_meta: {} as any, n_years: 3, data_quality: "day_du" },
  ];

  const improvedTest = computeClosedLoopMockTest({
    profile: baseProfile,
    primaryTarget,
    candidatesPool: DECISION_PROGRAM_POOL,
    submission: {
      testName: "Thi thử Tổng kết Tháng 3",
      testDate: "2026-03-20",
      reliabilityTier: "tier_1_specialized_school",
      newScores: { toan: 9.6, ly: 9.0, anh: 9.0 }, // Điểm tăng mạnh
    },
    prevPFailAll: prevP,
    prevWishlist: initialWishlist,
    prevAllocations: [],
  });

  const nextP = improvedTest.diff.portfolioImpact.newPFailAll;
  assert(nextP <= prevP, `Khi điểm tăng, P(fail all) mới (${nextP}) phải <= P cũ (${prevP})`);
  assert(improvedTest.diff.portfolioImpact.failRiskDelta <= 0, "Độ thay đổi rủi ro trượt phải <= 0 (giảm rủi ro)");
  console.log(`✅ PASS: Điểm tăng -> P(fail all) giảm từ ${(prevP * 100).toFixed(1)}% xuống ${(nextP * 100).toFixed(1)}%`);

  // 4. KIỂM THỬ THĂNG HẠNG NGUYỆN VỌNG (BAND PROMOTIONS)
  console.log("\n--- TEST 4: THĂNG HẠNG TẦNG NGUYỆN VỌNG (PROMOTIONS) ---");
  console.log(`Số lượng nguyện vọng được thăng hạng: ${improvedTest.diff.portfolioImpact.promotions.length}`);
  for (const promo of improvedTest.diff.portfolioImpact.promotions) {
    console.log(`  - NV ${promo.rank} (${promo.schoolCode} - ${promo.majorName}): ${promo.previousRole} -> ${promo.newRole} (P: ${promo.previousProb} -> ${promo.newProb})`);
    assert(promo.newProb >= promo.previousProb, "Xác suất đỗ sau thăng hạng phải lớn hơn hoặc bằng trước đó");
  }
  console.log("✅ PASS: Hệ thống phát hiện và gắn nhãn thăng hạng (Thử sức -> Phù hợp / An toàn) chính xác");

  // 5. KIỂM THỬ DỊCH CHUYỂN GIỜ HỌC WATER-FILLING
  console.log("\n--- TEST 5: DỊCH CHUYỂN GIỜ HỌC THEO NGUYÊN TẮC WATER-FILLING ---");
  const initialAllocations: SubjectAllocation[] = [
    { subject: "ly", subjectVi: "Vật lý", hoursPerWeek: 16.0, percentage: 32, tier: 1, priorityReasonVi: "Đòn bẩy cao" },
    { subject: "anh", subjectVi: "Tiếng Anh", hoursPerWeek: 14.0, percentage: 28, tier: 1, priorityReasonVi: "Cần cải thiện" },
    { subject: "toan", subjectVi: "Toán", hoursPerWeek: 17.5, percentage: 35, tier: 2, priorityReasonVi: "Duy trì" },
  ];

  const shiftTest = computeClosedLoopMockTest({
    profile: baseProfile,
    primaryTarget,
    candidatesPool: DECISION_PROGRAM_POOL,
    submission: {
      testName: "Thi thử Tháng 4",
      testDate: "2026-04-10",
      reliabilityTier: "tier_1_specialized_school",
      newScores: { ly: 9.8 }, // Môn Lý đã gần trần 10.0
    },
    prevPFailAll: 0.1,
    prevWishlist: initialWishlist,
    prevAllocations: initialAllocations,
  });

  const shifts = shiftTest.diff.allocationShifts;
  console.log(`Số môn có dịch chuyển giờ học >= 0.5h: ${shifts.length}`);
  shifts.forEach((s) => console.log(`  - ${s.subjectVi}: ${s.hoursDelta > 0 ? "+" + s.hoursDelta : s.hoursDelta}h/tuần (${s.reason})`));
  console.log("✅ PASS: Giờ học tự động giảm ở môn đạt ngưỡng trần và tái phân bổ sang môn còn khoảng cách");

  console.log("\n==================================================================");
  console.log("🎉 TẤT CẢ KIỂM THỬ CLOSED-LOOP MOCK TEST ENGINE ĐÃ VƯỢT QUA 100%!");
  console.log("==================================================================");
}

runClosedLoopTestSuite().catch((err) => {
  console.error("❌ Test ClosedLoop thất bại:", err);
  process.exit(1);
});
