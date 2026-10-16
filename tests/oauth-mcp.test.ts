// Kiểm thử OAuth 2.1 cho MCP: PKCE, đăng ký client, trang đồng ý, đổi mã, làm mới có xoay vòng, phát hiện tái sử dụng,
// thu hồi, phạm vi theo công cụ, và ngắt kết nối làm mất hiệu lực token. D1 là SQLite thật (migration 0009 và 0011).
// Chạy: npx tsx tests/oauth-mcp.test.ts
import assert from "node:assert/strict";
import { taoD1KetNoiTest, type D1KetNoiTest } from "./nap-d1-ket-noi";
import { kvTest } from "./nap-d1-han-muc";
import { taoKetNoi, xoaKetNoi, bamMa, type EnvKetNoi } from "../functions/_thu-vien/ket-noi";
import { s256, laRedirectHopLe, kiemTraPhamVi, PHAM_VI } from "../functions/_thu-vien/oauth";
import { xuLyDangKy } from "../functions/oauth/register";
import { xuLyAuthorize } from "../functions/oauth/authorize";
import { xuLyToken } from "../functions/oauth/token";
import { xuLyThuHoi } from "../functions/oauth/revoke";
import { xuLyMcpBearer } from "../functions/mcp/index";
import { xuLyMcp } from "../functions/mcp/[ma]";
import { xuLySanSang } from "../functions/api/v1/ready";

const ORIGIN = "https://app.test";
const URI = "https://claude.ai/api/mcp/auth_callback";
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // ví dụ trong RFC 7636
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

