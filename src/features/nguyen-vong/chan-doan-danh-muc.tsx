// Thẻ so sánh nguyện vọng với điểm chuẩn lịch sử và nhắc học sinh tự chọn thứ tự ưu tiên.
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { gop, Nut } from "@/components/ui/nut-the";
import { HopTruot } from "@/components/ui/hien-thi";
import {
  danhGiaDanhMucToanDien,
  timKiemDanhMucToiUu,
  type ChanDoanDanhMuc,
  type HoSoXetTuyenToiUu,
} from "@/engine/toi-uu-nguyen-vong";
import { KET_QUA_BACKTESTING_3_NAM } from "@/engine/du-bao-diem-chuan";
import type { DiemDayDu } from "@/state/types";
import { LUA_CHON } from "@/data/lua-chon-that";
import { tim } from "@/data/lua-chon-mau";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { kyHieu } from "@/features/kham-pha/thanh-phan";

interface Props {
  danhSachIds: string[];
  diemMon: DiemDayDu;
  hoSo: HoSoXetTuyenToiUu;
  onThayDoiDanhSach: (idsMoi: string[], thongBao: string) => void;
  onXemChiTietAnToan?: () => void;
}

export function ChanDoanDanhMucCard({
  danhSachIds,
  diemMon,
  hoSo,
  onThayDoiDanhSach,
  onXemChiTietAnToan,
}: Props) {
  const [moToiUuModal, setMoToiUuModal] = useState(false);
  const [chienLuoc, setChienLuoc] = useState<"can_bang" | "than_trong" | "but_pha">("can_bang");

  // Chẩn đoán toàn diện danh mục
  const chanDoan = useMemo<ChanDoanDanhMuc>(() => {
    return danhGiaDanhMucToanDien(danhSachIds, tim, diemMon, hoSo);
  }, [danhSachIds, diemMon, hoSo]);

  if (danhSachIds.length === 0) return null;

  const coNghichDao = chanDoan.cacNguyenVong.some((nv) => nv.biNghichDao);
  const coCanhBao = chanDoan.canhBaoNghiemTrong.length > 0;
  // Danh mục thông minh gợi ý
  const danhMucGoiY = useMemo(() => {
    return timKiemDanhMucToiUu(LUA_CHON, diemMon, hoSo, 5, chienLuoc);
  }, [diemMon, hoSo, chienLuoc]);

  const xuLyApDungDanhMucGoiY = () => {
    setMoToiUuModal(false);
    onThayDoiDanhSach(
      danhMucGoiY.map((l) => l.id),
      `Đã áp dụng danh mục thông minh theo chiến lược "${chienLuoc === "can_bang" ? "Cân bằng" : chienLuoc === "than_trong" ? "Thận trọng" : "Bứt phá"}".`
    );
  };

  return (
    <>
      <section
        className={gop(
          "rounded-the p-4 border transition-all shadow-the space-y-3",
          coNghichDao
            ? "bg-do-nhat/30 border-do/40"
            : "bg-trang border-vien"
        )}
        aria-label="Chẩn đoán danh mục thông minh"
      >
        {/* Cơ cấu nhãn dựa trên khoảng cách điểm lịch sử */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span
              className={gop(
                "size-10 rounded-xl grid place-items-center shrink-0",
                coNghichDao
                  ? "bg-do/15 text-do"
                  : "bg-xanh-nhat text-xanh"
              )}
            >
              {coNghichDao ? <ShieldAlert size={22} /> : <Sparkles size={22} />}
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <b className="text-[15px] font-extrabold text-muc">
                  Cơ cấu theo điểm lịch sử
                </b>
                <span
                  className={gop(
                    "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
                    coNghichDao
                      ? "bg-do text-white border-do"
                      : "bg-cam-nhat text-cam-chu border-cam/30"
                  )}
                >
                  {chanDoan.danhGiaRuiRo}
                </span>
              </div>

            </div>
          </div>

          <div className="text-right text-[11px] font-semibold text-chu-phu shrink-0">{chanDoan.soLuong} nguyện vọng</div>
        </div>

        {/* Cảnh báo nghịch đảo hoặc dồn rủi ro nếu có */}
        {coCanhBao && (
          <div className="rounded-xl bg-do/10 border border-do/30 p-3 space-y-2">
            <div className="flex items-start gap-2 text-do">
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <div className="text-[13px] leading-snug">
                <b className="font-extrabold block mb-1">
                  {coNghichDao
                    ? "Cảnh báo ngược vị thế nguyện vọng"
                    : chanDoan.canhBaoNghiemTrong.some((cb) => cb.includes("Dồn") || cb.includes("thử sức"))
                      ? "Cảnh báo dồn toàn bộ nguyện vọng thử sức"
                      : "Kiểm tra ngân sách hoặc dữ liệu điểm"}
                </b>
                {chanDoan.canhBaoNghiemTrong.map((cb, idx) => (
                  <p key={idx} className="mt-1 text-[12px] text-do-chu">
                    • {cb}
                  </p>
                ))}
              </div>
            </div>
            <div className="pt-1">
              <p className="text-[12px] text-chu-phu">
                Thứ tự nguyện vọng theo sở thích của em. Nếu có lỗi ngược vị thế hoặc danh mục toàn thử sức, em nên điều chỉnh lại danh mục để tránh mất cơ hội xét tuyển.
              </p>
            </div>
          </div>
        )}

        {/* Điểm mạnh & Khuyến nghị */}
        {!coCanhBao && (
          <div className="space-y-1.5 text-[12px] text-chu">
            {chanDoan.diemManh.map((dm, idx) => (
              <p key={idx} className="flex items-start gap-1.5 leading-snug">
                <CheckCircle2 size={15} className="text-luc shrink-0 mt-0.5" />
                <span>{dm}</span>
              </p>
            ))}
            {chanDoan.deXuatHanhDong.map((dx, idx) => (
              <p key={idx} className="flex items-start gap-1.5 text-cam-chu leading-snug">
                <Lightbulb size={15} className="shrink-0 mt-0.5" />
                <span>{dx}</span>
              </p>
            ))}
          </div>
        )}

        {/* Minh bạch độ tin cậy kiểm thử quá khứ (Leave-one-year-out Backtesting) */}
        <div className="rounded-xl bg-nen p-2.5 border border-vien/70 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-chu-phu">
            <span className="font-bold text-muc flex items-center gap-1">
              <ShieldCheck size={14} className="text-xanh" /> Độ phủ kiểm thử 3 mùa thi (Backtesting)
            </span>
            <span className="font-semibold text-[10px] text-chu-phu">Bỏ-một-năm</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {KET_QUA_BACKTESTING_3_NAM.map((kq) => (
              <div
                key={kq.nam}
                className={gop(
                  "p-1.5 rounded-lg border",
                  kq.bienDongBatThuong
                    ? "bg-cam-nhat/40 border-cam/30 text-cam-chu"
                    : "bg-trang border-vien text-muc"
                )}
              >
                <div className="font-bold text-[10px] text-chu-phu">Mùa {kq.nam}</div>
                <div className="text-[13px] font-black">{Math.round(kq.tyLeBaoHam * 100)}%</div>
                <div className="text-[9px] text-chu-phu leading-tight truncate">
                  {kq.bienDongBatThuong ? "Lệch phổ A01" : `Sai số ~${kq.saiSoTrungBinh}đ`}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-chu-phu italic leading-snug">
            Minh bạch khoa học: Năm 2025 độ phủ 64% do phổ điểm A01 biến động mạnh (độ lệch chuẩn 2,6 so với 1,8); hệ thống chủ động cảnh báo sai số.
          </p>
        </div>

        {/* Thanh công cụ hành động: Gợi ý danh mục thông minh */}
        <div className="pt-1 flex items-center gap-2 border-t border-vien/60">
          <button
            type="button"
            onClick={() => setMoToiUuModal(true)}
            className="flex-1 min-h-11 px-3 rounded-xl bg-xanh-nhat text-xanh text-[13px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-xanh/15 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Sparkles size={16} /> Gợi ý danh mục thông minh
          </button>
          {onXemChiTietAnToan && (
            <button
              type="button"
              onClick={onXemChiTietAnToan}
              className="px-3 min-h-11 rounded-xl border border-vien bg-trang text-chu-phu text-[13px] font-semibold hover:text-chu active:bg-nen transition-colors cursor-pointer"
            >
              Chi tiết
            </button>
          )}
        </div>
      </section>

      {/* Modal Gợi ý danh mục thông minh */}
      <HopTruot
        mo={moToiUuModal}
        dong={() => setMoToiUuModal(false)}
        tieuDe="Gợi ý danh mục thông minh"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-chu-phu leading-relaxed">
            Gợi ý dựa trên khoảng cách điểm lịch sử, ngành quan tâm, khu vực và ngân sách. Em xem lại điều kiện tuyển sinh rồi tự sắp thứ tự theo sở thích; nhãn không phải xác suất trúng tuyển.
          </p>

          {/* Chọn chiến lược lựa chọn */}
          <div className="space-y-1.5">
            <span className="text-[13px] font-bold text-muc">Chiến lược lựa chọn:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChienLuoc("can_bang")}
                className={gop(
                  "p-2.5 rounded-xl border text-center text-[12px] font-bold cursor-pointer transition-colors",
                  chienLuoc === "can_bang"
                    ? "bg-xanh text-white border-xanh"
                    : "bg-trang border-vien text-chu hover:bg-xanh-nhat"
                )}
              >
                Cân bằng (Khuyên dùng)
              </button>
              <button
                type="button"
                onClick={() => setChienLuoc("than_trong")}
                className={gop(
                  "p-2.5 rounded-xl border text-center text-[12px] font-bold cursor-pointer transition-colors",
                  chienLuoc === "than_trong"
                    ? "bg-luc text-white border-luc"
                    : "bg-trang border-vien text-chu hover:bg-luc-nhat"
                )}
              >
                Thận trọng (Ưu tiên an toàn)
              </button>
              <button
                type="button"
                onClick={() => setChienLuoc("but_pha")}
                className={gop(
                  "p-2.5 rounded-xl border text-center text-[12px] font-bold cursor-pointer transition-colors",
                  chienLuoc === "but_pha"
                    ? "bg-cam text-white border-cam"
                    : "bg-trang border-vien text-chu hover:bg-cam-nhat"
                )}
              >
                Bứt phá (Ưu tiên Top)
              </button>
            </div>
          </div>

          {/* Danh mục đề xuất xem trước */}
          <div className="space-y-2">
            <span className="text-[13px] font-bold text-muc">
              Danh mục đề xuất ({danhMucGoiY.length} nguyện vọng):
            </span>
            <ul className="divide-y divide-vien border border-vien rounded-xl overflow-hidden bg-trang">
              {danhMucGoiY.map((l, index) => (
                <li key={l.id} className="p-2.5 flex items-center gap-2.5">
                  <span className="size-6 rounded-md bg-xanh-nhat text-xanh font-black text-[12px] grid place-items-center shrink-0">
                    {index + 1}
                  </span>
                  <HuyHieuTruong ten={kyHieu(l.truong)} tone={l.tone} kichThuoc={34} />
                  <div className="flex-1 min-w-0">
                    <b className="block text-[13px] text-muc leading-tight truncate">
                      {l.nganh}
                    </b>
                    <span className="block text-[11px] text-chu-phu truncate mt-0.5">
                      {l.truong} · Điểm chuẩn: {l.diemMin} · {l.khuVuc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex gap-2">
            <Nut kieu="vien" onClick={() => setMoToiUuModal(false)}>
              Giữ nguyên danh sách cũ
            </Nut>
            <Nut bieuTuong={Zap} onClick={xuLyApDungDanhMucGoiY}>
              Áp dụng danh mục này
            </Nut>
          </div>
        </div>
      </HopTruot>
    </>
  );
}
