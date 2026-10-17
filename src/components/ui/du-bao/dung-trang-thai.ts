import { useMemo } from "react";
import { namTuyenSinhToi } from "@/engine/du-bao-diem-chuan";
import { phanLoaiDuLieu, type TrangThaiDuLieu } from "@/engine/trang-thai-du-lieu";
import { thongKeChung } from "@/features/kham-pha/du-bao";
import type { LuaChon } from "@/state/types";

/** Trạng thái dữ liệu + dự báo của một chương trình, tính một lần cho mỗi lựa chọn. */
export function useTrangThaiDuLieu(lc: LuaChon): TrangThaiDuLieu {
  return useMemo(() => phanLoaiDuLieu(lc, thongKeChung(), namTuyenSinhToi()), [lc]);
}
