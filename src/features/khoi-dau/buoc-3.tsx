import { Briefcase, ChartColumn, House, MapPin, Plane, Wallet } from "lucide-react";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import type { HoSo } from "@/state/types";
import { CHO_O, HOC_XA_NHA, KHU_VUC, NGAN_SACH, VIEC_LAM } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import { goiYHocPhi } from "./tinh-toan";

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void };

export default function Buoc3({ h, sua }: P) {
  const goiY = goiYHocPhi(h.nganSach, h.choO);
  return (
    <>
      <TieuDeBuoc tieuDe="Mục tiêu & ưu tiên" />

      <CauHoi tieuDe="Học phí gia đình có thể chi mỗi năm" icon={Wallet}>
        <ChonO nhan="Mức học phí mỗi năm" cot={2} cacLua={NGAN_SACH} giaTri={h.nganSach} onChange={(v) => sua({ nganSach: v })} />
      </CauHoi>

      <CauHoi tieuDe="Chỗ ở dự kiến" icon={House}>
        <ChonO nhan="Chỗ ở dự kiến" cot={3} cacLua={CHO_O} giaTri={h.choO} onChange={(v) => sua({ choO: v })} />
      </CauHoi>

      <CauHoi tieuDe="Khu vực ưu tiên" icon={MapPin}>
        <ChonO nhan="Khu vực ưu tiên" nhieu cot={3} cacLua={KHU_VUC.map((x) => ({ gia: x, nhan: x }))} giaTri={h.khuVuc} onChange={(v) => sua({ khuVuc: v })} />
      </CauHoi>

      <CauHoi tieuDe="Em có sẵn sàng học xa nhà?" icon={Plane}>
        <ChonO nhan="Sẵn sàng học xa nhà" cot={2} cacLua={HOC_XA_NHA} giaTri={h.hocXaNha} onChange={(v) => sua({ hocXaNha: v })} />
      </CauHoi>

      <CauHoi tieuDe="Em quan tâm việc làm sau khi ra trường?" icon={Briefcase}>
        <ChonO nhan="Mức quan tâm việc làm" cot={3} cacLua={VIEC_LAM} giaTri={h.quanTamViecLam} onChange={(v) => sua({ quanTamViecLam: v })} />
      </CauHoi>

      {goiY && (
        <div aria-live="polite" className="rounded-the p-3 flex gap-3 items-center bg-luc-nhat border border-luc/30">
          <BieuTuongTron icon={ChartColumn} tone="luc" kichThuoc={36} />
          <div className="min-w-0 text-[13px] text-chu">
            <span className="text-chu-phu font-medium">Học phí khuyến nghị: </span>
            <b className="text-[15px] font-bold text-luc-chu">{goiY.khoang}</b>
            {goiY.ghiChu && <p className="mt-0.5 text-[12px] text-chu-phu">{goiY.ghiChu}</p>}
          </div>
        </div>
      )}
    </>
  );
}
