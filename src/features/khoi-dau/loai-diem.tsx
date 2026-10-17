// Phân biệt 4 loại điểm bằng nhãn + màu cố định, để học sinh không trộn điểm thi thử với điểm mục tiêu, thi thật, học bạ.
// Dùng chung cho Bước 2 (Khởi đầu), màn Điểm thi thử, và các màn khác nếu muốn.
import { Info } from "lucide-react";
import { Nhan, gop } from "@/components/ui/nut-the";
import { THUAT_NGU } from "@/noi-dung/du-bao";
import type { ToneTen } from "@/state/types";

export type LoaiDiem = "thiThu" | "mucTieu" | "thiThat" | "hocBa";

export const LOAI_DIEM: Record<LoaiDiem, { tone: ToneTen; ten: string; nghia: string }> = {
  thiThu: { tone: "xanh", ten: THUAT_NGU.diemThiThu.ten, nghia: THUAT_NGU.diemThiThu.nghia },
  mucTieu: { tone: "tim", ten: THUAT_NGU.diemMucTieu.ten, nghia: THUAT_NGU.diemMucTieu.nghia },
  thiThat: { tone: "luc", ten: THUAT_NGU.diemThiThat.ten, nghia: THUAT_NGU.diemThiThat.nghia },
  hocBa: { tone: "cam", ten: THUAT_NGU.diemHocBa.ten, nghia: THUAT_NGU.diemHocBa.nghia },
};

export function NhanLoaiDiem({ loai, className }: { loai: LoaiDiem; className?: string }) {
  const l = LOAI_DIEM[loai];
  return <Nhan tone={l.tone} className={className}>{l.ten}</Nhan>;
}

/** Hộp thu gọn "4 loại điểm khác nhau thế nào". Đóng sẵn để màn không thừa chữ. */
export function ChuThichLoaiDiem({ cacLoai = ["thiThu", "mucTieu", "thiThat", "hocBa"] }: { cacLoai?: LoaiDiem[] }) {
  return (
    <details className="rounded-xl border border-vien bg-trang px-3 group">
      <summary className="min-h-11 flex items-center gap-2 text-[13px] font-semibold text-chu-phu cursor-pointer list-none">
        <Info size={16} className="text-xanh shrink-0" />Các loại điểm khác nhau thế nào?
      </summary>
      <dl className="pb-3 space-y-2">
        {cacLoai.map((k) => (
          <div key={k} className="flex items-start gap-2">
            <dt className="shrink-0 w-[92px]"><NhanLoaiDiem loai={k} /></dt>
            <dd className="text-[13px] leading-snug text-chu">{LOAI_DIEM[k].nghia}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Thanh tiến độ: "Đã nhập n/m" và "Hoàn thành x%" (x% chỉ là phần ô đã nhập, không phải khả năng nào cả). Tôn trọng giảm chuyển động. */
export function TienDoDiem({ co, tong, nhan }: { co: number; tong: number; nhan: string }) {
  const pt = tong === 0 ? 0 : Math.round((co / tong) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-bold text-muc">{nhan} {co}/{tong}</span>
        <span className={gop("font-semibold", pt === 100 ? "text-luc-chu" : "text-xanh")}>Hoàn thành {pt}%</span>
      </div>
      <div role="progressbar" aria-label={nhan} aria-valuemin={0} aria-valuemax={tong} aria-valuenow={co} aria-valuetext={`${nhan} ${co} trên ${tong} môn`}
        className="mt-1.5 h-2 rounded-full bg-vien overflow-hidden">
        <div className={gop("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", pt === 100 ? "bg-luc" : "bg-xanh")} style={{ width: `${pt}%` }} />
      </div>
    </div>
  );
}
