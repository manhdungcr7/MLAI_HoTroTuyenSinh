/**
 * TEST: quy tắc tính điểm riêng từng trường, ràng buộc, đề xuất nguyện vọng, lưu trữ.
 * Số kỳ vọng được tính tay (xem chú thích) và được backend Python kiểm tra song song
 * (tests/backend/test_admission_core_parity.py).
 */

import { readFileSync } from "node:fs";
import { loadCatalog } from "../src/data/catalog";

const DECISION_PROGRAM_POOL = (await loadCatalog()).programs;
import { buildCandidateOptions } from "../src/engine/decision/optimizer";
import { filterByConstraints } from "../src/engine/decision/constraints";
import { portfolioWarnings, suggestPortfolio, candidateToWishlistItem } from "../src/engine/decision/portfolio-suggest";
import { clearSchoolRules, registerSchoolRules, validateSchoolRule, SchoolRule } from "../src/engine/scoring/school-rules";
import { missingInputsForProgram, scoreForProgram } from "../src/engine/scoring/method-score";
import { StudentProfile, TargetProgram } from "../src/engine/types";
import { sanitize } from "../src/state/storage";
import { comboAcceptancePrior } from "../src/engine/decision/combo-prior";
import { FORECAST_YEAR, calculateAdmitProbability, calculatePortfolioFailAll, sigmaScaleFor } from "../src/engine/admissions/probability";
import { calculateSubjectRoiList } from "../src/engine/roi/engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASS: ${message}`);
}
const near = (a: number | undefined, b: number, eps = 0.005) => a !== undefined && Math.abs(a - b) <= eps;

const fixture = JSON.parse(readFileSync(new URL("../../tests/backend/fixtures/parity_school_rules.json", import.meta.url), "utf-8")) as {
  rules: SchoolRule[];
  programs: Record<string, unknown>[];
  profiles: Record<string, unknown>[];
};
const profile = (i: number) => ({ name: "", grade: "", highSchool: "", homeProvince: "", availableHoursPerWeek: 0, relocationWillingness: "khong_gioi_han", annualBudgetVnd: 0, ...fixture.profiles[i] }) as unknown as StudentProfile;
const program = (i: number) => ({ programId: "x", ...fixture.programs[i] }) as unknown as TargetProgram;

// ---- 1. Quy tắc riêng từng trường ----
clearSchoolRules();
registerSchoolRules(fixture.rules);

