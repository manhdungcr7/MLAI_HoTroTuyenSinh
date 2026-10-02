import React, { useMemo } from "react";
import Link from "@/components/navigation/HashLink";
import { Target, ChevronRight } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

interface PriorityItem {
  id: string;
  rank: number;
  subject: string;
  title: string;
  estimatedHours: string;
  badgeBg: string;
  badgeText: string;
}

export default function StudyPrioritiesCard() {
  const { studyPlan, subjectRoiList } = useDecision();

  // Danh sách ưu tiên động kết nối trực tiếp với Water-filling Study Plan & Subject ROI SSOT
  const dynamicPriorities = useMemo((): PriorityItem[] => {
    if (studyPlan?.allocations && studyPlan.allocations.length > 0) {
      return studyPlan.allocations
        .filter((a) => a.subject !== "buffer_review" && a.hoursPerWeek > 0)
        .slice(0, 4)
        .map((a, idx) => {
          const tier = a.tier || (idx === 0 ? 1 : idx === 1 ? 2 : 3);
          const badgeBg =
            tier === 1 ? "bg-blue-600" : tier === 2 ? "bg-emerald-600" : "bg-amber-500";

          return {
            id: `alloc-${a.subject}-${idx}`,
            rank: idx + 1,
            subject: String(a.subject),
            title: a.priorityReasonVi || `Tập trung môn ${a.subjectVi}`,
            estimatedHours: `~ ${a.hoursPerWeek} giờ/tuần`,
            badgeBg,
            badgeText: "text-white",
          };
        });
    }

    if (subjectRoiList && subjectRoiList.length > 0) {
      return subjectRoiList.slice(0, 3).map((roi, idx) => {
        const badgeBg =
          roi.tier === 1 ? "bg-blue-600" : roi.tier === 2 ? "bg-emerald-600" : "bg-amber-500";
        return {
          id: `roi-${roi.subject}-${idx}`,
          rank: idx + 1,
          subject: String(roi.subject),
          title: `Môn trọng tâm ${roi.subjectVi}: ${roi.explanationVi}`,
          estimatedHours: `~ ${roi.tier === 1 ? "5.5" : roi.tier === 2 ? "3.5" : "2.0"} giờ`,
          badgeBg,
          badgeText: "text-white",
        };
      });
    }

    return [
      {
        id: "p-1",
        rank: 1,
        subject: "anh",
        title: "Ôn từ vựng Tiếng Anh chủ đề Học thuật",
        estimatedHours: "~ 5.5 giờ",
        badgeBg: "bg-blue-600",
        badgeText: "text-white",
      },
      {
        id: "p-2",
        rank: 2,
        subject: "toan",
        title: "Làm đề Toán (đại số & hàm số)",
        estimatedHours: "~ 3.5 giờ",
        badgeBg: "bg-emerald-600",
        badgeText: "text-white",
      },
      {
        id: "p-3",
        rank: 3,
        subject: "ly",
        title: "Ôn Vật lý chương Điện từ",
        estimatedHours: "~ 2.5 giờ",
        badgeBg: "bg-amber-500",
        badgeText: "text-white",
      },
    ];
  }, [studyPlan, subjectRoiList]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <Target className="h-4 w-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Môn học ưu tiên bứt phá
          </h2>
        </div>

        <Link
          href="/analysis/roi"
          className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group"
        >
          <span>Xem chi tiết môn ưu tiên</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-2.5">
        {dynamicPriorities.map((item) => (
          <Link
            key={item.id}
            href="/analysis/roi"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* Badge số tròn */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${item.badgeBg} ${item.badgeText}`}
              >
                {item.rank}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs font-mono font-extrabold text-slate-700 whitespace-nowrap">
                {item.estimatedHours}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
