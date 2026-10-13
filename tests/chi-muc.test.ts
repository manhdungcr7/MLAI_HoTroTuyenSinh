// Kiểm thử chỉ mục vector (RAG): dựng văn bản, chỉ upsert bản ghi đổi, xóa đúng mã, thiếu binding không ném. AI/Vectorize giả.
// Chạy: npx tsx tests/chi-muc.test.ts
import assert from "node:assert/strict";
import type { BanGhiCms } from "../src/engine/du-lieu-tuyen-sinh/kieu";
import { capNhatChiMuc, mucTuTap, truyVanChiMuc, vanBanCuaBanGhi } from "../functions/_thu-vien/ai/chi-muc";
import { nhungVanBan } from "../functions/_thu-vien/ai/nhung";
import type { KhoAI, KhoVector, VectorGhi } from "../functions/_thu-vien/ai/kieu";

const bg = (entityType: BanGhiCms["entityType"], entityId: string, data: unknown): BanGhiCms => ({
  id: `${entityType}-${entityId}`, entityType, entityId, version: 1, status: "PUBLISHED", data,
  source: { url: "https://example.edu.vn/a", tieuDe: "Nguồn thử", donViCongBo: "Trường", ngayKiemChung: "2026-10-01" },
  importance: "normal", changeNote: "", createdBy: "a@b.c", createdAt: "2026-10-01", updatedBy: "a@b.c", updatedAt: "2026-10-01",
});

const hocPhi = bg("tuition", "BKA-HP2026", { nam: 2026, mucThap: 30, mucCao: 45, donVi: "trieu_nam", phamVi: "Chương trình chuẩn" });
const noiO = bg("noi_luu_tru", "BKA-NO1", { coKyTucXa: "co", khuTroXungQuanh: "nhieu", giaTroThang: [1500, 2500], khoangCachKm: 2 });
const truong = bg("school", "BKA", { tenTruong: "ĐH Bách Khoa Hà Nội", diaChi: "Hà Nội" });

// ---- văn bản ----
const v1 = vanBanCuaBanGhi(hocPhi)!;
assert.ok(v1.includes("Học phí BKA") && v1.includes("30-45") && v1.includes("Chương trình chuẩn"), v1);
const v2 = vanBanCuaBanGhi(noiO)!;
assert.ok(v2.includes("chưa chính thức") && v2.includes("1500-2500") && v2.includes("2 km"), v2);
const v3 = vanBanCuaBanGhi(truong)!;
assert.ok(v3.includes("Bách Khoa") && v3.includes("BKA"), v3);
assert.ok([v1, v2, v3].every((v) => v.length <= 600));
assert.equal(vanBanCuaBanGhi(bg("luu_y", "BKA-LY1", { tieuDe: "x".repeat(100), noiDung: "y".repeat(2000) }))!.length, 600, "cắt ở 600 ký tự");
assert.equal(vanBanCuaBanGhi(bg("deadline", "BKA-D", {})), null, "loại không đưa vào chỉ mục");

// ---- giả AI/Vectorize ----
const goiAI: string[][] = [];
const ai: KhoAI = { async run(_m, input) { const t = (input as { text: string[] }).text; goiAI.push(t); return { data: t.map(() => new Array(1024).fill(0.1)) }; } };
const kho = new Map<string, VectorGhi>();
const xoaGoi: string[][] = [];
let filterCuoi: unknown;
const vec: KhoVector = {
  async upsert(v) { for (const x of v) kho.set(x.id, x); return {}; },
  async deleteByIds(ids) { xoaGoi.push(ids); for (const i of ids) kho.delete(i); return {}; },
  async query(_v, o) { filterCuoi = o.filter; return { matches: [...kho.values()].map((x) => ({ id: x.id, score: 0.9, metadata: x.metadata })) }; },
};

