import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { DANH_SACH_TRUONG } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import { layTatCaTruong, layToi, thongBaoLoi, type TruongTrongDanhSach, type Toi } from "@cms/may-chu/api";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, The, gop } from "@cms/thanh-phan/ui/nut-the";
import {
  CAC_CHIP, gopTruong, locTruong, sapXepTruong, tiLeDu,
  type ChipLoc, type DongTruong, type KieuSapXep,
} from "./loc-truong";
import { nhanMuc } from "./dinh-dang";

export default function DanhSachTruong() {
  const [tuApi, setTuApi] = useState<TruongTrongDanhSach[]>([]);
  const [maGiao, setMaGiao] = useState<string[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const [tim, setTim] = useState("");
  const [chip, setChip] = useState<Set<ChipLoc>>(new Set());
  const [sapXep, setSapXep] = useState<KieuSapXep>("thieu");

  useEffect(() => {
    let vanDung = true;
    Promise.all([
      layTatCaTruong().catch(() => []),
      layToi().catch(() => ({ email: "", vaiTro: "ctv" as const, truongDuocGiao: [] })),
    ]).then(([truongs, toi]: [TruongTrongDanhSach[], Toi]) => {
      if (!vanDung) return;
      setTuApi(truongs);
      setMaGiao(toi.truongDuocGiao || []);
      setDangTai(false);
    }).catch((e) => {
      if (!vanDung) return;
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    });
    return () => { vanDung = false; };
  }, []);

  const tatCa: DongTruong[] = useMemo(() => gopTruong(DANH_SACH_TRUONG, tuApi, maGiao), [tuApi, maGiao]);

  const daLoc = useMemo(() => {
    const l = locTruong(tatCa, tim, chip);
    return sapXepTruong(l, sapXep);
  }, [tatCa, tim, chip, sapXep]);

  const batTatChip = (c: ChipLoc) => {
    setChip((cu) => {
      const moi = new Set(cu);
      if (moi.has(c)) moi.delete(c);
      else moi.add(c);
      return moi;
    });
  };

  const soDu = tatCa.filter((t) => t.tienDo.du).length;

  return (
    <div className="space-y-3.5">
      <DauTrangChinh
        tieuDe="Danh sách trường"
        moTa={`Đã hoàn thành ${soDu}/${tatCa.length} trường (${Math.round((soDu / (tatCa.length || 1)) * 100)}%)`}
      />

      <NoiDung>
        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
            <input
              type="text"
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm mã hoặc tên trường (VD: UIT, Bách Khoa)..."
              className="w-full bg-trang border border-vien focus:border-xanh focus:ring-1 focus:ring-xanh rounded-xl pl-9 pr-8 py-2.5 text-[14px] text-chu placeholder:text-chu-phu outline-hidden shadow-2xs"
            />
            {tim && (
              <button
                type="button"
                onClick={() => setTim("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 grid place-items-center text-chu-phu hover:text-chu rounded-full"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Chip lọc vuốt ngang */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {CAC_CHIP.map((c) => {
              const chon = chip.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => batTatChip(c.id)}
                  className={gop(
                    "px-3 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-colors border select-none shrink-0",
                    chon
                      ? "bg-xanh text-white border-xanh shadow-2xs"
                      : "bg-trang text-chu-phu border-vien hover:text-chu hover:border-chu-phu active:bg-nen",
                  )}
                >
                  {c.nhan}
                </button>
              );
            })}
          </div>

          {/* Sắp xếp & Số lượng */}
          <div className="flex items-center justify-between text-[12.5px] text-chu-phu pt-0.5 px-0.5">
            <span>Hiển thị <b>{daLoc.length}</b> trường</span>
            <div className="flex gap-1.5 items-center">
              <span>Sắp xếp:</span>
              <select
                value={sapXep}
                onChange={(e) => setSapXep(e.target.value as KieuSapXep)}
                className="bg-trang border border-vien rounded-lg px-2 py-1 text-[12.5px] font-semibold text-chu outline-hidden"
              >
                <option value="thieu">Cần điền trước</option>
                <option value="ten">Theo tên (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách */}
        {dangTai ? (
          <KhungDangTai soKhung={4} />
        ) : loi ? (
          <TrangThaiTrong
            bieuTuong={<AlertCircle size={28} className="text-do-chu" />}
            tieuDe="Không tải được dữ liệu"
            moTa={loi}
          />
        ) : daLoc.length === 0 ? (
          <TrangThaiTrong
            bieuTuong={<Sparkles size={28} className="text-chu-phu" />}
            tieuDe="Không tìm thấy trường nào"
            moTa="Thử đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc."
          />
        ) : (
          <div className="space-y-2">
            {daLoc.map((t) => {
              const pt = tiLeDu(t.tienDo);
              const du = t.tienDo.du;
              return (
                <Link key={t.ma} to={DUONG_DAN.chiTietTruong(t.ma)} className="block group">
                  <The
                    tone={du ? "luc" : undefined}
                    className="p-3.5 transition-all group-hover:border-xanh group-active:scale-[0.99] border border-vien/90"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-extrabold text-[15px] text-muc tracking-tight">{t.ma}</span>
                          <span className="text-[11.5px] text-chu-phu font-semibold">· {t.khuVuc}</span>
                          {t.giaoChoToi && (
                            <Nhan tone="tim">Của tôi</Nhan>
                          )}
                          {du ? (
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-luc-chu ml-auto">
                              <CheckCircle2 size={13} strokeWidth={2.5} /> Đủ 5 mục
                            </span>
                          ) : (
                            <span className="text-[11.5px] font-bold text-cam-chu ml-auto">
                              {pt}%
                            </span>
                          )}
                        </div>

                        <p className="text-[13.5px] font-bold text-chu leading-snug line-clamp-1">{t.ten}</p>

                        {/* Thanh mini progress 5 vạch trực quan */}
                        <div className="w-full bg-nen-dam rounded-full h-1.5 mt-2 overflow-hidden flex">
                          <div
                            className={gop("h-full transition-all rounded-full", du ? "bg-luc" : "bg-xanh")}
                            style={{ width: `${Math.max(8, pt)}%` }}
                          />
                        </div>

                        {/* Các mục còn thiếu */}
                        {!du && t.tienDo.thieu.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            <span className="text-[11px] text-chu-phu font-medium">Thiếu:</span>
                            {t.tienDo.thieu.map((m) => (
                              <span key={m} className="px-1.5 py-0.2 rounded bg-cam-nhat/80 text-cam-chu text-[10.5px] font-bold">
                                {nhanMuc(m)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={17} className="text-chu-phu mt-3 group-hover:text-xanh group-hover:translate-x-0.5 transition-all shrink-0" />
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

