// Phản hồi JSON chuẩn, lỗi tiếng Việt, đọc thân yêu cầu có giới hạn, phân trang.

export const GIOI_HAN_THAN = 32 * 1024;
export const MOI_TOI_DA = 50;

export interface ChiTietLoi { truong: string; thongBao: string }

/** Lỗi có mã HTTP, ném ra ở bất kỳ đâu rồi `chay()` đổi thành phản hồi. */
export class LoiHttp extends Error {
  constructor(public status: number, public ma: string, public thongBao: string, public chiTiet: ChiTietLoi[] = []) {
    super(thongBao);
  }
}

const TIEU_DE = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export const json = (v: unknown, status = 200, them: Record<string, string> = {}) =>
  new Response(JSON.stringify(v), { status, headers: { ...TIEU_DE, ...them } });

export const khongNoiDung = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

/** Thân lỗi: `loi` giữ cho tương thích hợp đồng cũ, `ma`/`thongBao`/`chiTiet[]` là dạng chuẩn. */
export function phanHoiLoi(e: LoiHttp, them: Record<string, string> = {}): Response {
  return json({ loi: e.thongBao, ma: e.ma, thongBao: e.thongBao, chiTiet: e.chiTiet }, e.status, them);
}

/** Đổi `{ "duLieu.mucThap": "..." }` của hàm kiểm tra chung thành chiTiet[] theo từng trường. */
export const chiTietTuLoi = (loi: Record<string, string>): ChiTietLoi[] => Object.entries(loi).map(([truong, thongBao]) => ({ truong, thongBao }));
export const loiKiemTra = (loi: Record<string, string>) =>
  new LoiHttp(400, "du-lieu-sai", Object.values(loi)[0] ? `Dữ liệu chưa hợp lệ: ${Object.values(loi)[0]}` : "Dữ liệu chưa hợp lệ", chiTietTuLoi(loi));

export const khongTimThay = (cai = "Không tìm thấy") => new LoiHttp(404, "khong-tim-thay", cai);
export const cam = (thongBao = "Bạn không có quyền làm việc này") => new LoiHttp(403, "khong-co-quyen", thongBao);
export const sai = (thongBao: string, truong?: string) => new LoiHttp(400, "du-lieu-sai", thongBao, truong ? [{ truong, thongBao }] : []);

/** Đọc thân JSON (đối tượng), tối đa 32KB tính theo byte. */
export async function docThan(request: Request): Promise<Record<string, unknown>> {
  const khai = Number(request.headers.get("content-length"));
  if (Number.isFinite(khai) && khai > GIOI_HAN_THAN) throw new LoiHttp(413, "qua-lon", "Nội dung gửi lên quá lớn (tối đa 32KB)");
  const chu = await request.text();
  if (new TextEncoder().encode(chu).length > GIOI_HAN_THAN) throw new LoiHttp(413, "qua-lon", "Nội dung gửi lên quá lớn (tối đa 32KB)");
  let v: unknown;
  try { v = JSON.parse(chu); } catch { throw sai("Nội dung gửi lên không phải JSON hợp lệ"); }
  if (typeof v !== "object" || v === null || Array.isArray(v)) throw sai("Nội dung gửi lên phải là một đối tượng JSON");
  return v as Record<string, unknown>;
}

export interface Trang { trang: number; moi: number; offset: number }
/** `?trang=1&moi=50`, tối đa 50 dòng mỗi trang. Giá trị sai thì 400. */
export function docTrang(url: URL, moiMacDinh = MOI_TOI_DA): Trang {
  const so = (ten: string, mac: number, min: number, max: number) => {
    const t = url.searchParams.get(ten);
    if (t === null || t === "") return mac;
    const n = Number(t);
    if (!Number.isInteger(n) || n < min || n > max) throw sai(`Tham số ${ten} cần là số nguyên từ ${min} đến ${max}`, ten);
    return n;
  };
  const trang = so("trang", 1, 1, 100_000);
  const moi = so("moi", moiMacDinh, 1, MOI_TOI_DA);
  return { trang, moi, offset: (trang - 1) * moi };
}

/** Tham số lọc phải nằm trong danh sách cho phép, rỗng thì bỏ qua. */
export const locEnum = (v: string | null, cho: readonly string[], ten: string): string | null => {
  if (v === null || v === "") return null;
  if (!cho.includes(v)) throw sai(`Giá trị ${ten} không hợp lệ`, ten);
  return v;
};
