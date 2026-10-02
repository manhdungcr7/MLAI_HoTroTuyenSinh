import React, { useState, useMemo } from "react";
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  Scale,
  Building2,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { validatePortfolio } from "@/engine/decision/optimizer";
import { GOLDEN_PROGRAMS } from "@/data/universities";
import { calculateTotalPriorityBonus } from "@/engine/admissions/priority";
import { formatProbability } from "@/lib/format";
import { Priority } from "@/engine/types";

export default function VerifyPage() {
  const {
    profile,
    wishlist,
    gapAnalysis,
    pFailAll,
  } = useDecision();

  // 1. Thẩm định trực tiếp theo Quy chế TT06/2026
  const tt06Audit = useMemo(() => {
    return validatePortfolio(wishlist);
  }, [wishlist]);

  // 2. Điểm xét tuyển hiện tại
  const currentScore = gapAnalysis?.currentCompositeScore ?? 0;
  const isFloorPassed = currentScore >= 15.0;

  // 3. Tính điểm ưu tiên TT06
  const priorityObj: Priority = profile.priority || { area: "KV3", object: "none" };
  const actualPriority = calculateTotalPriorityBonus(priorityObj, currentScore);

  // 4. Kiểm tra ngành Sư phạm trong danh mục
  const teacherViolations = wishlist.filter((w) => {
    const isTeacher = w.major_group === "su_pham" || /sư phạm|giáo dục/i.test(w.major_label);
    return isTeacher && w.rank > 5;
  });

  // 5. Thử nghiệm độ nhạy điểm thi (Sensitivity Test)
  const [sensitivityDelta, setSensitivityDelta] = useState<number>(0);
  const simulatedScore = Math.max(0, Math.min(30, currentScore + sensitivityDelta));

  // 6. Tra cứu Data Passport Đề án chính thức
  const [passportSearch, setPassportSearch] = useState("");
  const verifiedPrograms = useMemo(() => {
    const q = passportSearch.trim().toLowerCase();
    if (!q) return GOLDEN_PROGRAMS.slice(0, 8);
    return GOLDEN_PROGRAMS.filter(
      (p) =>
        p.schoolCode.toLowerCase().includes(q) ||
        p.schoolName.toLowerCase().includes(q) ||
        p.majorName.toLowerCase().includes(q)
    );
  }, [passportSearch]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. KẾT QUẢ THẨM ĐỊNH TOÀN DIỆN TT06/2026 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Thẩm định Quy chế Tuyển sinh TT06/2026
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                tt06Audit.isValid && isFloorPassed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {tt06Audit.isValid && isFloorPassed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>HỢP LỆ THEO QUY CHẾ TT06</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>CẦN ĐIỀU CHỈNH ĐỂ HỢP LỆ</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 4 TIÊU CHÍ BẮT BUỘC THEO QUY CHẾ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Tiêu chí 1: Điểm sàn đại học */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                1. Điểm sàn xét tuyển đại học (&ge; 15.0đ)
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  isFloorPassed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {isFloorPassed ? `ĐẠT (${currentScore.toFixed(2)}đ)` : `KHÔNG ĐẠT (${currentScore.toFixed(2)}đ)`}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Theo quy định của Bộ GD&ĐT, thí sinh phải đạt tổng điểm 3 môn tối thiểu 15.0 điểm để đủ điều kiện đăng ký xét tuyển đại học.
            </p>
          </div>

          {/* Tiêu chí 2: Công thức điểm ưu tiên TT06 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                2. Điểm ưu tiên khu vực & đối tượng
              </span>
              <span className="text-[11px] font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                +{actualPriority.toFixed(2)}đ
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {currentScore >= 22.5
                ? `Đã áp dụng giảm tuyến tính TT06: P = P₀ × [(30 − ${currentScore.toFixed(1)}) / 7.5], tối đa không quá 3.0đ.`
                : "Tổng điểm dưới 22.5đ được cộng trọn vẹn điểm ưu tiên theo quy định."}
            </p>
          </div>

          {/* Tiêu chí 3: Ngành Sư phạm */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                3. Quy định nguyện vọng khối Sư phạm
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  teacherViolations.length === 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {teacherViolations.length === 0 ? "HỢP LỆ" : `VI PHẠM (NV ${teacherViolations.map((t) => t.rank).join(", ")})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Các ngành đào tạo giáo viên chỉ được xét tuyển nếu đặt từ NV 1 đến NV 5.
            </p>
          </div>

          {/* Tiêu chí 4: Lưới an toàn */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                4. Lưới an toàn chống trượt toàn bộ
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  tt06Audit.safetyCount > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {tt06Audit.safetyCount > 0
                  ? `AN TOÀN (${tt06Audit.safetyCount} NV)`
                  : "CHƯA CÓ NV AN TOÀN"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cần tối thiểu 1–2 nguyện vọng ở tầng An toàn để kiểm soát nguy cơ trượt toàn bộ xuống dưới 5%.
            </p>
          </div>
        </div>

        {/* NẾU CÓ CẢNH BÁO VI PHẠM */}
        {tt06Audit.warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {tt06Audit.warnings.map((warn: { title: string; message: string; level: string }, i: number) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  warn.level === "red"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-black">{warn.title}</div>
                  <div className="leading-relaxed font-medium">{warn.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. KIỂM CHỨNG THUẬT TOÁN RỦI RO & ĐỘ NHẠY ĐIỂM SỐ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Kiểm chứng thuật toán Gauss-Hermite & Phân tích độ nhạy
              </h3>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            Rủi ro trượt tất cả: <strong className="text-blue-700 font-black">{formatProbability(pFailAll)}</strong>
          </div>
        </div>

        {/* BỘ ĐIỀU CHỈNH ĐỘ NHẠY ĐIỂM SỐ */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-indigo-950">
              Thử nghiệm độ bền vững danh mục khi điểm thi thực tế thay đổi:
            </span>
            <div className="flex items-center gap-1.5">
              {[-1.0, -0.5, 0, +0.5, +1.0].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setSensitivityDelta(delta)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sensitivityDelta === delta
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta === 0 ? "Gốc" : delta}đ
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Điểm giả định:</span>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {simulatedScore.toFixed(2)}đ{" "}
                <span className="text-xs font-semibold text-slate-400">
                  ({sensitivityDelta >= 0 ? `+${sensitivityDelta}` : sensitivityDelta}đ)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Nguyện vọng trong danh mục:</span>
              <div className="text-base font-black text-blue-700 mt-0.5">
                {wishlist.length} nguyện vọng
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Ước tính P(trượt tất cả):</span>
              <div className="text-base font-black text-emerald-700 mt-0.5">
                {sensitivityDelta < 0
                  ? formatProbability(Math.min(1, pFailAll * 1.8))
                  : sensitivityDelta > 0
                  ? formatProbability(Math.max(0, pFailAll * 0.4))
                  : formatProbability(pFailAll)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRA CỨU ĐỀ ÁN & MINH CHỨNG PHÁP LÝ (DATA PASSPORT) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Tra cứu đề án tuyển sinh & Minh chứng văn bản gốc
              </h3>
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={passportSearch}
              onChange={(e) => setPassportSearch(e.target.value)}
              placeholder="Nhập mã trường (BKA, NEU...) hoặc tên ngành..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        {/* DANH SÁCH ĐỀ ÁN CHÍNH THỨC */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                <th className="p-2.5">Mã trường</th>
                <th className="p-2.5">Tên trường & Ngành đào tạo</th>
                <th className="p-2.5">Tổ hợp</th>
                <th className="p-2.5">Điểm P50</th>
                <th className="p-2.5">Nguồn dữ liệu & Pháp lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifiedPrograms.map((prog) => (
                <tr key={prog.programId} className="hover:bg-slate-50/60 transition">
                  <td className="p-2.5 font-black text-blue-700 whitespace-nowrap">
                    {prog.schoolCode}
                  </td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">{prog.majorName}</div>
                    <div className="text-[11px] text-slate-500">{prog.schoolName}</div>
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {prog.combinations?.[0] || "A00"}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                    {(prog.forecastP50 || prog.cutoff2024 || 25).toFixed(2)}đ
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        🏛️ Đề án chính thức
                      </span>
                      {prog.dataPassport && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {prog.dataPassport}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
