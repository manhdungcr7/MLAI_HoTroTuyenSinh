import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChartColumn, Clock, GraduationCap, ShieldCheck, Sparkles, Target, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { HopTruot } from "@/components/ui/hien-thi";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";

const LOI_ICH: { icon: LucideIcon; tone: ToneTen; tieu: string; phu: string }[] = [
  { icon: Target, tone: "do", tieu: "Biết mình hợp ngành nào", phu: "Dựa trên sở thích, năng lực và điểm số của em." },
  { icon: GraduationCap, tone: "xanh", tieu: "Lọc trường vừa sức, vừa túi tiền", phu: "Gợi ý theo điểm, học phí và cơ hội việc làm." },
  { icon: ChartColumn, tone: "luc", tieu: "Có lộ trình học để kéo gần mục tiêu", phu: "Biết cần chuẩn bị gì từ bây giờ." },
];

/** Ba ô trên phiếu nguyện vọng minh họa: tên nhóm ngành chung, không phải dữ liệu của ai. */
const PHIEU: { nganh: string; nhan: string; vien: string; chu: string }[] = [
  { nganh: "Công nghệ thông tin", nhan: "Thử sức", vien: "border-tim", chu: "text-tim-chu" },
  { nganh: "Kỹ thuật máy tính", nhan: "Vừa sức", vien: "border-cam", chu: "text-cam-chu" },
  { nganh: "Hệ thống thông tin", nhan: "An toàn", vien: "border-luc", chu: "text-luc-chu" },
];

