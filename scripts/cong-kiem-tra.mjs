// Cổng kiểm tra trước khi commit/push. Chạy trên BẢN CHỤP đúng thứ sắp vào lịch sử, không chạy trên cả cây làm việc,
// nên file dở của người khác (hoặc của agent khác) không làm mình đỏ, và việc dở của mình không lọt vào commit.
//   node scripts/cong-kiem-tra.mjs commit   → bản chụp của chỉ mục (git add): tsc + kiem-tra + test của phần vừa đổi (nhanh)
//   node scripts/cong-kiem-tra.mjs push     → bản chụp của HEAD: tsc + kiem-tra + build + MỌI test, so với tests/baseline-do.json
// Nhánh wip/* được bỏ qua (chỉ để lưu việc dở, không bao giờ merge vào main). Hook cài bằng `npm install` (script prepare).
import { spawnSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, lstatSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const che_do = process.argv[2] ?? "commit";
const goc = resolve(import.meta.dirname, "..");
const chay = (lenh, args, cwd, tuy = {}) => spawnSync(lenh, args, { cwd, encoding: "utf8", shell: process.platform === "win32", env: { ...process.env, NODE_NO_WARNINGS: "1" }, ...tuy });
const nhanh = chay("git", ["branch", "--show-current"], goc).stdout.trim();

if (nhanh.startsWith("wip/") || process.env.CONG_BO_QUA === "1") {
  console.log(`[cổng] bỏ qua (${nhanh.startsWith("wip/") ? "nhánh wip/*" : "CONG_BO_QUA=1"}). Việc dở này KHÔNG được merge vào main.`);
  process.exit(0);
}

const tg = mkdtempSync(join(tmpdir(), "nv-cong-"));
const noiNodeModules = join(tg, "node_modules");
function don() {
  try {
    if (existsSync(noiNodeModules)) { // gỡ liên kết trước, tuyệt đối không xóa đệ quy xuyên qua nó
      if (process.platform === "win32") execSync(`cmd /c rmdir "${noiNodeModules}"`);
      else unlinkSync(noiNodeModules);
    }
  } catch { /* nếu không gỡ được thì để nguyên thư mục tạm, không xóa */ console.error(`[cổng] không gỡ được liên kết node_modules, giữ ${tg}`); return; }
  rmSync(tg, { recursive: true, force: true });
}
process.on("exit", don);
process.on("SIGINT", () => process.exit(130));

// 1) Xuất bản chụp
if (che_do === "commit") {
  const r = chay("git", ["checkout-index", "-a", "-f", `--prefix=${tg.replace(/\\/g, "/")}/`], goc);
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
} else {
  const ar = spawnSync("git", ["archive", "--format=tar", "HEAD"], { cwd: goc, maxBuffer: 1024 * 1024 * 1024 });
  const x = spawnSync("tar", ["-x", "-C", tg], { input: ar.stdout, maxBuffer: 1024 * 1024 * 1024 });
  if (ar.status !== 0 || x.status !== 0) { console.error("[cổng] không xuất được HEAD"); process.exit(1); }
}
symlinkSync(join(goc, "node_modules"), noiNodeModules, "junction");

const buoc = [];
const chayBuoc = (ten, lenh, args) => {
  const t0 = Date.now();
  const r = chay(lenh, args, tg);
  const ok = r.status === 0;
  buoc.push({ ten, ok });
  console.log(`[cổng] ${ok ? "OK  " : "LỖI"} ${ten} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (!ok) console.log(((r.stdout ?? "") + (r.stderr ?? "")).split("\n").filter((l) => l.trim()).slice(-14).join("\n"));
  return ok;
};

// 2) Chọn test
const danhSachTest = (() => {
  const s = JSON.parse(readFileSync(join(tg, "package.json"), "utf8")).scripts.test;
  return s.split(" && ").filter((c) => c.startsWith("tsx ")).map((c) => c.slice(4));
})();
const dsCoSan = new Set(readdirSync(join(tg, "tests")).map((f) => `tests/${f}`));

function testChoPhanDoi() {
  const doi = chay("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], goc).stdout.split("\n").filter(Boolean);
  const chon = new Set();
  for (const f of doi) {
    const lat = f.match(/^src\/features\/([^/]+)\//)?.[1];
    if (lat) for (const t of dsCoSan) if (t.startsWith(`tests/${lat}`) || (lat === "tu-van" && t.startsWith("tests/tu-van")) || (lat === "thu-tinh-huong" && t.includes("thu-tinh-huong"))) chon.add(t);
    if (/^(src\/(engine|state|data)|functions)\//.test(f)) ["trang-thai-du-lieu", "du-bao-diem-chuan", "nhan-nguyen-vong", "nguyen-vong", "kham-pha", "lay-du-lieu"].forEach((n) => dsCoSan.has(`tests/${n}.test.ts`) && chon.add(`tests/${n}.test.ts`));
    if (/^tests\/.*\.test\.ts$/.test(f)) chon.add(f);
  }
  return [...chon].filter((t) => danhSachTest.includes(t));
}

const baseline = existsSync(join(tg, "tests/baseline-do.json")) ? JSON.parse(readFileSync(join(tg, "tests/baseline-do.json"), "utf8")) : {};

function chayTests(ds) {
  const loi = [];
  for (const t of ds) {
    const r = chay("npx", ["tsx", t], tg);
    const ten = t.replace(/^tests\//, "").replace(/\.test\.ts$/, "").replace(/\.ts$/, "");
    if (r.status !== 0) loi.push({ ten, t, ra: ((r.stdout ?? "") + (r.stderr ?? "")).split("\n").filter((l) => /Error|expected|actual|✗/.test(l)).slice(0, 3).join(" | ").slice(0, 220) });
  }
  return loi;
}

let tot = chayBuoc("tsc --noEmit", "npx", ["tsc", "--noEmit"]);
tot = chayBuoc("kiem-tra (route, màu, từ cấm)", "npm", ["run", "kiem-tra"]) && tot;

let dsTest = che_do === "push" ? danhSachTest : testChoPhanDoi();
if (che_do === "push") tot = chayBuoc("vite build", "npx", ["vite", "build"]) && tot;
console.log(`[cổng] chạy ${dsTest.length} test ${che_do === "push" ? "(toàn bộ)" : "(phần liên quan tới file vừa đổi)"}`);
const loi = chayTests(dsTest);
const moi = loi.filter((l) => !(l.ten in baseline));
const daQua = Object.keys(baseline).filter((k) => dsTest.some((t) => t.includes(k)) && !loi.some((l) => l.ten === k));
for (const l of loi) console.log(`[cổng] ${l.ten in baseline ? "ĐỎ SẴN (baseline, có chủ)" : "LỖI MỚI"} ${l.ten}: ${l.ra}`);
for (const k of daQua) console.log(`[cổng] test "${k}" đã xanh trở lại: xóa khỏi tests/baseline-do.json`);

if (!tot || moi.length) {
  console.error(`\n[cổng] CHẶN ${che_do}: ${!tot ? "tsc/kiem-tra/build đỏ. " : ""}${moi.length ? `${moi.length} test lỗi mới (${moi.map((m) => m.ten).join(", ")}).` : ""}`);
  console.error("[cổng] Sửa rồi thử lại. Chỉ việc dở lưu tạm mới dùng nhánh wip/* (không bị chặn, không được merge).");
  process.exit(1);
}
console.log(`[cổng] qua (${che_do}).`);
