// Các thành phần UI chuẩn hóa được bóc tách từ mẫu thiết kế giới thiệu (Landing patterns)
// Dùng chung cho các tính năng: Khám phá, Hôm nay, Hồ sơ, Đồng hành, Mục tiêu...
// Tuân thủ: Tailwind Tokens, Light mode, Zero glassmorphism, Mobile-first.

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Thẻ ghi chú / điểm nổi bật với Icon tròn bên trái, tiêu đề và nội dung súc tích. */
export interface TheGhiChuProps {
  icon: LucideIcon;
  tieuDe: string;
  noiDung?: ReactNode;
  tone?: "xanh" | "luc" | "cam" | "tim" | "do" | "muc";
  phuHop?: boolean;
}

const TONE_ICON: Record<string, string> = {
  xanh: "bg-xanh-nhat text-xanh border-xanh/20",
  luc: "bg-luc-nhat text-luc-chu border-luc/20",
  cam: "bg-cam-nhat text-cam-chu border-cam/20",
  tim: "bg-tim-nhat text-tim-chu border-tim/20",
  do: "bg-do-nhat text-do-chu border-do/20",
  muc: "bg-nen text-muc border-vien",
};

export function TheGhiChu({ icon: IconComponent, tieuDe, noiDung, tone = "xanh" }: TheGhiChuProps) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-trang rounded-the border border-vien shadow-the transition-all">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${TONE_ICON[tone] ?? TONE_ICON.xanh}`}>
        <IconComponent size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-muc leading-snug">{tieuDe}</h4>
        {noiDung && <div className="text-xs text-muc-phu mt-0.5 leading-relaxed">{noiDung}</div>}
      </div>
    </div>
  );
}

/** Hàng mục lợi ích / bước thực hiện ngắn gọn 1 dòng. */
export function MucLoiIch({ icon: IconComponent, tieuDe, moTa }: { icon: LucideIcon; tieuDe: string; moTa: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-trang rounded-the border border-vien">
      <div className="w-8 h-8 rounded-full bg-xanh-nhat text-xanh flex items-center justify-center shrink-0">
        <IconComponent size={16} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-muc truncate">{tieuDe}</div>
        <div className="text-[11px] text-muc-phu truncate">{moTa}</div>
      </div>
    </div>
  );
}

/** Thẻ Hồ sơ Người đồng hành / Chuyên gia tư vấn */
export interface TheNguoiDongHanhProps {
  ten: string;
  vaiTro: string;
  moTa: string;
  trangThai?: string;
  tags?: string[];
  anhDaiDien?: string;
}

export function TheNguoiDongHanh({ ten, vaiTro, moTa, trangThai = "Sẵn sàng hỗ trợ", tags = [] }: TheNguoiDongHanhProps) {
  return (
    <div className="p-4 bg-trang rounded-the border border-vien shadow-the">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-vien">
        <div>
          <h3 className="text-sm font-bold text-muc">{ten}</h3>
          <p className="text-xs text-muc-phu">{vaiTro}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-luc-nhat text-luc-chu text-[11px] font-medium rounded-lg border border-luc/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-luc animate-pulse" />
          {trangThai}
        </span>
      </div>
      <p className="text-xs text-muc mt-2.5 leading-relaxed">{moTa}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-vien">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-nen text-muc-phu text-[11px] rounded border border-vien">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Thẻ Gợi ý Xếp hạng / Danh sách khuyến nghị */
export interface HangKhuyenNghiProps {
  thuHang: number;
  truong: string;
  nganh: string;
  diem: number | string;
  tags?: string[];
  tone?: "xanh" | "luc" | "cam" | "tim" | "do";
}

export function HangKhuyenNghi({ thuHang, truong, nganh, diem, tags = [] }: HangKhuyenNghiProps) {
  return (
    <div className="p-3 bg-trang rounded-the border border-vien shadow-the">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-nen text-muc font-bold text-xs flex items-center justify-center shrink-0 border border-vien">
          {thuHang}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-muc truncate">{truong}</h4>
          <p className="text-[11px] text-muc-phu truncate">{nganh}</p>
        </div>
        <span className="text-xs font-bold text-xanh shrink-0 px-2 py-0.5 bg-xanh-nhat rounded border border-xanh/20">
          {diem} đ
        </span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-vien">
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] text-muc-phu bg-nen px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chip giá trị dạng viên thuốc (Pill Chip) */
export function ChipGiaTri({ icon: IconComponent, nhan }: { icon: LucideIcon; nhan: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-trang rounded-lg border border-vien shadow-the text-xs font-medium text-muc whitespace-nowrap">
      <IconComponent size={14} className="text-xanh shrink-0" />
      {nhan}
    </span>
  );
}
