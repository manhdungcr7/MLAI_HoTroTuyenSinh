// 4 chỉ số theo dõi tiến bộ: hồ sơ, nguyện vọng có căn cứ, nhiệm vụ tuần, khoảng cách tới mục tiêu.
import { ThanhTienDo } from "@/components/ui/hien-thi";
import { The } from "@/components/ui/nut-the";
import type { AppState } from "@/state/store";
import { chiSoTheoDoi } from "./tom-tat";

export function ChiSoTheoDoi({ s, gon }: { s: AppState; gon?: boolean }) {
  if (gon) {
    return (
      <The className="grid grid-cols-2 gap-x-4 gap-y-3">
        {chiSoTheoDoi(s).map((c) => (
          <div key={c.khoa} className="min-w-0">
            <p className="text-[20px] font-extrabold text-muc leading-none">{c.giaTri}</p>
            <p className="mt-1 text-[12px] text-chu-phu leading-snug">{c.ten}</p>
          </div>
        ))}
      </The>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2">
      {chiSoTheoDoi(s).map((c) => (
        <The key={c.khoa} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-bold text-chu">{c.ten}</p>
            <p className="text-[20px] font-extrabold text-muc leading-none">{c.giaTri}</p>
          </div>
          {c.phanTram !== null && <ThanhTienDo phanTram={c.phanTram} tone={c.tone} nhan={c.ten} cao="h-1.5" />}
          <p className="text-[13px] text-chu-phu leading-snug">{c.moTa}</p>
        </The>
      ))}
    </div>
  );
}
