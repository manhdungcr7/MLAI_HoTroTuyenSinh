import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ChevronDown, Heart, MapPin, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { BO_LOC_MAC_DINH, CAC_KHU_VUC, CAC_NHOM, dem, loc } from "./bo-loc";
import { tinhCoHoi } from "./co-hoi";
import { useBoLoc } from "./dung-bo-loc";
import { CAC_KIEU_SAP_XEP, boiCanhTu, coDiemDeSo, danhGia, sapXep, type KieuSapXep } from "./phu-hop";
import { GhiChuDuLieuMau, TheKhamPha } from "./thanh-phan";
import { dinhDang } from "@/engine/dinh-dang";
import { locTimKiem, truongChuaCoDuLieu, xepHangTimKiem } from "@/engine/tim-kiem";
import { hieuCauTim, locTheoY, xepTheoY } from "@/engine/hieu-cau-tim";

/** Bộ lọc gợi ý ban đầu theo hồ sơ. Nếu kết hợp "khu vực + nhóm ngành" không còn ngành nào thì bỏ bớt, không để bạn mở ra thấy trống. */
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
  const [chiHienYeuThich, setChiHienYeuThich] = useState(false);
  const bc = useMemo(() => boiCanhTu(s), [s]);

  const y = useMemo(() => hieuCauTim(tuKhoa, LUA_CHON_MAU), [tuKhoa]); // câu dài kiểu "ngân hàng sài gòn dưới 30 triệu" → bộ lọc + từ khóa còn lại
  const { ds, moRongToanQuoc } = useMemo(() => {
    const tim = (nguon: typeof LUA_CHON_MAU) => {
      const daLoc = locTimKiem(locTheoY(nguon.filter((l) => !chiHienYeuThich || s.yeuThich.includes(l.id)), y), y.tuKhoaConLai);
      // khớp mã/biệt danh/tên lên trước, cùng mức thì theo kiểu sắp xếp đã chọn; phần "đã hiểu" (nghề, mốc điểm) xếp trên cùng
      return xepTheoY(xepHangTimKiem(sapXep(daLoc, kieu, bc), y.tuKhoaConLai), y);
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
  const coHoi = useMemo(() => tinhCoHoi(bc.diem), [bc.diem]);
  const hien = useMemo(() => ds.slice(0, soHien).map((l) => ({ l, kq: danhGia(l, bc) })), [ds, soHien, bc]);


  const soLoc = dem(b);
  const nhomChip = [{ gia: "", nhan: "Tất cả" }, ...CAC_NHOM.map((n) => ({ gia: n, nhan: n }))];

  return (
    <>
      <DauTrangChinh tieuDe="Khám phá" />
      <NoiDung>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
            <input type="search" value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); if (e.target.value.trim() && b.nhom) sua({ nhom: "" }); /* tìm theo tên thì tìm trong mọi nhóm ngành */ }} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành"
              className="w-full min-h-12 rounded-xl border border-vien bg-trang pl-10 pr-10 text-[15px] focus:border-xanh [&::-webkit-search-cancel-button]:hidden" />
            {tuKhoa && (
              <button type="button" onClick={() => setTuKhoa("")} aria-label="Xóa ô tìm" className="absolute right-0.5 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full text-chu-phu">
                <X size={18} />
              </button>
            )}
          </div>
          <button type="button" onClick={() => nav(DUONG_DAN.boLoc())}
            className="min-h-12 px-3.5 rounded-xl bg-trang border border-vien text-[14px] font-bold text-chu inline-flex items-center gap-1.5 shrink-0 active:bg-xanh-nhat hover:border-xanh transition-colors shadow-sm cursor-pointer">
            <SlidersHorizontal size={16} className="text-xanh" />Bộ lọc
            {soLoc > 0 && <span className="min-w-5 h-5 px-1 rounded-full gd-xanh text-white text-[11px] grid place-items-center">{soLoc}<span className="sr-only"> bộ lọc đang bật</span></span>}
          </button>
        </div>

        {y.chip.length > 0 && (
          <p className="-mt-1 text-[13px] text-chu-phu" role="status">
            <span className="text-xanh font-semibold">✨ Đã hiểu:</span> {y.chip.join(" · ")}{y.tuKhoaConLai && <> · Từ khóa «{y.tuKhoaConLai}»</>}
          </p>
        )}

        <div className="overflow-x-auto an-thanh-cuon -mx-4 px-4 py-0.5" role="group" aria-label="Nhóm ngành">
          <div className="flex gap-2 w-max">
            {s.yeuThich.length > 0 && (
              <button
                type="button"
                aria-pressed={chiHienYeuThich}
                onClick={() => setChiHienYeuThich(!chiHienYeuThich)}
                className={gop(
                  "min-h-11 px-3 rounded-xl border text-[13.5px] font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 cursor-pointer",
                  chiHienYeuThich
                    ? "bg-do text-white border-transparent shadow-nut"
                    : "bg-trang border-vien text-chu active:bg-xanh-nhat"
                )}
              >
                <Heart size={14} fill={chiHienYeuThich ? "currentColor" : "none"} className={chiHienYeuThich ? "text-white" : "text-do"} />
                Đã lưu ({s.yeuThich.length})
              </button>
            )}
            {nhomChip.map((c) => {
              const chon = !chiHienYeuThich && b.nhom === c.gia;
              return (
                <button key={c.gia || "tat-ca"} type="button" aria-pressed={chon} onClick={() => { setChiHienYeuThich(false); sua({ nhom: c.gia }); }}
                  className={gop("min-h-11 px-3 rounded-xl border text-[13.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                    chon ? "gd-xanh text-white border-transparent shadow-nut" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                  {c.nhan}
                </button>
              );
            })}
          </div>
        </div>

        {coHoi && !dangTim && (
          <section aria-label="Cơ hội của bạn" className="rounded-the nen-xanh p-3.5">
            <p className="text-[13px] font-bold text-xanh">Với điểm của bạn</p>
            <p className="mt-0.5 text-[15px] text-chu leading-snug">
              Tổ hợp <b>{coHoi.toHop}</b> được <b>{dinhDang(coHoi.tong, 1).replace(".", ",")}</b> điểm: đủ điểm chuẩn năm gần nhất của <b className="text-luc-chu">{coHoi.soDuDiem}</b> ngành, thử sức thêm <b className="text-cam-chu">{coHoi.soThuSuc}</b> ngành (trong {coHoi.soNganh} ngành đã đối soát).
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
          </section>
        )}

        {!dangTim && (!coDiemDeSo(bc) || !s.hoSo.soThich) && (
          <div className="-mx-4 px-4 overflow-x-auto an-thanh-cuon">
            <div className="flex gap-2 w-max pb-1">
              {!coDiemDeSo(bc) && (
                <button type="button" onClick={() => nav(DUONG_DAN.batDau(2))} className="flex-shrink-0 min-h-11 rounded-xl bg-xanh text-white px-3.5 text-[14px] font-bold active:brightness-90">
                  Nhập điểm
                </button>
              )}
              {!s.hoSo.soThich && (
                <button type="button" onClick={() => nav(DUONG_DAN.tracNghiem())} className="flex-shrink-0 min-h-11 rounded-xl bg-cam-chu text-white px-3.5 text-[14px] font-bold active:brightness-90">
                  Trắc nghiệm hướng nghiệp
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-[14px] text-chu-phu" aria-live="polite">Có <b className="text-muc">{ds.length}</b> ngành</p>
          <label className="relative inline-flex items-center gap-1 min-h-11 pl-2 pr-1 rounded-xl text-[13px] font-bold text-xanh active:bg-xanh-nhat">
            <ArrowUpDown size={15} aria-hidden />
            <span className="sr-only">Sắp xếp theo</span>
            <select value={kieu} onChange={(e) => setKieu(e.target.value as KieuSapXep)} className="appearance-none bg-transparent min-h-11 pr-5 font-bold text-xanh focus:outline-none">
              {CAC_KIEU_SAP_XEP.map((k) => <option key={k.gia} value={k.gia}>{k.nhan}</option>)}
            </select>
            <ChevronDown size={15} className="absolute right-1 pointer-events-none" aria-hidden />
          </label>
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

        {ds.length === 0 ? (
          dangTim && soNeuTatLoc > 0 && soLoc > 0 ? (
            <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Bộ lọc đang che kết quả"
              moTa={`Không có ngành nào khớp đồng thời từ khóa «${tuKhoa.trim()}» và bộ lọc đang bật (còn ${soNeuTatLoc} ngành nếu tắt bộ lọc).`}>
              <div className="space-y-2">
                <Nut onClick={() => datLai()}>Xóa bộ lọc để xem {soNeuTatLoc} ngành</Nut>
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
