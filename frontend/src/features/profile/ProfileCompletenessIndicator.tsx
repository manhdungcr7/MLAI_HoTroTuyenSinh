import React, { useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Target,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { StudentProfile, TargetProgram } from "@/engine/types";

interface ProfileCompletenessIndicatorProps {
  profile: StudentProfile;
  target: TargetProgram | null;
  onLoadPersona?: (personaId: string) => void;
  isSampleMode?: boolean;
}

export function ProfileCompletenessIndicator({
  profile,
  target,
  onLoadPersona,
  isSampleMode,
}: ProfileCompletenessIndicatorProps) {
  // Tính toán tỷ lệ hoàn thiện hồ sơ chính xác
  const stats = useMemo(() => {
    let score = 0;
    const items: {
      key: string;
      label: string;
      icon: React.ElementType;
      completed: boolean;
      points: number;
    }[] = [];

    // 1. Thông tin cá nhân (15 điểm)
    const hasBasicInfo = Boolean(profile.name && profile.name.trim().length > 0);
    if (hasBasicInfo) score += 15;
    items.push({
      key: "basic",
      label: "Thông tin cá nhân",
      icon: UserCheck,
      completed: hasBasicInfo,
      points: 15,
    });

    // 2. Điểm học lực / thi thử (35 điểm)
    const scores = profile.examScores || {};
    const validScoresCount = Object.values(scores).filter(
      (v) => typeof v === "number" && v > 0
    ).length;
    const hasScores = validScoresCount >= 3;
    if (hasScores) score += 35;
    else if (validScoresCount > 0) score += Math.round((validScoresCount / 3) * 35);

    items.push({
      key: "scores",
      label: `Điểm thi (${validScoresCount}/3 môn)`,
      icon: BookOpen,
      completed: hasScores,
      points: 35,
    });

    // 3. Ràng buộc tài chính & Bối cảnh (25 điểm)
    const hasConstraints = Boolean(
      (profile.annualBudgetVnd && profile.annualBudgetVnd > 0) ||
        (profile.locationConstraint && profile.locationConstraint.length > 0)
    );
    if (hasConstraints) score += 25;
    items.push({
      key: "constraints",
      label: "Ngân sách & Khu vực",
      icon: DollarSign,
      completed: hasConstraints,
      points: 25,
    });

    // 4. Nguyện vọng mục tiêu (25 điểm)
    const hasTarget = Boolean(target?.programId && target?.schoolName);
    if (hasTarget) score += 25;
    items.push({
      key: "target",
      label: "Nguyện vọng mục tiêu",
      icon: Target,
      completed: hasTarget,
      points: 25,
    });

    const percent = Math.min(100, Math.max(0, score));

    return { percent, items };
  }, [profile, target]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* LEFT: TITLE & COMPLETION PERCENT */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
              stats.percent === 100
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : stats.percent >= 50
                ? "border-blue-200 bg-blue-50 text-blue-600"
                : "border-amber-200 bg-amber-50 text-amber-600"
            }`}
          >
            {stats.percent === 100 ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <UserCheck className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Mức độ hoàn thiện hồ sơ
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                  stats.percent === 100
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : stats.percent >= 50
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {stats.percent}% Hoàn tất
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.percent === 100
                ? "Hồ sơ đã đủ thông tin chính. Kết quả gợi ý sẽ sát với bạn hơn, nhưng vẫn là ước tính."
                : "Cung cấp đầy đủ thông tin để thuật toán cá nhân hóa phương án tối ưu nhất."}
            </p>
          </div>
        </div>

        {/* RIGHT: PROGRESS BAR & BUTTON NẠP PERSONA */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <div className="flex-1 md:w-48 lg:w-56 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                stats.percent === 100
                  ? "bg-emerald-500"
                  : stats.percent >= 50
                  ? "bg-blue-600"
                  : "bg-amber-500"
              }`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          {stats.percent < 100 && onLoadPersona && (
            <button
              type="button"
              onClick={() => onLoadPersona("persona_bachkhoa_reach")}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Điền tự động hồ sơ mẫu để trải nghiệm đầy đủ các tính năng"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nạp hồ sơ mẫu</span>
            </button>
          )}
        </div>
      </div>

      {/* DẢI 4 CHECKLIST PILLS */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition ${
                item.completed
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileCompletenessIndicator;
