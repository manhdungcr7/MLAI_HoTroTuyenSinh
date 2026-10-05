import { useNavigate } from "react-router-dom";
import { Compass, Leaf, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { Logo } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { Nut, The } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";

const GIA_TRI: { icon: typeof Users; tone: ToneTen; tieu: string; phu: string }[] = [
  { icon: Users, tone: "xanh", tieu: "Biết mình hợp ngành nào", phu: "Dựa trên sở thích, năng lực và xu hướng nghề nghiệp." },
  { icon: Leaf, tone: "luc", tieu: "Lọc trường vừa sức, vừa túi tiền", phu: "Gợi ý theo điểm, học phí và cơ hội việc làm." },
  { icon: Target, tone: "cam", tieu: "Có lộ trình để kéo gần mục tiêu", phu: "Biết cần chuẩn bị gì từ bây giờ." },
];

export default function ChaoMung() {
  const nav = useNavigate();
  const { dungHoSoMau } = useApp();
  return (
    <div className="pb-8">
      <NenHero tone="xanh" className="rounded-t-none px-4 pt-4 pb-8">
        <Logo />
        <h1 className="mt-8 text-[32px] leading-[1.12] font-extrabold text-muc">
          Chọn đúng trường,<br /><span className="text-xanh">đỡ chọn sai</span>
        </h1>
        <p className="text-[14px] text-chu mt-3 max-w-[290px]">Ứng dụng đồng hành giúp em khám phá ngành học phù hợp và xây dựng nguyện vọng thông minh.</p>
      </NenHero>
      <ul className="px-4 -mt-4 space-y-3 relative">
        {GIA_TRI.map((g) => (
          <li key={g.tieu}>
            <The className="flex items-center gap-3">
              <BieuTuongTron icon={g.icon} tone={g.tone} kichThuoc={48} />
              <span><b className="block text-[15px] text-muc leading-snug">{g.tieu}</b><span className="text-[13px] text-chu-phu">{g.phu}</span></span>
            </The>
          </li>
        ))}
        <li className="flex items-center justify-center gap-2 text-[13px] text-chu-phu py-1"><Compass size={16} />Bắt đầu chỉ trong khoảng 60 giây</li>
        <li className="flex items-center justify-center gap-2 text-[12px] text-chu-phu"><ShieldCheck size={16} className="text-luc" />Thông tin của em chỉ lưu trên điện thoại này.</li>
      </ul>
      <div className="px-4 mt-5 space-y-2.5">
        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Bắt đầu nhanh</Nut>
        <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => { dungHoSoMau(); nav(DUONG_DAN.homNay()); }}>Xem thử bằng hồ sơ mẫu</Nut>
      </div>
    </div>
  );
}
