import React, { useState, useEffect } from "react";
import { Calendar, Check } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

type TimeSlot = "morning" | "afternoon" | "evening";
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Thứ 2 -> Chủ nhật

const DAYS = [
  { key: 0, label: "Thứ 2" },
  { key: 1, label: "Thứ 3" },
  { key: 2, label: "Thứ 4" },
  { key: 3, label: "Thứ 5" },
  { key: 4, label: "Thứ 6" },
  { key: 5, label: "Thứ 7" },
  { key: 6, label: "Chủ nhật" },
];

const SLOTS: { key: TimeSlot; label: string; timeRange: string; hoursPerSlot: number }[] = [
  { key: "morning", label: "Sáng", timeRange: "(6:00 - 12:00)", hoursPerSlot: 2.5 },
  { key: "afternoon", label: "Chiều", timeRange: "(12:00 - 18:00)", hoursPerSlot: 2.0 },
  { key: "evening", label: "Tối", timeRange: "(18:00 - 22:00)", hoursPerSlot: 2.0 },
];

const INITIAL_MATRIX: Record<TimeSlot, boolean[]> = {
  morning:   [false, false, false, false, false, false, false],
  afternoon: [false, false, false, false, false, false, false],
  evening:   [false, false, false, false, false, false, false],
};

const AVAILABILITY_KEY = "nguyen_vong_ai_weekly_availability_v1";

function loadAvailabilityMatrix(): { matrix: Record<TimeSlot, boolean[]>; configured: boolean } {
  if (typeof window === "undefined") return { matrix: INITIAL_MATRIX, configured: false };
  try {
    const saved = localStorage.getItem(AVAILABILITY_KEY);
    if (!saved) return { matrix: INITIAL_MATRIX, configured: false };
    const value = JSON.parse(saved) as Partial<Record<TimeSlot, boolean[]>>;
    const valid = (key: TimeSlot) => Array.isArray(value[key]) && value[key]!.length === DAYS.length && value[key]!.every((cell) => typeof cell === "boolean");
    if (!valid("morning") || !valid("afternoon") || !valid("evening")) return { matrix: INITIAL_MATRIX, configured: false };
    return { matrix: value as Record<TimeSlot, boolean[]>, configured: true };
  } catch {
    return { matrix: INITIAL_MATRIX, configured: false };
  }
}

export function WeeklyTimeMatrixCard() {
  const { updateProfile, updateTimeDeduction } = useDecision();
  const [initial] = useState(loadAvailabilityMatrix);
  const [matrix, setMatrix] = useState<Record<TimeSlot, boolean[]>>(initial.matrix);
  const [isConfigured, setIsConfigured] = useState(initial.configured);

  // Tính tổng số buổi được chọn & số giờ tự học rảnh
  const countSelectedSessions = () => {
    let count = 0;
    Object.values(matrix).forEach((row) => {
      count += row.filter(Boolean).length;
    });
    return count;
  };

  const calculateHours = () => {
    let total = 0;
    SLOTS.forEach((slot) => {
      const activeInSlot = matrix[slot.key].filter(Boolean).length;
      total += activeInSlot * slot.hoursPerSlot;
    });
    // Làm tròn 1 chữ số thập phân
    return Math.round(total * 10) / 10;
  };

  const selectedCount = countSelectedSessions();
  const totalHours = calculateHours(); // 14.5 giờ nếu theo initial matrix!

  // Toggle một cell
  const handleToggle = (slot: TimeSlot, dayIdx: number) => {
    setIsConfigured(true);
    setMatrix((prev) => {
      const newRow = [...prev[slot]];
      newRow[dayIdx] = !newRow[dayIdx];
      const updated = { ...prev, [slot]: newRow };
      return updated;
    });
  };

  // Chỉ đồng bộ sau khi người dùng đã nhập quỹ thời gian; hồ sơ mới vẫn ở trạng thái chưa biết.
  useEffect(() => {
    if (!isConfigured) return;
    localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(matrix));
    updateProfile({ availableHoursPerWeek: totalHours });
    updateTimeDeduction({ availableHours: totalHours });
  }, [isConfigured, matrix, totalHours, updateProfile, updateTimeDeduction]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all h-full">
      <div>
        {/* CARD HEADER */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Calendar className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Lịch học thực tế
            </h3>
            <p className="text-xs text-slate-500">
              Thời gian rảnh để học thêm, ôn thi (chọn các khung giờ có thể học)
            </p>
          </div>
        </div>

        {/* WEEKLY MATRIX TABLE */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-center">
            <thead>
              <tr className="border-b border-slate-200/80">
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 w-28">
                  Thời gian
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.key}
                    className="py-2.5 px-1.5 text-xs font-semibold text-slate-700"
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SLOTS.map((slot) => (
                <tr key={slot.key} className="hover:bg-slate-50/50 transition">
                  {/* TIME SLOT LABEL */}
                  <td className="py-3 px-2 text-left">
                    <span className="block text-xs font-bold text-slate-800">
                      {slot.label}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {slot.timeRange}
                    </span>
                  </td>

                  {/* 7 DAYS CHECKBOXES */}
                  {DAYS.map((day) => {
                    const isChecked = matrix[slot.key][day.key];
                    return (
                      <td key={day.key} className="py-3 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(slot.key, day.key)}
                          className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md transition cursor-pointer border ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                              : "bg-white border-slate-300 hover:border-blue-400 text-transparent"
                          }`}
                          aria-label={`${slot.label} ${day.label}`}
                        >
                          <Check className={`h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.8] ${isChecked ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER SUMMARY INFO */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Đã chọn: <strong className="text-slate-800 font-bold">{selectedCount} buổi</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50/70 border border-blue-200/60 px-2.5 py-1 rounded-lg">
          {isConfigured ? `≈ ${totalHours} giờ tự học/tuần` : "Chưa nhập thời gian rảnh"}
        </span>
      </div>
    </div>
  );
}

export default WeeklyTimeMatrixCard;
