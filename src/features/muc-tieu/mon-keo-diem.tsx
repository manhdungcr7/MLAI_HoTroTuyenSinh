// Màn 16 · Môn nào kéo điểm nhanh nhất? (trang con của Mục tiêu)
import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CircleCheck, ClipboardList, Info, Plus, Target, Trophy, UserPen } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DuongXuHuong } from "@/components/ui/xu-huong";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { TEN_MON, type MonId, type ToneTen } from "@/state/types";
import { docMucTieu, type DuLieuMucTieu } from "./du-lieu";
import { BieuTuongMon, TONE_NHAN, ThangCongSuc } from "./thanh-phan";
import { TEN_CONG_SUC, TEN_XU_HUONG, diem1, goiYTuanNay, tenToHop, tongPhanBu, type MonKeoDiem } from "./tinh-toan";
import { dinhDangDiem } from "@/engine/dinh-dang";

const MAU_THANH: Record<ToneTen, string> = { xanh: "bg-xanh", luc: "bg-luc", cam: "bg-cam", do: "bg-do", tim: "bg-tim", muc: "bg-muc" };
const MAU_THANH_NHAT: Record<ToneTen, string> = { xanh: "bg-xanh/25", luc: "bg-luc/25", cam: "bg-cam/30", do: "bg-do/25", tim: "bg-tim/25", muc: "bg-muc/20" };

export default function MonKeoDiem() {
  const { s } = useApp();
  const nav = useNavigate();
  const d = docMucTieu(s);
  const [giaiThich, setGiaiThich] = useState<MonId | "chung" | null>(null);
  const monDangXem = d?.cacMon.find((m) => m.mon === giaiThich);

  const nutCachTinh = (
    <button type="button" onClick={() => setGiaiThich("chung")} aria-label="Cách mình tính"
      className="size-11 inline-grid place-items-center rounded-full text-xanh active:bg-xanh-nhat"><Info size={22} /></button>
  );

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Môn kéo điểm nhanh nhất" quayLai={DUONG_DAN.mucTieu()} phai={d ? nutCachTinh : undefined} />
      <NoiDung>
        {!d ? (
          <TrangThaiTrong bieuTuong={<Target size={28} />} tieuDe="Bạn chưa chọn mục tiêu chính"
            moTa="Cần biết ngành và trường bạn hướng tới để tính toán môn ưu tiên.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Khám phá ngành học</Nut>
          </TrangThaiTrong>
        ) : d.thieuDiem.length > 0 ? (
          <>
            <TrangThaiTrong bieuTuong={<UserPen size={28} />} tieuDe={`Chưa có điểm môn ${d.thieuDiem.map((m) => TEN_MON[m]).join(", ")}`}
              moTa={`Cần điểm đủ 3 môn của tổ hợp ${d.goc.maToHop} (${tenToHop(d.toHop)}) để so sánh các môn.`}>
              <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm các môn</Nut>
            </TrangThaiTrong>
          </>
        ) : (
          <NoiDungChinh d={d} moGiaiThich={setGiaiThich} />
        )}
      </NoiDung>

      <HopTruot mo={giaiThich === "chung"} dong={() => setGiaiThich(null)} tieuDe="Cách mình tính">
        <GiaiThichChung />
      </HopTruot>
      <HopTruot mo={!!monDangXem} dong={() => setGiaiThich(null)} tieuDe={monDangXem ? `Công sức môn ${monDangXem.ten}` : ""}>
        {monDangXem && <GiaiThichMon m={monDangXem} />}
      </HopTruot>
    </>
  );
}

