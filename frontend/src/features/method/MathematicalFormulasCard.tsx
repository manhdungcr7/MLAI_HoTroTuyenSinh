import React, { useState } from "react";
import { ChevronDown, ChevronUp, Target, ShieldCheck, Database, Award } from "lucide-react";
import {
  IDIO_STD,
  NATIONAL_SHOCK_STD,
  REACH_MAX_PROB,
  SAFE_MIN_PROB,
} from "@/engine/admissions/probability";
import { CATALOG_STATS } from "@/data/catalog";

export default function MathematicalFormulasCard() {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const sigma = Math.sqrt(NATIONAL_SHOCK_STD ** 2 + IDIO_STD ** 2);
  const pct = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)}%`;

  return (
    <section className="space-y-4" aria-labelledby="how-it-works">
      {/* 3 NGUYÊN TẮC CỐT LÕI - THIẾT KẾ DẠNG 3 THẺ HIỆN ĐẠI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thẻ 1: Khả năng trúng tuyển */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
              <Target className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              1. Khả năng trúng tuyển
            </h3>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
              <span className="font-bold text-rose-800">🔥 Thử sức</span>
              <span className="text-[11px] font-bold text-rose-700">Khả năng đỗ &lt; 40%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 border border-blue-100">
              <span className="font-bold text-blue-800">⚖️ Phù hợp</span>
              <span className="text-[11px] font-bold text-blue-700">Khả năng đỗ 40% – 80%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <span className="font-bold text-emerald-800">🛡️ An toàn</span>
              <span className="text-[11px] font-bold text-emerald-700">Khả năng đỗ &gt; 80%</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Lưới an toàn chống trượt */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              2. Lưới bảo vệ không trượt hết
            </h3>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Nguy cơ trượt tất cả:</span>
              <span className="text-emerald-700 font-black text-sm">&lt; 5%</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-slate-600 pt-1.5 border-t border-slate-200/60">
              <span>Khuyến nghị tối ưu:</span>
              <span className="font-bold text-blue-700">2 – 3 NV An toàn</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: 100% Căn cứ đề án gốc */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
              <Database className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              3. Dữ liệu đề án tuyển sinh thật
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-black text-slate-900 text-base">40+</div>
              <div className="text-[11px] text-slate-600 font-medium">Ngành tuyển sinh</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-black text-slate-900 text-base">4 năm</div>
              <div className="text-[11px] text-slate-600 font-medium">Điểm chuẩn (21-24)</div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI CÔNG THỨC TOÁN HỌC DÀNH CHO AI MUỐN XEM KỸ (COLLAPSIBLE) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setIsDetailOpen(!isDetailOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-700 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Xem chi tiết công thức toán học &amp; giới hạn dữ liệu</span>
          </span>
          {isDetailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {isDetailOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <h4 className="font-extrabold text-slate-900">Công thức xác suất trúng tuyển</h4>
              <p className="font-mono text-[11px] bg-white border border-slate-200 rounded p-2 text-blue-700">
                P = Φ((Điểm xét tuyển − Điểm chuẩn P50) / σ)
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Trong đó σ ≈ {sigma.toFixed(2)} kết hợp giữa độ biến động quốc gia ({NATIONAL_SHOCK_STD}) và độ dao động cục bộ từng ngành ({IDIO_STD}).
              </p>
            </div>

            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <h4 className="font-extrabold text-slate-900">Quy tắc tính điểm ưu tiên TT06/2026</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Điểm ưu tiên được cộng vào tổng điểm 3 môn, tự động giảm tuyến tính khi tổng điểm thi từ 22.5 điểm trở lên theo đúng quy chế tuyển sinh của Bộ Giáo dục &amp; Đào tạo.
              </p>
            </div>

            <div className="md:col-span-2 p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
              <strong className="font-bold block text-xs">Lưu ý quan trọng:</strong>
              <p>
                Toàn bộ các phép tính mang tính tham khảo và hỗ trợ định hướng, không thay thế quyết định đăng ký chính thức của thí sinh trên cổng tuyển sinh Bộ GD&amp;ĐT.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
