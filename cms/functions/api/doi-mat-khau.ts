// POST /api/doi-mat-khau { matKhauCu, matKhauMoi }: người đang đăng nhập tự đổi (kể cả khi đang bị buộc đổi mật khẩu tạm).
// Đổi xong mọi phiên cũ hết hiệu lực; phản hồi cấp cookie mới cho phiên hiện tại.
import { cauNhatKy, damBaoBang } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { bamMatKhau, loiMatKhauMoi, xacMinhMatKhau } from "../_thu-vien/mat-khau";
import { LoiHttp, docThan, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, MOI_VAI } from "../_thu-vien/quyen";
import { datCookie, ghiLanSai, kiemSoLanSai, kyPhien, xoaLanSai } from "../_thu-vien/xac-thuc";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, MOI_VAI, async (c) => {
    if (c.request.method !== "POST") throw khongHoTro();
    const b = await docThan(c.request);
    const cu = typeof b.matKhauCu === "string" ? b.matKhauCu : "";
    const loi = loiMatKhauMoi(b.matKhauMoi);
    if (loi) throw sai(loi, "matKhauMoi");
    const moi = b.matKhauMoi as string;
    await kiemSoLanSai(c.env, c.request, c.email, "dn", c.bayGio);
    const hang = await c.d1.prepare("SELECT mat_khau FROM quan_tri WHERE email = ?").bind(c.email).first<{ mat_khau: string | null }>();
    if (!(await xacMinhMatKhau(cu, hang?.mat_khau))) {
      await ghiLanSai(c.env, c.request, c.email, "dn", c.bayGio);
      throw new LoiHttp(400, "du-lieu-sai", "Mật khẩu hiện tại chưa đúng", [{ truong: "matKhauCu", thongBao: "Mật khẩu hiện tại chưa đúng" }]);
    }
    if (moi === cu) throw sai("Mật khẩu mới cần khác mật khẩu hiện tại", "matKhauMoi");
    await xoaLanSai(c.env, c.request, c.email, "dn");
    await damBaoBang(c.d1);
    const thoiDiemMoi = c.bayGio;
    const lucMoi = thoiDiemMoi.toISOString();
    await c.d1.batch([
      c.d1.prepare("UPDATE quan_tri SET mat_khau = ?, phai_doi_mat_khau = 0, mat_khau_luc = ? WHERE email = ?").bind(await bamMatKhau(moi), lucMoi, c.email),
      c.d1.prepare("UPDATE dat_lai_mat_khau SET da_dung = 1 WHERE email = ? AND da_dung = 0").bind(c.email),
      cauNhatKy(c.d1, c.email, "quan-tri.doi-mat-khau", `quan_tri:${c.email}`, c.luc),
    ]);
    return json({ email: c.email, vaiTro: c.vaiTro, phaiDoiMatKhau: false }, 200, { "set-cookie": datCookie(c.url, await kyPhien(c.env, c.email, thoiDiemMoi)) });
  }, true);

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
