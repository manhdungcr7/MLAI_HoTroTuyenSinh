// Thành phần dùng riêng trong slice Kế hoạch tuần.
import { useCallback, useEffect, useRef, useState } from "react";
import { Atom, BookOpen, Check, CheckCircle2, FlaskConical, Languages, Leaf, Sigma, type LucideIcon } from "lucide-react";
import { Nhan, gop } from "@/components/ui/nut-the";
import type { KhungGoiY } from "@/engine/xep-lich";
import { useApp } from "@/state/store";
import type { KhoiHoc, MonId, ToneTen } from "@/state/types";
import { NHAN_UU_TIEN, type MucUuTien } from "./tinh-toan";

/** Biểu tượng và tông màu cố định cho từng môn trong slice này. */
export const MON_HIEN_THI: Record<MonId, { icon: LucideIcon; tone: ToneTen }> = {
  toan: { icon: Sigma, tone: "cam" },
  vatLy: { icon: Atom, tone: "xanh" },
  hoaHoc: { icon: FlaskConical, tone: "tim" },
  sinh: { icon: Leaf, tone: "luc" },
  nguVan: { icon: BookOpen, tone: "muc" },
  tiengAnh: { icon: Languages, tone: "do" },
};

export function NhanUuTien({ muc }: { muc: MucUuTien }) {
  const n = NHAN_UU_TIEN[muc];
  return <Nhan tone={n.tone}>{n.nhan}</Nhan>;
}

/** Thông báo ngắn nổi phía trên thanh tab, tự ẩn sau vài giây. */
export function useThongBaoNgan(): [React.ReactNode, (chu: string) => void] {
  const [chu, setChu] = useState<string | null>(null);
  const hen = useRef<number | undefined>(undefined);
  const hien = useCallback((c: string) => {
    setChu(c);
    window.clearTimeout(hen.current);
    hen.current = window.setTimeout(() => setChu(null), 2800);
  }, []);
  useEffect(() => () => window.clearTimeout(hen.current), []);
  const node = (
    <div aria-live="polite" role="status" className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 pointer-events-none">
      {chu && (
        <span className="hien-len max-w-[398px] inline-flex items-center gap-2 rounded-xl bg-muc text-white text-[14px] font-semibold px-4 py-3 shadow-the">
          <CheckCircle2 size={18} className="text-luc shrink-0" />{chu}
        </span>
      )}
    </div>
  );
  return [node, hien];
}

/**
 * Dời một khối sang giờ mới và khóa lại để "Xếp lịch giúp em" không động vào.
 * Việc chỉ có một buổi thì dùng ghimKhoi (thay cả việc); việc có nhiều buổi thì chỉ dời đúng buổi đó.
 */
export function useDoiKhoi() {
  const { s, ghimKhoi, xoaKhoi, themKhoi } = useApp();
  return (k: KhoiHoc, moi: KhungGoiY) => {
    const { id, khoa: _khoa, ...con } = k;
    const cacBuoi = k.viecId ? s.khoiHoc.filter((b) => b.viecId === k.viecId) : [];
    if (k.viecId && cacBuoi.length <= 1) { ghimKhoi({ ...con, ...moi }); return; }
    xoaKhoi(id);
    themKhoi({ ...con, ...moi, khoa: true });
    // Xếp lịch giúp em bỏ qua việc đã có buổi khóa giờ, nên khóa luôn các buổi còn lại để việc không bị mất buổi.
    for (const b of cacBuoi) {
      if (b.id === id || b.khoa) continue;
      const { id: idCu, ...conB } = b;
      xoaKhoi(idCu);
      themKhoi({ ...conB, khoa: true });
    }
  };
}

/** Ô tròn đánh dấu xong. Vùng bấm 48px dù ô nhìn thấy nhỏ hơn. */
export function OTichTron({ xong, onDoi, nhan, tat }: { xong: boolean; onDoi: () => void; nhan: string; tat?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={xong} aria-label={nhan} disabled={tat} onClick={onDoi}
      className="size-12 shrink-0 grid place-items-center rounded-full active:bg-xanh-nhat disabled:opacity-60">
      <span className={gop("size-6 rounded-full border-2 grid place-items-center transition-colors", xong ? "bg-luc border-luc text-white" : "border-chu-phu/50 bg-trang")}>
        {xong && <Check size={15} strokeWidth={3.5} />}
      </span>
    </button>
  );
}
