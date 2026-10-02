import React, { useState } from "react";
import { Printer } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import ParentReportModal from "@/features/method/ParentReportModal";
import MathematicalFormulasCard from "@/features/method/MathematicalFormulasCard";
import DataPassportTable from "@/features/method/DataPassportTable";

export default function ExplanationPage() {
  const {
    profile,
    target,
    wishlist,
    gapAnalysis,
    pFailAll,
  } = useDecision();

  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 0. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cách hệ thống tính toán &amp; Đề án minh bạch
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsParentModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Xuất báo cáo phụ huynh (Khổ A4)</span>
        </button>
      </div>

      {/* 1. 3 TRỤ CỘT TÍNH TOÁN & NGUYÊN TẮC CỐT LÕI */}
      <MathematicalFormulasCard />

      {/* 2. TRA CỨU ĐỀ ÁN TUYỂN SINH CỦA CÁC TRƯỜNG */}
      <DataPassportTable />

      {/* 3. MODAL XUẤT BÁO CÁO PHỤ HUYNH CHUẨN A4 */}
      <ParentReportModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        profile={profile}
        target={target}
        wishlist={wishlist}
        gapAnalysis={gapAnalysis}
        pFailAll={pFailAll}
      />
    </div>
  );
}