// BKA (thi): Toán x2 → (2·9 + 8 + 8.5)/40·30 = 25.875 → 25.88; IELTS 6.5 cộng 2 điểm; ưu tiên KV2 giảm dần ≈ 0.14 → tổng 28.02
const bka = scoreForProgram(profile(0), program(2));
assert(near(bka?.rawScore, 25.88) && near(bka?.score, 28.02) && bka?.ruleOrigin === "school", "Hệ số môn (Toán x2) + điểm cộng IELTS + ưu tiên theo đúng quy tắc trường");
// Trường không có quy tắc dùng công thức chung: 9 + 8 + 8.5 = 25.5, ưu tiên 0.15 → 25.65
const common = scoreForProgram(profile(0), program(4));
assert(near(common?.score, 25.65) && common?.ruleOrigin === "default", "Trường chưa có quy tắc dùng công thức chung và được ghi rõ");
// QHI (học bạ lớp 11, 12): toán (8+9)/2, lý (8+8.5)/2, hóa (8+8.2)/2 = 8.5+8.25+8.1 = 24.85, không ưu tiên
const qhi = scoreForProgram(profile(0), program(3));
assert(near(qhi?.score, 24.85) && qhi?.bonus === 0, "Học bạ lấy đúng các lớp trường quy định, không cộng ưu tiên khi trường không cộng");
// ZZ1 (ĐGNL 55% + thi 35% + học bạ 10%): 900/1200·30=22.5; thi 25.5; học bạ 24.5 → 12.375 + 8.925 + 2.45 = 23.75, ưu tiên 0.21 → 23.96
const zz1 = scoreForProgram(profile(0), program(0));
assert(near(zz1?.score, 23.96) && near(zz1?.rawScore, 23.75), "Điểm gồm nhiều thành phần có tỷ trọng (ĐGNL 55% + thi 35% + học bạ 10%)");
// Thiếu đầu vào: nói rõ thiếu gì thay vì tính sai
assert(scoreForProgram(profile(1), program(3)) === null && missingInputsForProgram(profile(1), program(3)).join() === "Điểm học bạ lớp 11,Điểm học bạ lớp 12", "Thiếu điểm học bạ từng lớp thì không tính và nêu đúng cần bổ sung gì");
assert(scoreForProgram(profile(1), program(0)) === null && missingInputsForProgram(profile(1), program(0)).includes("Điểm ĐGNL ĐHQG-HCM"), "Thiếu điểm ĐGNL thì không tính và nêu đúng cần bổ sung gì");
// Ngưỡng đầu vào riêng của trường (tổng thi tối thiểu 18)
assert(scoreForProgram(profile(1), program(2)) === null, "Tổng điểm thi dưới ngưỡng riêng của trường thì không được xét");
// ZZ2: bảng quy đổi IELTS riêng của trường (6.5 → mức 6.0 → 9.0 điểm thay Tiếng Anh 4): 7 + 6 + 9 = 22
const zz2 = scoreForProgram(profile(3), program(6));
assert(near(zz2?.score, 22) && zz2?.usedIeltsConversion === true, "Quy đổi IELTS theo bảng riêng của trường (lấy mức cao nhất đạt được)");
// ZZ2 học bạ: tổng 3 môn 24 < ngưỡng riêng 25 của trường → không được xét
assert(scoreForProgram(profile(3), program(7)) === null, "Tổng điểm học bạ dưới ngưỡng riêng của trường thì không được xét");
// Trường chưa có bảng riêng: KHÔNG quy đổi IELTS (nhiều trường không cho dùng chứng chỉ thay điểm thi)
const cons = scoreForProgram({ ...profile(3), activeCombination: "D01" }, { programId: "x", schoolCode: "NOP", admissionMethod: "THPT", combinations: ["D01"] } as unknown as TargetProgram);
assert(near(cons?.score, 7 + 6 + 4) && cons?.usedIeltsConversion === false, "Trường chưa có bảng riêng: không quy đổi IELTS, chỉ dùng điểm thi thật");
// Phương thức trường tuyên bố chưa tính được thì không đoán
registerSchoolRules([{ schoolCode: "ZZ9", year: 2026, source: { url: "https://example.test/zz9", verifiedAt: "2026-10-03", verifiedBy: "test-fixture" }, methods: { HOC_BA: { unsupportedReason: "Trường chưa công bố bảng quy đổi học bạ", priority: "standard", components: [] } } }]);
assert(scoreForProgram(profile(3), { programId: "x", schoolCode: "ZZ9", admissionMethod: "HOC_BA", combinations: ["A00"] } as unknown as TargetProgram) === null, "Phương thức trường chưa công bố cách quy đổi thì không tính xác suất");
// ZZ3: học bạ nhân hệ số quy đổi 5/6, ngưỡng 18: hồ sơ 3 có học bạ 8+8+8=24 → 24 × 5/6 = 20.00
const zz3 = scoreForProgram(profile(3), program(8));
assert(near(zz3?.score, 20) && near(zz3?.rawScore, 20), "Học bạ nhân hệ số quy đổi của trường (5/6): 24 điểm thành 20 điểm xét tuyển");
// ZZ4: trường chỉ nhận A01/D01; đề án không ghi tổ hợp từng ngành nên dùng tổ hợp trường nhận, không phải tổ hợp tốt nhất của học sinh.
// Hồ sơ 3 (D01: 7 + 6 + 4 = 17) + điểm thưởng IELTS 6.5 = 0.75 cho ngành kinh tế; ngành sư phạm không được cộng.
const zz4 = scoreForProgram(profile(3), program(9));
assert(near(zz4?.score, 17.75) && zz4?.combo === "D01" && zz4?.comboUnverified === false, "Tổ hợp trường nhận (D01) thay cho tổ hợp suy đoán; điểm thưởng IELTS theo bảng của trường");
assert(scoreForProgram(profile(3), program(10)) === null, "Ngành sư phạm: tổng 3 môn thi 17 dưới ngưỡng 18 thì không được xét (dù có điểm cộng)");
// Phương thức không có quy tắc
assert(scoreForProgram(profile(0), program(5)) === null && missingInputsForProgram(profile(0), program(5)).length === 0, "Phương thức chưa có quy tắc thì không tính, không bịa");

