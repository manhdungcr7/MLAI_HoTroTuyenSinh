import { LoiApi, SO_MOI_TRANG, type CaiDatHeThong, type NguoiCms, type NguoiMoiCms, type NhatKyCms, type PhanCongCms, type PhanHoiCaiDatHeThong, type Toi, type Trang, type VaiTro } from "./kieu";
export * from "./kieu";

type Query = Record<string, string | number | undefined>;

export function chuoiTruyVan(q?: Query): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q ?? {})) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function goi<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", duong: string, tuyChon: { query?: Query; body?: unknown } = {}): Promise<T> {
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
    throw new LoiApi(res.status === 200 ? 401 : res.status, "Máy chủ trả về dữ liệu không đọc được. Bạn tải lại trang rồi thử lại.");
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
export const dangNhap = (email: string, matKhau: string) => goi<{ email: string; vaiTro: VaiTro; phaiDoiMatKhau: boolean }>("POST", "/dang-nhap", { body: { email, matKhau } });
export const dangXuat = () => goi<void>("POST", "/dang-xuat");
export const doiMatKhau = (matKhauCu: string, matKhauMoi: string) => goi<{ email: string }>("POST", "/doi-mat-khau", { body: { matKhauCu, matKhauMoi } });

// ---------- Người, phân công, nhật ký (qtv) ----------
export const layNguoi = async () => (await goi<{ nguoi: NguoiCms[] }>("GET", "/nguoi")).nguoi;
export const themNguoi = (email: string, vaiTro: VaiTro) => goi<NguoiMoiCms>("POST", "/nguoi", { body: { email, vaiTro } });
export const doiVaiNguoi = (email: string, vaiTro: VaiTro) => goi<{ email: string; vaiTro: VaiTro }>("PATCH", "/nguoi", { query: { email }, body: { vaiTro } });
export const datLaiMatKhau = (email: string) => goi<{ email: string; matKhauTam: string }>("PATCH", "/nguoi", { query: { email }, body: { datLaiMatKhau: true } });
export const xoaNguoi = (email: string) => goi<void>("DELETE", "/nguoi", { query: { email } });
export const layPhanCong = async (email?: string) => (await goi<{ phanCong: PhanCongCms[] }>("GET", "/phan-cong", { query: { email } })).phanCong;
export const datPhanCong = (email: string, maTruong: string[]) => goi<{ email: string; maTruong: string[] }>("PUT", "/phan-cong", { body: { email, maTruong } });
export async function layTrangNhatKy(trang: number): Promise<Trang<NhatKyCms>> {
  const r = await goi<{ nhatKy: NhatKyCms[]; tong: number }>("GET", "/nhat-ky", { query: { trang, moi: SO_MOI_TRANG } });
  return { muc: r.nhatKy, tong: r.tong };
}

// ---------- Cài đặt hệ thống & nội dung công khai ----------
export const layCaiDat = () => goi<PhanHoiCaiDatHeThong>("GET", "/cai-dat");
export const luuCaiDat = (caiDat: CaiDatHeThong) => goi<PhanHoiCaiDatHeThong>("PUT", "/cai-dat", { body: { caiDat } });
export const khoiPhucCaiDatMacDinh = () => goi<PhanHoiCaiDatHeThong>("PUT", "/cai-dat", { body: { khoiPhucMacDinh: true } });

