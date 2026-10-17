// Thành phần giao diện dùng riêng trong slice Mục tiêu.
import { useEffect, useState } from "react";
import { Atom, BookOpenText, FlaskConical, Languages, Leaf, Sigma, type LucideIcon } from "lucide-react";
import { TONE_GD, gop } from "@/components/ui/nut-the";
import { giamChuyenDong, useHienKhiVaoMan } from "@/components/ui/thiet-ke/chuyen-dong";
import type { MonId, ToneTen } from "@/state/types";
import type { MucCongSuc, NhanMon } from "./tinh-toan";
import { TEN_CONG_SUC } from "./tinh-toan";

export const ICON_MON: Record<MonId, LucideIcon> = {
  toan: Sigma, vatLy: Atom, hoaHoc: FlaskConical, sinh: Leaf, nguVan: BookOpenText, tiengAnh: Languages,
};
export const TONE_MON: Record<MonId, ToneTen> = {
  toan: "xanh", vatLy: "tim", hoaHoc: "do", sinh: "luc", nguVan: "muc", tiengAnh: "cam",
};

/** Màu theo nhãn: Nên ưu tiên đỏ, Dễ tăng cam, Giữ vững lục (thanh tiến độ, nhãn, ô đề xuất). */
export const TONE_NHAN: Record<NhanMon, ToneTen> = { "Nên ưu tiên": "do", "Dễ tăng": "cam", "Giữ vững": "luc" };
const TONE_CONG_SUC: Record<MucCongSuc, string> = { thap: "bg-luc", vua: "bg-cam", cao: "bg-do" };
const SO_NAC: Record<MucCongSuc, number> = { thap: 1, vua: 2, cao: 3 };

/** Thang 3 nấc công sức: Thấp ▮▯▯ · Vừa ▮▮▯ · Cao ▮▮▮. */
export function ThangCongSuc({ muc }: { muc: MucCongSuc }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => <span key={i} className={gop("h-2.5 w-4 rounded-sm", i <= SO_NAC[muc] ? TONE_CONG_SUC[muc] : "bg-vien")} />)}
      </span>
      <b className="text-[14px] text-chu">{TEN_CONG_SUC[muc]}</b>
    </span>
  );
}

/** Thanh tiến độ mục tiêu. Nhãn nổi được kẹp trong vùng thanh: sát mép trái canh trái, sát mép phải canh phải, không tràn ra thẻ. */
export function ThanhMucTieu({ phanTram, tong = "xanh", nhanNoi, nhan }: { phanTram: number; tong?: "xanh" | "luc"; nhanNoi: string; nhan: string }) {
  const [ref, hien] = useHienKhiVaoMan<HTMLDivElement>(0.3);
  const [chay, setChay] = useState(giamChuyenDong());
  useEffect(() => {
    if (!hien) return;
    const r = requestAnimationFrame(() => setChay(true));
    return () => cancelAnimationFrame(r);
  }, [hien]);
  const p = Math.min(100, Math.max(0, phanTram));
  const hienTai = chay ? p : 0;
  const canhPhai = p >= 80, canhTrai = p <= 20;
  return (
    <div ref={ref} className="relative pt-7">
      {p > 0 && (
        <span aria-hidden
          className={gop("tg-thanh absolute top-0 rounded-full bg-muc px-2 py-0.5 text-[13px] font-bold text-white whitespace-nowrap", canhPhai ? "right-0" : canhTrai ? "left-0" : "-translate-x-1/2")}
          style={canhPhai || canhTrai ? undefined : { left: `${hienTai}%` }}>{nhanNoi}</span>
      )}
      <div className="h-2.5 w-full rounded-full bg-vien/70 overflow-hidden" role="progressbar" aria-label={nhan}
        aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${Math.round(p)} phần trăm`}>
        <div className={gop("tg-thanh h-full rounded-full", `gd-thanh-${tong}`)} style={{ width: `${hienTai}%` }} />
      </div>
    </div>
  );
}

/** Ô vuông bo góc chứa biểu tượng môn. */
export function BieuTuongMon({ mon, kichThuoc = 40 }: { mon: MonId; kichThuoc?: number }) {
  const Icon = ICON_MON[mon];
  return (
    <span aria-hidden className={gop("rounded-xl grid place-items-center text-white shrink-0", TONE_GD[TONE_MON[mon]])} style={{ width: kichThuoc, height: kichThuoc }}>
      <Icon size={Math.round(kichThuoc * 0.5)} strokeWidth={2.2} />
    </span>
  );
}
