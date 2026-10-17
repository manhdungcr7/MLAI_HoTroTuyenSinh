// Thành phần riêng của luồng Khởi đầu: thanh bước 1-2-3, nhóm câu hỏi, ô chọn có biểu tượng.
import type { ReactNode } from "react";
import { Check, CircleAlert, CloudCheck, type LucideIcon } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import type { LuaChonCoIcon } from "./lua-chon";

/** Nhóm một câu hỏi: tiêu đề (có biểu tượng), ghi chú bắt buộc/tùy chọn, nội dung, lời nhắc lỗi. */
export function CauHoi({ tieuDe, icon: Icon, batBuoc, tuyChon, phu, loi, idLoi, children }: {
  tieuDe: string; icon?: LucideIcon; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string; idLoi?: string; children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="w-full flex items-center gap-1.5 text-[15px] font-bold text-chu mb-2">
        {Icon && <Icon size={18} className="text-xanh shrink-0" />}
        <span>{tieuDe}{batBuoc && <span className="text-do" aria-label="bắt buộc"> *</span>}</span>
        {phu && <span className="text-[12px] font-semibold text-chu-phu">({phu})</span>}
        {tuyChon && <span className="ml-auto text-[12px] font-semibold text-chu-phu whitespace-nowrap">Không bắt buộc</span>}
      </legend>
      {children}
      {loi && <LoiNho id={idLoi}>{loi}</LoiNho>}
    </fieldset>
  );
}

export function LoiNho({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} className="mt-1.5 flex items-center gap-1 text-[13px] font-semibold text-do-chu"><CircleAlert size={15} className="shrink-0" />{children}</p>;
}

/**
 * Ô chọn có biểu tượng. kieu="chip": viên ngang; kieu="o": ô đứng (biểu tượng trên, chữ dưới).
 * Một lựa chọn dùng role radio; nhiều lựa chọn dùng aria-pressed.
 */
export function ChonO<T extends string | number | boolean>({ cacLua, giaTri, onChange, nhieu, cot, kieu = "chip", idDau, coLoi, nhan }: {
  cacLua: LuaChonCoIcon<T>[];
  giaTri: T | T[] | null;
  onChange: (v: any) => void;
  nhieu?: boolean;
  cot?: 2 | 3 | 4;
  kieu?: "chip" | "o";
  idDau?: string; // id của ô đầu tiên, để đưa con trỏ tới khi còn thiếu
  coLoi?: boolean;
  nhan: string; // nhãn đọc cho trình đọc màn hình
}) {
  const dangChon = (g: T) => (nhieu ? (giaTri as T[]).includes(g) : giaTri === g);
  const bam = (g: T) => {
    if (!nhieu) return onChange(g);
    const a = giaTri as T[];
    onChange(a.includes(g) ? a.filter((x) => x !== g) : [...a, g]);
  };
  const luoi = cot === 2 ? "grid grid-cols-2 gap-2" : cot === 3 ? "grid grid-cols-3 gap-2" : cot === 4 ? "grid grid-cols-4 gap-2" : "flex flex-wrap gap-2";
  return (
    <div role={nhieu ? "group" : "radiogroup"} aria-label={nhan} className={luoi}>
      {cacLua.map((c, i) => {
        const chon = dangChon(c.gia);
        const Icon = c.icon;
        return (
          <button key={String(c.gia)} type="button" id={i === 0 ? idDau : undefined} onClick={() => bam(c.gia)}
            {...(nhieu ? { "aria-pressed": chon } : { role: "radio", "aria-checked": chon })}
            className={gop(
              "relative rounded-[10px] border font-semibold transition-all cursor-pointer nay-nhe",
              kieu === "o" ? "min-h-[72px] px-2 py-2 flex flex-col items-center justify-center gap-1 text-center text-[13px] leading-tight"
                : gop("min-h-12 py-2 inline-flex items-center justify-center gap-1.5 text-[14px] leading-tight", cot === 3 ? "px-2" : "px-3", chon && "pr-8"), // chừa chỗ cho dấu ✓ để không đè chữ
              chon ? "bg-xanh-nhat border-xanh text-xanh border-[1.5px] shadow-sm font-bold" : gop("bg-trang text-chu active:bg-xanh-nhat hover:border-xanh/40", coLoi ? "border-do/60" : "border-vien"),
            )}>
            {Icon && <Icon size={kieu === "o" ? 20 : 17} className={chon ? "text-xanh" : "text-chu-phu"} />}
            <span>{c.nhan}</span>
            {chon && (
              <span className={gop("tick-bat size-4 rounded-full bg-xanh text-white grid place-items-center", kieu === "o" ? "absolute top-1.5 right-1.5" : "absolute right-2.5 top-1/2 -translate-y-1/2")}>
                <Check size={10} strokeWidth={4} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Dòng nhỏ báo dữ liệu đã được lưu trên máy, để bạn yên tâm thoát ra rồi quay lại. */
export function DaLuuTam({ daSua }: { daSua: boolean }) {
  return (
    <p role="status" aria-live="polite" className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-chu-phu">
      <CloudCheck size={15} className={daSua ? "text-luc" : "text-chu-phu"} />
      {daSua ? "Đã lưu tạm trên máy này" : "Tự lưu ngay khi bạn nhập"}
    </p>
  );
}

/** Tiêu đề lớn của bước + mô tả ngắn. */
export function TieuDeBuoc({ tieuDe, moTa, phai }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[24px] leading-tight font-extrabold text-muc">{tieuDe}</h2>
        {phai}
      </div>
      {moTa && <p className="text-[14px] text-chu-phu mt-1">{moTa}</p>}
    </div>
  );
}
