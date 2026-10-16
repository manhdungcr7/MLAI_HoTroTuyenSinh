import assert from "node:assert/strict";
import { executeCapability } from "../src/capabilities";
import { xuLyTinhDiem, MAX_SCORE_BODY_BYTES } from "../functions/api/v1/admission-score";
import { xuLyTimNganh } from "../functions/api/v1/majors";
import { chayCongCu, type NguCanhCongCu } from "../functions/_thu-vien/ket-noi-cong-cu";

const base = "https://app.test/api/v1/admission-score";
const scoreRequest = (input: unknown) => new Request(base, { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(input) });
const noDb = new Proxy({}, { get() { throw new Error("Pure score route must never access DB"); } });
const context: NguCanhCongCu = {
  ban: { phienBan: 1, capNhat: "2026-10-16T08:00:00Z", hoSo: {}, diemThi: [], nguyenVong: [], goiY: [], keHoachTuan: [] },
  ma: "unused", maBam: "unused", origin: "https://app.test", db: noDb as NguCanhCongCu["db"],
};

for (const input of [
  { maToHop: "A01", diemMon: { toan: 8, vatLy: 8, tiengAnh: 8 }, khuVuc: "KV1", doiTuong: "UT1" },
  { maToHop: "d01", diemMon: { toan: 7.5, nguVan: 7.5, tiengAnh: 7.5 }, khuVuc: "KV2", doiTuong: "UT2" },
  { maToHop: "A00", diemMon: { toan: 10, vatLy: 10, hoaHoc: 10 }, khuVuc: "KV1", doiTuong: "UT1" },
  { maToHop: "C00", diemMon: { nguVan: 0, lichSu: 0, diaLy: 0 } },
  { maToHop: "A01", diemMon: { toan: 0, vatLy: null } },
  { maToHop: "D01", diemMon: {} },
]) {
  const response = await xuLyTinhDiem(scoreRequest(input));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const http = await response.json();
  const capability = await executeCapability("calculate_admission_score", input);
  const mcp = await chayCongCu("calculate_admission_score", input, context);
  assert.deepEqual(http, capability);
  assert.deepEqual(http, mcp);
}
const missing = await (await xuLyTinhDiem(scoreRequest({ maToHop: "A01", diemMon: { toan: 5, vatLy: null } }))).json() as { data: { tongXetTuyen: number | null; thieuMon: string[] } };
assert.equal(missing.data.tongXetTuyen, null);
assert.deepEqual(missing.data.thieuMon, ["vatLy", "tiengAnh"]);

for (const input of [{}, null, [], { maToHop: "V00", diemMon: {} }, { maToHop: "A01", diemMon: { toan: -1 } }, { maToHop: "A01", diemMon: { toan: 10.1 } }, { maToHop: "A01", diemMon: { toan: "8" } }, { maToHop: "A01", diemMon: null }, { maToHop: "A01", diemMon: {}, PRIVATE_SENTINEL_7619: "secret" }]) {
  const response = await xuLyTinhDiem(scoreRequest(input));
  assert.equal(response.status, 400);
  const text = await response.text();
  assert.equal(JSON.parse(text).error.code, "INVALID_ARGUMENT");
  assert.equal(text.includes("PRIVATE_SENTINEL_7619"), false);
  assert.equal(text.includes("secret"), false);
}
for (const body of ["", "{PRIVATE_SENTINEL_7619", '{"maToHop":"A01","diemMon":{"toan":1e999}}']) {
  const response = await xuLyTinhDiem(new Request(base, { method: "POST", headers: { "content-type": "application/json" }, body }));
  assert.equal(response.status, 400);
  assert.equal((await response.text()).includes("PRIVATE_SENTINEL_7619"), false);
}
for (const contentType of [undefined, "text/plain", "application/x-www-form-urlencoded"]) {
  const response = await xuLyTinhDiem(new Request(base, { method: "POST", headers: contentType ? { "content-type": contentType } : undefined, body: "{}" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json() as { error: { code: string } }).error.code, "INVALID_CONTENT_TYPE");
}
const asciiTooLarge = scoreRequest({ PRIVATE_SENTINEL_7619: "a".repeat(MAX_SCORE_BODY_BYTES) });
const multibyteTooLarge = scoreRequest({ PRIVATE_SENTINEL_7619: "á".repeat(MAX_SCORE_BODY_BYTES / 2) });
const declaredTooLarge = new Request(base, { method: "POST", headers: { "content-type": "application/json", "content-length": String(MAX_SCORE_BODY_BYTES + 1) }, body: "{}" });
for (const request of [asciiTooLarge, multibyteTooLarge, declaredTooLarge]) {
  const response = await xuLyTinhDiem(request);
  assert.equal(response.status, 413);
  const text = await response.text();
  assert.equal(JSON.parse(text).error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(text.includes("PRIVATE_SENTINEL_7619"), false);
}
assert.equal((await xuLyTinhDiem(new Request(base, { method: "OPTIONS" }))).status, 204);
const wrongMethod = await xuLyTinhDiem(new Request(base));
assert.equal(wrongMethod.status, 405);
assert.equal(wrongMethod.headers.get("allow"), "POST, OPTIONS");

const majorArgs = { maTruong: "BKA", maToHop: "A01", limit: 2, offset: 1 };
const majors = await xuLyTimNganh(new Request("https://app.test/api/v1/majors?maTruong=BKA&maToHop=A01&limit=2&offset=1"));
assert.equal(majors.status, 200);
assert.deepEqual(await majors.json(), await executeCapability("search_majors", majorArgs));
for (const query of ["limit=101", "offset=-1", "limit=2&limit=3", "extra=PRIVATE_SENTINEL_7619", "maToHop="]) {
  const response = await xuLyTimNganh(new Request(`https://app.test/api/v1/majors?${query}`));
  assert.equal(response.status, 400, query);
  assert.equal((await response.text()).includes("PRIVATE_SENTINEL_7619"), false);
}
assert.equal((await xuLyTimNganh(new Request("https://app.test/api/v1/majors?maTruong=missing-654"))).status, 404);
assert.equal((await xuLyTimNganh(new Request("https://app.test/api/v1/majors", { method: "POST" }))).status, 405);
assert.equal((await xuLyTimNganh(new Request("https://app.test/api/v1/majors", { method: "OPTIONS" }))).status, 204);
console.log("capabilities-api: HTTP/capability/MCP parity, score bounds, nulls, JSON privacy, byte limit and majors pagination passed");
