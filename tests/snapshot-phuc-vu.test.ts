// Kiểm thử hàm phục vụ /snapshots/*. Chạy: npx tsx tests/snapshot-phuc-vu.test.ts
import assert from "node:assert/strict";
import { bamSha256, phucVuSnapshot } from "../functions/snapshots/[tep]";
import { taoSnapshotVaManifest } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";

const kq = await taoSnapshotVaManifest([], "2026.10.09.01");
const tuongUng = (ten: string) => kq.manifest.datasets[ten as keyof typeof kq.manifest.datasets]!.url.replace("/snapshots/", "");
const kv = new Map<string, string>();
// CMS ghi KV theo khóa của manifest (cutoffScores), còn URL dùng cutoff-scores: hàm phục vụ phải nối được hai tên này.
for (const [ten, d] of Object.entries(kq.datasets)) kv.set(`snapshot:2026.10.09.01:${ten}`, d.json);
const env = { KV_CONG_DONG: { get: async (k: string) => kv.get(k) ?? null } };

// 1) Mọi URL trong manifest do bộ dựng snapshot sinh ra đều phải phục vụ được và khớp băm
for (const [khoa, meta] of Object.entries(kq.manifest.datasets)) {
  const tep = meta.url.replace("/snapshots/", "");
  const r = await phucVuSnapshot(env, tep);
  assert.equal(r.status, 200, `${khoa} (${tep}) phải phục vụ được`);
  assert.equal(await bamSha256(await r.text()), meta.hash, `${khoa}: băm đầy đủ phải khớp manifest`);
  assert.match(r.headers.get("Cache-Control") ?? "", /immutable/);
}

// 2) Đường dẫn lạ, sai tên, có ký tự đi ngược thư mục
for (const xau of ["", "x.json", "schools.json", "../../etc/passwd", "schools.2026.10.09.01.zzzzzzzz.json", "khac.2026.10.09.01.abcdef12.json", "schools.2026.10.09.01.abcdef12.json.map", "schools.2026.10.09.01.ABCDEF12.json"])
  assert.equal((await phucVuSnapshot(env, xau)).status, 404, `phải từ chối: ${xau}`);

// 3) Sai mã băm (nội dung KV bị đổi) thì không phục vụ
const tepSchools = tuongUng("schools");
kv.set("snapshot:2026.10.09.01:schools", "[{\"bi\":\"sua\"}]");
assert.equal((await phucVuSnapshot(env, tepSchools)).status, 404, "nội dung không khớp băm thì 404");
kv.set("snapshot:2026.10.09.01:schools", kq.datasets.schools.json);
assert.equal((await phucVuSnapshot(env, tepSchools)).status, 200);

// 4) KV thiếu thì rơi về D1; KV lỗi cũng rơi về D1; cả hai thiếu thì 404
const d1 = { prepare: () => ({ bind: (...a: unknown[]) => ({ first: async <T>() => (a[0] === "2026.10.09.01" && a[1] === "schools" ? ({ noi_dung: kq.datasets.schools.json } as T) : null) }) }) };
assert.equal((await phucVuSnapshot({ KV_CONG_DONG: { get: async () => null }, DB: d1 }, tepSchools)).status, 200, "KV thiếu → D1");
assert.equal((await phucVuSnapshot({ KV_CONG_DONG: { get: async () => { throw new Error("kv chết"); } }, DB: d1 }, tepSchools)).status, 200, "KV lỗi → D1");
assert.equal((await phucVuSnapshot({ KV_CONG_DONG: { get: async () => null }, DB: d1 }, tuongUng("tuition"))).status, 404);
assert.equal((await phucVuSnapshot({}, tepSchools)).status, 404, "chưa cấu hình gì thì 404, không sập");

console.log("snapshot-phuc-vu: tất cả kiểm tra đều qua");
