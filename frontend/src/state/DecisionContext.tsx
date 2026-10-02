import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  StudentProfile,
  TargetProgram,
  GapMetric,
  SubjectRoiMetric,
  CandidateOption,
  WishlistItem,
  StudyPlan,
  ExamScores,
  AlternativeScores,
  TimeDeduction,
  ClosedLoopDiff,
} from "@/engine/types";
import { GOLDEN_PROGRAMS } from "@/data/universities";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { BLANK_USER_DECISION_PROFILE } from "@/engine/decision-profile";
import { SAMPLE_PERSONAS, getSamplePersona } from "@/data/seed/personas";
import { runGapAnalysis } from "@/engine/gap/engine";
import { calculateSubjectRoiList } from "@/engine/roi/engine";
import { buildCandidateOptions, buildOptimizedPortfolio, calculateWishlistFailAll } from "@/engine/decision/optimizer";
import { buildStudyPlan } from "@/engine/study-plan/engine";
import { computeClosedLoopMockTest } from "@/engine/study-plan/closed-loop";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { NATIONAL_SHOCK_STD } from "@/engine/admissions/probability";
import { runRecommendationEngine, RecommendationEngineResult, EvaluatedRecommendation } from "@/engine/recommend/recommendation-engine";
import {
  LocalStorageEngine,
  PersistentAppState,
  WhatIfScenario,
  StudyTask,
  WeeklyScheduleMatrixData,
  ScheduleSlotData,
  MockHistoryEntry,
  UserPreferences,
  UserConstraints,
  getBlankAppState,
  StoredProfileMeta,
} from "@/state/storage";
import { ALL_PROGRAMS_CATALOG, DECISION_PROGRAM_POOL } from "@/data/catalog";
import { computeUtilityBreakdown } from "@/engine/decision/optimizer";

export interface MockTestSubmission {
  testName: string;
  testDate: string;
  reliabilityTier: "tier_1_specialized_school" | "tier_2_provincial_highschool" | "tier_3_online_mock";
  newScores: Partial<Record<keyof ExamScores, number>>;
  note?: string;
}

export interface DecisionContextType {
  // 1. Profile CRUD & Multi-Profile Management
  profile: StudentProfile;
  isSampleMode: boolean;
  hasUserData: boolean;
  activePersonaId: string | null;
  savedProfiles: StoredProfileMeta[];
  activeProfileId: string;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  createNewProfile: (name?: string) => void;
  switchProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  logoutProfile: () => void;
  loadPersona: (personaId: string) => void;
  resetToBlank: () => void;

  // 2. Scores CRUD & History
  updateExamScore: (subject: keyof ExamScores, score: number | null) => void;
  altScores: AlternativeScores;
  updateAltScore: (key: keyof AlternativeScores, score: any) => void;
  deleteExamScore: (subject: keyof ExamScores) => void;
  updateMockScore: (subject: keyof ExamScores, newScore: number, note?: string) => void;
  submitMockTest: (submission: MockTestSubmission) => ClosedLoopDiff | null;
  mockHistory: MockHistoryEntry[];
  deleteMockHistory: (id: string) => void;
  latestClosedLoopDiff: ClosedLoopDiff | null;
  clearClosedLoopDiff: () => void;

  // 3. Targets CRUD
  target: TargetProgram | null;
  targetsList: TargetProgram[];
  setTarget: (newTarget: TargetProgram | null) => void;
  addTarget: (target: TargetProgram) => void;
  updateTarget: (programId: string, updates: Partial<TargetProgram>) => void;
  removeTarget: (programId: string) => void;
  setPrimaryTarget: (programId: string) => void;

  // 4. Preferences & Constraints CRUD
  preferences: UserPreferences;
  constraints: UserConstraints;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateConstraints: (updates: Partial<UserConstraints>) => void;

  // 5. Scenarios CRUD
  scenarios: WhatIfScenario[];
  activeScenarioId: string | null;
  whatIfDelta: ExamScores;
  whatIfBudget: number | null;
  createScenario: (name: string, data?: Partial<WhatIfScenario>) => WhatIfScenario;
  duplicateScenario: (scenarioId: string) => WhatIfScenario | null;
  updateScenario: (scenarioId: string, updates: Partial<WhatIfScenario>) => void;
  deleteScenario: (scenarioId: string) => void;
  applyScenario: (scenarioId: string) => void;
  applyWhatIf: (delta: Partial<ExamScores>, newBudget?: number) => void;
  resetWhatIf: () => void;

  // 6. Study Plan & Schedule CRUD
  studyPlan: StudyPlan;
  studyTasks: StudyTask[];
  addStudyTask: (task: Omit<StudyTask, "id" | "createdAt">) => StudyTask;
  updateStudyTask: (taskId: string, updates: Partial<StudyTask>) => void;
  completeStudyTask: (taskId: string, completed?: boolean) => void;
  skipStudyTask: (taskId: string, skipped?: boolean) => void;
  rescheduleStudyTask: (taskId: string, newDate: string) => void;
  deleteStudyTask: (taskId: string) => void;
  scheduleMatrix: WeeklyScheduleMatrixData;
  updateScheduleSlot: (time: string, day: string, slot: ScheduleSlotData) => void;
  timeDeduction: TimeDeduction;
  updateTimeDeduction: (updates: Partial<TimeDeduction>) => void;

  // 7. Recommendations Interactions & Wishlist CRUD
  candidates: CandidateOption[];
  wishlist: WishlistItem[];
  pFailAll: number;
  gapAnalysis: GapMetric;
  subjectRoiList: SubjectRoiMetric[];
  favoriteProgramIds: string[];
  hiddenProgramIds: string[];
  compareProgramIds: string[];
  toggleFavoriteRecommendation: (programId: string) => void;
  toggleHideRecommendation: (programId: string) => void;
  toggleCompareRecommendation: (programId: string) => void;
  clearCompareRecommendations: () => void;
  reorderWishlist: (sourceIndex: number, destinationIndex: number) => void;
  removeWishlistItem: (rank: number) => void;
  addWishlistItem: (option: CandidateOption) => boolean;
  setWishlist: (newWishlist: WishlistItem[]) => void;
  updateWishlistItemRole: (rank: number, newRole: "mao_hiem" | "vua_tam" | "an_toan") => void;
  applyCustomDistribution: (targetReach: number, targetFit: number, targetSafe: number) => void;
  autoBalancePortfolio: () => void;
  resetToRecommendedPortfolio: () => void;