const bad = JSON.parse(JSON.stringify(fixture.rules[0])) as SchoolRule;
bad.methods.THPT!.components[0].weight = 0.5;
assert(validateSchoolRule(bad).some((p) => p.includes("tổng tỷ trọng")), "Quy tắc có tổng tỷ trọng sai bị từ chối");
bad.methods.THPT!.components[0].weight = 1;
bad.source.url = "khong-phai-url";
assert(validateSchoolRule(bad).some((p) => p.includes("văn bản gốc")), "Quy tắc không có nguồn văn bản gốc bị từ chối");
clearSchoolRules();

// ---- 2. Sàn 15 điểm từ 2026 ----
const low = { ...profile(0), examScores: { toan: 4, ly: 4.5, hoa: 5 }, hocBaScores: undefined, altScores: { ielts: 8 }, graduationYear: 2026, priority: { area: "KV1", object: "uu_tien_1" } } as StudentProfile;
assert(buildCandidateOptions(DECISION_PROGRAM_POOL, low).length === 0, "Tổng 3 môn thi dưới 15 điểm: không ngành xét điểm thi nào tính được, dù có IELTS hay ưu tiên");

// ---- 3. Ràng buộc và đề xuất nguyện vọng trên dữ liệu thật ----
const student = {
  ...profile(0),
  examScores: { toan: 8, ly: 7.5, anh: 7.25, hoa: 7, van: 6.5 },
  hocBaScores: { toan: 8.8, ly: 8.5, anh: 8.4, hoa: 8.6, van: 8 },
  activeCombination: "A01",
  homeProvince: "Nghệ An",
  relocationWillingness: "trong_vung",
  interestMajorGroups: [],
} as StudentProfile;
const all = buildCandidateOptions(DECISION_PROGRAM_POOL, student);
const matched = filterByConstraints(all, student);
assert(all.length > 1000 && matched.length > 0 && matched.length < all.length, "Ràng buộc 'cùng vùng' loại bớt ngành nhưng vẫn còn lựa chọn");
assert(matched.every((c) => c.region === "trung"), "Mọi ngành còn lại đều ở miền Trung (cùng vùng với Nghệ An)");
assert(new Set(all.map((c) => c.majorKey || c.programId)).size === all.length, "Mỗi ngành chỉ xuất hiện một lần (phương thức tốt nhất)");

const suggestion = suggestPortfolio(matched, false).items;