// ---- chỉ upsert bản ghi đổi + xóa đúng ----
const kq = await capNhatChiMuc({ AI: ai, VECTORIZE: vec }, [hocPhi, noiO], ["school:BKA"], "2026.10.13.01");
assert.deepEqual([kq.daLam, kq.soBanGhi, kq.soXoa], [true, 2, 1]);
assert.deepEqual([...kho.keys()].sort(), ["noi_luu_tru:BKA-NO1", "tuition:BKA-HP2026"]);
assert.equal(kho.get("tuition:BKA-HP2026")!.metadata.chinhThuc, true);
assert.equal(kho.get("noi_luu_tru:BKA-NO1")!.metadata.chinhThuc, false);
assert.equal(kho.get("tuition:BKA-HP2026")!.metadata.tinh, "Hà Nội");
assert.equal(kho.get("tuition:BKA-HP2026")!.metadata.phienBan, "2026.10.13.01");
assert.deepEqual(xoaGoi, [["school:BKA"]]);
await capNhatChiMuc({ AI: ai, VECTORIZE: vec }, [], [noiO]);
assert.deepEqual([...kho.keys()], ["tuition:BKA-HP2026"], "xóa theo bản ghi cho đúng mã vector");

// ---- lô: 70 bản ghi -> 3 lần gọi nhúng (32+32+6), 1 lô upsert ----
goiAI.length = 0;
const nhieu = Array.from({ length: 70 }, (_, i) => bg("scholarship", `BKA-HB${i}`, { tenHocBong: `HB ${i}`, giaTri: "10%", dieuKien: "giỏi" }));
await capNhatChiMuc({ AI: ai, VECTORIZE: vec }, nhieu);
assert.deepEqual(goiAI.map((g) => g.length), [32, 32, 6]);
assert.equal(kho.size, 71);

// ---- thiếu binding / lỗi không ném ----
assert.deepEqual(await capNhatChiMuc({}, [hocPhi]), { daLam: false, soBanGhi: 0 });
assert.deepEqual(await capNhatChiMuc({ AI: ai }, [hocPhi]), { daLam: false, soBanGhi: 0 });
assert.equal(await nhungVanBan(undefined, ["a"]), null);
assert.equal(await nhungVanBan({ run: async () => { throw new Error("hỏng"); } }, ["a"]), null);
assert.equal(await nhungVanBan({ run: async () => ({ data: [[1, 2, 3]] }) }, ["a"]), null, "sai số chiều");
const hong = await capNhatChiMuc({ AI: { run: async () => { throw new Error("hỏng"); } }, VECTORIZE: vec }, [hocPhi]);
assert.equal(hong.daLam, false);
assert.equal(await truyVanChiMuc({}, "học phí"), null);

// ---- truy vấn + bộ lọc ----
const r = (await truyVanChiMuc({ AI: ai, VECTORIZE: vec }, "học phí Bách Khoa", { tinh: "Hà Nội", k: 3 }))!;
assert.equal(r[0].maTruong, "BKA");
assert.ok(r[0].noiDung.includes("Học phí"));
const loc = (filterCuoi as { tinh: { $in: string[] } }).tinh.$in;
assert.ok(loc.includes("Hà Nội") && loc.includes("Bắc Ninh"), "mở rộng sang tỉnh lân cận");
await truyVanChiMuc({ AI: ai, VECTORIZE: vec }, "x", { maTruong: "bka" });
assert.deepEqual(filterCuoi, { maTruong: "BKA" });

// ---- id từ snapshot khớp id lúc xuất bản (để dựng lại/rollback ghi đè đúng vector) ----
const tap = mucTuTap("tuition", JSON.stringify([{ id: "BKA-HP2026", maTruong: "BKA", nam: 2026, mucThap: 30, mucCao: 45, donVi: "trieu_nam" }]), "v");
assert.equal(tap[0].id, "tuition:BKA-HP2026");
const cd = mucTuTap("community", JSON.stringify([{ id: "BKA-NO1", loai: "noi_luu_tru", maTruong: "BKA", noiDung: { coKyTucXa: "co" }, nguon: {} }]), "v");
assert.equal(cd[0].id, "noi_luu_tru:BKA-NO1");

console.log("chi-muc.test.ts: OK");
