// Thành phần riêng của luồng Khởi đầu: thanh bước 1-2-3, nhóm câu hỏi, ô chọn có biểu tượng.
import type { ReactNode } from "react";
import { Check, CircleAlert, CloudCheck, type LucideIcon } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import type { BuocBatDau } from "@/duong-dan";
import type { LuaChonCoIcon } from "./lua-chon";

export const TEN_BUOC: Record<BuocBatDau, string> = { 1: "Thông tin cơ bản", 2: "Điểm các môn", 3: "Mục tiêu & ưu tiên" };

/** Thanh bước 1-2-3: vòng tròn nối bằng đường kẻ. Bấm được vào bước đã qua để sửa lại. */
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
              {b > 1 && <span aria-hidden className={gop("absolute top-[17px] h-[3px] rounded-full", b <= hien ? "bg-xanh" : "bg-vien")} style={{ left: "calc(-50% + 26px)", right: "calc(50% + 26px)" }} />}
              <button type="button" disabled={b > hien} onClick={() => denBuoc(b)} aria-current={dang ? "step" : undefined}
                className="flex flex-col items-center gap-1 min-h-12 px-1 disabled:cursor-default">
                <span className={gop("relative size-9 rounded-full grid place-items-center text-[14px] font-extrabold transition-colors",
                  dang ? "gd-xanh text-white ring-4 ring-xanh/15" : xong ? "bg-xanh text-white" : "bg-trang border-2 border-vien text-chu-phu")}>
                  {xong ? <Check size={17} strokeWidth={3.2} /> : b}
                </span>
                <span className={gop("text-[12px] font-bold leading-tight text-center", dang ? "text-xanh" : xong ? "text-chu" : "text-chu-phu")}>{TEN_BUOC[b]}</span>
                {xong && <span className="sr-only">(đã qua, bấm để sửa)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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
              "relative rounded-xl border font-semibold transition-all cursor-pointer",
              kieu === "o" ? "min-h-[72px] px-2 py-2 flex flex-col items-center justify-center gap-1 text-center text-[13px] leading-tight"
                : "min-h-12 px-3 inline-flex items-center justify-center gap-1.5 text-[14px]",
              chon ? "bg-xanh-nhat border-xanh text-xanh border-[1.5px] shadow-sm font-bold" : gop("bg-trang text-chu active:bg-xanh-nhat hover:border-xanh/40", coLoi ? "border-do/60" : "border-vien"),
            )}>
            {Icon && <Icon size={kieu === "o" ? 20 : 17} className={chon ? "text-xanh" : "text-chu-phu"} />}
            <span>{c.nhan}</span>
            {chon && (
              <span className={gop("size-4 rounded-full bg-xanh text-white grid place-items-center", kieu === "o" ? "absolute top-1.5 right-1.5" : "absolute right-2.5 top-1/2 -translate-y-1/2")}>
                <Check size={10} strokeWidth={4} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Dòng nhỏ báo dữ liệu đã được lưu trên máy, để em yên tâm thoát ra rồi quay lại. */
export function DaLuuTam({ daSua }: { daSua: boolean }) {
  return (
    <p role="status" aria-live="polite" className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-chu-phu">
      <CloudCheck size={15} className={daSua ? "text-luc" : "text-chu-phu"} />
      {daSua ? "Đã lưu tạm trên máy này" : "Tự lưu ngay khi em nhập"}
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
