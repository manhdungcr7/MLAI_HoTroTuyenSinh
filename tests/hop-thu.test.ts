// Kiểm thử hộp thư cộng đồng: báo sai và đăng ký tình nguyện viên (phía học sinh) cùng hộp thư trong CMS. SQLite thật + migrations thật.
// Chạy: npx tsx tests/hop-thu.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLyBaoSai } from "../functions/api/bao-sai";
import { kiemTraDangKyTinhNguyen, xuLyTinhNguyen } from "../functions/api/tinh-nguyen";
import { xuLy as hopThu } from "../cms/functions/api/hop-thu";
import { xuLy as phanCong } from "../cms/functions/api/phan-cong";
import { xuLy as nguoi } from "../cms/functions/api/nguoi";
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
const kv = { get: async (k: string) => kvMap.get(k) ?? null, put: async (k: string, v: string) => { kvMap.set(k, v); } };
const env: Env = { DB: d1, KV_CONG_DONG: kv, GIA_DANH_DEV: "1", QTV_DAU_TIEN: "qtv@test.local" };

// ---------- Phía học sinh ----------
const gui = (xuLy: typeof xuLyBaoSai | typeof xuLyTinhNguyen, body: unknown, ip = "1.2.3.4", method = "POST") =>
  xuLy(new Request("http://localhost/api/x", { method, headers: { "cf-connecting-ip": ip, "content-type": "application/json" }, body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined }), { DB: d1 as never, KV_CONG_DONG: kv });
const baoSai = { maChuongTrinh: "bka-47a6194c", truongDuLieu: "Điểm chuẩn", noiDung: "Điểm chuẩn 2025 của ngành này trên trang trường là 27,5, không phải 26,1.", link: "https://hust.edu.vn/diem-chuan" };

assert.equal((await gui(xuLyBaoSai, baoSai, "1.1.1.1", "GET")).status, 405);
assert.equal((await gui(xuLyBaoSai, "không phải json")).status, 400);
assert.equal((await gui(xuLyBaoSai, { ...baoSai, noiDung: "sai" })).status, 400, "nội dung quá ngắn");
assert.equal((await gui(xuLyBaoSai, { ...baoSai, maChuongTrinh: "../../x" })).status, 400, "mã chương trình lạ");
assert.equal((await gui(xuLyBaoSai, { ...baoSai, link: "javascript:alert(1)" })).status, 400, "link không https");
assert.equal((await gui(xuLyBaoSai, "x".repeat(20000))).status, 400, "thân quá lớn");
const ok = await gui(xuLyBaoSai, baoSai);
assert.equal(ok.status, 200);
const hang = db.prepare("SELECT * FROM bao_sai").all() as { ma_chuong_trinh: string; trang_thai: string; noi_dung: string }[];
assert.equal(hang.length, 1); assert.equal(hang[0].trang_thai, "moi");
// ô ẩn (máy tự điền): báo thành công giả, không lưu
assert.equal((await gui(xuLyBaoSai, { ...baoSai, website: "http://spam" }, "9.9.9.9")).status, 200);
assert.equal((db.prepare("SELECT COUNT(*) c FROM bao_sai").get() as { c: number }).c, 1, "bot không được lưu");
// nội dung HTML bị làm sạch, không lưu thẻ
await gui(xuLyBaoSai, { ...baoSai, noiDung: "<script>alert(1)</script>Điểm chuẩn thực tế khác con số trên app" }, "2.2.2.2");
assert.ok(!(db.prepare("SELECT noi_dung FROM bao_sai ORDER BY tao_luc DESC LIMIT 1").get() as { noi_dung: string }).noi_dung.includes("<script"));
// giới hạn 5 lần mỗi giờ mỗi IP
let bi429 = 0;
for (let i = 0; i < 8; i++) if ((await gui(xuLyBaoSai, baoSai, "7.7.7.7")).status === 429) bi429++;
assert.equal(bi429, 3, "5 lần đầu qua, 3 lần sau bị chặn");
// chưa gắn D1 thì báo thật, không giả thành công
assert.equal((await xuLyBaoSai(new Request("http://x/api", { method: "POST", body: JSON.stringify(baoSai) }), {})).status, 503);

