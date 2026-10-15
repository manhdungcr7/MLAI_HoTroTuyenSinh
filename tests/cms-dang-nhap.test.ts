// Đăng nhập email + mật khẩu của CMS: phiên cookie, giới hạn sai, Origin, mật khẩu tạm/đổi/đặt lại, script tao-sa. SQLite thật, không mạng.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as dangNhap } from "../cms/functions/api/dang-nhap";
import { xuLy as dangXuat } from "../cms/functions/api/dang-xuat";
import { xuLy as doiMk } from "../cms/functions/api/doi-mat-khau";
import { xuLy as nguoi } from "../cms/functions/api/nguoi";
import { xuLy as toi } from "../cms/functions/api/toi";
import { bamMatKhau, sinhMatKhauTam, xacMinhMatKhau } from "../cms/functions/_thu-vien/mat-khau";
import { docThamSo, sqlTaoSa } from "../scripts/tao-sa";
import type { BoiCanh, Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";

const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string) {}
  bind(...g: unknown[]) { this.gt = g; return this; }
  async first<T>() { return ((db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null); }
  async all<T>() { return { results: db.prepare(this.sql).all(...(this.gt as never[])) as T[] }; }
  async run() { return { meta: { changes: Number(db.prepare(this.sql).run(...(this.gt as never[])).changes) } }; }
}
const d1: KhoD1 = {
  prepare: (sql) => new Cau(sql),
  async batch(cau) {
    db.exec("BEGIN");
    try {
      const ra = cau.map((c) => { const x = c as Cau; return laDoc(x.sql) ? { results: db.prepare(x.sql).all(...(x.gt as never[])) } : { meta: { changes: Number(db.prepare(x.sql).run(...(x.gt as never[])).changes) } }; });
      db.exec("COMMIT");
      return ra as never;
    } catch (e) { db.exec("ROLLBACK"); throw e; }
  },
};
const kvMap = new Map<string, string>();
const env: Env = { DB: d1, KV_CONG_DONG: { get: async (k) => kvMap.get(k) ?? null, put: async (k, v) => { kvMap.set(k, v); } }, SESSION_SECRET: "bi-mat-thu-nghiem-0123456789abcdef" };

const HOST = "https://cms.test";
let gio = Date.parse("2026-10-13T03:00:00Z");
const tatCa: string[] = []; // mọi phản hồi, để kiểm mật khẩu không lộ
interface Tuy { cookie?: string | null; body?: unknown; origin?: string | null; ip?: string; env?: Env }
const goi = async (h: unknown, method: string, url: string, t: Tuy = {}) => {
  gio += 1000;
  const headers: Record<string, string> = { "content-type": "application/json", "cf-connecting-ip": t.ip ?? "1.1.1.1" };
  if (t.origin !== null) headers.origin = t.origin ?? HOST;
  if (t.cookie) headers.cookie = t.cookie;
  const xl = h as (c: BoiCanh, o: { bayGio: Date }) => Promise<Response>;
  const r = await xl({ request: new Request(`${HOST}${url}`, { method, headers, body: t.body === undefined ? undefined : JSON.stringify(t.body) }), env: t.env ?? env, params: {} }, { bayGio: new Date(gio) });
  const txt = await r.text();
  tatCa.push(txt);
  return { status: r.status, json: txt ? JSON.parse(txt) : null, setCookie: r.headers.get("set-cookie") };
};
const cookieCua = (sc: string | null) => sc!.split(";")[0];
const vao = (email: string, matKhau: string, ip = "1.1.1.1") => goi(dangNhap, "POST", "/api/dang-nhap", { body: { email, matKhau }, ip });

const SA = "sa@test.local", QTV = "qtv@test.local", QTV2 = "qtv2@test.local", CTV = "ctv@test.local", CTV2 = "ctv2@test.local";
const MK_SA = "Mat-khau-sa-1";

