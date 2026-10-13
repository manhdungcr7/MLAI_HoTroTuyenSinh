// /api/phan-cong: GET (qtv: tất cả, ctv: của mình; ?email=), PUT (qtv) { email, maTruong: string[] } thay toàn bộ phân công của người đó.
import { cauNhatKy, TOI_DA_PHAN_CONG } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, cam, docThan, docTrang, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, TAP_TRUONG, MOI_VAI } from "../_thu-vien/quyen";
import { chuanHoaEmail, laEmail } from "../_thu-vien/xac-thuc";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, MOI_VAI, async (c) => {
    if (c.request.method === "GET") {
      const t = docTrang(c.url);
      const hoi = c.url.searchParams.get("email");
      if (c.vaiTro === "ctv" && hoi && chuanHoaEmail(hoi) !== c.email) throw cam("Cộng tác viên chỉ xem được phân công của mình");
      const email = c.vaiTro === "ctv" ? c.email : hoi ? chuanHoaEmail(hoi) : null;
      const where = email ? "WHERE email = ?" : "";
      const gt = email ? [email] : [];
      const [dem, ds] = (await c.d1.batch([
        c.d1.prepare(`SELECT COUNT(*) AS c FROM phan_cong ${where}`).bind(...gt),
        c.d1.prepare(`SELECT email, ma_truong FROM phan_cong ${where} ORDER BY email, ma_truong LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset),
      ])) as unknown as [{ results: { c: number }[] }, { results: { email: string; ma_truong: string }[] }];
      return json({ phanCong: ds.results.map((r) => ({ email: r.email, maTruong: r.ma_truong })), tong: dem.results[0]?.c ?? 0 });
    }
    if (c.request.method === "PUT") {
      c.yeuCauQtv();
      const b = await docThan(c.request);
      if (!laEmail(b.email)) throw sai("Email không hợp lệ", "email");
      if (!Array.isArray(b.maTruong) || b.maTruong.length > TOI_DA_PHAN_CONG) throw sai(`maTruong phải là mảng tối đa ${TOI_DA_PHAN_CONG} mã`, "maTruong");
      const ma = [...new Set(b.maTruong.map((x) => (typeof x === "string" ? x.trim() : "")))];
      const xau = ma.filter((x) => !TAP_TRUONG.has(x));
      if (xau.length) throw sai(`Mã trường không tồn tại: ${xau.slice(0, 5).join(", ")}`, "maTruong");
      const email = chuanHoaEmail(b.email);
      const nguoi = await c.d1.prepare("SELECT vai_tro FROM quan_tri WHERE email = ? LIMIT 1").bind(email).first();
      if (!nguoi) throw new LoiHttp(404, "khong-tim-thay", "Email này chưa có trong danh sách người dùng. Thêm người dùng trước.");
      await c.d1.batch([
        c.d1.prepare("DELETE FROM phan_cong WHERE email = ?").bind(email),
        ...ma.map((m) => c.d1.prepare("INSERT INTO phan_cong (email, ma_truong) VALUES (?, ?)").bind(email, m)),
        cauNhatKy(c.d1, c.email, "phan-cong.dat", `phan_cong:${email} (${ma.length} trường)`, c.luc),
      ]);
      return json({ email, maTruong: ma.sort() });
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
