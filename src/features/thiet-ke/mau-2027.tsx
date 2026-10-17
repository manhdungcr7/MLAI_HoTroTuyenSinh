// Xem thử nền thiết kế 2027 (chỉ dev). Số trong trang này là MINH HỌA, không phải số liệu thật.
import { useState } from "react";
import { BookOpen, Cpu, Heart, LineChart, Newspaper, Scale, SlidersHorizontal, Wrench } from "lucide-react";
import {
  ChipLoc, HangChipLoc, NenTrangTroi, HangKeoTha, HienDan, HuyHieuTruong, MAU_NHAN_NV, MAU_VI_TRI, ONhom, PillTrangThai, TabPhan, TheNen, ThanhTienDo,
  THU_TU_NHAN_NV, THU_TU_TONG_NHOM, ToastNho, VongDiem, type TongNhom,
} from "@/components/ui/thiet-ke";
import { MauChuyenDong } from "@/components/ui/thiet-ke/mau-chuyen-dong";
import type { ViTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";
import type { ToneTen } from "@/state/types";

const NHOM: [typeof Cpu, string, number][] = [[Wrench, "Kỹ thuật", 155], [Cpu, "CNTT", 131], [LineChart, "Kinh tế", 130], [Newspaper, "Báo chí", 40], [Scale, "Luật", 28], [BookOpen, "Sư phạm", 60]];
const VI_TRI: ViTriSoVoiDuBao[] = ["caoHonCa", "tren", "trongKhoang", "duoi", "thapHonCa"];
const HUY: [string, ToneTen][] = [["DSG", "cam"], ["LPH", "tim"], ["KHA", "xanh"], ["YDS", "luc"], ["BVU", "do"], ["HQT", "muc"]];

export function Mau2027() {
  const [tab, setTab] = useState("muc-tieu");
  const [chon, setChon] = useState("tat-ca");
  const [ds, setDs] = useState(["Luật Kinh tế", "Quản trị kinh doanh", "Công nghệ thông tin"]);
  const [toast, setToast] = useState(false);
  const doiCho = (tu: number, den: number) => { const m = [...ds]; const [x] = m.splice(tu, 1); m.splice(den, 0, x); setDs(m); setToast(true); };
  return (
    <section className="space-y-4">
      <NenTrangTroi />
      <h2 className="text-[18px] font-bold text-muc">Nền thiết kế 2027</h2>
      <TabPhan nhan="Mục của kế hoạch" gia={tab} onChange={setTab} cacTab={[{ gia: "muc-tieu", nhan: "Mục tiêu" }, { gia: "tuan", nhan: "Kế hoạch tuần" }, { gia: "tien-do", nhan: "Tiến độ" }]} />
      <HangChipLoc nhan="Lọc ngành">
        <ChipLoc chon={chon === "tat-ca"} onClick={() => setChon("tat-ca")} icon={SlidersHorizontal}>Tất cả</ChipLoc>
        {NHOM.map(([I, t]) => <ChipLoc key={t} chon={chon === t} onClick={() => setChon(t)} icon={I}>{t}</ChipLoc>)}
      </HangChipLoc>
      <TheNen tong="xanh" className="flex items-center gap-4">
        <VongDiem value={20} max={30} nhanGiua="/30 điểm" tong="luc" />
        <div className="space-y-2 min-w-0"><p className="text-[13px] text-chu-phu">Hồ sơ hoàn thiện</p><VongDiem value={75} max={100} dinhDang={(n) => `${Math.round(n)}%`} tong="xanh" size={72} /></div>
        <VongDiem value={null} size={72} />
      </TheNen>
      <div className="grid grid-cols-3 gap-2">{NHOM.map(([I, t, n], i) => <ONhom key={t} icon={I} ten={t} soNganh={n} tong={THU_TU_TONG_NHOM[i] as TongNhom} onClick={() => setChon(t)} />)}</div>
      <TheNen><ThanhTienDo phanTram={71} nhan="Đạt so với điểm mục tiêu" /></TheNen>
      <div className="flex flex-wrap gap-2">{THU_TU_NHAN_NV.map((n) => <PillTrangThai key={n} tong={MAU_NHAN_NV[n].tong} icon={MAU_NHAN_NV[n].icon}>{n}</PillTrangThai>)}</div>
      <div className="flex flex-wrap gap-2">{VI_TRI.map((k) => { const m = MAU_VI_TRI[k]; return <span key={k} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold ${m.nen} ${m.chu}`}><m.icon size={14} aria-hidden />{m.nhan}</span>; })}</div>
      <div className="flex gap-2">{HUY.map(([t, tone]) => <HuyHieuTruong key={t} ten={t} tone={tone} />)}</div>
      <HangKeoTha muc={ds} khoa={(m) => m} ten={(m) => m} onDoiCho={doiCho}
        veMuc={(m, i, dk) => (
          <TheNen className="flex items-center gap-3 !p-2"><span className="w-5 text-center font-bold text-chu-phu">{i + 1}</span><span className="flex-1 font-bold text-muc">{m}</span><Heart size={18} className="text-chu-phu" aria-hidden />{dk}</TheNen>
        )} />
      <HienDan className="space-y-2">{["Thẻ một", "Thẻ hai", "Thẻ ba"].map((t) => <TheNen key={t}>{t} (hiện dần, so le)</TheNen>)}</HienDan>
      <ToastNho mo={toast} noiDung="Đã đổi thứ tự nguyện vọng" hoanTac={() => setDs(["Luật Kinh tế", "Quản trị kinh doanh", "Công nghệ thông tin"])} dong={() => setToast(false)} />
      <MauChuyenDong />
    </section>
  );
}