// 0. Hàm thuần và script
{
  const h = await bamMatKhau("abcdefgh");
  assert.match(h, /^pbkdf2_sha256\$100000\$[\w-]+\$[\w-]+$/);
  assert.notEqual(h, await bamMatKhau("abcdefgh"), "muối ngẫu nhiên");
  assert.ok(await xacMinhMatKhau("abcdefgh", h));
  assert.ok(!(await xacMinhMatKhau("abcdefgH", h)));
  assert.ok(!(await xacMinhMatKhau("abcdefgh", "rac")) && !(await xacMinhMatKhau("x", null)));
  const t = sinhMatKhauTam();
  assert.match(t, /^[A-Za-z2-9]{14}$/);
  assert.notEqual(t, sinhMatKhauTam());
  assert.throws(() => docThamSo([]), /email/i);
  assert.throws(() => docThamSo(["khong-phai-email"]), /email/i);
  assert.throws(() => docThamSo(["a@b.vn", "--mat-khau=ngan"]), /8 ký tự/);
  assert.throws(() => docThamSo(["a@b.vn", "--la"]), /lạ/);
  assert.deepEqual(docThamSo(["A@B.vn", "--remote", "--mat-khau=du-dai-roi"]), { email: "a@b.vn", matKhau: "du-dai-roi", dich: "remote" });
  const sql = await sqlTaoSa("o'neil@x.vn", "mat-khau-bi-mat");
  assert.ok(sql.includes("'o''neil@x.vn'") && !sql.includes("mat-khau-bi-mat"), "SQL thoát dấu nháy và không chứa mật khẩu");
  db.exec(await sqlTaoSa(SA, MK_SA, new Date(gio)));
  db.exec(await sqlTaoSa(SA, MK_SA, new Date(gio))); // chạy lại không lỗi (upsert)
  const r = db.prepare("SELECT vai_tro, phai_doi_mat_khau FROM quan_tri WHERE email = ?").get(SA) as { vai_tro: string; phai_doi_mat_khau: number };
  assert.deepEqual({ ...r }, { vai_tro: "sa", phai_doi_mat_khau: 1 });
}

// 1. Đăng nhập đúng/sai/email lạ: cùng thông báo
const sai1 = await vao(SA, "sai-mat-khau-roi");
const sai2 = await vao("khong-co@test.local", "bat-ky-gi-do");
assert.equal(sai1.status, 401);
assert.deepEqual(sai1.json, sai2.json, "sai mật khẩu và email lạ giống hệt nhau");
assert.equal(sai1.json.thongBao, "Email hoặc mật khẩu không đúng");
assert.equal((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: SA } })).status, 401);
assert.equal((await goi(dangNhap, "GET", "/api/dang-nhap")).status, 405);
const dn = await vao(SA.toUpperCase(), MK_SA);
assert.equal(dn.status, 200);
assert.deepEqual(dn.json, { email: SA, vaiTro: "sa", phaiDoiMatKhau: true });
for (const co of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/", "Max-Age=43200"]) assert.ok(dn.setCookie!.includes(co), co);
let ckSa = cookieCua(dn.setCookie);

// 2. Mật khẩu tạm: chỉ được /api/toi và đổi mật khẩu
assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckSa })).json.phaiDoiMatKhau, true);
const chan = await goi(nguoi, "GET", "/api/nguoi", { cookie: ckSa });
assert.equal(chan.status, 403);
assert.equal(chan.json.ma, "phai-doi-mat-khau");
assert.equal((await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: ckSa, body: { matKhauCu: "sai-roi-sai", matKhauMoi: "Mat-khau-moi-9" } })).status, 400, "sai mật khẩu cũ");
assert.equal((await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: ckSa, body: { matKhauCu: MK_SA, matKhauMoi: "ngan" } })).status, 400, "mật khẩu mới yếu");
assert.equal((await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: ckSa, body: { matKhauCu: MK_SA, matKhauMoi: MK_SA } })).status, 400, "không đổi thành chính nó");
const MK_SA2 = "Mat-khau-sa-moi-2";
const doi = await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: ckSa, body: { matKhauCu: MK_SA, matKhauMoi: MK_SA2 } });
assert.equal(doi.status, 200);
ckSa = cookieCua(doi.setCookie);
assert.equal((await goi(nguoi, "GET", "/api/nguoi", { cookie: ckSa })).status, 200, "đổi xong dùng được API khác");
assert.equal((await vao(SA, MK_SA)).status, 401, "mật khẩu cũ hết dùng");
assert.equal((await vao(SA, MK_SA2)).json.phaiDoiMatKhau, false);

// 3. Giới hạn 5 lần sai/15 phút theo IP + email
for (let i = 0; i < 5; i++) assert.equal((await vao(CTV, "sai-lan-" + i + "-xxx", "9.9.9.9")).status, 401);
assert.equal((await vao(CTV, "sai-lan-6-xxx", "9.9.9.9")).status, 429);
assert.equal((await vao(SA, "sai-lan-6-xxx", "9.9.9.9")).status, 401, "email khác cùng IP chưa bị khóa");
assert.equal((await vao(CTV, "sai-lan-6-xxx", "8.8.8.8")).status, 401, "IP khác chưa bị khóa");

