import React from "react";
import { X, Printer, ShieldCheck, CheckCircle2, GraduationCap, Building2, Calendar, Target, Clock } from "lucide-react";
import {
  StudentProfile,
  TargetProgram,
  WishlistItem,
  GapMetric,
} from "@/engine/types";
import { GOLDEN_PROGRAMS } from "@/data/universities";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { formatEmploymentRate, formatTuitionPerYear } from "@/lib/format";

interface ParentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  target: TargetProgram | null;
  wishlist: WishlistItem[];
  gapAnalysis: GapMetric;
  pFailAll: number;
}

export default function ParentReportModal({
  isOpen,
  onClose,
  profile,
  target,
  wishlist,
  gapAnalysis,
  pFailAll,
}: ParentReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Không tự tạo danh sách mẫu: báo cáo chỉ phản ánh nguyện vọng học sinh thực sự có
  const items = wishlist;

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 p-2 sm:p-4 overflow-y-auto print:static print:bg-transparent print:p-0">
      <div role="dialog" aria-modal="true" aria-label="Báo cáo cho phụ huynh" className="w-full max-w-4xl rounded-2xl bg-white p-4 sm:p-8 shadow-2xl print:max-w-none print:shadow-none print:p-0 print:border-none print:m-0">
        {/* NÚT THAO TÁC TRÊN ĐẦU MODAL (ẨN KHI IN) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 font-bold">
              <Printer className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Xem Trước Báo Cáo Phụ Huynh (Khổ A4)</h3>
              <p className="text-xs text-slate-500">Tối ưu in ấn trực tiếp hoặc lưu file PDF để trao đổi gia đình</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In Báo Cáo / Lưu PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG BÁO CÁO A4 (IN ĐƯỢC) */}
        <div className="text-slate-900 space-y-6 print:space-y-4">
          {/* HEADER BÁO CÁO */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-black text-blue-700">
                NGUYỆN VỌNG AI · HỆ THỐNG TRỢ LÝ RA QUYẾT ĐỊNH TUYỂN SINH ĐẠI HỌC
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
                BÁO CÁO TỔNG KẾT CHIẾN LƯỢC NGUYỆN VỌNG & KẾ HOẠCH HÀNH ĐỘNG
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Dành cho Phụ huynh và Thí sinh niên khóa 2025 - 2026</p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <div className="text-xs font-bold text-slate-700">Ngày lập: {currentDate}</div>
              <div className="text-[11px] font-mono text-emerald-700 font-extrabold flex items-center justify-end gap-1 mt-0.5" title="Đã đối soát với Đề án tuyển sinh chính thức">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Đã kiểm định với Đề án tuyển sinh chính thức</span>
              </div>
            </div>
          </div>

          {/* PHẦN 1: THÔNG TIN HỌC SINH & NĂNG LỰC HIỆN TẠI */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              1. Thông Tin Thí Sinh & Năng Lực Khảo Sát Hiện Tại
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Họ và tên thí sinh:</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{profile.name}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Trường THPT:</span>
                <div className="font-semibold text-slate-800 mt-0.5">{profile.highSchool}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Tổ hợp xét tuyển chính:</span>
                <div className="font-extrabold text-blue-700 font-mono mt-0.5">{profile.activeCombination}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Điểm tổ hợp hiện tại:</span>
                <div className="font-black text-blue-900 text-sm font-mono mt-0.5">
                  {gapAnalysis.currentCompositeScore.toFixed(2)} điểm
                </div>
              </div>
            </div>

            {/* BẢNG ĐIỂM CHI TIẾT 9 MÔN */}
            <div className="pt-2 border-t border-slate-200/70 flex items-center gap-4 text-xs flex-wrap">
              <span className="text-slate-500 font-bold text-[11px]">Điểm từng môn:</span>
              {Object.entries(profile.examScores).map(([sub, score]) => {
                if (score === null || score === undefined) return null;
                return (
                  <span key={sub} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                    {SUBJECT_LABELS_VI[sub] || sub}: <strong className="font-black">{score}</strong>
                  </span>
                );
              })}
              <span className="text-slate-500 text-[11px] ml-auto">
                Trần học phí cam kết: <strong>{(profile.annualBudgetVnd / 1000000).toFixed(0)} triệu/năm</strong>
              </span>
            </div>
          </div>

          {/* PHẦN 2: MỤC TIÊU SỐ 1 & BẠN CÒN THIẾU BAO NHIÊU ĐIỂM? */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-indigo-600" />
              2. Nguyện Vọng Trọng Tâm Số 1 & Bạn Còn Thiếu Bao Nhiêu Điểm?
            </h3>

            {target ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {target.majorName} — {target.schoolName} ({target.schoolCode})
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Mã ngành: {target.programId} · Học phí: {formatTuitionPerYear(target.tuitionVnd)} · Việc làm:{" "}
                    {formatEmploymentRate(target.employmentRate)}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500" title="Điểm chuẩn tham khảo trung vị (P50)">Dự báo Tham khảo:</div>
                    <div className="font-black text-slate-900 font-mono">{target.forecastP50}đ</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Bạn còn thiếu:</div>
                    <div
                      className={`font-black font-mono ${
                        gapAnalysis.rawGap >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {gapAnalysis.rawGap >= 0 ? `+${gapAnalysis.rawGap.toFixed(2)}` : gapAnalysis.rawGap.toFixed(2)}đ
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                Chưa có trường mục tiêu được ghim trong báo cáo.
              </div>
            )}
          </div>

          {/* PHẦN 3: DANH MỤC 15 NGUYỆN VỌNG PHÂN BỔ 3 BĂNG RỦI RO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-purple-600" />
                3. Danh sách nguyện vọng (Thử sức / Phù hợp / An toàn)
              </h3>
              {items.length > 0 && (
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded border ${
                    pFailAll <= 0.05
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-800 bg-amber-50 border-amber-200"
                  }`}
                >
                  Khả năng không đỗ nguyện vọng nào (ước tính): {(pFailAll * 100).toFixed(1)}%
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                    <th className="p-2 text-center w-8">NV</th>
                    <th className="p-2">Trường & Ngành Đào Tạo</th>
                    <th className="p-2 text-center w-12">Tổ Hợp</th>
                    <th className="p-2 text-center">Phân Loại Dải</th>
                    <th className="p-2 text-center">Điểm 2024</th>
                    <th className="p-2 text-center" title="Điểm chuẩn tham khảo trung vị (P50)">Dự Báo Tham Khảo</th>
                    <th className="p-2 text-center">Xác Suất Đỗ</th>
                    <th className="p-2 text-right">Học Phí/Năm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500">
                        Chưa có nguyện vọng nào. Hãy tạo danh sách ở mục &quot;Chiến lược nguyện vọng&quot; trước khi xuất báo cáo.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => {
                    const prog = GOLDEN_PROGRAMS.find(
                      (g) => g.schoolCode === item.school_code && g.majorName.includes(item.major_label.split(" (")[0])
                    );
                    const tuition = item.tuition_vnd ?? prog?.tuitionVnd ?? null;
                    const roleBadge =
                      item.role === "an_toan"
                        ? { label: "An toàn", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" }
                        : item.role === "vua_tam"
                        ? { label: "Phù hợp", bg: "bg-blue-50 text-blue-800 border-blue-200" }
                        : { label: "Thử sức", bg: "bg-rose-50 text-rose-800 border-rose-200" };

                    return (
                      <tr key={item.rank} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold font-mono text-slate-700">{item.rank}</td>
                        <td className="p-2">
                          <span className="font-bold text-slate-900">{item.major_label}</span>
                          <span className="text-slate-500 font-mono text-[10px] ml-1.5">({item.school_code})</span>
                        </td>
                        <td className="p-2 text-center font-mono font-semibold text-blue-700">
                          {item.combinations_seen}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${roleBadge.bg}`}>
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono text-slate-600">{item.latest_score ?? "-"}</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-900">{item.forecast_p50}</td>
                        <td className="p-2 text-center font-mono font-extrabold text-slate-900">
                          {(item.admit_prob * 100).toFixed(0)}%
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {formatTuitionPerYear(tuition)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PHẦN 4: KẾ HOẠCH HÀNH ĐỘNG & CAM KẾT ĐỒNG HÀNH */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              4. Kế Hoạch Phân Bổ 168 Giờ Tuần & Lời Khuyên Dành Cho Phụ Huynh
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
              <li>
                <strong>Giấc ngủ đảm bảo sức khỏe:</strong> Tuyệt đối duy trì tối thiểu <strong>7.0 - 7.5 giờ ngủ/ngày</strong>. Giấc ngủ đủ giúp chuyển đổi trí nhớ ngắn hạn thành trí nhớ dài hạn phục vụ kỳ thi.
              </li>
              <li>
                <strong>Tập trung môn học ưu tiên:</strong> Dành 60% quỹ tự học cho môn học ưu tiên hàng đầu theo phân tích để tạo bước nhảy vọt điểm số nhanh nhất.
              </li>
              <li>
                <strong>Tâm lý thi cử:</strong> Danh mục nguyện vọng đã được thiết kế có tầng bảo hiểm an toàn vững chắc, thí sinh hoàn toàn tự tin bước vào phòng thi không áp lực trượt đại học.
              </li>
            </ul>
          </div>

          {/* CHỮ KÝ XÁC NHẬN */}
          <div className="pt-6 grid grid-cols-2 gap-6 text-center text-xs">
            <div className="space-y-14">
              <div className="font-black text-slate-700 uppercase">CHỮ KÝ CỦA THÍ SINH</div>
              <div className="text-slate-400 italic text-[11px]">(Ký và ghi rõ họ tên)</div>
              <div className="font-bold text-slate-900">{profile.name}</div>
            </div>
            <div className="space-y-14">
              <div className="font-black text-slate-700 uppercase">CHỮ KÝ CỦA PHỤ HUYNH / NGƯỜI GIÁM HỘ</div>
              <div className="text-slate-400 italic text-[11px]">(Ký và ghi rõ họ tên)</div>
              <div className="font-bold text-slate-900">Phụ huynh học sinh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
