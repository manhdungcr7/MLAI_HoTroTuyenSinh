// POST /api/dang-nhap { email, matKhau } -> đặt cookie phiên, trả { email, vaiTro, phaiDoiMatKhau }.
// Sai email hay sai mật khẩu cùng một thông báo. Tối đa 5 lần sai/15 phút theo (IP + email).
import { cauNhatKy, hoSoQuanTri } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { xacMinhMatKhau } from "../_thu-vien/mat-khau";
import { docThan, json } from "../_thu-vien/phan-hoi";
import { chayCongKhai, khongHoTro, tamLuc } from "../_thu-vien/quyen";
import { baoMat, chuanHoaEmail, chuaDangNhap, datCookie, ghiLanSai, kiemOrigin, kiemSoLanSai, kyPhien, laEmail, xoaLanSai } from "../_thu-vien/xac-thuc";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chayCongKhai(ctx, async (d1) => {
    const { request, env } = ctx;
    if (request.method !== "POST") throw khongHoTro();
    baoMat(env);
    kiemOrigin(request);
    const b = await docThan(request);
    const email = typeof b.email === "string" ? chuanHoaEmail(b.email) : "";
    const matKhau = typeof b.matKhau === "string" ? b.matKhau : "";
    await kiemSoLanSai(env, request, email);
    const hs = laEmail(email) && matKhau && matKhau.length <= 200 ? await hoSoQuanTri(d1, email) : null;
    if (!hs || !(await xacMinhMatKhau(matKhau, hs.matKhau))) {
      await ghiLanSai(env, request, email);
      throw chuaDangNhap("Email hoặc mật khẩu không đúng");
    }
    await xoaLanSai(env, request, email);
    const bayGio = tamLuc(o);
    await cauNhatKy(d1, email, "quan-tri.dang-nhap", `quan_tri:${email}`, bayGio.toISOString()).run();
    return json({ email, vaiTro: hs.vaiTro, phaiDoiMatKhau: hs.phaiDoiMatKhau }, 200, { "set-cookie": datCookie(new URL(request.url), await kyPhien(env, email, bayGio)) });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
