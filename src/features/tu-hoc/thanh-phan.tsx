// Thành phần dùng riêng trong slice Tiến độ + tự học.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import type { TietCoDinh, ToneTen } from "@/state/types";

/** Màu và nhãn của loại tiết, đồng bộ với chú thích ở màn Lịch tuần. */
export const LOAI_TIET: Record<TietCoDinh["loai"], { nhan: string; tone: ToneTen; nen: string }> = {
  chinhKhoa: { nhan: "Chính khóa", tone: "xanh", nen: "bg-xanh" },
  hocThem: { nhan: "Học thêm", tone: "tim", nen: "bg-tim" },
  khac: { nhan: "Hoạt động khác", tone: "cam", nen: "bg-cam" },
};

const COT: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 7: "grid-cols-7" };

/** Nhóm nút chọn dạng lưới đều (ChonNhanh chỉ có 2–3 cột). Một lựa chọn: radio; nhiều lựa chọn: bật/tắt. */
export function NhomChon<T extends string | number>({ nhan, cacLua, giaTri, onChange, cot, tat }: {
  nhan: string;
  cacLua: { gia: T; nhan: string; phu?: string; icon?: LucideIcon }[];
  giaTri: T | T[];
  onChange: (v: T) => void;
  cot: 2 | 3 | 4 | 7;
  tat?: boolean;
}) {
  const nhieu = Array.isArray(giaTri);
  return (
    <div role={nhieu ? "group" : "radiogroup"} aria-label={nhan} className={gop("grid", cot === 7 ? "gap-0.5 -mx-3" : "gap-1.5", COT[cot])}>
      {cacLua.map((c) => {
        const chon = nhieu ? (giaTri as T[]).includes(c.gia) : giaTri === c.gia;
        return (
          <button key={String(c.gia)} type="button" disabled={tat} onClick={() => onChange(c.gia)}
            {...(nhieu ? { "aria-pressed": chon } : { role: "radio", "aria-checked": chon })}
            className={gop(
              "min-h-12 px-1 rounded-xl border text-[14px] font-bold flex flex-col items-center justify-center leading-tight transition-colors disabled:opacity-50",
              chon ? "bg-xanh-nhat border-xanh text-xanh" : "bg-trang border-vien text-chu active:bg-xanh-nhat",
            )}>
            {c.icon && <c.icon size={18} className="mb-0.5" />}
            {c.nhan}
            {c.phu && <span className={gop("text-[12px] font-semibold", chon ? "text-xanh" : "text-chu-phu")}>{c.phu}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Thẻ một nhóm cài đặt: biểu tượng tròn nhạt + tiêu đề + mô tả, nội dung bên dưới. */
export function TheCaiDat({ icon: Icon, tone = "xanh", tieuDe, moTa, phai, children, className }: {
  icon: LucideIcon; tone?: ToneTen; tieuDe: string; moTa?: ReactNode; phai?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <section className={gop("rounded-the bg-trang border border-vien shadow-the p-4", className)}>
      <div className="flex items-start gap-3">
        <span className={gop("size-10 rounded-xl grid place-items-center shrink-0", TONE_NEN[tone], TONE_CHU[tone])}><Icon size={20} /></span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-extrabold text-muc leading-snug">{tieuDe}</h2>
          {moTa && <p className="text-[13px] text-chu-phu leading-snug mt-0.5">{moTa}</p>}
        </div>
        {phai}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </section>
  );
}

/**
 * Công tắc có vùng bấm 48×48 (CongTac dùng chung chỉ cao 28px). Hình giống hệt CongTac.
 * Đề nghị đưa vùng bấm lớn này vào components/ui/nhap-lieu.tsx rồi bỏ bản riêng.
 */
export function CongTacLon({ dang, onChange, nhan }: { dang: boolean; onChange: (v: boolean) => void; nhan: string }) {
  return (
    <button type="button" role="switch" aria-checked={dang} aria-label={nhan} onClick={() => onChange(!dang)}
      className="min-h-12 min-w-12 -my-2.5 -mr-1 grid place-items-center shrink-0">
      <span className={gop("w-12 h-7 rounded-full p-0.5 transition-colors", dang ? "bg-xanh" : "bg-chu-phu/40")}>
        <span className={gop("block size-6 rounded-full bg-white shadow transition-transform", dang && "translate-x-5")} />
      </span>
    </button>
  );
}

/** Ô nhập giờ (hh:mm) cùng chiều cao với các ô nhập khác. */
export function OGio({ nhan, giaTri, onChange, loi, tat }: { nhan: string; giaTri: string; onChange: (v: string) => void; loi?: boolean; tat?: boolean }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[13px] font-bold text-chu-phu mb-1">{nhan}</span>
      <input type="time" value={giaTri} disabled={tat} onChange={(e) => onChange(e.target.value)} step={300}
        className={gop("w-full min-h-12 rounded-xl border bg-white px-3 text-[16px] font-bold text-chu disabled:opacity-50", loi ? "border-do" : "border-vien focus:border-xanh")} />
    </label>
  );
}
