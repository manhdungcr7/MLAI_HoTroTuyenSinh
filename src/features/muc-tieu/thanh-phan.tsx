// Thành phần giao diện dùng riêng trong slice Mục tiêu.
import { Atom, BookOpenText, FlaskConical, Languages, Leaf, Sigma, type LucideIcon } from "lucide-react";
import { TONE_GD, gop } from "@/components/ui/nut-the";
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

/** Ô vuông bo góc chứa biểu tượng môn. */
export function BieuTuongMon({ mon, kichThuoc = 40 }: { mon: MonId; kichThuoc?: number }) {
  const Icon = ICON_MON[mon];
  return (
    <span aria-hidden className={gop("rounded-xl grid place-items-center text-white shrink-0", TONE_GD[TONE_MON[mon]])} style={{ width: kichThuoc, height: kichThuoc }}>
      <Icon size={Math.round(kichThuoc * 0.5)} strokeWidth={2.2} />
    </span>
  );
}
