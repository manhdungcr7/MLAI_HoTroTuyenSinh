/**
 * TEST SUITE: DECISION QUALITY & TRUST (MASTER_AUDIT 2026-09-25)
 * 1. Điểm tổ hợp không ngoại suy khi thiếu môn, tổ hợp lạ không mặc định A00
 * 2. Một ngưỡng phân nhóm duy nhất (classifyRole)
 * 3. Không có UT3 (+0.5) — quy tắc ưu tiên một nguồn
 * 4. Mô phỏng kịch bản: tăng điểm → không giảm số lựa chọn An toàn; ngân sách/khu vực thu hẹp tập lựa chọn
 * 5. Đánh giá danh mục & tóm tắt Tổng quan nhất quán, có hành động tiếp theo
 * 6. Utility bỏ qua tiêu chí thiếu dữ liệu thay vì điền số giả
 */

import { calculateCompositeScore } from "../src/engine/scoring/composite";
import { classifyRole, SAFE_MIN_PROB, REACH_MAX_PROB } from "../src/engine/admissions/probability";
import { calculateMinistryPriorityBonus } from "../src/engine/recommend/recommendation-engine";
import { runScenario, EMPTY_SCENARIO } from "../src/engine/decision/scenario";
import { assessPortfolio } from "../src/engine/decision/portfolio-assessment";
import { buildDashboardSummary } from "../src/engine/decision/dashboard-summary";
import { buildCandidateOptions, buildOptimizedPortfolio, computeUtilityBreakdown } from "../src/engine/decision/optimizer";
import { DECISION_PROGRAM_POOL } from "../src/data/catalog";
import { DEFAULT_STUDENT_PROFILE } from "../src/data/seed/personas";
import { StudentProfile } from "../src/engine/types";

let passed = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passed++;
  console.log(`✅ PASS: ${message}`);
}

const base: StudentProfile = { ...DEFAULT_STUDENT_PROFILE, examScores: { ...DEFAULT_STUDENT_PROFILE.examScores } };
const bestScore = (p: StudentProfile) =>
  calculateCompositeScore(p.examScores, p.altScores, p.priority, p.activeCombination);

// 1. Composite
const partial = { ...base.examScores, ly: null };
assert(
  calculateCompositeScore(partial, { ielts: null }, base.priority, "A00") === 0,
  "Thiếu 1 môn của tổ hợp → 0 (chưa đủ dữ liệu), không ngoại suy ×3/2"
);
assert(calculateCompositeScore(base.examScores, base.altScores, base.priority, "ZZ9") === 0, "Tổ hợp không xác định → 0, không mặc định Toán-Lý-Hóa");
assert(
  Math.abs(calculateCompositeScore(base.examScores, { ielts: null }, base.priority, "A00") - (8.2 + 8.0 + 6.0)) < 1e-9,
  "Đủ môn → đúng tổng 3 môn"
);

// 2. classifyRole
assert(classifyRole(SAFE_MIN_PROB) === "an_toan" && classifyRole(REACH_MAX_PROB - 0.01) === "mao_hiem" && classifyRole(0.6) === "vua_tam", "classifyRole dùng một bộ ngưỡng");
const candidates = buildCandidateOptions(DECISION_PROGRAM_POOL, base).filter((c) => c.userScore > 0);
assert(candidates.length > 0, `Có ứng viên từ tập chương trình chung (${candidates.length})`);
assert(candidates.every((c) => c.role === classifyRole(c.admitProbability)), "Mọi ứng viên có nhóm khớp classifyRole(xác suất)");
const excludedSchool = DECISION_PROGRAM_POOL[0].schoolCode;
const excludingSchool = buildCandidateOptions(DECISION_PROGRAM_POOL, {
  ...base,
  excludedSchoolCodes: [excludedSchool.toLowerCase()],
}).filter((c) => c.userScore > 0);
assert(excludingSchool.every((c) => c.schoolCode.toUpperCase() !== excludedSchool.toUpperCase()), "Mã trường bị loại không vào tập ứng viên");
const excludedGroup = DECISION_PROGRAM_POOL.find((program) => program.majorGroup)?.majorGroup ?? "khong_co_nhom";
const excludingGroup = buildCandidateOptions(DECISION_PROGRAM_POOL, {
  ...base,
  excludedMajorGroups: [excludedGroup.toUpperCase()],
}).filter((c) => c.userScore > 0);
assert(excludingGroup.every((c) => c.majorGroup.toLowerCase() !== excludedGroup.toLowerCase()), "Nhóm ngành bị loại không vào tập ứng viên");

