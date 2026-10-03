import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { ExamScores } from "@/engine/types";
import { SUBJECT_LABELS_VI, combinationLabel } from "@/data/universities/combinations";
import { countEntered } from "@/features/start/scoring";

const MAIN: (keyof ExamScores)[] = ["toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia"];
const OTHER: (keyof ExamScores)[] = ["gdcd", "tin", "cncn", "cnnn"];

type Tab = "exam" | "hocba";

interface Props {
  examScores: ExamScores | undefined;
  hocBaScores: ExamScores | undefined;
  graduationYear: number | null | undefined;
  bestCombo: string | null;
  onExam: (s: keyof ExamScores, raw: string) => void;
  onHocBa: (s: keyof ExamScores, raw: string) => void;
  onGraduationYear: (year: number | null) => void;
}

function SubjectInput({ subject, value, onChange, label }: { subject: keyof ExamScores; value: number | null | undefined; onChange: (raw: string) => void; label: string }) {
  const name = SUBJECT_LABELS_VI[subject] ?? subject;
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <span className="text-[11px] font-bold leading-tight text-slate-500">{name}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        max="10"
        step="0.05"
        placeholder="–"
        aria-label={`${label} – ${name}`}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none"
      />
    </label>
  );
}

export function ScoreStep({ examScores, hocBaScores, graduationYear, bestCombo, onExam, onHocBa, onGraduationYear }: Props) {
  const [tab, setTab] = useState<Tab>("exam");
  const [more, setMore] = useState(false);
  const exam = tab === "exam";
  const scores = exam ? examScores : hocBaScores;
  const label = exam ? "Điểm thi" : "Điểm học bạ";
  const onChange = exam ? onExam : onHocBa;
  const nExam = countEntered(examScores);
  const nHb = countEntered(hocBaScores);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Điểm của em</h2>
        <p className="mt-1 text-sm text-slate-600">Nhập những môn em có điểm. Nên nhập cả điểm thi và học bạ để hệ thống chọn phương thức có lợi nhất cho em.</p>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Loại điểm">
        {([["exam", "Điểm thi", nExam], ["hocba", "Học bạ", nHb]] as const).map(([key, text, n]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition cursor-pointer ${tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {text}
            {n > 0 && <span className="rounded-full bg-emerald-100 px-1.5 text-[11px] font-black text-emerald-700">{n}</span>}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        {exam
          ? "Điểm thi tốt nghiệp THPT, hoặc điểm thi thử gần nhất (thang 10)."
          : "Điểm trung bình môn dùng để xét học bạ, thường là TB cả năm lớp 12 hoặc TB 3 năm tùy trường (thang 10)."}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {MAIN.map((s) => (<SubjectInput key={s} subject={s} value={scores?.[s]} onChange={(raw) => onChange(s, raw)} label={label} />))}
      </div>

      <div>
        <button type="button" onClick={() => setMore((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 cursor-pointer">
          {more ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Môn khác theo chương trình 2018 (GDKT&PL, Tin học, Công nghệ)
        </button>
        {more && (
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {OTHER.map((s) => (<SubjectInput key={s} subject={s} value={scores?.[s]} onChange={(raw) => onChange(s, raw)} label={label} />))}
          </div>
        )}
      </div>

      <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${bestCombo ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        {bestCombo
          ? <span>Tổ hợp tốt nhất từ điểm em nhập: <b>{combinationLabel(bestCombo)}</b>. Hệ thống tự thử mọi tổ hợp mà từng ngành xét.</span>
          : <span>Nhập đủ 3 môn của ít nhất một tổ hợp (ví dụ Toán, Lý, Hóa) để hệ thống bắt đầu tính.</span>}
      </div>

      <label className="block max-w-xs text-xs font-bold text-slate-700">
        Em dự thi tốt nghiệp năm
        <select
          value={graduationYear ?? ""}
          onChange={(e) => onGraduationYear(e.target.value === "" ? null : Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
        >
          <option value="">Chưa chọn</option>
          {[2026, 2027, 2028].map((y) => (<option key={y} value={y}>{y}</option>))}
        </select>
        <span className="mt-1 block font-normal text-slate-500">Từ kỳ thi 2026, tổng 3 môn thi của tổ hợp phải đạt tối thiểu 15 điểm mới được xét.</span>
      </label>
    </div>
  );
}
