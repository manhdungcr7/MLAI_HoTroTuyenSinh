import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AiDecisionStructuredOutput } from "@/engine/explain/ai-decision-engine";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Database,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

export interface ContextualAiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: AiDecisionStructuredOutput | null;
}

export function ContextualAiCopilotModal({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
}: ContextualAiCopilotModalProps) {
  const [copied, setCopied] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completenessPct = Math.round((data.confidence ?? 0) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle || "Giải thích từ dữ liệu và phép tính của hệ thống"}
      maxWidth="xl"
    >
      <div
        className="space-y-5 text-slate-900 antialiased"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* 1. TOP HEADER BANNER: SUMMARY + CONFIDENCE */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4.5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                Tóm tắt
              </span>
            </div>

            {/* CONFIDENCE BADGE */}
            <div
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 border border-blue-200 shadow-2xs"
              title="Mức đầy đủ của hồ sơ và lịch sử điểm chuẩn — không phải độ chính xác của dự đoán"
            >
              <div className={`h-2 w-2 rounded-full ${completenessPct >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-xs font-extrabold text-slate-700">
                Mức đầy đủ dữ liệu:{" "}
                <span className={`font-black ${completenessPct >= 80 ? "text-emerald-700" : "text-amber-700"}`}>
                  {completenessPct}%
                </span>
              </span>
            </div>
          </div>

          <p
            className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed"
            style={{ textWrap: "pretty" }}
          >
            {data.summary}
          </p>
        </div>

        {/* 2. CẢNH BÁO THIẾU DỮ LIỆU (NẾU CÓ) */}
        {data.data_missing && data.data_missing.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Còn thiếu dữ liệu — kết quả kém chắc chắn hơn:</span>
            </div>
            <ul className="space-y-1 pl-6 list-disc text-xs font-semibold text-amber-800">
              {data.data_missing.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. KEY FINDINGS (PHÁT HIỆN THEN CHỐT) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <span>Điểm chính</span>
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.key_findings.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700 leading-snug">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 2-COLUMNS: RISKS & OPPORTUNITIES */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* RISKS */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Điều có thể làm kết quả sai</span>
            </h4>
            <ul className="space-y-2">
              {data.risks.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs font-semibold text-rose-800 leading-snug"
                >
                  <span className="text-rose-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* OPPORTUNITIES */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cơ hội</span>
            </h4>
            <ul className="space-y-2">
              {data.opportunities.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs font-semibold text-emerald-800 leading-snug"
                >
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. RECOMMENDED ACTIONS (HÀNH ĐỘNG KHUYẾN NGHỊ) */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2.5">
          <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
            <span>Nên làm tiếp</span>
          </h4>
          <div className="space-y-2">
            {data.recommended_actions.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-white p-2.5 border border-indigo-100 shadow-2xs"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {act}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. STEP-BY-STEP EXPLANATION */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>Cách tính</span>
          </h4>
          <div className="space-y-1.5 pl-2 text-xs text-slate-600">
            {data.explanation.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-slate-400">↳</span>
                <span className="font-medium text-slate-700 leading-relaxed">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. PROVENANCE ACCORDION (TRUY VẾT NGUỒN GỐC DỮ LIỆU) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowProvenance(!showProvenance)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              <span>Dữ liệu nào được dùng?</span>
            </div>
            {showProvenance ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {showProvenance && (
            <div className="p-4 pt-1 space-y-3.5 border-t border-slate-200 bg-white text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  1. Dữ liệu công bố (điểm chuẩn, học phí):
                </span>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  {data.provenance.observed_data.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-900">
                  2. Dữ liệu bạn nhập:
                </span>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  {data.provenance.user_entered_data.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-900">
                  3. Con số ước tính:
                </span>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  {data.provenance.estimated_data.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-900">
                  4. Cách tạo câu giải thích:
                </span>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  {data.provenance.ai_generated_analysis.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 8. FOOTER ACTIONS: COPY JSON & CLOSE */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Sao chép JSON chuẩn</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              {showRawJson ? "Ẩn JSON" : "Xem Raw JSON"}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            Đã hiểu & Áp dụng
          </button>
        </div>

        {/* RAW JSON VIEWER */}
        {showRawJson && (
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </Modal>
  );
}

export default ContextualAiCopilotModal;