const dk = { hoTen: "Nguyễn Văn An", vaiTro: "sinh_vien", maTruong: "BKA", lienHe: "an.nguyen@example.com", ghiChu: "Sinh viên năm 2 CNTT" };
assert.ok(kiemTraDangKyTinhNguyen(dk).ok);
for (const xau of [{ ...dk, hoTen: "A" }, { ...dk, vaiTro: "hacker" }, { ...dk, maTruong: "ZZZ" }, { ...dk, lienHe: "khong-hop-le" }, { ...dk, maTruong: undefined }])
  assert.equal(kiemTraDangKyTinhNguyen(xau as never).ok, false);
assert.equal((await gui(xuLyTinhNguyen, dk, "3.3.3.3")).status, 200);
assert.equal((await gui(xuLyTinhNguyen, { ...dk, lienHe: "0912345678", hoTen: "Trần Thị Bình" }, "4.4.4.4")).status, 200);
assert.equal((await gui(xuLyTinhNguyen, { ...dk, maTruong: "bka" }, "5.5.5.5")).status, 200, "mã trường gõ thường vẫn nhận");
let bi = 0; for (let i = 0; i < 5; i++) if ((await gui(xuLyTinhNguyen, dk, "6.6.6.6")).status === 429) bi++;
assert.equal(bi, 2, "3 lần đầu qua, sau đó bị chặn");

