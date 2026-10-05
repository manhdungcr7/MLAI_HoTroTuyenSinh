import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { DongThongBao } from "@/components/ui/thong-bao";
import { ChonNhanh } from "@/components/ui/nhap-lieu";
import { Nut } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { TheLuaChon } from "@/components/ui/the-lua-chon";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { MUC_THU_TU, dem, loc } from "./bo-loc";
import { useBoLoc } from "./dung-bo-loc";

const NHOM = ["Tất cả", ...new Set(LUA_CHON_MAU.map((l) => l.nhomNganh))];

export default function KhamPha() {
  const nav = useNavigate();
  const { s } = useApp();
  const [b, , datLai] = useBoLoc(s.hoSo.khuVuc[0]);
  const [tuKhoa, setTuKhoa] = useState("");
  const [nhom, setNhom] = useState("Tất cả");
  const ds = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase();
    return loc(LUA_CHON_MAU, b, s.hoSo.hocXaNha === false ? s.hoSo.tinh : undefined)
      .filter((l) => (nhom === "Tất cả" || l.nhomNganh === nhom) && (!k || `${l.truong} ${l.tenTruong} ${l.nganh}`.toLowerCase().includes(k)))
      .sort((x, y) => MUC_THU_TU[x.mucPhuHop] - MUC_THU_TU[y.mucPhuHop]);
  }, [b, tuKhoa, nhom, s.hoSo.hocXaNha, s.hoSo.tinh]);
  const so = dem(b);
  return (
    <>
      <DauTrangChinh tieuDe="Danh sách gợi ý" moTa="Dựa trên ngành, điểm và mức học phí của em." />
      <NoiDung>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu" />
          <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành"
            className="w-full min-h-12 rounded-xl border border-vien bg-trang pl-10 pr-3 text-[15px] focus:border-xanh" />
        </div>
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0 overflow-x-auto an-thanh-cuon -mx-1 px-1">
            <div className="flex gap-2 w-max"><ChonNhanh cacLua={NHOM.map((x) => ({ gia: x, nhan: x }))} giaTri={nhom} onChange={setNhom} /></div>
          </div>
          <button type="button" onClick={() => nav(DUONG_DAN.boLoc())} className="min-h-11 px-3 rounded-xl bg-trang border border-xanh text-[14px] font-bold text-xanh inline-flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal size={16} />Bộ lọc{so > 0 && <span className="size-5 rounded-full gd-xanh text-white text-[11px] grid place-items-center">{so}</span>}
          </button>
        </div>
        <p className="text-[13px] text-chu-phu">Có <b className="text-muc">{ds.length}</b> hướng đi phù hợp</p>
        <DongThongBao tone="cam" tieuDe="Số liệu trường và ngành là dữ liệu mẫu" moTa="Chưa được kiểm chứng, dùng để dựng giao diện. Dữ liệu thật có nguồn sẽ thay sau." />
        {ds.length === 0 ? (
          <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Chưa có hướng đi nào khớp" moTa="Thử nới bớt các tiêu chí lọc nhé.">
            <Nut kieu="nhe" onClick={() => { datLai(); setTuKhoa(""); setNhom("Tất cả"); }}>Xóa bộ lọc</Nut>
          </TrangThaiTrong>
        ) : ds.map((l) => <TheLuaChon key={l.id} l={l} onClick={() => nav(DUONG_DAN.chiTiet(l.id))} />)}
      </NoiDung>
    </>
  );
}
