// Màn 20 · Tiến độ & điều chỉnh (ref bo-A/10 phải + bo-C/10 phải).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bell, CalendarClock, CalendarDays, CalendarPlus, CalendarX2, CircleAlert, CircleCheck, Clock,
  Lightbulb, ListChecks, NotebookPen, RotateCcw, ShieldCheck, SkipForward, Sparkles, TrendingDown, TrendingUp, type LucideIcon,
} from "lucide-react";
import { DauTrangChinh, NoiDung, ThanhPhuKeHoach } from "@/components/layout/khung";
import { HopTruot, TieuDeMuc, TrangThaiTrong, VongTienDo } from "@/components/ui/hien-thi";
import { HangBam, Nut, The, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DuongXuHuong } from "@/components/ui/xu-huong";
import { DUONG_DAN } from "@/duong-dan";
import { congNgay } from "@/engine/xep-lich";
import { tuanHienTai } from "@/state/chon";
import { useApp } from "@/state/store";
import type { LichSuHoanThanh, ToneTen, TrangThaiViec } from "@/state/types";
import { loaiCuaCanhBao, taoCanhBao, type LoaiCanhBao } from "./canh-bao";
import { demTienDo, loiGhiNhan, ngayThang, nhanThoiDiem, soViet, soVoiTuanTruoc, xuHuongCacMon, type XuHuongMon } from "./tinh-tien-do";

const ICON_CANH_BAO: Record<LoaiCanhBao, LucideIcon> = {
  boLo: CircleAlert, trung: CalendarX2, dieuChinh: Lightbulb, boQua: SkipForward, chuaLich: CalendarPlus, tangDiem: TrendingUp,
};

const HOAT_DONG: Record<TrangThaiViec, { icon: LucideIcon; mau: string; nhan: string }> = {
  xong: { icon: CircleCheck, mau: "text-luc", nhan: "Đã xong" },
  doi: { icon: Clock, mau: "text-cam", nhan: "Đã dời" },
  boQua: { icon: SkipForward, mau: "text-chu-phu", nhan: "Đã bỏ qua" },
  chua: { icon: RotateCcw, mau: "text-xanh", nhan: "Làm lại" },
};