// ---------- Hộp thư CMS ----------
let n = 0;
const goi = async (h: typeof hopThu, method: string, url: string, ai: string | null, body?: unknown) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ai) headers["x-gia-danh"] = ai;
  const ctx: BoiCanh = { request: new Request(`http://localhost${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, params: {} };
  const r = await h(ctx, { bayGio: new Date(Date.parse("2026-10-09T03:00:00Z") + ++n * 1000) });
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : null };
};
assert.equal((await goi(hopThu, "GET", "/api/hop-thu", null)).status, 401, "chưa đăng nhập");
const q = "qtv@test.local";
const ds = await goi(hopThu, "GET", "/api/hop-thu?loai=bao-sai", q);
assert.equal(ds.status, 200); assert.ok(ds.json.tong >= 1); assert.equal(ds.json.baoSai[0].maTruong, "BKA");
assert.equal((await goi(hopThu, "GET", "/api/hop-thu?loai=bao-sai&trangThai=la", q)).status, 400, "lọc sai trạng thái");
assert.equal((await goi(hopThu, "GET", "/api/hop-thu?loai=gi-do", q)).status, 400);

// ctv chưa được giao trường: không thấy báo sai, không sửa được, không xem được đăng ký tình nguyện
assert.equal((await goi(nguoi, "POST", "/api/nguoi", q, { email: "ctv1@test.local", vaiTro: "ctv" })).status, 201);
assert.deepEqual((await goi(hopThu, "GET", "/api/hop-thu?loai=bao-sai", "ctv1@test.local")).json.baoSai, []);
assert.equal((await goi(hopThu, "GET", "/api/hop-thu?loai=tinh-nguyen", "ctv1@test.local")).status, 403);
const idBaoSai = ds.json.baoSai[0].id as string;
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", "ctv1@test.local", { loai: "bao-sai", id: idBaoSai, trangThai: "xong" })).status, 403);
// được giao BKA thì thấy và xử lý được; trường khác thì không
assert.equal((await goi(phanCong, "PUT", "/api/phan-cong", q, { email: "ctv1@test.local", maTruong: ["BKA"] })).status, 200);
assert.ok((await goi(hopThu, "GET", "/api/hop-thu?loai=bao-sai", "ctv1@test.local")).json.baoSai.length >= 1);
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", "ctv1@test.local", { loai: "bao-sai", id: idBaoSai, trangThai: "xong" })).status, 200);
assert.equal((db.prepare("SELECT trang_thai FROM bao_sai WHERE id = ?").get(idBaoSai) as { trang_thai: string }).trang_thai, "xong");
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", q, { loai: "bao-sai", id: idBaoSai, trangThai: "bậy" })).status, 400);
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", q, { loai: "bao-sai", id: "khong-co", trangThai: "xong" })).status, 404);

// Cấp quyền tình nguyện viên
const tn = (await goi(hopThu, "GET", "/api/hop-thu?loai=tinh-nguyen&trangThai=moi", q)).json.dangKy as { id: string; lienHe: string; maTruong: string }[];
assert.ok(tn.length >= 3);
const coEmail = tn.find((x) => x.lienHe.includes("@"))!, coSdt = tn.find((x) => !x.lienHe.includes("@"))!;
assert.equal((await goi(hopThu, "POST", "/api/hop-thu", "ctv1@test.local", { action: "CAP_QUYEN", id: coEmail.id })).status, 403, "ctv không cấp quyền");
assert.equal((await goi(hopThu, "POST", "/api/hop-thu", q, { action: "CAP_QUYEN", id: coSdt.id })).status, 400, "chỉ có số điện thoại thì chưa cấp được");
const cap = await goi(hopThu, "POST", "/api/hop-thu", q, { action: "CAP_QUYEN", id: coEmail.id });
assert.equal(cap.status, 201); assert.equal(cap.json.email, "an.nguyen@example.com"); assert.equal(cap.json.vaiTro, "ctv");
assert.equal((db.prepare("SELECT vai_tro FROM quan_tri WHERE email = 'an.nguyen@example.com'").get() as { vai_tro: string }).vai_tro, "ctv");
assert.ok(db.prepare("SELECT 1 FROM phan_cong WHERE email = 'an.nguyen@example.com' AND ma_truong = 'BKA'").get(), "được giao đúng trường đã đăng ký");
assert.equal((await goi(hopThu, "POST", "/api/hop-thu", q, { action: "CAP_QUYEN", id: coEmail.id })).status, 409, "cấp hai lần");
// Người đã là quản trị viên đăng ký tình nguyện: giữ nguyên vai qtv, không bị hạ xuống ctv
await gui(xuLyTinhNguyen, { ...dk, lienHe: q, maTruong: "QSC", hoTen: "Quản trị viên thử" }, "8.8.8.8");
const idQtv = ((await goi(hopThu, "GET", "/api/hop-thu?loai=tinh-nguyen&trangThai=moi", q)).json.dangKy as { id: string; lienHe: string }[]).find((x) => x.lienHe === q)!.id;
const capQtv = await goi(hopThu, "POST", "/api/hop-thu", q, { action: "CAP_QUYEN", id: idQtv });
assert.equal(capQtv.status, 201); assert.equal(capQtv.json.vaiTro, "qtv");
assert.equal((db.prepare("SELECT vai_tro FROM quan_tri WHERE email = ?").get(q) as { vai_tro: string }).vai_tro, "qtv");
// đổi trạng thái thường
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", q, { loai: "tinh-nguyen", id: coSdt.id, trangThai: "da_lien_he" })).status, 200);
assert.equal((await goi(hopThu, "PATCH", "/api/hop-thu", q, { loai: "tinh-nguyen", id: coSdt.id, trangThai: "da_cap_quyen" })).status, 400, "không đánh dấu đã cấp quyền mà chưa cấp");
// nhật ký có ghi
assert.ok((db.prepare("SELECT COUNT(*) c FROM nhat_ky WHERE hanh_dong LIKE 'tinh-nguyen.%' OR hanh_dong LIKE 'bao-sai.%'").get() as { c: number }).c >= 3);

console.log("hop-thu: tất cả kiểm tra đều qua");
