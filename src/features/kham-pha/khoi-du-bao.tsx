// Khối "Điểm chuẩn năm tới có thể ở đâu?" ở trang ngành: khoảng dự báo, vị trí điểm của em, đổi điểm xem thử, lịch sử các năm.
// Không phải xác suất đậu. Loại dữ liệu không dự báo được thì hiện đúng trạng thái thay vì vẽ thanh so sánh.
import { useState } from "react";
import { SlidersHorizontal, TrendingUp } from "lucide-react";
import { BieuDoLichSu, BoDoiDiem, KhoiTrangThaiDuLieu, MAU_CHUA_CO_DIEM, MAU_KET_LUAN, NhanTrangThaiDuLieu, ThanhDuBao, ketLuanDuBao, useTrangThaiDuLieu } from "@/components/ui/du-bao";
import { Nut, gop } from "@/components/ui/nut-the";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { cacDiemHopLe } from "@/engine/trang-thai-du-lieu";
import { NHAN_DU_BAO, NHAN_LOI_THOI, NHAN_THAM_CHIEU, NHAN_THAM_CHIEU_HAN_CHE } from "@/noi-dung/du-bao";
import type { LuaChon } from "@/state/types";

export function KhoiDuBao({ lc, diemEm }: { lc: LuaChon; diemEm: number | null }) {
  const tt = useTrangThaiDuLieu(lc);
  const [xemThu, setXemThu] = useState<number | null>(null); // null = đang dùng điểm thật của em
  const [moDoi, setMoDoi] = useState(false);
  if (tt.loai === "khongDu" || tt.loai === "chiDiemSan" || tt.loai === "phuongThucKhac") return <KhoiTrangThaiDuLieu lc={lc} tt={tt} />;

  const d = tt.duBao;
  const diem = xemThu ?? diemEm;
  const kl = d && diem !== null ? ketLuanDuBao(diem, d, xemThu !== null) : null;
  const mau = kl ? MAU_KET_LUAN[kl.viTri] : MAU_CHUA_CO_DIEM;
  const chenhChu = kl ? (kl.chenh === 0 ? "0" : `${kl.chenh > 0 ? "+" : "−"}${dinhDangDiem(Math.abs(kl.chenh))}`) : "";
  const nho = d ? Math.max(10, Math.floor(Math.min(d.thap, diemEm ?? d.thap) - 3)) : 10;
  const lon = d ? Math.min(30, Math.ceil(Math.max(d.cao, diemEm ?? d.cao) + 3)) : 30;
  const luuY = [...(d?.luuY ?? []), ...(tt.loiThoi && !d ? [NHAN_LOI_THOI] : []), ...(tt.laThamChieu || tt.nguonThuCap ? [NHAN_THAM_CHIEU] : [])];
  const batDoi = () => {
    if (moDoi) setXemThu(null);
    else if (diemEm === null && d) setXemThu(Math.round(d.kyVong * 4) / 4);
    setMoDoi(!moDoi);
  };
  const veDiemEm = (v: number) => setXemThu(diemEm !== null && v === diemEm ? null : v);

  return (
    <section className="rounded-lon bg-trang border border-vien shadow-the overflow-hidden" aria-label="Dự báo điểm chuẩn">
      {d && (
        <div className={gop("p-4", mau.nen)} aria-live="polite">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-chu-phu">
            <TrendingUp size={16} className="shrink-0" aria-hidden />Dự đoán điểm chuẩn năm {d.namDuBao}
            {tt.loai === "motNam" && <NhanTrangThaiDuLieu tt={tt} className="ml-auto" />}
          </p>
          {kl ? (
            <div className="mt-2.5 flex items-start gap-3">
              <span className={gop("size-12 shrink-0 grid place-items-center rounded-xl text-trang", mau.dam)}><mau.icon size={26} strokeWidth={2.2} aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className={gop("text-[19px] font-extrabold leading-tight", mau.chu)}>{kl.nhan}</p>
                <p className="mt-0.5 text-[13px] text-chu-phu"><b className={gop("so-lon text-[24px] tabular-nums align-middle", mau.chu)}>{chenhChu}</b> điểm so với điểm dự đoán</p>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 flex items-start gap-3">
              <span className={gop("size-12 shrink-0 grid place-items-center rounded-xl text-trang", mau.dam)}><SlidersHorizontal size={24} aria-hidden /></span>
              <p className="text-[15px] font-bold text-muc leading-snug">Nhập điểm để so sánh với điểm dự đoán.</p>
            </div>
          )}
          {kl && <p className="mt-2.5 text-[14px] text-chu leading-snug">{kl.cau}</p>}
        </div>
      )}

      <div className="p-4 space-y-3">
        {!d && <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-muc"><TrendingUp size={20} className="shrink-0 text-xanh" />Xu hướng điểm chuẩn</h2>}
        {d ? (
          <>
            <h2 className="text-[14px] font-normal text-chu leading-snug">
              Điểm dự đoán: <b className="text-muc font-extrabold">{dinhDangDiem(d.kyVong)} điểm</b> ({d.moHinh === "hoc-may" ? `mô hình học máy LightGBM dự đoán từ điểm năm ${d.namCuoi}` : `dự đoán từ điểm năm ${d.namCuoi}`}).
            </h2>
            <p className="text-[13px] text-chu-phu leading-snug">{NHAN_DU_BAO(d.namDuBao)}{tt.loai === "motNam" ? ` ${NHAN_THAM_CHIEU_HAN_CHE}` : ""}</p>
            <ThanhDuBao d={d} diem={diem} xemThu={xemThu !== null} mau={mau} />
            <Nut kieu={moDoi ? "nhe" : "vien"} bieuTuong={SlidersHorizontal} aria-expanded={moDoi} onClick={batDoi}>{moDoi ? "Đóng Đổi điểm" : "Đổi điểm"}</Nut>
            {moDoi && diem !== null && (
              <BoDoiDiem gia={diem} nho={nho} lon={lon} goc={diemEm} onDoi={veDiemEm}
                moTaVT={`${dinhDangDiem(diem)} điểm${kl ? `, ${kl.nhan.toLowerCase()}, ${kl.chenh >= 0 ? "cao" : "thấp"} hơn điểm dự đoán ${dinhDangDiem(Math.abs(kl.chenh))} điểm` : ""}`} />
            )}
          </>
        ) : (
          <p className="text-[14px] text-chu leading-snug">Điểm chuẩn mới nhất đã cũ nên chưa dự báo được cho năm tới. Bạn xem lịch sử bên dưới để tham khảo.</p>
        )}

        <BieuDoLichSu diem={cacDiemHopLe(lc)} d={d} diemEm={diem} mau={mau} />
        {d && d.kyVong >= 30 && <p className="text-[13px] text-chu-phu leading-snug">Điểm dự đoán đã chạm trần 30 điểm của thang thi.</p>}
        {luuY.length > 0 && <ul className="space-y-1">{luuY.map((c) => <li key={c} className="text-[13px] text-chu-phu leading-snug">{c}</li>)}</ul>}
      </div>
    </section>
  );
}
