import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpNarrowWide, Check, ChevronDown, ChevronRight, CircleDollarSign, Heart, LayoutGrid, MapPin, Search, SearchX, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { DongThongBao } from "@/components/ui/thong-bao";
import { GiaiThichNgan, SkeletonDanhSach, iconNhomNganh } from "@/components/ui/du-bao";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { BO_LOC_MAC_DINH, cacKhuVuc, cacNhom, dem, loc } from "./bo-loc";
import { TheDiemCuaBan } from "./the-diem-cua-ban";
import { dinhDangSo } from "@/engine/dinh-dang";
import { useBoLoc } from "./dung-bo-loc";
import { boiCanhTu, danhGia, sapXep, type KieuSapXep } from "./phu-hop";
import { GhiChuDuLieuMau, TheKhamPha } from "./thanh-phan";
import { locTimKiem, truongChuaCoDuLieu, xepHangTimKiem } from "@/engine/tim-kiem";
import { hieuCauTim, locTheoY, xepTheoY } from "@/engine/hieu-cau-tim";

/** Bộ lọc gợi ý ban đầu theo hồ sơ. Nếu kết hợp "khu vực + nhóm ngành" không còn ngành nào thì bỏ bớt, không để bạn mở ra thấy trống. */
function boLocBanDau(khuVuc: string | undefined, nganh: string[]): [string | undefined, string | undefined] {
  const kv = khuVuc && cacKhuVuc().includes(khuVuc) ? khuVuc : undefined;
  const nhom = nganh.length === 1 && cacNhom().includes(nganh[0]) ? nganh[0] : undefined;
  const co = (k?: string, n?: string) => loc(LUA_CHON_MAU, { ...BO_LOC_MAC_DINH, khuVuc: k ?? "", nhom: n ?? "" }).length > 0;
  if (co(kv, nhom)) return [kv, nhom];
  if (co(undefined, nhom)) return [undefined, nhom];
  return [co(kv) ? kv : undefined, undefined];
}

type KieuSX = KieuSapXep | "diemThap" | "hocPhiCao";
const SAP_XEP: { gia: KieuSX; nhan: string; icon: LucideIcon }[] = [
  { gia: "phuHop", nhan: "Thử sức → Phù hợp", icon: ArrowUpDown }, { gia: "diemCao", nhan: "Điểm cao → thấp", icon: ArrowDownWideNarrow },
  { gia: "diemThap", nhan: "Điểm thấp → cao", icon: ArrowUpNarrowWide }, { gia: "hocPhi", nhan: "Học phí thấp → cao", icon: CircleDollarSign },
  { gia: "hocPhiCao", nhan: "Học phí cao → thấp", icon: CircleDollarSign },
];
const hocPhiLon = (l: { hocPhiMax?: number; hocPhiMin?: number }) => l.hocPhiMax ?? l.hocPhiMin ?? -1; // ngành chưa có học phí xếp cuối

