import React, { useState, useEffect } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft, ArrowRight, BarChart2 } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { ProfileSummaryStrip } from "@/features/profile/goal/ProfileSummaryStrip";
import { TargetMajorSelector } from "@/features/profile/goal/TargetMajorSelector";
import { TargetConditionsCard } from "@/features/profile/goal/TargetConditionsCard";
import { SelectedTargetCard } from "@/features/profile/goal/SelectedTargetCard";
import { QuickRecommendationsGrid } from "@/features/profile/goal/QuickRecommendationsGrid";

export default function ProfileGoalPage() {
  const { target, setTarget, profile, setActiveStep } = useDecision();

  // Đồng bộ bước 2 trong hành trình 9 bước ra quyết định
  useEffect(() => {
    if (setActiveStep) {
      setActiveStep(2);
    }
  }, [setActiveStep]);

  // Quản lý state bộ lọc mục tiêu
  const [selectedMajor, setSelectedMajor] = useState<string>("Công nghệ thông tin");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["hanoi"]);
  const [maxTuition, setMaxTuition] = useState<number>(() => {
    return profile.annualBudgetVnd ? Math.round(profile.annualBudgetVnd / 1000000) : 40;
  });

  const handleToggleRegion = (regId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regId)
        ? prev.filter((r) => r !== regId)
        : [...prev, regId]
    );
  };

  return (
    <div
      className="space-y-6 pb-12 antialiased animate-in fade-in duration-200"
      style={{ scrollbarGutter: "stable" }}
    >
      {/* 1. TOP HEADER */}
      <div className="pt-1">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Hồ sơ</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chọn mục tiêu
        </h1>
      </div>

      {/* 2. DẢI TÓM TẮT HỒ SƠ HIỆN TẠI (5 CARDS) */}
      <ProfileSummaryStrip />

      {/* 4. KHỐI 3 CỘT: NGÀNH MỤC TIÊU - KHU VỰC & ĐIỀU KIỆN - MỤC TIÊU ĐANG CHỌN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="h-full">
          <TargetMajorSelector
            selectedMajor={selectedMajor}
            onSelectMajor={setSelectedMajor}
          />
        </div>

        <div className="h-full">
          <TargetConditionsCard
            selectedRegions={selectedRegions}
            onToggleRegion={handleToggleRegion}
            maxTuition={maxTuition}
            onChangeTuition={setMaxTuition}
          />
        </div>

        <div className="h-full">
          <SelectedTargetCard target={target} />
        </div>
      </div>

      {/* 5. GỢI Ý NHANH THEO HỒ SƠ (4 UNIVERSITY CARDS) */}
      <QuickRecommendationsGrid />

      {/* 6. BOTTOM ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        {/* Nút Quay lại Hồ sơ học tập */}
        <Link
          href="/profile"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Hồ sơ</span>
        </Link>

        {/* Nút Phân tích khoảng cách */}
        <Link
          href="/analysis"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-xs cursor-pointer"
        >
          <BarChart2 className="w-4 h-4" />
          <span>Phân tích khoảng cách năng lực</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