export default function TienDo() {
  const { s } = useApp();
  const nav = useNavigate();
  const [moLichSu, setMoLichSu] = useState(false);
  const bayGio = new Date();
  const thuHai = tuanHienTai();
  const td = demTienDo(s, bayGio);
  const ss = soVoiTuanTruoc(s.lichSu, bayGio, td.xong);
  const ghiNhan = loiGhiNhan(s, bayGio);
  const xuHuong = xuHuongCacMon(s);
  const canhBao = taoCanhBao(s, bayGio);
  const trongHet = !s.viec.length && !s.lichSu.length && !s.diemThi.length;

  return (
    <>
      <DauTrangChinh tieuDe="Tiến độ & điều chỉnh" moTa={`Tuần này · ${ngayThang(thuHai)} – ${ngayThang(congNgay(thuHai, 6))}`} />
      <ThanhPhuKeHoach />
      <NoiDung>
        {trongHet ? (
          <TrangThaiTrong bieuTuong={<BarChart3 size={26} />} tieuDe="Chưa có gì để theo dõi"
            moTa="Khi em có kế hoạch tuần và bắt đầu làm việc, tiến độ và lời nhắc điều chỉnh sẽ hiện ở đây.">
            <div className="space-y-2">
              <Nut muiTen onClick={() => nav(DUONG_DAN.tuan())}>Lập kế hoạch tuần</Nut>
              <Nut kieu="vien" bieuTuong={NotebookPen} onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập điểm thi thử</Nut>
            </div>
          </TrangThaiTrong>
        ) : (
          <>
            <TheTienDoTuan td={td} ss={ss} moTuan={() => nav(DUONG_DAN.tuan())} />
            {ghiNhan && <DongThongBao tone="luc" icon={Sparkles} tieuDe="Ghi nhận cho em" moTa={ghiNhan} />}

            <section aria-labelledby="kq-hoc-tap">
              <TieuDeMuc phai={<button type="button" onClick={() => nav(DUONG_DAN.diemThiThu())} className="min-h-11 -my-2 px-1">Nhập điểm</button>}>
                <span id="kq-hoc-tap">Kết quả học tập gần nhất</span>
              </TieuDeMuc>
              <KetQuaHocTap xuHuong={xuHuong} nhapDiem={() => nav(DUONG_DAN.diemThiThu())} />
            </section>

            <section aria-labelledby="hoat-dong">
              <TieuDeMuc phai={s.lichSu.length > 4 ? <button type="button" onClick={() => setMoLichSu(true)} className="min-h-11 -my-2 px-1">Xem tất cả</button> : undefined}>
                <span id="hoat-dong">Hoạt động gần đây</span>
              </TieuDeMuc>
              <The className="!py-1.5">
                {s.lichSu.length ? (
                  <DanhSachHoatDong ds={s.lichSu.slice(0, 4)} bayGio={bayGio} />
                ) : (
                  <p className="py-3 text-[14px] text-chu-phu">Chưa có hoạt động nào. Khi em hoàn thành, dời hay bỏ qua một việc, nó sẽ hiện ở đây.</p>
                )}
              </The>
            </section>

            <section aria-labelledby="luu-y" className="space-y-2">
              <TieuDeMuc><span id="luu-y" className="flex items-center gap-1.5"><Lightbulb size={18} className="text-cam" />Điều cần lưu ý</span></TieuDeMuc>
              {canhBao.length ? canhBao.map((c) => (
                <DongThongBao key={c.id} tone={c.tone} icon={ICON_CANH_BAO[loaiCuaCanhBao(c)]} tieuDe={c.tieuDe} moTa={c.moTa}
                  hanhDong={c.hanhDong ? `${c.hanhDong.nhan} ›` : undefined}
                  onClick={c.hanhDong ? () => nav(c.hanhDong!.den) : undefined} />
              )) : (
                <DongThongBao tone="luc" icon={ShieldCheck} tieuDe="Mọi thứ đang ổn"
                  moTa="Không có lịch trùng giờ hay buổi bị bỏ lỡ. Em cứ giữ nhịp như hiện tại nhé." />
              )}
            </section>

            {s.viec.length > 0 && (
              <Nut muiTen bieuTuong={CalendarClock} onClick={() => nav(DUONG_DAN.tuan("lich"))}>Xem đề xuất điều chỉnh</Nut>
            )}
          </>
        )}

        <section aria-labelledby="cai-dat" className="space-y-2 pt-1">
          <TieuDeMuc><span id="cai-dat">Điều chỉnh theo em</span></TieuDeMuc>
          <HangBam bieuTuong={CalendarDays} tone="xanh" tieuDe="Lịch học của em"
            phu={s.coDinh.length ? `${s.coDinh.length} tiết cố định mỗi tuần` : "Chưa nhập lịch ở trường, học thêm"} onClick={() => nav(DUONG_DAN.caiDatLichHoc())} />
          <HangBam bieuTuong={Clock} tone="luc" tieuDe="Cài đặt tự học"
            phu={`${s.cauHinh.gioBatDau} – ${s.cauHinh.gioKetThuc} · tối đa ${soViet(s.cauHinh.gioHocToiDaMoiNgay)} giờ/ngày`} onClick={() => nav(DUONG_DAN.caiDatTuHoc())} />
          <HangBam bieuTuong={Bell} tone="cam" tieuDe="Cài đặt nhắc nhở"
            phu={s.nhacNho.bat ? `Đang bật · nhắc trước ${s.nhacNho.truocPhut} phút` : "Đang tắt"} onClick={() => nav(DUONG_DAN.nhacNho())} />
        </section>
      </NoiDung>

      <HopTruot mo={moLichSu} dong={() => setMoLichSu(false)} tieuDe="Tất cả hoạt động">
        <p className="text-[13px] text-chu-phu mb-1">{s.lichSu.length} hoạt động gần nhất, mới nhất ở trên.</p>
        <DanhSachHoatDong ds={s.lichSu} bayGio={bayGio} />
      </HopTruot>
    </>
  );
}