// 4. Cookie hỏng
{
  const [dau, ky] = ckSa.slice("nv_cms=".length).split(".");
  const doiPayload = Buffer.from(JSON.stringify({ e: QTV, h: 9999999999, i: 0 })).toString("base64url");
  const ca: [string, string | null][] = [["không cookie", null], ["rác", "nv_cms=abc"], ["sửa payload", `nv_cms=${doiPayload}.${ky}`], ["chữ ký rỗng", `nv_cms=${dau}.`], ["chữ ký khác", `nv_cms=${dau}.${ky.slice(1)}A`]];
  for (const [ten, ck] of ca) assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ck })).status, 401, ten);
  const khacBiMat = { ...env, SESSION_SECRET: "bi-mat-khac-0123456789abcdefgh" };
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckSa, env: khacBiMat })).status, 401, "ký bằng bí mật khác");
  const thieu = await goi(toi, "GET", "/api/toi", { cookie: ckSa, env: { ...env, SESSION_SECRET: undefined } });
  assert.equal(thieu.status, 500, "thiếu SESSION_SECRET");
  assert.equal(thieu.json.ma, "chua-cau-hinh");
  assert.equal((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: SA, matKhau: MK_SA2 }, env: { ...env, SESSION_SECRET: "" } })).status, 500);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckSa })).status, 200, "cookie thật vẫn tốt");
}

// 5. Origin khi ghi
{
  const b = { email: "x@test.local", vaiTro: "ctv" };
  assert.equal((await goi(nguoi, "POST", "/api/nguoi", { cookie: ckSa, body: b, origin: "https://ke-xau.test" })).status, 403);
  assert.equal((await goi(nguoi, "POST", "/api/nguoi", { cookie: ckSa, body: b, origin: null })).status, 403);
  assert.equal((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: SA, matKhau: MK_SA2 }, origin: "https://ke-xau.test" })).status, 403);
  assert.equal(db.prepare("SELECT 1 FROM quan_tri WHERE email = 'x@test.local'").get(), undefined);
  assert.equal((await goi(nguoi, "GET", "/api/nguoi", { cookie: ckSa, origin: null })).status, 200, "GET không cần Origin");
}

// 6. Thêm người: mật khẩu tạm một lần, buộc đổi
const them = (ai: string, email: string, vaiTro: string) => goi(nguoi, "POST", "/api/nguoi", { cookie: ai, body: { email, vaiTro } });
const tQtv = await them(ckSa, QTV, "qtv");
assert.equal(tQtv.status, 201);
assert.match(tQtv.json.matKhauTam, /^[A-Za-z2-9]{14}$/);
const matKhauDaThay: string[] = [MK_SA, MK_SA2, tQtv.json.matKhauTam];
const dnQtv = await vao(QTV, tQtv.json.matKhauTam);
assert.equal(dnQtv.json.phaiDoiMatKhau, true);
assert.equal((await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: cookieCua(dnQtv.setCookie), body: { matKhauCu: tQtv.json.matKhauTam, matKhauMoi: "Qtv-mat-khau-moi" } })).status, 200);
matKhauDaThay.push("Qtv-mat-khau-moi");
const ckQtv = cookieCua((await vao(QTV, "Qtv-mat-khau-moi")).setCookie);
assert.equal((await goi(nguoi, "GET", "/api/nguoi", { cookie: ckQtv })).status, 200);

const tCtv = await them(ckQtv, CTV, "ctv"); // qtv thêm ctv
assert.equal(tCtv.status, 201);
const tCtv2 = await them(ckQtv, CTV2, "ctv");
assert.equal((await them(ckQtv, QTV2, "qtv")).status, 403, "qtv không thêm qtv");
const tQtv2 = await them(ckSa, QTV2, "qtv");
matKhauDaThay.push(tCtv.json.matKhauTam, tCtv2.json.matKhauTam, tQtv2.json.matKhauTam);

