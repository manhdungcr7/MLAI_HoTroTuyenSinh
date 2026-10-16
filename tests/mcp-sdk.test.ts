// Kiểm thử giao thức bằng client MCP chính thức (@modelcontextprotocol/sdk, Streamable HTTP).
// Máy chủ là các hàm Pages Function thật (xuLyMcpBearer) đặt sau một HTTP server Node, D1 là SQLite thật.
// Chạy: npx tsx tests/mcp-sdk.test.ts
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { taoD1KetNoiTest } from "./nap-d1-ket-noi";
import { kvTest } from "./nap-d1-han-muc";
import { taoKetNoi, bamMa, type EnvKetNoi } from "../functions/_thu-vien/ket-noi";
import { dangKyClient, doiMaLayToken, taoMaXacNhan, s256 } from "../functions/_thu-vien/oauth";
import { xuLyMcpBearer } from "../functions/mcp/index";

const URI = "https://claude.ai/api/mcp/auth_callback";
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

function banMau(): Record<string, unknown> {
  return {
    phienBan: 1, capNhat: "2026-10-16T08:00:00.000Z",
    hoSo: { lop: 12, tinh: "TP.HCM", nganhQuanTam: ["Công nghệ thông tin"], nganSachToiDaTrieu: 30, khuVuc: ["KV2"] },
    mucTieu: { nganh: "Khoa học máy tính", truong: "UIT", diemCan: 26, conThieu: 0.5 },
    diemThi: [{ ngay: "2026-10-01", tong: 24.5, toHop: "A01" }],
    nguyenVong: [{ thuTu: 1, id: "uit-cntt", nganh: "Khoa học máy tính", truong: "Đại học CNTT", maTruong: "QSB", nhan: "Vừa sức" }],
    goiY: [{ id: "neu-ktdn", nganh: "Kinh tế", truong: "ĐH Kinh tế", maTruong: "KHA", diemChuan: 22, namDiem: 2025 }],
    keHoachTuan: [{ tieuDe: "Ôn toán", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T20:00:00+07:00" }],
  };
}

const db = taoD1KetNoiTest();
const env: EnvKetNoi = { DB: db, RATE_KV: kvTest().kv };

/** Máy chủ HTTP thật: chuyển IncomingMessage thành Request chuẩn, rồi trả Response về. */
const may = http.createServer(async (req, res) => {
  const chu: Buffer[] = [];
  for await (const c of req) chu.push(c as Buffer);
  const url = `http://${req.headers.host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const body = chu.length && req.method !== "GET" && req.method !== "HEAD" ? Buffer.concat(chu) : undefined;
  const r = await xuLyMcpBearer(new Request(url, { method: req.method, headers, body }), env);
  res.statusCode = r.status;
  r.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await r.arrayBuffer()));
});
await new Promise<void>((ok) => may.listen(0, "127.0.0.1", () => ok()));
const { port } = may.address() as AddressInfo;
const dia = `http://127.0.0.1:${port}/mcp`;

// Chuẩn bị: một kết nối, một client, một token (đi đúng luồng OAuth bằng hàm thật)
const kq = await taoKetNoi(db, banMau() as never);
const clientId = await dangKyClient(db, "SDK test", [URI]);
const maXacNhan = await taoMaXacNhan(db, { keBam: await bamMa(kq.ma), clientId, redirectUri: URI, challenge: await s256(VERIFIER), phamVi: ["profile:read", "admissions:read", "preferences:read", "preferences:write", "study:read"] });
const token = await doiMaLayToken(env, { ma: maXacNhan, clientId, redirectUri: URI, verifier: VERIFIER });
assert.ok(token.ok, "chuẩn bị: đổi mã phải thành công");
const accessToken = token.ok ? token.token.access_token : "";

const kiemTra: [string, () => Promise<void>][] = [];
const test = (ten: string, fn: () => Promise<void>) => kiemTra.push([ten, fn]);

test("SDK: initialize thành công và đàm phán phiên bản giao thức", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } });
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.name, "nguyen-vong-ai");
  assert.equal(client.getServerVersion()?.version, "1.1.0");
  await client.close();
});