const underThreshold = buildCandidateOptions(DECISION_PROGRAM_POOL, {
  ...base,
  graduationYear: 2026,
  examScores: { toan: 4, ly: 4, hoa: 4, van: 4, anh: 4, sinh: 4, su: 4, dia: 4, gdcd: 4 },
  altScores: { ...base.altScores, ielts: 9 },
});
assert(underThreshold.length === 0, "Tổng ba môn thi dưới 15 từ năm 2026 không được bù bằng IELTS");
const preRuleYear = buildCandidateOptions(DECISION_PROGRAM_POOL, { ...base, graduationYear: 2025 });
assert(preRuleYear.length > 0, "Ngưỡng tối thiểu 15 điểm không áp cho kỳ thi trước 2026");
const verifiedException = buildCandidateOptions(DECISION_PROGRAM_POOL, {
  ...base,
  graduationYear: 2026,
  minimumScoreException: true,
  examScores: { toan: 4, ly: 4, hoa: 4, van: 4, anh: 4, sinh: 4, su: 4, dia: 4, gdcd: 4 },
});
assert(verifiedException.length > 0, "Diện ngoại lệ đã xác minh được xử lý theo quy định");
const unknownYear = buildCandidateOptions(DECISION_PROGRAM_POOL, { ...base, graduationYear: null });
assert(unknownYear.length > 0, "Năm thi chưa rõ không bị âm thầm giả định là 2026");
const mixedTeacherCandidates = candidates.slice(0, 24).map((candidate, index) => ({
  ...candidate,
  programId: `teacher-rule-${index}`,
  majorGroup: index < 8 ? "su_pham" : "cntt",
}));
const cappedPortfolio = buildOptimizedPortfolio(mixedTeacherCandidates, DECISION_PROGRAM_POOL[0]);
assert(cappedPortfolio.wishlist.length <= 15, "Danh mục tối ưu không vượt quá 15 nguyện vọng");
assert(cappedPortfolio.wishlist.filter((item) => item.major_group === "su_pham").length <= 5, "Danh mục tối ưu giữ tối đa 5 nguyện vọng sư phạm");
assert(cappedPortfolio.wishlist.every((item, index) => item.major_group !== "su_pham" || index < 5), "Mọi nguyện vọng sư phạm nằm trong 5 vị trí đầu");

// 3. Priority
assert(calculateMinistryPriorityBonus(20, "KV3", "uu_tien_3") === 0, "UT3 không cộng điểm (quy chế hiện hành chỉ có UT1/UT2)");
assert(Math.abs(calculateMinistryPriorityBonus(27, "KV1", "none") - 0.3) < 1e-9, "Công thức giảm dần từ 22.5: KV1 ở 27 điểm = 0.30");

