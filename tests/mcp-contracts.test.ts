// Contract/security regression tests: official MCP Client and Streamable HTTP transport + real SQLite migrations.
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { xuLyMcpBearer } from "../functions/mcp/index";
import { xuLyMcp } from "../functions/mcp/[ma]";
import { bamMa, taoKetNoi } from "../functions/_thu-vien/ket-noi";
import { dangKyClient, doiMaLayToken, taoMaXacNhan, s256, type PhamVi } from "../functions/_thu-vien/oauth";
import type { BanChup } from "../src/engine/ket-noi-kieu";
import { taoD1KetNoiTest } from "./nap-d1-ket-noi";
import { kvTest } from "./nap-d1-han-muc";

const origin = "https://app.test", endpoint = `${origin}/mcp`;
const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const redirectUri = "https://claude.ai/api/mcp/auth_callback";
const db = taoD1KetNoiTest(), rate = kvTest(), env = { DB: db, RATE_KV: rate.kv };
function snapshot(tinh: string, taskId: string): BanChup {
  return { phienBan: 1, capNhat: "2026-10-16T08:00:00.000Z", hoSo: { lop: 12, tinh },
    diemThi: [], nguyenVong: [], goiY: [],
    keHoachTuan: [{ tieuDe: "Ôn toán", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T20:00:00+07:00", taskId, progressStatus: "chua" }] };
}
async function credential(tinh: string, taskId: string, scopes: PhamVi[]) {
  const connection = await taoKetNoi(db, snapshot(tinh, taskId));
  const clientId = await dangKyClient(db, "contract test", [redirectUri]);
  const code = await taoMaXacNhan(db, { keBam: await bamMa(connection.ma), clientId, redirectUri, challenge: await s256(verifier), phamVi: scopes });
  const result = await doiMaLayToken(env, { ma: code, clientId, redirectUri, verifier });
  assert.ok(result.ok);
  return { token: result.token.access_token, ma: connection.ma, hash: await bamMa(connection.ma) };
}
const fullScopes: PhamVi[] = ["profile:read", "admissions:read", "preferences:read", "preferences:write", "study:read", "study:write"];
const a = await credential("Hà Nội", "task-a", fullScopes);
const b = await credential("Đà Nẵng", "task-b", ["profile:read", "admissions:read"]);
const headers = (token = a.token) => ({ authorization: `Bearer ${token}`, accept: "application/json, text/event-stream", "content-type": "application/json" });
const message = (name: string, args: unknown = {}) => ({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
async function raw(body: unknown, extra: Record<string, string> = {}, token = a.token) {
  return xuLyMcpBearer(new Request(endpoint, { method: "POST", headers: { ...headers(token), ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) }), env);
}
async function sdk(token: string) {
  const client = new Client({ name: "contract-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit: { headers: { authorization: `Bearer ${token}` } },
    fetch: async (input, init) => xuLyMcpBearer(new Request(input, init), env),
  });
  await client.connect(transport);
  return client;
}
const tests: [string, () => Promise<void>][] = [];
const test = (name: string, run: () => Promise<void>) => tests.push([name, run]);
const structured = (result: Awaited<ReturnType<Client["callTool"]>>) => result.structuredContent as { ok: boolean; data?: Record<string, unknown>; error?: { code: string } };

test("scopes filter discovery and block direct calls", async () => {
  const client = await sdk(b.token);
  try {
    const tools = (await client.listTools()).tools.map((t) => t.name);
    assert.ok(tools.includes("search_majors"));
    assert.ok(!tools.includes("lay_nguyen_vong"));
    assert.ok(!tools.includes("recommend_preferences"));
    assert.ok(!tools.includes("get_study_plan"));
    assert.ok(!tools.includes("update_study_progress"));
    const result = await client.callTool({ name: "update_study_progress", arguments: { taskId: "task-b", status: "xong", snapshotUpdatedAt: "2026-10-16T08:00:00.000Z" } });
    assert.equal(result.isError, true);
    assert.equal(structured(result).error?.code, "INSUFFICIENT_SCOPE");
  } finally { await client.close(); }
});
test("student isolation survives consecutive requests and connection codes", async () => {
  for (const [credential, expected] of [[a, "Hà Nội"], [b, "Đà Nẵng"], [a, "Hà Nội"]] as const) {
    const client = await sdk(credential.token);
    try {
      const result = await client.callTool({ name: "analyze_student_profile", arguments: {} });
      assert.equal((structured(result).data?.hoSo as { tinh: string }).tinh, expected);
    } finally { await client.close(); }
  }
  const response = await xuLyMcp(new Request(`${origin}/mcp/${a.ma}`, { method: "POST", headers: headers(), body: JSON.stringify(message("lay_ho_so")) }), env, a.ma);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Hà Nội/);
  const progress = await xuLyMcp(new Request(`${origin}/mcp/${a.ma}`, { method: "POST", headers: headers(), body: JSON.stringify(message("update_study_progress", { taskId: "task-a", status: "xong", snapshotUpdatedAt: "2026-10-16T08:00:00.000Z" })) }), env, a.ma);
  const body = await progress.json() as { result: { isError?: boolean; structuredContent?: { error?: { code?: string } } } };
  assert.equal(body.result.isError, true);
  assert.equal(body.result.structuredContent?.error?.code, "INSUFFICIENT_SCOPE");
});
test("strict schemas reject unknown fields, string numbers and malformed nested data", async () => {
  const client = await sdk(a.token);
  try {
    for (const [name, args] of [
      ["search_universities", { limit: "2" }], ["search_majors", { q: "CNTT", guessed: true }],
      ["calculate_admission_score", { maToHop: "A00", diemMon: { toan: 8, hoaHoc: 7, vatLy: "9" } }],
      ["calculate_admission_score", { maToHop: "A00", diemMon: { toan: 11 } }],
      ["lay_ho_so", { studentId: b.hash }], ["de_xuat_them_nguyen_vong", { idChuongTrinh: "none", viTri: "2" }],
    ] as const) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true, name);
      assert.equal(structured(result).error?.code, "INVALID_ARGUMENT", name);
    }
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat").first<{ n: number }>())?.n, 0);
  } finally { await client.close(); }
});
test("public resources and prompts are bounded metadata without snapshots", async () => {
  const client = await sdk(a.token);
  try {
    const { resources } = await client.listResources();
    assert.equal(resources.length, 1);
    const result = await client.readResource({ uri: resources[0].uri });
    const text = JSON.stringify(result);
    assert.ok(text.length < 16000);
    assert.ok(!text.includes(a.hash) && !text.includes(a.ma) && !text.includes("Hà Nội") && !text.includes("task-a"));
    assert.equal((await client.listPrompts()).prompts.length, 1);
    const prompt = await client.getPrompt({ name: "admission_review" });
    assert.ok(JSON.stringify(prompt).length < 4000);
    await assert.rejects(client.readResource({ uri: "nguyenvongai://student/other" }));
  } finally { await client.close(); }
  const onlyProfile = await credential("Huế", "task-c", ["profile:read"]);
  const limited = await sdk(onlyProfile.token);
  try { assert.deepEqual((await limited.listResources()).resources, []); assert.deepEqual((await limited.listPrompts()).prompts, []); }
  finally { await limited.close(); }
});
test("progress is a deduplicated pending proposal and never changes the snapshot", async () => {
  const client = await sdk(a.token);
  try {
    const plan = structured(await client.callTool({ name: "get_study_plan", arguments: {} })).data!;
    assert.equal(plan.snapshotUpdatedAt, "2026-10-16T08:00:00.000Z");
    const args = { taskId: "task-a", status: "xong", snapshotUpdatedAt: plan.snapshotUpdatedAt };
    const first = structured(await client.callTool({ name: "update_study_progress", arguments: args }));
    const second = structured(await client.callTool({ name: "update_study_progress", arguments: args }));
    assert.equal(first.ok, true); assert.equal(first.data?.trangThai, "cho");
    assert.equal(first.data?.deXuatId, second.data?.deXuatId);
    const pending = await db.prepare("SELECT loai, du_lieu, ma_bam FROM ket_noi_de_xuat WHERE id = ?").bind(first.data?.deXuatId).first<{ loai: string; du_lieu: string; ma_bam: string }>();
    assert.equal(pending?.loai, "cap-nhat-tien-do"); assert.equal(pending?.ma_bam, a.hash);
    assert.equal(JSON.parse(pending!.du_lieu).expectedStatus, "chua");
    const after = structured(await client.callTool({ name: "get_study_plan", arguments: {} })).data!;
    assert.equal((after.suKien as { progressStatus: string }[])[0].progressStatus, "chua");
    for (const [patch, code] of [[{ taskId: "task-b" }, "TASK_NOT_FOUND"], [{ snapshotUpdatedAt: "2026-10-15T08:00:00.000Z" }, "STALE_SNAPSHOT"]] as const) {
      const result = await client.callTool({ name: "update_study_progress", arguments: { ...args, ...patch } });
      assert.equal(result.isError, true); assert.equal(structured(result).error?.code, code);
    }
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat").first<{ n: number }>())?.n, 1);
  } finally { await client.close(); }
});
test("transport rejects untrusted origins, unsupported protocol, batch, malformed and oversized bodies", async () => {
  assert.equal((await raw(message("lay_ho_so"), { origin: "https://evil.test" })).status, 403);
  assert.equal((await xuLyMcpBearer(new Request(endpoint, { method: "OPTIONS", headers: { origin: "null" } }), env)).status, 403);
  const allowed = await raw(message("lay_ho_so"), { origin });
  assert.equal(allowed.status, 200); assert.equal(allowed.headers.get("access-control-allow-origin"), origin);
  assert.equal((await raw(message("lay_ho_so"), { "mcp-protocol-version": "1999-01-01" })).status, 400);
  assert.equal((await raw([message("lay_ho_so")])).status, 400);
  assert.equal((await raw("{broken")).status, 400);
  assert.equal((await raw(message("lay_ho_so"), { "content-type": "text/plain" })).status, 415);
  assert.equal((await raw(message("lay_ho_so"), { accept: "application/json" })).status, 406);
  assert.equal((await raw(JSON.stringify(message("lay_ho_so", { text: "a".repeat(33000) })))).status, 413);
  assert.equal((await raw({ jsonrpc: "2.0", method: "notifications/initialized" })).status, 202);
});
test("revoked connections invalidate existing OAuth credentials", async () => {
  await db.prepare("DELETE FROM ket_noi_ai WHERE ma_bam = ?").bind(b.hash).run();
  const result = await raw(message("lay_ho_so"), {}, b.token);
  assert.equal(result.status, 401); assert.match(result.headers.get("www-authenticate") ?? "", /resource_metadata/);
});

let failed = 0;
for (const [name, run] of tests) {
  rate.m.clear();
  try { await run(); console.log(`✓ ${name}`); }
  catch (error) { failed++; console.error(`✗ ${name}`, error); }
}
assert.equal(failed, 0, `${failed}/${tests.length} MCP contract checks failed`);
console.log(`mcp-contracts: ${tests.length} checks passed`);
