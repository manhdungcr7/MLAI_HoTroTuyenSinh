// Màn 18 · Chi tiết việc: mục tiêu buổi học, các bước, tiêu chí hoàn thành, tài liệu, lý do; Hoàn thành / Dời lịch / Bỏ qua.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookMarked, CalendarClock, CalendarDays, Check, CheckCircle2, Clock, ExternalLink, Lightbulb, ListChecks, ListOrdered, RotateCcw, SearchX, SkipForward, Target,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { homNay, mucTieuDayDu } from "@/state/chon";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { useApp } from "@/state/store";
import type { ViecCanHoc } from "@/state/types";
import { phutBayGio, soPhut, tenNgay, thoiLuong } from "./dinh-dang";
import { MON_HIEN_THI, NhanUuTien, useDoiKhoi } from "./thanh-phan";
import { buoiNenHien, cacKhungDoiLich, khoiCuaViec } from "./tinh-toan";

export default function ChiTietViec() {
  const { id = "" } = useParams();
  const { s } = useApp();
  const nav = useNavigate();
  const v = s.viec.find((x) => x.id === id);
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Chi tiết việc" quayLai={DUONG_DAN.tuan()} />
      <NoiDung>
        {v ? <NoiDungViec v={v} /> : (
          <TrangThaiTrong bieuTuong={<SearchX size={26} />} tieuDe="Không tìm thấy việc này" moTa="Việc có thể đã bị xóa khi kế hoạch tuần thay đổi. Bạn quay lại Kế hoạch tuần để xem việc cần làm.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.tuan())}>Về Kế hoạch tuần</Nut>
          </TrangThaiTrong>
        )}
      </NoiDung>
    </>
  );
}

function TieuDeKhoi({ icon: Icon, children, phai }: { icon: typeof Target; children: React.ReactNode; phai?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
      <Icon size={19} className="text-xanh shrink-0" /><span className="flex-1">{children}</span>
      {phai && <span className="text-[13px] font-semibold text-chu-phu">{phai}</span>}
    </h2>
  );
}

