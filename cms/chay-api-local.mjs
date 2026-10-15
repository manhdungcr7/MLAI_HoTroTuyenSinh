// Chạy máy chủ API của CMS ở máy bạn: `npm run cms:build` rồi `npm run cms:api` (cổng 8788, D1/KV cục bộ, .dev.vars của cms/).
// Vì sao copy ra thư mục tạm: ở thư mục repo, wrangler đọc wrangler.jsonc GỐC (Worker của app học sinh, có `assets` mà không có `directory`)
// và dừng với lỗi "assets ... missing the required directory". Thư mục tạm không có wrangler.jsonc nào ở phía trên nên chạy được.
// Bố cục bản copy giữ nguyên đường dẫn tương đối: <tmp>/nv-cms/{cms/functions, cms/dist, src, migrations, functions}.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const cms = dirname(fileURLToPath(import.meta.url));
const goc = join(cms, "..");
const g = join(tmpdir(), "nv-cms");
const cwd = join(g, "cms");
const wrangler = join(goc, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler"); // wrangler của repo (không để npx tải bản khác)

// Danh sách các route API của CMS (bao gồm các endpoint mới: /api/cai-dat, /api/quen-mat-khau, /api/email-log)
export const CAC_ROUTE_API_CMS = [
  "/api/toi",
  "/api/dang-nhap",
  "/api/dang-xuat",
  "/api/doi-mat-khau",
  "/api/quen-mat-khau",
  "/api/nguoi",
  "/api/phan-cong",
  "/api/nhat-ky",
  "/api/email-log",
  "/api/cai-dat",
  "/api/hop-thu",
  "/api/ban-ghi",
  "/api/goi-y-duyet",
  "/api/xuat-ban-snapshot",
  "/api/telegram",
];

if (!existsSync(join(cms, "dist"))) { console.error("Chưa có cms/dist. Chạy `npm run cms:build` trước."); process.exit(1); }
// Giữ lại <tmp>/nv-cms/cms/.wrangler/state (dữ liệu D1/KV cục bộ) giữa các lần chạy; chỉ thay mã nguồn.
for (const t of ["cms/functions", "cms/dist", "src", "migrations", "functions"]) rmSync(join(g, t), { recursive: true, force: true });
mkdirSync(cwd, { recursive: true });
for (const t of ["functions", "dist", "wrangler.jsonc", ".dev.vars"]) if (existsSync(join(cms, t))) cpSync(join(cms, t), join(cwd, t), { recursive: true });
cpSync(join(goc, "src"), join(g, "src"), { recursive: true });
cpSync(join(goc, "migrations"), join(g, "migrations"), { recursive: true });
if (existsSync(join(goc, "functions"))) cpSync(join(goc, "functions"), join(g, "functions"), { recursive: true });
// workerd cục bộ có thể cũ hơn compatibility_date trong wrangler.jsonc: bản copy dùng ngày an toàn (chỉ ảnh hưởng chạy thử).
const wr = join(cwd, "wrangler.jsonc");
writeFileSync(wr, readFileSync(wr, "utf8").replace(/"compatibility_date":\s*"[^"]+"/, '"compatibility_date": "2026-07-01"'));
console.log(`Chạy từ ${cwd} (${CAC_ROUTE_API_CMS.length} routes: ${CAC_ROUTE_API_CMS.join(", ")})`);
const chay = (args) => spawnSync(wrangler, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
chay(["d1", "migrations", "apply", "DB", "--local"]);
chay(["pages", "dev", "--port", "8788", "--d1", "DB=00000000-0000-0000-0000-000000000000", "--kv", "KV_CONG_DONG"]);