  // 7.1 Multi-Factor Recommendation Engine (Subagent 7)
  recommendationResult: RecommendationEngineResult;
  saferRecommendations: EvaluatedRecommendation[];
  balancedRecommendations: EvaluatedRecommendation[];
  ambitiousRecommendations: EvaluatedRecommendation[];

  // 8. Navigation & System
  isRecalculating: boolean;
  historyLogs: { timestamp: string; note: string; newScore: number }[];
  activeStep: number;
  setActiveStep: (step: number) => void;
  isSyncing: boolean;
  lastSavedAt: string | null;
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => { success: boolean; error?: string };
}

const DecisionContext = createContext<DecisionContextType | undefined>(undefined);

// Thang điểm tối đa của từng loại điểm thay thế (dùng để chặn giá trị sai khi nhập)
const ALT_SCORE_MAX: Record<string, number> = {
  hoc_ba_gpa: 10,
  dgnl_hcm: 1200,
  dgnl_hn: 150,
  dgtd_bk: 100,
  ielts: 9,
  toeic: 990,
  sat: 1600,
  act: 36,
};

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  // Nạp trạng thái từ LocalStorageEngine & Registry hồ sơ
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return LocalStorageEngine.getRegistry().activeProfileId;
  });
  const [savedProfiles, setSavedProfiles] = useState<StoredProfileMeta[]>(() => {
    return LocalStorageEngine.getSavedProfilesMeta();
  });
  const [appState, setAppState] = useState<PersistentAppState>(() => {
    return LocalStorageEngine.load();
  });

  // What-If delta runtime
  const [whatIfDelta, setWhatIfDelta] = useState<ExamScores>({});
  const [whatIfBudget, setWhatIfBudget] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [latestClosedLoopDiff, setLatestClosedLoopDiff] = useState<ClosedLoopDiff | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync debounced với backend

  // Khôi phục state khi mount trên client & đồng bộ backend (tránh re-render kép do setAppState lặp lại)
  useEffect(() => {
    setInitialLoaded(true);
  }, []);

  // Tự động lưu LocalStorage & Registry mỗi khi appState thay đổi
  useEffect(() => {
    if (!initialLoaded) return;
    LocalStorageEngine.saveActiveProfile(appState, activeProfileId);
    setSavedProfiles(LocalStorageEngine.getSavedProfilesMeta());
    setIsSyncing(false);
  }, [appState, activeProfileId, initialLoaded]);

  // Giải nén các trường từ appState
  const {
    profile,
    altScores,
    mockHistory,
    primaryTarget,
    targetsList,
    preferences,
    constraints,
    scenarios,
    activeScenarioId,
    studyTasks,
    scheduleMatrix,
    timeDeduction,
    wishlist: storedWishlist,
    favoriteProgramIds,
    hiddenProgramIds,
    compareProgramIds,
    isSampleMode,
    activePersonaId,
    historyLogs,
    lastSavedAt,
  } = appState;

  // Xác định người dùng đã nhập dữ liệu thực tế hay chưa
  const hasUserData = useMemo(() => {
    if (isSampleMode) return false;
    const hasScores = Object.values(profile.examScores || {}).some(
      (val) => val !== null && val !== undefined && !isNaN(Number(val))
    );
    const hasAlt = Object.values(altScores || {}).some(
      (val) => val !== null && val !== undefined && !isNaN(Number(val))
    );
    const hasTarget = primaryTarget !== null || targetsList.length > 0;
    const hasName = Boolean(profile.name && profile.name.trim().length > 0);
    const hasBudget = (constraints?.annualBudgetVnd ?? profile.annualBudgetVnd ?? 0) > 0;
    return hasScores || hasAlt || hasTarget || hasName || hasBudget;
  }, [isSampleMode, profile, altScores, primaryTarget, targetsList, constraints]);

  // Hồ sơ có áp dụng What-If delta (nếu đang giả lập)
  const effectiveProfile = useMemo((): StudentProfile => {
    const effectiveExamScores: ExamScores = { ...profile.examScores };
    for (const [sub, delta] of Object.entries(whatIfDelta)) {
      if (delta !== undefined && delta !== null) {
        const base = effectiveExamScores[sub as keyof ExamScores];
        if (base === null || base === undefined) continue; // không tạo điểm cho môn chưa nhập
        effectiveExamScores[sub as keyof ExamScores] = Math.min(10.0, Math.max(0.0, base + delta));
      }
    }
    return {
      ...profile,
      examScores: effectiveExamScores,
      altScores: { ...altScores },
      annualBudgetVnd: whatIfBudget !== null ? whatIfBudget : (constraints.annualBudgetVnd || profile.annualBudgetVnd),
      // updateConstraints đồng bộ giá trị mới vào profile; ưu tiên profile để
      // giá trị mặc định trong constraints không ghi đè dữ liệu form đã lưu.
      relocationWillingness: profile.relocationWillingness || constraints.relocationWillingness,
    };
  }, [profile, altScores, constraints, whatIfDelta, whatIfBudget]);

  // 1. GAP ANALYSIS (Deterministic) — Null-safe khi chưa chọn mục tiêu
  const gapAnalysis = useMemo((): GapMetric => {
    const currentScore = calculateCompositeScore(
      effectiveProfile.examScores,
      effectiveProfile.altScores,
      effectiveProfile.priority,
      effectiveProfile.activeCombination || "A01"
    );

    if (!primaryTarget) {
      return {
        targetProgram: {
          programId: "none",
          schoolCode: "—",
          schoolName: "Chưa chọn trường mục tiêu",
          majorName: "Chưa chọn ngành",
          majorGroup: "cntt",
          cutoff2021: null,
          cutoff2022: null,
          cutoff2023: null,
          cutoff2024: null,
          forecastP10: 0,
          forecastP50: 0,
          forecastP90: 0,
          tuitionVnd: 0,
          employmentRate: 0,
          aiExposure: 0,
          leverageScore: 0,
          dataPassport: "Chưa có dữ liệu",
          combinations: [effectiveProfile.activeCombination || "A01"],
        },
        currentCompositeScore: currentScore,
        rawGap: 0,
        gapStatus: "vua_tam",
        statusLabelVi: "Chưa chọn mục tiêu",
        statusColor: "text-slate-600 bg-slate-100 border-slate-200",
        historicalTrend: "on_dinh",
        yearlyDeltas: [],
        p10: 0,
        p50: 0,
        p90: 0,
      };
    }

    return runGapAnalysis(primaryTarget, effectiveProfile);
  }, [primaryTarget, effectiveProfile]);

  // 2. SUBJECT ROI & MARGINAL IMPACT
  const subjectRoiList = useMemo((): SubjectRoiMetric[] => {
    if (!primaryTarget) return [];
    return calculateSubjectRoiList(effectiveProfile, primaryTarget, DECISION_PROGRAM_POOL);
  }, [effectiveProfile, primaryTarget]);

  // 3. CANDIDATE OPTIONS — cùng một tập chương trình cho mọi màn hình.
  // Chỉ giữ chương trình mà học sinh đã đủ điểm 3 môn của ít nhất một tổ hợp (userScore > 0).
  const candidates = useMemo(() => {
    const all = buildCandidateOptions(DECISION_PROGRAM_POOL, effectiveProfile).filter((c) => c.userScore > 0);
    if (hiddenProgramIds.length === 0) return all;
    return all.filter((c) => !hiddenProgramIds.includes(c.programId));
  }, [effectiveProfile, hiddenProgramIds]);

  // 3.1 RECOMMENDATION ENGINE ĐA NHÂN TỐ THỰC CHỨNG (SUBAGENT 7)
  const recommendationResult = useMemo((): RecommendationEngineResult => {
    return runRecommendationEngine(effectiveProfile, {
      targetProgramId: primaryTarget?.programId,
      excludedProgramIds: hiddenProgramIds,
      ambitionLevel: 0.5,
      maxWishes: 15,
    });
  }, [effectiveProfile, primaryTarget, hiddenProgramIds]);

  // 4. PORTFOLIO 15 WISHES & GAUSS-HERMITE P(FAIL ALL)
  const { wishlist, pFailAll } = useMemo(() => {
    if (storedWishlist && storedWishlist.length > 0) {
      // Cập nhật recalculated metrics cho các nguyện vọng đã chọn của người dùng, KHÔNG xóa nguyện vọng
      const updatedWishlist = storedWishlist.map((item) => {
        const matched = candidates.find(
          (c) =>
            c.programId === item.program_id ||
            (c.schoolCode === item.school_code && c.majorName === item.major_label)
        );
        if (!matched) return item;
        return {
          ...item,
          role: matched.role,
          admit_prob: matched.admitProbability,
          user_score: matched.userScore,
          forecast_p50: matched.cutoffP50,
          forecast_p10: matched.cutoffP10 ?? item.forecast_p10,
          forecast_p90: matched.cutoffP90 ?? item.forecast_p90,
          why_option_vi: matched.whyThisOptionVi,
          util_breakdown: {
            ...item.util_breakdown,
            capability: Number(matched.admitProbability.toFixed(2)),
          },
        };
      });
      return { wishlist: updatedWishlist, pFailAll: calculateWishlistFailAll(updatedWishlist) };
    }

    // Chưa lưu danh sách: không tự sinh danh sách ở đây. Gợi ý duy nhất đến từ recommendationResult
    // (trang Chiến lược hiển thị như "gợi ý, chưa lưu").
    return { wishlist: [], pFailAll: 1.0 };
  }, [candidates, storedWishlist]);

  // 5. STUDY PLAN ALLOCATOR
  const studyPlan = useMemo((): StudyPlan => {
    if (!primaryTarget || subjectRoiList.length === 0) {
      const hoursConfigured = effectiveProfile.familyConstraints?.availableWeeklyHours != null || effectiveProfile.availableHoursPerWeek > 0;
      const availableHours = hoursConfigured && Number.isFinite(effectiveProfile.availableHoursPerWeek)
        ? Math.max(0, Math.min(168, effectiveProfile.availableHoursPerWeek))
        : 0;
      return {
        totalAvailableHours: availableHours,
        allocations: [],
        schedule: [],
        lastUpdated: new Date().toLocaleDateString("vi-VN"),
        convergenceVelocityNote: hoursConfigured
          ? "Vui lòng chọn trường mục tiêu và nhập điểm số để xây dựng kế hoạch phân bổ giờ học tuần."
          : "Nhập thời gian rảnh trong hồ sơ để tính kế hoạch học tập.",
        timeDeduction,
        microGoals: [],
      };
    }
    const subjectTasks = new Map<string, typeof studyTasks>();
    for (const task of studyTasks) {
      subjectTasks.set(task.subject, [...(subjectTasks.get(task.subject) ?? []), task]);
    }
    const completedSubjects = [...subjectTasks.entries()]
      .filter(([, tasks]) => tasks.length > 0 && tasks.every((task) => task.completed && !task.skipped))
      .map(([subject]) => subject);
    return buildStudyPlan(effectiveProfile, subjectRoiList, primaryTarget, timeDeduction, { completedSubjects });
  }, [effectiveProfile, subjectRoiList, primaryTarget, timeDeduction, studyTasks]);

  // ============================================================================
  // 1. PROFILE CRUD ACTIONS
  // ============================================================================

  const updateProfile = useCallback((updates: Partial<StudentProfile>) => {
    setAppState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const loadPersona = useCallback((personaId: string) => {
    const found = getSamplePersona(personaId);
    if (found) {
      const nowStr =
        new Date().toLocaleDateString("vi-VN") +
        " " +
        new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      setAppState((prev) => ({
        ...prev,
        profile: { ...found.profile },
        primaryTarget: found.target,
        targetsList: [found.target],
        isSampleMode: true,
        activePersonaId: found.id,
        wishlist: [],
        historyLogs: [
          {
            timestamp: nowStr,
            note: `Đã nạp hồ sơ mẫu trải nghiệm: ${found.label}`,
            newScore: 23.5,
          },
          ...prev.historyLogs,
        ],
      }));
      setWhatIfDelta({});
      setWhatIfBudget(null);
      setLatestClosedLoopDiff(null);
    }
  }, []);

  const resetToBlank = useCallback(() => {
    const blank = getBlankAppState();
    setAppState(blank);
    setWhatIfDelta({});
    setWhatIfBudget(null);
    setLatestClosedLoopDiff(null);
    LocalStorageEngine.clear();
  }, []);

  const createNewProfile = useCallback((name?: string) => {
    const res = LocalStorageEngine.createNewProfile(name);
    setAppState(res.newState);
    setActiveProfileId(res.newId);
    setSavedProfiles(LocalStorageEngine.getSavedProfilesMeta());
    setWhatIfDelta({});
    setWhatIfBudget(null);
    setLatestClosedLoopDiff(null);
    window.location.hash = "#/profile";
  }, []);

  const switchProfile = useCallback(
    (profileId: string) => {
      LocalStorageEngine.saveActiveProfile(appState, activeProfileId);
      const targetState = LocalStorageEngine.switchProfile(profileId);
      if (targetState) {
        setAppState(targetState);
        setActiveProfileId(profileId);
        setSavedProfiles(LocalStorageEngine.getSavedProfilesMeta());
        setWhatIfDelta({});
        setWhatIfBudget(null);
        setLatestClosedLoopDiff(null);
      }
    },
    [appState, activeProfileId]
  );

  const deleteProfile = useCallback((profileId: string) => {
    const res = LocalStorageEngine.deleteProfile(profileId);
    setAppState(res.activeState);
    setActiveProfileId(res.activeId);
    setSavedProfiles(LocalStorageEngine.getSavedProfilesMeta());
    setWhatIfDelta({});
    setWhatIfBudget(null);
    setLatestClosedLoopDiff(null);
  }, []);

  const logoutProfile = useCallback(() => {
    createNewProfile("Hồ sơ mới");
  }, [createNewProfile]);

  // ============================================================================
  // 2. SCORES & MOCK TESTS CRUD
  // ============================================================================

  const updateExamScore = useCallback((subject: keyof ExamScores, score: number | null) => {
    // Chỉ lưu điểm hợp lệ trên thang 10; giá trị sai (âm, > 10, NaN) bị bỏ qua để không tạo điểm ảo
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 10)) return;
    if (score !== null) score = Math.round(score * 100) / 100;
    setAppState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        examScores: {
          ...prev.profile.examScores,
          [subject]: score,
        },
      },
    }));
  }, []);

  const updateAltScore = useCallback((key: keyof AlternativeScores, score: any) => {
    if (typeof score === "number") {
      const maxLimit = ALT_SCORE_MAX[key as string] ?? 10000;
      if (!Number.isFinite(score) || score < 0 || score > maxLimit) return;
      score = Math.round(score * 100) / 100;
    }
    setAppState((prev) => ({
      ...prev,
      altScores: {
        ...prev.altScores,
        [key]: score,
      },
      profile: {
        ...prev.profile,
        altScores: {
          ...prev.profile.altScores,
          [key]: score,
        },
      },
    }));
  }, []);

  const deleteExamScore = useCallback((subject: keyof ExamScores) => {
    updateExamScore(subject, null);
  }, [updateExamScore]);

  const submitMockTest = useCallback(
    (submission: MockTestSubmission): ClosedLoopDiff | null => {
      setIsRecalculating(true);

      const closedLoopResult = computeClosedLoopMockTest({
        profile,
        primaryTarget,
        candidatesPool: DECISION_PROGRAM_POOL,
        submission,
        prevPFailAll: pFailAll,
        prevWishlist: wishlist,
        prevAllocations: studyPlan.allocations,
        timeDeduction,
      });

      const { updatedProfile, diff: diffResult } = closedLoopResult;

      const newMockEntry: MockHistoryEntry = {
        id: `mock-${Date.now()}`,
        testName: submission.testName,
        testDate: submission.testDate,
        reliabilityTier: submission.reliabilityTier,
        scores: submission.newScores,
        note: submission.note,
        timestamp: new Date().toISOString(),
      };

      const timeStr =
        new Date().toLocaleDateString("vi-VN") +
        " " +
        new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const scoreSummary = diffResult.scoreChanges
        .map((sc) => `${sc.subjectVi}: ${sc.newScore}đ (${sc.delta >= 0 ? "+" + sc.delta : sc.delta})`)
        .join(", ");

      setAppState((prev) => ({
        ...prev,
        profile: updatedProfile,
        mockHistory: [newMockEntry, ...prev.mockHistory],
        historyLogs: [
          {
            timestamp: timeStr,
            note: `${submission.testName}: ${scoreSummary}`,
            newScore: diffResult.scoreChanges[0]?.smoothed ?? 8.0,
          },
          ...prev.historyLogs,
        ],
      }));

      setLatestClosedLoopDiff(diffResult);
      setTimeout(() => setIsRecalculating(false), 200);

      return diffResult;
    },
    [profile, pFailAll, wishlist, studyPlan, primaryTarget, timeDeduction]
  );

  const updateMockScore = useCallback(
    (subject: keyof ExamScores, newScore: number, note?: string) => {
      submitMockTest({
        testName: note || `Cập nhật nhanh môn ${SUBJECT_LABELS_VI[subject] || subject}`,
        testDate: new Date().toISOString().split("T")[0],
        reliabilityTier: "tier_2_provincial_highschool",
        newScores: { [subject]: newScore },
        note,
      });
    },
    [submitMockTest]
  );

  const deleteMockHistory = useCallback((id: string) => {
    setAppState((prev) => ({
      ...prev,
      mockHistory: prev.mockHistory.filter((m) => m.id !== id),
    }));
  }, []);

  const clearClosedLoopDiff = useCallback(() => {
    setLatestClosedLoopDiff(null);
  }, []);

  // ============================================================================
  // 3. TARGETS CRUD
  // ============================================================================

  const setTarget = useCallback((newTarget: TargetProgram | null) => {
    setAppState((prev) => {
      const existsInList = newTarget
        ? prev.targetsList.some((t) => t.programId === newTarget.programId)
        : false;
      return {
        ...prev,
        primaryTarget: newTarget,
        targetsList: newTarget && !existsInList ? [newTarget, ...prev.targetsList] : prev.targetsList,
      };
    });
  }, []);

  const addTarget = useCallback((newTarget: TargetProgram) => {
    setAppState((prev) => {
      const alreadyInList = prev.targetsList.some((t) => t.programId === newTarget.programId);
      const updatedList = alreadyInList ? prev.targetsList : [newTarget, ...prev.targetsList];
      return {
        ...prev,
        primaryTarget: prev.primaryTarget || newTarget,
        targetsList: updatedList,
      };
    });
  }, []);

  const updateTarget = useCallback((programId: string, updates: Partial<TargetProgram>) => {
    setAppState((prev) => ({
      ...prev,
      primaryTarget:
        prev.primaryTarget?.programId === programId
          ? { ...prev.primaryTarget, ...updates }
          : prev.primaryTarget,
      targetsList: prev.targetsList.map((t) =>
        t.programId === programId ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const removeTarget = useCallback((programId: string) => {
    setAppState((prev) => {
      const nextList = prev.targetsList.filter((t) => t.programId !== programId);
      const nextPrimary =
        prev.primaryTarget?.programId === programId ? (nextList[0] || null) : prev.primaryTarget;
      return {
        ...prev,
        primaryTarget: nextPrimary,
        targetsList: nextList,
      };
    });
  }, []);

  const setPrimaryTarget = useCallback((programId: string) => {
    setAppState((prev) => {
      const found = prev.targetsList.find((t) => t.programId === programId);
      if (!found) return prev;
      return {
        ...prev,
        primaryTarget: found,
      };
    });
  }, []);

  // ============================================================================
  // 4. PREFERENCES & CONSTRAINTS CRUD
  // ============================================================================

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setAppState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  const updateConstraints = useCallback((updates: Partial<UserConstraints>) => {
    setAppState((prev) => ({
      ...prev,
      constraints: { ...prev.constraints, ...updates },
      profile: {
        ...prev.profile,
        annualBudgetVnd: updates.annualBudgetVnd !== undefined ? updates.annualBudgetVnd : prev.profile.annualBudgetVnd,
        relocationWillingness: updates.relocationWillingness !== undefined ? updates.relocationWillingness : prev.profile.relocationWillingness,
      },
    }));
  }, []);

  // ============================================================================
  // 5. SCENARIOS CRUD (WHAT-IF)
  // ============================================================================

  const createScenario = useCallback((name: string, data?: Partial<WhatIfScenario>): WhatIfScenario => {
    const newSc: WhatIfScenario = {
      id: `sc-${Date.now()}`,
      name,
      deltaScores: data?.deltaScores || { ...whatIfDelta },
      annualBudgetVnd: data?.annualBudgetVnd || constraints.annualBudgetVnd,
      region: data?.region || "hanoi",
      riskTolerance: data?.riskTolerance || "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: data?.description || "",
    };

    setAppState((prev) => ({
      ...prev,
      scenarios: [newSc, ...prev.scenarios],
      activeScenarioId: newSc.id,
    }));

    return newSc;
  }, [whatIfDelta, constraints]);

  const duplicateScenario = useCallback((scenarioId: string): WhatIfScenario | null => {
    const targetSc = scenarios.find((s) => s.id === scenarioId);
    if (!targetSc) return null;
    return createScenario(`${targetSc.name} (Bản sao)`, {
      deltaScores: targetSc.deltaScores,
      annualBudgetVnd: targetSc.annualBudgetVnd,
      region: targetSc.region,
      riskTolerance: targetSc.riskTolerance,
    });
  }, [scenarios, createScenario]);

  const updateScenario = useCallback((scenarioId: string, updates: Partial<WhatIfScenario>) => {
    setAppState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const deleteScenario = useCallback((scenarioId: string) => {
    setAppState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.filter((s) => s.id !== scenarioId),
      activeScenarioId: prev.activeScenarioId === scenarioId ? null : prev.activeScenarioId,
    }));
  }, []);

  const applyScenario = useCallback((scenarioId: string) => {
    const sc = scenarios.find((s) => s.id === scenarioId);
    if (!sc) return;
    setWhatIfDelta(sc.deltaScores || {});
    if (sc.annualBudgetVnd) {
      setWhatIfBudget(sc.annualBudgetVnd);
    }
    setAppState((prev) => ({ ...prev, activeScenarioId: scenarioId }));
  }, [scenarios]);

  const applyWhatIf = useCallback((delta: Partial<ExamScores>, newBudget?: number) => {
    setWhatIfDelta((prev) => ({ ...prev, ...delta }));
    if (newBudget !== undefined) {
      setWhatIfBudget(newBudget);
    }
  }, []);

  const resetWhatIf = useCallback(() => {
    setWhatIfDelta({});
    setWhatIfBudget(null);
    setAppState((prev) => ({ ...prev, activeScenarioId: null }));
  }, []);

  // ============================================================================
  // 6. STUDY PLAN TASKS & SCHEDULE CRUD
  // ============================================================================

  const addStudyTask = useCallback((task: Omit<StudyTask, "id" | "createdAt">): StudyTask => {
    const newTask: StudyTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAppState((prev) => ({
      ...prev,
      studyTasks: [newTask, ...prev.studyTasks],
    }));
    return newTask;
  }, []);

  const updateStudyTask = useCallback((taskId: string, updates: Partial<StudyTask>) => {
    setAppState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));
  }, []);

  const completeStudyTask = useCallback((taskId: string, completed?: boolean) => {
    setAppState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, completed: completed !== undefined ? completed : !t.completed } : t
      ),
    }));
  }, []);

  const skipStudyTask = useCallback((taskId: string, skipped?: boolean) => {
    setAppState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, skipped: skipped !== undefined ? skipped : !t.skipped } : t
      ),
    }));
  }, []);

  const rescheduleStudyTask = useCallback((taskId: string, newDate: string) => {
    setAppState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, scheduledDate: newDate, skipped: false } : t
      ),
    }));
  }, []);

  const deleteStudyTask = useCallback((taskId: string) => {
    setAppState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const updateScheduleSlot = useCallback((time: string, day: string, slot: ScheduleSlotData) => {
    setAppState((prev) => {
      const matrix = { ...prev.scheduleMatrix };
      if (!matrix[time]) matrix[time] = {};
      matrix[time][day] = slot;
      return { ...prev, scheduleMatrix: matrix };
    });
  }, []);

  const updateTimeDeduction = useCallback((updates: Partial<TimeDeduction>) => {
    setAppState((prev) => {
      const merged = { ...prev.timeDeduction, ...updates };
      const deductions = [merged.sleepHours, merged.schoolHours, merged.extraClassesHours, merged.livingHours]
        .reduce((sum, value) => sum + (Number.isFinite(value) ? Math.max(0, value) : 0), 0);
      const requestedAvailable = Object.hasOwn(updates, "availableHours")
        ? updates.availableHours
        : 168 - deductions;
      const calculatedAvailable = Math.round(Math.max(0, Math.min(168, requestedAvailable ?? 0)) * 10) / 10;
      merged.availableHours = calculatedAvailable;
      return {
        ...prev,
        timeDeduction: merged,
        profile: {
          ...prev.profile,
          availableHoursPerWeek: calculatedAvailable,
          familyConstraints: {
            ...prev.profile.familyConstraints,
            availableWeeklyHours: calculatedAvailable,
          },
        },
      };
    });
  }, []);

  // ============================================================================
  // 7. RECOMMENDATIONS CRUD (FAVORITE, HIDE, COMPARE, WISHLIST)
  // ============================================================================

  const toggleFavoriteRecommendation = useCallback((programId: string) => {
    setAppState((prev) => {
      const isFav = prev.favoriteProgramIds.includes(programId);
      return {
        ...prev,
        favoriteProgramIds: isFav
          ? prev.favoriteProgramIds.filter((id) => id !== programId)
          : [...prev.favoriteProgramIds, programId],
      };
    });
  }, []);

  const toggleHideRecommendation = useCallback((programId: string) => {
    setAppState((prev) => {
      const isHidden = prev.hiddenProgramIds.includes(programId);
      return {
        ...prev,
        hiddenProgramIds: isHidden
          ? prev.hiddenProgramIds.filter((id) => id !== programId)
          : [...prev.hiddenProgramIds, programId],
      };
    });
  }, []);

  const toggleCompareRecommendation = useCallback((programId: string) => {
    setAppState((prev) => {
      const isComp = prev.compareProgramIds.includes(programId);
      if (isComp) {
        return { ...prev, compareProgramIds: prev.compareProgramIds.filter((id) => id !== programId) };
      }
      if (prev.compareProgramIds.length >= 4) {
        // Tối đa 4 ngành so sánh cùng lúc
        return prev;
      }
      return { ...prev, compareProgramIds: [...prev.compareProgramIds, programId] };
    });
  }, []);

  const clearCompareRecommendations = useCallback(() => {
    setAppState((prev) => ({ ...prev, compareProgramIds: [] }));
  }, []);

  const reorderWishlist = useCallback((sourceIndex: number, destinationIndex: number) => {
    setAppState((prev) => {
      const current = [...(prev.wishlist.length > 0 ? prev.wishlist : wishlist)];
      const [removed] = current.splice(sourceIndex, 1);
      current.splice(destinationIndex, 0, removed);
      const normalized = current.map((item) => {
        const program = DECISION_PROGRAM_POOL.find((candidate) => candidate.programId === item.program_id || (candidate.schoolCode === item.school_code && candidate.majorName === item.major_label));
        return { ...item, major_group: item.major_group ?? program?.majorGroup };
      });
      if (normalized.some((item, index) => item.major_group === "su_pham" && index >= 5)) return prev;
      return {
        ...prev,
        wishlist: normalized.map((item, idx) => ({ ...item, rank: idx + 1 })),
      };
    });
  }, [wishlist]);

  const removeWishlistItem = useCallback((rank: number) => {
    setAppState((prev) => {
      const current = [...(prev.wishlist.length > 0 ? prev.wishlist : wishlist)];
      const filtered = current.filter((item) => item.rank !== rank);
      return {
        ...prev,
        wishlist: filtered.map((item, idx) => ({ ...item, rank: idx + 1 })),
      };
    });
  }, [wishlist]);

  const addWishlistItem = useCallback((option: CandidateOption): boolean => {
    let added = false;
    setAppState((prev) => {
      const current = [...(prev.wishlist.length > 0 ? prev.wishlist : wishlist)];
      const alreadyExists = current.some(
        (w) =>
          w.program_id === option.programId ||
          (w.school_code === option.schoolCode && w.major_label === option.majorName)
      );
      if (alreadyExists || current.length >= 15) {
        return prev;
      }
      added = true;
      const utilityTarget = primaryTarget ?? {
        ...(GOLDEN_PROGRAMS[0] as TargetProgram),
        majorGroup: option.majorGroup,
        province: prev.profile?.homeProvince || option.province,
      };
      const breakdown = computeUtilityBreakdown(option, utilityTarget);
      const nYears = option.yearsOfData ?? 0;
      const newItem: WishlistItem = {
        rank: current.length + 1,
        program_id: option.programId,
        school_code: option.schoolCode,
        school_name: option.schoolName,
        major_label: option.majorName,
        major_group: option.majorGroup,
        combinations_seen: option.combination,
        role: option.role,
        admit_prob: option.admitProbability,
        forecast_p50: option.cutoffP50,
        forecast_p10: option.cutoffP10 ?? option.cutoffP50 - 1.28 * NATIONAL_SHOCK_STD,
        forecast_p90: option.cutoffP90 ?? option.cutoffP50 + 1.28 * NATIONAL_SHOCK_STD,
        n_years: nYears,
        data_quality: nYears >= 3 ? "day_du" : nYears === 1 ? "chi_1_nam" : "thieu_mot_phan",
        user_score: option.userScore,
        tuition_vnd: option.tuitionVnd,
        employment_rate: option.employmentRate,
        data_passport_url: option.dataPassportUrl,
        why_option_vi: option.whyThisOptionVi,
        region: option.region,
        province: option.province,
        source_tier: (option as any).sourceTier || (option as any).source_tier || "official_pdf",
        utility: breakdown.utility,
        util_breakdown: breakdown.parts,
        util_meta: {
          total_cost_per_year_vnd: option.tuitionVnd ?? undefined,
          tuition_estimated: !option.tuitionVnd,
        },
      };
      return {
        ...prev,
        wishlist: [...current, newItem].map((item, idx) => ({ ...item, rank: idx + 1 })),
      };
    });
    return added;
  }, [wishlist, primaryTarget]);

  const setWishlist = useCallback((newWishlist: WishlistItem[]) => {
    setAppState((prev) => ({
      ...prev,
      wishlist: newWishlist.map((item, idx) => ({ ...item, rank: idx + 1 })),
    }));
  }, []);

  const updateWishlistItemRole = useCallback((rank: number, newRole: "mao_hiem" | "vua_tam" | "an_toan") => {
    setAppState((prev) => {
      const current = [...(prev.wishlist.length > 0 ? prev.wishlist : wishlist)];
      const updated = current.map((item) =>
        item.rank === rank ? { ...item, role: newRole } : item
      );
      return { ...prev, wishlist: updated };
    });
  }, [wishlist]);

  const applyCustomDistribution = useCallback(
    (targetReach: number, targetFit: number, targetSafe: number) => {
      setAppState((prev) => {
        const pool = candidates.length > 0 ? candidates : buildCandidateOptions(DECISION_PROGRAM_POOL, effectiveProfile);
        
        // Nhóm ứng viên theo 3 tầng dựa trên điểm chuẩn P50 và xác suất
        const reachPool = pool
          .filter((c) => c.role === "mao_hiem" || c.admitProbability < 0.45)
          .sort((a, b) => b.cutoffP50 - a.cutoffP50);
        const fitPool = pool
          .filter((c) => (c.role === "vua_tam" || (c.admitProbability >= 0.45 && c.admitProbability < 0.8)) && !reachPool.includes(c))
          .sort((a, b) => b.cutoffP50 - a.cutoffP50);
        const safePool = pool
          .filter((c) => !reachPool.includes(c) && !fitPool.includes(c))
          .sort((a, b) => b.cutoffP50 - a.cutoffP50);

        // Lấy đúng số lượng mong muốn
        const selectedReach = reachPool.slice(0, targetReach);
        const selectedFit = fitPool.slice(0, targetFit);
        const selectedSafe = safePool.slice(0, targetSafe);

        const utilityTarget = primaryTarget ?? {
          ...(GOLDEN_PROGRAMS[0] as TargetProgram),
          majorGroup: "cong_nghe_thong_tin",
          province: prev.profile?.homeProvince || "hanoi",
        };

        const mapCandidateToWishlist = (option: CandidateOption, role: "mao_hiem" | "vua_tam" | "an_toan"): WishlistItem => {
          const breakdown = computeUtilityBreakdown(option, utilityTarget);
          const nYears = option.yearsOfData ?? 0;
          return {
            rank: 0,
            program_id: option.programId,
            school_code: option.schoolCode,
            school_name: option.schoolName,
            major_label: option.majorName,
            major_group: option.majorGroup,
            combinations_seen: option.combination,
            role,
            admit_prob: option.admitProbability,
            forecast_p50: option.cutoffP50,
            forecast_p10: option.cutoffP10 ?? option.cutoffP50 - 1.28 * NATIONAL_SHOCK_STD,
            forecast_p90: option.cutoffP90 ?? option.cutoffP50 + 1.28 * NATIONAL_SHOCK_STD,
            n_years: nYears,
            data_quality: nYears >= 3 ? "day_du" : nYears === 1 ? "chi_1_nam" : "thieu_mot_phan",
            user_score: option.userScore,
            tuition_vnd: option.tuitionVnd,
            employment_rate: option.employmentRate,
            data_passport_url: option.dataPassportUrl,
            why_option_vi: option.whyThisOptionVi,
            region: option.region,
            province: option.province,
            source_tier: (option as any).sourceTier || (option as any).source_tier || "official_pdf",
            utility: breakdown.utility,
            util_breakdown: breakdown.parts,
            util_meta: {
              total_cost_per_year_vnd: option.tuitionVnd ?? undefined,
              tuition_estimated: !option.tuitionVnd,
            },
          };
        };

        const newItems: WishlistItem[] = [
          ...selectedReach.map((c) => mapCandidateToWishlist(c, "mao_hiem")),
          ...selectedFit.map((c) => mapCandidateToWishlist(c, "vua_tam")),
          ...selectedSafe.map((c) => mapCandidateToWishlist(c, "an_toan")),
        ].map((item, idx) => ({ ...item, rank: idx + 1 }));

        return { ...prev, wishlist: newItems };
      });
    },
    [candidates, effectiveProfile, primaryTarget]
  );

  const autoBalancePortfolio = useCallback(() => {
    setAppState((prev) => {
      const current = [...(prev.wishlist.length > 0 ? prev.wishlist : wishlist)];
      const reach = current
        .filter((w) => w.role === "mao_hiem" || w.admit_prob < 0.45)
        .sort((a, b) => (b.forecast_p50 || b.latest_score || 0) - (a.forecast_p50 || a.latest_score || 0));
      const targetPool = current
        .filter((w) => (w.role === "vua_tam" || (w.admit_prob >= 0.45 && w.admit_prob < 0.80)) && !reach.includes(w))
        .sort((a, b) => (b.forecast_p50 || b.latest_score || 0) - (a.forecast_p50 || a.latest_score || 0));
      const safety = current
        .filter((w) => !reach.includes(w) && !targetPool.includes(w))
        .sort((a, b) => (b.forecast_p50 || b.latest_score || 0) - (a.forecast_p50 || a.latest_score || 0));

      const balanced = [...reach, ...targetPool, ...safety].map((item, idx) => ({ ...item, rank: idx + 1 }));
      return { ...prev, wishlist: balanced };
    });
  }, [wishlist]);

  const resetToRecommendedPortfolio = useCallback(() => {
    setAppState((prev) => ({ ...prev, wishlist: [] }));
  }, []);

  // ============================================================================
  // 8. BACKUP & RESTORE UTILITIES
  // ============================================================================

  const exportBackupJson = useCallback((): string => {
    return LocalStorageEngine.exportToJson();
  }, []);

  const importBackupJson = useCallback((jsonString: string) => {
    const res = LocalStorageEngine.importFromJson(jsonString);
    if (res.success) {
      setAppState(LocalStorageEngine.load());
    }
    return res;
  }, []);

  // Context value object
  const value = useMemo(
    (): DecisionContextType => ({
      // Profile & Multi-profile
      profile,
      isSampleMode,
      hasUserData,
      activePersonaId,
      savedProfiles,
      activeProfileId,
      updateProfile,
      createNewProfile,
      switchProfile,
      deleteProfile,
      logoutProfile,
      loadPersona,
      resetToBlank,

      // Scores
      updateExamScore,
      altScores,
      updateAltScore,
      deleteExamScore,
      updateMockScore,
      submitMockTest,
      mockHistory,
      deleteMockHistory,
      latestClosedLoopDiff,
      clearClosedLoopDiff,

      // Targets
      target: primaryTarget,
      targetsList,
      setTarget,
      addTarget,
      updateTarget,
      removeTarget,
      setPrimaryTarget,

      // Preferences & Constraints
      preferences,
      constraints,
      updatePreferences,
      updateConstraints,

      // Scenarios
      scenarios,
      activeScenarioId,
      whatIfDelta,
      whatIfBudget,
      createScenario,
      duplicateScenario,
      updateScenario,
      deleteScenario,
      applyScenario,
      applyWhatIf,
      resetWhatIf,

      // Study Plan
      studyPlan,
      studyTasks,
      addStudyTask,
      updateStudyTask,
      completeStudyTask,
      skipStudyTask,
      rescheduleStudyTask,
      deleteStudyTask,
      scheduleMatrix,
      updateScheduleSlot,
      timeDeduction,
      updateTimeDeduction,

      // Recommendations
      candidates,
      wishlist,
      pFailAll,
      gapAnalysis,
      subjectRoiList,
      favoriteProgramIds,
      hiddenProgramIds,
      compareProgramIds,
      toggleFavoriteRecommendation,
      toggleHideRecommendation,
      toggleCompareRecommendation,
      clearCompareRecommendations,
      reorderWishlist,
      removeWishlistItem,
      addWishlistItem,
      setWishlist,
      updateWishlistItemRole,
      applyCustomDistribution,
      autoBalancePortfolio,
      resetToRecommendedPortfolio,

      // Subagent 7: Multi-Factor Recommendation Engine
      recommendationResult,
      saferRecommendations: recommendationResult.saferRecommendations,
      balancedRecommendations: recommendationResult.balancedRecommendations,
      ambitiousRecommendations: recommendationResult.ambitiousRecommendations,

      // Navigation & System
      isRecalculating,
      historyLogs,
      activeStep,
      setActiveStep,
      isSyncing,
      lastSavedAt,
      exportBackupJson,
      importBackupJson,
    }),
    [
      profile,
      isSampleMode,
      hasUserData,
      activePersonaId,
      savedProfiles,
      activeProfileId,
      updateProfile,
      createNewProfile,
      switchProfile,
      deleteProfile,
      logoutProfile,
      loadPersona,
      resetToBlank,
      updateExamScore,
      altScores,
      updateAltScore,
      deleteExamScore,
      updateMockScore,
      submitMockTest,
      mockHistory,
      deleteMockHistory,
      latestClosedLoopDiff,
      clearClosedLoopDiff,
      primaryTarget,
      targetsList,
      setTarget,
      addTarget,
      updateTarget,
      removeTarget,
      setPrimaryTarget,
      preferences,
      constraints,
      updatePreferences,
      updateConstraints,
      scenarios,
      activeScenarioId,
      whatIfDelta,
      whatIfBudget,
      createScenario,
      duplicateScenario,
      updateScenario,
      deleteScenario,
      applyScenario,
      applyWhatIf,
      resetWhatIf,
      studyPlan,
      studyTasks,
      addStudyTask,
      updateStudyTask,
      completeStudyTask,
      skipStudyTask,
      rescheduleStudyTask,
      deleteStudyTask,
      scheduleMatrix,
      updateScheduleSlot,
      timeDeduction,
      updateTimeDeduction,
      candidates,
      wishlist,
      pFailAll,
      gapAnalysis,
      subjectRoiList,
      favoriteProgramIds,
      hiddenProgramIds,
      compareProgramIds,
      toggleFavoriteRecommendation,
      toggleHideRecommendation,
      toggleCompareRecommendation,
      clearCompareRecommendations,
      reorderWishlist,
      removeWishlistItem,
      addWishlistItem,
      setWishlist,
      updateWishlistItemRole,
      applyCustomDistribution,
      autoBalancePortfolio,
      resetToRecommendedPortfolio,
      recommendationResult,
      isRecalculating,
      historyLogs,
      activeStep,
      setActiveStep,
      isSyncing,
      lastSavedAt,
      exportBackupJson,
      importBackupJson,
    ]
  );

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}

export function useDecision() {
  const context = useContext(DecisionContext);
  if (!context) {
    throw new Error("useDecision must be used within a DecisionProvider");
  }
  return context;
}
