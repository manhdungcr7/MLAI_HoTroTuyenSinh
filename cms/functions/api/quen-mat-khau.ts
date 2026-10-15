// POST /api/quen-mat-khau: yêu cầu mã đặt lại mật khẩu và đặt lại mật khẩu bằng mã dùng một lần (hết hạn sau 15 phút).
// Chống dò tài khoản: yeu_cau luôn trả 200 chung chung dù email có trong hệ thống hay không.
// Trong D1 chỉ lưu bản băm SHA-256 (token_hash), tuyệt đối không lưu hay ghi nhật ký mã gốc.
import { cauNhatKy, damBaoBang, hoSoQuanTri, type DongDatLaiMatKhau } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { bamMatKhau, bamToken, DO_DAI_TOI_THIEU, taoTokenNgauNhien } from "../_thu-vien/mat-khau";
import { docThan, json, sai } from "../_thu-vien/phan-hoi";
import { chayCongKhai, khongHoTro, tamLuc } from "../_thu-vien/quyen";
import { guiTelegram, thoatHtml } from "../_thu-vien/telegram";
import { chuanHoaEmail, ghiLanSai, kiemOrigin, kiemSoLanSai, laEmail, xoaLanSai } from "../_thu-vien/xac-thuc";

export const THOI_HAN_TOKEN_GIAY = 15 * 60;
export const THONG_BAO_YEU_CAU = "Nếu email tồn tại trong hệ thống, mã đặt lại mật khẩu đã được gửi.";

function kiemTraMatKhauDatLai(matKhau: unknown): string | null {
  if (typeof matKhau !== "string" || matKhau.length < DO_DAI_TOI_THIEU) {
    return `Mật khẩu cần có ít nhất ${DO_DAI_TOI_THIEU} ký tự`;
  }
  if (matKhau.length > 128) {
    return "Mật khẩu tối đa 128 ký tự";
  }
  return null;
}

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chayCongKhai(ctx, async (d1) => {
    const { request, env } = ctx;
    if (request.method !== "POST") throw khongHoTro();
    kiemOrigin(request);
    await damBaoBang(d1);

    const b = await docThan(request);
    const hanhDong = typeof b.hanhDong === "string" ? b.hanhDong : "";
    const bayGio = tamLuc(o);
    const luc = bayGio.toISOString();

    if (hanhDong === "yeu_cau") {
      const email = typeof b.email === "string" ? chuanHoaEmail(b.email) : "";
      if (!laEmail(email)) throw sai("Email không hợp lệ", "email");

      // Hai tầng: theo (IP + email) và theo IP riêng, để một IP không thể quét nhiều email hay spam tin Telegram của quản trị.
      await kiemSoLanSai(env, request, email, "qmk", bayGio);
      await kiemSoLanSai(env, request, "*", "qmk-ip", bayGio);
      await ghiLanSai(env, request, email, "qmk", bayGio);
      await ghiLanSai(env, request, "*", "qmk-ip", bayGio);

      const hs = await hoSoQuanTri(d1, email);
      if (hs) {
        const token = taoTokenNgauNhien();
        const tokenHash = await bamToken(token);
        const hetHan = new Date(bayGio.getTime() + THOI_HAN_TOKEN_GIAY * 1000).toISOString();
        const id = o.taoId ? o.taoId() : crypto.randomUUID();

        await d1.batch([
          d1.prepare("UPDATE dat_lai_mat_khau SET da_dung = 1 WHERE email = ? AND da_dung = 0").bind(email),
          d1.prepare(
            "INSERT INTO dat_lai_mat_khau (id, email, token_hash, het_han, da_dung, tao_luc) VALUES (?, ?, ?, ?, 0, ?)"
          ).bind(id, email, tokenHash, hetHan, luc),
          cauNhatKy(d1, email, "YEU_CAU_DAT_LAI_MAT_KHAU", `quan_tri:${email}`, luc),
        ]);

        const url = new URL(request.url);
        const link = `${url.origin}/?reset_token=${encodeURIComponent(token)}`;
        await guiTelegram(
          env,
          [
            "<b>[CMS Nguyện Vọng AI] Yêu cầu đặt lại mật khẩu</b>",
            `Tài khoản: <code>${thoatHtml(email)}</code>`,
            `Mã khôi phục (15 phút): <code>${thoatHtml(token)}</code>`,
            `Liên kết: ${thoatHtml(link)}`,
          ].join("\n"),
          o
        );
      }

      return json({ ok: true, thongBao: THONG_BAO_YEU_CAU });
    }

    if (hanhDong === "dat_lai") {
      const token = typeof b.token === "string" ? b.token.trim() : "";
      if (!token || token.length < 16 || token.length > 256) {
        throw sai("Mã khôi phục không hợp lệ hoặc đã hết hạn", "token");
      }
      const loiMk = kiemTraMatKhauDatLai(b.matKhauMoi);
      if (loiMk) throw sai(loiMk, "matKhauMoi");
      const matKhauMoi = b.matKhauMoi as string;

      await kiemSoLanSai(env, request, "dat-lai", "qmk-dl", bayGio);

      const tokenHash = await bamToken(token);
      const dong = await d1
        .prepare("SELECT id, email, token_hash, het_han, da_dung, tao_luc FROM dat_lai_mat_khau WHERE token_hash = ? LIMIT 1")
        .bind(tokenHash)
        .first<DongDatLaiMatKhau>();

      if (!dong || Number(dong.da_dung) === 1 || Date.parse(dong.het_han) <= bayGio.getTime()) {
        await ghiLanSai(env, request, "dat-lai", "qmk-dl", bayGio);
        throw sai("Mã khôi phục không hợp lệ hoặc đã hết hạn", "token");
      }

      const hs = await hoSoQuanTri(d1, dong.email);
      if (!hs) {
        await ghiLanSai(env, request, "dat-lai", "qmk-dl", bayGio);
        throw sai("Mã khôi phục không hợp lệ hoặc đã hết hạn", "token");
      }

      const lucMoi = bayGio.toISOString();

      await d1.batch([
        d1.prepare("UPDATE dat_lai_mat_khau SET da_dung = 1 WHERE id = ? OR (email = ? AND da_dung = 0)").bind(dong.id, dong.email),
        d1.prepare("UPDATE quan_tri SET mat_khau = ?, phai_doi_mat_khau = 0, mat_khau_luc = ? WHERE email = ?").bind(
          await bamMatKhau(matKhauMoi),
          lucMoi,
          dong.email
        ),
        cauNhatKy(d1, dong.email, "DAT_LAI_MAT_KHAU_THANH_CONG", `quan_tri:${dong.email}`, luc),
      ]);

      await xoaLanSai(env, request, dong.email, "dn");
      await xoaLanSai(env, request, dong.email, "qmk");
      await xoaLanSai(env, request, "dat-lai", "qmk-dl");

      return json({ ok: true, thongBao: "Đã đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới." });
    }

    throw sai("Hành động phải là yeu_cau hoặc dat_lai", "hanhDong");
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
