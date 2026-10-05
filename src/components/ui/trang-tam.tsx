import { Hammer } from "lucide-react";
import { DauTrangChinh, DauTrangCoQuayLai, NoiDung, ThanhPhuKeHoach } from "@/components/layout/khung";
import { TrangThaiTrong } from "./hien-thi";

/**
 * Trang tạm cho route chưa được slice nào làm xong. Slice thay bằng trang thật, giữ nguyên route.
 * goc: trang gốc của tab (dùng DauTrangChinh). phuKeHoach: thêm thanh 3 mục của tab Kế hoạch.
 */
export function TrangTam({ tieuDe, man, slice, goc, phuKeHoach }: { tieuDe: string; man: string; slice: string; goc?: boolean; phuKeHoach?: boolean }) {
  return (
    <>
      {goc ? <DauTrangChinh tieuDe={tieuDe} /> : <DauTrangCoQuayLai tieuDe={tieuDe} />}
      {phuKeHoach && <ThanhPhuKeHoach />}
      <NoiDung>
        <TrangThaiTrong bieuTuong={<Hammer size={26} />} tieuDe="Màn này đang được xây" moTa={`${man} · phần của nhóm ${slice}.`} />
      </NoiDung>
    </>
  );
}
