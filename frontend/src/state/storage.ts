/**
 * NGUYỆN VỌNG AI - PERSISTENT STORAGE ENGINE (SSOT)
 * Chuẩn hóa lưu trữ bền vững Client-side (LocalStorage) kết hợp Hybrid API Sync.
 * Schema validation v4.0.0, an toàn trước F5, hỗ trợ Backup/Restore JSON.
 */

import {
  StudentProfile,
  TargetProgram,
  ExamScores,
  AlternativeScores,
  Priority,
  RelocationWillingness,
  PolicyStatus,
  WishlistItem,
  TimeDeduction,
} from "@/engine/types";
import { BLANK_USER_DECISION_PROFILE } from "@/engine/decision-profile";

export const STORAGE_SCHEMA_VERSION = "4.0.0";
export const STORAGE_KEY_V4 = "nguyen_vong_ai_app_state_v4";
export const PROFILES_REGISTRY_KEY = "nguyen_vong_ai_profiles_registry_v1";

export interface StoredProfileMeta {
  id: string;
  name: string;
  grade?: string;
  highSchool?: string;
  activeCombination?: string;
  targetSchoolCode?: string;
  updatedAt: string;
}

export interface StoredProfileEntry extends StoredProfileMeta {
  state: PersistentAppState;
}

export interface ProfilesRegistry {
  activeProfileId: string;
  profiles: StoredProfileEntry[];
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description?: string;
  deltaScores: Partial<ExamScores>;
  annualBudgetVnd?: number;
  region?: string;
  riskTolerance?: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  progressText: string;
  weight: number;
  completed: boolean;
  skipped: boolean;
  scheduledDate?: string;
  note?: string;
  createdAt: string;
}

export interface ScheduleSlotData {
  label: string;
  type: "anh" | "toan" | "ly" | "luyen_de" | "on_tong_hop" | "nghi_ngoi" | string;
}

export type WeeklyScheduleMatrixData = Record<string, Record<string, ScheduleSlotData>>;

export interface MockHistoryEntry {
  id: string;
  testName: string;
  testDate: string;
  reliabilityTier: "tier_1_specialized_school" | "tier_2_provincial_highschool" | "tier_3_online_mock" | string;
  scores: Partial<ExamScores>;
  note?: string;
  timestamp: string;
}

export interface UserPreferences {
  rankedMajors: { major_group: string; weight: number }[];
  careerImportance: number;
  schoolPrestigeSensitivity: number;
  dreamSchoolCodes: string[];
}

export interface UserConstraints {
  annualBudgetVnd: number;
  relocationWillingness: RelocationWillingness;
  mustStayNearHome: boolean;
  policyStatus: PolicyStatus;
  excludedSchoolCodes: string[];
  excludedMajorGroups: string[];
}

export interface PersistentAppState {
  version: string;
  lastSavedAt: string;
  isSampleMode: boolean;
  activePersonaId: string | null;

  // 1. Profile & Scores
  profile: StudentProfile;
  altScores: AlternativeScores;
  mockHistory: MockHistoryEntry[];

  // 2. Targets
  primaryTarget: TargetProgram | null;
  targetsList: TargetProgram[];

  // 3. Preferences & Constraints
  preferences: UserPreferences;
  constraints: UserConstraints;

  // 4. Scenarios
  scenarios: WhatIfScenario[];
  activeScenarioId: string | null;

  // 5. Study Plan & Schedule
  studyTasks: StudyTask[];
  scheduleMatrix: WeeklyScheduleMatrixData;
  timeDeduction: TimeDeduction;

  // 6. Recommendations & Portfolio
  wishlist: WishlistItem[];
  favoriteProgramIds: string[];
  hiddenProgramIds: string[];
  compareProgramIds: string[];

  // 7. Activity Logs
  historyLogs: { timestamp: string; note: string; newScore: number }[];
}

export const DEFAULT_SCHEDULE_MATRIX: WeeklyScheduleMatrixData = {
  // Trống cho hồ sơ mới; component tạo gợi ý từ study-plan engine.
};

