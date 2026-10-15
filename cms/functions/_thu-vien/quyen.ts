// Khung chạy chung cho mọi API: cookie phiên -> tra bảng quan_tri -> kiểm vai -> giới hạn tần suất -> xử lý.
// Quyền chi tiết dùng sẵn coQuyenSuaTruong/duocDatTrangThai/khopPhienBan ở src/data/dong-gop-kiem-tra.ts.
import { coQuyenSuaTruong, laQuanTri, type VaiTro } from "../../../src/data/dong-gop-kiem-tra";
import { duocQuanLy, type HanhDongNguoi } from "../../../src/data/quyen-nguoi";
import tapTruongJson from "./tap-truong.json";
import { coPhanCong, hoSoQuanTri, truongDuocGiao } from "./d1";
import { baoMat, chuaDangNhap, chuanHoaEmail, docPhien, kiemOrigin, laEmail, laMayCucBo, layCookie } from "./xac-thuc";
import { LoiHttp, cam, json, phanHoiLoi } from "./phan-hoi";
import type { BoiCanh, Env, KhoD1, TuyChon } from "./kieu";

/** Mã trường hợp lệ -> tên (sinh bằng scripts/sinh-tap-truong.ts). */
export const TEN_TRUONG = tapTruongJson as Record<string, string>;
export const TAP_TRUONG: ReadonlySet<string> = new Set(Object.keys(TEN_TRUONG));

/** Danh sách vai cho phép dùng với chay(): khỏi lặp. sa luôn nằm trong mọi nhóm có qtv. */
export const CHI_SA: readonly VaiTro[] = ["sa"];
export const QUAN_TRI: readonly VaiTro[] = ["sa", "qtv"];
export const MOI_VAI: readonly VaiTro[] = ["sa", "qtv", "ctv"];

export { duocQuanLy, type HanhDongNguoi };

/** Tối đa số yêu cầu ghi mỗi người mỗi phút (đếm bằng KV, không nguyên tử, sai số nhỏ chấp nhận được). */
export const GIOI_HAN_GHI_MOI_PHUT = 60;

export interface NguCanh {
  request: Request;
  env: Env;
  url: URL;
  d1: KhoD1;
  email: string;
  vaiTro: VaiTro;
  phaiDoiMatKhau: boolean;
  o: TuyChon;
  bayGio: Date;
  luc: string;
  params: Record<string, string | string[] | undefined>;
  /** sa hoặc qtv. */
  laQuanTri: boolean;
  yeuCauQtv(thongBao?: string): void;
  /** Chỉ sa. */
  yeuCauSa(thongBao?: string): void;
  /** Ctv chỉ sửa trường được giao, qtv sửa mọi trường. Ném 403 nếu không có quyền. */
  yeuCauSuaTruong(maTruong: string): Promise<void>;
  coQuyenSuaTruong(maTruong: string): Promise<boolean>;
}

export const tamLuc = (o: TuyChon) => o.bayGio ?? new Date();