function NoiDungViec({ v }: { v: ViecCanHoc }) {
  const { s, datTrangThaiViec, ghimKhoi } = useApp();
  const nav = useNavigate();
  const doiKhoi = useDoiKhoi();
  const hom = homNay();
  const [daTich, setDaTich] = useLuuCucBo<Record<string, number[]>>("ke-hoach-tieu-chi", {});
  const [moDoi, setMoDoi] = useState(false);
  const [moBoQua, setMoBoQua] = useState(false);
  const tt = s.trangThaiViec[v.id] ?? "chua";
  const mon = MON_HIEN_THI[v.mon];
  const khois = khoiCuaViec(s.khoiHoc, v.id);
  const buoi = buoiNenHien(khois, hom, hom);
  const tich = daTich[v.id] ?? [];
  const m = mucTieuDayDu(s);

  const veTuan = (thongBao: string) => nav(DUONG_DAN.tuan(), { state: { thongBao } });
  const doiTich = (i: number) => setDaTich((c) => ({ ...c, [v.id]: tich.includes(i) ? tich.filter((x) => x !== i) : [...tich, i] }));

  const phutDoi = buoi ? soPhut(buoi.batDau, buoi.ketThuc) : v.phut;
  const cacKhung = moDoi ? cacKhungDoiLich(phutDoi, buoi, { coDinh: s.coDinh, khoiHoc: s.khoiHoc, cfg: s.cauHinh, homNay: hom, phutBayGio: phutBayGio() }) : [];

  return (
    <>
      <The className="space-y-3">
        <div className="flex items-start gap-3">
          <BieuTuongTron icon={mon.icon} tone={mon.tone} kichThuoc={52} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-extrabold text-muc leading-snug">{v.tieuDe}</h2>
            <div className="mt-1"><NhanUuTien muc={v.mucUuTien} /></div>
          </div>
        </div>
        <p className="text-[14px] text-chu">{v.chiTiet}</p>
        <div className="border-t border-vien pt-2.5 space-y-1.5 text-[14px] text-chu">
          {khois.length === 0 ? (
            <p className="flex items-center gap-2 text-cam-chu font-semibold"><CalendarDays size={17} className="shrink-0" />Chưa xếp giờ · cần {thoiLuong(v.phut)}</p>
          ) : khois.map((k) => (
            <p key={k.id} className={gop("flex flex-wrap items-center gap-x-3 gap-y-1", k.id === buoi?.id ? "font-semibold" : "text-chu-phu")}>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} className="text-xanh shrink-0" />{tenNgay(k.ngay, hom)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={16} className="text-xanh shrink-0" />{k.batDau} – {k.ketThuc} ({thoiLuong(soPhut(k.batDau, k.ketThuc))})</span>
            </p>
          ))}
        </div>
      </The>

      {tt === "xong" && <DongThongBao tone="luc" icon={CheckCircle2} tieuDe="Bạn đã hoàn thành việc này" moTa="Làm tốt lắm! Việc đã được tính vào tiến độ tuần." />}
      {tt === "boQua" && <DongThongBao tone="muc" icon={SkipForward} tieuDe="Bạn đã bỏ qua việc này" moTa="Việc bỏ qua sẽ được xếp lại khi bạn bấm xếp lịch." />}

      <The className="space-y-2">
        <TieuDeKhoi icon={Target}>Mục tiêu buổi học</TieuDeKhoi>
        <p className="text-[14px] text-chu leading-relaxed">{v.mucTieuBuoi ?? v.chiTiet}</p>
      </The>

      <The className="space-y-2.5">
        <TieuDeKhoi icon={ListOrdered} phai={`Thời lượng ${thoiLuong(v.cacBuoc?.reduce((t, b) => t + b.phut, 0) || v.phut)}`}>Nội dung cụ thể</TieuDeKhoi>
        {v.cacBuoc?.length ? (
          <ol className={gop("grid gap-2", v.cacBuoc.length >= 3 ? "grid-cols-3" : v.cacBuoc.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
            {v.cacBuoc.map((b, i) => (
              <li key={i} className="rounded-xl bg-xanh-nhat px-2 py-2.5 text-center">
                <b className="block text-[20px] font-extrabold text-xanh leading-none">{b.phut}'</b>
                <span className="block text-[13px] text-chu leading-snug mt-1">{b.ten}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-[14px] text-chu">{v.chiTiet}</p>}
      </The>

      <The className="space-y-1">
        <TieuDeKhoi icon={ListChecks} phai={v.tieuChi.length ? `${tich.filter((i) => i < v.tieuChi.length).length}/${v.tieuChi.length}` : undefined}>Tiêu chí hoàn thành</TieuDeKhoi>
        {v.tieuChi.length ? (
          <ul>
            {v.tieuChi.map((c, i) => {
              const dang = tich.includes(i);
              return (
                <li key={i}>
                  <button type="button" role="checkbox" aria-checked={dang} onClick={() => doiTich(i)} className="w-full min-h-12 flex items-center gap-3 text-left py-1.5">
                    <span className={gop("size-6 rounded-full border-2 grid place-items-center shrink-0", dang ? "bg-luc border-luc text-white" : "border-chu-phu/50")}>{dang && <Check size={14} strokeWidth={3.5} />}</span>
                    <span className={gop("text-[14px] leading-snug", dang ? "text-chu-phu line-through" : "text-chu")}>{c}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-[14px] text-chu-phu">Việc này chưa có tiêu chí. Bạn tự đặt một kết quả nhỏ để biết mình đã làm đủ.</p>}
      </The>

      <The className="space-y-2">
        <TieuDeKhoi icon={BookMarked}>Tài liệu gợi ý</TieuDeKhoi>
        {v.taiLieu.length ? (
          <ul className="space-y-1.5">
            {v.taiLieu.map((t) => (
              <li key={t.ten} className="flex items-center gap-2 rounded-xl bg-nen px-3 min-h-12">
                <span className="size-1.5 rounded-full bg-xanh shrink-0" />
                <span className="flex-1 text-[14px] text-chu leading-snug py-2">{t.ten}</span>
                {t.link && (
                  <a href={t.link} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${t.ten}`} className="size-11 grid place-items-center rounded-full text-xanh active:bg-xanh-nhat"><ExternalLink size={18} /></a>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-[14px] text-chu-phu">Chưa có tài liệu gợi ý. Bạn dùng sách giáo khoa và vở ghi của mình là đủ.</p>}
      </The>

      <div className="rounded-the bg-cam-nhat p-4 flex gap-3">
        <Lightbulb size={22} className="text-cam shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-cam-chu">Vì sao buổi này quan trọng với mục tiêu?</h2>
          <p className="text-[14px] text-chu leading-relaxed mt-1">{v.lyDo}</p>
          {m && <p className="text-[13px] text-chu-phu mt-1.5">Mục tiêu của bạn: <b className="text-chu">{m.lc.nganh} – {m.lc.truong}</b></p>}
        </div>
      </div>

      {tt === "xong" ? (
        <Nut kieu="vien" bieuTuong={RotateCcw} onClick={() => datTrangThaiViec(v, "chua")}>Đánh dấu chưa xong</Nut>
      ) : tt === "boQua" ? (
        <Nut bieuTuong={RotateCcw} onClick={() => datTrangThaiViec(v, "chua")}>Làm lại việc này</Nut>
      ) : (
        <div className="space-y-2">
          <Nut bieuTuong={CheckCircle2} onClick={() => { datTrangThaiViec(v, "xong"); veTuan("Đã hoàn thành. Giỏi lắm!"); }}>Hoàn thành</Nut>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" bieuTuong={CalendarClock} onClick={() => setMoDoi(true)}>Dời lịch</Nut>
            <Nut kieu="nguyHiem" bieuTuong={SkipForward} onClick={() => setMoBoQua(true)}>Bỏ qua</Nut>
          </div>
        </div>
      )}

      <HopTruot mo={moDoi} dong={() => setMoDoi(false)} tieuDe="Dời sang giờ khác">
        <p className="text-[14px] text-chu-phu mb-3">Các khung trống gần nhất đủ {thoiLuong(phutDoi)}, không trùng lớp học và giờ ăn nghỉ.</p>
        {cacKhung.length ? (
          <ul className="space-y-2">
            {cacKhung.map((g) => (
              <li key={g.ngay + g.batDau}>
                <button type="button" onClick={() => {
                  if (buoi) doiKhoi(buoi, g);
                  else ghimKhoi({ viecId: v.id, ten: v.tieuDe, loai: "tuHoc", mon: v.mon, ...g });
                  datTrangThaiViec(v, "doi");
                  veTuan(`Đã dời sang ${tenNgay(g.ngay, hom).toLowerCase()} ${g.batDau}`);
                }} className="w-full min-h-14 flex items-center gap-3 rounded-xl border border-vien bg-trang px-3 text-left active:bg-xanh-nhat">
                  <span className="size-10 rounded-xl bg-luc-nhat text-luc-chu grid place-items-center shrink-0"><CalendarClock size={20} /></span>
                  <span className="flex-1 min-w-0">
                    <b className="block text-[15px] text-chu">{tenNgay(g.ngay, hom)}</b>
                    <span className="block text-[13px] text-chu-phu">{g.batDau} – {g.ketThuc}</span>
                  </span>
                  <span className="text-[13px] font-bold text-xanh">Chọn</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            <p className="text-[14px] text-chu">Tuần này không còn khung trống đủ dài. Bạn có thể nới giờ tự học hoặc bớt ngày nghỉ.</p>
            <Nut kieu="vien" onClick={() => nav(DUONG_DAN.caiDatTuHoc())}>Nới giờ tự học</Nut>
          </div>
        )}
      </HopTruot>

      <HopTruot mo={moBoQua} dong={() => setMoBoQua(false)} tieuDe="Bỏ qua việc này?">
        <p className="text-[14px] text-chu mb-4"><b>{v.tieuDe}</b> sẽ được bỏ khỏi danh sách cần làm tuần này.</p>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={() => setMoBoQua(false)}>Giữ lại</Nut>
          <Nut kieu="nguyHiem" bieuTuong={SkipForward} onClick={() => { datTrangThaiViec(v, "boQua"); veTuan("Đã bỏ qua việc này"); }}>Bỏ qua</Nut>
        </div>
      </HopTruot>
    </>
  );
}
