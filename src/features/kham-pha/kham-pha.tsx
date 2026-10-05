import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ChevronDown, PencilLine, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut, gop } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { CAC_KHU_VUC, CAC_NHOM, dem, loc } from "./bo-loc";
import { useBoLoc } from "./dung-bo-loc";
import { CAC_KIEU_SAP_XEP, boiCanhTu, danhGia, sapXep, type KieuSapXep } from "./phu-hop";
import { GhiChuDuLieuMau, TheKhamPha } from "./thanh-phan";
import { NutTuVan } from "@/features/tu-van/tu-van";

export default function KhamPha() {
  const nav = useNavigate();
  const { s } = useApp();
  const [b, sua, datLai] = useBoLoc(CAC_KHU_VUC.includes(s.hoSo.khuVuc[0]) ? s.hoSo.khuVuc[0] : undefined);
  const [tuKhoa, setTuKhoa] = useState("");
  const [kieu, setKieu] = useState<KieuSapXep>("phuHop");
  const bc = useMemo(() => boiCanhTu(s), [s]);

  const ds = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase();
    const daLoc = loc(LUA_CHON_MAU, b, bc.tinh || undefined)
      .filter((l) => !k || `${l.truong} ${l.tenTruong} ${l.nganh} ${l.nhomNganh}`.toLowerCase().includes(k));
    return sapXep(daLoc, kieu, bc).map((l) => ({ l, kq: danhGia(l, bc) }));
  }, [b, tuKhoa, kieu, bc]);

  const soLoc = dem(b);
  const nhomChip = [{ gia: "", nhan: "Tất cả" }, ...CAC_NHOM.map((n) => ({ gia: n, nhan: n }))];

  return (
    <>
      <DauTrangChinh tieuDe="Khám phá" moTa="Những hướng đi hợp với điểm, sở thích và ngân sách của em." />
      <NoiDung>
        <NutTuVan nguCanh="Khám phá ngành học" />
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
          <input type="search" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành"
            className="w-full min-h-12 rounded-xl border border-vien bg-trang pl-10 pr-12 text-[15px] focus:border-xanh [&::-webkit-search-cancel-button]:hidden" />
          {tuKhoa && (
            <button type="button" onClick={() => setTuKhoa("")} aria-label="Xóa ô tìm" className="absolute right-0.5 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full text-chu-phu">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 min-w-0 overflow-x-auto an-thanh-cuon -ml-4 pl-4" role="group" aria-label="Nhóm ngành">
            <div className="flex gap-2 w-max pr-1">
              {nhomChip.map((c) => {
                const chon = b.nhom === c.gia;
                return (
                  <button key={c.gia || "tat-ca"} type="button" aria-pressed={chon} onClick={() => sua({ nhom: c.gia })}
                    className={gop("min-h-11 px-3.5 rounded-xl border text-[14px] font-semibold whitespace-nowrap transition-colors",
                      chon ? "gd-xanh text-white border-transparent shadow-nut" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                    {c.nhan}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={() => nav(DUONG_DAN.boLoc())} aria-label={soLoc ? `Bộ lọc, đang bật ${soLoc}` : "Bộ lọc"}
            className="min-h-11 px-3 rounded-xl bg-trang border border-xanh text-[14px] font-bold text-xanh inline-flex items-center gap-1.5 shrink-0 active:bg-xanh-nhat">
            <SlidersHorizontal size={16} />Bộ lọc
            {soLoc > 0 && <span className="min-w-5 h-5 px-1 rounded-full gd-xanh text-white text-[11px] grid place-items-center">{soLoc}</span>}
          </button>
        </div>

        {bc.tong === null && (
          <DongThongBao tone="xanh" icon={PencilLine} tieuDe="Nhập điểm để biết mức phù hợp"
            moTa="Em chưa nhập đủ điểm Toán, Lý, Anh. Có điểm, mình sẽ so với điểm tham khảo của từng trường."
            hanhDong="Nhập điểm ngay" onClick={() => nav(DUONG_DAN.batDau(2))} />
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-[14px] text-chu-phu" aria-live="polite">Có <b className="text-muc">{ds.length}</b> trường phù hợp</p>
          <label className="relative inline-flex items-center gap-1 min-h-11 pl-2 pr-1 rounded-xl text-[13px] font-bold text-xanh active:bg-xanh-nhat">
            <ArrowUpDown size={15} aria-hidden />
            <span className="sr-only">Sắp xếp theo</span>
            <select value={kieu} onChange={(e) => setKieu(e.target.value as KieuSapXep)} className="appearance-none bg-transparent min-h-11 pr-5 font-bold text-xanh focus:outline-none">
              {CAC_KIEU_SAP_XEP.map((k) => <option key={k.gia} value={k.gia}>{k.nhan}</option>)}
            </select>
            <ChevronDown size={15} className="absolute right-1 pointer-events-none" aria-hidden />
          </label>
        </div>

        <GhiChuDuLieuMau />

        {ds.length === 0 ? (
          <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Chưa có trường nào khớp"
            moTa={tuKhoa ? `Không tìm thấy “${tuKhoa.trim()}” trong các tiêu chí đang chọn. Thử từ khác hoặc nới bộ lọc nhé.` : "Thử nới bớt các tiêu chí lọc nhé."}>
            <div className="space-y-2">
              <Nut kieu="nhe" onClick={() => { datLai(); setTuKhoa(""); }}>Xóa bộ lọc và từ khóa</Nut>
              <Nut kieu="vien" onClick={() => nav(DUONG_DAN.boLoc())}>Chỉnh bộ lọc</Nut>
            </div>
          </TrangThaiTrong>
        ) : (
          <ul className="space-y-3">
            {ds.map(({ l, kq }) => <li key={l.id}><TheKhamPha l={l} kq={kq} onClick={() => nav(DUONG_DAN.chiTiet(l.id))} /></li>)}
          </ul>
        )}
      </NoiDung>
    </>
  );
}
