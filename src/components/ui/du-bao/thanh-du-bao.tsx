// Thanh dự báo: vùng tô (theo tông kết luận) = khoảng dao động, vạch = mức trung tâm, ghim = điểm của em.
// Chỉ CSS. Marker chuyển mượt khi đổi điểm; thanh "vào chỗ" lúc mở trang; cả hai tắt khi prefers-reduced-motion.
import type { DuBaoDiemChuan } from "@/engine/du-bao-diem-chuan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { gop } from "@/components/ui/nut-the";
import { MAU_CHUA_CO_DIEM, type MauKetLuan } from "./mau-ket-luan";

const kep = (x: number) => Math.min(100, Math.max(0, x));

/** Trục dùng chung cho thanh lớn và thanh nhỏ. Kẹp trong 10..30 (thang điểm); `diem` ngoài trục thì dính mép. */
export function truc(d: DuBaoDiemChuan, diem: number | null, le = 1) {
  const tu = Math.max(10, Math.floor(Math.min(d.thap, diem ?? d.thap) - le)), den = Math.min(30, Math.ceil(Math.max(d.cao, diem ?? d.cao) + le));
  return { tu, den, vt: (x: number) => kep(((x - tu) / (den - tu)) * 100) };
}

export function ThanhDuBao({ d, diem, xemThu, mau = MAU_CHUA_CO_DIEM }: { d: DuBaoDiemChuan; diem: number | null; xemThu?: boolean; mau?: MauKetLuan }) {
  const { tu, den, vt } = truc(d, diem);
  const viTriChu = diem === null ? 0 : Math.min(86, Math.max(14, vt(diem)));
  const mo = `Khoảng dự báo từ ${dinhDangDiem(d.thap)} đến ${dinhDangDiem(d.cao)} điểm, mức trung tâm ${dinhDangDiem(d.kyVong)}${diem !== null ? `, điểm ${xemThu ? "xem thử" : "của bạn"} ${dinhDangDiem(diem)}` : ""}`;
  const chamTran = d.cao >= 30;
  return (
    <div>
      <div role="img" aria-label={mo} className="relative h-[4.25rem]">
        {diem !== null && (
          <span className="absolute top-0 -translate-x-1/2 rounded-full bg-muc px-2.5 py-1 text-[13px] font-bold leading-none text-trang whitespace-nowrap tabular-nums shadow-md transition-[left] duration-200 motion-reduce:transition-none" style={{ left: `${viTriChu}%` }}>
            {xemThu ? "Thử" : "Bạn"} {dinhDangDiem(diem)}
          </span>
        )}
        <div className="absolute inset-x-0 top-[34px] h-4 rounded-full bg-vien" />
        <div className="vao-cho absolute top-[34px] h-4 rounded-full" style={{ left: `${vt(d.thap)}%`, width: `${vt(d.cao) - vt(d.thap)}%` }}>
          <span className={gop("absolute inset-0 rounded-full", mau.vung)} />
        </div>
        <div className="absolute top-[30px] h-6 w-1 -translate-x-1/2 rounded-full bg-muc" style={{ left: `${vt(d.kyVong)}%` }} />
        {diem !== null && (
          <span className={gop("absolute top-[29px] size-[26px] -translate-x-1/2 rounded-full border-4 border-trang shadow-md transition-[left] duration-200 motion-reduce:transition-none", mau.dam)} style={{ left: `${vt(diem)}%` }} />
        )}
        <span className="absolute bottom-0 left-0 text-[13px] text-chu-phu tabular-nums">{tu}</span>
        <span className="absolute bottom-0 right-0 text-[13px] text-chu-phu tabular-nums">{den}</span>
      </div>
      <dl className="mt-1 grid grid-cols-3 gap-2 text-center text-[13px]">
        <div><dt className="text-chu-phu">Thấp</dt><dd className="font-bold text-muc tabular-nums">{dinhDangDiem(d.thap)}</dd></div>
        <div><dt className="text-chu-phu">Trung tâm</dt><dd className="font-bold text-muc tabular-nums">{dinhDangDiem(d.kyVong)}</dd></div>
        <div><dt className="text-chu-phu">Cao</dt><dd className="font-bold text-muc tabular-nums">{dinhDangDiem(d.cao)}{chamTran && <span className="block text-[13px] font-normal text-chu-phu">đã chạm trần 30</span>}</dd></div>
      </dl>
    </div>
  );
}

/** Thanh nhỏ cho thẻ danh sách: một dòng, không chữ. Điểm của em (nếu có) là chấm cùng tông kết luận. */
export function MiniDuBao({ d, diem, className, mau = MAU_CHUA_CO_DIEM }: { d: DuBaoDiemChuan; diem: number | null; className?: string; mau?: MauKetLuan }) {
  const { vt } = truc(d, diem, 0.5);
  return (
    <span aria-hidden className={gop("relative block h-2.5 rounded-full bg-vien", className)}>
      <span className={gop("absolute inset-y-0 rounded-full", mau.vung)} style={{ left: `${vt(d.thap)}%`, width: `${Math.max(3, vt(d.cao) - vt(d.thap))}%` }} />
      <span className="absolute -top-0.5 h-3.5 w-0.5 bg-muc" style={{ left: `${vt(d.kyVong)}%` }} />
      {diem !== null && <span className={gop("absolute -top-[3px] size-4 -translate-x-1/2 rounded-full border-2 border-trang", mau.dam)} style={{ left: `${vt(diem)}%` }} />}
    </span>
  );
}
