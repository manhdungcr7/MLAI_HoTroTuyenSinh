import { useState, useEffect } from "react";
import { Check, User, AlertCircle } from "lucide-react";
import { DANH_SACH_TRUONG } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import { layNguoi, layPhanCong, datPhanCong, thongBaoLoi, type NguoiCms, type PhanCongCms } from "@cms/may-chu/api";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { BieuTuongTron } from "@cms/thanh-phan/ui/hinh-nen";
import { Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";

export default function PhanCong() {
  const [nguois, setNguois] = useState<NguoiCms[]>([]);
  const [phanCongs, setPhanCongs] = useState<PhanCongCms[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Sửa phân công cho 1 người
  const [chinhSuaNguoi, setChinhSuaNguoi] = useState<string | null>(null);
  const [truongDaChon, setTruongDaChon] = useState<Set<string>>(new Set());
  const [dangXuLy, setDangXuLy] = useState(false);
  const [timTruong, setTimTruong] = useState("");

  const taiLai = async () => {
    try {
      setDangTai(true);
      const [n, p] = await Promise.all([layNguoi(), layPhanCong()]);
      setNguois(n);
      setPhanCongs(p);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, []);

  const moSuaPhanCong = (email: string) => {
    const list = phanCongs.filter((p) => p.email === email).map((p) => p.maTruong);
    setChinhSuaNguoi(email);
    setTruongDaChon(new Set(list));
    setTimTruong("");
  };

  const toggleTruong = (ma: string) => {
    setTruongDaChon((cu) => {
      const moi = new Set(cu);
      if (moi.has(ma)) moi.delete(ma);
      else moi.add(ma);
      return moi;
    });
  };

  const luuPhanCongAction = async () => {
    if (!chinhSuaNguoi) return;
    try {
      setDangXuLy(true);
      await datPhanCong(chinhSuaNguoi, Array.from(truongDaChon));
      setThongBao(`Đã cập nhật phân công cho ${chinhSuaNguoi}.`);
      setChinhSuaNguoi(null);
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DauTrangCoQuayLai
        tieuDe="Phân công trường phụ trách"
        quayLai={DUONG_DAN.toi()}
      />

      <NoiDung>
        {thongBao && (
          <DongThongBao tieuDe={thongBao} tone="luc" onClick={() => setThongBao(null)} />
        )}

        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<AlertCircle size={24} />} tieuDe="Lỗi tải dữ liệu" moTa={loi} />
        ) : (
          <div className="space-y-2.5">
            {nguois.map((n) => {
              const truongs = phanCongs.filter((p) => p.email === n.email).map((p) => p.maTruong);
              return (
                <The key={n.email} className="p-3.5 space-y-2.5 border border-vien/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BieuTuongTron icon={User} tone={n.vaiTro === "qtv" ? "xanh" : "luc"} kichThuoc={36} />
                      <div>
                        <span className="font-extrabold text-[14px] text-muc">{n.email}</span>
                        <p className="text-[11.5px] text-chu-phu">Phụ trách: <b className="text-xanh">{truongs.length}</b> trường</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => moSuaPhanCong(n.email)}
                      className="px-2.5 py-1 rounded-lg bg-xanh-nhat text-xanh font-bold text-[12px] hover:bg-xanh hover:text-white transition-colors"
                    >
                      Sửa phân công
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-vien/70">
                    {truongs.length === 0 ? (
                      <span className="text-[12px] text-chu-phu italic">Chưa được giao trường nào.</span>
                    ) : (
                      truongs.map((ma) => (
                        <span
                          key={ma}
                          className="px-2 py-0.5 rounded-md bg-nen text-chu text-[11.5px] font-bold border border-vien/60"
                        >
                          {ma}
                        </span>
                      ))
                    )}
                  </div>
                </The>
              );
            })}
          </div>
        )}
      </NoiDung>

      {/* MODAL PHAN CONG */}
      <HopTruot
        mo={chinhSuaNguoi !== null}
        dong={() => setChinhSuaNguoi(null)}
        tieuDe={`Phân công: ${chinhSuaNguoi}`}
      >
        <div className="space-y-3 pb-4">
          <input
            type="text"
            value={timTruong}
            onChange={(e) => setTimTruong(e.target.value)}
            placeholder="Tìm theo mã hoặc tên trường (VD: UIT, BK)..."
            className="w-full bg-trang border border-vien focus:border-xanh rounded-xl px-3 py-2.5 text-[13.5px] text-chu outline-hidden shadow-2xs"
          />

          {/* Preset nhanh */}
          <div className="flex items-center justify-between text-[12px] text-chu-phu px-0.5">
            <span>Đã chọn: <b className="text-xanh">{truongDaChon.size}</b> trường</span>
            {truongDaChon.size > 0 && (
              <button
                type="button"
                onClick={() => setTruongDaChon(new Set())}
                className="text-do-chu hover:underline font-semibold"
              >
                Bỏ chọn hết
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 border border-vien rounded-xl p-2 bg-nen/50">
            {DANH_SACH_TRUONG.filter((t) =>
              !timTruong || t.ma.toLowerCase().includes(timTruong.toLowerCase()) || t.ten.toLowerCase().includes(timTruong.toLowerCase())
            ).map((t) => {
              const chon = truongDaChon.has(t.ma);
              return (
                <button
                  key={t.ma}
                  type="button"
                  onClick={() => toggleTruong(t.ma)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-[13px] transition-colors ${
                    chon ? "bg-xanh text-white font-bold shadow-2xs" : "bg-trang hover:bg-nen-dam text-chu font-medium border border-vien/50"
                  }`}
                >
                  <span className="truncate flex-1"><b>{t.ma}</b> - {t.ten}</span>
                  {chon && <Check size={16} strokeWidth={2.5} className="shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Nut onClick={luuPhanCongAction} disabled={dangXuLy}>
              Lưu phân công ({truongDaChon.size} trường)
            </Nut>
            <Nut kieu="vien" onClick={() => setChinhSuaNguoi(null)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

