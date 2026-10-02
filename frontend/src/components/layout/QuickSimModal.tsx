import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { RefreshCw } from "lucide-react";
import { ExamScores } from "@/engine/types";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";

export interface QuickSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: keyof ExamScores, score: number, note: string) => void;
}

export function QuickSimModal({
  isOpen,
  onClose,
  onSubmit,
}: QuickSimModalProps) {
  const [subject, setSubject] = useState<string>("anh");
  const [scoreInput, setScoreInput] = useState<string>("7.8");
  const [noteInput, setNoteInput] = useState<string>("Khảo sát đợt 2");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(scoreInput);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
      onSubmit(subject as keyof ExamScores, parsed, noteInput);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập Nhật Điểm Thi Thử (Mock Test)"
      description="Tự động cập nhật danh mục nguyện vọng và điều chỉnh kế hoạch học tập theo điểm số mới."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Chọn Môn Thi Cần Cập Nhật
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-hidden"
          >
            {Object.entries(SUBJECT_LABELS_VI).map(([k, label]) => (
              <option key={k} value={k}>
                {label} ({k.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Điểm Số Mới Đạt Được (Thang 10)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-900 focus:border-blue-600 focus:outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Ghi Chú Đợt Thi
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tái Tính Toán Toàn Bộ
          </button>
        </div>
      </form>
    </Modal>
  );
}