/** Minh họa: một tờ phiếu nguyện vọng đặt nghiêng trên giấy ô ly, đúng việc app giúp em làm. */
function MinhHoa() {
  return (
    <div aria-hidden className="relative mt-4 mb-1 mx-1 -rotate-[1.5deg] rounded-the bg-trang border border-vien shadow-the p-3">
      <p className="so-lon text-[13px] font-bold text-chu-phu mb-2">Phiếu nguyện vọng</p>
      <ul className="space-y-1.5">
        {PHIEU.map((x, i) => (
          <li key={x.nganh} className="flex items-center gap-2.5">
            <span className={gop("size-9 rounded-lg border-2 bg-trang flex flex-col items-center justify-center leading-none shrink-0", x.vien, x.chu)}>
              <span className="text-[8px] font-bold">NV</span><span className="so-lon text-[15px] font-bold">{i + 1}</span>
            </span>
            <span className="flex-1 min-w-0 text-[14px] font-semibold text-chu truncate">{x.nganh}</span>
            <span className={gop("text-[12px] font-bold", x.chu)}>{x.nhan}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChaoMung() {
  const nav = useNavigate();
  const { s, dungHoSoMau, lamLai } = useApp();
  const [hoiThay, setHoiThay] = useState(false);
  const [hoiLamLai, setHoiLamLai] = useState(false);
  const h = s.hoSo;
  const daCoThongTin = Boolean(h.hoTen || h.khoi || h.tinh || h.nganhQuanTam.length || Object.values(h.diem).some((d) => d !== null));
  // Chỉ coi là đang điền dở nếu người dùng tự nhập (không phải hồ sơ mẫu) và chưa bấm hoàn tất
  const dangDienDo = daCoThongTin && !h.hoanTat && !h.laMau;

  const xemMau = () => { dungHoSoMau(); nav(DUONG_DAN.homNay()); };
  // Hồ sơ mẫu thay toàn bộ dữ liệu trên máy, nên hỏi lại nếu em đã nhập gì đó.
  const bamXemMau = () => (daCoThongTin ? setHoiThay(true) : xemMau());

  const thucLamLai = () => {
    lamLai();
    nav(DUONG_DAN.batDau(1));
  };

  const batDauMoi = () => {
    if (dangDienDo) {
      nav(DUONG_DAN.batDau(1));
    } else if (h.hoanTat) {
      setHoiLamLai(true);
    } else {
      thucLamLai();
    }
  };

  return (
    <div className="min-h-dvh pb-6">
      <NenHero tone="xanh" className="!rounded-t-none px-4 pt-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <Link
            to={DUONG_DAN.gioiThieu()}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 hover:bg-white text-xanh text-[12.5px] font-bold shadow-sm transition-all"
          >
            Giới thiệu
          </Link>
        </div>
        <MinhHoa />
        <h1 className="mt-5 text-[34px] leading-[1.08] font-bold text-muc">
          Xếp nguyện vọng vừa sức, rồi học để đạt
        </h1>
        <p className="text-[14.5px] text-chu mt-2 max-w-[340px] leading-relaxed">
          So điểm của em với điểm chuẩn thật các năm trước, chọn ngành hợp và lập kế hoạch học từng tuần.
        </p>
      </NenHero>

      <ul className="px-4 mt-4 space-y-2.5">
        {LOI_ICH.map((g) => (
          <li key={g.tieu}>
            <The className="flex items-center gap-3 !py-3">
              <BieuTuongTron icon={g.icon} tone={g.tone} kichThuoc={44} />
              <span className="min-w-0">
                <b className="block text-[15px] text-muc leading-snug">{g.tieu}</b>
                <span className="block text-[13px] text-chu-phu leading-snug mt-0.5">{g.phu}</span>
              </span>
            </The>
          </li>
        ))}
      </ul>

      <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-chu-phu mt-4"><Clock size={16} className="text-xanh" />Bắt đầu trong khoảng 60 giây</p>

      <div className="px-4 mt-3 space-y-2.5">
        <Nut muiTen onClick={batDauMoi}>{dangDienDo ? "Điền tiếp hồ sơ" : "Bắt đầu ngay"}</Nut>
        <Nut kieu="vien" bieuTuong={Sparkles} onClick={bamXemMau}>Xem hồ sơ mẫu</Nut>
        {h.hoanTat && (
          <button type="button" onClick={() => nav(DUONG_DAN.homNay())} className="w-full min-h-12 text-[14px] font-bold text-xanh">Vào trang Hôm nay</button>
        )}
      </div>

      <p className="mx-4 mt-4 flex items-start justify-center gap-1.5 text-center text-[13px] text-chu-phu">
        <ShieldCheck size={16} className="text-luc shrink-0 mt-px" />Không cần tài khoản. Thông tin chỉ lưu trên thiết bị này.
      </p>

      <HopTruot mo={hoiThay} dong={() => setHoiThay(false)} tieuDe="Dùng hồ sơ mẫu?">
        <p className="text-[14px] text-chu">Hồ sơ mẫu "Minh Anh" sẽ <b>thay toàn bộ</b> thông tin em đã nhập trên máy này (hồ sơ, nguyện vọng, kế hoạch).</p>
        <div className="mt-4 space-y-2.5">
          <Nut kieu="nguyHiem" onClick={xemMau}>Dùng hồ sơ mẫu</Nut>
          <Nut kieu="vien" onClick={() => setHoiThay(false)}>Giữ hồ sơ cũ</Nut>
        </div>
      </HopTruot>

      <HopTruot mo={hoiLamLai} dong={() => setHoiLamLai(false)} tieuDe="Xóa hết và làm lại?">
        <p className="text-[14px] text-chu">Mọi thông tin em đã nhập sẽ bị <b>xóa hoàn toàn</b> (hồ sơ, nguyện vọng, kế hoạch, mục tiêu). Em muốn xóa hết không?</p>
        <div className="mt-4 space-y-2.5">
          <Nut kieu="nguyHiem" onClick={thucLamLai}>Xóa hết</Nut>
          <Nut kieu="vien" onClick={() => setHoiLamLai(false)}>Giữ lại</Nut>
        </div>
      </HopTruot>
    </div>
  );
}