export default function KhamPha() {
  const nav = useNavigate();
  const { s } = useApp();
  const [b, sua, datLai] = useBoLoc(...boLocBanDau(s.hoSo.khuVuc[0], s.hoSo.nganhQuanTam));
  const [tuKhoa, setTuKhoa] = useState("");
  const [kieu, setKieu] = useState<KieuSX>("phuHop");
  const [moSapXep, setMoSapXep] = useState(false);
  const refSapXep = useRef<HTMLDivElement>(null);
  const [soHien, setSoHien] = useState(30);
  const [chiHienYeuThich, setChiHienYeuThich] = useState(false);
  const bc = useMemo(() => boiCanhTu(s), [s]);

  useEffect(() => {
    if (!moSapXep) return;
    const dongKhiBamNgoai = (e: MouseEvent | TouchEvent) => {
      if (refSapXep.current && !refSapXep.current.contains(e.target as Node)) {
        setMoSapXep(false);
      }
    };
    const dongKhiNhanEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoSapXep(false);
    };
    document.addEventListener("mousedown", dongKhiBamNgoai);
    document.addEventListener("touchstart", dongKhiBamNgoai);
    document.addEventListener("keydown", dongKhiNhanEsc);
    return () => {
      document.removeEventListener("mousedown", dongKhiBamNgoai);
      document.removeEventListener("touchstart", dongKhiBamNgoai);
      document.removeEventListener("keydown", dongKhiNhanEsc);
    };
  }, [moSapXep]);

  const y = useMemo(() => hieuCauTim(tuKhoa, LUA_CHON_MAU), [tuKhoa]); // câu dài kiểu "ngân hàng sài gòn dưới 30 triệu" → bộ lọc + từ khóa còn lại
  const { ds, moRongToanQuoc } = useMemo(() => {
    const tim = (nguon: typeof LUA_CHON_MAU) => {
      const daLoc = locTimKiem(locTheoY(nguon.filter((l) => !chiHienYeuThich || s.yeuThich.includes(l.id)), y), y.tuKhoaConLai);
      // khớp mã/biệt danh/tên lên trước, cùng mức thì theo kiểu sắp xếp đã chọn; phần "đã hiểu" (nghề, mốc điểm) xếp trên cùng
      const daXep = kieu === "hocPhiCao" ? [...daLoc].sort((a, b) => hocPhiLon(b) - hocPhiLon(a)) : sapXep(daLoc, kieu === "diemThap" ? "diem" : kieu, bc);
      return xepTheoY(xepHangTimKiem(daXep, y.tuKhoaConLai), y);
    };
    const trongLoc = tim(loc(LUA_CHON_MAU, b, bc.tinh || undefined));
    // Bộ lọc khu vực/điểm/học phí làm mất kết quả của từ khóa: tìm toàn quốc để không bị cụt đường
    if (trongLoc.length === 0 && tuKhoa.trim()) {
      const toanQuoc = tim(LUA_CHON_MAU);
      if (toanQuoc.length > 0) return { ds: toanQuoc, moRongToanQuoc: true };
    }
    return { ds: trongLoc, moRongToanQuoc: false };
  }, [b, y, tuKhoa, kieu, bc, chiHienYeuThich, s.yeuThich]);
  const dangTim = tuKhoa.trim().length > 0;
  const soNeuTatLoc = 0; // đã tự mở rộng toàn quốc khi bộ lọc che hết kết quả
  const hien = useMemo(() => ds.slice(0, soHien).map((l) => ({ l, kq: danhGia(l, bc) })), [ds, soHien, bc]);


  const soLoc = dem(b);
  const chipRef = useRef<HTMLDivElement>(null);
  const nhomChip = [{ gia: "", nhan: "Tất cả" }, ...cacNhom().map((n) => ({ gia: n, nhan: n }))];

  return (
    <>
      <span className="dau-nen-troi" />
      <DauTrangChinh tieuDe="Khám phá" moTa="Tìm ngành phù hợp với điểm của bạn" />
      <NoiDung>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
            <input type="search" value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); if (e.target.value.trim() && b.nhom) sua({ nhom: "" }); /* tìm theo tên thì tìm trong mọi nhóm ngành */ }} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành"
              className="w-full min-h-12 rounded-2xl o-mem pl-10 pr-10 text-[15px] border border-transparent focus:border-xanh [&::-webkit-search-cancel-button]:hidden" />
            {tuKhoa && (
              <button type="button" onClick={() => setTuKhoa("")} aria-label="Xóa ô tìm" className="absolute right-0.5 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full text-chu-phu">
                <X size={18} />
              </button>
            )}
          </div>
          <button type="button" onClick={() => nav(DUONG_DAN.boLoc())}
            className="min-h-12 min-w-12 px-3 rounded-2xl o-mem text-[14px] font-bold text-chu inline-flex items-center justify-center gap-1.5 shrink-0 active:bg-xanh-nhat cursor-pointer" aria-label="Bộ lọc">
            <SlidersHorizontal size={20} className="text-xanh" />
            {soLoc > 0 && <span className="min-w-6 h-6 px-1.5 rounded-md gd-xanh text-white text-[13px] grid place-items-center">{soLoc}<span className="sr-only"> bộ lọc đang bật</span></span>}
          </button>
        </div>

        {y.chip.length > 0 && (
          <p className="-mt-1 text-[13px] text-chu-phu" role="status">
            <span className="text-xanh font-semibold">✨ Đã hiểu:</span> {y.chip.join(" · ")}{y.tuKhoaConLai && <> · Từ khóa «{y.tuKhoaConLai}»</>}
          </p>
        )}

        <div className="-mx-4 flex items-center gap-1.5">
          <div ref={chipRef} className="min-w-0 flex-1 overflow-x-auto an-thanh-cuon py-1 pl-4" role="group" aria-label="Nhóm ngành">
            <div className="flex gap-2 w-max pr-4">
              {s.yeuThich.length > 0 && (
                <button type="button" aria-pressed={chiHienYeuThich} onClick={() => setChiHienYeuThich(!chiHienYeuThich)}
                  className={gop("min-h-11 px-3.5 rounded-lg text-[14px] font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 cursor-pointer", chiHienYeuThich ? "huy-do text-white" : "o-mem text-chu active:bg-xanh-nhat")}>
                  <Heart size={16} fill={chiHienYeuThich ? "currentColor" : "none"} className={chiHienYeuThich ? "text-white" : "text-do"} aria-hidden />Đã lưu ({s.yeuThich.length})
                </button>
              )}
              {nhomChip.map((c) => {
                const chon = !chiHienYeuThich && b.nhom === c.gia;
                const Icon = c.gia ? iconNhomNganh(c.gia) : LayoutGrid;
                return (
                  <button key={c.gia || "tat-ca"} type="button" aria-pressed={chon} onClick={() => { setChiHienYeuThich(false); sua({ nhom: c.gia }); }}
                    className={gop("min-h-11 px-3.5 rounded-lg text-[14px] font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 cursor-pointer", chon ? "gd-chip-chon" : "o-mem text-chu active:bg-xanh-nhat")}>
                    {c.gia ? <Icon size={16} className={chon ? "text-white" : "text-xanh"} aria-hidden /> : <Icon size={16} className={chon ? "text-white" : "text-xanh"} aria-hidden />}{c.nhan}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" aria-label="Xem thêm nhóm ngành" onClick={() => chipRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            className="shrink-0 mr-2 size-11 grid place-items-center rounded-full o-mem text-xanh cursor-pointer"><ChevronRight size={20} aria-hidden /></button>
        </div>

        {!dangTim && <TheDiemCuaBan onChonNhom={(n) => { setChiHienYeuThich(false); sua({ nhom: n }); }} />}

        {!dangTim && !s.hoSo.soThich && (
          <div className="-mx-4 px-4 overflow-x-auto an-thanh-cuon">
            <div className="flex gap-2 w-max pb-1">
              {!s.hoSo.soThich && (
                <button type="button" onClick={() => nav(DUONG_DAN.tracNghiem())} className="flex-shrink-0 min-h-11 rounded-xl bg-cam-chu text-white px-3.5 text-[14px] font-bold active:brightness-90">
                  Trắc nghiệm hướng nghiệp
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-[14px] text-chu-phu" aria-live="polite">Có <b className="text-muc">{dinhDangSo(ds.length)}</b> ngành <GiaiThichNgan khoa="mucPhuHop" /></p>
          <div className="relative" ref={refSapXep}>
            <button
              type="button"
              onClick={() => setMoSapXep((m) => !m)}
              aria-expanded={moSapXep}
              aria-haspopup="listbox"
              aria-label="Sắp xếp danh sách ngành"
              className="min-h-11 px-3 rounded-xl o-mem text-[13px] font-bold text-chu inline-flex items-center gap-1.5 shrink-0 active:bg-xanh-nhat hover:border-xanh transition-colors shadow-sm cursor-pointer"
            >
              <ArrowUpDown size={14} className="text-xanh shrink-0" aria-hidden />
              <span>{SAP_XEP.find((k) => k.gia === kieu)?.nhan || "Sắp xếp"}</span>
              <ChevronDown size={14} className={gop("text-chu-phu shrink-0 transition-transform duration-200", moSapXep && "rotate-180")} aria-hidden />
            </button>

            {moSapXep && (
              <div
                role="listbox"
                aria-label="Chọn kiểu sắp xếp"
                className="absolute right-0 top-full mt-1.5 z-30 min-w-[200px] py-1 bg-trang rounded-xl border border-vien shadow-the"
              >
                {SAP_XEP.map((k) => {
                  const chon = kieu === k.gia;
                  return (
                    <button
                      key={k.gia}
                      type="button"
                      role="option"
                      aria-selected={chon}
                      onClick={() => {
                        setKieu(k.gia);
                        setMoSapXep(false);
                      }}
                      className={gop(
                        "w-full px-3.5 py-2.5 text-left text-[13px] flex items-center justify-between transition-colors cursor-pointer",
                        chon
                          ? "font-bold text-xanh bg-xanh-nhat"
                          : "font-semibold text-chu hover:bg-nen hover:text-xanh active:bg-xanh-nhat"
                      )}
                    >
                      <span className="inline-flex items-center gap-2"><k.icon size={15} className="text-chu-phu" aria-hidden />{k.nhan}</span>
                      {chon && <Check size={14} className="text-xanh shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {moRongToanQuoc && (
          <DongThongBao
            tone="xanh"
            icon={MapPin}
            tieuDe={`Đã mở rộng tìm kiếm toàn quốc (${ds.length} ngành)`}
            moTa={`Không có ngành nào khớp “${tuKhoa.trim()}” tại ${b.khuVuc || "khu vực đang chọn"}. Hệ thống đã tự động tìm trên toàn quốc.`}
            hanhDong="Xem bộ lọc"
            onClick={() => nav(DUONG_DAN.boLoc())}
          />
        )}

        {ds.length === 0 && LUA_CHON_MAU.length === 0 ? (
          <SkeletonDanhSach />
        ) : ds.length === 0 ? (
          dangTim && soNeuTatLoc > 0 && soLoc > 0 ? (
            <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Bộ lọc đang che kết quả"
              moTa={`Không có ngành nào khớp đồng thời từ khóa «${tuKhoa.trim()}» và bộ lọc đang bật (còn ${soNeuTatLoc} ngành nếu tắt bộ lọc).`}>
              <div className="space-y-2">
                <Nut onClick={() => datLai()}>Xóa bộ lọc để xem {dinhDangSo(soNeuTatLoc)} ngành</Nut>
                <Nut kieu="vien" onClick={() => nav(DUONG_DAN.boLoc())}>Chỉnh bộ lọc</Nut>
              </div>
            </TrangThaiTrong>
          ) : dangTim ? (
            truongChuaCoDuLieu(tuKhoa) ? (
              // Trường lớn nhưng chưa có trong dữ liệu: nói thẳng, mời đóng góp, không để học sinh nghĩ mình gõ sai.
              <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Trường này chưa có dữ liệu"
                moTa={`${truongChuaCoDuLieu(tuKhoa)} chưa có trong dữ liệu của app. Bạn xem đề án trên trang tuyển sinh của trường, hoặc giúp bổ sung nếu bạn là sinh viên, thầy cô của trường.`}>
                <div className="space-y-2">
                  <Nut kieu="vien" onClick={() => nav(DUONG_DAN.dongGop())}>Giúp bổ sung dữ liệu trường</Nut>
                  <Nut kieu="nhe" onClick={() => setTuKhoa("")}>Xóa tìm kiếm</Nut>
                </div>
              </TrangThaiTrong>
            ) : (
              <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Không tìm thấy"
                moTa={`Không tìm thấy ngành/trường khớp với «${tuKhoa.trim()}». Thử tên khác, viết tắt (ví dụ UIT, CNTT) hoặc gõ không dấu.`}>
                <Nut kieu="vien" onClick={() => setTuKhoa("")}>Xóa tìm kiếm</Nut>
              </TrangThaiTrong>
            )
          ) : (
            <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Chưa có trường nào khớp" moTa="Thử nới bớt các tiêu chí lọc nhé.">
              <div className="space-y-2">
                <Nut kieu="nhe" onClick={() => datLai()}>Xóa bộ lọc</Nut>
                <Nut kieu="vien" onClick={() => nav(DUONG_DAN.boLoc())}>Chỉnh bộ lọc</Nut>
              </div>
            </TrangThaiTrong>
          )
        ) : (
          <>
            <ul className="space-y-3">
              {hien.map(({ l, kq }) => <li key={l.id}><TheKhamPha l={l} kq={kq} onClick={() => nav(DUONG_DAN.chiTiet(l.id))} /></li>)}
              {ds.length > soHien && (
                <li className="pt-1">
                  <Nut kieu="vien" onClick={() => setSoHien((n) => n + 30)}>Xem thêm (còn {ds.length - soHien} ngành)</Nut>
                </li>
              )}
            </ul>
            <GhiChuDuLieuMau />
          </>
        )}
      </NoiDung>
    </>
  );
}
