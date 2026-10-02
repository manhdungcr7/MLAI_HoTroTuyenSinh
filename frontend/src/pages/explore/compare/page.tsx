import React, { useState, useMemo, useEffect } from "react";
import Link from "@/components/navigation/HashLink";
import {
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  MapPin,
  Briefcase,
  ExternalLink,
  Sparkles,
  X,
  Target,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { GOLDEN_PROGRAMS } from "@/data/universities";
import { TargetProgram, CandidateOption } from "@/engine/types";
import { calculateAdmitProbability } from "@/engine/admissions/probability";
import { formatTuitionPerYear, NO_DATA_LABEL } from "@/lib/format";

interface ComparedProgramView {
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorGroup: string;
  combination: string;
  cutoff2024: number;
  cutoff2023?: number | null;
  cutoff2022?: number | null;
  forecastP50: number;
  tuitionVnd: number | null;
  location: string;
  employmentRate: number | null;
  aiExposure: number;
  dataPassportUrl: string;
  role: "mao_hiem" | "vua_tam" | "an_toan";
  admitProbability: number;
  whyThisOptionVi?: string;
}

export default function ComparisonPage() {
  const {
    profile,
    target,
    setTarget,
    candidates,
    wishlist,
    addWishlistItem,
    gapAnalysis,
    compareProgramIds,
    toggleCompareRecommendation,
    clearCompareRecommendations,
  } = useDecision();

  // Khởi tạo danh sách ID so sánh mặc định
  const defaultSelectedCodes = useMemo(() => {
    if (compareProgramIds && compareProgramIds.length > 0) {
      return compareProgramIds.slice(0, 4);
    }
    const list: string[] = [];
    if (target?.programId) list.push(target.programId);
    if (list.length < 3 && candidates.length > 0) {
      candidates.forEach((c) => {
        if (!list.includes(c.programId) && list.length < 3) list.push(c.programId);
      });
    }
    if (list.length < 3) {
      GOLDEN_PROGRAMS.forEach((p) => {
        if (!list.includes(p.programId) && list.length < 3) list.push(p.programId);
      });
    }
    return list.slice(0, 3);
  }, [compareProgramIds, target, candidates]);

  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedCodes);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Cập nhật khi compareProgramIds từ context thay đổi
  useEffect(() => {
    if (compareProgramIds && compareProgramIds.length > 0) {
      setSelectedIds((prev) => {
        const merged = Array.from(new Set([...compareProgramIds, ...prev]));
        return merged.slice(0, 4);
      });
    }
  }, [compareProgramIds]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const userComposite =
    gapAnalysis.currentCompositeScore > 0
      ? Number(gapAnalysis.currentCompositeScore.toFixed(2))
      : 25.5;

  // Lấy dữ liệu chi tiết thống nhất cho các chương trình đang được chọn
  const comparedPrograms = useMemo((): ComparedProgramView[] => {
    return selectedIds
      .map((id): ComparedProgramView | null => {
        const cand = candidates.find((c) => c.programId === id);
        if (cand) {
          const gold = GOLDEN_PROGRAMS.find((p) => p.programId === id);
          return {
            programId: cand.programId,
            schoolCode: cand.schoolCode,
            schoolName: cand.schoolName,
            majorName: cand.majorName,
            majorGroup: cand.majorGroup || "cntt",
            combination: cand.combination || "A00",
            cutoff2024: cand.cutoffP50,
            cutoff2023: gold?.cutoff2023 ?? null,
            cutoff2022: gold?.cutoff2022 ?? null,
            forecastP50: cand.cutoffP50,
            tuitionVnd: cand.tuitionVnd,
            location: cand.province || "Hà Nội",
            employmentRate: cand.employmentRate ?? null,
            aiExposure: cand.aiExposure || 0.45,
            dataPassportUrl: cand.dataPassportUrl || gold?.dataPassport || "https://moet.gov.vn",
            role: cand.role,
            admitProbability: cand.admitProbability,
            whyThisOptionVi: cand.whyThisOptionVi,
          };
        }

        const gold = GOLDEN_PROGRAMS.find((p) => p.programId === id);
        if (gold) {
          const cutoff = gold.cutoff2024 || gold.forecastP50 || 26.0;
          const prob = calculateAdmitProbability(userComposite, cutoff);
          let tier: "mao_hiem" | "vua_tam" | "an_toan" = "vua_tam";
          if (prob >= 0.8) {
            tier = "an_toan";
          } else if (prob < 0.4) {
            tier = "mao_hiem";
          }

          return {
            programId: gold.programId,
            schoolCode: gold.schoolCode,
            schoolName: gold.schoolName,
            majorName: gold.majorName,
            majorGroup: gold.majorGroup || "cntt",
            combination: gold.combinations?.[0] || "A00",
            cutoff2024: cutoff,
            cutoff2023: gold.cutoff2023 ?? null,
            cutoff2022: gold.cutoff2022 ?? null,
            forecastP50: gold.forecastP50 || cutoff,
            tuitionVnd: gold.tuitionVnd,
            location: gold.province || "Hà Nội",
            employmentRate: gold.employmentRate ?? null,
            aiExposure: gold.aiExposure || 0.45,
            dataPassportUrl: gold.dataPassport || "https://moet.gov.vn",
            role: tier,
            admitProbability: prob,
          };
        }
        return null;
      })
      .filter((p): p is ComparedProgramView => p !== null);
  }, [selectedIds, candidates, userComposite]);

  const removeProgram = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (compareProgramIds.includes(id)) {
      toggleCompareRecommendation(id);
    }
    showNotification("Đã xóa khỏi danh sách so sánh");
  };

  const addProgram = (id: string) => {
    if (selectedIds.includes(id)) {
      showNotification("Ngành này đã có trong bảng so sánh");
      return;
    }
    if (selectedIds.length >= 4) {
      showNotification("Tối đa so sánh 4 phương án");
      return;
    }
    setSelectedIds((prev) => [...prev, id]);
    setIsAddModalOpen(false);
    showNotification("Đã thêm vào bảng so sánh");
  };

  const setAsPrimaryTarget = (prog: ComparedProgramView) => {
    const gold = GOLDEN_PROGRAMS.find((p) => p.programId === prog.programId);
    const newTarget: TargetProgram = gold || {
      programId: prog.programId,
      schoolCode: prog.schoolCode,
      schoolName: prog.schoolName,
      majorName: prog.majorName,
      majorGroup: prog.majorGroup,
      cutoff2024: prog.cutoff2024,
      cutoff2023: prog.cutoff2023,
      cutoff2022: prog.cutoff2022,
      forecastP10: Number((prog.cutoff2024 - 0.5).toFixed(2)),
      forecastP50: prog.cutoff2024,
      forecastP90: Number((prog.cutoff2024 + 0.5).toFixed(2)),
      tuitionVnd: prog.tuitionVnd,
      employmentRate: prog.employmentRate,
      aiExposure: prog.aiExposure,
      leverageScore: 8.0,
      dataPassport: prog.dataPassportUrl,
      combinations: [prog.combination],
    };
    setTarget(newTarget);
    showNotification(`Đã đặt ${prog.schoolCode} làm mục tiêu chính`);
  };

  const handleAddToWishlist = (prog: ComparedProgramView) => {
    const existing = candidates.find((c) => c.programId === prog.programId);
    const cand: CandidateOption = existing || {
      programId: prog.programId,
      schoolCode: prog.schoolCode,
      schoolName: prog.schoolName,
      majorName: prog.majorName,
      majorGroup: prog.majorGroup,
      combination: prog.combination,
      cutoffP50: prog.cutoff2024,
      userScore: userComposite,
      gap: Number((userComposite - prog.cutoff2024).toFixed(2)),
      admitProbability: prog.admitProbability,
      tuitionVnd: prog.tuitionVnd,
      employmentRate: prog.employmentRate,
      aiExposure: prog.aiExposure,
      role: prog.role,
      whyThisOptionVi: prog.whyThisOptionVi || "Phương án được thêm từ Bảng so sánh.",
      dataPassportUrl: prog.dataPassportUrl,
    };
    const success = addWishlistItem(cand);
    if (success) {
      showNotification(`Đã thêm vào danh mục nguyện vọng`);
    } else {
      showNotification("Nguyện vọng này đã có trong danh mục");
    }
  };

  const loadPreset = (presetName: string) => {
    if (presetName === "it_north") {
      const canonicalIds = ["BKA_IT1", "QHI_CN1", "BVH_CNTT", "KHA_CNTT"];
      const ids = canonicalIds.filter((id) =>
        GOLDEN_PROGRAMS.some((p) => p.programId === id)
      );
      setSelectedIds(ids.slice(0, 4));
      showNotification("Đã nạp: Top CNTT phía Bắc");
    } else if (presetName === "tier_balanced") {
      const reach = candidates.find((c) => c.role === "mao_hiem")?.programId || "BKA_IT1";
      const targetItem = candidates.find((c) => c.role === "vua_tam")?.programId || "QHI_CN1";
      const safety = candidates.find((c) => c.role === "an_toan")?.programId || "BVH_CNTT";
      setSelectedIds(Array.from(new Set([reach, targetItem, safety])));
      showNotification("Đã nạp: 3 tầng nguyện vọng");
    } else if (presetName === "top_recommended") {
      if (candidates.length >= 3) {
        setSelectedIds(candidates.slice(0, 3).map((c) => c.programId));
      } else {
        setSelectedIds(GOLDEN_PROGRAMS.slice(0, 3).map((p) => p.programId));
      }
      showNotification("Đã nạp 3 phương án gợi ý");
    }
  };

  const availableProgramsToSelect = useMemo(() => {
    return GOLDEN_PROGRAMS.filter(
      (p) =>
        !selectedIds.includes(p.programId) &&
        (p.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.majorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedIds, searchQuery]);

  return (
    <div
      className="space-y-5 pb-16 antialiased animate-in fade-in duration-200"
      style={{ scrollbarGutter: "stable" }}
    >
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/options"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Khám phá trường</span>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>So sánh phương án</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {comparedPrograms.length}/4
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Badge điểm thi của bạn */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            Điểm của bạn: <strong className="text-blue-600">{userComposite.toFixed(2)}đ</strong>
          </div>

          {selectedIds.length < 4 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm trường</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                clearCompareRecommendations();
                showNotification("Đã dọn sạch bảng so sánh");
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO TOAST */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-blue-200 bg-white p-3.5 shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-150">
          <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">{actionNotice}</span>
        </div>
      )}

      {/* 2. DẢI PRESET GỢI Ý NHANH (TỐI GIẢN) */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
        <span className="font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Gợi ý nhanh:
        </span>
        <button
          type="button"
          onClick={() => loadPreset("top_recommended")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer"
        >
          Top 3 đề xuất
        </button>
        <button
          type="button"
          onClick={() => loadPreset("it_north")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer"
        >
          CNTT miền Bắc
        </button>
        <button
          type="button"
          onClick={() => loadPreset("tier_balanced")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer"
        >
          3 tầng rủi ro
        </button>
      </div>

      {/* 3. BẢNG SO SÁNH ĐỐI ĐẦU CHÍNH */}
      {comparedPrograms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Scale className="w-7 h-7 text-blue-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">
              Chưa có trường nào trong bảng so sánh
            </h3>
            <p className="text-xs text-slate-500">
              Chọn các trường bạn đang phân vân từ trang Khám phá trường hoặc dùng gợi ý nhanh dưới đây.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPreset("top_recommended")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nạp 3 phương án gợi ý</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* HEADER: THẺ TRƯỜNG */}
              <div className="flex border-b border-slate-200 bg-slate-50/70">
                {/* Cột tiêu đề */}
                <div className="w-48 sm:w-56 shrink-0 p-4 flex flex-col justify-between border-r border-slate-200/80">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Tiêu chí đối chiếu
                  </span>
                  <div className="text-xs text-slate-500">
                    So sánh đối đầu trực diện giữa các phương án xét tuyển
                  </div>
                </div>

                {/* Các cột trường đang so sánh */}
                {comparedPrograms.map((prog) => {
                  const isTarget = target?.programId === prog.programId;
                  const isInWishlist = wishlist?.some(
                    (w) =>
                      w.program_id === prog.programId ||
                      (w.school_code === prog.schoolCode && w.major_label === prog.majorName)
                  );

                  return (
                    <div
                      key={prog.programId}
                      className={`flex-1 min-w-[210px] p-4 flex flex-col justify-between border-r border-slate-200/80 last:border-r-0 ${
                        isTarget ? "bg-blue-50/30" : "bg-white"
                      }`}
                    >
                      <div>
                        {/* Hàng 1: Mã trường + Mục tiêu + Nút Xóa */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-100 text-slate-800">
                              {prog.schoolCode}
                            </span>
                            {isTarget && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                                <Target className="w-2.5 h-2.5" />
                                Mục tiêu
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProgram(prog.programId)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa trường khỏi bảng so sánh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tên trường & Ngành */}
                        <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                          {prog.schoolName}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 mt-1 line-clamp-1">
                          {prog.majorName}
                        </p>
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                          Tổ hợp: <strong className="text-slate-700">{prog.combination}</strong>
                        </span>
                      </div>

                      {/* 2 nút thao tác */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                        {!isTarget ? (
                          <button
                            type="button"
                            onClick={() => setAsPrimaryTarget(prog)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200/60 cursor-pointer"
                          >
                            <Target className="w-3 h-3 text-blue-600" />
                            <span>Đặt làm mục tiêu</span>
                          </button>
                        ) : (
                          <div className="w-full text-center py-1 text-xs font-bold text-blue-600">
                            ✓ Mục tiêu hiện tại
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddToWishlist(prog)}
                          disabled={isInWishlist}
                          className={`w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            isInWishlist
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isInWishlist ? "Đã trong danh mục" : "+ Thêm vào danh mục"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Cột Thêm trường nếu còn chỗ (< 4) */}
                {comparedPrograms.length < 4 && (
                  <div
                    onClick={() => {
                      setSearchQuery("");
                      setIsAddModalOpen(true);
                    }}
                    className="flex-1 min-w-[180px] p-6 flex flex-col items-center justify-center text-center bg-slate-50/30 hover:bg-blue-50/40 border-dashed border-2 border-slate-200 hover:border-blue-300 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Thêm phương án</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Tối đa 4 trường</span>
                  </div>
                )}
              </div>

              {/* HÀNG 1: KHẢ NĂNG TRÚNG TUYỂN & TẦNG NGUYỆN VỌNG */}
              <div className="flex border-b border-slate-100 items-center">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/50 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Khả năng trúng tuyển
                  </span>
                  <span className="text-[11px] text-slate-500">Mô hình xác suất Bayes</span>
                </div>

                {comparedPrograms.map((prog) => {
                  const probPercent = Math.round((prog.admitProbability ?? 0.5) * 100);
                  const tier = prog.role;

                  return (
                    <div
                      key={prog.programId}
                      className="flex-1 min-w-[210px] p-4 border-r border-slate-200/80 last:border-r-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-black text-slate-900">{probPercent}%</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            tier === "an_toan"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tier === "vua_tam"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {tier === "an_toan"
                            ? "🛡️ An toàn"
                            : tier === "vua_tam"
                            ? "⚖️ Phù hợp"
                            : "🔥 Thử sức"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            tier === "an_toan"
                              ? "bg-emerald-500"
                              : tier === "vua_tam"
                              ? "bg-blue-600"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.max(probPercent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>

              {/* HÀNG 2: ĐIỂM CHUẨN NĂM GẦN NHẤT & CHÊNH LỆCH */}
              <div className="flex border-b border-slate-100 items-center">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/50 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Điểm chuẩn gần nhất
                  </span>
                  <span className="text-[11px] text-slate-500">So với điểm của bạn</span>
                </div>

                {comparedPrograms.map((prog) => {
                  const diff = Number((userComposite - prog.cutoff2024).toFixed(2));
                  const isPositive = diff >= 0;

                  return (
                    <div
                      key={prog.programId}
                      className="flex-1 min-w-[210px] p-4 border-r border-slate-200/80 last:border-r-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-900">
                          {prog.cutoff2024.toFixed(2)}đ
                        </span>
                        <span
                          className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isPositive ? `+${diff.toFixed(2)}đ` : `${diff.toFixed(2)}đ`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {isPositive ? "Đang vượt điểm chuẩn" : `Còn thiếu ${Math.abs(diff).toFixed(2)} điểm`}
                      </span>
                    </div>
                  );
                })}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>

              {/* HÀNG 3: HỌC PHÍ DỰ KIẾN / NĂM */}
              <div className="flex border-b border-slate-100 items-center">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/50 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Học phí dự kiến
                  </span>
                  <span className="text-[11px] text-slate-500">Đơn vị: Triệu VNĐ / năm</span>
                </div>

                {comparedPrograms.map((prog) => {
                  const tuitionMil = prog.tuitionVnd ? Math.round(prog.tuitionVnd / 1000000) : null;
                  const budgetMil = profile.annualBudgetVnd
                    ? Math.round(profile.annualBudgetVnd / 1000000)
                    : null;
                  const isOverBudget = budgetMil && tuitionMil !== null ? tuitionMil > budgetMil : false;

                  return (
                    <div
                      key={prog.programId}
                      className="flex-1 min-w-[210px] p-4 border-r border-slate-200/80 last:border-r-0"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-slate-900">
                          {tuitionMil !== null ? `${tuitionMil} triệu` : NO_DATA_LABEL}
                        </span>
                        {tuitionMil !== null && (
                          <span className="text-[11px] text-slate-400 font-medium">/ năm</span>
                        )}
                      </div>

                      {budgetMil && tuitionMil !== null && (
                        <span
                          className={`inline-block text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${
                            isOverBudget
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isOverBudget
                            ? `Vượt ngân sách (${tuitionMil - budgetMil}tr)`
                            : "Phù hợp ngân sách"}
                        </span>
                      )}
                    </div>
                  );
                })}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>

              {/* HÀNG 4: KHU VỰC & ĐỊA ĐIỂM */}
              <div className="flex border-b border-slate-100 items-center">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/50 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    Khu vực đào tạo
                  </span>
                </div>

                {comparedPrograms.map((prog) => (
                  <div
                    key={prog.programId}
                    className="flex-1 min-w-[210px] p-4 text-xs font-semibold text-slate-800 border-r border-slate-200/80 last:border-r-0"
                  >
                    <span>{prog.location || NO_DATA_LABEL}</span>
                  </div>
                ))}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>

              {/* HÀNG 5: TỶ LỆ CÓ VIỆC LÀM */}
              <div className="flex border-b border-slate-100 items-center">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/50 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Việc làm sau 12 tháng
                  </span>
                </div>

                {comparedPrograms.map((prog) => (
                  <div
                    key={prog.programId}
                    className="flex-1 min-w-[210px] p-4 text-xs font-bold text-slate-800 border-r border-slate-200/80 last:border-r-0"
                  >
                    {prog.employmentRate !== null ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black">
                        {prog.employmentRate}% có việc làm
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">{NO_DATA_LABEL}</span>
                    )}
                  </div>
                ))}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>

              {/* HÀNG 6: MINH CHỨNG ĐỀ ÁN GỐC */}
              <div className="flex items-center bg-slate-50/30">
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-slate-50/60 border-r border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Đề án gốc
                  </span>
                </div>

                {comparedPrograms.map((prog) => (
                  <div
                    key={prog.programId}
                    className="flex-1 min-w-[210px] p-4 border-r border-slate-200/80 last:border-r-0"
                  >
                    <a
                      href={prog.dataPassportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem đề án {prog.schoolCode}</span>
                    </a>
                  </div>
                ))}

                {comparedPrograms.length < 4 && <div className="flex-1 min-w-[180px] p-4 bg-slate-50/20" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL THÊM TRƯỜNG SO SÁNH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thêm trường để so sánh"
            className="w-full max-w-lg rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[calc(100dvh-1.5rem)] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Thêm trường vào bảng so sánh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên trường, mã trường hoặc ngành học..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div
              className="flex-1 overflow-y-auto space-y-2 pr-1"
              style={{ scrollbarGutter: "stable" }}
            >
              {availableProgramsToSelect.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy phương án phù hợp với từ khóa
                </div>
              ) : (
                availableProgramsToSelect.map((prog) => (
                  <div
                    key={prog.programId}
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {prog.schoolCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{prog.schoolName}</h4>
                      </div>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        {prog.majorName} ({prog.combinations?.[0] || "A00"})
                      </p>
                      <span className="text-[11px] text-slate-400">
                        Điểm chuẩn 2024: <strong>{prog.cutoff2024 || prog.forecastP50}</strong> • Học
                        phí: {formatTuitionPerYear(prog.tuitionVnd)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addProgram(prog.programId)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition cursor-pointer"
                    >
                      Chọn
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