// Nhận diện lịch mẫu từng được lưu mặc định ở schema v4 để không tiếp tục hiển thị như lịch của học sinh.
const LEGACY_DEFAULT_SCHEDULE_MATRIX: WeeklyScheduleMatrixData = {
  "08:00 – 10:00": { T2: { label: "Tiếng Anh", type: "anh" }, T3: { label: "Tiếng Anh", type: "anh" }, T4: { label: "Tiếng Anh", type: "anh" }, T5: { label: "Toán", type: "toan" }, T6: { label: "Tiếng Anh", type: "anh" }, T7: { label: "Đề luyện", type: "luyen_de" }, CN: { label: "Ôn tổng hợp", type: "on_tong_hop" } },
  "10:30 – 12:00": { T2: { label: "Toán", type: "toan" }, T3: { label: "Toán", type: "toan" }, T4: { label: "Vật lý", type: "ly" }, T5: { label: "Tiếng Anh", type: "anh" }, T6: { label: "Toán", type: "toan" }, T7: { label: "Tiếng Anh", type: "anh" }, CN: { label: "Tiếng Anh", type: "anh" } },
  "14:00 – 16:00": { T2: { label: "Vật lý", type: "ly" }, T3: { label: "Tiếng Anh", type: "anh" }, T4: { label: "Tiếng Anh", type: "anh" }, T5: { label: "Tiếng Anh", type: "anh" }, T6: { label: "Đề luyện", type: "luyen_de" }, T7: { label: "Vật lý", type: "ly" }, CN: { label: "Toán", type: "toan" } },
  "19:00 – 21:00": { T2: { label: "Tiếng Anh", type: "anh" }, T3: { label: "Vật lý", type: "ly" }, T4: { label: "Toán", type: "toan" }, T5: { label: "Vật lý", type: "ly" }, T6: { label: "Tiếng Anh", type: "anh" }, T7: { label: "Ôn tổng hợp", type: "on_tong_hop" }, CN: { label: "Nghỉ ngơi", type: "nghi_ngoi" } },
};

function isLegacyDefaultSchedule(value: WeeklyScheduleMatrixData | undefined): boolean {
  if (!value) return false;
  return JSON.stringify(value) === JSON.stringify(LEGACY_DEFAULT_SCHEDULE_MATRIX);
}

export const INITIAL_STUDY_TASKS: StudyTask[] = [
  {
    id: "task-1",
    title: "Học 5 buổi Tiếng Anh (Từ vựng chuyên sâu & Đọc hiểu)",
    subject: "anh",
    progressText: "5/5",
    weight: 2,
    completed: true,
    skipped: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Làm 3 đề Toán phân hóa cao (Hàm số & Tích phân)",
    subject: "toan",
    progressText: "3/3",
    weight: 2,
    completed: true,
    skipped: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Ôn 2 chuyên đề Vật lý (Sóng cơ & Dao động điều hòa)",
    subject: "ly",
    progressText: "2/2",
    weight: 2,
    completed: true,
    skipped: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Học 300 từ vựng học thuật IELTS/THPT",
    subject: "anh",
    progressText: "120/300",
    weight: 2,
    completed: false,
    skipped: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-5",
    title: "Làm 1 đề tổng hợp cuối tuần bấm giờ chuẩn",
    subject: "luyen_de",
    progressText: "0/1",
    weight: 2,
    completed: false,
    skipped: false,
    createdAt: new Date().toISOString(),
  },
];

