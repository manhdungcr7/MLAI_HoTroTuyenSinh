import React from "react";
import { History, Sparkles, Scale, CheckCircle2 } from "lucide-react";
import { TargetProgram } from "@/engine/types";

interface AuditTrailSectionProps {
  historyLogs: { timestamp: string; note: string; newScore: number }[];
  target: TargetProgram | null;
}

export default function AuditTrailSection({ historyLogs, target }: AuditTrailSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
      {/* NHẬT KÝ ĐỐI SOÁT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Nhật Ký Quyết Định Đối Soát (Audit Trail)</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {historyLogs.length} sự kiện
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-2 mb-3 leading-relaxed">
            Mọi tương tác như thay đổi điểm thi khảo sát, đổi mục tiêu trường, hoặc mô phỏng thay đổi điểm đều được hệ thống ghi log
            để phục vụ đối soát quy trình ra quyết định.
          </p>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarGutter: "stable" }}>
            {historyLogs.map((log, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                    ĐIỂM TỔ HỢP: {log.newScore}đ
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-slate-800">{log.note}</div>
                <div className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                  Tác động: Cập nhật đồng bộ Hồ sơ → Khoảng cách điểm → Môn trọng tâm → Danh mục 15 NV → Kế hoạch tuần
                </div>
              </div>
            ))}
          </div>
        </div>

        {target ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              Mục tiêu hiện tại: <strong>{target.majorName}</strong> ({target.schoolName}) · Điểm chuẩn 2024:{" "}
              <strong>{target.cutoff2024 ?? target.forecastP50}</strong>
            </span>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Chưa chọn trường mục tiêu để đối soát</span>
          </div>
        )}
      </div>

      {/* TUYÊN BỐ PHÁP LÝ & MINH BẠCH */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Scale className="h-5 w-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Tuyên Bố Minh Bạch & Giới Hạn Pháp Lý</h3>
          </div>

          <div className="space-y-3 mt-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <h4 className="font-bold text-amber-900 mb-1">1. Bản chất của xác suất trúng tuyển:</h4>
              <p>
                Điểm chuẩn thực tế phụ thuộc vào phổ điểm thi tốt nghiệp THPT năm tuyển sinh chính thức và số lượng nguyện vọng
                đăng ký. Xác suất đỗ và khoảng dự báo [P10, P90] là ước lượng khoa học dựa trên dữ liệu quá khứ, <strong>không phải cam kết pháp lý trúng tuyển 100%</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-1">2. Chiến lược phân bổ 3 Băng Rủi Ro:</h4>
              <p>
                Danh mục 15 nguyện vọng chia làm 3 dải: Mơ ước (2-3 NV), Vừa tầm (5-7 NV), An toàn (3-5 NV). Thí sinh không nên dồn
                toàn bộ nguyện vọng vào nhóm trường có tỷ lệ chọi quá cao.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-1">3. Quyền quyết định tối hậu:</h4>
              <p>
                Hệ thống Nguyện Vọng là công cụ hỗ trợ ra quyết định (Decision Support System). Quyết định đăng ký chính thức cuối cùng
                trên cổng tuyển sinh của Bộ GD&ĐT hoàn toàn thuộc về thí sinh và gia đình.
              </p>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 text-center">
          Dữ liệu tuyển sinh được chuẩn hóa theo quy chế tuyển sinh đại học ban hành bởi Bộ Giáo dục và Đào tạo.
        </div>
      </div>
    </div>
  );
}
