// Trạng thái kết nối phía trình duyệt và các thao tác (bật, đồng bộ, ngắt). Dùng chung cho màn Cài đặt và thẻ đề xuất toàn cục.
import { useSyncExternalStore } from "react";
import type { AppState } from "@/state/store";
import { docKetNoi, ghiKetNoi, taoBanChup, xoaKetNoi } from "@/state/ket-noi";
import { dongBoKetNoi, LOI_HET_HAN, layTrangThai, ngatKetNoi, taoKetNoi, type TaoKetNoi, type TrangThaiKetNoi } from "./api";

export interface TrangKetNoi {
  ma: string | null;
  hetHan: string | null;
  soTruyCap: number;
  lanCuoi: string | number | null; // lần đồng bộ thành công gần nhất (giờ máy)
  loi: string | null;
  dang: boolean;
}

let trang: TrangKetNoi | null = null;
const ngheTheo = new Set<() => void>();

function doc(): TrangKetNoi {
  if (!trang) {
    const k = docKetNoi();
    trang = { ma: k?.ma ?? null, hetHan: k?.hetHan ?? null, soTruyCap: 0, lanCuoi: null, loi: null, dang: false };
  }
  return trang;
}

function sua(p: Partial<TrangKetNoi>) {
  trang = { ...doc(), ...p };
  ngheTheo.forEach((f) => f());
}

function theoDoi(f: () => void) {
  ngheTheo.add(f);
  return () => { ngheTheo.delete(f); };
}

/** Trạng thái kết nối; đổi ở đâu thì mọi nơi đang hiển thị đều cập nhật. */
export function useKetNoi(): TrangKetNoi {
  return useSyncExternalStore(theoDoi, doc, doc);
}

const gioNay = () => new Date().toISOString();

/** Tạo liên kết mới (sau khi em đồng ý). Liên kết MCP và GPT Actions chỉ trả về MỘT lần để hiển thị. */
export async function batKetNoi(s: AppState): Promise<{ ok: true; du: TaoKetNoi } | { ok: false; loi: string }> {
  sua({ dang: true, loi: null });
  // "Tạo lại": thu hồi mã cũ trước. Nếu không, mã cũ vẫn đọc được hồ sơ đến khi hết hạn và app đã mất mã nên không thu hồi được nữa.
  const cu = doc().ma;
  if (cu) {
    const g = await ngatKetNoi(cu);
    if (!g.ok && !g.hetHan) { sua({ dang: false, loi: g.loi }); return { ok: false, loi: g.loi }; }
  }
  const kq = await taoKetNoi(taoBanChup(s));
  if (!kq.ok) { sua({ dang: false, loi: kq.loi }); return { ok: false, loi: kq.loi }; }
  ghiKetNoi({ ma: kq.du.ma, hetHan: kq.du.hetHan });
  sua({ ma: kq.du.ma, hetHan: kq.du.hetHan, soTruyCap: 0, lanCuoi: gioNay(), dang: false, loi: null });
  return { ok: true, du: kq.du };
}

/** Đẩy bản chụp mới lên máy chủ. Gọi khi hồ sơ, nguyện vọng hoặc kế hoạch đổi (đã debounce ở nơi gọi). */
export async function dongBoNgay(s: AppState): Promise<boolean> {
  const ma = doc().ma;
  if (!ma) return false;
  sua({ dang: true, loi: null });
  const kq = await dongBoKetNoi(ma, taoBanChup(s));
  if (!kq.ok) {
    sua({ dang: false, loi: kq.loi, ...(kq.hetHan ? { ma: null } : {}) });
    if (kq.hetHan) xoaKetNoi();
    return false;
  }
  sua({ dang: false, lanCuoi: gioNay(), loi: null });
  return true;
}

/** Ngắt kết nối: xóa bản chụp trên máy chủ rồi xóa khóa trên máy này. Liên kết đã hết hạn thì chỉ xóa cục bộ. */
export async function ngatVaXoa(): Promise<boolean> {
  const t = doc();
  if (!t.ma) return true;
  const hetHan = !!t.hetHan && new Date(t.hetHan).getTime() < Date.now();
  if (!hetHan) {
    sua({ dang: true, loi: null });
    const kq = await ngatKetNoi(t.ma);
    if (!kq.ok && !kq.hetHan) { sua({ dang: false, loi: kq.loi }); return false; }
  }
  xoaKetNoi();
  sua({ ma: null, hetHan: null, soTruyCap: 0, lanCuoi: null, dang: false, loi: null });
  return true;
}

/** Lấy số lần truy cập và trạng thái từ máy chủ. Im lặng khi mạng lỗi (không làm phiền em). */
export async function taiTrangThai(): Promise<void> {
  const ma = doc().ma;
  if (!ma) return;
  const kq = await layTrangThai(ma);
  if (!kq.ok) { if (kq.hetHan) sua({ loi: LOI_HET_HAN }); return; }
  const tt: TrangThaiKetNoi = kq.du;
  sua({ soTruyCap: tt.soTruyCap ?? 0, lanCuoi: tt.lanCuoi ?? doc().lanCuoi, hetHan: tt.hetHan ?? doc().hetHan });
}

export const ghiLoi = (loi: string | null) => sua({ loi });
