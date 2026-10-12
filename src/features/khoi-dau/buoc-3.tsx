import { Briefcase, ChartColumn, House, MapPin, Plane, Wallet } from "lucide-react";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import type { HoSo } from "@/state/types";
import { CHO_O, HOC_XA_NHA, KHU_VUC, NGAN_SACH, VIEC_LAM } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import { demVuaNganSach, goiYHocPhi } from "./tinh-toan";

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void };

export default function Buoc3({ h, sua }: P) {
  const goiY = goiYHocPhi(h.nganSach, h.choO);
  const soVua = h.nganSach ? demVuaNganSach(h.nganSach, LUA_CHON_MAU) : 0;
  return (
    <>
      <TieuDeBuoc tieuDe="Mục tiêu & ưu tiên" moTa="Điều kiện gia đình và mong muốn của em." />

      <CauHoi tieuDe="Học phí gia đình có thể chi mỗi năm" icon={Wallet}>
        <ChonO nhan="Mức học phí mỗi năm" cot={2} cacLua={NGAN_SACH} giaTri={h.nganSach} onChange={(v) => sua({ nganSach: v })} />
      </CauHoi>

      <CauHoi tieuDe="Chỗ ở dự kiến" icon={House}>
        <ChonO nhan="Chỗ ở dự kiến" kieu="o" cot={3} cacLua={CHO_O} giaTri={h.choO} onChange={(v) => sua({ choO: v })} />
      </CauHoi>

      <CauHoi tieuDe="Khu vực ưu tiên" icon={MapPin} phu="chọn 1 hoặc nhiều">
        <ChonO nhan="Khu vực ưu tiên" nhieu cacLua={KHU_VUC.map((x) => ({ gia: x, nhan: x }))} giaTri={h.khuVuc} onChange={(v) => sua({ khuVuc: v })} />
      </CauHoi>

      <CauHoi tieuDe="Em có sẵn sàng học xa nhà?" icon={Plane}>
        <ChonO nhan="Sẵn sàng học xa nhà" cot={2} cacLua={HOC_XA_NHA} giaTri={h.hocXaNha} onChange={(v) => sua({ hocXaNha: v })} />
      </CauHoi>

      <CauHoi tieuDe="Em quan tâm việc làm sau khi ra trường?" icon={Briefcase}>
        <ChonO nhan="Mức quan tâm việc làm" cot={3} cacLua={VIEC_LAM} giaTri={h.quanTamViecLam} onChange={(v) => sua({ quanTamViecLam: v })} />
      </CauHoi>

      <div aria-live="polite" className={gop("rounded-the p-3.5 flex gap-3 items-start", goiY ? "bg-luc-nhat" : "bg-xanh-nhat")}>
        <BieuTuongTron icon={ChartColumn} tone={goiY ? "luc" : "xanh"} kichThuoc={40} />
        {goiY ? (
          <div className="min-w-0 text-[13px] text-chu">
            <p>Nên ưu tiên học phí</p>
            <p className="text-[16px] font-extrabold text-luc-chu leading-snug">{goiY.khoang}</p>
            {goiY.ghiChu && <p className="mt-1">{goiY.ghiChu}</p>}
            <p className="mt-1 text-chu-phu">
              {soVua > 0 ? `${soVua}/${LUA_CHON_MAU.length} ngành đã có học phí vừa mức này.` : "Chưa có ngành nào có học phí vừa mức này."}
              {" "}Nhiều ngành chưa có học phí.
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-chu pt-0.5"><b className="block text-[15px] text-muc">Gợi ý học phí</b>Chọn mức ở trên để xem khoảng nên ưu tiên.</p>
        )}
      </div>
    </>
  );
}
