// /api/nguoi: quản lý tài khoản được vào CMS (bảng quan_tri). Quyền theo duocQuanLy: sa làm mọi việc, qtv chỉ quản lý ctv.
//   GET [?vaiTro=sa|qtv|ctv&trang=]  danh sách kèm số trường được giao (sa, qtv)
//   POST { email, vaiTro }           thêm, trả matKhauTam (hiện MỘT lần, người đó phải đổi ở lần đăng nhập đầu)
//   PATCH ?email= { vaiTro }         đổi vai
//   PATCH ?email= { datLaiMatKhau: true }  đặt lại: sinh mật khẩu tạm mới (matKhauTam), phiên cũ của người đó hết hiệu lực
//   DELETE ?email=                   xóa (kèm phân công)
// Bất biến: không tự xóa/tự đổi vai chính mình; không bao giờ để hệ thống hết sa.
import { laEmail, chuanHoaEmail } from "../_thu-vien/xac-thuc";
import { cauNhatKy } from "../_thu-vien/d1";
import { bamMatKhau, sinhMatKhauTam } from "../_thu-vien/mat-khau";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, cam, docThan, docTrang, json, sai } from "../_thu-vien/phan-hoi";
import { chay, duocQuanLy, khongHoTro, QUAN_TRI, type HanhDongNguoi } from "../_thu-vien/quyen";
import type { VaiTro } from "../../../src/data/dong-gop-kiem-tra";

