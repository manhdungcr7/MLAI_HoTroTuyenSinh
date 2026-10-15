import assert from "node:assert/strict";
import { docChuGioiHan, ThanQuaLon } from "../functions/_thu-vien/doc-body";
import { docThan } from "../cms/functions/_thu-vien/phan-hoi";
import { onRequestGet } from "../functions/api/manifest";
import { xuLyDangKySom } from "../functions/api/dang-ky-som";
import { docThanNho } from "../functions/_thu-vien/gioi-han";

const streamRequest = (bytes: number) => new Request("http://localhost/api/test", {
  method: "POST", body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(bytes)); c.close(); } }), duplex: "half",
} as RequestInit);
await assert.rejects(() => docChuGioiHan(streamRequest(9000), 8192), ThanQuaLon);
await assert.rejects(() => docThan(streamRequest(40000)), (e: unknown) => (e as { status: number }).status === 413);
assert.equal(await docThanNho(streamRequest(9000)), null);
assert.equal((await xuLyDangKySom(streamRequest(9000), {})).status, 413);
const text = "Tiếng Việt 🧭";
assert.equal(await docChuGioiHan(new Request("http://localhost", { method: "POST", body: text }), 100), text);

const d1 = { prepare: () => ({ bind: () => ({ first: async <T>() => ({ manifest_json: JSON.stringify({ fromD1: true }) }) as T }) }) };
const kvFault = { get: async () => { throw new Error("KV unavailable"); } };
assert.deepEqual(await (await onRequestGet({ env: { DB: d1, KV_CONG_DONG: kvFault } })).json(), { fromD1: true });
const r = await onRequestGet({ env: { KV_CONG_DONG: kvFault, DB: { prepare() { throw new Error("D1 unavailable"); } } } });
assert.equal(r.status, 200); assert.ok((await r.json() as { datasets: unknown }).datasets);
console.log("ban-giao: bounded request streams and manifest fallback passed");
