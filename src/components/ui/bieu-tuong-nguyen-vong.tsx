import { forwardRef, type ImgHTMLAttributes } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

const SPRITE = "/icons/nguyen-vong.svg";

/** Icon nghiệp vụ dùng chung sprite SVG, tương thích API `LucideIcon` hiện có. */
function taoBieuTuong(id: string, ten: string): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function BieuTuongNguyenVong(
    { color = "currentColor", size = 24, strokeWidth = 1.9, absoluteStrokeWidth, ...props },
    ref,
  ) {
    const net = absoluteStrokeWidth && typeof size === "number" ? Number(strokeWidth) * 24 / size : strokeWidth;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        color={color}
        stroke="currentColor"
        strokeWidth={net}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <use href={`${SPRITE}#${id}`} />
      </svg>
    );
  });
  Icon.displayName = ten;
  return Icon as LucideIcon;
}

export function BieuTuongThuongHieuMau({
  width,
  height,
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return <img src="/icons/brand-symbol-color.svg" alt={alt} width={width ?? 32} height={height ?? 32} {...props} />;
}

export const NavToday = taoBieuTuong("nav-today", "NavToday");
export const NavTodayActive = taoBieuTuong("nav-today-active", "NavTodayActive");
export const NavExplore = taoBieuTuong("nav-explore", "NavExplore");
export const NavExploreActive = taoBieuTuong("nav-explore-active", "NavExploreActive");
export const NavPreferences = taoBieuTuong("nav-preferences", "NavPreferences");
export const NavPreferencesActive = taoBieuTuong("nav-preferences-active", "NavPreferencesActive");
export const NavPlan = taoBieuTuong("nav-plan", "NavPlan");
export const NavPlanActive = taoBieuTuong("nav-plan-active", "NavPlanActive");
export const NavHoSo = taoBieuTuong("nav-ho-so", "NavHoSo");
export const NavHoSoActive = taoBieuTuong("nav-ho-so-active", "NavHoSoActive");

export const FeatureCareerFit = taoBieuTuong("feature-career-fit", "FeatureCareerFit");
export const FeatureSchoolFilter = taoBieuTuong("feature-school-filter", "FeatureSchoolFilter");
export const FeaturePreferenceRanking = taoBieuTuong("feature-preference-ranking", "FeaturePreferenceRanking");
export const FeatureScoreSimulator = taoBieuTuong("feature-score-simulator", "FeatureScoreSimulator");
export const FeatureMockScore = taoBieuTuong("feature-mock-score", "FeatureMockScore");
export const FeatureStudyGoal = taoBieuTuong("feature-study-goal", "FeatureStudyGoal");
export const FeatureWeeklyPlan = taoBieuTuong("feature-weekly-plan", "FeatureWeeklyPlan");
export const FeatureProgress = taoBieuTuong("feature-progress", "FeatureProgress");
export const FeatureDataSource = taoBieuTuong("feature-data-source", "FeatureDataSource");
export const FeatureCompanion = taoBieuTuong("feature-companion", "FeatureCompanion");
export const FeatureSchoolProgram = taoBieuTuong("feature-school-program", "FeatureSchoolProgram");

export const StatusSafe = taoBieuTuong("status-safe", "StatusSafe");
export const StatusBalanced = taoBieuTuong("status-balanced", "StatusBalanced");
export const StatusReach = taoBieuTuong("status-reach", "StatusReach");
export const StatusBackup = taoBieuTuong("status-backup", "StatusBackup");
