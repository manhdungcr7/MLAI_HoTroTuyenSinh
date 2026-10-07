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
          <div className="space-y-3">

            {nguois.map((n) => {
              const truongs = phanCongs.filter((p) => p.email === n.email).map((p) => p.maTruong);
              return (
                <The key={n.email} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BieuTuongTron icon={User} tone={n.vaiTro === "qtv" ? "xanh" : "luc"} kichThuoc={36} />
                      <div>
                        <span className="font-bold text-[14px] text-muc">{n.email}</span>
                        <p className="text-[12px] text-chu-phu">Phụ trách: <b>{truongs.length}</b> trường</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => moSuaPhanCong(n.email)}
                      className="text-[13px] font-bold text-xanh hover:underline"
                    >
                      Sửa phân công
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-vien">
                    {truongs.length === 0 ? (
                      <span className="text-[12px] text-chu-phu italic">Chưa được giao trường nào.</span>
                    ) : (
                      truongs.map((ma) => (
                        <span
                          key={ma}
                          className="px-2 py-0.5 rounded bg-nen-dam text-chu text-[12px] font-bold"
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
        <div className="space-y-3.5 pb-4">
          <input
            type="text"
            value={timTruong}
            onChange={(e) => setTimTruong(e.target.value)}
            placeholder="Tìm theo mã hoặc tên trường..."
            className="w-full bg-nen border border-vien rounded-lg px-3 py-2 text-[14px] text-chu"
          />

          <div className="text-[12px] text-chu-phu font-semibold">
            Đã chọn: <b>{truongDaChon.size}</b> trường
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 border border-vien rounded-lg p-2 bg-nen">
            {DANH_SACH_TRUONG.filter((t) =>
              !timTruong || t.ma.toLowerCase().includes(timTruong.toLowerCase()) || t.ten.toLowerCase().includes(timTruong.toLowerCase())
            ).map((t) => {
              const chon = truongDaChon.has(t.ma);
              return (
                <button
                  key={t.ma}
                  type="button"
                  onClick={() => toggleTruong(t.ma)}
                  className={`w-full text-left p-2 rounded flex items-center justify-between text-[13px] transition-colors ${
                    chon ? "bg-xanh text-white font-bold" : "hover:bg-trang text-chu font-medium"
                  }`}
                >
                  <span className="truncate flex-1">{t.ma} - {t.ten}</span>
                  {chon && <Check size={16} className="shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Nut onClick={luuPhanCongAction} disabled={dangXuLy}>
              Lưu phân công
            </Nut>
            <Nut kieu="vien" onClick={() => setChinhSuaNguoi(null)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}