export function getBlankAppState(): PersistentAppState {
  return {
    version: STORAGE_SCHEMA_VERSION,
    lastSavedAt: new Date().toISOString(),
    isSampleMode: false,
    activePersonaId: null,

    profile: { ...BLANK_USER_DECISION_PROFILE },
    altScores: {
      hoc_ba_gpa: null,
      dgnl_hn: null,
      dgnl_hcm: null,
      dgtd_bk: null,
      ielts: null,
      toeic: null,
      sat: null,
      act: null,
      hsg_tinh: null,
      hsg_quoc_gia: null,
      khoa_hoc_ky_thuat: null,
    },
    mockHistory: [],

    primaryTarget: null,
    targetsList: [],

    preferences: {
      rankedMajors: [{ major_group: "cntt", weight: 1.0 }],
      careerImportance: 0.7,
      schoolPrestigeSensitivity: 0.6,
      dreamSchoolCodes: [],
    },
    constraints: {
      annualBudgetVnd: 0,
      relocationWillingness: "trong_vung",
      mustStayNearHome: false,
      policyStatus: "none",
      excludedSchoolCodes: [],
      excludedMajorGroups: [],
    },

    scenarios: [],
    activeScenarioId: null,

    // Người dùng mới bắt đầu với danh sách việc trống (không có tiến độ giả)
    studyTasks: [],
    scheduleMatrix: {},
    timeDeduction: {
      totalWeeklyHours: 168,
      sleepHours: 52.5,
      schoolHours: 30.0,
      extraClassesHours: 12.0,
      livingHours: 21.0,
      availableHours: 52.5,
    },

    wishlist: [],
    favoriteProgramIds: [],
    hiddenProgramIds: [],
    compareProgramIds: [],

    historyLogs: [
      {
        timestamp:
          new Date().toLocaleDateString("vi-VN") +
          " " +
          new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        note: "Hồ sơ khởi tạo trạng thái sạch (Blank State) — Sẵn sàng nhập liệu",
        newScore: 0,
      },
    ],
  };
}

/**
 * Quản lý LocalStorage an toàn với Schema Validation & Migration
 */
export class LocalStorageEngine {
  private static memoryFallback: PersistentAppState | null = null;

  static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  static load(): PersistentAppState {
    if (!this.isBrowser()) {
      return this.memoryFallback || getBlankAppState();
    }

    try {
      // 1. Kiểm tra version mới nhất v4
      const raw = window.localStorage.getItem(STORAGE_KEY_V4);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistentAppState>;
        return this.migrateAndSanitize(parsed);
      }

      // 2. Tự động di chuyển từ v3 nếu có
      const legacyV3 = window.localStorage.getItem("nguyen_vong_ai_decision_state_v3");
      if (legacyV3) {
        const parsedV3 = JSON.parse(legacyV3);
        const blank = getBlankAppState();
        const migrated: PersistentAppState = {
          ...blank,
          profile: parsedV3.profile || blank.profile,
          primaryTarget: parsedV3.target || null,
          isSampleMode: Boolean(parsedV3.isSampleMode),
          activePersonaId: parsedV3.activePersonaId || null,
          historyLogs: parsedV3.historyLogs || blank.historyLogs,
        };
        this.save(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn("[StorageEngine] Failed to parse stored state, reverting to blank:", e);
    }

    const blank = getBlankAppState();
    this.memoryFallback = blank;
    return blank;
  }

  static save(state: PersistentAppState): void {
    const updatedState: PersistentAppState = {
      ...state,
      version: STORAGE_SCHEMA_VERSION,
      lastSavedAt: new Date().toISOString(),
    };

    this.memoryFallback = updatedState;

    if (!this.isBrowser()) return;

    try {
      window.localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(updatedState));
    } catch (e) {
      console.error("[StorageEngine] Failed to write to localStorage:", e);
    }
  }

