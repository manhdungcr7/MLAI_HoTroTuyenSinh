// Thẻ chẩn đoán danh mục nguyện vọng thông minh (Decision Intelligence Portfolio Diagnostics).
// Hiển thị tổng xác suất trúng tuyển, phát hiện nghịch đảo thứ tự và đề xuất tối ưu.
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Gauge,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { gop, Nut } from "@/components/ui/nut-the";
import { HopTruot } from "@/components/ui/hien-thi";
import {
  danhGiaDanhMucToanDien,
  toiUuThuTuDanhMuc,
  timKiemDanhMucToiUu,
  type ChanDoanDanhMuc,
  type HoSoXetTuyenToiUu,
} from "@/engine/toi-uu-nguyen-vong";
import type { DiemDayDu } from "@/state/types";
import { LUA_CHON } from "@/data/lua-chon-that";
import { tim } from "@/data/lua-chon-mau";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { kyHieu } from "@/features/kham-pha/thanh-phan";

interface Props {
  danhSachIds: string[];
  diemMon: DiemDayDu;
  hoSo: HoSoXetTuyenToiUu;
  onApDungThuTuMoi: (idsMoi: string[], thongBao: string) => void;
  onThayDoiDanhSach: (idsMoi: string[], thongBao: string) => void;
  onXemChiTietAnToan?: () => void;
}

export function ChanDoanDanhMucCard({
  danhSachIds,
  diemMon,
  hoSo,
  onApDungThuTuMoi,
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

  const coNghichDao = chanDoan.canhBaoNghiemTrong.length > 0;
  const tongXacSuat = chanDoan.xacSuatDoItNhatMotNV;

  // Xử lý tự động sắp xếp lại thứ tự chuẩn
  const xuLyTuDongSapXep = () => {
    const idsToiUu = toiUuThuTuDanhMuc(danhSachIds, tim, diemMon, hoSo);
    onApDungThuTuMoi(idsToiUu, "Đã tự động sắp xếp lại thứ tự theo chuẩn cân bằng an toàn.");
  };

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
            : tongXacSuat >= 90
            ? "bg-luc-nhat/30 border-luc/30"
            : "bg-trang border-vien"
        )}
        aria-label="Chẩn đoán danh mục thông minh"
      >
        {/* Hàng tiêu đề & Chỉ số xác suất tổng */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span
              className={gop(
                "size-10 rounded-xl grid place-items-center shrink-0",
                coNghichDao
                  ? "bg-do/15 text-do"
                  : tongXacSuat >= 90
                  ? "bg-luc/15 text-luc-chu"
                  : "bg-xanh-nhat text-xanh"
              )}
            >
              {coNghichDao ? <ShieldAlert size={22} /> : <Gauge size={22} />}
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <b className="text-[15px] font-extrabold text-muc">
                  Đánh giá Cơ hội Trúng tuyển
                </b>
                <span
                  className={gop(
                    "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
                    coNghichDao
                      ? "bg-do text-white border-do"
                      : tongXacSuat >= 90
                      ? "bg-luc text-white border-luc"
                      : "bg-cam-nhat text-cam-chu border-cam/30"
                  )}
                >
                  {chanDoan.danhGiaRuiRo}
                </span>
              </div>
              <p className="text-[12px] text-chu-phu mt-0.5">
                Mô hình Decision Intelligence tính toán xác suất tích lũy
              </p>
            </div>
          </div>

          {/* Điểm xác suất đỗ >= 1 NV */}
          <div className="text-right shrink-0">
            <span
              className={gop(
                "text-[26px] font-black leading-none tracking-tight",
                tongXacSuat >= 90 ? "text-luc-chu" : tongXacSuat >= 75 ? "text-xanh" : "text-do"
              )}
            >
              {tongXacSuat}%
            </span>
            <span className="block text-[11px] font-semibold text-chu-phu mt-0.5">
              Đỗ ≥ 1 nguyện vọng
            </span>
          </div>
        </div>

        {/* Cảnh báo nghịch đảo nếu có */}
        {coNghichDao && (
          <div className="rounded-xl bg-do/10 border border-do/30 p-3 space-y-2">
            <div className="flex items-start gap-2 text-do">
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <div className="text-[13px] leading-snug">
                <b className="font-extrabold block mb-1">
                  Phát hiện lỗi nghịch đảo thứ tự nguyện vọng!
                </b>
                {chanDoan.canhBaoNghiemTrong.map((cb, idx) => (
                  <p key={idx} className="mt-1 text-[12px] text-do-chu">
                    • {cb}
                  </p>
                ))}
              </div>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={xuLyTuDongSapXep}
                className="w-full min-h-10 px-3 rounded-lg bg-do text-white font-bold text-[13px] inline-flex items-center justify-center gap-1.5 active:brightness-95 cursor-pointer shadow-sm"
              >
                <ArrowUpDown size={16} /> Tự động chỉnh thứ tự chuẩn ngay
              </button>
            </div>
          </div>
        )}

        {/* Điểm mạnh & Khuyến nghị */}
        {!coNghichDao && (
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

        {/* Thanh công cụ hành động: Gợi ý danh mục thông minh */}
        <div className="pt-1 flex items-center gap-2 border-t border-vien/60">
          <button
            type="button"
            onClick={() => setMoToiUuModal(true)}
            className="flex-1 min-h-10 px-3 rounded-xl bg-xanh-nhat text-xanh text-[13px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-xanh/15 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Sparkles size={16} /> Gợi ý danh mục thông minh
          </button>
          {onXemChiTietAnToan && (
            <button
              type="button"
              onClick={onXemChiTietAnToan}
              className="px-3 min-h-10 rounded-xl border border-vien bg-trang text-chu-phu text-[13px] font-semibold hover:text-chu active:bg-nen transition-colors cursor-pointer"
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
        tieuDe="Gợi ý danh mục thông minh (Decision Intelligence)"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-chu-phu leading-relaxed">
            Hệ thống áp dụng giải thuật chọn lọc đa mục tiêu (Knapsack & Portfolio
            Theory) từ 3.652 ngành đào tạo, tự động sắp xếp thứ tự chuẩn xác để đạt cơ hội trúng
            tuyển cao nhất mà không bị nghịch đảo.
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
                Thận trọng (An toàn 100%)
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