test("SDK: liệt kê công cụ và đọc được schema", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  const { tools } = await client.listTools();
  const ten = tools.map((t) => t.name).sort();
  assert.deepEqual(ten, [
    "de_xuat_them_nguyen_vong",
    "diem_chuan",
    "get_app_capabilities",
    "get_university_profile",
    "goi_y_nganh",
    "ke_hoach_tuan",
    "lay_ho_so",
    "lay_nguyen_vong",
    "search_universities",
  ]);
  assert.ok(tools.every((t) => t.inputSchema?.type === "object"), "mọi công cụ có schema đối tượng");
  await client.close();
});

test("SDK: gọi công cụ tra cứu trường công khai (search_universities & get_university_profile)", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  const r = await client.callTool({ name: "search_universities", arguments: { truyVan: "Bách Khoa" } });
  assert.ok(!r.isError);
  const text = (r.content as { type: string; text: string }[])[0].text;
  assert.ok(text.includes("BKA"));

  const p = await client.callTool({ name: "get_university_profile", arguments: { maTruong: "BKA" } });
  assert.ok(!p.isError);
  const pText = (p.content as { type: string; text: string }[])[0].text;
  assert.ok(pText.includes("ĐH Bách Khoa Hà Nội"));
  await client.close();
});

test("SDK: gọi công cụ đọc và nhận dữ liệu có cấu trúc", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  const r = await client.callTool({ name: "lay_ho_so", arguments: {} });
  const text = (r.content as { type: string; text: string }[])[0].text;
  assert.ok(!r.isError);
  assert.ok(text.includes("TP.HCM"));
  await client.close();
});

test("SDK: gọi công cụ bằng tên bí danh tiếng Anh (get_student_profile & get_study_plan)", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  const r1 = await client.callTool({ name: "get_student_profile", arguments: {} });
  assert.ok(!r1.isError);
  const text1 = (r1.content as { type: string; text: string }[])[0].text;
  assert.ok(text1.includes("TP.HCM"));

  const r2 = await client.callTool({ name: "get_study_plan", arguments: {} });
  assert.ok(!r2.isError);
  const text2 = (r2.content as { type: string; text: string }[])[0].text;
  assert.ok(text2.includes("suKien"));
  await client.close();
});

test("SDK: không có token thì kết nối bị từ chối với 401", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await assert.rejects(client.connect(new StreamableHTTPClientTransport(new URL(dia))), /-32001|401|Cần đăng nhập/);
});

test("SDK: token giả bị từ chối", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await assert.rejects(client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${"b".repeat(43)}` } } })), /-32001/, "lỗi JSON-RPC -32001 phải đến được client");
});

test("SDK: đề xuất khi có quyền preferences:write được tạo và chờ xác nhận", async () => {
  const client = new Client({ name: "kiem-thu", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(dia), { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }));
  const r = await client.callTool({ name: "de_xuat_them_nguyen_vong", arguments: { idChuongTrinh: "neu-ktdn" } });
  assert.ok(!r.isError, JSON.stringify(r.content));
  const dem = await db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat WHERE trang_thai = 'cho'").first<{ n: number }>();
  assert.equal(dem?.n, 1);
  await client.close();
});

async function main() {
  let loi = 0;
  try {
    for (const [ten, fn] of kiemTra) {
      try { await fn(); console.log(`✓ ${ten}`); } catch (e) { loi++; console.log(`✗ ${ten}\n  ${(e as Error).message.split("\n").slice(0, 5).join("\n  ")}`); }
    }
  } finally {
    may.close();
  }
  if (loi) { console.log(`\nmcp-sdk: ${loi} kiểm tra thất bại trên ${kiemTra.length}`); process.exit(1); }
  console.log(`\nmcp-sdk: tất cả ${kiemTra.length} kiểm tra đều qua (client MCP chính thức)`);
  process.exit(0);
}
main();
