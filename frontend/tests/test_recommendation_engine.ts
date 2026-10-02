/**
 * TEST SUITE: RECOMMENDATION ENGINE ĐA NHÂN TỐ (SUBAGENT 7)
 * Kiểm thử toàn diện 12 yếu tố, 3 tầng chiến lược và Reason Codes (+/- tags).
 */

import {
  runRecommendationEngine,
  evaluateProgram,
  findBestCombinationForProgram,
  calculateMinistryPriorityBonus,
  getIeltsEquivalentEnglishScore,
} from "../src/engine/recommend/recommendation-engine";
import { StudentProfile } from "../src/engine/types";
import { ALL_PROGRAMS_CATALOG } from "../src/data/catalog";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED ASSERTION: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ SUBAGENT 7: RECOMMENDATION ENGINE ĐA NHÂN TỐ");
  console.log("==================================================================");

  // 1. Kiểm tra nạp dữ liệu thật từ programs.parquet qua ALL_PROGRAMS_CATALOG
  console.log("\n--- TEST 1: KIỂM TRA NẠP DỮ LIỆU TỪ PROGRAMS.PARQUET ---");
  // Sau lớp làm sạch (data/catalog.ts): loại dòng điểm chuẩn < 12, tên ngành là nhãn phương thức, xét học bạ
  assert(ALL_PROGRAMS_CATALOG.length >= 1000, `Catalog sau làm sạch còn >= 1000 chương trình (hiện có: ${ALL_PROGRAMS_CATALOG.length})`);
  assert(
    ALL_PROGRAMS_CATALOG.every((p) => Object.values(p.cutoffs).every((v) => v >= 12 && v <= 30)),
    "Không còn điểm chuẩn không hợp lệ (< 12 hoặc > 30)"
  );
  assert(
    ALL_PROGRAMS_CATALOG.every((p) => !/^\s*(tổ hợp|phương thức|\()|học bạ/i.test(p.majorName)),
    "Không còn dòng có tên là nhãn phương thức / tổ hợp / học bạ"
  );
  assert(
    ALL_PROGRAMS_CATALOG.filter((p) => p.tuitionVnd === 24_000_000).length === 0,
    "Học phí placeholder 24tr đã được thay bằng null (chưa có dữ liệu)"
  );
  assert(
    ALL_PROGRAMS_CATALOG.filter((p) => p.schoolCode === "QST").every((p) => !p.schoolName.includes("Bách Khoa")),
    "Mã QST không còn bị gán nhầm tên ĐH Bách Khoa"
  );
  const bkaProgs = ALL_PROGRAMS_CATALOG.filter((p) => p.schoolCode === "BKA");
  assert(bkaProgs.length > 0, `Có dữ liệu trường ĐH Bách Khoa Hà Nội (BKA) (số ngành: ${bkaProgs.length})`);
  const qstProgs = ALL_PROGRAMS_CATALOG.filter((p) => p.schoolCode === "QST" || p.schoolCode === "QSB");
  assert(qstProgs.length > 0, `Có dữ liệu trường ĐH Bách Khoa TP.HCM (QST/QSB)`);

  // 2. Hồ sơ thử nghiệm 1: Học sinh khối Tự nhiên (Toán 8.5, Lý 8.0, Anh 8.5, Hóa 6.5) có IELTS 6.5, KV2-NT
  console.log("\n--- TEST 2: KIỂM TRA TỐI ƯU TỔ HỢP MÔN & ĐỔI ĐIỂM IELTS (YẾU TỐ 6 & 7) ---");
  const student1: StudentProfile = {
    name: "Trần Minh Đức",
    grade: "12",
    highSchool: "THPT Chuyên Lê Hồng Phong",
    homeProvince: "TP.HCM",
    annualBudgetVnd: 40000000,
    relocationWillingness: "chi_tinh_nha",
    availableHoursPerWeek: 35,
    activeCombination: "A01",
    examScores: {
      toan: 8.5,
      ly: 8.0,
      hoa: 6.5,
      anh: 8.5,
      van: 7.0,
    },
    altScores: {
      ielts: 6.5, // IELTS 6.5 quy đổi Tiếng Anh 9.5
      hoc_ba_gpa: 8.8,
    },
    priority: {
      area: "KV2-NT",
      object: "none",
    },
  };

  const ieltsVal = getIeltsEquivalentEnglishScore(student1.altScores.ielts);
  assert(ieltsVal === 9.5, `IELTS 6.5 tự động quy đổi thành Tiếng Anh 9.5đ (kết quả: ${ieltsVal})`);

  const comboResult = findBestCombinationForProgram(
    student1.examScores,
    student1.altScores,
    student1.priority,
    ["A00", "A01", "D01"]
  );
  // Tổ hợp A01 dùng Toán 8.5 + Lý 8.0 + Anh (quy đổi 9.5) = 26.0đ + bonus KV2-NT
  assert(comboResult.bestCombo === "A01", `Tự động chọn tổ hợp tối ưu A01 thay vì A00 (kết quả: ${comboResult.bestCombo})`);
  assert(comboResult.bestScore >= 26.0, `Điểm tổ hợp A01 đạt tối ưu >= 26.0đ (kết quả: ${comboResult.bestScore}đ)`);

  // 3. Kiểm tra công thức điểm ưu tiên chuẩn Bộ GD&ĐT (Yếu tố 12)
  console.log("\n--- TEST 3: KIỂM TRA ĐIỂM ƯU TIÊN SUY GIẢM BỘ GD&ĐT (YẾU TỐ 12) ---");
  const bonusBelow225 = calculateMinistryPriorityBonus(21.0, "KV1", "none");
  assert(bonusBelow225 === 0.75, `Dưới 22.5đ hưởng trọn vẹn điểm KV1 +0.75đ (kết quả: ${bonusBelow225})`);
  const bonusAbove225 = calculateMinistryPriorityBonus(27.0, "KV1", "none");
  // (30 - 27) / 7.5 * 0.75 = 3 / 7.5 * 0.75 = 0.3đ
  assert(Math.abs(bonusAbove225 - 0.3) < 0.05, `Trên 22.5đ áp dụng công thức giảm dần của Bộ (27đ KV1 còn 0.30đ, kết quả: ${bonusAbove225})`);

  // 4. Kiểm tra phân nhóm 3 tầng chiến lược (SAFER, BALANCED, AMBITIOUS)
  console.log("\n--- TEST 4: PHÂN NHÓM 3 TẦNG CHIẾN LƯỢC & REASON CODES (+/- TAGS) ---");
  const result = runRecommendationEngine(student1, {
    ambitionLevel: 0.5,
    maxWishes: 15,
  });

  assert(result.saferRecommendations.length > 0, `Có nhóm SAFER (An toàn): ${result.saferRecommendations.length} ngành`);
  assert(result.balancedRecommendations.length > 0, `Có nhóm BALANCED (Cân bằng): ${result.balancedRecommendations.length} ngành`);
  assert(result.ambitiousRecommendations.length > 0, `Có nhóm AMBITIOUS (Thách thức): ${result.ambitiousRecommendations.length} ngành`);
  assert(result.recommendedPortfolio.length === 15, `Danh mục khuyến nghị đủ 15 nguyện vọng (hiện có: ${result.recommendedPortfolio.length})`);
  assert(result.pFailAll < 0.10, `Rủi ro trượt tất cả P(Fail All) được kiểm soát < 10% (hiện tại: ${(result.pFailAll * 100).toFixed(2)}%)`);

  // 5. Kiểm tra Reason Codes (+/- tags)
  console.log("\n--- TEST 5: KIỂM TRA NỘI DUNG REASON CODES (+/- TAGS) ---");
  const sampleRec = result.recommendedPortfolio[0];
  assert(sampleRec.positiveTags.length > 0, `Có reason code tích cực [+] cho nguyện vọng 1: ${sampleRec.positiveTags.map(t => t.label).join(" | ")}`);
  
  // Kiểm tra tồn tại các tag chuẩn
  const allTags = result.recommendedPortfolio.flatMap(p => p.allTags);
  const hasPlus = allTags.some(t => t.label.startsWith("[+]"));
  const hasMinus = allTags.some(t => t.label.startsWith("[-]"));
  assert(hasPlus, `Có các tag tích cực [+] trong danh mục`);
  assert(hasMinus, `Có các tag cảnh báo rủi ro [-] trong danh mục`);

  // 6. Kiểm tra ràng buộc ngân sách & vị trí địa lý (Yếu tố 4 & 5)
  console.log("\n--- TEST 6: RÀNG BUỘC HỌC PHÍ & VỊ TRÍ ĐỊA LÝ (YẾU TỐ 4 & 5) ---");
  const studentLowBudget: StudentProfile = {
    ...student1,
    homeProvince: "Đà Nẵng",
    relocationWillingness: "chi_tinh_nha",
    annualBudgetVnd: 25000000,
  };
  const resultLowBudget = runRecommendationEngine(studentLowBudget, {
    maxWishes: 15,
  });

  const hasDanang = resultLowBudget.recommendedPortfolio.some(p => p.schoolCode.startsWith("DD") || p.province === "Đà Nẵng");
  assert(hasDanang, `Ưu tiên cao các trường tại Đà Nẵng khi thí sinh chỉ muốn học ở tỉnh nhà (relocationWillingness = chi_tinh_nha)`);

  console.log("\n==================================================================");
  console.log("🎉 TẤT CẢ CÁC KIỂM THỬ CHO SUBAGENT 7 ĐÃ VƯỢT QUA 100%!");
  console.log("==================================================================");
}

runTestSuite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
