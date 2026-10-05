// Cài đặt tự học: khung giờ, số giờ tối đa, thời điểm học tốt nhất, ngày nghỉ, nghỉ giữa buổi. Lưu ngay khi đổi.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarOff, Clock, Coffee, HeartHandshake, Hourglass, Minus, Moon, Plus, Sun, Sunset, Utensils, Wand2 } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { NenHero } from "@/components/ui/hinh-nen";
import { HangBam, Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { phutTuGio } from "@/engine/xep-lich";
import { homNay, tuanHienTai } from "@/state/chon";
import { useApp } from "@/state/store";
import type { CauHinhTuHoc } from "@/state/types";
import { NhomChon, OGio, TheCaiDat } from "./thanh-phan";
import { NHAN_THU, dangGio, soViet, uocLuongGioTuHoc } from "./tinh-tien-do";

const GIO_MIN = 1, GIO_MAX = 6;

export default function CaiDatTuHoc() {
  const { s, capNhatCauHinh, xepLai } = useApp();
  const nav = useNavigate();
  const cfg = s.cauHinh;
  const [daDoi, setDaDoi] = useState(false);
  // Giờ đang gõ: chỉ lưu vào cài đặt khi hợp lệ
  const [gio, setGio] = useState({ batDau: cfg.gioBatDau, ketThuc: cfg.gioKetThuc });
  const [canhBaoNghi, setCanhBaoNghi] = useState(false);

  const doi = (p: Partial<CauHinhTuHoc>) => { capNhatCauHinh(p); setDaDoi(true); };
  const khungDai = gio.batDau && gio.ketThuc ? phutTuGio(gio.ketThuc) - phutTuGio(gio.batDau) : 0;
  const loiGio = khungDai <= 0 ? "Giờ kết thúc phải sau giờ bắt đầu." : khungDai < 60 ? "Khung giờ nên dài ít nhất 1 giờ." : "";
  const doiGio = (k: "batDau" | "ketThuc", v: string) => {
    const moi = { ...gio, [k]: v };
    setGio(moi);
    if (moi.batDau && moi.ketThuc && phutTuGio(moi.ketThuc) - phutTuGio(moi.batDau) >= 60) doi({ gioBatDau: moi.batDau, gioKetThuc: moi.ketThuc });
  };
  const doiNgayNghi = (thu: number) => {
    const moi = cfg.ngayNghi.includes(thu) ? cfg.ngayNghi.filter((x) => x !== thu) : [...cfg.ngayNghi, thu].sort();
    if (moi.length >= 7) { setCanhBaoNghi(true); return; }
    setCanhBaoNghi(false);
    doi({ ngayNghi: moi });
  };

  const uoc = uocLuongGioTuHoc(s.coDinh, cfg, tuanHienTai());
  const tran = Math.round(cfg.gioHocToiDaMoiNgay * 60);
  const soNgayHoc = uoc.theoNgay.filter((n) => !n.nghi).length;
  const xepLaiGiupEm = () => { xepLai(tuanHienTai(), homNay()); nav(DUONG_DAN.tuan("lich")); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Cài đặt tự học" />
      <NoiDung>
        <NenHero tone="luc" className="p-4">
          <p className="text-[13px] font-bold text-chu-phu">Xem trước · tuần này</p>
          <p className="text-[15px] text-chu leading-snug mt-0.5">Mỗi tuần em có khoảng</p>
          <p className="text-[28px] font-extrabold text-muc leading-tight">{soViet(Math.round(uoc.tongPhut / 6) / 10)} giờ tự học</p>
          <p className="text-[13px] text-chu">{soNgayHoc} ngày học · tối đa {soViet(cfg.gioHocToiDaMoiNgay)} giờ mỗi ngày</p>
          <ul className="grid grid-cols-7 gap-1.5 mt-3" aria-label="Giờ tự học từng ngày">
            {uoc.theoNgay.map((n) => (
              <li key={n.ngay} className="flex flex-col items-center gap-1">
                <span className="h-14 w-full max-w-7 rounded-lg bg-trang/70 flex items-end overflow-hidden" aria-hidden>
                  <span className={gop("w-full rounded-lg", n.phut ? "gd-luc" : "")} style={{ height: `${tran ? Math.max(n.phut ? 8 : 0, (n.phut / tran) * 100) : 0}%` }} />
                </span>
                <span className={gop("text-[12px] font-bold", n.nghi ? "text-chu-phu" : "text-chu")}>{NHAN_THU[n.thu]}</span>
                <span className="sr-only">{n.nghi ? "nghỉ" : dangGio(n.phut)}</span>
              </li>
            ))}
          </ul>
          {uoc.tongPhut < 180 && <p className="text-[13px] text-cam-chu font-semibold mt-2">Tuần này còn ít giờ trống. Em có thể nới khung giờ hoặc bớt ngày nghỉ.</p>}
        </NenHero>

        <TheCaiDat icon={Clock} tone="xanh" tieuDe="Khung giờ mỗi ngày" moTa="Mình chỉ xếp giờ tự học trong khoảng này.">
          <div className="grid grid-cols-2 gap-2">
            <OGio nhan="Từ" giaTri={gio.batDau} onChange={(v) => doiGio("batDau", v)} loi={!!loiGio} />
            <OGio nhan="Đến" giaTri={gio.ketThuc} onChange={(v) => doiGio("ketThuc", v)} loi={!!loiGio} />
          </div>
          {loiGio && <p role="alert" className="text-[13px] text-do-chu mt-1.5">{loiGio} Mình vẫn giữ khung cũ {cfg.gioBatDau} – {cfg.gioKetThuc}.</p>}
        </TheCaiDat>

        <TheCaiDat icon={Hourglass} tone="tim" tieuDe="Tự học tối đa mỗi ngày" moTa="Tính cả buổi xem trước bài cho ngày mai.">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Bớt nửa giờ" disabled={cfg.gioHocToiDaMoiNgay <= GIO_MIN}
              onClick={() => doi({ gioHocToiDaMoiNgay: Math.max(GIO_MIN, cfg.gioHocToiDaMoiNgay - 0.5) })}
              className="size-12 rounded-xl border border-vien bg-trang grid place-items-center text-xanh active:bg-xanh-nhat disabled:opacity-40"><Minus size={20} /></button>
            <p className="flex-1 text-center" aria-live="polite">
              <b className="text-[26px] font-extrabold text-muc">{soViet(cfg.gioHocToiDaMoiNgay)}</b> <span className="text-[15px] font-bold text-chu-phu">giờ</span>
            </p>
            <button type="button" aria-label="Thêm nửa giờ" disabled={cfg.gioHocToiDaMoiNgay >= GIO_MAX}
              onClick={() => doi({ gioHocToiDaMoiNgay: Math.min(GIO_MAX, cfg.gioHocToiDaMoiNgay + 0.5) })}
              className="size-12 rounded-xl border border-vien bg-trang grid place-items-center text-xanh active:bg-xanh-nhat disabled:opacity-40"><Plus size={20} /></button>
          </div>
          <p className="text-[12px] text-chu-phu mt-1.5 text-center">Từ 1 đến 6 giờ, mỗi lần đổi nửa giờ.</p>
        </TheCaiDat>

        <TheCaiDat icon={Sun} tone="cam" tieuDe="Em học tốt nhất vào" moTa="Việc quan trọng sẽ được xếp gần khoảng này.">
          <NhomChon nhan="Thời điểm học tốt nhất" cot={3} giaTri={cfg.thoiDiemTot} onChange={(v) => doi({ thoiDiemTot: v })}
            cacLua={[{ gia: "sang", nhan: "Sáng", icon: Sun }, { gia: "chieu", nhan: "Chiều", icon: Sunset }, { gia: "toi", nhan: "Tối", icon: Moon }]} />
        </TheCaiDat>

        <TheCaiDat icon={CalendarOff} tone="do" tieuDe="Ngày nghỉ hẳn" moTa="Không xếp tự học vào những ngày em chọn.">
          <NhomChon nhan="Ngày nghỉ hẳn" cot={7} giaTri={cfg.ngayNghi} onChange={doiNgayNghi}
            cacLua={[1, 2, 3, 4, 5, 6, 7].map((t) => ({ gia: t, nhan: NHAN_THU[t] }))} />
          {canhBaoNghi && <p role="alert" className="text-[13px] text-do-chu mt-1.5">Em cần ít nhất một ngày để tự học.</p>}
        </TheCaiDat>

        <TheCaiDat icon={Coffee} tone="luc" tieuDe="Nghỉ giữa các buổi" moTa="Khoảng nghỉ ngắn giúp em tập trung lại.">
          <NhomChon nhan="Nghỉ giữa các buổi" cot={4} giaTri={cfg.nghiGiuaBuoi} onChange={(v) => doi({ nghiGiuaBuoi: v })}
            cacLua={[5, 10, 15, 20].map((p) => ({ gia: p, nhan: `${p} phút` }))} />
        </TheCaiDat>

        <DongThongBao tone="xanh" icon={Utensils} tieuDe="Giờ ăn luôn được giữ trống"
          moTa="Mình không xếp tự học vào 11:45 – 13:00 và 18:00 – 19:00 để em ăn uống, nghỉ ngơi." />
        <DongThongBao tone="tim" icon={HeartHandshake} tieuDe="Học vừa sức quan trọng hơn học nhiều"
          moTa="Nếu thấy mệt, em giảm số giờ tối đa hoặc chọn “Hơi mệt” ở trang Hôm nay, lịch sẽ nhẹ đi." />

        {daDoi && <p role="status" className="text-[13px] font-semibold text-luc-chu text-center">Đã lưu cài đặt. Bấm “Xếp lại lịch giúp em” để lịch tuần này đổi theo.</p>}
        <Nut bieuTuong={Wand2} onClick={xepLaiGiupEm}>Xếp lại lịch giúp em</Nut>
        <HangBam bieuTuong={CalendarDays} tieuDe="Lịch học của em"
          phu={s.coDinh.length ? `${s.coDinh.length} tiết cố định, giờ tự học sẽ tránh các tiết này` : "Chưa nhập lịch ở trường, học thêm"} onClick={() => nav(DUONG_DAN.caiDatLichHoc())} />
      </NoiDung>
    </>
  );
}
