// Kiểm thử end-to-end OAuth + MCP trên một máy chủ thật (mặc định production).
// Ghi dữ liệu thử nghiệm: tạo một kết nối mới (hồ sơ mẫu, không phải dữ liệu học sinh), đăng ký một client,
// và xóa kết nối khi xong. Chạy: node scripts/verify-runtime/oauth-e2e.mjs [https://nguyenvongai.pages.dev]
import { createHash, randomBytes } from "node:crypto";

const base = (process.argv[2] ?? "https://nguyenvongai.pages.dev").replace(/\/$/, "");
const URI = "https://claude.ai/api/mcp/auth_callback";
const ca = [];
const kiem = (ten, dieu, ghiChu = "") => { ca.push({ ten, ok: !!dieu }); console.log(`${dieu ? "✓" : "✗"} ${ten}${ghiChu ? ` (${ghiChu})` : ""}`); };
const b64 = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function json(duong, opt = {}) {
  const r = await fetch(base + duong, { redirect: "manual", signal: AbortSignal.timeout(30000), ...opt });
  const chu = await r.text();
  let v = null;
  try { v = JSON.parse(chu); } catch { /* không phải JSON */ }
  return { status: r.status, json: v, text: chu, headers: r.headers };
}
const form = (o) => new URLSearchParams(o).toString();
const rpc = (token, body) => json("/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

// 1. Tạo kết nối thử nghiệm
const ban = {
  phienBan: 1, capNhat: new Date().toISOString(),
  hoSo: { lop: 12, tinh: "TP.HCM", nganhQuanTam: ["Công nghệ thông tin"], nganSachToiDaTrieu: 30, khuVuc: ["KV2"] },
  mucTieu: { nganh: "Khoa học máy tính", truong: "UIT", diemCan: 26, conThieu: 0.5 },
  diemThi: [{ ngay: "2026-10-01", tong: 24.5, toHop: "A01" }],
  nguyenVong: [{ thuTu: 1, id: "uit-cntt", nganh: "Khoa học máy tính", truong: "Đại học CNTT", maTruong: "QSB", nhan: "Vừa sức" }],
  goiY: [{ id: "neu-ktdn", nganh: "Kinh tế", truong: "ĐH Kinh tế", maTruong: "KHA", diemChuan: 22, namDiem: 2025 }],
  keHoachTuan: [{ tieuDe: "Ôn toán", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T20:00:00+07:00" }],
};
const tao = await json("/api/ket-noi/tao", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ banChup: ban }) });
const ma = tao.json?.ma;
kiem("tạo kết nối thử: 201 kèm mã", tao.status === 201 && /^[a-f0-9]{32}$/.test(ma ?? ""), `status ${tao.status}`);
if (!ma) { console.log("Dừng: không tạo được kết nối thử."); process.exit(1); }

