import React from "react";
import { ShieldCheck, Scale, Lock, FileText, X, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalNoticeModal({ isOpen, onClose }: LegalNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Khung Pháp Lý & Điều Khoản Sử Dụng Thương Mại
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảo vệ quyền lợi thí sinh & Tuân thủ quy định tuyển sinh của Bộ Giáo dục & Đào tạo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5 text-xs text-slate-600 leading-relaxed">
          
          {/* Section 1 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Bản chất hệ thống Trí tuệ Quyết định (Decision Intelligence)
            </h3>
            <p>
              Hệ thống Nguyện Vọng là giải pháp tính toán hỗ trợ ra quyết định cá nhân hóa độc lập. Toàn bộ các ước lượng phân vị điểm chuẩn (P10 - P50 - P90), xác suất trúng tuyển và nguy cơ trượt trắng P(fail all) được dẫn xuất từ dữ liệu đề án tuyển sinh thực tế các năm trước kết hợp với thuật toán tích phân Gauss-Hermite và phương pháp suy diễn Bayes thực nghiệm.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 text-amber-950">
            <h3 className="font-semibold text-amber-900 flex items-center gap-2 text-sm mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              2. Tuyên bố Miễn trừ Trách nhiệm Quyết định (Legal Disclaimer)
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Không phải cam kết trúng tuyển:</strong> Mọi kết quả phân tích là dự báo xác suất khách quan, không cấu thành cam kết trúng tuyển hay quyết định thay thế Hội đồng tuyển sinh của các trường Đại học.
              </li>
              <li>
                <strong>Quyền tự quyết cuối cùng:</strong> Thí sinh và phụ huynh là chủ thể duy nhất chịu trách nhiệm về thứ tự sắp xếp và việc bấm xác nhận nguyện vọng chính thức trên Cổng tuyển sinh Quốc gia của Bộ GD&ĐT.
              </li>
              <li>
                <strong>Biến động thị trường:</strong> Điểm chuẩn thực tế có thể dao động tùy theo độ phân hóa của đề thi tốt nghiệp THPT và số lượng thí sinh thực tế nộp hồ sơ vào từng ngành trong năm hiện hành.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 text-blue-950">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              3. Tuân thủ Quy chế Tuyển sinh Bộ GD&ĐT (Thông tư 06/2026/TT-BGDĐT)
            </h3>
            <p className="mb-1.5">
              Hệ thống tích hợp bộ lọc ràng buộc cứng (Hard Constraints) tự động loại bỏ hoặc cảnh báo mức ĐỎ đối với các danh mục vi phạm quy chế tuyển sinh:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ngành Sư phạm (đào tạo giáo viên) bắt buộc phải nằm trong Top 5 nguyện vọng (NV 1 - 5).</li>
              <li>Điểm xét tuyển tối thiểu phải đạt ngưỡng bảo đảm chất lượng đầu vào (Sàn 15.0/30.0 điểm).</li>
              <li>Áp dụng trần điểm ưu tiên tối đa 3.0 điểm và công thức giảm dần tuyến tính từ 22.5 điểm trở lên.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              4. Bảo vệ Dữ liệu Cá nhân & Trẻ vị thành niên (Nghị định 13/2023/NĐ-CP)
            </h3>
            <p>
              Hệ thống áp dụng kiến trúc <strong>Local-First</strong>: Toàn bộ điểm thi, thông tin học bạ, hoàn cảnh gia đình và ngân sách học phí được lưu trữ cục bộ trên thiết bị cá nhân của thí sinh. Chúng tôi cam kết <strong>KHÔNG</strong> bán, chia sẻ hoặc khai thác dữ liệu thí sinh cho các trung tâm đào tạo hoặc tổ chức thương mại thứ ba.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Phiên bản Pháp lý: 2026.1 (Áp dụng mùa thi 2026)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition"
          >
            Tôi đã hiểu & Đồng ý
          </button>
        </div>

      </div>
    </div>
  );
}
