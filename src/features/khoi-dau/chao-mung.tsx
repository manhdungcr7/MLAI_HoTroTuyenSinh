import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { FeatureCareerFit, FeatureProgress, FeatureSchoolFilter } from "@/components/ui/bieu-tuong-nguyen-vong";
import { HopTruot } from "@/components/ui/hien-thi";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { coDuLieuNguoiDung } from "@/state/chon";
import type { ToneTen } from "@/state/types";

const LOI_ICH: { icon: LucideIcon; tone: ToneTen; tieu: string }[] = [
  { icon: FeatureCareerFit, tone: "do", tieu: "Biết mình hợp ngành nào" },
  { icon: FeatureSchoolFilter, tone: "xanh", tieu: "Lọc trường vừa sức, vừa túi tiền" },
  { icon: FeatureProgress, tone: "luc", tieu: "Có lộ trình học để kéo gần mục tiêu" },
];

/** Ba ô trên phiếu nguyện vọng minh họa: tên nhóm ngành chung, không phải dữ liệu của ai. */
const PHIEU: { nganh: string; nhan: string; vien: string; chu: string }[] = [
  { nganh: "Công nghệ thông tin", nhan: "Thử sức", vien: "border-tim", chu: "text-tim-chu" },
  { nganh: "Kỹ thuật máy tính", nhan: "Vừa sức", vien: "border-cam", chu: "text-cam-chu" },
  { nganh: "Hệ thống thông tin", nhan: "An toàn", vien: "border-luc", chu: "text-luc-chu" },
];

/** Minh họa: một tờ phiếu nguyện vọng đặt nghiêng trên giấy ô ly. */
function MinhHoa() {
  return (
    <div aria-hidden className="relative mt-4 mb-1 mx-1 -rotate-[1.5deg] rounded-the bg-trang border border-vien shadow-the p-3">
      <p className="so-lon text-[13px] font-bold text-chu-phu mb-2">Phiếu nguyện vọng</p>
      <ul className="space-y-1.5">
        {PHIEU.map((x, i) => (
          <li key={x.nganh} className="flex items-center gap-2.5">
            <span className={gop("min-w-10 px-1 h-9 rounded-lg border-2 bg-trang flex flex-col items-center justify-center leading-none shrink-0", x.vien, x.chu)}>
              <span className="text-[7.5px] font-bold tracking-tight">Nguyện Vọng</span><span className="so-lon text-[14px] font-bold">{i + 1}</span>
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
  const { s, lamLai } = useApp();
  const [hoiLamLai, setHoiLamLai] = useState(false);
  const h = s.hoSo;
  const daCoThongTin = coDuLieuNguoiDung(s);
  // Chỉ coi là đang điền dở nếu người dùng tự nhập (không phải hồ sơ mẫu) và chưa bấm hoàn tất
  const dangDienDo = daCoThongTin && !h.hoanTat && !h.laMau;

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
          {/* Logo dùng chung giữ nguyên; khung bọc cao 44px (kéo giãn link) nhưng chiếm 32px trong hàng */}
          <span className="inline-flex items-center h-11 -my-1.5 [&>a]:self-stretch">
            <Logo />
          </span>
          {/* Vùng bấm 44px cao; pill hiển thị vẫn ~27px như cũ */}
          <Link
            to={DUONG_DAN.gioiThieu()}
            className="inline-flex items-center min-h-11 px-1 -my-2.5 text-xanh"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-trang border border-vien text-[12.5px] font-bold shadow-sm transition-all">
              Giới thiệu
            </span>
          </Link>
        </div>
        <MinhHoa />
        <h1 className="mt-5 text-[34px] leading-[1.08] font-bold text-muc">
          Xếp nguyện vọng vừa sức, rồi học để đạt
        </h1>
        <p className="text-[14.5px] text-chu mt-2 max-w-[340px] leading-relaxed">
          So điểm với điểm chuẩn các năm trước, chọn ngành phù hợp và lập kế hoạch học từng tuần.
        </p>
      </NenHero>

      <ul className="px-4 mt-4 space-y-2.5">
        {LOI_ICH.map((g) => (
          <li key={g.tieu}>
            <The className="flex items-center gap-3 !py-3">
              <BieuTuongTron icon={g.icon} tone={g.tone} kichThuoc={40} />
              <b className="text-[15px] font-bold text-muc">{g.tieu}</b>
            </The>
          </li>
        ))}
      </ul>

      <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-chu-phu mt-4"><Clock size={16} className="text-xanh" />Bắt đầu trong khoảng 60 giây</p>

      <div className="px-4 mt-3 space-y-2.5">
        <Nut muiTen onClick={batDauMoi}>{dangDienDo ? "Điền tiếp hồ sơ" : "Bắt đầu ngay"}</Nut>
        {h.hoanTat && (
          <button type="button" onClick={() => nav(DUONG_DAN.homNay())} className="w-full min-h-12 text-[14px] font-bold text-xanh">Vào trang Hôm nay</button>
        )}
      </div>

      <p className="mx-4 mt-4 flex items-start justify-center gap-1.5 text-center text-[13px] text-chu-phu">
        <ShieldCheck size={16} className="text-luc shrink-0 mt-px" />Không cần tài khoản. Thông tin chỉ lưu trên thiết bị này.
      </p>


      <HopTruot mo={hoiLamLai} dong={() => setHoiLamLai(false)} tieuDe="Xóa hết và làm lại?">
        <p className="text-[14px] text-chu">Mọi thông tin bạn đã nhập sẽ bị <b>xóa hoàn toàn</b> (hồ sơ, nguyện vọng, kế hoạch, mục tiêu). Bạn muốn xóa hết không?</p>
        <div className="mt-4 space-y-2.5">
          <Nut kieu="nguyHiem" onClick={thucLamLai}>Xóa hết</Nut>
          <Nut kieu="vien" onClick={() => setHoiLamLai(false)}>Giữ lại</Nut>
        </div>
      </HopTruot>
    </div>
  );
}

