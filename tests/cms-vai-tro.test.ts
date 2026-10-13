// Vai trò sa > qtv > ctv: ma trận quyền, bất biến sa cuối/tự xóa, migration 0006, tương thích coQuyenSuaTruong. SQLite thật, không mạng.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as nguoi } from "../cms/functions/api/nguoi";
import { xuLy as xuatBan } from "../cms/functions/api/xuat-ban-snapshot";
import { xuLy as nhatKy } from "../cms/functions/api/nhat-ky";
import { xuLy as toi } from "../cms/functions/api/toi";
import { duocQuanLy } from "../cms/functions/_thu-vien/quyen";
import { coQuyenSuaTruong, duocDatTrangThai } from "../src/data/dong-gop-kiem-tra";
import type { Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";

const migrations = fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort();
const docSql = (file: string) => fs.readFileSync(path.join("migrations", file), "utf8");
const db = new DatabaseSync(":memory:");
for (const f of migrations) db.exec(docSql(f));

const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string, private csdl: DatabaseSync) {}
  bind(...g: unknown[]) { this.gt = g; return this; }
  async first<T>() { return ((this.csdl.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null); }
  async all<T>() { return { results: this.csdl.prepare(this.sql).all(...(this.gt as never[])) as T[] }; }
  async run() { const r = this.csdl.prepare(this.sql).run(...(this.gt as never[])); return { meta: { changes: Number(r.changes) } }; }
}
const taoD1 = (csdl: DatabaseSync): KhoD1 => ({
  prepare: (sql) => new Cau(sql, csdl),
  async batch(cau) {
    csdl.exec("BEGIN");
    try {
      const ra = cau.map((c) => { const x = c as Cau; return laDoc(x.sql) ? { results: csdl.prepare(x.sql).all(...(x.gt as never[])) } : { meta: { changes: Number(csdl.prepare(x.sql).run(...(x.gt as never[])).changes) } }; });
      csdl.exec("COMMIT");
      return ra as never;
    } catch (e) { csdl.exec("ROLLBACK"); throw e; }
  },
});
const d1: KhoD1 = taoD1(db);
const SA = "sa@test.local", SA2 = "sa2@test.local", QTV = "qtv@test.local", QTV2 = "qtv2@test.local", CTV = "ctv@test.local";
const env: Env = { DB: d1, GIA_DANH_DEV: "1" };

