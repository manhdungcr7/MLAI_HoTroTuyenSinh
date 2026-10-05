import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap, MapPin } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { ChonNhanh, OChon, OTich, Truong } from "@/components/ui/nhap-lieu";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { BO_LOC_MAC_DINH, loc } from "./bo-loc";
import { useBoLoc } from "./dung-bo-loc";
import { useApp } from "@/state/store";

const NGANH = [...new Set(LUA_CHON_MAU.map((l) => l.nganh))];
const KHU_VUC = [...new Set(LUA_CHON_MAU.map((l) => l.khuVuc))];

export default function ManBoLoc() {
  const nav = useNavigate();
  const { s } = useApp();
  const [b, sua, datLai] = useBoLoc(s.hoSo.khuVuc[0]);
  const soKq = loc(LUA_CHON_MAU, b, s.hoSo.hocXaNha === false ? s.hoSo.tinh : undefined).length;
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Bộ lọc" quayLai={DUONG_DAN.khamPha()} />
      <NoiDung className="space-y-5">
        <p className="text-[14px] text-chu-phu -mt-1">Chỉnh các tiêu chí để nhận gợi ý đúng với mong muốn của em.</p>

        <section className="rounded-2xl bg-trang border border-vien p-4 space-y-3">
          <p className="text-[14px] font-bold text-chu">Điểm thi của em khoảng bao nhiêu? <span className="text-xanh">{b.diemTu} – {b.diemDen}</span> <span className="text-chu-phu font-normal">/ 30</span></p>
          <label className="block text-[13px] text-chu-phu">Thấp nhất: {b.diemTu}
            <input type="range" min={0} max={30} step={0.5} value={b.diemTu} onChange={(e) => sua({ diemTu: Math.min(Number(e.target.value), b.diemDen) })} className="w-full accent-xanh h-8" />
          </label>
          <label className="block text-[13px] text-chu-phu">Cao nhất: {b.diemDen}
            <input type="range" min={0} max={30} step={0.5} value={b.diemDen} onChange={(e) => sua({ diemDen: Math.max(Number(e.target.value), b.diemTu) })} className="w-full accent-xanh h-8" />
          </label>
        </section>

        <Truong nhan="Học phí mỗi năm">
          <ChonNhanh cot={2} cacLua={[{ gia: "tatCa", nhan: "Tất cả" }, { gia: "duoi20", nhan: "Dưới 20 triệu" }, { gia: "20-40", nhan: "20 – 40 triệu" }, { gia: "tren40", nhan: "Trên 40 triệu" }]} giaTri={b.hocPhi} onChange={(v) => sua({ hocPhi: v })} />
        </Truong>
        <Truong nhan="Nơi em muốn học">
          <OChon bieuTuong={MapPin} value={b.khuVuc} onChange={(e) => sua({ khuVuc: e.target.value })}><option value="">Tất cả khu vực</option>{KHU_VUC.map((k) => <option key={k}>{k}</option>)}</OChon>
        </Truong>
        <Truong nhan="Ngành em quan tâm">
          <OChon bieuTuong={Briefcase} value={b.nganh} onChange={(e) => sua({ nganh: e.target.value })}><option value="">Tất cả ngành</option>{NGANH.map((k) => <option key={k}>{k}</option>)}</OChon>
        </Truong>
        <Truong nhan="Em có sẵn sàng học xa nhà không?">
          <ChonNhanh cot={3} cacLua={[{ gia: "khong", nhan: "Không" }, { gia: "co", nhan: "Có" }, { gia: "tuyTruongHop", nhan: "Tùy trường" }]} giaTri={b.hocXa} onChange={(v) => sua({ hocXa: v })} />
        </Truong>
        <Truong nhan="Loại hình đào tạo">
          <div className="flex gap-4 flex-wrap">
            <OTich nhan="Đại học" dang={b.bac.daiHoc} onChange={(v) => sua({ bac: { ...b.bac, daiHoc: v } })} />
            <OTich nhan="Cao đẳng" dang={b.bac.caoDang} onChange={(v) => sua({ bac: { ...b.bac, caoDang: v } })} />
          </div>
        </Truong>
        <div className="space-y-2 pt-1">
          <Nut bieuTuong={GraduationCap} onClick={() => nav(DUONG_DAN.khamPha())}>Xem {soKq} kết quả</Nut>
          <Nut kieu="vien" onClick={datLai} disabled={JSON.stringify(b) === JSON.stringify({ ...BO_LOC_MAC_DINH, khuVuc: b.khuVuc && "" })}>Đặt lại bộ lọc</Nut>
        </div>
      </NoiDung>
    </>
  );
}