// 7. Đặt lại mật khẩu theo ma trận quyền
const datLai = (ai: string, email: string) => goi(nguoi, "PATCH", `/api/nguoi?email=${email}`, { cookie: ai, body: { datLaiMatKhau: true } });
{
  const ckCtv = cookieCua((await vao(CTV, tCtv.json.matKhauTam)).setCookie);
  assert.equal((await goi(doiMk, "POST", "/api/doi-mat-khau", { cookie: ckCtv, body: { matKhauCu: tCtv.json.matKhauTam, matKhauMoi: "Ctv-mat-khau-moi" } })).status, 200);
  matKhauDaThay.push("Ctv-mat-khau-moi");
  const ckCtvThat = cookieCua((await vao(CTV, "Ctv-mat-khau-moi")).setCookie);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckCtvThat })).status, 200);

  const rs = await datLai(ckQtv, CTV);
  assert.equal(rs.status, 200, "qtv đặt lại ctv");
  assert.match(rs.json.matKhauTam, /^[A-Za-z2-9]{14}$/);
  matKhauDaThay.push(rs.json.matKhauTam);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckCtvThat })).status, 401, "phiên cũ của ctv hết hiệu lực sau khi đặt lại");
  assert.equal((await vao(CTV, "Ctv-mat-khau-moi")).status, 401, "mật khẩu cũ hết dùng");
  assert.equal((await vao(CTV, rs.json.matKhauTam)).json.phaiDoiMatKhau, true, "mật khẩu tạm mới, bị buộc đổi");

  assert.equal((await datLai(ckQtv, QTV2)).status, 403, "qtv không đặt lại qtv");
  assert.equal((await datLai(ckQtv, SA)).status, 403, "qtv không đặt lại sa");
  assert.equal((await datLai(ckQtv, QTV)).status, 400, "không tự đặt lại qua đường này");
  const rq = await datLai(ckSa, QTV2);
  assert.equal(rq.status, 200, "sa đặt lại qtv");
  matKhauDaThay.push(rq.json.matKhauTam);
  assert.equal((await datLai(ckSa, "khong-co@test.local")).status, 404);
  const ckCtv2 = cookieCua((await vao(CTV2, tCtv2.json.matKhauTam)).setCookie);
  assert.equal((await datLai(ckCtv2, CTV)).status, 403, "ctv bị chặn (đang buộc đổi mật khẩu hoặc không đủ vai)");
}

// 8. Xóa người: cookie còn hạn vẫn 401 ngay
{
  const ckCtv2 = cookieCua((await vao(CTV2, tCtv2.json.matKhauTam)).setCookie);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckCtv2 })).status, 200);
  assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${CTV2}`, { cookie: ckQtv })).status, 204);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckCtv2 })).status, 401);
  assert.equal((await vao(CTV2, tCtv2.json.matKhauTam)).status, 401);
}

// 9. Đăng xuất xóa cookie; hết hạn sau 12 giờ
{
  const moi = cookieCua((await vao(SA, MK_SA2)).setCookie);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: moi })).status, 200);
  const xuat = await goi(dangXuat, "POST", "/api/dang-xuat", { cookie: moi });
  assert.equal(xuat.status, 204);
  assert.ok(xuat.setCookie!.startsWith("nv_cms=;") && xuat.setCookie!.includes("Max-Age=0"));
  assert.equal((await goi(dangXuat, "POST", "/api/dang-xuat", { origin: "https://ke-xau.test" })).status, 403);
  gio += 12 * 3600 * 1000;
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: moi })).status, 401, "quá 12 giờ");
}

// 10. Mật khẩu không lộ: không ở nhật ký, bảng chỉ có băm, phản hồi không lặp lại mật khẩu người dùng đặt
{
  const nhatKy = JSON.stringify(db.prepare("SELECT * FROM nhat_ky").all());
  const hanhDong = (db.prepare("SELECT hanh_dong FROM nhat_ky").all() as { hanh_dong: string }[]).map((x) => x.hanh_dong);
  assert.ok(hanhDong.includes("quan-tri.dang-nhap") && hanhDong.includes("quan-tri.doi-mat-khau") && hanhDong.some((h) => h.startsWith("nguoi.dat-lai-mat-khau")));
  assert.ok(!hanhDong.some((h) => h.includes("that-bai")), "không ghi nhật ký đăng nhập thất bại");
  const bang = JSON.stringify(db.prepare("SELECT * FROM quan_tri").all());
  for (const mk of matKhauDaThay) {
    assert.ok(!nhatKy.includes(mk), "nhật ký không có mật khẩu");
    assert.ok(!bang.includes(mk), "bảng chỉ lưu băm");
  }
  const phanHoi = tatCa.join("\n");
  for (const mk of [MK_SA, MK_SA2, "Qtv-mat-khau-moi", "Ctv-mat-khau-moi"]) assert.ok(!phanHoi.includes(mk), "phản hồi không lặp lại mật khẩu người dùng đặt");
  assert.ok(!phanHoi.includes("sha256$"), "không lộ bản băm");
}
console.log("OK cms-dang-nhap");
