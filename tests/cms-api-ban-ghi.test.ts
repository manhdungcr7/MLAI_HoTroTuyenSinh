// Kiểm thử máy chủ CMS bằng SQLite thật trong bộ nhớ (node:sqlite) + migrations thật, không mạng.
// Phủ: xác thực, phân quyền qtv/ctv ở máy chủ, quy trình DRAFT->SUBMITTED->APPROVED->PUBLISHED, từ chối có lý do, tăng version khi sửa,
// nguồn bắt buộc, xuất bản snapshot (phiên bản, hash, SUPERSEDED), rollback, khóa xuất bản.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as banGhi } from "../cms/functions/api/ban-ghi";
import { xuLy as xuatBan } from "../cms/functions/api/xuat-ban-snapshot";
import { xuLy as nguoi } from "../cms/functions/api/nguoi";
import { xuLy as phanCong } from "../cms/functions/api/phan-cong";
import { xuLy as nhatKy } from "../cms/functions/api/nhat-ky";
import { tinhHashSha256 } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import type { Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";

// ---------- D1 giả bằng node:sqlite ----------
const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string) {}
  bind(...g: unknown[]) { this.gt = g; return this; }
  async first<T>() { return ((db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null); }
  async all<T>() { return { results: db.prepare(this.sql).all(...(this.gt as never[])) as T[] }; }
  async run() { const r = db.prepare(this.sql).run(...(this.gt as never[])); return { meta: { changes: Number(r.changes) } }; }
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
const env: Env = { DB: d1, KV_CONG_DONG: { get: async (k) => kvMap.get(k) ?? null, put: async (k, v) => { kvMap.set(k, v); } }, GIA_DANH_DEV: "1", QTV_DAU_TIEN: "qtv@test.local" };

let dem = 0;
const goi = async (h: typeof banGhi, method: string, url: string, ai: string | null, body?: unknown) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ai) headers["x-gia-danh"] = ai;
  const o = { bayGio: new Date(Date.parse("2026-10-07T03:00:00Z") + ++dem * 1000), taoId: () => `id-${dem}` };
  const r = await h({ request: new Request(`http://localhost${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, params: {} }, o);
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : null };
};
const QTV = "qtv@test.local", CTV = "ctv@test.local";
const nguon = { url: "https://tuyensinh.hust.edu.vn/ktx", tieuDe: "Thông tin ký túc xá", donViCongBo: "ĐH Bách Khoa Hà Nội" };

// 1. Xác thực: không header -> 401; email lạ -> 403
assert.equal((await goi(banGhi, "GET", "/api/ban-ghi", null)).status, 401);
assert.equal((await goi(banGhi, "GET", "/api/ban-ghi", "la@test.local")).status, 403);
// qtv đầu tiên tự khởi tạo từ QTV_DAU_TIEN, rồi thêm ctv và phân công
assert.equal((await goi(nguoi, "GET", "/api/nguoi", QTV)).status, 200);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", QTV, { email: CTV, vaiTro: "ctv" })).status, 201);
assert.equal((await goi(nguoi, "POST", "/api/nguoi", QTV, { email: CTV, vaiTro: "ctv" })).status, 409);
assert.equal((await goi(phanCong, "PUT", "/api/phan-cong", QTV, { email: CTV, maTruong: ["ZZZ"] })).status, 400);
assert.equal((await goi(phanCong, "PUT", "/api/phan-cong", QTV, { email: CTV, maTruong: ["BKA"] })).status, 200);
assert.equal((await goi(nguoi, "GET", "/api/nguoi", CTV)).status, 403, "ctv không được xem danh sách người");
assert.equal((await goi(phanCong, "PUT", "/api/phan-cong", CTV, { email: CTV, maTruong: ["BKA", "QSC"] })).status, 403, "ctv không tự phân công");
assert.equal((await goi(nguoi, "DELETE", `/api/nguoi?email=${QTV}`, QTV)).status, 400, "không tự xóa mình");

// 2. Tạo: nguồn bắt buộc, loại hợp lệ, trường được giao
const tao = (extra: Record<string, unknown> = {}) => ({ entityType: "noi_luu_tru", entityId: "BKA-ktx", data: { maTruong: "BKA", coKyTucXa: "co" }, source: nguon, ...extra });
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao({ source: undefined }))).status, 400, "thiếu nguồn");
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao({ source: { ...nguon, url: "javascript:alert(1)" } }))).status, 400, "link nguồn phải http(s)");
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao({ entityType: "xxx" }))).status, 400);
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao({ entityId: "QSC-ktx", data: { maTruong: "QSC" } }))).status, 403, "trường chưa giao");
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao({ data: { maTruong: "QSC" } }))).status, 400, "data.maTruong lệch entityId");
const t1 = await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao());
assert.equal(t1.status, 201);
assert.equal(t1.json.status, "DRAFT");
assert.equal(t1.json.version, 1);
assert.equal(t1.json.source.nguoiKiemChung, CTV, "người kiểm chứng do máy chủ đặt");
const id = t1.json.id as string;
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, tao())).status, 409, "không tạo trùng thực thể");

// 3. Quy trình và phân quyền chuyển trạng thái
const doi = (ai: string, status: string, extra: Record<string, unknown> = {}) => goi(banGhi, "PATCH", "/api/ban-ghi", ai, { id, status, ...extra });
assert.equal((await doi(CTV, "APPROVED")).status, 403, "ctv không tự duyệt");
assert.equal((await doi(QTV, "PUBLISHED")).status, 400, "không đặt PUBLISHED trực tiếp");
assert.equal((await doi(QTV, "APPROVED")).status, 409, "DRAFT chưa thể duyệt");
assert.equal((await doi(CTV, "SUBMITTED")).status, 200);
assert.equal((await doi(QTV, "REJECTED")).status, 400, "từ chối phải có lý do");
const tc = await doi(QTV, "REJECTED", { rejectionReason: "Cần link nguồn chính thức hơn" });
assert.equal(tc.json.status, "REJECTED");
assert.equal(tc.json.rejectionReason, "Cần link nguồn chính thức hơn");
const sua = await goi(banGhi, "PUT", "/api/ban-ghi", CTV, { id, data: { maTruong: "BKA", coKyTucXa: "co", ghiChu: "bổ sung" }, source: nguon });
assert.equal(sua.status, 200);
assert.equal(sua.json.version, 2, "sửa bản bị từ chối tăng version");
assert.equal((await goi(banGhi, "GET", `/api/ban-ghi?id=${id}`, QTV)).json.data.ghiChu, "bổ sung");
const gl = await doi(CTV, "SUBMITTED");
assert.equal(gl.json.rejectionReason, undefined, "gửi lại xóa lý do cũ");
assert.equal((await goi(banGhi, "PUT", "/api/ban-ghi", CTV, { id, data: {}, source: nguon })).status, 400, "đã gửi duyệt thì không sửa");
assert.equal((await doi(QTV, "APPROVED")).json.status, "APPROVED");

// 4. Xuất bản: chỉ qtv, snapshot có version + hash khớp nội dung
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", CTV, {})).status, 403);
const xb = await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, {});
assert.equal(xb.status, 200);
assert.match(xb.json.dataVersion, /^2026\.10\.07\.01$/);
assert.equal(xb.json.soBanGhiMoi, 1);
assert.equal(xb.json.dongBoKv, "ok");
const cm = xb.json.manifest.datasets.community;
assert.equal(cm.recordCount, 1);
const tep = db.prepare("SELECT noi_dung, hash_sha256 FROM snapshot_tap WHERE data_version = ? AND ten = 'community'").get("2026.10.07.01") as { noi_dung: string; hash_sha256: string };
assert.equal(await tinhHashSha256(tep.noi_dung), cm.hash, "hash manifest khớp nội dung tệp");
assert.equal(tep.hash_sha256, cm.hash);
assert.ok(kvMap.get("manifest:active")?.includes("2026.10.07.01"), "KV manifest:active đã cập nhật");
assert.equal((await goi(banGhi, "GET", `/api/ban-ghi?id=${id}`, QTV)).json.status, "PUBLISHED");
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, {})).status, 409, "không còn gì để xuất bản");

// 5. Bản sửa đổi: v3, xuất bản xong bản cũ thành SUPERSEDED, phiên bản snapshot tăng
const mod = await goi(banGhi, "POST", "/api/ban-ghi", CTV, { action: "CREATE_MODIFICATION", currentId: id, duLieuMoi: { maTruong: "BKA", coKyTucXa: "khong" }, changeNote: "cập nhật" });
assert.equal(mod.status, 201);
assert.equal(mod.json.version, 3);
assert.equal(mod.json.previousVersionId, id);
assert.equal((await goi(banGhi, "POST", "/api/ban-ghi", CTV, { action: "CREATE_MODIFICATION", currentId: id })).status, 409, "đã có bản nháp mở");
const id2 = mod.json.id as string;
await goi(banGhi, "PATCH", "/api/ban-ghi", CTV, { id: id2, status: "SUBMITTED" });
await goi(banGhi, "PATCH", "/api/ban-ghi", QTV, { id: id2, status: "APPROVED" });
const xb2 = await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, {});
assert.equal(xb2.json.dataVersion, "2026.10.07.02");
assert.equal(xb2.json.tongBanGhiPublished, 1);
assert.equal((await goi(banGhi, "GET", `/api/ban-ghi?id=${id}`, QTV)).json.status, "SUPERSEDED");
assert.equal((await goi(banGhi, "GET", `/api/ban-ghi?status=PUBLISHED`, QTV)).json.tong, 1);

// 6. Lịch sử, rollback, nhật ký
const ls = await goi(xuatBan, "GET", "/api/xuat-ban-snapshot", QTV);
assert.equal(ls.json.tong, 2);
assert.equal(ls.json.dangChay.dataVersion, "2026.10.07.02");
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, { action: "ROLLBACK", targetVersion: "1999.01.01.01" })).status, 404);
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, { action: "ROLLBACK", targetVersion: "2026.10.07.01" })).status, 200);
assert.equal((await goi(xuatBan, "GET", "/api/xuat-ban-snapshot", QTV)).json.dangChay.dataVersion, "2026.10.07.01");
assert.ok(JSON.parse(kvMap.get("manifest:active")!).dataVersion === "2026.10.07.01", "rollback đồng bộ KV");
const nk = await goi(nhatKy, "GET", "/api/nhat-ky?moi=50", QTV);
assert.equal(nk.status, 200);
assert.ok(nk.json.nhatKy.some((x: { hanhDong: string }) => x.hanhDong === "REJECT") && nk.json.nhatKy.some((x: { hanhDong: string }) => x.hanhDong === "PUBLISH"), "nhật ký có REJECT và PUBLISH");
assert.equal((await goi(nhatKy, "GET", "/api/nhat-ky", CTV)).status, 403);

// 7. Khóa xuất bản: người khác đang giữ thì 409
db.prepare("INSERT INTO khoa_xuat_ban VALUES ('publish_lock', 'khac@test.local', '2026-10-07T03:00:00.000Z', '2099-01-01T00:00:00.000Z')").run();
assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", QTV, {})).status, 409);

console.log("tests/cms-api-ban-ghi.test.ts: tất cả đều qua");
