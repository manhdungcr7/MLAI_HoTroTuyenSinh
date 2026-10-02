import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Edit3, Check, Sparkles } from "lucide-react";

export interface ScheduleBlock {
  id: string;
  time: string;
  day: string;
  subject: string;
  type: "anh" | "toan" | "ly" | "luyen_de" | "on_tong_hop" | "nghi_ngoi";
}

type ScheduleCell = { label: string; type: string };
const DEFAULT_SCHEDULE_MATRIX: Record<string, Record<string, ScheduleCell>> = {
  "08:00 – 10:00": {
    T2: { label: "Tiếng Anh", type: "anh" },
    T3: { label: "Tiếng Anh", type: "anh" },
    T4: { label: "Tiếng Anh", type: "anh" },
    T5: { label: "Toán", type: "toan" },
    T6: { label: "Tiếng Anh", type: "anh" },
    T7: { label: "Đề luyện", type: "luyen_de" },
    CN: { label: "Ôn tổng hợp", type: "on_tong_hop" },
  },
  "10:30 – 12:00": {
    T2: { label: "Toán", type: "toan" },
    T3: { label: "Toán", type: "toan" },
    T4: { label: "Vật lý", type: "ly" },
    T5: { label: "Tiếng Anh", type: "anh" },
    T6: { label: "Toán", type: "toan" },
    T7: { label: "Tiếng Anh", type: "anh" },
    CN: { label: "Tiếng Anh", type: "anh" },
  },
  "14:00 – 16:00": {
    T2: { label: "Vật lý", type: "ly" },
    T3: { label: "Tiếng Anh", type: "anh" },
    T4: { label: "Tiếng Anh", type: "anh" },
    T5: { label: "Tiếng Anh", type: "anh" },
    T6: { label: "Đề luyện", type: "luyen_de" },
    T7: { label: "Vật lý", type: "ly" },
    CN: { label: "Toán", type: "toan" },
  },
  "19:00 – 21:00": {
    T2: { label: "Tiếng Anh", type: "anh" },
    T3: { label: "Vật lý", type: "ly" },
    T4: { label: "Toán", type: "toan" },
    T5: { label: "Vật lý", type: "ly" },
    T6: { label: "Tiếng Anh", type: "anh" },
    T7: { label: "Ôn tổng hợp", type: "on_tong_hop" },
    CN: { label: "Nghỉ ngơi", type: "nghi_ngoi" },
  },
};

const DAY_KEYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Tuần bắt đầu từ thứ Hai của tuần hiện tại + offset tuần (ngày thật, không cố định). */
function buildWeek(offsetWeeks: number) {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) + offsetWeeks * 7);
  const days = DAY_KEYS.map((key, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { key, label: key, date: fmt(d) };
  });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { days, rangeLabel: `${fmt(monday)} – ${fmt(sunday)}/${sunday.getFullYear()}` };
}

const TIME_ROWS = [
  "08:00 – 10:00",
  "10:30 – 12:00",
  "14:00 – 16:00",
  "19:00 – 21:00",
];

import { useDecision } from "@/state/DecisionContext";

