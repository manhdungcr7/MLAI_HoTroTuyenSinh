// Thành phần dùng chung giữa hai màn của slice Nguyện vọng.
import { useCallback, useEffect, useRef, useState } from "react";
import { Info, Undo2 } from "lucide-react";
import { CAC_NHAN, TONE_NHAN } from "@/components/ui/co-cau";
import { TONE_GD, gop } from "@/components/ui/nut-the";
import type { NhanNguyenVong, ToneTen } from "@/state/types";

const NEN_DAM: Record<ToneTen, string> = { xanh: "bg-xanh", luc: "bg-luc", cam: "bg-cam", tim: "bg-tim", do: "bg-do", muc: "bg-muc" };

/** Ô số thứ tự NV1..NVn, gradient theo màu nhãn (chưa có nhãn thì màu chủ đạo). */
export function OSoThuTu({ viTri, nhan }: { viTri: number; nhan: NhanNguyenVong | null }) {
  return (
    <span aria-hidden className={gop("size-11 rounded-xl grid place-items-center text-white font-extrabold text-[14px] shrink-0 shadow-the", nhan ? TONE_GD[TONE_NHAN[nhan]] : "gd-muc")}>
      NV{viTri + 1}
    </span>
  );
}

/** Thanh cơ cấu thu nhỏ: một dải màu + chú thích 4 nhãn kèm số lượng. */
export function CoCauMini({ dem }: { dem: Record<NhanNguyenVong, number> }) {
  const tong = CAC_NHAN.reduce((s, n) => s + dem[n], 0);
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-trang/70" role="img" aria-label={CAC_NHAN.map((n) => `${n} ${dem[n]}`).join(", ")}>
        {CAC_NHAN.filter((n) => dem[n] > 0).map((n) => <span key={n} className={TONE_GD[TONE_NHAN[n]]} style={{ flex: dem[n] }} />)}
        {tong === 0 && <span className="flex-1 bg-vien" />}
      </div>
      <ul className="mt-2 grid grid-cols-4 gap-1 text-[12px] text-chu">
        {CAC_NHAN.map((n) => (
          <li key={n} className="flex items-center gap-1 min-w-0">
            <span aria-hidden className={gop("size-2 rounded-full shrink-0", NEN_DAM[TONE_NHAN[n]])} />
            <span className="truncate">{n}</span>
            <b className="text-muc">{dem[n]}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dòng nhắc bắt buộc: nhãn chỉ là gợi ý, số liệu trường là dữ liệu mẫu. */
export function GhiChuDuLieu() {
  return (
    <p className="flex gap-2 text-[13px] text-chu-phu leading-snug px-1">
      <Info size={16} className="shrink-0 mt-0.5" />
      <span>Nhãn là gợi ý theo điểm tham khảo năm trước, không phải cam kết trúng tuyển. Điểm là điểm chuẩn các năm trước; em đối chiếu với đề án của trường.</span>
    </p>
  );
}

// ---------- Thanh hoàn tác ----------

interface TinHoanTac { chu: string; hoanTac?: () => void; khoa: number }

/** Thanh thông báo nhỏ ở cuối màn, tự ẩn sau vài giây; có nút Hoàn tác khi truyền hàm hoàn tác. */
export function useHoanTac(thoiGian = 5000) {
  const [tin, setTin] = useState<TinHoanTac | null>(null);
  const hen = useRef<number | undefined>(undefined);
  const bao = useCallback((chu: string, hoanTac?: () => void) => {
    window.clearTimeout(hen.current);
    setTin({ chu, hoanTac, khoa: Date.now() });
    hen.current = window.setTimeout(() => setTin(null), thoiGian);
  }, [thoiGian]);
  const an = useCallback(() => { window.clearTimeout(hen.current); setTin(null); }, []);
  useEffect(() => () => window.clearTimeout(hen.current), []);
  return { tin, bao, an };
}

export function ThanhHoanTac({ tin, an }: { tin: TinHoanTac | null; an: () => void }) {
  return (
    <div aria-live="polite" role="status" className="fixed inset-x-0 z-40 mx-auto max-w-[430px] px-4 pointer-events-none bottom-[calc(76px+env(safe-area-inset-bottom))]">
      {tin && (
        <div key={tin.khoa} className="hien-len pointer-events-auto flex items-center gap-2 rounded-xl bg-muc text-white pl-4 pr-1.5 py-1.5 shadow-the">
          <span className="flex-1 min-w-0 text-[14px] font-semibold leading-snug py-2">{tin.chu}</span>
          {tin.hoanTac && (
            <button type="button" onClick={() => { tin.hoanTac?.(); an(); }}
              className="min-h-11 px-3 rounded-lg bg-white/15 font-bold text-[14px] inline-flex items-center gap-1.5 shrink-0 active:bg-white/25">
              <Undo2 size={16} />Hoàn tác
            </button>
          )}
        </div>
      )}
    </div>
  );
}