let ipDem = 0;
const req = (url: string, o: { method?: string; headers?: Record<string, string>; form?: Record<string, string>; json?: unknown; body?: string } = {}) => {
  const headers: Record<string, string> = { "cf-connecting-ip": `10.0.${Math.floor(ipDem / 250)}.${ipDem++ % 250}`, ...(o.headers ?? {}) };
  let body: string | undefined;
  if (o.form) { headers["content-type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(o.form).toString(); }
  if (o.json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(o.json); }
  if (o.body !== undefined) body = o.body;
  return new Request(url, { method: o.method ?? (body !== undefined ? "POST" : "GET"), headers, body });
};

function banMau(): Record<string, unknown> {
  return {
    phienBan: 1, capNhat: "2026-10-16T08:00:00.000Z",
    hoSo: { lop: 12, tinh: "TP.HCM", nganhQuanTam: ["Công nghệ thông tin"], nganSachToiDaTrieu: 30, khuVuc: ["KV2"] },
    mucTieu: { nganh: "Khoa học máy tính", truong: "UIT", diemCan: 26, conThieu: 0.5 },
    diemThi: [{ ngay: "2026-10-01", tong: 24.5, toHop: "A01" }],
    nguyenVong: [{ thuTu: 1, id: "uit-cntt", nganh: "Khoa học máy tính", truong: "Đại học CNTT", maTruong: "QSB", diemChuan: { "2025": 26.2 }, nhan: "Vừa sức", chenh: -1.7 }],
    goiY: [{ id: "neu-ktdn", nganh: "Kinh tế", truong: "ĐH Kinh tế", maTruong: "KHA", diemChuan: 22, namDiem: 2025, nhan: "An toàn" }],
    keHoachTuan: [{ tieuDe: "Ôn toán", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T20:00:00+07:00" }],
  };
}

interface Moi { db: D1KetNoiTest; env: EnvKetNoi; ma: string; maBam: string }
async function moiMoiTruong(): Promise<Moi> {
  const db = taoD1KetNoiTest();
  const env: EnvKetNoi = { DB: db, RATE_KV: kvTest().kv };
  const kq = await taoKetNoi(db, banMau() as never);
  return { db, env, ma: kq.ma, maBam: await bamMa(kq.ma) };
}

async function dangKy(m: Moi, ten = "Claude", uris: string[] = [URI]): Promise<string> {
  const r = await xuLyDangKy(req(`${ORIGIN}/oauth/register`, { json: { client_name: ten, redirect_uris: uris } }), m.env);
  assert.equal(r.status, 201);
  return ((await r.json()) as { client_id: string }).client_id;
}

/** Chạy trọn luồng đồng ý và trả về token. */
async function xinToken(m: Moi, clientId: string, phamVi?: string): Promise<{ access_token: string; refresh_token: string; scope: string }> {
  const thamSo = { client_id: clientId, redirect_uri: URI, response_type: "code", code_challenge: CHALLENGE, code_challenge_method: "S256", state: "st-1", ...(phamVi ? { scope: phamVi } : {}), resource: `${ORIGIN}/mcp` };
  const dong = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize`, { form: { ...thamSo, ma: m.ma, quyet: "dong-y" } }), m.env, "POST");
  assert.equal(dong.status, 302, "đồng ý phải chuyển hướng");
  const vt = new URL(dong.headers.get("location")!);
  assert.equal(vt.origin + vt.pathname, URI);
  assert.equal(vt.searchParams.get("state"), "st-1");
  const ma = vt.searchParams.get("code")!;
  assert.ok(ma, "phải có mã xác nhận");
  const tk = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "authorization_code", code: ma, code_verifier: VERIFIER, redirect_uri: URI, client_id: clientId } }), m.env);
  assert.equal(tk.status, 200, `đổi mã phải thành công: ${await tk.clone().text()}`);
  return (await tk.json()) as { access_token: string; refresh_token: string; scope: string };
}

const mcp = (m: Moi, token: string | null, body: unknown) =>
  xuLyMcpBearer(req(`${ORIGIN}/mcp`, { json: body, headers: token ? { authorization: `Bearer ${token}` } : {} }), m.env);

const kiemTra: [string, () => Promise<void>][] = [];
const test = (ten: string, fn: () => Promise<void>) => kiemTra.push([ten, fn]);

// --- Hàm thuần ---
test("PKCE S256 khớp ví dụ RFC 7636", async () => {
  assert.equal(await s256(VERIFIER), CHALLENGE);
});
test("redirect_uri: https và loopback được nhận, http nơi khác và fragment bị từ chối", async () => {
  assert.equal(laRedirectHopLe("https://claude.ai/cb"), true);
  assert.equal(laRedirectHopLe("http://localhost:8080/cb"), true);
  assert.equal(laRedirectHopLe("http://127.0.0.1/cb"), true);
  assert.equal(laRedirectHopLe("http://evil.example/cb"), false);
  assert.equal(laRedirectHopLe("https://claude.ai/cb#frag"), false);
  assert.equal(laRedirectHopLe("javascript:alert(1)"), false);
  assert.equal(laRedirectHopLe("x".repeat(301)), false);
});
test("phạm vi: trống thì cấp đủ, phạm vi lạ bị từ chối", async () => {
  const all = kiemTraPhamVi(undefined);
  assert.ok(all.ok && all.v.length === Object.keys(PHAM_VI).length);
  const hai = kiemTraPhamVi("profile:read study:read profile:read");
  assert.ok(hai.ok && hai.v.join(" ") === "profile:read study:read");
  assert.equal(kiemTraPhamVi("admin:all").ok, false);
});

// --- Đăng ký client ---
test("đăng ký: redirect_uri http tùy ý bị từ chối; client hợp lệ nhận client_id", async () => {
  const m = await moiMoiTruong();
  const bad = await xuLyDangKy(req(`${ORIGIN}/oauth/register`, { json: { redirect_uris: ["http://evil.example/cb"] } }), m.env);
  assert.equal(bad.status, 400);
  assert.equal(((await bad.json()) as { error: string }).error, "invalid_redirect_uri");
  const id = await dangKy(m, "<script>x</script>");
  const row = await m.db.prepare("SELECT ten FROM oauth_client WHERE client_id = ?").bind(id).first<{ ten: string }>();
  assert.equal(row?.ten, "<script>x</script>", "tên được lưu nguyên, sẽ được escape khi hiển thị");
});

// --- Trang đồng ý ---
test("trang đồng ý: escape tên ứng dụng, không có script từ dữ liệu client", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m, "<img src=x onerror=alert(1)>");
  const r = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize?client_id=${id}&redirect_uri=${encodeURIComponent(URI)}&response_type=code&code_challenge=${CHALLENGE}&code_challenge_method=S256`), m.env, "GET");
  assert.equal(r.status, 200);
  const trang = await r.text();
  assert.ok(!trang.includes("<img src=x"), "không được chèn thẻ thô");
  assert.ok(trang.includes("&lt;img src=x"), "phải có bản đã escape");
  assert.match(r.headers.get("content-security-policy") ?? "", /default-src 'none'/);
});
test("redirect_uri không đăng ký: trang lỗi, không chuyển hướng tới địa chỉ lạ", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const r = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize?client_id=${id}&redirect_uri=${encodeURIComponent("https://evil.example/cb")}&response_type=code&code_challenge=${CHALLENGE}&code_challenge_method=S256`), m.env, "GET");
  assert.equal(r.status, 400);
  assert.equal(r.headers.get("location"), null);
});
test("tham số sai nhưng redirect hợp lệ: lỗi được chuyển về client theo RFC 6749", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const r = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize?client_id=${id}&redirect_uri=${encodeURIComponent(URI)}&response_type=code&code_challenge=${CHALLENGE}&code_challenge_method=plain&state=abc`), m.env, "GET");
  assert.equal(r.status, 302);
  const u = new URL(r.headers.get("location")!);
  assert.equal(u.searchParams.get("error"), "invalid_request");
  assert.equal(u.searchParams.get("state"), "abc");
});
test("mã học sinh sai: không cấp mã, hiện lỗi trên trang", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const sai = { ...m, ma: "0".repeat(32) };
  const r = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize`, { form: { client_id: id, redirect_uri: URI, response_type: "code", code_challenge: CHALLENGE, code_challenge_method: "S256", ma: sai.ma, quyet: "dong-y" } }), m.env, "POST");
  assert.equal(r.status, 400);
  assert.equal(r.headers.get("location"), null);
  assert.ok((await r.text()).includes("Mã không đúng hoặc đã hết hạn"));
});
test("từ chối: chuyển về client với access_denied, không cấp mã", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const r = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize`, { form: { client_id: id, redirect_uri: URI, response_type: "code", code_challenge: CHALLENGE, code_challenge_method: "S256", state: "z", quyet: "tu-choi" } }), m.env, "POST");
  assert.equal(r.status, 302);
  const u = new URL(r.headers.get("location")!);
  assert.equal(u.searchParams.get("error"), "access_denied");
  assert.equal(u.searchParams.get("code"), null);
});