/** Ai đang gọi: giả danh dev (chỉ localhost + GIA_DANH_DEV=1) hoặc cookie phiên. Cookie còn hạn nhưng người đã bị xóa, hoặc mật khẩu đổi sau khi cấp cookie thì 401. */
async function nguoiGoi(request: Request, env: Env, d1: KhoD1, bayGio: Date) {
  const url = new URL(request.url);
  if (env.GIA_DANH_DEV === "1" && laMayCucBo(url) && request.headers.has("x-gia-danh")) {
    const e = request.headers.get("x-gia-danh") ?? "";
    if (!laEmail(e)) throw chuaDangNhap("Thiếu hoặc sai header X-Gia-Danh (chế độ giả danh dev)");
    const email = chuanHoaEmail(e);
    const hs = await hoSoQuanTri(d1, email);
    if (!hs) throw cam("Email này chưa được cấp quyền vào trang quản trị. Hãy nhờ quản trị viên thêm email của bạn.");
    return { email, hs: { ...hs, phaiDoiMatKhau: false } }; // giả danh dev không bị buộc đổi mật khẩu
  }
  const ck = layCookie(request);
  if (!ck) throw chuaDangNhap();
  baoMat(env);
  kiemOrigin(request);
  const ph = ck ? await docPhien(env, ck, bayGio) : null;
  if (!ph) throw chuaDangNhap();
  const hs = await hoSoQuanTri(d1, ph.email);
  if (!hs || (hs.matKhauLuc && ph.capLuc < Date.parse(hs.matKhauLuc))) throw chuaDangNhap();
  return { email: ph.email, hs };
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
export async function chay(ctx: BoiCanh, o: TuyChon, vaiChoPhep: readonly VaiTro[], xuLy: (c: NguCanh) => Promise<Response>, choPhepDangDoiMk = false): Promise<Response> {
  try {
    const { request, env } = ctx;
    if (!env.DB) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa gắn cơ sở dữ liệu D1 (binding DB)");
    const d1 = env.DB;
    const bayGio = tamLuc(o);
    const { email, hs } = await nguoiGoi(request, env, d1, bayGio);
    const vaiTro = hs.vaiTro;
    if (hs.phaiDoiMatKhau && !choPhepDangDoiMk) throw new LoiHttp(403, "phai-doi-mat-khau", "Bạn cần đổi mật khẩu tạm trước khi dùng tiếp");
    if (!vaiChoPhep.includes(vaiTro)) throw cam();
    if (request.method !== "GET" && request.method !== "HEAD") await gioiHanGhi(env, email, bayGio);
    const c: NguCanh = {
      request, env, url: new URL(request.url), d1, email, vaiTro, phaiDoiMatKhau: hs.phaiDoiMatKhau, o, bayGio, luc: bayGio.toISOString(), params: ctx.params ?? {},
      laQuanTri: laQuanTri(vaiTro),
      yeuCauQtv(thongBao = "Chỉ quản trị viên được làm việc này") { if (!laQuanTri(vaiTro)) throw cam(thongBao); },
      yeuCauSa(thongBao = "Chỉ siêu quản trị được làm việc này") { if (vaiTro !== "sa") throw cam(thongBao); },
      async coQuyenSuaTruong(ma) { return coQuyenSuaTruong(vaiTro, ma, laQuanTri(vaiTro) ? [] : await coPhanCong(d1, email, ma)); },
      async yeuCauSuaTruong(ma) { if (!(await c.coQuyenSuaTruong(ma))) throw cam("Trường này chưa được giao cho bạn"); },
    };
    return await xuLy(c);
  } catch (e) {
    if (e instanceof LoiHttp) return phanHoiLoi(e);
    console.error("cms-api", e instanceof Error ? e.message : e);
    return json({ loi: "Máy chủ gặp lỗi, thử lại sau", ma: "loi-may-chu", thongBao: "Máy chủ gặp lỗi, thử lại sau", chiTiet: [] }, 500);
  }
}

/** Bọc API không cần đăng nhập (đăng nhập, đăng xuất): cùng cách đổi lỗi thành phản hồi. */
export async function chayCongKhai(ctx: BoiCanh, xuLy: (d1: KhoD1) => Promise<Response>): Promise<Response> {
  try {
    if (!ctx.env.DB) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa gắn cơ sở dữ liệu D1 (binding DB)");
    return await xuLy(ctx.env.DB);
  } catch (e) {
    if (e instanceof LoiHttp) return phanHoiLoi(e);
    console.error("cms-api", e instanceof Error ? e.message : e);
    return json({ loi: "Máy chủ gặp lỗi, thử lại sau", ma: "loi-may-chu", thongBao: "Máy chủ gặp lỗi, thử lại sau", chiTiet: [] }, 500);
  }
}

export const khongHoTro = () => new LoiHttp(405, "khong-ho-tro", "Cách gọi này không được hỗ trợ");
export { truongDuocGiao };
