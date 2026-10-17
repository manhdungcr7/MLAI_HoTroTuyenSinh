// Màn 16 · Môn nào kéo điểm nhanh nhất? (trang con của Mục tiêu)
import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CircleCheck, ClipboardList, Info, Plus, Sparkles, Target, Trophy, UserPen } from "lucide-react";
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
import {
  ChienLuocBuDiem,
  MO_TA_CHIEN_LUOC,
  TEN_CHIEN_LUOC,
  TEN_CONG_SUC,
  TEN_XU_HUONG,
  diem1,
  goiYTuanNay,
  phanLoaiMon,
  quyDoiSoCau,
  tenToHop,
  tinhPhanBoChienLuoc,
  tongPhanBu,
  type MonKeoDiem,
} from "./tinh-toan";
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
          <TrangThaiTrong bieuTuong={<Target size={28} />} tieuDe="Em chưa chọn mục tiêu chính"
            moTa="Cần biết ngành và trường em hướng tới để tính toán môn ưu tiên.">
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
  const { s } = useApp();
  const nav = useNavigate();
  const [chienLuoc, setChienLuoc] = useState<ChienLuocBuDiem>("duDia");
  const [monSoTruong, setMonSoTruong] = useState<MonId>(d.toHop[0]);

  // Tính lại phân bổ theo chiến lược người dùng lựa chọn
  const khoangCachMoi = tinhPhanBoChienLuoc(d.khoangCach, d.conThieu, chienLuoc, monSoTruong);
  const cacMon = phanLoaiMon(khoangCachMoi, s.diemThi);
  const canBu = cacMon.filter((m) => m.thieu > 0);
  const bu = tongPhanBu(cacMon, d.conThieu);
  const goiY = goiYTuanNay(cacMon);
  const monChinh = canBu[0]?.mon;

  return (
    <div className="space-y-4 pb-28">
      <div className="text-center px-2">
        <h2 className="text-[17px] font-extrabold text-muc">Môn nào kéo điểm nhanh nhất?</h2>
      </div>

      <div className="rounded-the bg-trang border border-vien shadow-the p-3">
        <div className="grid grid-cols-3 divide-x divide-vien text-center">
          <span><span className="block text-[13px] text-chu-phu">Hiện tại</span><b className="text-[20px] text-xanh">{diem1(d.hienTai)}</b></span>
          <span><span className="block text-[13px] text-chu-phu">Mục tiêu</span><b className="text-[20px] text-muc">{diem1(d.mucTieu)}</b></span>
          <span><span className="block text-[13px] text-chu-phu">Còn thiếu</span><b className={gop("text-[20px]", d.conThieu > 0 ? "text-do-chu" : "text-luc-chu")}>{diem1(d.conThieu)}</b></span>
        </div>
        <p className="text-[13px] text-chu-phu text-center mt-2 pt-2 border-t border-vien">Tổ hợp {d.goc.maToHop}: {tenToHop(d.toHop)}</p>
      </div>

      {cacMon.map((m) => (
        <TheMon key={m.mon} m={m} laMonChinh={m.mon === monChinh && canBu.length > 1} moGiaiThich={() => moGiaiThich(m.mon)} />
      ))}

      {canBu.length > 0 ? (
        <div className="rounded-the bg-trang border border-vien shadow-the p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-muc">
              <Target size={22} className="text-do" />Đề xuất bù {diem1(d.conThieu)} điểm
            </h2>
          </div>

          {/* Chọn 3 cách chia điểm */}
          <div>
            <span className="block text-[12px] font-medium text-chu-phu mb-1.5">Cách phân bổ điểm cần bù:</span>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-nen p-1 text-[13px] font-medium">
              {(["duDia", "canBang", "soTruong"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChienLuoc(k)}
                  className={gop(
                    "py-1.5 px-1 rounded-lg text-center truncate transition-colors",
                    chienLuoc === k ? "bg-trang text-xanh shadow-sm font-bold" : "text-chu-phu hover:text-chu"
                  )}
                >
                  {TEN_CHIEN_LUOC[k]}
                </button>
              ))}
            </div>

            {chienLuoc === "soTruong" && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[12px] text-chu-phu">Môn gánh chính:</span>
                {d.toHop.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonSoTruong(m)}
                    className={gop(
                      "px-2.5 py-1 rounded-full text-[12px] transition-colors border",
                      monSoTruong === m
                        ? "bg-xanh text-trang border-xanh font-bold shadow-sm"
                        : "bg-trang text-chu border-vien active:bg-nen"
                    )}
                  >
                    {TEN_MON[m]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3 ô môn phân bổ điểm và số câu trắc nghiệm quy đổi */}
          <div className="mt-3 flex items-stretch gap-1">
            {canBu.map((m, i) => {
              const laChinh = m.mon === monChinh && canBu.length > 1;
              return (
                <Fragment key={m.mon}>
                  {i > 0 && <Plus size={16} className="self-center shrink-0 text-chu-phu" aria-hidden />}
                  <div className={gop(
                    "flex-1 min-w-0 rounded-xl py-2 px-1 text-center relative transition-all",
                    TONE_NEN[TONE_NHAN[m.nhan]],
                    laChinh && "ring-2 ring-do/30"
                  )}>
                    {laChinh && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-do text-trang shadow-xs">
                        Ưu tiên
                      </span>
                    )}
                    <span className="block text-[13px] text-chu truncate font-medium">{m.ten}</span>
                    <b className={gop("block text-[20px] leading-tight", TONE_CHU[TONE_NHAN[m.nhan]])}>+{diem1(m.thieu)}</b>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-trang/80 text-chu-phu">
                      ~{quyDoiSoCau(m.mon, m.thieu)} câu
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>

          {bu.lech !== 0 && <p className="text-[13px] text-chu-phu mt-1.5">Tổng các môn là {diem1(bu.tong)} điểm, lệch {diem1(Math.abs(bu.lech))} do làm tròn.</p>}

          <div className="mt-3 rounded-xl bg-luc-nhat p-3 flex items-start gap-2.5">
            <CircleCheck size={20} className="text-luc shrink-0 mt-0.5" />
            <span>
              <b className="block text-[14px] text-luc-chu leading-snug">{TEN_CHIEN_LUOC[chienLuoc]}</b>
              <span className="block text-[13px] text-chu mt-0.5">{MO_TA_CHIEN_LUOC[chienLuoc]}</span>
            </span>
          </div>
        </div>
      ) : (
        <DongThongBao tone="luc" icon={Trophy} tieuDe="Em đã đạt mục tiêu, không cần bù thêm điểm"
          moTa="Giữ vững cả 3 môn: mỗi tuần làm một đề và chữa kỹ câu sai để không bị tụt điểm." />
      )}

      <button type="button" onClick={() => nav(DUONG_DAN.tuan())} className="w-full text-left rounded-the bg-xanh-nhat p-4 active:brightness-95">
        <span className="flex items-center gap-2">
          <ClipboardList size={20} className="text-xanh" />
          <b className="flex-1 text-[16px] text-xanh">Điểm cần tập trung tuần này</b>
          <ChevronRight size={18} className="text-chu-phu" />
        </span>
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
    </div>
  );
}

function TheMon({ m, laMonChinh, moGiaiThich }: { m: MonKeoDiem; laMonChinh?: boolean; moGiaiThich: () => void }) {
  const tone = TONE_NHAN[m.nhan];
  return (
    <div className={gop("rounded-the bg-trang border shadow-the p-4 transition-all", laMonChinh ? "border-cam/50 ring-1 ring-cam/20" : "border-vien")}>
      <div className="flex items-center gap-3">
        <BieuTuongMon mon={m.mon} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <b className="text-[17px] text-muc truncate">{m.ten}</b>
            {laMonChinh && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-cam-nhat text-cam-chu">
                <Sparkles size={11} /> Kéo nhanh
              </span>
            )}
          </div>
        </div>
        <Nhan tone={tone} className="!text-[13px] !py-1">{m.nhan}</Nhan>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-end gap-x-2">
        <span><span className="block text-[13px] text-chu-phu">Điểm hiện tại</span><b className="text-[20px] text-muc">{diem1(m.hienTai)}</b></span>
        <ChevronRight size={18} className="text-chu-phu mb-1.5" aria-hidden />
        <span className="pl-1"><span className="block text-[13px] text-chu-phu">Cần đạt</span><b className="text-[20px] text-muc">{diem1(m.mucTieu)}</b></span>
        <span className="text-right">
          <span className="block text-[13px] text-chu-phu">Còn thiếu</span>
          <b className={gop("text-[20px]", m.thieu > 0 ? TONE_CHU[tone] : "text-luc-chu")}>
            {m.thieu > 0 ? `+${diem1(m.thieu)}` : "Đủ"}
          </b>
        </span>
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
