// Kiểm thử /api/goi-y-duyet: quy tắc không cần AI, AI giả, kiểm trùng, quyền, và không lộ email/điện thoại cho AI.
// Chạy: npx tsx tests/goi-y-duyet.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as goiY } from "../cms/functions/api/goi-y-duyet";
import { kiemTraQuyTac, NGUONG_TRUNG } from "../cms/functions/_thu-vien/ai-duyet";
import { cauChenBanGhi } from "../cms/functions/_thu-vien/ban-ghi-d1";
import type { Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";
import type { BanGhiCms } from "../src/engine/du-lieu-tuyen-sinh/kieu";

const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string) {}
  bind(...g: unknown[]) { this.gt = g; return this; }
  async first<T>() { return ((db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null); }
  async all<T>() { return { results: db.prepare(this.sql).all(...(this.gt as never[])) as T[] }; }
  async run() { const r = db.prepare(this.sql).run(...(this.gt as never[])); return { meta: { changes: Number(r.changes) } }; }
}
const d1: KhoD1 = { prepare: (sql) => new Cau(sql), async batch(cau) { return cau.map((c) => { const x = c as Cau; return { meta: { changes: Number(db.prepare(x.sql).run(...(x.gt as never[])).changes) } }; }); } };
const kvMap = new Map<string, string>();
const kv = { get: async (k: string) => kvMap.get(k) ?? null, put: async (k: string, v: string) => { kvMap.set(k, v); } };

const QTV = "qtv@test.local", CTV = "ctv@test.local";
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'qtv', ?)").run(QTV, "2026-10-01T00:00:00Z");
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'ctv', ?)").run(CTV, "2026-10-01T00:00:00Z");

const NGUON = { url: "https://tuyensinh.hust.edu.vn/ktx", tieuDe: "Thông báo ký túc xá", donViCongBo: "ĐH Bách Khoa Hà Nội", ngayKiemChung: "2026-10-01T00:00:00Z" };
const mau = (id: string, over: Partial<BanGhiCms>): BanGhiCms => ({
  id, entityType: "luu_y", entityId: "BKA-" + id, version: 1, status: "SUBMITTED", data: { maTruong: "BKA", tieuDe: "Đăng ký ký túc xá sớm", noiDung: "Ký túc xá hết chỗ từ tháng 8, nên đăng ký sớm." },
  source: NGUON, importance: "normal", changeNote: "Thêm lưu ý", createdBy: "nguoi.nop.bi.mat@gmail.com", createdAt: "2026-10-02T00:00:00Z", updatedBy: "nguoi.nop.bi.mat@gmail.com", updatedAt: "2026-10-02T00:00:00Z", ...over,
});
const chen = (b: BanGhiCms) => cauChenBanGhi(d1, b).run();
await chen(mau("a1", {}));
await chen(mau("a2", { entityType: "cutoff_score", entityId: "BKA-a2", data: { maTruong: "BKA", maNganh: "7480201", nam: 2025, diemChuan: 45, toHop: "A00" } }));
await chen(mau("a3", { entityType: "tuition", entityId: "BKA-a3", data: { maTruong: "BKA", mucThap: 900, mucCao: 100, nam: 2026 } }));
await chen(mau("a4", { data: { maTruong: "BKA", tieuDe: "Liên hệ", noiDung: "Gọi bạn Nam 0912 345 678 hoặc mail nam.le@example.com để hỏi thêm." }, changeNote: "SDT 0987654321" }));

// ---- Quy tắc thuần ----
const maCua = (b: BanGhiCms) => kiemTraQuyTac(b).map((c) => c.ma);
assert.deepEqual(maCua(mau("x", {})), [], "bản sạch không cảnh báo");
assert.ok(maCua(mau("x", { source: { ...NGUON, url: "" } })).includes("thieu-nguon"));
assert.ok(maCua(mau("x", { source: { ...NGUON, url: "https://facebook.com/page" }, entityType: "tuition", data: { maTruong: "BKA", mucThap: 20, mucCao: 30 } })).includes("nguon-mang-xa-hoi"));
assert.ok(maCua(mau("x", { entityType: "cutoff_score", data: { maTruong: "BKA", maNganh: "x", nam: 2025, diemChuan: 45 } })).includes("diem-ngoai-khoang"));
assert.ok(maCua(mau("x", { entityType: "tuition", data: { maTruong: "BKA", mucThap: 900, mucCao: 100 } })).includes("hoc-phi-ngoai-khoang"));
assert.ok(maCua(mau("x", { entityType: "tuition", data: { maTruong: "BKA", mucThap: 900, mucCao: 100 } })).includes("hoc-phi-nguoc"));
assert.equal(maCua(mau("x", { entityType: "tuition", data: { maTruong: "BKA", donVi: "trieu_tin_chi", mucThap: 1.2, mucCao: 1.5 } })).length, 0, "học phí tín chỉ dùng khoảng riêng");
assert.ok(maCua(mau("x", { entityType: "cutoff_score", data: { maTruong: "BKA" } })).includes("thieu-truong"));
assert.ok(maCua(mau("x", { entityId: "BKA-x", data: { maTruong: "QSC", tieuDe: "abc", noiDung: "nội dung đủ dài" } })).includes("lech-ma-truong"));

