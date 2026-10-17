// Thanh 3 tab của tab Kế hoạch (Mục tiêu · Kế hoạch tuần · Tiến độ): TabPhan của nền thiết kế, chuyển bằng route.
import { useLocation, useNavigate } from "react-router-dom";
import { TabPhan } from "@/components/ui/thiet-ke";
import { CAC_MUC_KE_HOACH } from "@/duong-dan";

type Id = (typeof CAC_MUC_KE_HOACH)[number]["id"];

export function ThanhTabKeHoach() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const dang = (CAC_MUC_KE_HOACH.find((m) => m.khop(pathname))?.id ?? "mucTieu") as Id;
  return (
    <nav aria-label="Mục của Kế hoạch" className="px-4 pb-3">
      <TabPhan nhan="Mục của Kế hoạch" gia={dang} onChange={(g) => nav(CAC_MUC_KE_HOACH.find((m) => m.id === g)!.den)}
        cacTab={CAC_MUC_KE_HOACH.map((m) => ({ gia: m.id as Id, nhan: m.nhan }))} />
    </nav>
  );
}
