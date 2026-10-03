import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CandidateOption, ExamScores, StudentProfile, TargetProgram, WishlistItem } from "@/engine/types";
import { CatalogData, ProgramCatalogItem, loadCatalog } from "@/data/catalog";
import { buildCandidateOptions } from "@/engine/decision/optimizer";
import { filterByConstraints } from "@/engine/decision/constraints";
import { MAX_WISHES, candidateToWishlistItem } from "@/engine/decision/portfolio-suggest";
import { bestCombination } from "@/engine/scoring/combo";
import { PersistedState, blankState, clearState, loadState, saveState } from "@/state/storage";

type ScoreKind = "exam" | "hocba";

interface AppApi {
  profile: StudentProfile;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  /** Ghi điểm một môn (thang 10, null = xóa). Tổ hợp chính được cập nhật theo điểm đã nhập. */
  setScore: (kind: ScoreKind, subject: keyof ExamScores, value: number | null) => void;
  wishlist: WishlistItem[];
  addWish: (c: CandidateOption) => boolean;
  removeWish: (rank: number) => void;
  moveWish: (from: number, to: number) => void;
  setWishlist: (items: WishlistItem[]) => void;
  target: TargetProgram | null;
  setTarget: (t: TargetProgram | null) => void;
  resetAll: () => void;
  /** Tăng mỗi lần xóa hết, để các màn hình nhập liệu tạo lại từ trạng thái trống. */
  epoch: number;
  /** Dữ liệu điểm chuẩn; null khi đang tải hoặc tải lỗi. */
  catalog: CatalogData | null;
  catalogStatus: "loading" | "ready" | "error";
  retryCatalog: () => void;
}

const AppContext = createContext<AppApi | null>(null);

const renumber = (items: WishlistItem[]) => items.slice(0, MAX_WISHES).map((w, i) => ({ ...w, rank: i + 1 }));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [epoch, setEpoch] = useState(0);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCatalogStatus("loading");
    loadCatalog()
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setCatalogStatus("ready");
      })
      .catch(() => {
        if (active) setCatalogStatus("error");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retryCatalog = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateProfile = useCallback((updates: Partial<StudentProfile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...updates } }));
  }, []);

  const setScore = useCallback((kind: ScoreKind, subject: keyof ExamScores, value: number | null) => {
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10)) return;
    const rounded = value === null ? null : Math.round(value * 100) / 100;
    setState((s) => {
      const key = kind === "exam" ? "examScores" : "hocBaScores";
      const next: ExamScores = { ...(s.profile[key] ?? {}) };
      if (rounded === null) delete next[subject];
      else next[subject] = rounded;
      const profile = { ...s.profile, [key]: next };
      const combo = bestCombination(profile.examScores) ?? bestCombination(profile.hocBaScores);
      return { ...s, profile: { ...profile, activeCombination: combo ?? profile.activeCombination } };
    });
  }, []);

  const addWish = useCallback((c: CandidateOption): boolean => {
    let added = false;
    setState((s) => {
      if (s.wishlist.length >= MAX_WISHES || s.wishlist.some((w) => w.program_id === c.programId)) return s;
      added = true;
      return { ...s, wishlist: renumber([...s.wishlist, candidateToWishlistItem(c, s.wishlist.length + 1)]) };
    });
    return added;
  }, []);

  const removeWish = useCallback((rank: number) => {
    setState((s) => ({ ...s, wishlist: renumber(s.wishlist.filter((w) => w.rank !== rank)) }));
  }, []);

  const moveWish = useCallback((from: number, to: number) => {
    setState((s) => {
      if (from < 0 || to < 0 || from >= s.wishlist.length || to >= s.wishlist.length) return s;
      const list = [...s.wishlist];
      const [moving] = list.splice(from, 1);
      list.splice(to, 0, moving);
      return { ...s, wishlist: renumber(list) };
    });
  }, []);

  const setWishlist = useCallback((items: WishlistItem[]) => {
    setState((s) => ({ ...s, wishlist: renumber(items) }));
  }, []);

  const setTarget = useCallback((target: TargetProgram | null) => setState((s) => ({ ...s, target })), []);

  const resetAll = useCallback(() => {
    clearState();
    setState(blankState());
    setEpoch((e) => e + 1);
  }, []);

  const value = useMemo<AppApi>(
    () => ({
      profile: state.profile, updateProfile, setScore,
      wishlist: state.wishlist, addWish, removeWish, moveWish, setWishlist,
      target: state.target, setTarget, resetAll, epoch, catalog, catalogStatus, retryCatalog,
    }),
    [state, epoch, catalog, catalogStatus, retryCatalog, updateProfile, setScore, addWish, removeWish, moveWish, setWishlist, setTarget, resetAll],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp phải nằm trong AppProvider");
  return ctx;
}

/**
 * Xác suất đỗ của học sinh cho từng ngành (phương thức tốt nhất) và phần thỏa ràng buộc đã khai.
 * Tách khỏi context để màn hình nhập điểm không phải tính lại toàn bộ danh mục sau mỗi lần gõ.
 */
export function useCandidates(): { candidates: CandidateOption[]; matched: CandidateOption[]; programs: ProgramCatalogItem[] } {
  const { profile, catalog } = useApp();
  const programs = useMemo(() => catalog?.programs ?? [], [catalog]);
  const candidates = useMemo(() => buildCandidateOptions(programs, profile), [programs, profile]);
  const matched = useMemo(() => filterByConstraints(candidates, profile), [candidates, profile]);
  return { candidates, matched, programs };
}