// ---- Gọi API ----
const goi = async (env: Env, ai: string | null, body: unknown, method = "POST") => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ai) headers["x-gia-danh"] = ai;
  const r = await goiY({ request: new Request("http://localhost/api/goi-y-duyet", { method, headers, body: method === "POST" ? JSON.stringify(body) : undefined }), env, params: {} });
  return { status: r.status, json: (await r.json()) as any };
};
const base: Env = { DB: d1, KV_CONG_DONG: kv, GIA_DANH_DEV: "1" };

// quyền: không đăng nhập 401, ctv 403, GET 405
assert.equal((await goi(base, null, { id: "a1" })).status, 401);
assert.equal((await goi(base, CTV, { id: "a1" })).status, 403, "ctv không có quyền xin gợi ý");
assert.equal((await goi(base, QTV, { id: "a1" }, "GET")).status, 405);
assert.equal((await goi(base, QTV, {})).status, 400);
assert.equal((await goi(base, QTV, { id: "khong-co" })).status, 404);

// không AI: vẫn có phần quy tắc, ai:null, chưa kiểm trùng
const khongAI = await goi(base, QTV, { id: "a2" });
assert.equal(khongAI.status, 200);
assert.equal(khongAI.json.ai, null);
assert.equal(khongAI.json.trung, null);
assert.equal(khongAI.json.daKiemTrung, false);
assert.ok(khongAI.json.quyTac.some((c: { ma: string }) => c.ma === "diem-ngoai-khoang"));

// AI giả: ghi lại đầu vào gửi Clef
const guiClef: string[] = [];
let goiNhung = 0;
const aiGia = {
  async run(model: string, input: unknown) {
    if (model.includes("clef")) {
      guiClef.push(JSON.stringify(input));
      return { answers: {
        credibility: { type: "score", score: 2, legend: { 0: "unlikely", 1: "doubtful", 2: "plausible", 3: "well-supported" } },
        kind: { type: "choice", choice: "personal_opinion", probabilities: { personal_opinion: 0.8 }, confidence: 0.8 },
        contains_sensitive: { type: "noul", noul: 0.7 },
      } };
    }
    goiNhung++;
    return { data: [new Array(1024).fill(0.1)] };
  },
};
let diemTrung = 0.95;
const vecGia = { upsert: async () => ({}), deleteByIds: async () => ({}), query: async () => ({ matches: [
  { id: "luu_y:BKA-a1", score: 0.99, metadata: { noiDung: "chính nó", maTruong: "BKA", tinh: "x", loai: "luu_y", phienBan: "1", chinhThuc: false } },
  { id: "luu_y:BKA-cu", score: diemTrung, metadata: { noiDung: "Ký túc xá hết chỗ, đăng ký sớm", maTruong: "BKA", tinh: "x", loai: "luu_y", phienBan: "1", chinhThuc: false } },
] }) };
const coAI: Env = { ...base, AI: aiGia, VECTORIZE: vecGia };

const kq = await goi(coAI, QTV, { id: "a1" });
assert.equal(kq.status, 200);
assert.equal(kq.json.ai.doTinCay.muc, "vua"); // plausible = 2/3: Vừa (Cao cần từ 0,85, tức well-supported)
assert.equal(kq.json.ai.doTinCay.diem, 0.67);
assert.equal(kq.json.ai.loai.chon, "personal_opinion");
assert.equal(kq.json.ai.nhayCam.co, true);
assert.equal(kq.json.daKiemTrung, true);
assert.equal(kq.json.trung.id, "luu_y:BKA-cu", "bỏ qua chính bản ghi này, giữ bản trùng khác");
assert.ok(goiNhung >= 1);
assert.ok(NGUONG_TRUNG >= 0.9);

// dưới ngưỡng trùng thì không báo
diemTrung = 0.8;
assert.equal((await goi(coAI, QTV, { id: "a1" })).json.trung, null);

// email/điện thoại (nội dung, ghi chú) và email người nộp không lọt vào state gửi Clef
guiClef.length = 0;
const lo = await goi(coAI, QTV, { id: "a4" });
assert.equal(lo.status, 200);
assert.ok(lo.json.quyTac.some((c: { ma: string }) => c.ma === "co-lien-he"), "quy tắc phát hiện liên hệ trong nội dung");
assert.equal(guiClef.length, 1);
for (const cam of ["0912", "345 678", "nam.le@example.com", "0987654321", "nguoi.nop.bi.mat", "gmail.com"]) assert.ok(!guiClef[0].includes(cam), `state gửi AI không được chứa "${cam}"`);

// Clef lỗi: vẫn trả quy tắc, ai:null
const aiLoi = { async run(model: string) { if (model.includes("clef")) throw new Error("hỏng"); return { data: [new Array(1024).fill(0.1)] }; } };
const hong = await goi({ ...base, AI: aiLoi, VECTORIZE: vecGia }, QTV, { id: "a3" });
assert.equal(hong.status, 200);
assert.equal(hong.json.ai, null);
assert.ok(hong.json.quyTac.length > 0);

// không ghi vào bản ghi
assert.equal((db.prepare("SELECT status FROM ban_ghi_cms WHERE id = 'a1'").get() as { status: string }).status, "SUBMITTED");

// giới hạn tần suất nhẹ
let bi429 = 0;
for (let i = 0; i < 25; i++) if ((await goi(base, QTV, { id: "a1" })).status === 429) bi429++;
assert.ok(bi429 > 0, "xin quá nhiều thì bị chặn");

console.log("goi-y-duyet: tất cả kiểm thử đạt");
