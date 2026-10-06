import { Briefcase, ChartColumn, House, MapPin, NotebookPen, Plane, Route, Wallet } from "lucide-react";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import type { HoSo } from "@/state/types";
import { CHO_O, CON_DUONG, HOC_XA_NHA, KHU_VUC, NGAN_SACH, TOI_DA_GHI_CHU, VIEC_LAM } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import { demVuaNganSach, goiYHocPhi } from "./tinh-toan";

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void };

export default function Buoc3({ h, sua }: P) {
  const goiY = goiYHocPhi(h.nganSach, h.choO);
  const soVua = h.nganSach ? demVuaNganSach(h.nganSach, LUA_CHON_MAU) : 0;
  const conLai = TOI_DA_GHI_CHU - h.ghiChuChiPhi.length;
  return (
    <>
      <TieuDeBuoc tieuDe="Mục tiêu & ưu tiên" moTa="Chia sẻ điều kiện gia đình và mong muốn của em để gợi ý sát thực tế hơn." />

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

      <CauHoi tieuDe="Con đường em muốn đi" icon={Route}>
        <ChonO nhan="Con đường học tập" kieu="o" cot={3} cacLua={CON_DUONG} giaTri={h.conDuong} onChange={(v) => sua({ conDuong: v })} />
      </CauHoi>

      <div className="space-y-1.5">
        <label htmlFor="bd-ghi-chu" className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <NotebookPen size={18} className="text-xanh" />Ghi chú chi phí khác
          <span className="ml-auto text-[12px] font-semibold text-chu-phu">Không bắt buộc</span>
        </label>
        <div className="rounded-xl border border-vien bg-trang focus-within:border-xanh">
          <textarea id="bd-ghi-chu" rows={3} maxLength={TOI_DA_GHI_CHU} value={h.ghiChuChiPhi}
            onChange={(e) => sua({ ghiChuChiPhi: e.target.value.slice(0, TOI_DA_GHI_CHU) })} aria-describedby="bd-dem-ghi-chu"
            placeholder="Ví dụ: đi lại, sinh hoạt phí gia đình có thể hỗ trợ thêm mỗi tháng…"
            className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[15px] text-chu placeholder:text-chu-phu/70 outline-none" />
          <p id="bd-dem-ghi-chu" className={gop("px-3 pb-2 text-right text-[12px] font-semibold", conLai <= 20 ? "text-cam-chu" : "text-chu-phu")}>
            {h.ghiChuChiPhi.length}/{TOI_DA_GHI_CHU}
          </p>
        </div>
      </div>

      <div aria-live="polite" className={gop("rounded-the p-3.5 flex gap-3 items-start", goiY ? "bg-luc-nhat" : "bg-xanh-nhat")}>
        <BieuTuongTron icon={ChartColumn} tone={goiY ? "luc" : "xanh"} kichThuoc={40} />
        {goiY ? (
          <div className="min-w-0 text-[13px] text-chu">
            <p>Với ngân sách hiện tại, nên ưu tiên trường có học phí</p>
            <p className="text-[16px] font-extrabold text-luc-chu leading-snug">{goiY.khoang}</p>
            {goiY.ghiChu && <p className="mt-1">{goiY.ghiChu}</p>}
            <p className="mt-1 text-chu-phu">
              {soVua > 0 ? `${soVua}/${LUA_CHON_MAU.length} lựa chọn có học phí vừa mức này (chỉ tính ngành đã có học phí).` : "Chưa có ngành nào có học phí vừa mức này."}
              {" "}Nhiều ngành chưa có học phí, em xem thêm trên trang của trường.
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-chu pt-0.5"><b className="block text-[15px] text-muc">Gợi ý học phí</b>Chọn mức học phí ở trên, mình sẽ gợi ý khoảng học phí nên ưu tiên cho em.</p>
        )}
      </div>
    </>
  );
}