try {
  // 2. Khám phá metadata và đăng ký client
  const as = await json("/.well-known/oauth-authorization-server");
  kiem("metadata máy chủ ủy quyền đọc được", as.json?.authorization_endpoint === `${base}/oauth/authorize`);
  const dk = await json("/oauth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_name: "E2E kiểm thử", redirect_uris: [URI] }) });
  const clientId = dk.json?.client_id;
  kiem("đăng ký client động: 201", dk.status === 201 && !!clientId, `status ${dk.status}`);

  // 3. Trang đồng ý và PKCE
  const verifier = b64(randomBytes(32));
  const challenge = b64(createHash("sha256").update(verifier).digest());
  const thamSo = { client_id: clientId, redirect_uri: URI, response_type: "code", code_challenge: challenge, code_challenge_method: "S256", state: "e2e-1", resource: `${base}/mcp` };
  const trang = await json(`/oauth/authorize?${new URLSearchParams(thamSo)}`);
  kiem("trang đồng ý: 200 HTML, có ô dán mã", trang.status === 200 && /name="ma"/.test(trang.text), `status ${trang.status}`);

  // 4. Đồng ý bằng mã kết nối và đổi mã
  const dong = await json("/oauth/authorize", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ ...thamSo, ma, quyet: "dong-y" }) });
  const loc = dong.headers.get("location") ?? "";
  const code = loc ? new URL(loc).searchParams.get("code") : null;
  kiem("đồng ý: chuyển hướng về client kèm mã và state", dong.status === 302 && !!code && new URL(loc).searchParams.get("state") === "e2e-1", `status ${dong.status}`);
  const tk = await json("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: URI, client_id: clientId }) });
  kiem("đổi mã lấy token: 200 Bearer", tk.status === 200 && tk.json?.token_type === "Bearer" && !!tk.json?.refresh_token, `status ${tk.status}`);
  const again = await json("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: URI, client_id: clientId }) });
  kiem("mã xác nhận chỉ dùng một lần", again.status === 400, `status ${again.status}`);

  // 5. MCP bằng Bearer
  const init = await rpc(tk.json?.access_token, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } } });
  kiem("MCP initialize với Bearer", init.status === 200 && init.json?.result?.protocolVersion === "2025-06-18", `status ${init.status}`);
  const list = await rpc(tk.json?.access_token, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  kiem("MCP tools/list trả đủ công cụ", (list.json?.result?.tools?.length ?? 0) >= 6, `${list.json?.result?.tools?.length} công cụ`);
  const hs = await rpc(tk.json?.access_token, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "lay_ho_so", arguments: {} } });
  kiem("công cụ lay_ho_so đọc được bản chụp", !hs.json?.result?.isError && /TP\.HCM/.test(hs.json?.result?.content?.[0]?.text ?? ""));
  const noToken = await rpc(null, { jsonrpc: "2.0", id: 4, method: "ping" });
  kiem("MCP không token: 401 kèm WWW-Authenticate", noToken.status === 401 && /resource_metadata=/.test(noToken.headers.get("www-authenticate") ?? ""), `status ${noToken.status}`);
  const sai = await rpc("a".repeat(43), { jsonrpc: "2.0", id: 5, method: "ping" });
  kiem("MCP token giả: 401 invalid_token", sai.status === 401 && /invalid_token/.test(sai.headers.get("www-authenticate") ?? ""), `status ${sai.status}`);

  // 6. Làm mới có xoay vòng và phát hiện tái sử dụng
  const moi = await json("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "refresh_token", refresh_token: tk.json?.refresh_token, client_id: clientId }) });
  kiem("làm mới token: cấp cặp mới", moi.status === 200 && !!moi.json?.access_token, `status ${moi.status}`);
  const dung = await json("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "refresh_token", refresh_token: tk.json?.refresh_token, client_id: clientId }) });
  kiem("dùng lại refresh đã xoay: từ chối", dung.status === 400, `status ${dung.status}`);
  const sauTaiSuDung = await rpc(moi.json?.access_token, { jsonrpc: "2.0", id: 6, method: "ping" });
  kiem("tái sử dụng làm thu hồi cả họ token", sauTaiSuDung.status === 401, `status ${sauTaiSuDung.status}`);

  // 7. Thu hồi
  const tk2 = await json("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "refresh_token", refresh_token: moi.json?.refresh_token ?? "x", client_id: clientId }) });
  kiem("làm mới từ cặp mới bị từ chối sau khi họ đã thu hồi", tk2.status === 400, `status ${tk2.status}`);
} finally {
  // 8. Ngắt kết nối thử nghiệm: token phải mất hiệu lực
  const xoa = await json("/api/ket-noi", { method: "DELETE", headers: { "x-ket-noi": ma } });
  kiem("ngắt kết nối thử: 200", xoa.status === 200, `status ${xoa.status}`);
}

const loi = ca.filter((c) => !c.ok).length;
console.log(`\n${ca.length - loi}/${ca.length} kiểm tra đạt, ${base}`);
process.exit(loi ? 1 : 0);