let dem = 0;
const goiEnv = async (e: Env, h: typeof nguoi, method: string, url: string, ai: string | null, body?: unknown) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ai) headers["x-gia-danh"] = ai;
  const o = { bayGio: new Date(Date.parse("2026-10-13T03:00:00Z") + ++dem * 1000), taoId: () => `id-${dem}` };
  const r = await h({ request: new Request(`http://localhost${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env: e, params: {} }, o);
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : null };
};
const goi = (h: typeof nguoi, method: string, url: string, ai: string | null, body?: unknown) => goiEnv(env, h, method, url, ai, body);
const vaiTro = (email: string) => (db.prepare("SELECT vai_tro FROM quan_tri WHERE email = ?").get(email) as { vai_tro: string } | undefined)?.vai_tro;

// 1. Hàm thuần duocQuanLy: ma trận đầy đủ
{
  const vai = ["sa", "qtv", "ctv"] as const;
  for (const ai of vai) for (const dich of vai) for (const hd of ["them", "doi-vai", "xoa"] as const) {
    const mongDoi = ai === "sa" || (ai === "qtv" && dich === "ctv");
    assert.equal(duocQuanLy(ai, dich, hd), mongDoi, `${ai} ${hd} ${dich}`);
  }
}
// Tương thích kiểm tra sửa-trường dùng chung với app học sinh: sa như qtv
assert.equal(coQuyenSuaTruong("sa", "BKA", []), true);
assert.equal(coQuyenSuaTruong("qtv", "BKA", []), true);
assert.equal(coQuyenSuaTruong("ctv", "BKA", []), false);
assert.equal(coQuyenSuaTruong("ctv", "BKA", ["BKA"]), true);
assert.equal(duocDatTrangThai("sa", "duyet"), true);
assert.equal(duocDatTrangThai("ctv", "duyet"), false);

// 2. Không còn tự khởi tạo: sa đầu tiên do scripts/tao-sa.ts tạo (ở đây chèn thẳng); email chưa có dòng thì 403
assert.equal((await goi(toi, "GET", "/api/toi", SA)).status, 403);
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'sa', 't')").run(SA);
assert.equal((await goi(toi, "GET", "/api/toi", SA)).json.vaiTro, "sa");
assert.equal((await goi(toi, "GET", "/api/toi", SA2)).status, 403);
assert.equal((await goi(toi, "GET", "/api/toi", "la@test.local")).status, 403);

// 3. sa thêm đủ ba vai; trùng 409; vai/email sai 400
assert.equal((await goi(nguoi, "POST", "/api/nguoi", SA, { email: SA2.toUpperCase(), vaiTro: "sa" })).status, 201);
for (const [e, v] of [[QTV, "qtv"], [QTV2, "qtv"], [CTV, "ctv"]] as const) assert.equal((await goi(nguoi, "POST", "/api/nguoi", SA, { email: e.toUpperCase(), vaiTro: v })).status, 201);
assert.equal(vaiTro(QTV), "qtv", "email lưu chữ thường");
assert.equal((await goi(nguoi, "POST", "/api/nguoi", SA, { email: CTV, vaiTro: "ctv" })).status, 409);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", SA, { email: "x@test.local", vaiTro: "root" })).status, 400);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", SA, { email: "khong-phai-email", vaiTro: "ctv" })).status, 400);

// 4. qtv: chỉ quản lý ctv
assert.equal((await goi(nguoi, "POST", "/api/nguoi", QTV, { email: "moi-sa@test.local", vaiTro: "sa" })).status, 403);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", QTV, { email: "moi-qtv@test.local", vaiTro: "qtv" })).status, 403);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", QTV, { email: "ctv2@test.local", vaiTro: "ctv" })).status, 201);
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${CTV}`, QTV, { vaiTro: "qtv" })).status, 403, "qtv không nâng ctv lên qtv");
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${QTV2}`, QTV, { vaiTro: "ctv" })).status, 403, "qtv không hạ qtv khác");
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${SA2}`, QTV, { vaiTro: "ctv" })).status, 403, "qtv không hạ sa");
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${QTV2}`, QTV)).status, 403);
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${SA2}`, QTV)).status, 403);
assert.equal((await goi(nguoi, "DELETE", "/api/nguoi?email=ctv2@test.local", QTV)).status, 204, "qtv xóa được ctv");
assert.equal(vaiTro(QTV2), "qtv");
assert.equal(vaiTro(SA2), "sa");

// 5. ctv không dùng được API người
assert.equal((await goi(nguoi, "GET", "/api/nguoi", CTV)).status, 403);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", CTV, { email: "y@test.local", vaiTro: "ctv" })).status, 403);

// 6. Danh sách: lọc vai trò, kèm số trường được giao
db.prepare("INSERT INTO phan_cong (email, ma_truong) VALUES (?, 'BKA'), (?, 'QSC')").run(CTV, CTV);
{
  const r = await goi(nguoi, "GET", "/api/nguoi?vaiTro=ctv", QTV);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.nguoi.map((x: { email: string; soTruong: number }) => [x.email, x.soTruong]), [[CTV, 2]]);
  assert.equal((await goi(nguoi, "GET", "/api/nguoi?vaiTro=sa", QTV)).json.tong, 2);
  assert.equal((await goi(nguoi, "GET", "/api/nguoi?vaiTro=zzz", QTV)).status, 400);
  assert.equal((await goi(nguoi, "GET", "/api/nguoi", SA)).json.tong, 5);
}

// 7. sa: đổi vai, xóa qtv
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${CTV}`, SA, { vaiTro: "qtv" })).status, 200);
assert.equal(vaiTro(CTV), "qtv");
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${CTV}`, SA, { vaiTro: "ctv" })).status, 200);
assert.equal((await goi(nguoi, "PATCH", "/api/nguoi?email=khong-co@test.local", SA, { vaiTro: "ctv" })).status, 404);
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${CTV}`, SA, { vaiTro: "boss" })).status, 400);
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${QTV2}`, SA)).status, 204);