function NoiDungChinh({ d, moGiaiThich }: { d: DuLieuMucTieu; moGiaiThich: (m: MonId) => void }) {
  const nav = useNavigate();
  const canBu = d.cacMon.filter((m) => m.thieu > 0);
  const bu = tongPhanBu(d.cacMon, d.conThieu);
  const goiY = goiYTuanNay(d.cacMon);

  return (
    <>
      <div className="text-center px-2">
        <h2 className="text-[17px] font-extrabold text-muc">Môn nào kéo điểm nhanh nhất?</h2>
      </div>

      <div className="rounded-the bg-trang border border-vien shadow-the p-3">
        <div className="grid grid-cols-3 divide-x divide-vien text-center">
          <span><span className="block text-[12px] text-chu-phu">Hiện tại</span><b className="text-[20px] text-xanh">{diem1(d.hienTai)}</b></span>
          <span><span className="block text-[12px] text-chu-phu">Mục tiêu</span><b className="text-[20px] text-muc">{diem1(d.mucTieu)}</b></span>
          <span><span className="block text-[12px] text-chu-phu">Còn thiếu</span><b className={gop("text-[20px]", d.conThieu > 0 ? "text-do-chu" : "text-luc-chu")}>{diem1(d.conThieu)}</b></span>
        </div>
        <p className="text-[13px] text-chu-phu text-center mt-2 pt-2 border-t border-vien">Tổ hợp {d.goc.maToHop}: {tenToHop(d.toHop)}</p>
      </div>

      {d.cacMon.map((m) => <TheMon key={m.mon} m={m} moGiaiThich={() => moGiaiThich(m.mon)} />)}

      {canBu.length > 0 ? (
        <div className="rounded-the bg-trang border border-vien shadow-the p-4">
          <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-muc"><Target size={22} className="text-do" />Đề xuất bù {diem1(d.conThieu)} điểm</h2>
          <div className="mt-3 flex items-stretch gap-1">
            {canBu.map((m, i) => (
              <Fragment key={m.mon}>
                {i > 0 && <Plus size={16} className="self-center shrink-0 text-chu-phu" aria-hidden />}
                <div className={gop("flex-1 min-w-0 rounded-xl py-2 px-1 text-center", TONE_NEN[TONE_NHAN[m.nhan]])}>
                  <span className="block text-[13px] text-chu truncate">{m.ten}</span>
                  <b className={gop("block text-[20px] leading-tight", TONE_CHU[TONE_NHAN[m.nhan]])}>+{diem1(m.thieu)}</b>
                </div>
              </Fragment>
            ))}
          </div>
          {bu.lech !== 0 && <p className="text-[12px] text-chu-phu mt-1.5">Tổng các môn là {diem1(bu.tong)} điểm, lệch {diem1(Math.abs(bu.lech))} do làm tròn.</p>}
          <div className="mt-3 rounded-xl bg-luc-nhat p-3 flex items-start gap-2.5">
            <CircleCheck size={20} className="text-luc shrink-0 mt-0.5" />
            <span>
              <b className="block text-[14px] text-luc-chu leading-snug">Cách bù điểm ít tốn sức nhất theo số liệu hiện có</b>
              <span className="block text-[13px] text-chu mt-0.5">Môn còn nhiều dư địa và môn bạn muốn cải thiện nhận phần lớn hơn.</span>
            </span>
          </div>
        </div>
      ) : (
        <DongThongBao tone="luc" icon={Trophy} tieuDe="Bạn đã đạt mục tiêu, không cần bù thêm điểm"
          moTa="Giữ vững cả 3 môn: mỗi tuần làm một đề và chữa kỹ câu sai để không bị tụt điểm." />
      )}

      <button type="button" onClick={() => nav(DUONG_DAN.tuan())} className="w-full text-left rounded-the bg-xanh-nhat p-4 active:brightness-95">
        <span className="flex items-center gap-2"><ClipboardList size={20} className="text-xanh" /><b className="flex-1 text-[16px] text-xanh">Điểm cần tập trung tuần này</b><ChevronRight size={18} className="text-chu-phu" /></span>
        <span className="block mt-2 space-y-1.5">
          {goiY.map((g) => (
            <span key={g.noiDung} className="flex items-start gap-2 text-[14px] text-chu">
              <CircleCheck size={18} className="text-xanh shrink-0 mt-0.5" />{g.noiDung}
            </span>
          ))}
        </span>
        <span className="block text-[13px] text-chu-phu mt-2">{canBu.length ? "Gợi ý theo môn nên ưu tiên." : "Gợi ý để giữ phong độ."} Bấm để xem trong kế hoạch tuần.</span>
      </button>

      <Nut muiTen onClick={() => nav(DUONG_DAN.tuan())}>Lập kế hoạch học</Nut>
    </>
  );
}

