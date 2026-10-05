import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChartColumn, Clock, Compass, GraduationCap, Landmark, Layers, ShieldCheck, Sparkles, Sprout, Target, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { HopTruot } from "@/components/ui/hien-thi";
import { Nut, TONE_GD, The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";

const LOI_ICH: { icon: LucideIcon; tone: ToneTen; tieu: string; phu: string }[] = [
  { icon: Target, tone: "do", tieu: "Biết mình hợp ngành nào", phu: "Dựa trên sở thích, năng lực và điểm số của em." },
  { icon: GraduationCap, tone: "xanh", tieu: "Lọc trường vừa sức, vừa túi tiền", phu: "Gợi ý theo điểm, học phí và cơ hội việc làm." },
  { icon: ChartColumn, tone: "luc", tieu: "Có lộ trình học để kéo gần mục tiêu", phu: "Biết cần chuẩn bị gì từ bây giờ." },
];

const BIEN: { nhan: string; icon: LucideIcon; tone: ToneTen; lech: string }[] = [
  { nhan: "Đại học", icon: Landmark, tone: "xanh", lech: "-rotate-6 -translate-x-1" },
  { nhan: "Ngành học", icon: Layers, tone: "luc", lech: "rotate-3 -translate-x-4" },
  { nhan: "Tương lai", icon: Sprout, tone: "cam", lech: "-rotate-3" },
];

/** Minh họa bằng gradient thay cho ảnh nhân vật: mũ tốt nghiệp ở giữa, ba tấm biển chỉ đường bên phải. */
function MinhHoa() {
  return (
    <div aria-hidden className="relative h-[190px] mt-2">
      <span className="absolute left-2 top-4 size-[150px] rounded-full bg-white/55" />
      <span className="absolute left-[38px] top-[40px]"><BieuTuongTron icon={GraduationCap} tone="xanh" kichThuoc={96} /></span>
      <span className="absolute left-0 top-[118px] shadow-the rounded-full"><BieuTuongTron icon={Compass} tone="tim" kichThuoc={40} /></span>
      <span className="absolute left-[128px] top-3 shadow-the rounded-full"><BieuTuongTron icon={Target} tone="cam" kichThuoc={34} /></span>
      <span className="absolute left-[138px] top-[132px] size-3 rounded-full bg-xanh/30" />
      <span className="absolute left-[20px] top-6 size-2 rounded-full bg-luc/40" />
      {/* cột biển chỉ đường */}
      <span className="absolute right-[68px] top-2 bottom-0 w-2 rounded-full bg-white/80" />
      <ul className="absolute right-1 top-3 flex flex-col items-end gap-3">
        {BIEN.map((b) => {
          const Icon = b.icon;
          return (
            <li key={b.nhan} className={gop("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-white text-[14px] font-extrabold shadow-nut", TONE_GD[b.tone], b.lech)}>
              <Icon size={16} strokeWidth={2.4} />{b.nhan}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ChaoMung() {
  const nav = useNavigate();
  const { s, dungHoSoMau } = useApp();
  const [hoiThay, setHoiThay] = useState(false);
  const h = s.hoSo;
  const dangDienDo = !!h.hoTen && !h.hoanTat;

  const xemMau = () => { dungHoSoMau(); nav(DUONG_DAN.homNay()); };
  // Hồ sơ mẫu thay toàn bộ dữ liệu trên máy, nên hỏi lại nếu em đã nhập gì đó.
  const bamXemMau = () => (h.hoTen ? setHoiThay(true) : xemMau());

  return (
    <div className="min-h-dvh pb-6">
      <NenHero tone="xanh" className="!rounded-t-none px-4 pt-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-bold text-luc-chu"><Sparkles size={13} />Miễn phí</span>
        </div>
        <MinhHoa />
        <h1 className="mt-3 text-[32px] leading-[1.12] font-extrabold text-muc">
          Chọn đúng trường,<br /><span className="text-xanh">đỡ chọn sai</span>
        </h1>
        <p className="text-[15px] text-chu mt-2.5 max-w-[330px]">Ứng dụng đồng hành giúp em khám phá ngành học phù hợp và xây dựng nguyện vọng vững vàng.</p>
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
        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>{dangDienDo ? "Điền tiếp hồ sơ" : "Bắt đầu nhanh"}</Nut>
        <Nut kieu="vien" bieuTuong={Sparkles} onClick={bamXemMau}>Xem thử bằng hồ sơ mẫu</Nut>
        {h.hoanTat && (
          <button type="button" onClick={() => nav(DUONG_DAN.homNay())} className="w-full min-h-12 text-[14px] font-bold text-xanh">Em đã có hồ sơ? Vào trang Hôm nay</button>
        )}
      </div>

      <p className="mx-4 mt-4 flex items-start justify-center gap-1.5 text-center text-[13px] text-chu-phu">
        <ShieldCheck size={16} className="text-luc shrink-0 mt-px" />Không cần tài khoản. Thông tin của em chỉ lưu trên điện thoại này.
      </p>

      <HopTruot mo={hoiThay} dong={() => setHoiThay(false)} tieuDe="Dùng hồ sơ mẫu?">
        <p className="text-[14px] text-chu">Hồ sơ mẫu "Minh Anh" sẽ <b>thay toàn bộ</b> thông tin em đã nhập trên máy này (hồ sơ, nguyện vọng, kế hoạch).</p>
        <div className="mt-4 space-y-2.5">
          <Nut kieu="nguyHiem" onClick={xemMau}>Thay bằng hồ sơ mẫu</Nut>
          <Nut kieu="vien" onClick={() => setHoiThay(false)}>Giữ hồ sơ của em</Nut>
        </div>
      </HopTruot>
    </div>
  );
}
