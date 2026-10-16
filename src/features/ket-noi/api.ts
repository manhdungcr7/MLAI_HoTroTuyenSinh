// Gọi máy chủ kết nối Claude/ChatGPT. Mỗi lệnh có thời hạn 12 giây; lỗi mạng hay mã lỗi đều trả lời nhắn tiếng Việt để hiển thị.
import type { BanChup, DeXuat } from "@/engine/ket-noi-kieu";

export interface TaoKetNoi { ma: string; mcpUrl: string; actionsUrl: string; hetHan: string }
export interface TrangThaiKetNoi { bat: boolean; hetHan: string | null; soTruyCap: number; lanCuoi: string | number | null }
export type KetQua<T> = { ok: true; du: T } | { ok: false; loi: string; hetHan: boolean };

const CHO_TOI_DA_MS = 12_000;
export const LOI_MANG = "Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Thử lại.";
export const LOI_HET_HAN = "Liên kết này không còn hiệu lực. Bạn tạo liên kết mới để tiếp tục.";

async function goi<T>(duong: string, opt: { method?: "GET" | "POST" | "PUT" | "DELETE"; ma?: string; than?: unknown } = {}): Promise<KetQua<T>> {
  const bo = new AbortController();
  const hen = setTimeout(() => bo.abort(), CHO_TOI_DA_MS);
  try {
    const r = await fetch(duong, {
      method: opt.method ?? "GET",
      signal: bo.signal,
      headers: { ...(opt.than !== undefined ? { "content-type": "application/json" } : {}), ...(opt.ma ? { "x-ket-noi": opt.ma } : {}) },
      body: opt.than !== undefined ? JSON.stringify(opt.than) : undefined,
    });
    if (!r.ok) {
      if (r.status === 401 || r.status === 403 || r.status === 404) return { ok: false, loi: LOI_HET_HAN, hetHan: true };
      if (r.status === 429) return { ok: false, loi: "Bạn thao tác hơi nhanh. Chờ một lát rồi thử lại.", hetHan: false };
      if (r.status >= 500) return { ok: false, loi: "Máy chủ đang bận. Bạn thử lại sau ít phút.", hetHan: false };
      return { ok: false, loi: "Yêu cầu chưa được nhận. Bấm Thử lại.", hetHan: false };
    }
    const du = (r.status === 204 ? undefined : await r.json()) as T;
    return { ok: true, du };
  } catch {
    return { ok: false, loi: LOI_MANG, hetHan: false };
  } finally {
    clearTimeout(hen);
  }
}

export const taoKetNoi = (banChup: BanChup) => goi<TaoKetNoi>("/api/ket-noi/tao", { method: "POST", than: { banChup } });
export const dongBoKetNoi = (ma: string, banChup: BanChup) => goi<unknown>("/api/ket-noi/dong-bo", { method: "PUT", ma, than: { banChup } });
export const ngatKetNoi = (ma: string) => goi<unknown>("/api/ket-noi", { method: "DELETE", ma });
export const layTrangThai = (ma: string) => goi<TrangThaiKetNoi>("/api/ket-noi/trang-thai", { ma });
export const layDeXuat = (ma: string) => goi<{ deXuat: DeXuat[] }>("/api/ket-noi/de-xuat", { ma });
export const quyetDinhDeXuat = (ma: string, id: string, quyetDinh: "xac-nhan" | "tu-choi") =>
  goi<unknown>(`/api/ket-noi/de-xuat/${encodeURIComponent(id)}`, { method: "POST", ma, than: { quyetDinh } });
