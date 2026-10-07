// Client API có kiểu. Mọi màn chỉ gọi các hàm ở đây, không tự fetch.
// Dùng dữ liệu mẫu khi bật chế độ mẫu (xem che-do.ts); lỗi mạng/HTML/JSON hỏng đều thành LoiApi có thông báo rõ.
import { dangDungDuLieuMau } from "./che-do";
import { xuLyDuLieuMau } from "./gia-lap";
import {
  LoiApi, SO_MOI_TRANG,
  type ChiTietTruongApi, type KenhBody, type KetQuaPhatHanh, type NguoiCms, type NhatKyCms, type PhanCongCms,
  type SuaThongTinBody, type TaoThongTinBody, type ThongTinCms, type TienDoApi, type TienDoTruong, type Toi, type Trang,
  type TruongTrongDanhSach, type VaiTro, type BanGhiTruong,
} from "./kieu";
import type { LoaiThongTin, TrangThaiBai } from "@/data/dong-gop-kiem-tra";

type Query = Record<string, string | number | undefined>;

export function chuoiTruyVan(q?: Query): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q ?? {})) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function goi<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", duong: string, tuyChon: { query?: Query; body?: unknown } = {}): Promise<T> {
  if (dangDungDuLieuMau()) return (await xuLyDuLieuMau(method, duong, tuyChon.query ?? {}, tuyChon.body)) as T;
  let res: Response;
  try {
    res = await fetch(`/api${duong}${chuoiTruyVan(tuyChon.query)}`, {
      method,
      headers: { Accept: "application/json", ...(tuyChon.body !== undefined && { "Content-Type": "application/json" }) },
      credentials: "same-origin",
      body: tuyChon.body !== undefined ? JSON.stringify(tuyChon.body) : undefined,
    });
  } catch {
    throw new LoiApi(0, "Không kết nối được máy chủ. Bạn kiểm tra mạng rồi thử lại.");
  }
  if (res.status === 204) return undefined as T;
  const loai = res.headers.get("content-type") ?? "";
  if (!loai.includes("json")) {
    // Thường là trang đăng nhập của Cloudflare Access trả về khi phiên hết hạn.
    throw new LoiApi(res.status === 200 ? 401 : res.status, "Phiên đăng nhập có thể đã hết hạn. Bạn tải lại trang để đăng nhập lại.");
  }
  let json: unknown;
  try { json = await res.json(); } catch { throw new LoiApi(res.status, "Máy chủ trả về dữ liệu không đọc được."); }
  if (!res.ok) {
    const j = (json ?? {}) as { loi?: unknown; chiTiet?: unknown };
    throw new LoiApi(res.status, typeof j.loi === "string" ? j.loi : thongBaoTheoMa(res.status), chiTietHopLe(j.chiTiet));
  }
  return json as T;
}

function chiTietHopLe(x: unknown): Record<string, string> | undefined {
  if (typeof x !== "object" || x === null) return undefined;
  const ra: Record<string, string> = {};
  for (const [k, v] of Object.entries(x)) if (typeof v === "string") ra[k] = v;
  return Object.keys(ra).length ? ra : undefined;
}

export function thongBaoTheoMa(status: number): string {
  switch (status) {
    case 0: return "Không kết nối được máy chủ.";
    case 400: return "Dữ liệu chưa hợp lệ.";
    case 401: return "Bạn chưa đăng nhập hoặc phiên đã hết hạn.";
    case 403: return "Bạn chưa có quyền làm việc này.";
    case 404: return "Không tìm thấy.";
    case 409: return "Có người vừa sửa bản ghi này. Bạn tải lại rồi sửa tiếp.";
    case 413: return "Nội dung quá dài.";
    case 429: return "Bạn thao tác nhanh quá, chờ một chút rồi thử lại.";
    default: return "Máy chủ đang gặp lỗi, bạn thử lại sau.";
  }
}

/** Câu thông báo gọn cho người dùng từ một lỗi bất kỳ. */
export const thongBaoLoi = (e: unknown): string => (e instanceof LoiApi ? e.message : "Có lỗi xảy ra, bạn thử lại nhé.");

