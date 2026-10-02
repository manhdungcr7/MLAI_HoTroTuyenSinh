import React, { useMemo } from "react";
import { useDecision } from "@/state/DecisionContext";
import { HeroLeverageBanner } from "@/features/analysis/roi/HeroLeverageBanner";
import { SubjectRoiRankingTable, SubjectRoiRowData } from "@/features/analysis/roi/SubjectRoiRankingTable";
import { SubjectLeverageBars, SubjectLeverageItem } from "@/features/analysis/roi/SubjectLeverageBars";
import { QuickInsightsCards, InsightCardItem } from "@/features/analysis/roi/QuickInsightsCards";
import { DeepDiveActionCard } from "@/features/analysis/roi/DeepDiveActionCard";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft } from "lucide-react";

export default function SubjectRoiPage() {
  const { profile, target, subjectRoiList } = useDecision();

  // Top Subject đòn bẩy cao nhất từ mô hình tối ưu
  const topSubject = useMemo(() => {
    if (subjectRoiList && subjectRoiList.length > 0) {
      return subjectRoiList[0];
    }
    return null;
  }, [subjectRoiList]);

  // Dữ liệu bảng xếp hạng các môn học kết nối SSOT với subjectRoiList
  const rankingTableData: SubjectRoiRowData[] = useMemo(() => {
    if (subjectRoiList && subjectRoiList.length > 0) {
      return subjectRoiList.map((roi, idx) => {
        const iconType: SubjectRoiRowData["iconType"] =
          roi.subject === "toan"
            ? "sigma"
            : roi.subject === "ly"
            ? "atom-orange"
            : roi.subject === "hoa"
            ? "atom-yellow"
            : "book";

        const priority: SubjectRoiRowData["priority"] =
          roi.tier === 1 ? "Cao" : roi.tier === 2 ? "Trung bình" : "Thấp";

        return {
          rank: idx + 1,
          subjectKey: String(roi.subject),
          subjectName: roi.subjectVi,
          currentScore: roi.currentScore,
          simulatedScore: roi.simulatedScore,
          impactOptions: roi.unlockedOptionsCount,
          priority,
          iconType,
        };
      });
    }

    return [];
  }, [subjectRoiList]);

  // Dữ liệu thanh bar ngang biểu thị số lựa chọn mới mở ra
  const leverageBarsData: SubjectLeverageItem[] = useMemo(() => {
    if (subjectRoiList && subjectRoiList.length > 0) {
      const maxUnlocked = Math.max(...subjectRoiList.map((r) => r.unlockedOptionsCount), 1);
      const colors = [
        "bg-gradient-to-r from-purple-500 to-indigo-600",
        "bg-blue-500",
        "bg-sky-400",
        "bg-emerald-400",
      ];

      return subjectRoiList.map((roi, idx) => ({
        subjectName: roi.subjectVi,
        optionsAdded: roi.unlockedOptionsCount,
        barColor: colors[idx % colors.length],
        percentage: Math.min(100, Math.max(18, Math.round((roi.unlockedOptionsCount / maxUnlocked) * 100))),
      }));
    }

    return [];
  }, [subjectRoiList]);

  // 3 Thẻ Kết luận nhanh cá nhân hóa theo từng môn
  const quickInsightsData: InsightCardItem[] = useMemo(() => {
    if (subjectRoiList && subjectRoiList.length > 0) {
      const top = subjectRoiList[0];
      const second = subjectRoiList[1];
      const third = subjectRoiList[2];

      const list: InsightCardItem[] = [
        {
          id: 1,
          badgeNumber: 1,
          badgeBgColor: "bg-emerald-500",
          title: `Ưu tiên bứt phá: Môn ${top.subjectVi}`,
          description:
            top.explanationVi ||
            `Tăng 1 điểm ${top.subjectVi} mang lại nhiều lựa chọn nhất (mở thêm ${top.unlockedOptionsCount} nguyện vọng và thu hẹp ${top.gapReduction}đ cách biệt với trường mục tiêu).`,
        },
      ];

      if (second) {
        list.push({
          id: 2,
          badgeNumber: 2,
          badgeBgColor: "bg-blue-600",
          title: `Bổ trợ ${second.subjectVi}`,
          description:
            second.explanationVi ||
            `Điểm hiện tại là ${second.currentScore}đ. Ôn tập môn này giúp tăng thêm ${second.unlockedOptionsCount} phương án dự phòng an toàn.`,
        });
      }

      if (third) {
        list.push({
          id: 3,
          badgeNumber: 3,
          badgeBgColor: "bg-purple-600",
          title: `Duy trì ${third.subjectVi}`,
          description:
            third.explanationVi ||
            `Điểm hiện tại là ${third.currentScore}đ. Đạt ngưỡng an toàn, nên tập trung duy trì phong độ tối thiểu 2.5h/tuần.`,
        });
      }

      return list;
    }

    return [];
  }, [subjectRoiList]);

  return (
    <div
      className="space-y-6 pb-12 animate-in fade-in duration-300 antialiased"
      style={{ scrollbarGutter: "stable" }}
    >
      {/* 1. NÚT QUAY LẠI & TIÊU ĐỀ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/analysis"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Phân tích năng lực</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Môn học ưu tiên bứt phá
          </h1>
        </div>
      </div>

      {!topSubject ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-base font-extrabold text-slate-900">Chưa đủ dữ liệu để xếp hạng môn</p>
          <p className="mt-2 text-sm text-slate-600">
            {!target
              ? "Hãy chọn ngành mục tiêu để biết môn nào giúp em tiến gần mục tiêu nhất."
              : "Hãy nhập điểm thi (hoặc điểm dự kiến) các môn trong tổ hợp xét tuyển của ngành mục tiêu."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/profile" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Nhập điểm</Link>
            <Link href="/profile/goal" className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">Chọn mục tiêu</Link>
          </div>
        </div>
      ) : (
      <>
      {/* 2. HERO BANNER NỔI BẬT */}
      <HeroLeverageBanner
        topSubjectName={topSubject.subjectVi}
        unlockedCount={topSubject.unlockedOptionsCount}
        deltaPoint={topSubject.deltaScore}
      />

      {/* 3. LƯỚI NỘI DUNG 2 CỘT CHUẨN REFERENCE IMAGE 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: BẢNG XẾP HẠNG ROI + BIỂU ĐỒ THANH NGANG */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bảng xếp hạng ROI theo môn học */}
          <SubjectRoiRankingTable data={rankingTableData} />

          {/* Biểu đồ Đòn bẩy theo môn (các thanh ngang) */}
          <SubjectLeverageBars items={leverageBarsData} />
        </div>

        {/* CỘT PHẢI: KẾT LUẬN NHANH + CARD SẴN SÀNG KHÁM PHÁ */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3 Thẻ Kết luận nhanh */}
          <QuickInsightsCards insights={quickInsightsData} />

          {/* Card Sẵn sàng khám phá sâu hơn */}
          <DeepDiveActionCard />
        </div>
      </div>
      </>
      )}
    </div>
  );
}
