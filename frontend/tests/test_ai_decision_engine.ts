/**
 * TEST SUITE: AI / DECISION INTELLIGENCE ENGINE (SUBAGENT 6)
 * Kiểm thử quy trình Decision Pipeline 10 bước, Structured Output chuẩn,
 * kiểm soát triệt để hallucination và kiểm thử 4 ngữ cảnh AI Copilot.
 */

import {
  runFullAiDecisionPipeline,
  validateStudentData,
  extractStudentFeatures,
  askAiAboutAnalysis,
  askAiAboutOptionFit,
  askAiAboutScenarioImpact,
  askAiAboutStudyPlanOptimization,
  AiDecisionStructuredOutput,
} from "../src/engine/explain/ai-decision-engine";
import {
  StudentProfile,
  TargetProgram,
  CandidateOption,
  StudyPlan,
  TimeDeduction,
} from "../src/engine/types";
import { GOLDEN_PROGRAMS } from "../src/data/universities";
import { runGapAnalysis } from "../src/engine/gap/engine";
import { calculateSubjectRoiList } from "../src/engine/roi/engine";
import { buildStudyPlan } from "../src/engine/study-plan/engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED ASSERTION: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function validateStructuredOutputContract(output: AiDecisionStructuredOutput, contextName: string) {
  assert(typeof output.summary === "string" && output.summary.length > 20, `${contextName}: summary hợp lệ (${output.summary.slice(0, 45)}...)`);
  assert(Array.isArray(output.key_findings) && output.key_findings.length > 0, `${contextName}: key_findings có ${output.key_findings.length} mục`);
  assert(Array.isArray(output.risks) && output.risks.length > 0, `${contextName}: risks có ${output.risks.length} mục`);
  // Cơ hội chỉ được nêu khi có số liệu chứng minh — mảng rỗng hợp lệ (không bịa "uy tín hàng đầu"...)
  assert(Array.isArray(output.opportunities), `${contextName}: opportunities là mảng (${output.opportunities.length} mục)`);
  assert(
    [output.summary, ...output.key_findings, ...output.opportunities].every((t) => !/tuyệt đối|chắc chắn đỗ|uy tín học thuật hàng đầu/i.test(t)),
    `${contextName}: không có khẳng định chắc chắn / nhận xét không có căn cứ`
  );
  assert(Array.isArray(output.recommended_actions) && output.recommended_actions.length > 0, `${contextName}: recommended_actions có ${output.recommended_actions.length} mục`);
  assert(typeof output.confidence === "number" && output.confidence >= 0 && output.confidence <= 1.0, `${contextName}: confidence hợp lệ (${output.confidence})`);
  assert(Array.isArray(output.data_missing), `${contextName}: data_missing là mảng (số lượng: ${output.data_missing.length})`);
  assert(Array.isArray(output.explanation) && output.explanation.length > 0, `${contextName}: explanation có ${output.explanation.length} bước`);
  
  // Provenance
  assert(output.provenance !== undefined && output.provenance !== null, `${contextName}: provenance tồn tại`);
  assert(Array.isArray(output.provenance.observed_data) && output.provenance.observed_data.length > 0, `${contextName}: provenance.observed_data hợp lệ`);
  assert(Array.isArray(output.provenance.user_entered_data) && output.provenance.user_entered_data.length > 0, `${contextName}: provenance.user_entered_data hợp lệ`);
  assert(Array.isArray(output.provenance.estimated_data) && output.provenance.estimated_data.length > 0, `${contextName}: provenance.estimated_data hợp lệ`);
  assert(Array.isArray(output.provenance.ai_generated_analysis) && output.provenance.ai_generated_analysis.length > 0, `${contextName}: provenance.ai_generated_analysis hợp lệ`);
}