function TheTienDoTuan({ td, ss, moTuan }: {
  td: ReturnType<typeof demTienDo>; ss: ReturnType<typeof soVoiTuanTruoc>; moTuan: () => void;
}) {
  if (!td.tong) {
    return (
      <The className="text-center space-y-3">
        <p className="font-extrabold text-muc text-[16px]">Tuần này chưa có việc nào</p>
        <p className="text-[14px] text-chu-phu">Lập kế hoạch tuần để mình theo dõi tiến độ cùng em.</p>
        <Nut muiTen onClick={moTuan}>Lập kế hoạch tuần</Nut>
      </The>
    );
  }
  const o: { so: number; nhan: string; icon: LucideIcon; tone: ToneTen }[] = [
    { so: td.xong, nhan: "Đã xong", icon: CircleCheck, tone: "luc" },
    { so: td.conLai, nhan: "Còn lại", icon: ListChecks, tone: "xanh" },
    { so: td.quaHan, nhan: "Quá hạn", icon: CircleAlert, tone: td.quaHan ? "do" : "muc" },
    { so: td.daDoi, nhan: "Đã dời", icon: Clock, tone: "cam" },
  ];
  return (
    <The className="space-y-4">
      <div className="flex items-center gap-4">
        <VongTienDo phanTram={td.phanTram} kichThuoc={96} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-muc">Tiến độ tuần</p>
          <p className="leading-tight mt-0.5"><b className="text-[26px] font-extrabold text-muc">{td.xong}/{td.tong}</b> <span className="text-[14px] font-bold text-chu-phu">việc đã xong</span></p>
          {ss && (
            <p className={gop("mt-1 text-[13px] font-bold flex items-center gap-1", ss.chenh > 0 ? "text-luc-chu" : "text-chu-phu")}>
              {ss.chenh > 0 ? <TrendingUp size={16} /> : ss.chenh < 0 ? <TrendingDown size={16} /> : <ArrowRight size={16} />}
              {ss.chenh > 0 ? `+${ss.chenh} việc so với tuần trước` : ss.chenh < 0 ? `Tuần trước em xong ${ss.tuanTruoc} việc` : "Bằng tuần trước"}
            </p>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {o.map((x) => (
          <li key={x.nhan} className={gop("rounded-xl py-2.5 px-1 text-center", x.tone === "muc" ? "bg-nen" : TONE_NEN[x.tone])}>
            <x.icon size={18} className={gop("mx-auto", x.tone === "muc" ? "text-chu-phu" : TONE_CHU[x.tone])} aria-hidden />
            <b className={gop("block text-[20px] leading-tight font-extrabold mt-0.5", x.tone === "do" ? "text-do-chu" : "text-muc")}>{x.so}</b>
            <span className={gop("block text-[12px] font-semibold whitespace-nowrap", x.tone === "do" ? "text-do-chu" : "text-chu-phu")}>{x.nhan}</span>
          </li>
        ))}
      </ul>
    </The>
  );
}

function KetQuaHocTap({ xuHuong, nhapDiem }: { xuHuong: XuHuongMon[]; nhapDiem: () => void }) {
  if (!xuHuong.length || xuHuong.every((x) => !x.gia.length)) {
    return (
      <The className="space-y-3">
        <p className="text-[14px] text-chu">Chưa có điểm thi thử nào. Sau mỗi lần thi, em nhập điểm để thấy mình tiến bộ thế nào.</p>
        <Nut kieu="nhe" bieuTuong={NotebookPen} onClick={nhapDiem}>Nhập điểm thi thử</Nut>
      </The>
    );
  }
  const thieu = xuHuong.some((x) => x.gia.length < 2);
  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {xuHuong.map((x) => {
          const tone: ToneTen = x.chenh === null ? "xanh" : x.chenh > 0 ? "luc" : x.chenh < 0 ? "cam" : "xanh";
          return (
            <li key={x.mon} className="rounded-the bg-trang border border-vien shadow-the p-3 min-w-0">
              <p className="text-[14px] font-extrabold text-muc truncate">{x.ten}</p>
              <div className="h-9 mt-1 flex items-center">
                {x.gia.length >= 2
                  ? <DuongXuHuong gia={x.gia} tone={tone} rong={76} cao={34} />
                  : <span aria-hidden className="block w-full border-t-2 border-dashed border-vien" />}
              </div>
              <p className="text-[20px] font-extrabold text-muc leading-tight">{x.moiNhat !== null ? x.moiNhat.toFixed(1) : "–"}</p>
              <p className={gop("text-[12px] font-bold flex items-center gap-0.5 whitespace-nowrap", x.chenh === null ? "text-chu-phu" : TONE_CHU[tone])}>
                {x.chenh === null ? "Chưa đủ dữ liệu"
                  : x.chenh > 0 ? <><TrendingUp size={14} />+{x.chenh.toFixed(1)}</>
                  : x.chenh < 0 ? <><TrendingDown size={14} />{x.chenh.toFixed(1)}</>
                  : <><ArrowRight size={14} />Ổn định</>}
              </p>
            </li>
          );
        })}
      </ul>
      {thieu && (
        <p className="mt-2 text-[13px] text-chu-phu">
          Cần ít nhất 2 lần thi của một môn để thấy xu hướng.{" "}
          <button type="button" onClick={nhapDiem} className="font-bold text-xanh min-h-11 align-middle">Nhập điểm thi thử</button>
        </p>
      )}
    </>
  );
}

function DanhSachHoatDong({ ds, bayGio }: { ds: LichSuHoanThanh[]; bayGio: Date }) {
  const { s } = useApp();
  const nav = useNavigate();
  return (
    <ul className="divide-y divide-vien">
      {ds.map((l, i) => {
        const h = HOAT_DONG[l.trangThai];
        const coViec = s.viec.some((v) => v.id === l.viecId);
        const noiDung = (
          <>
            <h.icon size={20} className={gop("shrink-0", h.mau)} aria-hidden />
            <span className="flex-1 min-w-0 text-[14px] text-chu leading-snug"><span className="sr-only">{h.nhan}: </span>{l.ten}</span>
            <span className="text-[12px] text-chu-phu whitespace-nowrap">{nhanThoiDiem(l.luc, bayGio)}</span>
          </>
        );
        return (
          <li key={`${l.viecId}-${l.luc}-${i}`}>
            {coViec ? (
              <button type="button" onClick={() => nav(DUONG_DAN.viec(l.viecId))} className="w-full min-h-12 py-2 flex items-center gap-2.5 text-left active:bg-xanh-nhat rounded-lg">{noiDung}</button>
            ) : (
              <div className="min-h-12 py-2 flex items-center gap-2.5">{noiDung}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
