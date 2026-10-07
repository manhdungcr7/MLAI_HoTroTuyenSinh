// Khung chạy chung cho mọi API: xác thực Access -> tra bảng quan_tri (kèm bootstrap) -> kiểm vai -> giới hạn tần suất -> xử lý.
// Quyền chi tiết dùng sẵn coQuyenSuaTruong/duocDatTrangThai/khopPhienBan ở src/data/dong-gop-kiem-tra.ts.
import { coQuyenSuaTruong, type VaiTro } from "../../../src/data/dong-gop-kiem-tra";
import tapTruongJson from "./tap-truong.json";
import { coPhanCong, ghiNhatKy, taoQtvDauTien, truongDuocGiao, vaiTroCua } from "./d1";
import { xacThucAccess, chuanHoaEmail } from "./xac-thuc-access";
import { LoiHttp, cam, json, phanHoiLoi } from "./phan-hoi";
import type { BoiCanh, Env, KhoD1, TuyChon } from "./kieu";

/** Mã trường hợp lệ -> tên (sinh bằng scripts/sinh-tap-truong.ts). */
export const TEN_TRUONG = tapTruongJson as Record<string, string>;
export const TAP_TRUONG: ReadonlySet<string> = new Set(Object.keys(TEN_TRUONG));

/** Tối đa số yêu cầu ghi mỗi người mỗi phút (đếm bằng KV, không nguyên tử, sai số nhỏ chấp nhận được). */
export const GIOI_HAN_GHI_MOI_PHUT = 60;

export interface NguCanh {
  request: Request;
  env: Env;
  url: URL;
  d1: KhoD1;
  email: string;
  vaiTro: VaiTro;
  o: TuyChon;
  bayGio: Date;
  luc: string;
  params: Record<string, string | string[] | undefined>;
  yeuCauQtv(thongBao?: string): void;
  /** Ctv chỉ sửa trường được giao, qtv sửa mọi trường. Ném 403 nếu không có quyền. */
  yeuCauSuaTruong(maTruong: string): Promise<void>;
  coQuyenSuaTruong(maTruong: string): Promise<boolean>;
}

export const tamLuc = (o: TuyChon) => o.bayGio ?? new Date();

async function tienLoi(env: Env, email: string, bayGio: Date, d1: KhoD1): Promise<VaiTro> {
  let vai = await vaiTroCua(d1, email);
  if (vai) return vai;
  const dau = (env.QTV_DAU_TIEN ?? "").split(",").map(chuanHoaEmail).filter(Boolean);
  if (dau.includes(email) && (await taoQtvDauTien(d1, email, bayGio.toISOString()))) {
    await ghiNhatKy(d1, email, "quan-tri.khoi-tao", `quan_tri:${email}`, bayGio.toISOString());
    vai = await vaiTroCua(d1, email);
    if (vai) return vai;
  }
  throw cam("Email này chưa được cấp quyền vào trang quản trị. Hãy nhờ quản trị viên thêm email của bạn.");
}

async function gioiHanGhi(env: Env, email: string, bayGio: Date): Promise<void> {
  const kv = env.KV_CONG_DONG;
  if (!kv) return;
  const khoa = `gh:${email}:${Math.floor(bayGio.getTime() / 60_000)}`;
  try {
    const dem = Number((await kv.get(khoa)) ?? 0);
    if (dem >= GIOI_HAN_GHI_MOI_PHUT) throw new LoiHttp(429, "qua-nhanh", "Bạn thao tác hơi nhanh, đợi một phút rồi thử lại");
    await kv.put(khoa, String(dem + 1), { expirationTtl: 120 });
  } catch (e) {
    if (e instanceof LoiHttp) throw e; // KV lỗi thì không chặn người dùng
  }
}

/** Bọc một xử lý: lỗi LoiHttp đổi thành phản hồi chuẩn, lỗi lạ thành 500 chung chung (không lộ chi tiết). */
export async function chay(ctx: BoiCanh, o: TuyChon, vaiChoPhep: readonly VaiTro[], xuLy: (c: NguCanh) => Promise<Response>): Promise<Response> {
  try {
    const { request, env } = ctx;
    if (!env.DB) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa gắn cơ sở dữ liệu D1 (binding DB)");
    const d1 = env.DB;
    const { email } = await xacThucAccess(request, env, o);
    const bayGio = tamLuc(o);
    const vaiTro = await tienLoi(env, email, bayGio, d1);
    if (!vaiChoPhep.includes(vaiTro)) throw cam();
    if (request.method !== "GET" && request.method !== "HEAD") await gioiHanGhi(env, email, bayGio);
    const c: NguCanh = {
      request, env, url: new URL(request.url), d1, email, vaiTro, o, bayGio, luc: bayGio.toISOString(), params: ctx.params ?? {},
      yeuCauQtv(thongBao = "Chỉ quản trị viên được làm việc này") { if (vaiTro !== "qtv") throw cam(thongBao); },
      async coQuyenSuaTruong(ma) { return coQuyenSuaTruong(vaiTro, ma, vaiTro === "qtv" ? [] : await coPhanCong(d1, email, ma)); },
      async yeuCauSuaTruong(ma) { if (!(await c.coQuyenSuaTruong(ma))) throw cam("Trường này chưa được giao cho bạn"); },
    };
    return await xuLy(c);
  } catch (e) {
    if (e instanceof LoiHttp) return phanHoiLoi(e);
    console.error("cms-api", e instanceof Error ? e.message : e);
    return json({ loi: "Máy chủ gặp lỗi, thử lại sau", ma: "loi-may-chu", thongBao: "Máy chủ gặp lỗi, thử lại sau", chiTiet: [] }, 500);
  }
}

export const khongHoTro = () => new LoiHttp(405, "khong-ho-tro", "Cách gọi này không được hỗ trợ");
export { truongDuocGiao };