async function runSubagent6TestSuite() {
  console.log("==================================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ SUBAGENT 6: AI / DECISION INTELLIGENCE LAYER");
  console.log("==================================================================");

  // 1. Hồ sơ thử nghiệm chuẩn hóa
  const sampleTarget: TargetProgram = GOLDEN_PROGRAMS[0]; // QHI_CN1
  const studentProfile: StudentProfile = {
    name: "Phạm Nhật Minh",
    grade: "12",
    highSchool: "THPT Chuyên Hà Nội - Amsterdam",
    homeProvince: "Hà Nội",
    annualBudgetVnd: 50000000,
    relocationWillingness: "chi_tinh_nha",
    availableHoursPerWeek: 30,
    activeCombination: "A01",
    examScores: {
      toan: 9.0,
      ly: 8.5,
      anh: 8.8,
      van: 7.5,
      hoa: 8.0,
    },
    altScores: {
      ielts: 7.5,
      hoc_ba_gpa: 9.2,
    },
    priority: {
      area: "KV3",
      object: "none",
    },
    targetProgram: sampleTarget,
  };

  // TEST 1: KIỂM TRA CHUẨN XÁC NGUYÊN BẢN CỦA DỮ LIỆU ĐÍCH (ZERO FABRICATION)
  console.log("\n--- TEST 1: ZERO HALLUCINATION TRÊN GOLDEN CANONICAL DATA ---");
  assert(sampleTarget.schoolCode === "QHI", "Mã trường mục tiêu khớp với ĐH Công nghệ (QHI)");
  assert(sampleTarget.cutoff2024 === 27.90, `Điểm chuẩn 2024 chuẩn xác từ Đề án: ${sampleTarget.cutoff2024}`);
  assert(sampleTarget.dataPassport.includes("ĐH Công Nghệ 2024"), `Data Passport trích dẫn chính xác: ${sampleTarget.dataPassport}`);

  // TEST 2: KIỂM TRA VALIDATION VÀ TÍNH NĂNG FEATURE EXTRACTION
  console.log("\n--- TEST 2: VALIDATION & FEATURE EXTRACTION (STEPS 1 & 2) ---");
  const validation = validateStudentData(studentProfile, sampleTarget);
  assert(validation.isValid === true, "Hồ sơ đủ điểm và chỉ tiêu hợp lệ");
  assert(validation.dataQualityScore >= 0.8, `Điểm chất lượng dữ liệu cao: ${validation.dataQualityScore * 100}%`);

  const features = extractStudentFeatures(studentProfile, sampleTarget);
  assert(features.compositeScore >= 26.0, `Điểm tổng hợp tổ hợp A01 tính đúng: ${features.compositeScore.toFixed(2)}`);
  assert((features.budgetAffordabilityRatio ?? 0) >= 1.0, `Tỷ lệ ngân sách / học phí khả thi: ${features.budgetAffordabilityRatio}x`);

  // TEST 3: FULL DECISION PIPELINE EXECUTION VỚI STRUCTURED OUTPUT CHUẨN
  console.log("\n--- TEST 3: FULL 10-STEP DECISION PIPELINE EXECUTION ---");
  const pipelineOutput = runFullAiDecisionPipeline(studentProfile, sampleTarget, GOLDEN_PROGRAMS);
  validateStructuredOutputContract(pipelineOutput, "Pipeline Output");
  console.log("Summary:", pipelineOutput.summary);
  console.log("Provenance Observed Data:", pipelineOutput.provenance.observed_data[0]);

  // TEST 4: KIỂM TRA PHÁT HIỆN THIẾU DỮ LIỆU (DATA MISSING DETECTION)
  console.log("\n--- TEST 4: DATA MISSING DETECTION VÀ ĐỀ XUẤT HÀNH ĐỘNG ---");
  const incompleteStudent: StudentProfile = {
    ...studentProfile,
    examScores: { toan: null, ly: null, anh: null }, // Thiếu sạch điểm tổ hợp
    annualBudgetVnd: 0,
    targetProgram: null,
  };
  const incompleteValidation = validateStudentData(incompleteStudent, null);
  assert(incompleteValidation.isValid === false, "Phát hiện chính xác hồ sơ thiếu dữ liệu");
  assert(incompleteValidation.missingFields.length >= 3, `Liệt kê rõ các trường thiếu: ${incompleteValidation.missingFields.join("; ")}`);
  const incompletePipeline = runFullAiDecisionPipeline(incompleteStudent, null, GOLDEN_PROGRAMS);
  assert(incompletePipeline.data_missing.length >= 3, "Structured Output phản ánh trung thực mảng data_missing");
  assert(incompletePipeline.recommended_actions.some(a => a.includes("Bổ sung dữ liệu còn thiếu")), "Có đề xuất hành động bổ sung dữ liệu bị khuyết");

  // TEST 5: CONTEXTUAL AI COPILOT — ANALYSIS SCREEN ("Hỏi AI về kết quả này")
  console.log("\n--- TEST 5: CONTEXTUAL AI COPILOT — ANALYSIS SCREEN ---");
  const gapAnalysis = runGapAnalysis(sampleTarget, studentProfile);
  const subjectRoiList = calculateSubjectRoiList(studentProfile, sampleTarget, GOLDEN_PROGRAMS);
  const analysisCopilot = askAiAboutAnalysis(gapAnalysis, subjectRoiList, studentProfile, sampleTarget);
  validateStructuredOutputContract(analysisCopilot, "Analysis Copilot");
  assert(analysisCopilot.key_findings.some(f => f.includes("Vị thế")), "Analysis copilot có phân tích vị thế dải điểm");

  // TEST 6: CONTEXTUAL AI COPILOT — OPTIONS SCREEN ("Vì sao lựa chọn này phù hợp?")
  console.log("\n--- TEST 6: CONTEXTUAL AI COPILOT — OPTIONS SCREEN ---");
  const sampleCandidate: CandidateOption = {
    programId: "BKA_IT1",
    schoolCode: "BKA",
    schoolName: "ĐH Bách Khoa Hà Nội",
    majorName: "Khoa học Máy tính (IT1)",
    majorGroup: "cntt",
    combination: "A00, A01",
    cutoffP50: 28.5,
    userScore: 26.3,
    gap: -2.2,
    admitProbability: 0.35,
    tuitionVnd: 32000000,
    employmentRate: 99.2,
    aiExposure: 0.15,
    role: "mao_hiem",
    whyThisOptionVi: "Đỉnh cao đào tạo CNTT",
    dataPassportUrl: "Đề án Tuyển sinh ĐHBK Hà Nội 2024",
  };
  const optionCopilot = askAiAboutOptionFit(sampleCandidate, studentProfile, sampleTarget);
  validateStructuredOutputContract(optionCopilot, "Option Copilot");
  assert(optionCopilot.summary.includes("Bách Khoa Hà Nội") || optionCopilot.summary.includes("BKA"), "Option copilot nêu đúng tên trường thật");

  // TEST 7: CONTEXTUAL AI COPILOT — SCENARIO SCREEN ("Giải thích tác động của kịch bản này")
  console.log("\n--- TEST 7: CONTEXTUAL AI COPILOT — SCENARIO / WHAT-IF SCREEN ---");
  const whatIfDelta = { toan: 0.5, anh: 0.5 };
  const scenarioCopilot = askAiAboutScenarioImpact(
    studentProfile.examScores,
    whatIfDelta,
    studentProfile,
    sampleTarget,
    GOLDEN_PROGRAMS
  );
  validateStructuredOutputContract(scenarioCopilot, "Scenario Copilot");
  assert(scenarioCopilot.key_findings.some(f => f.includes("Dịch chuyển") || f.includes("dịch chuyển")), "Scenario copilot có phân tích dịch chuyển điểm");

  // TEST 8: CONTEXTUAL AI COPILOT — STUDY PLAN SCREEN ("Tối ưu hóa thời gian học")
  console.log("\n--- TEST 8: CONTEXTUAL AI COPILOT — STUDY PLAN SCREEN ---");
  const timeDeduction: TimeDeduction = {
    totalWeeklyHours: 168,
    sleepHours: 52.5,
    schoolHours: 30.0,
    extraClassesHours: 12.0,
    livingHours: 21.0,
    availableHours: 52.5,
  };
  const studyPlan = buildStudyPlan(studentProfile, subjectRoiList, sampleTarget, timeDeduction);
  const studyPlanCopilot = askAiAboutStudyPlanOptimization(
    studyPlan,
    timeDeduction,
    subjectRoiList,
    studentProfile,
    sampleTarget
  );
  validateStructuredOutputContract(studyPlanCopilot, "Study Plan Copilot");
  assert(studyPlanCopilot.key_findings.some(f => f.includes("Quỹ thời gian")), "Study plan copilot có phân tích quỹ thời gian");

  console.log("\n==================================================================");
  console.log("🎉 TẤT CẢ CÁC KIỂM THỬ CHO SUBAGENT 6 ĐÃ VƯỢT QUA 100%!");
  console.log("==================================================================");
}

runSubagent6TestSuite().catch((e) => {
  console.error("Test Suite Failed:", e);
  process.exit(1);
});
