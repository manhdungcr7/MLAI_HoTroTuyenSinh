// Khung dùng chung của ba bước tạo hồ sơ: thanh bước, tiêu đề có minh họa, thanh nút cố định ở đáy.
import type { ReactNode } from "react";
import { Check, FileText, GraduationCap, Sparkles, type LucideIcon } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import type { BuocBatDau } from "@/duong-dan";

export const TEN_BUOC: Record<BuocBatDau, string> = { 1: "Thông tin cơ bản", 2: "Điểm các môn", 3: "Mục tiêu & ưu tiên" };

/** Thanh bước 1-2-3: bước xong có dấu tick, bước hiện tại nổi bật. Bấm được vào bước đã qua để sửa lại. */
export function ThanhBuoc({ hien, denBuoc }: { hien: BuocBatDau; denBuoc: (b: BuocBatDau) => void }) {
  const cac: BuocBatDau[] = [1, 2, 3];
  return (
    <nav aria-label="Các bước tạo hồ sơ" className="px-4 pb-3">
      <ol className="grid grid-cols-3">
        {cac.map((b) => {
          const xong = b < hien, dang = b === hien;
          return (
            <li key={b} className="relative flex flex-col items-center">
              {/* đường nối từ tâm vòng trước tới tâm vòng này, chừa 26px quanh mỗi vòng */}
              {b > 1 && <span aria-hidden className={gop("absolute top-[17px] h-[3px] rounded-full transition-colors", b <= hien ? "bg-xanh" : "bg-vien")} style={{ left: "calc(-50% + 26px)", right: "calc(50% + 26px)" }} />}
              <button type="button" disabled={b > hien} onClick={() => denBuoc(b)} aria-current={dang ? "step" : undefined}
                className="flex flex-col items-center gap-1 min-h-12 px-1 disabled:cursor-default cursor-pointer">
                <span className={gop("relative size-9 rounded-full grid place-items-center text-[14px] font-extrabold transition-colors",
                  dang ? "gd-xanh text-white ring-4 ring-xanh/15" : xong ? "bg-xanh text-white" : "bg-trang border-2 border-vien text-chu-phu")}>
                  {xong ? <Check size={17} strokeWidth={3.2} className="tick-bat" /> : b}
                </span>
                <span className={gop("text-[13px] leading-tight text-center", dang ? "font-extrabold text-xanh" : xong ? "font-bold text-chu" : "font-semibold text-chu-phu")}>{TEN_BUOC[b]}</span>
                {xong && <span className="sr-only">(đã xong, bấm để sửa)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Minh họa nhẹ bên phải tiêu đề: tờ hồ sơ, mũ tốt nghiệp, tia sáng, ghép từ biểu tượng có sẵn. */
export function MinhHoaHoSo() {
  return (
    <span aria-hidden className="relative shrink-0 size-[76px] rounded-lon gd-hero-xanh grid place-items-center">
      <FileText size={38} className="text-xanh" strokeWidth={1.6} />
      <span className="absolute -bottom-1.5 -right-1.5 size-9 rounded-full bg-trang border border-vien grid place-items-center shadow-the">
        <GraduationCap size={20} className="text-xanh-dam" />
      </span>
      <Sparkles size={16} className="absolute -top-1.5 -right-1 text-cam" />
    </span>
  );
}

/** Tiêu đề của bước: chữ lớn, mô tả ngắn, phần phải (minh họa hoặc nhãn). */
export function DauBuoc({ tieuDe, moTa, phai, icon: Icon }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[24px] leading-tight font-extrabold text-muc">{Icon && <Icon size={24} className="text-xanh inline mr-2 -mt-1" />}{tieuDe}</h2>
        {moTa && <p className="text-[14px] leading-snug text-chu-phu mt-1">{moTa}</p>}
      </div>
      {phai}
    </div>
  );
}

/**
 * Thanh nút cố định dưới màn hình. Hai nút: nút phụ bên trái, nút chính bên phải.
 * Các bước này ẩn thanh điều hướng và nút trợ lý nổi, nên thanh chỉ cần chừa vùng an toàn của máy.
 */
export function ThanhHanhDong({ phu, chinh }: { phu: ReactNode; chinh: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-vien bg-nen px-4 py-2.5 vung-an-toan-duoi">
      <div className="grid grid-cols-[1fr_1.7fr] gap-2.5">{phu}{chinh}</div>
    </div>
  );
}