// --- Đổi mã và token ---
test("đổi mã: sai verifier bị từ chối, mã không bị tiêu nếu sai", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const dong = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize`, { form: { client_id: id, redirect_uri: URI, response_type: "code", code_challenge: CHALLENGE, code_challenge_method: "S256", ma: m.ma, quyet: "dong-y" } }), m.env, "POST");
  const ma = new URL(dong.headers.get("location")!).searchParams.get("code")!;
  const sai = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "authorization_code", code: ma, code_verifier: "sai-" + VERIFIER, redirect_uri: URI, client_id: id } }), m.env);
  assert.equal(sai.status, 400);
  assert.equal(((await sai.json()) as { error: string }).error, "invalid_grant");
  const dung = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "authorization_code", code: ma, code_verifier: VERIFIER, redirect_uri: URI, client_id: id } }), m.env);
  assert.equal(dung.status, 200, "sai verifier không được tiêu mã");
  const lai = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "authorization_code", code: ma, code_verifier: VERIFIER, redirect_uri: URI, client_id: id } }), m.env);
  assert.equal(lai.status, 400, "mã chỉ dùng một lần");
});
test("đổi mã: redirect_uri hoặc client không khớp thì không đổi được", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m, "A", [URI, "http://localhost:9999/cb"]);
  const dong = await xuLyAuthorize(req(`${ORIGIN}/oauth/authorize`, { form: { client_id: id, redirect_uri: URI, response_type: "code", code_challenge: CHALLENGE, code_challenge_method: "S256", ma: m.ma, quyet: "dong-y" } }), m.env, "POST");
  const ma = new URL(dong.headers.get("location")!).searchParams.get("code")!;
  const tk = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "authorization_code", code: ma, code_verifier: VERIFIER, redirect_uri: "http://localhost:9999/cb", client_id: id } }), m.env);
  assert.equal(tk.status, 400);
});

// --- MCP bằng Bearer ---
test("MCP: không có token thì 401 kèm WWW-Authenticate trỏ tới metadata", async () => {
  const m = await moiMoiTruong();
  const r = await mcp(m, null, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("www-authenticate") ?? "", /resource_metadata="https:\/\/app\.test\/\.well-known\/oauth-protected-resource\/mcp"/);
});
test("MCP: token giả bị từ chối với error=invalid_token", async () => {
  const m = await moiMoiTruong();
  const r = await mcp(m, "a".repeat(43), { jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("www-authenticate") ?? "", /invalid_token/);
});
test("MCP: token đúng gọi được initialize, tools/list, lay_ho_so; phạm vi thiếu thì công cụ báo lỗi có thể đọc", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const tk = await xinToken(m, id, "profile:read");
  const init = await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
  assert.equal(init.status, 200);
  assert.equal(((await init.json()) as { result: { protocolVersion: string } }).result.protocolVersion, "2025-06-18");
  const list = await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.ok(((await list.json()) as { result: { tools: unknown[] } }).result.tools.length >= 6);
  const hoSo = await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "lay_ho_so", arguments: {} } });
  const hsJson = (await hoSo.json()) as { result: { isError?: boolean; content: { text: string }[] } };
  assert.ok(!hsJson.result.isError, hsJson.result.content[0].text);
  assert.ok(hsJson.result.content[0].text.includes("TP.HCM"));
  const deXuat = await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "de_xuat_them_nguyen_vong", arguments: { idChuongTrinh: "neu-ktdn" } } });
  const dxJson = (await deXuat.json()) as { result: { isError: boolean; content: { text: string }[] } };
  assert.equal(dxJson.result.isError, true);
  assert.ok(dxJson.result.content[0].text.includes("preferences:write"), "phải nói rõ thiếu quyền nào");
  const dem = await m.db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat").first<{ n: number }>();
  assert.equal(dem?.n, 0, "không được tạo đề xuất khi thiếu quyền");
});
test("MCP: token hết hạn bị từ chối", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const tk = await xinToken(m, id);
  await m.db.prepare("UPDATE oauth_token SET het_han = 0 WHERE loai = 'access'").run();
  const r = await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 1, method: "ping" });
  assert.equal(r.status, 401);
});
test("MCP: đường dẫn /mcp/{mã} cũ vẫn chạy và không bị kiểm phạm vi", async () => {
  const m = await moiMoiTruong();
  const r = await xuLyMcp(req(`${ORIGIN}/mcp/${m.ma}`, { json: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "de_xuat_them_nguyen_vong", arguments: { idChuongTrinh: "neu-ktdn" } } } }), m.env, m.ma);
  const j = (await r.json()) as { result: { isError?: boolean; content: { text: string }[] } };
  assert.ok(!j.result.isError, j.result.content[0].text);
});

// --- Làm mới, thu hồi, ngắt kết nối ---
test("làm mới: cấp cặp mới; dùng lại refresh cũ thì thu hồi cả họ", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const tk = await xinToken(m, id);
  const moi = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "refresh_token", refresh_token: tk.refresh_token, client_id: id } }), m.env);
  assert.equal(moi.status, 200);
  const cap2 = (await moi.json()) as { access_token: string; refresh_token: string };
  assert.equal((await mcp(m, cap2.access_token, { jsonrpc: "2.0", id: 1, method: "ping" })).status, 200);
  // Dùng lại refresh đã xoay: coi như bị đánh cắp.
  const dung = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "refresh_token", refresh_token: tk.refresh_token, client_id: id } }), m.env);
  assert.equal(dung.status, 400);
  assert.equal((await mcp(m, cap2.access_token, { jsonrpc: "2.0", id: 2, method: "ping" })).status, 401, "cả họ phải bị thu hồi");
  const cuoi = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "refresh_token", refresh_token: cap2.refresh_token, client_id: id } }), m.env);
  assert.equal(cuoi.status, 400, "refresh mới cùng họ cũng không dùng được");
});
test("thu hồi: token truy cập bị thu hồi thì không còn dùng; endpoint luôn trả 200", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const tk = await xinToken(m, id);
  const th = await xuLyThuHoi(req(`${ORIGIN}/oauth/revoke`, { form: { token: tk.access_token } }), m.env);
  assert.equal(th.status, 200);
  assert.equal((await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 1, method: "ping" })).status, 401);
  const la = await xuLyThuHoi(req(`${ORIGIN}/oauth/revoke`, { form: { token: "khong-ton-tai-" + "x".repeat(30) } }), m.env);
  assert.equal(la.status, 200, "token lạ vẫn trả 200 theo RFC 7009");
});
test("ngắt kết nối: xóa kết nối là mọi token và mã mất hiệu lực ngay", async () => {
  const m = await moiMoiTruong();
  const id = await dangKy(m);
  const tk = await xinToken(m, id);
  await xoaKetNoi(m.db, m.maBam);
  assert.equal((await mcp(m, tk.access_token, { jsonrpc: "2.0", id: 1, method: "ping" })).status, 401);
  const lam = await xuLyToken(req(`${ORIGIN}/oauth/token`, { form: { grant_type: "refresh_token", refresh_token: tk.refresh_token, client_id: id } }), m.env);
  assert.equal(lam.status, 400);
});
test("sẵn sàng: D1 và KV đều ok thì 200; thiếu KV thì 503 và không lộ tên binding", async () => {
  const m = await moiMoiTruong();
  const ok = await xuLySanSang(m.env);
  assert.equal(ok.status, 200);
  assert.equal(((await ok.json()) as { san: boolean }).san, true);
  const thieu = await xuLySanSang({ DB: m.db });
  assert.equal(thieu.status, 503);
  const text = await thieu.text();
  assert.ok(!/RATE_KV|binding|SQL/i.test(text), "không được lộ tên cấu hình");
});

test("rollout: thiếu bảng OAuth (chưa áp migration 0011) thì tạo và ngắt kết nối vẫn chạy", async () => {
  const db = taoD1KetNoiTest();
  for (const b of ["oauth_token", "oauth_ma_xac_nhan", "oauth_client"]) db.db.exec(`DROP TABLE ${b}`);
  const env: EnvKetNoi = { DB: db, RATE_KV: kvTest().kv };
  const kq = await taoKetNoi(db, banMau() as never);
  const maBam = await bamMa(kq.ma);
  await xoaKetNoi(db, maBam);
  const con = await db.prepare("SELECT COUNT(*) AS n FROM ket_noi_ai WHERE ma_bam = ?").bind(maBam).first<{ n: number }>();
  assert.equal(con?.n, 0, "ngắt kết nối phải xóa được bản chụp dù thiếu bảng OAuth");
  assert.equal((await xuLySanSang(env)).status, 200, "ready vẫn báo ok, vì OAuth không thuộc phần sẵn sàng bắt buộc");
});

async function main() {
  let loi = 0;
  for (const [ten, fn] of kiemTra) {
    try { await fn(); console.log(`✓ ${ten}`); } catch (e) { loi++; console.log(`✗ ${ten}\n  ${(e as Error).message.split("\n").slice(0, 6).join("\n  ")}`); }
  }
  if (loi) { console.log(`\noauth-mcp: ${loi} kiểm tra thất bại trên ${kiemTra.length}`); process.exit(1); }
  console.log(`\noauth-mcp: tất cả ${kiemTra.length} kiểm tra đều qua`);
}
main();
