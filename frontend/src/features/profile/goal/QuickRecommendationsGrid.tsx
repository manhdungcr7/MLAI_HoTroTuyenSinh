import React, { useMemo } from "react";
import Link from "@/components/navigation/HashLink";
import { Star, ArrowRight, Check } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { TargetProgram } from "@/engine/types";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { formatTuitionPerYear } from "@/lib/format";

interface QuickRecommendationsGridProps {
  onSelectTarget?: (program: TargetProgram) => void;
}

const ROLE_LABEL = { mao_hiem: "Thử sức", vua_tam: "Phù hợp", an_toan: "An toàn" } as const;

/**
 * Gợi ý nhanh để chọn mục tiêu — lấy từ kết quả tính theo điểm của học sinh (không có danh sách cố định).
 * Ưu tiên nhóm "Phù hợp", đúng nhóm ngành mục tiêu hiện tại nếu có.
 */
export const QuickRecommendationsGrid: React.FC<QuickRecommendationsGridProps> = ({ onSelectTarget }) => {
  const { target, setTarget, recommendationResult, profile } = useDecision();

  const items = useMemo(() => {
    const group = target?.majorGroup ?? profile.interestMajorGroups?.[0];
    const roleOrder = { vua_tam: 0, an_toan: 1, mao_hiem: 2 } as const;
    return [...recommendationResult.allEvaluations]
      .sort(
        (a, b) =>
          Number(b.majorGroup === group) - Number(a.majorGroup === group) ||
          roleOrder[a.role] - roleOrder[b.role] ||
          Math.abs(a.admitProbability - 0.6) - Math.abs(b.admitProbability - 0.6)
      )
      .slice(0, 4);
  }, [recommendationResult.allEvaluations, target?.majorGroup, profile.interestMajorGroups]);

  const handleSelect = (programId: string) => {
    const program = DECISION_PROGRAM_POOL.find((p) => p.programId === programId);
    if (!program) return;
    setTarget(program);
    onSelectTarget?.(program);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Star className="w-4 h-4 text-blue-600 fill-blue-600" aria-hidden="true" />
            Gợi ý theo điểm của bạn
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tổ hợp {profile.activeCombination || "A01"} · ưu tiên các ngành có khả năng đỗ ở mức Phù hợp
          </p>
        </div>
        <Link href="/options" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800">
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Engine chưa tạo được gợi ý. Kiểm tra đủ 3 môn thuộc tổ hợp hoặc chọn tổ hợp khác.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((c) => {
            const isSelected = target?.programId === c.programId;
            return (
              <button
                key={c.programId}
                type="button"
                onClick={() => handleSelect(c.programId)}
                aria-pressed={isSelected}
                className={`text-left rounded-2xl border p-4 transition flex items-start justify-between gap-3 min-w-0 ${
                  isSelected ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-slate-900 text-pretty">{c.majorName}</span>
                  <span className="block text-xs text-slate-600 mt-0.5 text-pretty">{c.schoolName}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">{c.combination}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">{c.province}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">{formatTuitionPerYear(c.tuitionVnd)}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] text-slate-500">Điểm chuẩn gần nhất</span>
                  <span className="block text-base font-black text-slate-900">{c.cutoffP50.toFixed(1)}</span>
                  <span className="block text-[11px] font-bold text-slate-600">{ROLE_LABEL[c.role]}</span>
                  {isSelected && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                      <Check className="h-3 w-3" aria-hidden="true" /> Đã chọn
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuickRecommendationsGrid;