  static clear(): void {
    this.memoryFallback = null;
    if (!this.isBrowser()) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY_V4);
      window.localStorage.removeItem("nguyen_vong_ai_decision_state_v3");
      window.localStorage.removeItem("nguyen_vong_ai_decision_state_v2");
    } catch (e) {
      console.warn("[StorageEngine] Failed to clear localStorage:", e);
    }
  }

  static exportToJson(): string {
    const state = this.load();
    return JSON.stringify(state, null, 2);
  }

  static importFromJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") {
        return { success: false, error: "Dữ liệu JSON không hợp lệ." };
      }
      const sanitized = this.migrateAndSanitize(parsed);
      this.save(sanitized);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message || "Lỗi khi đọc file JSON." };
    }
  }

  // ==========================================================================
  // MULTI-PROFILE REGISTRY (QUẢN LÝ NHIỀU HỒ SƠ NGƯỜI DÙNG TRÊN CÙNG MỘT MÁY)
  // ==========================================================================

  static getRegistry(): ProfilesRegistry {
    const current = this.load();
    if (!this.isBrowser()) {
      return {
        activeProfileId: "profile_default",
        profiles: [
          {
            id: "profile_default",
            name: current.profile.name?.trim() || "Hồ sơ chính",
            grade: current.profile.grade,
            highSchool: current.profile.highSchool,
            activeCombination: current.profile.activeCombination,
            targetSchoolCode: current.primaryTarget?.schoolCode,
            updatedAt: current.lastSavedAt || new Date().toISOString(),
            state: current,
          },
        ],
      };
    }

    try {
      const raw = window.localStorage.getItem(PROFILES_REGISTRY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProfilesRegistry;
        if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          // Bảo đảm profile active tồn tại trong mảng
          const activeExists = parsed.profiles.some((p) => p.id === parsed.activeProfileId);
          if (!activeExists) {
            parsed.activeProfileId = parsed.profiles[0].id;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[StorageEngine] Failed to read profiles registry:", e);
    }

    // Khởi tạo Registry ban đầu từ trạng thái hiện có
    const initialProfile: StoredProfileEntry = {
      id: "profile_default",
      name: current.profile.name?.trim() || "Hồ sơ chính",
      grade: current.profile.grade,
      highSchool: current.profile.highSchool,
      activeCombination: current.profile.activeCombination,
      targetSchoolCode: current.primaryTarget?.schoolCode,
      updatedAt: current.lastSavedAt || new Date().toISOString(),
      state: current,
    };

    const initialRegistry: ProfilesRegistry = {
      activeProfileId: "profile_default",
      profiles: [initialProfile],
    };

    this.saveRegistry(initialRegistry);
    return initialRegistry;
  }

  static saveRegistry(registry: ProfilesRegistry): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(PROFILES_REGISTRY_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error("[StorageEngine] Failed to save profiles registry:", e);
    }
  }

  static getSavedProfilesMeta(): StoredProfileMeta[] {
    const registry = this.getRegistry();
    return registry.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      grade: p.grade,
      highSchool: p.highSchool,
      activeCombination: p.activeCombination,
      targetSchoolCode: p.targetSchoolCode,
      updatedAt: p.updatedAt,
    }));
  }

  static saveActiveProfile(state: PersistentAppState, profileId?: string): void {
    this.save(state);
    const registry = this.getRegistry();
    const targetId = profileId || registry.activeProfileId;
    const nowStr = new Date().toISOString();

    const idx = registry.profiles.findIndex((p) => p.id === targetId);
    const entry: StoredProfileEntry = {
      id: targetId,
      name: state.profile.name?.trim() || "Hồ sơ chưa đặt tên",
      grade: state.profile.grade,
      highSchool: state.profile.highSchool,
      activeCombination: state.profile.activeCombination,
      targetSchoolCode: state.primaryTarget?.schoolCode,
      updatedAt: nowStr,
      state,
    };

    if (idx >= 0) {
      registry.profiles[idx] = entry;
    } else {
      registry.profiles.push(entry);
    }
    registry.activeProfileId = targetId;
    this.saveRegistry(registry);
  }

  static switchProfile(targetProfileId: string): PersistentAppState | null {
    const registry = this.getRegistry();
    const found = registry.profiles.find((p) => p.id === targetProfileId);
    if (!found) return null;

    registry.activeProfileId = targetProfileId;
    this.saveRegistry(registry);
    this.save(found.state);
    return found.state;
  }

  static createNewProfile(initialName?: string): { newId: string; newState: PersistentAppState } {
    const registry = this.getRegistry();
    const newId = `profile_${Date.now()}`;
    const newState = getBlankAppState();
    if (initialName && initialName.trim()) {
      newState.profile.name = initialName.trim();
    }
    newState.lastSavedAt = new Date().toISOString();

    const newEntry: StoredProfileEntry = {
      id: newId,
      name: newState.profile.name?.trim() || `Hồ sơ ${registry.profiles.length + 1}`,
      grade: newState.profile.grade,
      highSchool: newState.profile.highSchool,
      activeCombination: newState.profile.activeCombination,
      targetSchoolCode: undefined,
      updatedAt: newState.lastSavedAt,
      state: newState,
    };

    registry.profiles.push(newEntry);
    registry.activeProfileId = newId;
    this.saveRegistry(registry);
    this.save(newState);

    return { newId, newState };
  }

  static deleteProfile(profileId: string): { activeId: string; activeState: PersistentAppState } {
    const registry = this.getRegistry();
    registry.profiles = registry.profiles.filter((p) => p.id !== profileId);

    if (registry.profiles.length === 0) {
      // Nếu xóa hết, tự động tạo lại một hồ sơ sạch mặc định
      const fresh = this.createNewProfile("Hồ sơ chính");
      return { activeId: fresh.newId, activeState: fresh.newState };
    }

    if (registry.activeProfileId === profileId) {
      registry.activeProfileId = registry.profiles[0].id;
    }

    this.saveRegistry(registry);
    const active = registry.profiles.find((p) => p.id === registry.activeProfileId)!;
    this.save(active.state);
    return { activeId: active.id, activeState: active.state };
  }

  private static migrateAndSanitize(input: Partial<PersistentAppState>): PersistentAppState {
    const blank = getBlankAppState();
    return {
      version: STORAGE_SCHEMA_VERSION,
      lastSavedAt: input.lastSavedAt || new Date().toISOString(),
      isSampleMode: Boolean(input.isSampleMode),
      activePersonaId: input.activePersonaId || null,

      profile: {
        ...blank.profile,
        ...(input.profile || {}),
        examScores: {
          ...blank.profile.examScores,
          ...(input.profile?.examScores || {}),
        },
      },
      altScores: {
        ...blank.altScores,
        ...(input.altScores || input.profile?.altScores || {}),
      },
      mockHistory: Array.isArray(input.mockHistory) ? input.mockHistory : blank.mockHistory,

      primaryTarget: input.primaryTarget !== undefined ? input.primaryTarget : blank.primaryTarget,
      targetsList: Array.isArray(input.targetsList) ? input.targetsList : blank.targetsList,

      preferences: {
        ...blank.preferences,
        ...(input.preferences || {}),
      },
      constraints: {
        ...blank.constraints,
        ...(input.constraints || {}),
      },

      scenarios: Array.isArray(input.scenarios) ? input.scenarios : blank.scenarios,
      activeScenarioId: input.activeScenarioId || null,

      studyTasks: Array.isArray(input.studyTasks) && input.studyTasks.length > 0 ? input.studyTasks : blank.studyTasks,
      scheduleMatrix: !input.scheduleMatrix || isLegacyDefaultSchedule(input.scheduleMatrix)
        ? blank.scheduleMatrix
        : input.scheduleMatrix,
      timeDeduction: input.timeDeduction || blank.timeDeduction,

      wishlist: Array.isArray(input.wishlist) ? input.wishlist : blank.wishlist,
      favoriteProgramIds: Array.isArray(input.favoriteProgramIds) ? input.favoriteProgramIds : [],
      hiddenProgramIds: Array.isArray(input.hiddenProgramIds) ? input.hiddenProgramIds : [],
      compareProgramIds: Array.isArray(input.compareProgramIds) ? input.compareProgramIds : [],

      historyLogs: Array.isArray(input.historyLogs) ? input.historyLogs : blank.historyLogs,
    };
  }
}
