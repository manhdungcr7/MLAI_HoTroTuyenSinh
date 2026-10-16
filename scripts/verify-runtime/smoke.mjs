// Kiểm tra runtime thật, chỉ đọc: node scripts/verify-runtime/smoke.mjs [https://nguyenvongai.pages.dev]
// Không ghi dữ liệu, không gọi AI (không tốn lượt). Thất bại thì thoát mã 1.
// Một phản hồi 200 HTML không được tính là API thành công.
const base = (process.argv[2] ?? "https://nguyenvongai.pages.dev").replace(/\/$/, "");

const ca = [];
const kiem = (ten, dieu, ghiChu = "") => ca.push({ ten, ok: dieu, ghiChu });

async function goi(duong, opt = {}) {
  const t0 = Date.now();
  const r = await fetch(base + duong, { ...opt, signal: AbortSignal.timeout(30000) });
  const chu = await r.text();
  let json = null;
  try { json = JSON.parse(chu); } catch { /* không phải JSON */ }
  return { status: r.status, type: r.headers.get("content-type") ?? "", json, ms: Date.now() - t0, headers: r.headers };
}

// 1. Manifest là JSON đúng schema, không phải HTML fallback
{
  const r = await goi("/api/manifest");
  kiem("manifest: JSON 200", r.status === 200 && r.json?.schemaVersion === 1 && r.json?.datasets, `status ${r.status}, ${r.ms}ms`);
}

// 2. Endpoint tư vấn chỉ nhận POST và trả JSON lỗi có mã
{
  const r = await goi("/api/tu-van");
  kiem("tu-van: GET trả 405 JSON", r.status === 405 && typeof r.json?.loi === "string", `status ${r.status}`);
}

// 3. Mã kết nối sai bị từ chối đúng cách, không lộ chi tiết
{
  const r = await goi("/api/gpt/ma-gia-khong-ton-tai/openapi.json");
  kiem("gpt: mã sai trả 404 JSON", r.status === 404 && typeof r.json?.loi === "string", `status ${r.status}`);
}

// 4. MCP: GET bị từ chối, POST với mã sai trả lỗi JSON-RPC -32001
{
  const g = await goi("/mcp/ma-gia-khong-ton-tai");
  kiem("mcp: GET trả 405", g.status === 405, `status ${g.status}`);
  const p = await goi("/mcp/ma-gia-khong-ton-tai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }),
  });
  kiem("mcp: mã sai trả JSON-RPC -32001", p.json?.error?.code === -32001, `status ${p.status}`);
}

// 5. MCP: mã sai thì không biết id nào nên trả id null (server không đoán id), và phản hồi là JSON-RPC thật
{
  const p = await goi("/mcp/ma-gia-khong-ton-tai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 42, method: "ping" }),
  });
  kiem("mcp: mã sai trả id null, không phải HTML", p.json?.jsonrpc === "2.0" && p.json?.id === null, `id ${p.json?.id}`);
}

// 6. Trang chủ trả HTML, không lỗi
{
  const r = await fetch(base + "/", { signal: AbortSignal.timeout(30000) });
  kiem("trang chủ: 200 HTML", r.status === 200 && (r.headers.get("content-type") ?? "").includes("text/html"), `status ${r.status}`);
}

// 8. Health và metadata OAuth: chỉ đọc, không đụng D1
{
  const h = await goi("/api/v1/health");
  kiem("health: 200 JSON ok", h.status === 200 && h.json?.ok === true, `status ${h.status}`);
  const rd = await goi("/api/v1/ready");
  kiem("ready: JSON có trạng thái từng thành phần", (rd.status === 200 || rd.status === 503) && typeof rd.json?.thanhPhan === "object", `status ${rd.status}`);
  const as = await goi("/.well-known/oauth-authorization-server");
  kiem("metadata máy chủ ủy quyền: đủ endpoint và PKCE S256", as.json?.token_endpoint === `${base}/oauth/token` && as.json?.code_challenge_methods_supported?.includes("S256"), `status ${as.status}`);
  const pr = await goi("/.well-known/oauth-protected-resource/mcp");
  kiem("metadata tài nguyên /mcp: trỏ tới máy chủ ủy quyền", pr.json?.resource === `${base}/mcp` && pr.json?.authorization_servers?.[0] === base, `status ${pr.status}`);
  const nt = await goi("/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) });
  kiem("mcp không token: 401 kèm WWW-Authenticate", nt.status === 401 && /resource_metadata=/.test(nt.headers?.get?.("www-authenticate") ?? ""), `status ${nt.status}`);
}

let loi = 0;
for (const c of ca) {
  if (!c.ok) loi++;
  console.log(`${c.ok ? "✓" : "✗"} ${c.ten}${c.ghiChu ? ` (${c.ghiChu})` : ""}`);
}
console.log(`\n${ca.length - loi}/${ca.length} kiểm tra đạt, ${base}`);
process.exit(loi ? 1 : 0);
