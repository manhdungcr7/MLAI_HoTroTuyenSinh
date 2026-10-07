import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, CheckCircle2, X, SearchX } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { layHetBanGhi } from "@cms/may-chu/ban-ghi-api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, The, gop } from "@cms/thanh-phan/ui/nut-the";
import {
  CAC_CHIP, chipTuThamSo, gopTruong, locTruong, sapXepTruong, tiLeDu, SO_MUC_CAN_DU,
  type ChipLoc, type KieuSapXep,
} from "./loc-truong";
import { nhanMuc } from "./dinh-dang";
import { nhomTheoTruong, tienDoTuBanGhi } from "./mo-hinh";

export default function DanhSachTruong() {
  const { toi } = usePhien();
  const [tham] = useSearchParams();
  const tenTruong = useTai(() => layDanhSachTenTruong());
  const banGhi = useTai(() => layHetBanGhi());
  const dangTai = (tenTruong.dangTai && !tenTruong.du) || (banGhi.dangTai && !banGhi.du);
  const loi = tenTruong.loi ?? banGhi.loi;
  const taiLai = () => { tenTruong.taiLai(); banGhi.taiLai(); };
  const tuApi = tenTruong.du && banGhi.du ? tenTruong.du : null;

  const [tim, setTim] = useState("");
  const [chip, setChip] = useState<Set<ChipLoc>>(() => {
    const tuLink = chipTuThamSo(tham.get("loc"));
    return new Set(tuLink ? [tuLink] : []);
  });
  const [sapXep, setSapXep] = useState<KieuSapXep>("thieu");

  const tatCa = useMemo(() => {
    const nhom = nhomTheoTruong(banGhi.du?.ds ?? []);
    return gopTruong((tuApi ?? []).map((t) => ({ maTruong: t.maTruong, ten: t.ten, tienDo: tienDoTuBanGhi(t.maTruong, nhom.get(t.maTruong) ?? []) })), toi.truongDuocGiao);
  }, [tuApi, banGhi.du, toi.truongDuocGiao]);
  const daLoc = useMemo(() => sapXepTruong(locTruong(tatCa, tim, chip), sapXep), [tatCa, tim, chip, sapXep]);
  const soDu = tatCa.filter((t) => t.tienDo.du).length;

  const batTat = (c: ChipLoc) =>
    setChip((cu) => { const moi = new Set(cu); if (moi.has(c)) moi.delete(c); else moi.add(c); return moi; });

  return (
    <div className="space-y-3.5">
      <DauTrangChinh
        tieuDe="Dữ liệu trường"
        moTa={dangTai || loi ? "Chọn một trường để xem và điền học phí, học bổng, nơi ở, đánh giá." : `${soDu}/${tatCa.length} trường đã đủ ${SO_MUC_CAN_DU} mục. Chọn trường còn thiếu để điền tiếp.`}
      />
      <NoiDung>
        {banGhi.du?.daCatBot && (
          <p role="status" className="rounded-the bg-cam-nhat p-3 text-[13px] font-semibold text-cam-chu">Có quá nhiều bản ghi nên số mục còn thiếu có thể chưa chính xác. Hãy báo quản trị viên.</p>
        )}
        <div className="space-y-2.5">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
            <input
              type="search"
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm mã hoặc tên trường"
              aria-label="Tìm trường"
              className="w-full min-h-12 bg-trang border border-vien focus:border-xanh rounded-xl pl-10 pr-10 text-[15px] text-chu placeholder:text-chu-phu"
            />
            {tim && (
              <button type="button" onClick={() => setTim("")} aria-label="Xóa tìm kiếm"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-10 grid place-items-center text-chu-phu rounded-full">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto an-thanh-cuon py-0.5 -mx-1 px-1">
            {CAC_CHIP.map((c) => {
              const chon = chip.has(c.id);
              return (
                <button key={c.id} type="button" onClick={() => batTat(c.id)} aria-pressed={chon}
                  className={gop("min-h-10 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap border select-none shrink-0",
                    chon ? "bg-xanh text-white border-xanh" : "bg-trang text-chu-phu border-vien active:bg-nen")}>
                  {c.nhan}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 text-[13px] text-chu-phu px-0.5">
            <span>{dangTai ? "Đang tải..." : <>Có <b>{daLoc.length}</b> trường</>}</span>
            <label className="flex gap-1.5 items-center">
              <span>Sắp xếp</span>
              <select value={sapXep} onChange={(e) => setSapXep(e.target.value as KieuSapXep)}
                className="min-h-10 bg-trang border border-vien rounded-lg px-2 text-[13px] font-semibold text-chu">
                <option value="thieu">Thiếu nhiều trước</option>
                <option value="ten">Tên A-Z</option>
              </select>
            </label>
          </div>
        </div>

        {dangTai && !tuApi ? (
          <KhungDangTai soKhung={4} cao="h-24" />
        ) : loi ? (
          <KhungLoi moTa={loi} thuLai={taiLai} />
        ) : tatCa.length === 0 ? (
          <TrangThaiTrong bieuTuong={<SearchX size={26} />} tieuDe="Máy chủ chưa có danh sách trường" moTa="Nhờ quản trị viên kiểm tra việc nạp danh sách trường vào hệ thống." />
        ) : daLoc.length === 0 ? (
          <TrangThaiTrong bieuTuong={<SearchX size={26} />} tieuDe="Không có trường nào khớp" moTa="Đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm.">
            {(tim || chip.size > 0) && (
              <button type="button" onClick={() => { setTim(""); setChip(new Set()); }} className="min-h-11 px-4 rounded-xl border border-xanh/40 text-xanh font-bold">Xóa bộ lọc</button>
            )}
          </TrangThaiTrong>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {daLoc.map((t) => {
              const pt = tiLeDu(t.tienDo);
              const du = t.tienDo.du;
              return (
                <Link key={t.ma} to={DUONG_DAN.chiTietTruong(t.ma)} className="block">
                  <The className="p-3.5 active:bg-nen">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-extrabold text-[15px] text-muc">{t.ma}</span>
                          {t.giaoChoToi && <Nhan tone="tim">Của tôi</Nhan>}
                          {du ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-luc-chu ml-auto">
                              <CheckCircle2 size={14} strokeWidth={2.5} /> Đủ {SO_MUC_CAN_DU} mục
                            </span>
                          ) : (
                            <span className="text-[12px] font-bold text-cam-chu ml-auto">{pt}%</span>
                          )}
                        </div>
                        <p className="text-[14px] font-semibold text-chu leading-snug">{t.ten}</p>
                        <div className="w-full bg-vien rounded-full h-1.5 mt-2 overflow-hidden" role="progressbar" aria-valuenow={pt} aria-valuemin={0} aria-valuemax={100} aria-label="Mức đủ dữ liệu">
                          <div className={gop("h-full rounded-full", du ? "bg-luc" : "bg-xanh")} style={{ width: `${Math.max(6, pt)}%` }} />
                        </div>
                        {!du && (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            <span className="text-[12px] text-chu-phu">Thiếu:</span>
                            {t.tienDo.thieu.map((m) => <Nhan key={m} tone="cam">{nhanMuc(m)}</Nhan>)}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-chu-phu mt-3 shrink-0" />
                    </div>
                  </The>
                </Link>
              );
            })}
          </div>
        )}
      </NoiDung>
    </div>
  );
}