// Ngành em yêu thích còn cơ hội đỗ được ưu tiên đưa vào danh sách đề xuất
const favoriteTargets = matched.filter((c) => c.admitProbability >= 0.1 && c.admitProbability < 0.4 && !suggestion.includes(c)).slice(0, 2);
const withFavorites = suggestPortfolio(matched, false, favoriteTargets.map((c) => c.programId)).items;
assert(favoriteTargets.length === 2 && favoriteTargets.every((c) => withFavorites.some((x) => x.programId === c.programId)), "Ngành yêu thích (còn cơ hội đỗ) được đưa vào danh sách đề xuất");
assert(withFavorites.filter((c) => c.admitProbability >= 0.8).length >= 2 || withFavorites.length < 6, "Ưu tiên ngành yêu thích vẫn giữ nguyện vọng chắc đỗ");
assert(suggestion.length > 0 && suggestion.length <= 15, "Đề xuất tối đa 15 nguyện vọng");
const perSchool = new Map<string, number>();
for (const c of suggestion) perSchool.set(c.schoolCode, (perSchool.get(c.schoolCode) ?? 0) + 1);
assert([...perSchool.values()].every((n) => n <= 3), "Mỗi trường tối đa 3 nguyện vọng");
const firstSure = suggestion.findIndex((c) => c.admitProbability >= 0.95);
assert(firstSure === -1 || firstSure === suggestion.length - 1, "Không đề xuất nguyện vọng đứng sau một nguyện vọng gần như chắc đỗ");
assert(suggestion.every((c, i) => c.majorGroup !== "su_pham" || i < 5), "Ngành sư phạm luôn nằm trong 5 nguyện vọng đầu");
const warnings = portfolioWarnings(suggestion.map((c, i) => candidateToWishlistItem(c, i + 1)));
assert(!warnings.some((w) => w.code === "SHADOWED" || w.code === "TEACHER_RANK"), "Danh sách đề xuất không vi phạm các cảnh báo cấu trúc");

// ---- 3b. Độ bất định theo độ cũ của dữ liệu ----
assert(sigmaScaleFor(FORECAST_YEAR - 1, 3) === 1 && Math.abs(sigmaScaleFor(FORECAST_YEAR - 3, 3) - Math.sqrt(3)) < 1e-9, "Dữ liệu cũ hơn thì độ bất định tăng theo căn bậc hai số năm");
assert(Math.abs(sigmaScaleFor(FORECAST_YEAR - 1, 1) - 1.3) < 1e-9, "Chương trình chỉ có 1 năm dữ liệu có độ bất định lớn hơn");
assert(calculateAdmitProbability(24, 22, 1, 1.5, 1.2, sigmaScaleFor(FORECAST_YEAR - 3, 1)) < calculateAdmitProbability(24, 22, 1, 1.5, 1.2, 1), "Cùng điểm, dữ liệu cũ và mỏng thì xác suất đỗ kém chắc chắn hơn");

// ---- 3c. Xác suất trường nhận tổ hợp khi đề án không ghi ----
const accept = comboAcceptancePrior(DECISION_PROGRAM_POOL);
const a00 = accept("cntt", "A00");
const rare = accept("cntt", "A09");
assert(a00 > 0 && a00 < 1 && rare >= 0 && rare < a00, "Tỷ lệ trường nhận tổ hợp phổ biến (A00) cao hơn tổ hợp hiếm, đều nằm trong (0, 1)");
const unverified = all.filter((c) => c.combinationsVerified === false);
assert(unverified.length > 100 && unverified.every((c) => typeof c.comboAcceptance === "number" && c.comboAcceptance > 0 && c.comboAcceptance <= 1), "Mọi ngành chưa rõ tổ hợp đều mang xác suất trường nhận tổ hợp");
assert(all.filter((c) => c.combinationsVerified !== false).every((c) => c.comboAcceptance === undefined), "Ngành đã rõ tổ hợp không bị nhân xác suất nhận tổ hợp");

// ---- 4. Lưu trữ ----
const dirty = sanitize({
  profile: { examScores: { toan: 8, ly: 99, hoa: -2, anh: "x" }, interestMajorGroups: ["cntt", 5] },
  wishlist: Array.from({ length: 20 }, (_, i) => ({ school_code: "AAA", program_id: `p${i}` })).concat([{ school_code: 7 } as never]),
  primaryTarget: { programId: "t1" },
});
assert(JSON.stringify(dirty.profile.examScores) === '{"toan":8}', "Điểm ngoài khoảng 0–10 hoặc sai kiểu bị loại khi nạp dữ liệu đã lưu");
assert(dirty.wishlist.length === 15 && dirty.wishlist.every((w, i) => w.rank === i + 1), "Danh sách nguyện vọng đã lưu bị cắt về tối đa 15 và đánh số lại");
assert(dirty.target?.programId === "t1" && dirty.profile.interestMajorGroups?.join() === "cntt", "Dữ liệu phiên bản cũ được chuyển sang cấu trúc mới");
assert(sanitize(null).wishlist.length === 0 && sanitize("rác").profile.activeCombination === "", "Dữ liệu hỏng trả về hồ sơ trống");