/** Lấy hết các trang (mỗi trang tối đa 50 dòng) cho danh sách nhỏ, dừng ở 20 trang. */
export async function layHetTrang<T>(lay: (trang: number) => Promise<Trang<T>>): Promise<T[]> {
  const ra: T[] = [];
  for (let t = 1; t <= 20; t++) {
    const r = await lay(t);
    ra.push(...r.muc);
    if (r.muc.length < SO_MOI_TRANG || ra.length >= r.tong) break;
  }
  return ra;
}

// ---------- Phiên ----------
export const layToi = () => goi<Toi>("GET", "/toi");

// ---------- Trường ----------
export async function layTrangTruong(trang: number, loc: { cuaToi?: boolean } = {}): Promise<Trang<TruongTrongDanhSach>> {
  const r = await goi<{ truong: TruongTrongDanhSach[]; tong: number }>("GET", "/truong", { query: { trang, moi: SO_MOI_TRANG, "cua-toi": loc.cuaToi ? 1 : undefined } });
  return { muc: r.truong, tong: r.tong };
}
export const layTatCaTruong = (loc: { cuaToi?: boolean } = {}) => layHetTrang((t) => layTrangTruong(t, loc));
export const layChiTietTruong = (ma: string) => goi<ChiTietTruongApi>("GET", `/truong/${encodeURIComponent(ma)}`);
export const luuKenh = (ma: string, body: KenhBody) => goi<BanGhiTruong>("PUT", `/truong/${encodeURIComponent(ma)}`, { body });

// ---------- Thông tin ----------
export interface LocThongTin { truong?: string; loai?: LoaiThongTin; trangThai?: TrangThaiBai; nguonGui?: "cms" | "agent" }
export async function layTrangThongTin(trang: number, loc: LocThongTin = {}): Promise<Trang<ThongTinCms>> {
  const r = await goi<{ thongTin: ThongTinCms[]; tong: number }>("GET", "/thong-tin", { query: { ...loc, trang, moi: SO_MOI_TRANG } });
  return { muc: r.thongTin, tong: r.tong };
}
export const layTatCaThongTin = (loc: LocThongTin = {}) => layHetTrang((t) => layTrangThongTin(t, loc));
export const taoThongTin = (body: TaoThongTinBody) => goi<ThongTinCms>("POST", "/thong-tin", { body });
export const suaThongTin = (id: string, body: SuaThongTinBody) => goi<ThongTinCms>("PATCH", `/thong-tin/${encodeURIComponent(id)}`, { body });

// ---------- Tiến độ ----------
export async function layTienDo(cuaToi: boolean): Promise<TienDoApi> {
  const truong = await layHetTrang(async (t) => {
    const r = await goi<TienDoApi>("GET", "/tien-do", { query: { "cua-toi": cuaToi ? 1 : undefined, trang: t, moi: SO_MOI_TRANG } });
    return { muc: r.truong, tong: r.tong };
  });
  const dem = truong.filter((x: TienDoTruong) => x.du).length;
  return { truong, tongDu: dem, tong: truong.length };
}

// ---------- Người, phân công, nhật ký, phát hành (qtv) ----------
export const layNguoi = async () => (await goi<{ nguoi: NguoiCms[] }>("GET", "/nguoi")).nguoi;
export const themNguoi = (email: string, vaiTro: VaiTro) => goi<NguoiCms>("POST", "/nguoi", { body: { email, vaiTro } });
export const xoaNguoi = (email: string) => goi<void>("DELETE", "/nguoi", { query: { email } });
export const layPhanCong = async (email?: string) => (await goi<{ phanCong: PhanCongCms[] }>("GET", "/phan-cong", { query: { email } })).phanCong;
export const datPhanCong = (email: string, maTruong: string[]) => goi<{ email: string; maTruong: string[] }>("PUT", "/phan-cong", { body: { email, maTruong } });
export async function layTrangNhatKy(trang: number): Promise<Trang<NhatKyCms>> {
  const r = await goi<{ nhatKy: NhatKyCms[]; tong: number }>("GET", "/nhat-ky", { query: { trang, moi: SO_MOI_TRANG } });
  return { muc: r.nhatKy, tong: r.tong };
}
export const phatHanh = () => goi<KetQuaPhatHanh>("POST", "/phat-hanh");