// 4. Scenario
const noChange = runScenario(DECISION_PROGRAM_POOL, base, EMPTY_SCENARIO, bestScore);
assert(
  noChange.before.total === noChange.after.total && noChange.improved.length === 0 && noChange.worsened.length === 0,
  "Kịch bản rỗng → không thay đổi"
);
const up = runScenario(DECISION_PROGRAM_POOL, base, { ...EMPTY_SCENARIO, scoreDeltas: { toan: 0.75 } }, bestScore);
assert(up.scenarioScore > up.baseScore, `Tăng Toán +0.75 → điểm tổ hợp tăng (${up.baseScore} → ${up.scenarioScore})`);
assert(up.after.safe >= up.before.safe, `Tăng điểm không làm giảm số lựa chọn An toàn (${up.before.safe} → ${up.after.safe})`);
assert(up.worsened.length === 0, "Tăng điểm không làm lựa chọn nào tụt nhóm");
const north = runScenario(DECISION_PROGRAM_POOL, base, { ...EMPTY_SCENARIO, region: "nam" }, bestScore);
assert(north.after.total < north.before.total, `Chỉ học miền Nam → tập lựa chọn thu hẹp (${north.before.total} → ${north.after.total})`);
const cheap = runScenario(DECISION_PROGRAM_POOL, base, { ...EMPTY_SCENARIO, budgetVnd: 20_000_000 }, bestScore);
assert(cheap.after.total <= cheap.before.total, "Ngân sách thấp không làm tăng số lựa chọn");
assert(cheap.unknownTuitionCount >= 0, `Báo rõ số lựa chọn chưa có học phí (${cheap.unknownTuitionCount})`);
const noIelts = runScenario(DECISION_PROGRAM_POOL, base, { ...EMPTY_SCENARIO, dropIelts: true }, bestScore);
assert(noIelts.scenarioScore < noIelts.baseScore, `Bỏ IELTS (đang quy đổi Anh cao hơn điểm thi) → điểm giảm (${noIelts.baseScore} → ${noIelts.scenarioScore})`);

// 5. Portfolio assessment & dashboard
assert(assessPortfolio({ reach: 13, target: 0, safe: 2 }, 0.2).level !== "ok", "13 Thử sức / 0 Phù hợp / 2 An toàn với P(trượt hết) 20% không được gọi là hợp lý");
assert(assessPortfolio({ reach: 3, target: 0, safe: 0 }, 0.9).level === "high", "Toàn Thử sức → rủi ro cao");
assert(assessPortfolio({ reach: 3, target: 7, safe: 5 }, 0.01).level === "ok", "Cơ cấu cân bằng, P thấp → ổn");

const blank = buildDashboardSummary({
  profile: { ...base, examScores: {}, annualBudgetVnd: 0, homeProvince: "" },
  target: null,
  compositeScore: 0,
  targetGap: null,
  candidates: [],
  savedWishlist: [],
  suggestedWishlist: [],
  subjectRoiList: [],
});
assert(blank.nextAction.href === "/profile" && !blank.hasScores, "Hồ sơ trống → việc tiếp theo là nhập điểm");
assert(blank.missingInfo.length >= 3, "Hồ sơ trống → liệt kê thông tin còn thiếu");

const filled = buildDashboardSummary({
  profile: base,
  target: null,
  compositeScore: bestScore(base),
  targetGap: null,
  candidates,
  savedWishlist: [],
  suggestedWishlist: [],
  subjectRoiList: [],
});
assert(filled.nextAction.href === "/profile/goal", "Có điểm nhưng chưa có mục tiêu → việc tiếp theo là chọn mục tiêu");
assert(
  filled.counts.total === candidates.length &&
    filled.counts.target === candidates.filter((c) => c.role === "vua_tam").length,
  "Số lựa chọn trên Tổng quan khớp đúng tập ứng viên (một nguồn số)"
);
assert(filled.headlineVi.includes(String(filled.counts.safe)), "Tiêu đề nêu đúng số lựa chọn An toàn");

// 6. Utility with missing data
const sample = { ...candidates[0], tuitionVnd: null, employmentRate: null };
const u = computeUtilityBreakdown(sample, DECISION_PROGRAM_POOL[0]);
assert(u.parts.cost === null && u.parts.career === null, "Thiếu học phí/việc làm → tiêu chí = null (không điền 0.85 / 92.5)");
assert(u.utility > 0 && u.utility <= 1, `Utility chuẩn hóa lại trên các tiêu chí có dữ liệu (${u.utility})`);

console.log(`\n🎉 TẤT CẢ ${passed} KIỂM THỬ DECISION QUALITY ĐÃ PASS`);