console.log("\n🎉 TẤT CẢ KIỂM THỬ QUY TẮC TRƯỜNG, ĐỀ XUẤT VÀ LƯU TRỮ ĐÃ ĐẠT.");

// ---- Ngoại lệ theo nhóm ngành: Toán nhân 2 trừ nhóm ngôn ngữ ----
// Hồ sơ 0 (A00: 9 + 8 + 8.5): Toán x2 → (18 + 8 + 8.5)/40·30 = 25.875; ngôn ngữ không hệ số → 25.5 (ưu tiên KV2 cộng thêm 0.15)
clearSchoolRules();
registerSchoolRules(fixture.rules);
const zz9Math = scoreForProgram(profile(0), program(11));
const zz9Language = scoreForProgram(profile(0), program(12));
assert(near(zz9Math?.rawScore, 25.88) && near(zz9Language?.rawScore, 25.5), "Ngoại lệ theo nhóm ngành: ngành ngôn ngữ không nhân hệ số Toán, các ngành khác vẫn nhân");

// ---- Điểm cộng giải thưởng, ngưỡng và điều kiện học lực của ngành sư phạm ----
clearSchoolRules();
registerSchoolRules(fixture.rules);
// Hồ sơ 4 (giải nhì tỉnh 0,75): 25.88 + 0.75 + ưu tiên 0.14 = 26.77; không có giải: 26.02
const award = scoreForProgram(profile(4), program(11));
assert(near(award?.score, 26.77) && near(scoreForProgram(profile(0), program(11))?.score, 26.02), "Giải học sinh giỏi cấp tỉnh được cộng điểm theo văn bản của trường");
assert(scoreForProgram(profile(5), program(13)) === null && scoreForProgram(profile(0), program(13)) !== null, "Ngành sư phạm: tổng 3 môn thi dưới 18 thì không được xét theo điểm thi");
assert(scoreForProgram(profile(4), program(14)) === null && scoreForProgram(profile(5), program(14)) !== null, "Ngành sư phạm xét học bạ: học lực lớp 12 chưa giỏi thì không được xét");

// ---- Học thêm môn nào: mô phỏng tăng 1 điểm từng môn của tổ hợp ----
const roiTarget = { programId: "roi", schoolCode: "ZZ9", schoolName: "Z", majorName: "Ngành thử", majorGroup: "kinh_te", forecastP10: 24, forecastP50: 26.5, forecastP90: 28, tuitionVnd: null, employmentRate: null, dataPassport: "", combinations: ["A00"], admissionMethod: "THPT" } as unknown as TargetProgram;
const roi = calculateSubjectRoiList(profile(0), roiTarget, [roiTarget]);
assert(roi.length === 3 && roi.every((r) => r.admitProbAfter >= r.admitProbBefore && r.simulatedScore <= 10), "Mô phỏng tăng điểm: xác suất đỗ không giảm và điểm không vượt 10");
assert(roi[0].admitProbAfter - roi[0].admitProbBefore >= roi[2].admitProbAfter - roi[2].admitProbBefore, "Môn mang lại nhiều lợi nhất xếp đầu");

// ---- Ngành cùng trường cùng chịu một cú sốc riêng: rủi ro trượt cả hai cao hơn hai trường khác nhau ----
const twoItems = (a: string, b: string) => calculatePortfolioFailAll([
  { userScore: 22, forecastP50: 22, schoolCode: a },
  { userScore: 22, forecastP50: 22, schoolCode: b },
]);
assert(twoItems("AAA", "AAA") > twoItems("AAA", "BBB"), "Hai ngành cùng trường trượt cùng lúc nhiều hơn hai ngành khác trường");
