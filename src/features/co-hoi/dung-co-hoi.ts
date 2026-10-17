// Hook dùng chung cho hai màn của slice: điểm hiện tại của em và phép tính chạy lúc rảnh (có trạng thái đang tính / lỗi).
import { useEffect, useMemo, useState } from "react";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { namTuyenSinhToi } from "@/engine/du-bao-diem-chuan";
import { tinhKhiRanh } from "@/engine/ban-do-co-hoi";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import type { DiemDayDu } from "@/state/types";

/** Điểm đủ các môn hiện tại của em (thi thật > thi thử > hồ sơ, đã gồm điểm ưu tiên). Không bao giờ ghi ngược. */
export function useDiemEm(): { diem: DiemDayDu; khoa: string } {
  const { s } = useApp();
  const diem = useMemo(() => diemDayDu(s), [s]);
  return { diem, khoa: JSON.stringify(diem) + LUA_CHON_MAU.length };
}

export type KetQuaTinh<T> = { trang: "tinh" } | { trang: "loi"; moTa: string } | { trang: "xong"; kq: T; ms: number };

/** Chạy `tinh` lúc rảnh mỗi khi `khoa` đổi; trả "tinh" ngay để màn vẽ khung chờ. `thuLai` chạy lại khi lỗi. */
export function useTinhLucRanh<T>(khoa: string, tinh: () => T): [KetQuaTinh<T>, () => void] {
  const [kq, setKq] = useState<KetQuaTinh<T>>({ trang: "tinh" });
  const [lan, setLan] = useState(0);
  useEffect(() => {
    let con = true;
    setKq({ trang: "tinh" });
    const t0 = performance.now();
    const t = tinhKhiRanh(tinh);
    t.xong.then((r) => { if (con) setKq({ trang: "xong", kq: r, ms: performance.now() - t0 }); })
      .catch((e) => { if (con) setKq({ trang: "loi", moTa: e instanceof Error ? e.message : "Không rõ nguyên nhân." }); });
    return () => { con = false; t.huy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, lan]);
  return [kq, () => setLan((x) => x + 1)];
}

export const namDuBaoHienTai = () => namTuyenSinhToi();
