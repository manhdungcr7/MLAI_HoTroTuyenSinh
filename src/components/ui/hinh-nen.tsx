// Minh họa theo chủ đề "vở ô ly · mực xanh": tờ giấy ô ly, huy hiệu trường, ô biểu tượng. Không dùng ảnh thật.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ToneTen } from "@/state/types";
import { TONE_CHU, TONE_GD, TONE_NEN, TONE_NEN_HERO, gop } from "./nut-the";

/** Tờ giấy ô ly cho thẻ quan trọng nhất của màn (mục tiêu, kết luận). Tối đa một tờ mỗi màn. */
export function NenHero({ tone = "xanh", className, children }: { tone?: ToneTen; className?: string; children: ReactNode }) {
  return <div className={gop("relative overflow-hidden rounded-lon", TONE_NEN_HERO[tone], className)}>{children}</div>;
}

/** Huy hiệu trường: ô màu đặc + chữ viết tắt. Không dùng logo thật khi chưa được phép. */
export function HuyHieuTruong({ ten, tone = "xanh", kichThuoc = 44 }: { ten: string; tone?: ToneTen; kichThuoc?: number }) {
  const chu = ten.replace(/[^A-Za-zÀ-ỹ]/g, "").slice(0, 4).toUpperCase();
  return (
    <span aria-hidden className={gop("rounded-[10px] grid place-items-center text-white font-bold tracking-tight shrink-0", TONE_GD[tone])}
      style={{ width: kichThuoc, height: kichThuoc, fontSize: Math.max(10, kichThuoc * (chu.length > 3 ? 0.24 : 0.3)) }}>
      {chu}
    </span>
  );
}

/** Ô biểu tượng nền nhạt, nét theo tông: dùng cho đầu mục, nhãn môn học. Không còn vòng tròn màu đặc. */
export function BieuTuongTron({ icon: Icon, tone = "xanh", kichThuoc = 44 }: { icon: LucideIcon; tone?: ToneTen; kichThuoc?: number }) {
  return (
    <span aria-hidden className={gop("rounded-[30%] grid place-items-center shrink-0", TONE_NEN[tone], TONE_CHU[tone])} style={{ width: kichThuoc, height: kichThuoc }}>
      <Icon size={Math.round(kichThuoc * 0.48)} strokeWidth={2} />
    </span>
  );
}

/** Dải màu đặc có lưới ô ly mờ làm ảnh bìa trang chi tiết. */
export function AnhBia({ tone = "xanh", cao = 88, children }: { tone?: ToneTen; cao?: number; children?: ReactNode }) {
  return (
    <div className={gop("relative overflow-hidden rounded-t-lon o-ly-trang", TONE_GD[tone])} style={{ height: cao }}>
      {children}
    </div>
  );
}
