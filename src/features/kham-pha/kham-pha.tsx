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
import { BO_LOC_MAC_DINH, CAC_KHU_VUC, CAC_NHOM, dem, loc } from "./bo-loc";
import { tinhCoHoi } from "./co-hoi";
import { useBoLoc } from "./dung-bo-loc";
import { CAC_KIEU_SAP_XEP, boiCanhTu, coDiemDeSo, danhGia, sapXep, type KieuSapXep } from "./phu-hop";
import { GhiChuDuLieuMau, TheKhamPha } from "./thanh-phan";
import { NutTuVan } from "@/features/tu-van/tu-van";

/** Bộ lọc gợi ý ban đầu theo hồ sơ. Nếu kết hợp "khu vực + nhóm ngành" không còn ngành nào thì bỏ bớt, không để em mở ra thấy trống. */
function boLocBanDau(khuVuc: string | undefined, nganh: string[]): [string | undefined, string | undefined] {
  const kv = khuVuc && CAC_KHU_VUC.includes(khuVuc) ? khuVuc : undefined;
  const nhom = nganh.length === 1 && CAC_NHOM.includes(nganh[0]) ? nganh[0] : undefined;
  const co = (k?: string, n?: string) => loc(LUA_CHON_MAU, { ...BO_LOC_MAC_DINH, khuVuc: k ?? "", nhom: n ?? "" }).length > 0;
  if (co(kv, nhom)) return [kv, nhom];
  if (co(undefined, nhom)) return [undefined, nhom];
  return [co(kv) ? kv : undefined, undefined];
}

export default function KhamPha() {
  const nav = useNavigate();
  const { s } = useApp();
  const [b, sua, datLai] = useBoLoc(...boLocBanDau(s.hoSo.khuVuc[0], s.hoSo.nganhQuanTam));
  const [tuKhoa, setTuKhoa] = useState("");
  const [kieu, setKieu] = useState<KieuSapXep>("phuHop");
  const [soHien, setSoHien] = useState(30);
  const bc = useMemo(() => boiCanhTu(s), [s]);

  const ds = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase();
    const daLoc = loc(LUA_CHON_MAU, b, bc.tinh || undefined)
      .filter((l) => !k || `${l.truong} ${l.tenTruong} ${l.nganh} ${l.nhomNganh}`.toLowerCase().includes(k));
    return sapXep(daLoc, kieu, bc);
  }, [b, tuKhoa, kieu, bc]);
  const coHoi = useMemo(() => tinhCoHoi(bc.diem), [bc.diem]);
  const hien = useMemo(() => ds.slice(0, soHien).map((l) => ({ l, kq: danhGia(l, bc) })), [ds, soHien, bc]);

  const soLoc = dem(b);
  const nhomChip = [{ gia: "", nhan: "Tất cả" }, ...CAC_NHOM.map((n) => ({ gia: n, nhan: n }))];

  return (
    <>
      <DauTrangChinh tieuDe="Khám phá" moTa="Những hướng đi hợp với điểm, sở thích và ngân sách của em." />
      <NoiDung>
        <NutTuVan nguCanh="Khám phá ngành học" />
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
          <input type="search" value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); if (e.target.value.trim() && b.nhom) sua({ nhom: "" }); /* tìm theo tên thì tìm trong mọi nhóm ngành */ }} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành"
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

        {coHoi && (
          <section aria-label="Cơ hội của em" className="rounded-the nen-xanh p-3.5">
            <p className="text-[13px] font-bold text-xanh">Với điểm của em</p>
            <p className="mt-0.5 text-[15px] text-chu leading-snug">
              Tổ hợp <b>{coHoi.toHop}</b> được <b>{coHoi.tong.toFixed(1).replace(".", ",")}</b> điểm: đủ điểm chuẩn năm gần nhất của <b className="text-luc-chu">{coHoi.soDuDiem}</b> ngành, thử sức thêm <b className="text-cam-chu">{coHoi.soThuSuc}</b> ngành (trong {coHoi.soNganh} ngành mình so được).
            </p>
            {coHoi.theoNhom.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Nhóm ngành nhiều cơ hội">
                {coHoi.theoNhom.slice(0, 4).map((g) => (
                  <button key={g.nhom} type="button" onClick={() => sua({ nhom: g.nhom })} className="min-h-11 px-3 rounded-xl bg-trang border border-vien text-[13px] font-semibold text-chu active:bg-xanh-nhat">
                    {g.nhom} <span className="text-chu-phu">· {g.duDiem} đủ điểm</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-[12px] text-chu-phu">Chỉ tính điểm thi tốt nghiệp THPT, dựa trên điểm chuẩn các năm trước. Điểm chuẩn năm nay có thể khác.</p>
          </section>
        )}

        {!coDiemDeSo(bc) && (
          <DongThongBao tone="xanh" icon={PencilLine} tieuDe="Nhập điểm để biết mức phù hợp"
            moTa="Em chưa nhập đủ điểm 3 môn của một tổ hợp (ví dụ Toán, Lý, Anh). Có điểm, mình sẽ so với điểm chuẩn của từng ngành."
            hanhDong="Nhập điểm ngay" onClick={() => nav(DUONG_DAN.batDau(2))} />
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-[14px] text-chu-phu" aria-live="polite">Có <b className="text-muc">{ds.length}</b> ngành phù hợp</p>
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
            {hien.map(({ l, kq }) => <li key={l.id}><TheKhamPha l={l} kq={kq} onClick={() => nav(DUONG_DAN.chiTiet(l.id))} /></li>)}
            {ds.length > soHien && (
              <li className="pt-1">
                <Nut kieu="vien" onClick={() => setSoHien((n) => n + 30)}>Xem thêm (còn {ds.length - soHien} ngành)</Nut>
              </li>
            )}
          </ul>
        )}
      </NoiDung>
    </>
  );
}
