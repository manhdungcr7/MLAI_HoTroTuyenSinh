import { useMemo } from "react";
import { namTuyenSinhToi } from "@/engine/du-bao-diem-chuan";
import { apDungDuBaoML } from "@/engine/du-bao-ml-ap-dung";
import { phanLoaiDuLieu, type TrangThaiDuLieu } from "@/engine/trang-thai-du-lieu";
import { useDuBaoML } from "@/features/kham-pha/dung-du-bao-ml";
import { thongKeChung } from "@/features/kham-pha/du-bao";
import type { LuaChon } from "@/state/types";

/** Trạng thái dữ liệu + dự báo của một chương trình, tính một lần cho mỗi lựa chọn. */
export function useTrangThaiDuLieu(lc: LuaChon): TrangThaiDuLieu {
  const sanML = useDuBaoML(); // nạp khoảng dự báo của mô hình học máy rồi tính lại
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => apDungDuBaoML(phanLoaiDuLieu(lc, thongKeChung(), namTuyenSinhToi()), lc.id), [lc, sanML]);
}
