import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { DANH_SACH_TRUONG } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import { layTatCaTruong, layToi, thongBaoLoi } from "@cms/may-chu/api";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OInput } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, The, gop } from "@cms/thanh-phan/ui/nut-the";
import {
  CAC_CHIP, gopTruong, locTruong, sapXepTruong, tiLeDu,
  type ChipLoc, type DongTruong, type KieuSapXep,
} from "./loc-truong";
import { nhanMuc } from "./dinh-dang";

export default function DanhSachTruong() {
  const [tuApi, setTuApi] = useState<{ maTruong: string; kenh?: any; tienDo: any }[]>([]);
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
    ]).then(([truongs, toi]) => {
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
    <div className="space-y-4">
      <DauTrangChinh
        tieuDe="Danh sách trường"
        moTa={`Đã đủ dữ liệu ${soDu}/${tatCa.length} trường (${Math.round((soDu / (tatCa.length || 1)) * 100)}%)`}
      />

      <NoiDung>
        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
            <OInput
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm mã hoặc tên trường (VD: BKA, Bách Khoa)..."
              className="pl-9"
            />
          </div>

          {/* Chip lọc */}
          <div className="flex flex-wrap gap-1.5">
            {CAC_CHIP.map((c) => {
              const chon = chip.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => batTatChip(c.id)}
                  className={gop(
                    "px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border",
                    chon
                      ? "bg-xanh text-white border-xanh shadow-sm"
                      : "bg-nen text-chu border-vien hover:bg-nen-dam active:brightness-95",
                  )}
                >
                  {c.nhan}
                </button>
              );
            })}
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center justify-between text-[13px] text-chu-phu pt-1">
            <span>Hiển thị <b>{daLoc.length}</b> trường</span>
            <div className="flex gap-2 items-center">
              <span>Sắp xếp:</span>
              <select
                value={sapXep}
                onChange={(e) => setSapXep(e.target.value as KieuSapXep)}
                className="bg-trang border border-vien rounded-lg px-2 py-1 text-[13px] font-medium text-chu"
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
          <div className="space-y-2.5">
            {daLoc.map((t) => {
              const pt = tiLeDu(t.tienDo);
              const du = t.tienDo.du;
              return (
                <Link key={t.ma} to={DUONG_DAN.chiTietTruong(t.ma)} className="block group">
                  <The tone={du ? "luc" : undefined} className="transition-all group-hover:border-xanh">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-extrabold text-[15px] text-muc">{t.ma}</span>
                          <span className="text-[12px] text-chu-phu font-medium">({t.khuVuc})</span>
                          {t.giaoChoToi && (
                            <Nhan tone="tim">Của tôi</Nhan>
                          )}
                          {du ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-luc-chu">
                              <CheckCircle2 size={14} /> Đủ
                            </span>
                          ) : (
                            <Nhan tone={pt >= 60 ? "xanh" : "cam"}>{pt}%</Nhan>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-chu leading-snug line-clamp-1">{t.ten}</p>

                        {/* Các mục còn thiếu */}
                        {!du && t.tienDo.thieu.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[11px] text-chu-phu font-medium">Thiếu:</span>
                            {t.tienDo.thieu.map((m) => (
                              <span key={m} className="px-1.5 py-0.5 rounded bg-cam-nhat text-cam-chu text-[11px] font-semibold">
                                {nhanMuc(m)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-chu-phu mt-2 group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
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