// 8. Bất biến: tự xóa/tự hạ; sa cuối cùng
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${SA}`, SA)).status, 400, "không tự xóa mình");
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${SA}`, SA, { vaiTro: "qtv" })).status, 400, "không tự hạ mình");
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${SA2}`, SA, { vaiTro: "qtv" })).status, 200, "hạ sa khác khi còn sa");
assert.equal(vaiTro(SA), "sa", "sa cuối cùng còn nguyên");
// sa2 đã hạ xuống qtv thì không còn quản lý được sa
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${SA}`, SA2)).status, 403);
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${SA}`, SA2, { vaiTro: "ctv" })).status, 403);
// sa2 vẫn là qtv
assert.equal((await goi(toi, "GET", "/api/toi", SA2)).json.vaiTro, "qtv");
// bảo vệ tầng dữ liệu: không còn sa nào khác thì không thể xóa/hạ sa dù có thực hiện bởi sa khác (kịch bản đua): giả lập bằng cách đưa sa2 lên lại rồi xóa SA bởi sa2
assert.equal((await goi(nguoi, "PATCH", `/api/nguoi?email=${SA2}`, SA, { vaiTro: "sa" })).status, 200);
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${SA}`, SA2)).status, 204, "còn sa2 nên xóa được SA");
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${SA2}`, SA2)).status, 400, "sa2 giờ là sa cuối cùng");
assert.equal((await goi(toi, "GET", "/api/toi", SA)).status, 403, "SA đã bị xóa thì không còn quyền");
assert.equal(vaiTro(SA), undefined);

// 9. Hành động hệ thống chỉ sa
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, { action: "DONG_BO_VECTOR" })).status, 403);
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, { action: "DONG_BO_KV" })).status, 403);
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, { action: "ROLLBACK", targetVersion: "x" })).status, 403);
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", CTV, { action: "PUBLISH" })).status, 403);
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", SA2, { action: "DONG_BO_KV" })).status, 404, "sa qua cổng quyền (chưa có snapshot nên 404)");
assert.equal((await goi(xuatBan, "GET", "/api/xuat-ban-snapshot", QTV)).status, 200, "qtv vẫn xem trạng thái xuất bản");

// 10. Nhật ký: sa thấy đủ, qtv không thấy thao tác lên sa/qtv nhưng thấy thao tác lên ctv
{
  const dayDu = (await goi(nhatKy, "GET", "/api/nhat-ky", SA2)).json;
  const rut = (await goi(nhatKy, "GET", "/api/nhat-ky", QTV)).json;
  const hd = (j: { nhatKy: { hanhDong: string }[] }) => j.nhatKy.map((x) => x.hanhDong);
  assert.ok(hd(dayDu).includes("nguoi.them.qtv"));
  assert.ok(!hd(rut).some((h) => h === "nguoi.them.qtv" || h.endsWith(".sa")));
  assert.ok(hd(rut).includes("nguoi.them.ctv"));
  assert.ok(rut.tong < dayDu.tong);
  assert.equal((await goi(nhatKy, "GET", "/api/nhat-ky", CTV)).status, 403);
}

// 11. Migration 0006 trên DB cũ có dữ liệu: giữ nguyên hàng và bảng phụ, nhận 'sa', chạy lại vẫn an toàn
{
  const cu = new DatabaseSync(":memory:");
  for (const f of migrations.filter((x) => x < "0006")) cu.exec(docSql(f));
  cu.exec("INSERT INTO quan_tri VALUES ('a@x.vn','qtv','t1'), ('b@x.vn','ctv','t2'); INSERT INTO phan_cong VALUES ('b@x.vn','BKA')");
  assert.throws(() => cu.exec("INSERT INTO quan_tri VALUES ('s@x.vn','sa','t')"), /CHECK/, "bảng cũ chưa nhận sa");
  const sql = docSql("0006_vai_tro_sa.sql");
  cu.exec(sql);
  cu.exec(sql);
  assert.deepEqual(cu.prepare("SELECT email, vai_tro, tao_luc FROM quan_tri ORDER BY email").all().map((r) => ({ ...r })), [{ email: "a@x.vn", vai_tro: "qtv", tao_luc: "t1" }, { email: "b@x.vn", vai_tro: "ctv", tao_luc: "t2" }]);
  assert.equal((cu.prepare("SELECT COUNT(*) AS c FROM phan_cong").get() as { c: number }).c, 1);
  cu.exec("INSERT INTO quan_tri VALUES ('s@x.vn','sa','t')");
  assert.throws(() => cu.exec("INSERT INTO quan_tri VALUES ('z@x.vn','root','t')"), /CHECK/);
  assert.equal(cu.prepare("SELECT name FROM sqlite_master WHERE name = 'quan_tri_moi'").get(), undefined);
}
console.log("OK cms-vai-tro");
