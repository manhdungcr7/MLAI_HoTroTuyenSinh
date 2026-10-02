import React from "react";
import { BarChart3, Info, BookOpen, Atom, Sigma, Sparkles } from "lucide-react";

export interface SubjectRoiRowData {
  rank: number;
  subjectKey: string;
  subjectName: string;
  currentScore: number;
  simulatedScore: number;
  impactOptions: number;
  priority: "Cao" | "Trung bình" | "Thấp";
  iconType: "sigma" | "atom-orange" | "atom-yellow" | "book";
}

interface SubjectRoiRankingTableProps {
  data?: SubjectRoiRowData[];
  className?: string;
}

const DEFAULT_ROWS: SubjectRoiRowData[] = [
  {
    rank: 1,
    subjectKey: "anh",
    subjectName: "Tiếng Anh",
    currentScore: 7.5,
    simulatedScore: 8.5,
    impactOptions: 12,
    priority: "Cao",
    iconType: "sigma",
  },
  {
    rank: 2,
    subjectKey: "toan",
    subjectName: "Toán",
    currentScore: 8.2,
    simulatedScore: 9.2,
    impactOptions: 8,
    priority: "Trung bình",
    iconType: "atom-orange",
  },
  {
    rank: 3,
    subjectKey: "ly",
    subjectName: "Vật lý",
    currentScore: 7.0,
    simulatedScore: 8.0,
    impactOptions: 6,
    priority: "Trung bình",
    iconType: "atom-yellow",
  },
  {
    rank: 4,
    subjectKey: "van",
    subjectName: "Ngữ văn",
    currentScore: 6.8,
    simulatedScore: 7.8,
    impactOptions: 3,
    priority: "Thấp",
    iconType: "book",
  },
];

export const SubjectRoiRankingTable: React.FC<SubjectRoiRankingTableProps> = ({
  data = DEFAULT_ROWS,
  className = "",
}) => {
  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-emerald-100 text-emerald-700";
      case 2:
        return "bg-blue-100 text-blue-700";
      case 3:
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getPriorityBadgeStyle = (priority: "Cao" | "Trung bình" | "Thấp") => {
    switch (priority) {
      case "Cao":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "Trung bình":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Thấp":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }
  };

  const renderSubjectIcon = (iconType: SubjectRoiRowData["iconType"]) => {
    switch (iconType) {
      case "sigma":
        return (
          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-sm">
            <Sigma className="h-4 w-4" />
          </div>
        );
      case "atom-orange":
        return (
          <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Atom className="h-4 w-4" />
          </div>
        );
      case "atom-yellow":
        return (
          <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Atom className="h-4 w-4" />
          </div>
        );
      case "book":
        return (
          <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            Môn nào nên ưu tiên?
            <span title="Hiệu quả tăng điểm mở trường mới: Số lượng ngành/trường mới mở ra trên mỗi 1 điểm tăng thêm">
              <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
            </span>
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Dữ liệu dựa trên phổ điểm tuyển sinh 2024–2025
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
              <th className="pb-3 w-10 text-center font-bold">#</th>
              <th className="pb-3 text-left font-bold">Môn học</th>
              <th className="pb-3 text-center font-bold">
                Điểm hiện tại
                <span className="block text-[10px] text-slate-400 font-normal lowercase">(Thang 10)</span>
              </th>
              <th className="pb-3 text-center font-bold">Nếu tăng +1 điểm</th>
              <th className="pb-3 text-center font-bold">
                <span className="inline-flex items-center justify-center gap-1">
                  Tác động tới số lựa chọn
                  <Info className="h-3 w-3 text-slate-400" />
                </span>
              </th>
              <th className="pb-3 text-center font-bold">Mức ưu tiên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.subjectKey} className="hover:bg-slate-50/70 transition-colors">
                {/* Rank Badge */}
                <td className="py-3 text-center">
                  <span
                    className={`h-6 w-6 rounded-full inline-flex items-center justify-center text-xs font-black ${getRankBadgeStyle(
                      row.rank
                    )}`}
                  >
                    {row.rank}
                  </span>
                </td>

                {/* Subject Name & Icon */}
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    {renderSubjectIcon(row.iconType)}
                    <span className="text-sm font-extrabold text-slate-900">{row.subjectName}</span>
                  </div>
                </td>

                {/* Current Score */}
                <td className="py-3 text-center text-sm font-bold text-slate-800">
                  {row.currentScore.toFixed(1)}
                </td>

                {/* Simulated Score */}
                <td className="py-3 text-center text-sm font-bold text-slate-800">
                  {row.simulatedScore.toFixed(1)}
                </td>

                {/* Impact on options count */}
                <td className="py-3 text-center">
                  <span className="text-sm font-black text-emerald-600">
                    +{row.impactOptions}
                  </span>
                </td>

                {/* Priority Badge */}
                <td className="py-3 text-center">
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold ${getPriorityBadgeStyle(
                      row.priority
                    )}`}
                  >
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