function TheMon({ m, moGiaiThich }: { m: MonKeoDiem; moGiaiThich: () => void }) {
  const tone = TONE_NHAN[m.nhan];
  return (
    <div className="rounded-the bg-trang border border-vien shadow-the p-4">
      <div className="flex items-center gap-3">
        <BieuTuongMon mon={m.mon} />
        <b className="flex-1 min-w-0 text-[17px] text-muc truncate">{m.ten}</b>
        <Nhan tone={tone} className="!text-[13px] !py-1">{m.nhan}</Nhan>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-end gap-x-2">
        <span><span className="block text-[12px] text-chu-phu">Điểm hiện tại</span><b className="text-[20px] text-muc">{diem1(m.hienTai)}</b></span>
        <ChevronRight size={18} className="text-chu-phu mb-1.5" aria-hidden />
        <span className="pl-1"><span className="block text-[12px] text-chu-phu">Cần đạt</span><b className="text-[20px] text-muc">{diem1(m.mucTieu)}</b></span>
        <span className="text-right"><span className="block text-[12px] text-chu-phu">Còn thiếu</span>
          <b className={gop("text-[20px]", m.thieu > 0 ? TONE_CHU[tone] : "text-luc-chu")}>{m.thieu > 0 ? `+${diem1(m.thieu)}` : "Đủ"}</b></span>
      </div>

      {/* Thanh thang 10: phần đậm là điểm hiện tại, phần nhạt là phần còn thiếu tới mức cần đạt. */}
      <div className="relative mt-2.5 h-2.5 rounded-full bg-vien overflow-hidden" role="img"
        aria-label={`${m.ten}: ${diem1(m.hienTai)} trên 10, cần đạt ${diem1(m.mucTieu)}`}>
        <span className={gop("absolute inset-y-0 left-0 rounded-full", MAU_THANH_NHAT[tone])} style={{ width: `${Math.min(100, m.mucTieu * 10)}%` }} />
        <span className={gop("absolute inset-y-0 left-0 rounded-full", MAU_THANH[tone])} style={{ width: `${Math.min(100, m.hienTai * 10)}%` }} />
      </div>

      <div className="mt-3 pt-2 border-t border-vien flex items-center justify-between gap-2">
        <span className="text-[13px] text-chu-phu">Công sức cần bỏ ra</span>
        <span className="flex items-center">
          <ThangCongSuc muc={m.congSuc.muc} />
          <button type="button" onClick={moGiaiThich} aria-label={`Vì sao công sức môn ${m.ten} là ${TEN_CONG_SUC[m.congSuc.muc]}`}
            className="size-11 -mr-2 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><Info size={18} /></button>
        </span>
      </div>
    </div>
  );
}

function GiaiThichMon({ m }: { m: MonKeoDiem }) {
  const cs = m.congSuc;
  const dong = (nhan: string, noiDung: React.ReactNode) => (
    <div className="flex justify-between gap-3 py-2 border-b border-vien text-[14px]"><span className="text-chu-phu">{nhan}</span><span className="text-right text-chu">{noiDung}</span></div>
  );
  return (
    <div className="space-y-3">
      <div>
        {dong("Còn thiếu", <b>+{diem1(m.thieu)} điểm ({diem1(m.hienTai)} → {diem1(m.mucTieu)})</b>)}
        {dong("Độ khó theo điểm hiện tại", <>×{cs.doKho} <span className="text-chu-phu">(càng gần 10 càng khó tăng)</span></>)}
        {dong("Xu hướng thi thử", <>{m.cacLan.length ? m.cacLan.map(diem1).join(" → ") : "chưa có"}, {TEN_XU_HUONG[m.xuHuong]} <span className="text-chu-phu">(×{cs.heSoXH})</span></>)}
        {dong("Kết quả", <b>{diem1(m.thieu)} × {cs.doKho} × {cs.heSoXH} ≈ {dinhDangDiem(cs.diem)} → {TEN_CONG_SUC[cs.muc]}</b>)}
      </div>
      {m.cacLan.length >= 2 && (
        <div className="flex items-center gap-3 rounded-xl bg-nen p-3">
          <DuongXuHuong gia={m.cacLan} tone={m.xuHuong === "giam" ? "do" : m.xuHuong === "tang" ? "luc" : "xanh"} />
          <span className="text-[13px] text-chu">{m.cacLan.length} lần thi thử gần nhất của môn {m.ten}.</span>
        </div>
      )}
      <p className="text-[13px] text-chu-phu">Dưới 0.5 là Thấp, từ 0.5 đến dưới 0.9 là Vừa, từ 0.9 là Cao. Nếu phải tăng sát 10 điểm thì luôn tính là Cao.</p>
      <p className="text-[13px] font-semibold text-cam-chu">Đây là ước tính từ số liệu bạn đã nhập, không phải cam kết.</p>
    </div>
  );
}

function GiaiThichChung() {
  return (
    <div className="space-y-3 text-[14px] text-chu">
      <p><b>Còn thiếu mỗi môn:</b> chia khoảng cách tổng cho 3 môn. Môn còn nhiều dư địa (xa điểm 10) và môn bạn ghi là cần cải thiện nhận phần lớn hơn.</p>
      <p><b>Công sức:</b> điểm còn thiếu × độ khó (điểm hiện tại càng cao càng khó tăng) × xu hướng các lần thi thử gần nhất (đang tăng thì nhẹ hơn, đang giảm thì nặng hơn). Chia 3 nấc Thấp · Vừa · Cao.</p>
      <div className="space-y-1.5">
        <p><Nhan tone="do">Nên ưu tiên</Nhan> môn còn thiếu nhiều nhất, hoặc môn cần nhiều công sức.</p>
        <p><Nhan tone="cam">Dễ tăng</Nhan> môn còn thiếu, công sức thấp hoặc vừa.</p>
        <p><Nhan tone="luc">Giữ vững</Nhan> môn còn thiếu dưới 0.25 điểm.</p>
      </div>
      <p className="text-[13px] font-semibold text-cam-chu">Mọi con số ở đây là ước tính, không phải cam kết.</p>
    </div>
  );
}
