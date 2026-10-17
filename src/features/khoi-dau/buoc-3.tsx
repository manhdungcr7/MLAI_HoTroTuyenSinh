import { Briefcase, ChartColumn, House, MapPin, Plane, Target, Wallet } from "lucide-react";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import type { HoSo } from "@/state/types";
import { CHO_O, HOC_XA_NHA_CO_ICON, KHU_VUC_CO_ICON, NGAN_SACH, VIEC_LAM_CO_ICON } from "./lua-chon";
import { CauHoi, ChonO } from "./thanh-phan";
import { DauBuoc } from "./khung-buoc";
import { goiYHocPhi } from "./tinh-toan";

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void };

export default function Buoc3({ h, sua }: P) {
  const goiY = goiYHocPhi(h.nganSach, h.choO);
  const oXa = h.choO === "oTro" || h.choO === "kyTucXa";
  return (
    <>
      <DauBuoc tieuDe="Mục tiêu & ưu tiên"
        moTa="Cho mình biết thêm về định hướng của bạn. Chọn gì cũng được, bỏ trống cũng được."
        phai={<span aria-hidden className="shrink-0 size-[64px] rounded-lon gd-hero-xanh grid place-items-center"><Target size={34} className="text-xanh" strokeWidth={1.7} /></span>} />

      <CauHoi tieuDe="Học phí gia đình có thể chi mỗi năm" icon={Wallet}>
        <ChonO nhan="Mức học phí mỗi năm" cot={2} cacLua={NGAN_SACH} giaTri={h.nganSach} onChange={(v) => sua({ nganSach: v })} />
      </CauHoi>

      <CauHoi tieuDe="Chỗ ở dự kiến" icon={House}>
        <ChonO nhan="Chỗ ở dự kiến" cot={3} kieu="o" cacLua={CHO_O} giaTri={h.choO} onChange={(v) => sua({ choO: v })} />
      </CauHoi>

      <CauHoi tieuDe="Khu vực ưu tiên" icon={MapPin} phu="chọn được nhiều">
        <ChonO nhan="Khu vực ưu tiên" nhieu cot={3} cacLua={KHU_VUC_CO_ICON} giaTri={h.khuVuc} onChange={(v) => sua({ khuVuc: v })} />
      </CauHoi>

      <CauHoi tieuDe="Bạn có sẵn sàng học xa nhà?" icon={Plane}>
        <ChonO nhan="Sẵn sàng học xa nhà" cot={2} cacLua={HOC_XA_NHA_CO_ICON} giaTri={h.hocXaNha} onChange={(v) => sua({ hocXaNha: v })} />
      </CauHoi>

      <CauHoi tieuDe="Bạn quan tâm việc làm sau khi ra trường?" icon={Briefcase}>
        <ChonO nhan="Mức quan tâm việc làm" cot={3} kieu="o" cacLua={VIEC_LAM_CO_ICON} giaTri={h.quanTamViecLam} onChange={(v) => sua({ quanTamViecLam: v })} />
      </CauHoi>

      {goiY && (
        <div aria-live="polite" className="rounded-the p-3 flex gap-3 items-center bg-luc-nhat border border-luc/30">
          <BieuTuongTron icon={ChartColumn} tone="luc" kichThuoc={36} />
          <div className="min-w-0 text-[13px] leading-snug text-chu">
            <span className="text-chu-phu font-medium">Mức bạn chọn: </span>
            <b className="text-[15px] font-bold text-luc-chu">{goiY.khoang}</b>
            <p className="mt-0.5 text-[13px] text-chu-phu">
              Chương trình chưa có học phí đã đối chiếu sẽ ghi "chưa có", app không đoán.{oXa && " Bạn dự định ở trọ hoặc ký túc xá, nên nhớ tính cả tiền ở và ăn uống."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
