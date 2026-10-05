import { Navigate, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, CalendarDays, ChevronRight, Clock, Flag, Lightbulb, Target } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { SoLon } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { homNay, khoangCachCuaToi, khoiTrongNgay, mucTieuDayDu, tenGoi, tienDoTuan, viecConLai } from "@/state/chon";
import { CauNoiDongLuc, TamTrangHomNay } from "@/features/tu-hoc/widgets";

export default function HomNay() {
  const { s } = useApp();
  const nav = useNavigate();
  if (!s.hoSo.hoanTat && !s.hoSo.hoTen) return <Navigate to={DUONG_DAN.chao()} replace />;
  const m = mucTieuDayDu(s);
  const tiep = viecConLai(s)[0];
  const td = tienDoTuan(s);
  const khoiHomNay = khoiTrongNgay(s, homNay()).filter((k) => k.loai === "tuHoc").slice(0, 3);
  const monYeuNhat = khoangCachCuaToi(s).sort((a, b) => b.thieu - a.thieu)[0];

  return (
    <>
      <DauTrangChinh tieuDe={`Chào ${tenGoi(s.hoSo.hoTen)}!`} moTa={m ? "Cùng cố gắng hôm nay nhé." : "Hôm nay mình bắt đầu từ đâu nhỉ?"} />
      <NoiDung>
        {m ? (
          <button type="button" onClick={() => nav(DUONG_DAN.mucTieu())} className="w-full text-left active:opacity-90">
            <NenHero tone="xanh" className="p-4">
              <span className="flex items-center gap-3">
                <BieuTuongTron icon={Target} tone="xanh" kichThuoc={52} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] text-chu-phu">Mục tiêu mơ ước</span>
                  <b className="block text-[22px] text-muc leading-tight">{m.lc.nganh} – {m.lc.truong}</b>
                  <span className="block text-[13px] text-chu">Còn thiếu <b className="text-do-chu">{m.conThieu.toFixed(1)} điểm</b></span>
                </span>
                <ChevronRight className="text-chu-phu" />
              </span>
            </NenHero>
          </button>
        ) : (
          <NenHero tone="cam" className="p-4 text-center">
            <p className="font-extrabold text-muc">Em chưa chọn mục tiêu chính</p>
            <p className="text-[14px] text-chu my-1">Xem các ngành gợi ý rồi chọn một mục tiêu để mình lập kế hoạch cho em.</p>
            <Nut className="mt-2" muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Khám phá ngành học</Nut>
          </NenHero>
        )}

        {m && (
          <>
            <The className="grid grid-cols-2 divide-x divide-vien !p-3">
              <div className="flex items-center gap-2 pr-2"><BarChart3 className="text-xanh shrink-0" /><SoLon nhan="Điểm hiện tại" so={m.hienTai.toFixed(1)} don="/ 30" /></div>
              <div className="flex items-center gap-2 pl-3"><Flag className="text-do shrink-0" /><SoLon nhan="Điểm mục tiêu" so={m.mucTieu.toFixed(1)} don="/ 30" /></div>
            </The>
            <DongThongBao tone="do" icon={CalendarDays} tieuDe={<>Còn <b>{m.soNgayCon} ngày</b> đến kỳ thi THPT</>} moTa="Số ngày tính từ hôm nay đến ngày thi dự kiến." onClick={() => nav(DUONG_DAN.mucTieu())} />
          </>
        )}

        <TamTrangHomNay />

        {tiep ? (
          <button type="button" onClick={() => nav(DUONG_DAN.viec(tiep.id))} className="w-full text-left rounded-the bg-cam-nhat p-4 active:brightness-95">
            <span className="flex items-center justify-between"><b className="text-cam-chu text-[16px]">Việc nên làm tiếp</b><ChevronRight size={18} className="text-chu-phu" /></span>
            <span className="mt-2 flex gap-3 items-start"><BookOpen className="text-xanh shrink-0 mt-0.5" size={22} />
              <span><b className="block text-[15px] text-chu">{tiep.tieuDe}</b><span className="text-[13px] text-chu-phu">{tiep.chiTiet}</span></span></span>
          </button>
        ) : s.viec.length > 0 ? (
          <The tone="luc" className="font-bold text-chu">Em đã xong hết việc của tuần này. Nghỉ ngơi một chút nhé!</The>
        ) : null}

        {khoiHomNay.length > 0 && (
          <The className="space-y-2">
            <p className="font-extrabold text-muc text-[15px] flex items-center gap-1.5"><Clock size={16} className="text-xanh" />Giờ tự học hôm nay</p>
            {khoiHomNay.map((k) => (
              <div key={k.id} className="flex justify-between gap-2 text-[14px]"><span className="text-chu font-semibold">{k.ten}</span><span className="text-chu-phu whitespace-nowrap">{k.batDau}–{k.ketThuc}</span></div>
            ))}
          </The>
        )}

        {s.viec.length > 0 && (
          <button type="button" onClick={() => nav(DUONG_DAN.tienDo())} className="w-full text-left rounded-the bg-xanh-nhat p-4 active:brightness-95">
            <span className="flex items-center justify-between mb-2"><b className="text-xanh flex items-center gap-1.5"><CalendarDays size={18} />Nhịp học tuần này</b><b className="text-muc">{td.xong} / {td.tong} việc</b></span>
            <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, td.tong)}, minmax(0, 1fr))` }} aria-hidden>
              {Array.from({ length: td.tong }, (_, i) => <span key={i} className={gop("h-2.5 rounded-full", i < td.xong ? "bg-luc" : "bg-trang")} />)}
            </span>
          </button>
        )}

        <CauNoiDongLuc />

        {monYeuNhat && monYeuNhat.thieu > 0 && (
          <DongThongBao tone="tim" icon={Lightbulb} tieuDe="Gợi ý cho em" moTa={`Môn ${monYeuNhat.ten} còn thiếu ${monYeuNhat.thieu.toFixed(1)} điểm so với mục tiêu. Dành thời gian cho môn này sẽ có ích nhất.`} onClick={() => nav(DUONG_DAN.monKeoDiem())} />
        )}
      </NoiDung>
    </>
  );
}
