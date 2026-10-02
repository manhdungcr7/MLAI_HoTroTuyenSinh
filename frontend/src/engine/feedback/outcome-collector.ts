/**
 * LOCAL-FIRST ADMISSIONS OUTCOME TELEMETRY & FEEDBACK COLLECTOR
 * Tuân thủ tuyệt đối Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân:
 * - 100% Ẩn danh: KHÔNG lưu tên, KHÔNG số CCCD, KHÔNG số điện thoại, KHÔNG ngày sinh cụ thể.
 * - Local-First: Toàn bộ dữ liệu lưu trữ tại localStorage của trình duyệt thí sinh.
 * - Thu thập vòng lặp thực chứng: Đối chiếu xác suất AI dự báo với kết quả tuyển sinh thực tế
 *   sau đợt công bố điểm chuẩn tháng 7-8 hàng năm để hiệu chuẩn mô hình liên tục.
 */

import { StudentProfile, WishlistItem } from "@/engine/types";

export interface AnonymizedPortfolioItem {
  rank: number;
  schoolCode: string;
  majorName: string;
  majorGroup: string;
  combination: string;
  predictedProbability: number;
  role: "mao_hiem" | "vua_tam" | "an_toan";
  cutoffP50: number;
}

export interface ActualAdmissionOutcome {
  admittedRank: number | null; // Thứ tự NV trúng tuyển (null nếu trượt tất cả)
  admittedSchoolCode: string | null;
  admittedMajorName: string | null;
  actualCutoffScore?: number | null;
  outcomeRecordedAt: string; // ISO timestamp
  feedbackRating?: 1 | 2 | 3 | 4 | 5; // Mức độ hài lòng với tư vấn AI
  studentNote?: string;
}

export interface TelemetryFeedbackRecord {
  sessionId: string; // Mã phiên ngẫu nhiên (UUID v4 hoặc nano-id)
  createdAt: string;
  graduationYear: number;
  scoreSnapshot: {
    combination: string;
    totalCompositeScore: number;
    provinceTier?: string;
  };
  predictedWishlist: AnonymizedPortfolioItem[];
  predictedFailAllProbability: number;
  actualOutcome?: ActualAdmissionOutcome;
}

const STORAGE_KEY = "nguyen_vong_admissions_telemetry_v1";

function generateAnonymousSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "session_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
}

/**
 * Đọc toàn bộ lịch sử phản hồi kết quả từ LocalStorage
 */
export function getStoredTelemetryRecords(): TelemetryFeedbackRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[OutcomeCollector] Lỗi đọc dữ liệu telemetry:", err);
    return [];
  }
}

/**
 * Lưu danh sách bản ghi phản hồi vào LocalStorage
 */
function saveStoredTelemetryRecords(records: TelemetryFeedbackRecord[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("[OutcomeCollector] Không thể lưu bản ghi telemetry:", err);
  }
}

/**
 * Ghi lại ảnh chụp (Snapshot) danh mục dự báo tại thời điểm thí sinh hoàn tất tối ưu
 */
export function recordPredictionSnapshot(
  profile: StudentProfile,
  wishlist: WishlistItem[],
  pFailAll: number,
  primaryCombination: string,
  primaryScore: number
): string {
  const records = getStoredTelemetryRecords();
  const sessionId = generateAnonymousSessionId();

  const anonymizedItems: AnonymizedPortfolioItem[] = wishlist.map((w) => ({
    rank: w.rank,
    schoolCode: w.school_code,
    majorName: w.major_label,
    majorGroup: w.major_group || "other",
    combination: w.combinations_seen || "A00",
    predictedProbability: w.admit_prob,
    role: w.role,
    cutoffP50: w.forecast_p50 ?? 0,
  }));


  const newRecord: TelemetryFeedbackRecord = {
    sessionId,
    createdAt: new Date().toISOString(),
    graduationYear: profile.graduationYear ?? 2026,
    scoreSnapshot: {
      combination: primaryCombination,
      totalCompositeScore: primaryScore,
      provinceTier: profile.priority?.area,
    },
    predictedWishlist: anonymizedItems,
    predictedFailAllProbability: Number(pFailAll.toFixed(4)),
  };

  records.unshift(newRecord);
  // Giới hạn lưu tối đa 20 bản ghi gần nhất trên máy thí sinh
  saveStoredTelemetryRecords(records.slice(0, 20));
  return sessionId;
}

/**
 * Cập nhật kết quả trúng tuyển thực tế (Sau khi Bộ GD&ĐT công bố điểm chuẩn tháng 7-8)
 */
export function updateActualAdmissionOutcome(
  sessionId: string,
  outcome: ActualAdmissionOutcome
): boolean {
  const records = getStoredTelemetryRecords();
  const target = records.find((r) => r.sessionId === sessionId);
  if (!target) return false;

  target.actualOutcome = outcome;
  saveStoredTelemetryRecords(records);
  return true;
}

/**
 * Xuất dữ liệu telemetry dưới dạng JSON để gửi nghiên cứu / hiệu chuẩn mô hình
 * Tuân thủ Nghị định 13: Đảm bảo dữ liệu xuất ra không chứa bất kỳ trường định danh nào
 */
export function exportAnonymizedTelemetryJson(): string {
  const records = getStoredTelemetryRecords();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      compliance: "Decree_13_2023_ND_CP_Anonymized_Education_Telemetry",
      recordCount: records.length,
      records,
    },
    null,
    2
  );
}

/**
 * Tính toán độ chuẩn hóa thực nghiệm (Empirical Accuracy) từ các bản ghi có kết quả thật
 */
export function calculateLocalCalibrationMetrics(): {
  completedCases: number;
  brierScore: number | null;
  admitMatchesExpectedRate: number | null;
} {
  const records = getStoredTelemetryRecords().filter((r) => r.actualOutcome !== undefined);
  if (records.length === 0) {
    return { completedCases: 0, brierScore: null, admitMatchesExpectedRate: null };
  }

  let totalSquaredError = 0;
  let totalTrials = 0;
  let matchesExpectation = 0;

  for (const r of records) {
    const outcome = r.actualOutcome!;
    for (const w of r.predictedWishlist) {
      const actualAdmit = outcome.admittedRank === w.rank ? 1.0 : 0.0;
      totalSquaredError += (w.predictedProbability - actualAdmit) ** 2;
      totalTrials++;

      if (actualAdmit === 1.0 && w.predictedProbability >= 0.4) {
        matchesExpectation++;
      }
    }
  }

  const brierScore = totalTrials > 0 ? Number((totalSquaredError / totalTrials).toFixed(4)) : null;
  const admitRate = records.length > 0 ? Number((matchesExpectation / records.length).toFixed(2)) : null;

  return {
    completedCases: records.length,
    brierScore,
    admitMatchesExpectedRate: admitRate,
  };
}
