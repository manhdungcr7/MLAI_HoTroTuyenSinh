import React, { useState } from "react";
import {
  BarChart2,
  Check,
  Plus,
  Trash2,
  CalendarClock,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

export default function WeeklyGoalsCard() {
  const {
    studyTasks,
    studyPlan,
    addStudyTask,
    completeStudyTask,
    skipStudyTask,
    rescheduleStudyTask,
    deleteStudyTask,
  } = useDecision();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("toan");
  const [newWeight, setNewWeight] = useState(2);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addStudyTask({
      title: newTitle.trim(),
      subject: newSubject,
      progressText: "0/1",
      weight: newWeight,
      completed: false,
      skipped: false,
    });

    setNewTitle("");
    setIsAdding(false);
  };

  const populateRecommendedTasks = () => {
    if (studyPlan?.microGoals && studyPlan.microGoals.length > 0) {
      studyPlan.microGoals.forEach((goal) => {
        addStudyTask({
          title: `Môn ${goal.subjectVi}: ${goal.topic}`,
          subject: goal.subject,
          progressText: "0/1",
          weight: 2,
          completed: false,
          skipped: false,
        });
      });
    }
  };

  const totalWeights = studyTasks.reduce((sum, t) => sum + (t.weight || 1), 0) || 1;
  const completedWeights = studyTasks.reduce(
    (sum, t) => sum + (t.completed ? (t.weight || 1) : 0),
    0
  );
  const percent = Math.min(100, Math.round((completedWeights / totalWeights) * 100));

  // Tính toán SVG Circle
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* HEADER WITH ADD BUTTON */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Mục tiêu tuần & Nhiệm vụ tự học
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Thêm nhiệm vụ</span>
        </button>
      </div>

      {/* FORM THÊM NHIỆM VỤ MỚI */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-in fade-in duration-200"
        >
          <div className="text-xs font-bold text-indigo-900">Tạo nhiệm vụ học tập tuần mới:</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <input
              type="text"
              placeholder="VD: Làm 3 đề Toán phân hóa cao, Ôn tập hàm số..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-7 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              autoFocus
            />
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="sm:col-span-3 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
            >
              <option value="toan">Toán học</option>
              <option value="ly">Vật lý</option>
              <option value="hoa">Hóa học</option>
              <option value="anh">Tiếng Anh</option>
              <option value="van">Ngữ văn</option>
              <option value="luyen_de">Luyện đề</option>
              <option value="on_tong_hop">Ôn tổng hợp</option>
            </select>
            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="w-full py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer shadow-2xs"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
        {/* DONUT CHART BÊN TRÁI (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-indigo-600 transition-all duration-500 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {percent}%
              </span>
            </div>
          </div>

          <span className="text-xs font-extrabold text-slate-500 mt-2">
            Đã hoàn thành {studyTasks.filter((t) => t.completed).length}/{studyTasks.length} nhiệm vụ
          </span>
        </div>

        {/* CHECKLIST BÊN PHẢI (8 cols) */}
        <div className="md:col-span-8 space-y-2.5">
          {studyTasks.length === 0 ? (
            <div className="p-4 text-center sm:text-left border border-dashed border-slate-200 bg-slate-50/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Chưa có nhiệm vụ học tập nào trong tuần này
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bấm &quot;Nạp nhiệm vụ gợi ý&quot; để thêm 3 mục tiêu trọng tâm theo tổ hợp môn của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={populateRecommendedTasks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp nhiệm vụ gợi ý</span>
              </button>
            </div>
          ) : (
            studyTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-emerald-50/40 border-emerald-200 text-slate-800"
                    : task.skipped
                    ? "bg-slate-50/90 border-slate-200 text-slate-500 opacity-60"
                    : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700"
                }`}
              >
                {/* TÊN VÀ NÚT TOGGLE */}
                <div
                  onClick={() => completeStudyTask(task.id)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      task.completed
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-white hover:border-blue-400"
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-sm font-semibold block line-clamp-2 text-pretty ${
                        task.completed
                          ? "line-through text-slate-500"
                          : task.skipped
                          ? "italic text-slate-400"
                          : "text-slate-800"
                      }`}
                      style={{ textWrap: "pretty" }}
                    >
                      {task.title}
                    </span>
                    {task.scheduledDate && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-0.5">
                        <CalendarClock className="h-3 w-3 shrink-0" />
                        <span className="truncate">Đã lên lịch lại: {task.scheduledDate}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* CÁC THAO TÁC CRUD NHANH: SKIP, RESCHEDULE, DELETE */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      task.completed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {task.progressText || "1 đề"}
                  </span>

                  {/* Nút Bỏ qua (Skip) */}
                  <button
                    type="button"
                    onClick={() => skipStudyTask(task.id)}
                    title={task.skipped ? "Hủy bỏ qua" : "Bỏ qua tuần này"}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                  </button>

                  {/* Nút Lên lại lịch (Reschedule) */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextWeek = prompt("Nhập ngày hoặc tuần dự kiến dời lịch (VD: T2 tuần sau, 25/01):", "T2 tuần sau");
                      if (nextWeek) rescheduleStudyTask(task.id, nextWeek);
                    }}
                    title="Lên lại lịch (Reschedule)"
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                  </button>

                  {/* Nút Xóa (Delete) */}
                  <button
                    type="button"
                    onClick={() => deleteStudyTask(task.id)}
                    title="Xóa nhiệm vụ"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