const VAI: readonly VaiTro[] = ["sa", "qtv", "ctv"];
const laVai = (v: unknown): v is VaiTro => typeof v === "string" && (VAI as readonly string[]).includes(v);
const NHAN: Record<VaiTro, string> = { sa: "siêu quản trị", qtv: "quản trị viên", ctv: "cộng tác viên" };

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    const m = c.request.method;
    const veto = (dich: VaiTro, hd: HanhDongNguoi) => {
      if (!duocQuanLy(c.vaiTro, dich, hd)) throw cam(`Vai trò của bạn không được ${hd === "them" ? "thêm" : hd === "xoa" ? "xóa" : hd === "dat-lai-mat-khau" ? "đặt lại mật khẩu của" : "đổi vai"} ${NHAN[dich]}`);
    };
    const docDich = async () => {
      const e = chuanHoaEmail(c.url.searchParams.get("email") ?? "");
      if (!laEmail(e)) throw sai("Thiếu email", "email");
      const d = await c.d1.prepare("SELECT vai_tro FROM quan_tri WHERE email = ? LIMIT 1").bind(e).first<{ vai_tro: VaiTro }>();
      if (!d) throw new LoiHttp(404, "khong-tim-thay", "Không có email này trong danh sách");
      return { email: e, vai: d.vai_tro };
    };
    /** Sau thay đổi này còn ít nhất một sa khác `email` không. */
    const conSaKhac = async (email: string) => ((await c.d1.prepare("SELECT COUNT(*) AS c FROM quan_tri WHERE vai_tro = 'sa' AND email != ?").bind(email).first<{ c: number }>())?.c ?? 0) > 0;

    if (m === "GET") {
      const t = docTrang(c.url);
      const loc = c.url.searchParams.get("vaiTro");
      if (loc !== null && loc !== "" && !laVai(loc)) throw sai("vaiTro phải là sa, qtv hoặc ctv", "vaiTro");
      const dk = loc ? "WHERE q.vai_tro = ?" : "";
      const gt = loc ? [loc] : [];
      const [dem, ds] = (await c.d1.batch([
        c.d1.prepare(`SELECT COUNT(*) AS c FROM quan_tri q ${dk}`).bind(...gt),
        c.d1.prepare(`SELECT q.email, q.vai_tro, q.tao_luc, (SELECT COUNT(*) FROM phan_cong p WHERE p.email = q.email) AS so_truong FROM quan_tri q ${dk} ORDER BY q.email LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset),
      ])) as unknown as [{ results: { c: number }[] }, { results: { email: string; vai_tro: string; tao_luc: string; so_truong: number }[] }];
      return json({ nguoi: ds.results.map((r) => ({ email: r.email, vaiTro: r.vai_tro, taoLuc: r.tao_luc, soTruong: r.so_truong })), tong: dem.results[0]?.c ?? 0 });
    }
    if (m === "POST") {
      const b = await docThan(c.request);
      if (!laEmail(b.email)) throw sai("Email không hợp lệ", "email");
      if (!laVai(b.vaiTro)) throw sai("vaiTro phải là sa, qtv hoặc ctv", "vaiTro");
      veto(b.vaiTro, "them");
      const email = chuanHoaEmail(b.email);
      const matKhauTam = sinhMatKhauTam();
      const r = await c.d1.prepare("INSERT OR IGNORE INTO quan_tri (email, vai_tro, tao_luc, mat_khau, phai_doi_mat_khau, mat_khau_luc) VALUES (?, ?, ?, ?, 1, ?)").bind(email, b.vaiTro, c.luc, await bamMatKhau(matKhauTam), c.luc).run();
      if ((r.meta?.changes ?? 0) === 0) throw new LoiHttp(409, "da-ton-tai", "Email này đã có trong danh sách");
      await cauNhatKy(c.d1, c.email, `nguoi.them.${b.vaiTro}`, `quan_tri:${email}`, c.luc).run();
      return json({ email, vaiTro: b.vaiTro, taoLuc: c.luc, soTruong: 0, matKhauTam }, 201);
    }
    if (m === "PATCH") {
      const d = await docDich();
      const b = await docThan(c.request);
      if (b.datLaiMatKhau === true) {
        if (d.email === c.email) throw sai("Muốn đổi mật khẩu của chính mình, hãy dùng Đổi mật khẩu", "email");
        veto(d.vai, "dat-lai-mat-khau");
        const matKhauTam = sinhMatKhauTam();
        await c.d1.batch([
          c.d1.prepare("UPDATE quan_tri SET mat_khau = ?, phai_doi_mat_khau = 1, mat_khau_luc = ? WHERE email = ?").bind(await bamMatKhau(matKhauTam), c.luc, d.email),
          cauNhatKy(c.d1, c.email, `nguoi.dat-lai-mat-khau.${d.vai}`, `quan_tri:${d.email}`, c.luc),
        ]);
        return json({ email: d.email, matKhauTam });
      }
      if (!laVai(b.vaiTro)) throw sai("vaiTro phải là sa, qtv hoặc ctv", "vaiTro");
      if (d.email === c.email) throw sai("Bạn không thể tự đổi vai trò của chính mình", "email");
      if (d.vai === b.vaiTro) return json({ email: d.email, vaiTro: d.vai });
      veto(d.vai, "doi-vai");
      veto(b.vaiTro, "doi-vai");
      if (d.vai === "sa" && !(await conSaKhac(d.email))) throw sai("Không thể hạ quyền siêu quản trị cuối cùng", "email");
      await c.d1.batch([
        c.d1.prepare("UPDATE quan_tri SET vai_tro = ? WHERE email = ?").bind(b.vaiTro, d.email),
        cauNhatKy(c.d1, c.email, `nguoi.doi-vai.${b.vaiTro}`, `quan_tri:${d.email} (${d.vai} -> ${b.vaiTro})`, c.luc),
      ]);
      return json({ email: d.email, vaiTro: b.vaiTro });
    }
    if (m === "DELETE") {
      const d = await docDich();
      if (d.email === c.email) throw sai("Bạn không thể tự xóa chính mình", "email");
      veto(d.vai, "xoa");
      if (d.vai === "sa" && !(await conSaKhac(d.email))) throw sai("Không thể xóa siêu quản trị cuối cùng", "email");
      await c.d1.batch([
        c.d1.prepare("DELETE FROM phan_cong WHERE email = ?").bind(d.email),
        c.d1.prepare("DELETE FROM quan_tri WHERE email = ?").bind(d.email),
        cauNhatKy(c.d1, c.email, `nguoi.xoa.${d.vai}`, `quan_tri:${d.email}`, c.luc),
      ]);
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
