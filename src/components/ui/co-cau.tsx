import type { NhanNguyenVong, ToneTen } from "@/state/types";
import { Nhan, TONE_GD, gop } from "./nut-the";

/** Màu cố định cho 4 nhãn nguyện vọng trên toàn ứng dụng. */
export const TONE_NHAN: Record<NhanNguyenVong, ToneTen> = { "Thử sức": "tim", "Vừa sức": "xanh", "An toàn": "luc", "Dự phòng": "cam" };
export const CAC_NHAN: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];

export function NhanNguyenVongTag({ nhan }: { nhan: NhanNguyenVong }) {
  return <Nhan tone={TONE_NHAN[nhan]}>{nhan}</Nhan>;
}

/** Thanh chia 4 phần theo số lượng từng nhãn, kèm số và phần trăm bên dưới. */
export function ThanhCoCau({ dem }: { dem: Record<NhanNguyenVong, number> }) {
  const tong = CAC_NHAN.reduce((s, n) => s + dem[n], 0);
  return (
    <div>
      <div className="flex h-11 rounded-xl overflow-hidden gap-0.5" role="img" aria-label={CAC_NHAN.map((n) => `${n} ${dem[n]}`).join(", ")}>
        {CAC_NHAN.filter((n) => dem[n] > 0).map((n) => (
          <div key={n} className={gop("grid place-items-center text-white font-extrabold text-[16px]", TONE_GD[TONE_NHAN[n]])} style={{ flex: dem[n] }}>{dem[n]}</div>
        ))}
        {tong === 0 && <div className="flex-1 bg-vien" />}
      </div>
      <div className="grid grid-cols-4 mt-1.5 text-center text-[12px] text-chu-phu">
        {CAC_NHAN.map((n) => <span key={n}>{n}<br /><b className="text-chu">{tong ? Math.round((dem[n] / tong) * 100) : 0}%</b></span>)}
      </div>
    </div>
  );
}