export default function WeeklyScheduleMatrix() {
  const { scheduleMatrix, studyPlan, updateScheduleSlot } = useDecision();
  const prioritySubject = [...studyPlan.allocations]
    .filter((item) => item.subject !== "buffer_review")
    .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)[0];
  const generatedMatrix = React.useMemo(() => {
    const matrix: Record<string, Record<string, ScheduleCell>> = {};
    for (const slot of studyPlan.schedule) {
      const time = slot.timeBlock.startsWith("Sáng")
        ? "08:00 – 10:00"
        : slot.timeBlock.startsWith("Chiều") ? "14:00 – 16:00" : "19:00 – 21:00";
      const type = ["toan", "anh", "ly"].includes(slot.subject)
        ? slot.subject
        : slot.subject === "buffer_review" ? "on_tong_hop" : "luyen_de";
      matrix[time] ??= {};
      matrix[time][slot.dayOfWeek] = { label: slot.subjectVi, type };
    }
    return matrix;
  }, [studyPlan.schedule]);
  const matrixData = React.useMemo(() => {
    const merged = { ...generatedMatrix };
    for (const [time, days] of Object.entries(scheduleMatrix)) {
      merged[time] = { ...merged[time], ...days };
    }
    return merged;
  }, [generatedMatrix, scheduleMatrix]);
  const [weekRangeIndex, setWeekRangeIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; day: string } | null>(null);

  const weekRanges = [0, 1, 2].map((i) => buildWeek(i).rangeLabel);
  const DAYS_HEADER = buildWeek(weekRangeIndex).days;

  const handlePrevWeek = () => {
    setWeekRangeIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextWeek = () => {
    setWeekRangeIndex((prev) => Math.min(weekRanges.length - 1, prev + 1));
  };

  const getPillStyles = (type: string) => {
    switch (type) {
      case "anh":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80";
      case "toan":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80";
      case "ly":
        return "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80";
      case "van":
      case "hoa":
        return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80";
      case "sinh":
      case "dia":
        return "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/80";
      case "luyen_de":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80";
      case "on_tong_hop":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100/80";
      case "nghi_ngoi":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80";
    }
  };

  const cycleSubject = (time: string, day: string) => {
    if (!isEditing) return;
    const current = matrixData[time]?.[day] || { label: "Nghỉ ngơi", type: "nghi_ngoi" };
    const options: { label: string; type: "anh" | "toan" | "ly" | "luyen_de" | "on_tong_hop" | "nghi_ngoi" }[] = [
      { label: "Tiếng Anh", type: "anh" },
      { label: "Toán", type: "toan" },
      { label: "Vật lý", type: "ly" },
      { label: "Đề luyện", type: "luyen_de" },
      { label: "Ôn tổng hợp", type: "on_tong_hop" },
      { label: "Nghỉ ngơi", type: "nghi_ngoi" },
    ];
    const currentIndex = options.findIndex((o) => o.label === current.label);
    const nextOption = options[(currentIndex + 1) % options.length];

    updateScheduleSlot(time, day, nextOption);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Lịch tuần này
            </h2>
          </div>
        </div>

        {/* NÚT CHUYỂN TUẦN */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={weekRangeIndex === 0}
            className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            {weekRanges[weekRangeIndex]}
          </span>
          <button
            type="button"
            onClick={handleNextWeek}
            disabled={weekRangeIndex === weekRanges.length - 1}
            className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full border-collapse text-left min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 font-bold">
              <th className="py-2.5 px-3 w-28 text-slate-600 font-extrabold text-xs">Thời gian</th>
              {DAYS_HEADER.map((d) => (
                <th key={d.key} className="py-2.5 px-1.5 text-center">
                  <div className="font-black text-slate-800 text-xs">{d.label}</div>
                  <div className="text-[10px] font-medium text-slate-400">{d.date}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TIME_ROWS.map((time) => (
              <tr key={time} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap align-middle">
                  {time}
                </td>
                {DAYS_HEADER.map((d) => {
                  const cell = matrixData[time]?.[d.key];
                  const isEmpty = !cell || cell.type === "nghi_ngoi" || cell.label === "Chưa xếp lịch" || cell.label === "Nghỉ ngơi";
                  const pillStyle = cell ? getPillStyles(cell.type) : "";

                  return (
                    <td key={d.key} className="py-2 px-1 text-center align-middle">
                      {isEmpty ? (
                        isEditing ? (
                          <button
                            type="button"
                            onClick={() => cycleSubject(time, d.key)}
                            className="w-full py-1.5 px-1 min-h-[34px] rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 text-slate-400 hover:text-blue-600 text-xs font-bold transition cursor-pointer"
                          >
                            + Thêm
                          </button>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs select-none">—</span>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => cycleSubject(time, d.key)}
                          disabled={!isEditing}
                          title={isEditing ? "Bấm để đổi môn học" : `${cell.label} (${time})`}
                          className={`w-full py-1.5 px-1.5 min-h-[34px] rounded-xl text-xs font-extrabold border transition-all shadow-2xs flex items-center justify-center truncate ${pillStyle} ${
                            isEditing
                              ? "cursor-pointer ring-2 ring-blue-300 ring-offset-1"
                              : "cursor-default"
                          }`}
                        >
                          {cell.label}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER ĐIỀU CHỈNH LỊCH */}
      <div className="flex items-center justify-end pt-2 border-t border-slate-100">

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
            isEditing
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
          }`}
        >
          {isEditing ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Xong chỉnh sửa</span>
            </>
          ) : (
            <>
              <Edit3 className="h-3.5 w-3.5 text-blue-500" />
              <span>Chỉnh sửa lịch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
