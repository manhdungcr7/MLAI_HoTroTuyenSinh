import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Heart, ListPlus, X } from "lucide-react";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";

interface TinYeuThich {
  id: string;
  ten: string;
  daThich: boolean;
  daThemNV?: boolean;
  khoa: number;
}

export function ThongBaoYeuThich() {
  const { s, themNguyenVong } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const [tin, setTin] = useState<TinYeuThich | null>(null);
  const henRef = useRef<number | undefined>(undefined);
  useEffect(() => { setTin(null); window.clearTimeout(henRef.current); }, [location.pathname, location.search]);

  useEffect(() => {
    const xuLy = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; ten: string; daThich: boolean }>;
      if (!ce.detail) return;
      window.clearTimeout(henRef.current);
      setTin({
        id: ce.detail.id,
        ten: ce.detail.ten,
        daThich: ce.detail.daThich,
        daThemNV: false,
        khoa: Date.now(),
      });
      henRef.current = window.setTimeout(() => setTin(null), 4500);
    };

    window.addEventListener("nvai-thong-bao-tim", xuLy);
    return () => {
      window.removeEventListener("nvai-thong-bao-tim", xuLy);
      window.clearTimeout(henRef.current);
    };
  }, []);

  if (!tin) return null;

  const daTrongNV = s.nguyenVong.includes(tin.id) || tin.daThemNV;

  const themVaoNV = () => {
    if (!daTrongNV) {
      themNguyenVong(tin.id);
      setTin((t) => (t ? { ...t, daThemNV: true } : null));
      window.clearTimeout(henRef.current);
      henRef.current = window.setTimeout(() => setTin(null), 3500);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-50 mx-auto max-w-[430px] px-3 pointer-events-none bottom-[calc(4.8rem+env(safe-area-inset-bottom))]"
    >
      <div
        key={tin.khoa}
        className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-muc text-white p-2 shadow-the border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <span
          className={`size-9 rounded-xl grid place-items-center shrink-0 ${
            tin.daThich ? "bg-do/20 text-do" : "bg-white/10 text-white/70"
          }`}
        >
          <Heart size={18} fill={tin.daThich ? "currentColor" : "none"} />
        </span>

        <div className="flex-1 min-w-0 pr-0.5">
          <p className="text-[13px] font-bold leading-tight truncate">
            {tin.daThemNV
              ? "Đã thêm vào danh sách Nguyện Vọng"
              : tin.daThich
                ? "Đã lưu yêu thích"
                : "Đã bỏ lưu"}
          </p>
          <p className="text-[12px] text-white/70 leading-tight truncate mt-0.5">
            {tin.ten}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {tin.daThich && !daTrongNV && (
            <button
              type="button"
              onClick={themVaoNV}
              className="inline-flex items-center gap-1 min-h-11 px-2.5 rounded-lg bg-xanh text-[12px] font-bold text-white whitespace-nowrap active:brightness-90 cursor-pointer shadow-sm"
            >
              <ListPlus size={14} className="shrink-0" />
              + Thêm vào NV
            </button>
          )}

          {tin.daThich && daTrongNV && (
            <button
              type="button"
              onClick={() => {
                setTin(null);
                nav(DUONG_DAN.nguyenVong());
              }}
              className="inline-flex items-center gap-1 min-h-11 px-2.5 rounded-lg bg-luc/25 text-luc text-[12px] font-bold whitespace-nowrap active:bg-luc/35 cursor-pointer"
            >
              <Check size={14} className="shrink-0" />
              Xem NV
            </button>
          )}

          <button
            type="button"
            onClick={() => setTin(null)}
            aria-label="Đóng thông báo"
            className="size-11 grid place-items-center rounded-lg text-white/60 hover:text-white active:bg-white/10 cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
