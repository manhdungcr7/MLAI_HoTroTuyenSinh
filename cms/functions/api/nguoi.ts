// /api/nguoi (qtv): quản lý tài khoản được vào CMS (bảng quan_tri). GET danh sách, POST thêm, DELETE ?email= xóa.
import { laEmail, chuanHoaEmail } from "../_thu-vien/xac-thuc-access";
import { cauNhatKy } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, docThan, docTrang, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro } from "../_thu-vien/quyen";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv"], async (c) => {
    const m = c.request.method;
    if (m === "GET") {
      const t = docTrang(c.url);
      const [dem, ds] = (await c.d1.batch([
        c.d1.prepare("SELECT COUNT(*) AS c FROM quan_tri"),
        c.d1.prepare("SELECT email, vai_tro, tao_luc FROM quan_tri ORDER BY email LIMIT ? OFFSET ?").bind(t.moi, t.offset),
      ])) as unknown as [{ results: { c: number }[] }, { results: { email: string; vai_tro: string; tao_luc: string }[] }];
      return json({ nguoi: ds.results.map((r) => ({ email: r.email, vaiTro: r.vai_tro, taoLuc: r.tao_luc })), tong: dem.results[0]?.c ?? 0 });
    }
    if (m === "POST") {
      const b = await docThan(c.request);
      if (!laEmail(b.email)) throw sai("Email không hợp lệ", "email");
      if (b.vaiTro !== "qtv" && b.vaiTro !== "ctv") throw sai("vaiTro phải là qtv hoặc ctv", "vaiTro");
      const email = chuanHoaEmail(b.email);
      const r = await c.d1.prepare("INSERT OR IGNORE INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, ?, ?)").bind(email, b.vaiTro, c.luc).run();
      if ((r.meta?.changes ?? 0) === 0) throw new LoiHttp(409, "da-ton-tai", "Email này đã có trong danh sách");
      await cauNhatKy(c.d1, c.email, `nguoi.them.${b.vaiTro}`, `quan_tri:${email}`, c.luc).run();
      return json({ email, vaiTro: b.vaiTro, taoLuc: c.luc }, 201);
    }
    if (m === "DELETE") {
      const e = chuanHoaEmail(c.url.searchParams.get("email") ?? "");
      if (!laEmail(e)) throw sai("Thiếu email cần xóa", "email");
      if (e === c.email) throw sai("Bạn không thể tự xóa chính mình", "email");
      const dich = await c.d1.prepare("SELECT vai_tro FROM quan_tri WHERE email = ? LIMIT 1").bind(e).first<{ vai_tro: string }>();
      if (!dich) throw new LoiHttp(404, "khong-tim-thay", "Không có email này trong danh sách");
      if (dich.vai_tro === "qtv") {
        const con = await c.d1.prepare("SELECT COUNT(*) AS c FROM quan_tri WHERE vai_tro = 'qtv' AND email != ?").bind(e).first<{ c: number }>();
        if ((con?.c ?? 0) === 0) throw sai("Không thể xóa quản trị viên cuối cùng", "email");
      }
      await c.d1.batch([
        c.d1.prepare("DELETE FROM phan_cong WHERE email = ?").bind(e),
        c.d1.prepare("DELETE FROM quan_tri WHERE email = ?").bind(e),
        cauNhatKy(c.d1, c.email, "nguoi.xoa", `quan_tri:${e}`, c.luc),
      ]);
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
