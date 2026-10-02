/**
 * TEST SUITE KIỂM THỬ TỰ ĐỘNG FRONTEND STORAGE ENGINE (SUBAGENT 4)
 * Kiểm tra tính đúng đắn của Storage Engine, Schema Validation, F5 Persistence, và CRUD logic.
 */

import {
  LocalStorageEngine,
  getBlankAppState,
  STORAGE_SCHEMA_VERSION,
  WhatIfScenario,
  StudyTask,
} from "../src/state/storage";

// Giả lập môi trường LocalStorage cho Node runtime
const mockStore: Record<string, string> = {};
global.window = {
  localStorage: {
    getItem: (key: string) => mockStore[key] || null,
    setItem: (key: string, val: string) => {
      mockStore[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      for (const k in mockStore) delete mockStore[k];
    },
    length: 0,
    key: () => null,
  },
} as any;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✓ PASS: ${msg}`);
}

async function runStorageEngineTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ FRONTEND STORAGE ENGINE & PERSISTENCE ===");

  // 1. Kiểm tra Blank State
  const blank = getBlankAppState();
  assert(blank.version === STORAGE_SCHEMA_VERSION, "Schema version v4.0.0 chuẩn xác");
  assert(blank.profile.name === "", "Profile name mặc định rỗng");
  assert(blank.profile.examScores.toan === null, "Điểm Toán mặc định null");
  assert(blank.primaryTarget === null, "Primary target mặc định null");
  assert(blank.isSampleMode === false, "isSampleMode mặc định false");

  // 2. Lưu trạng thái người dùng (Create / Update Profile & Scores)
  blank.profile.name = "Trần Thị Ánh";
  blank.profile.examScores = { toan: 9.2, ly: 8.8, anh: 9.0 };
  blank.primaryTarget = {
    programId: "BKA_IT1",
    schoolCode: "BKA",
    schoolName: "Đại học Bách Khoa Hà Nội",
    majorName: "Kỹ thuật Máy tính (IT1)",
    majorGroup: "cntt",
    forecastP10: 27.2,
    forecastP50: 28.5,
    forecastP90: 29.1,
    tuitionVnd: 32000000,
    employmentRate: 98.9,
    aiExposure: 0.2,
    leverageScore: 8.5,
    dataPassport: "Trang 12 Đề án BKA 2024",
    combinations: ["A00", "A01"],
  };
  blank.preferences.dreamSchoolCodes = ["BKA", "QHI"];
  blank.constraints.annualBudgetVnd = 50000000;

  // 3. Thêm kịch bản What-If (Scenarios CRUD)
  const newScenario: WhatIfScenario = {
    id: "sc-test-fe-1",
    name: "Kịch bản Toán 9.5 & Tiếng Anh 9.5",
    deltaScores: { toan: 0.3, anh: 0.5 },
    annualBudgetVnd: 55000000,
    region: "hanoi",
    riskTolerance: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  blank.scenarios.push(newScenario);

  // 4. Thêm nhiệm vụ tự học (Study Tasks CRUD)
  const newTask: StudyTask = {
    id: "task-fe-1",
    title: "Luyện 3 đề nâng cao Bách Khoa",
    subject: "toan",
    progressText: "0/3",
    weight: 2,
    completed: false,
    skipped: false,
    createdAt: new Date().toISOString(),
  };
  blank.studyTasks.push(newTask);

  // 5. Thêm tương tác Recommendations (Favorites, Hiddens, Compares)
  blank.favoriteProgramIds.push("BKA_IT1");
  blank.compareProgramIds.push("BKA_IT1", "QHI_CN1");
  blank.hiddenProgramIds.push("X_TRUONG_LOAI_TRU");

  // Lưu vào LocalStorage
  LocalStorageEngine.save(blank);
  assert(Boolean(mockStore["nguyen_vong_ai_app_state_v4"]), "State được ghi vào LocalStorage key v4 an toàn");

  // 6. Giả lập Reload trình duyệt (F5 Simulation)
  const reloaded = LocalStorageEngine.load();
  assert(reloaded.profile.name === "Trần Thị Ánh", "F5 giữ nguyên Profile Name");
  assert(reloaded.profile.examScores.toan === 9.2, "F5 giữ nguyên điểm thi Toán");
  assert(reloaded.primaryTarget?.programId === "BKA_IT1", "F5 giữ nguyên Target Program");
  assert(reloaded.scenarios.length === 1, "F5 giữ nguyên danh sách kịch bản");
  assert(reloaded.scenarios[0].name === "Kịch bản Toán 9.5 & Tiếng Anh 9.5", "Nội dung kịch bản nguyên vẹn");
  assert(reloaded.studyTasks.some((t) => t.id === "task-fe-1"), "F5 giữ nguyên Study Tasks");
  assert(reloaded.favoriteProgramIds.includes("BKA_IT1"), "F5 giữ nguyên Favorite Program");
  assert(reloaded.compareProgramIds.length === 2, "F5 giữ nguyên Compare Program list");

  // 7. Test Export JSON Backup & Import JSON
  const exportedJson = LocalStorageEngine.exportToJson();
  assert(typeof exportedJson === "string" && exportedJson.length > 50, "Export JSON thành công");

  // Xóa sạch bộ nhớ
  LocalStorageEngine.clear();
  const emptyAfterClear = LocalStorageEngine.load();
  assert(emptyAfterClear.profile.name === "", "Sau clear, profile trở về rỗng");

  // Import lại từ file backup
  const importResult = LocalStorageEngine.importFromJson(exportedJson);
  assert(importResult.success === true, "Import JSON thành công");
  const restored = LocalStorageEngine.load();
  assert(restored.profile.name === "Trần Thị Ánh", "Sau Import, Profile Name phục hồi hoàn toàn");
  assert(restored.primaryTarget?.programId === "BKA_IT1", "Sau Import, Target phục hồi hoàn toàn");

  console.log("=== TOÀN BỘ 7 BỘ TEST STORAGE ENGINE & F5 PERSISTENCE PASS 100% ===");
}

runStorageEngineTests().catch((err) => {
  console.error("Lỗi thực thi test:", err);
  process.exit(1);
});
