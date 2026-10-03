import React, { useState } from "react";
import {
  CalendarDays,
  Pencil,
  BarChart2,
  ArrowRight,
  Trash2,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDecision } from "@/state/DecisionContext";
import MockTestModal from "@/features/study-plan/MockTestModal";
import SubjectRoiTierAllocation from "@/features/study-plan/SubjectRoiTierAllocation";
import WeeklyScheduleMatrix from "@/features/study-plan/WeeklyScheduleMatrix";
import WeeklyGoalsCard from "@/features/study-plan/WeeklyGoalsCard";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { MockHistoryEntry } from "@/state/storage";

function getMockTotal(m: MockHistoryEntry): number {
  return Object.values(m.scores).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
}

export default function StudyPlanPage() {
  const {
    studyPlan,
    mockHistory,
    deleteMockHistory,
    target,
    profile,
    updateProfile,
  } = useDecision();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // So sánh 2 lần thi thử gần nhất (dữ liệu thật từ mockHistory)
  const latestMock = mockHistory.length > 0 ? mockHistory[0] : null;
  const previousMock = mockHistory.length > 1 ? mockHistory[1] : null;

  const latestTotal = latestMock ? getMockTotal(latestMock) : 0;
  const prevTotal = previousMock ? getMockTotal(previousMock) : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 0. HEADER */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Kế hoạch học tập
        </h1>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <label htmlFor="weekly-hours" className="text-sm font-bold text-slate-800">
          Em tự học được bao nhiêu giờ mỗi tuần (ngoài giờ học trên lớp)?
        </label>
        <div className="flex items-center gap-2">
          <input
            id="weekly-hours"
            type="number"
            min="0"
            max="70"
            step="1"
            value={profile.availableHoursPerWeek > 0 ? profile.availableHoursPerWeek : ""}
            placeholder="0"
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Math.max(0, Math.min(70, Math.round(Number(e.target.value))));
              updateProfile({ availableHoursPerWeek: Number.isFinite(v) ? v : 0 });
            }}
            className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-slate-600">giờ / tuần</span>
        </div>
      </section>

      {!target && (
        <EmptyState
          title="Chọn ngành em muốn vươn tới để có kế hoạch học"
          description="Kế hoạch học dồn thời gian vào những môn giúp em tiến gần ngành đó nhất."
          picker
        />
      )}

      {/* 1. PHÂN BỔ THỜI GIAN THEO MÔN TRỌNG TÂM (WATER-FILLING THEO DỮ LIỆU THẬT) */}
      <SubjectRoiTierAllocation
        allocations={studyPlan.allocations}
        totalAvailableHours={studyPlan.totalAvailableHours}
        microGoals={studyPlan.microGoals}
      />

      {/* 2. MA TRẬN LỊCH HỌC TRONG TUẦN (TỰ ĐỘNG & TÙY BIẾN ĐƯỢC) */}
      <WeeklyScheduleMatrix />

      {/* 3. MỤC TIÊU TUẦN & NHIỆM VỤ TỰ HỌC (TƯƠNG TÁC THẬT) */}
      <WeeklyGoalsCard />

      {/* 4. THEO DÕI TIẾN BỘ THI THỬ (DỮ LIỆU THỰC TẾ TỪ MOCK HISTORY) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Theo dõi kết quả các đợt thi thử
              </h3>
            </div>
          </div>

          {mockHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nhập điểm đợt mới</span>
            </button>
          )}
        </div>

        {/* So sánh 2 lần thi thử gần nhất hoặc hiển thị lịch sử */}
        {latestMock && previousMock ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-2">
              {/* Lần thi trước */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex-1 w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-bold">
                    Lần thi trước
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {previousMock.testDate || "Đợt trước"} · {previousMock.testName || "Thi thử"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Tổng điểm:</span>
                  <span className="text-base font-black text-slate-900">
                    {prevTotal.toFixed(2)}đ
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                  {Object.entries(previousMock.scores).map(([sub, score]) => (
                    <div key={sub} className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500">{SUBJECT_LABELS_VI[sub] || sub}</p>
                      <p className="text-sm font-black text-slate-900">{Number(score).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block shrink-0" />

              {/* Lần thi mới nhất */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex-1 w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold">
                    Lần thi mới nhất
                  </span>
                  <span className="text-xs text-slate-600 font-bold">
                    {latestMock.testDate || "Mới nhất"} · {latestMock.testName || "Thi thử"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Tổng điểm:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-blue-700">
                      {latestTotal.toFixed(2)}đ
                    </span>
                    <span
                      className={`text-[11px] font-black px-1.5 py-0.2 rounded ${
                        latestTotal >= prevTotal
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {latestTotal >= prevTotal
                        ? `▲ +${(latestTotal - prevTotal).toFixed(1)}đ`
                        : `▼ ${(latestTotal - prevTotal).toFixed(1)}đ`}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-blue-200/60">
                  {Object.entries(latestMock.scores).map(([sub, score]) => {
                    const prevSubScore = (previousMock.scores as Record<string, number | undefined>)[sub] ?? score;
                    const diff = Number(score) - Number(prevSubScore);
                    return (
                      <div key={sub} className="p-2 rounded-lg bg-white border border-blue-200 shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-500">{SUBJECT_LABELS_VI[sub] || sub}</p>
                        <p className="text-sm font-black text-blue-700">{Number(score).toFixed(1)}</p>
                        <span
                          className={`text-[9px] font-black ${
                            diff >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {diff >= 0 ? `▲ +${diff.toFixed(1)}` : `▼ ${diff.toFixed(1)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : latestMock ? (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold">
                  Đã ghi nhận 1 đợt thi thử
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {latestMock.testName} ({latestMock.testDate})
                </span>
              </div>
              <span className="text-sm font-black text-blue-700">
                Tổng: {latestTotal.toFixed(2)}đ
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(latestMock.scores).map(([sub, score]) => (
                <div key={sub} className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs">
                  <span className="text-slate-500 font-medium">{SUBJECT_LABELS_VI[sub] || sub}: </span>
                  <span className="font-extrabold text-slate-900">{Number(score).toFixed(1)}đ</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
            <p className="text-xs font-bold text-slate-700">
              Chưa có kết quả đợt thi thử nào được ghi nhận.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nhập kết quả thi thử lần đầu</span>
            </button>
          </div>
        )}

        {/* Bảng danh sách các đợt thi thử đã lưu */}
        {mockHistory.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Lịch sử các lần thi thử:</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {mockHistory.map((m) => (
                <div key={m.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <span className="font-bold text-slate-900">{m.testName || "Đợt thi thử"}</span>
                    <span className="text-slate-500 text-[11px]">{m.testDate}</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {Object.entries(m.scores).map(([sub, score]) => (
                        <span key={sub} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                          {SUBJECT_LABELS_VI[sub] || sub}: {Number(score).toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-blue-700">{getMockTotal(m).toFixed(2)}đ</span>
                    {deleteMockHistory && (
                      <button
                        type="button"
                        onClick={() => deleteMockHistory(m.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Xóa đợt thi thử này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* MODAL CẬP NHẬT ĐIỂM THI THỬ */}
      <MockTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
