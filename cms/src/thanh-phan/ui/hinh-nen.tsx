// Minh họa bằng gradient: thay cho ảnh nhân vật, logo trường, ảnh bìa mà ta không có.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ToneTen } from "@/state/types";
import { TONE_GD, TONE_NEN_HERO, gop } from "./nut-the";

/** Khối nền gradient mềm cho đầu trang/thẻ lớn. Có hai vòng tròn mờ làm điểm nhấn. */
export function NenHero({ tone = "xanh", className, children }: { tone?: ToneTen; className?: string; children: ReactNode }) {
  return (
    <div className={gop("relative overflow-hidden rounded-lon", TONE_NEN_HERO[tone], className)}>
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/50" />
      <span aria-hidden className="pointer-events-none absolute -left-6 -bottom-12 size-32 rounded-full bg-white/40" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Huy hiệu trường: ô gradient + chữ viết tắt. Không dùng logo thật khi chưa được phép. */
export function HuyHieuTruong({ ten, tone = "xanh", kichThuoc = 44 }: { ten: string; tone?: ToneTen; kichThuoc?: number }) {
  const chu = ten.replace(/[^A-Za-zÀ-ỹ]/g, "").slice(0, 4).toUpperCase();
  return (
    <span aria-hidden className={gop("rounded-xl grid place-items-center text-white font-extrabold shrink-0 shadow-the", TONE_GD[tone])}
      style={{ width: kichThuoc, height: kichThuoc, fontSize: Math.max(10, kichThuoc * (chu.length > 3 ? 0.24 : 0.3)) }}>
      {chu}
    </span>
  );
}

/** Vòng tròn gradient chứa biểu tượng: dùng cho thẻ lợi ích, nhãn môn học, đầu mục. */
export function BieuTuongTron({ icon: Icon, tone = "xanh", kichThuoc = 44 }: { icon: LucideIcon; tone?: ToneTen; kichThuoc?: number }) {
  return (
    <span aria-hidden className={gop("rounded-full grid place-items-center text-white shrink-0", TONE_GD[tone])} style={{ width: kichThuoc, height: kichThuoc }}>
      <Icon size={Math.round(kichThuoc * 0.5)} strokeWidth={2.2} />
    </span>
  );
}

/** Dải gradient làm ảnh bìa trang chi tiết. */
export function AnhBia({ tone = "xanh", cao = 88, children }: { tone?: ToneTen; cao?: number; children?: ReactNode }) {
  return (
    <div className={gop("relative overflow-hidden rounded-t-lon", TONE_GD[tone])} style={{ height: cao }}>
      <span aria-hidden className="absolute -right-6 -top-8 size-32 rounded-full bg-white/20" />
      <span aria-hidden className="absolute left-10 -bottom-10 size-28 rounded-full bg-white/15" />
      {children}
    </div>
  );
}
