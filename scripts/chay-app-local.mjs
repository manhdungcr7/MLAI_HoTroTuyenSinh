// Chạy app học sinh cùng Functions (manifest, snapshots, tư vấn, đăng ký sớm) ở máy bạn, DÙNG CHUNG D1/KV cục bộ với `npm run cms:api`.
// Nhờ vậy thử được cả vòng: tình nguyện viên nhập → qtv duyệt → xuất bản (CMS, cổng 8788) → học sinh thấy (app, cổng 8790).
// Cách dùng: `npm run build && npm run cms:build`, chạy `npm run cms:api` một lần để tạo dữ liệu cục bộ, rồi `npm run app:local`.
// Copy ra thư mục tạm vì wrangler.jsonc gốc là cấu hình Worker, làm `wrangler pages dev` dừng ở thư mục repo (xem docs/CMS-API.md, mục Vận hành).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const goc = join(dirname(fileURLToPath(import.meta.url)), "..");
const g = join(tmpdir(), "nv-app");
const wrangler = join(goc, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
const trangThai = process.env.NV_TRANG_THAI || join(tmpdir(), "nv-cms", "cms", ".wrangler", "state"); // cùng nơi `cms:api` lưu D1/KV (đặt NV_TRANG_THAI để dùng thư mục khác)

if (!existsSync(join(goc, "dist"))) { console.error("Chưa có dist. Chạy `npm run build` trước."); process.exit(1); }
for (const t of ["dist", "functions", "src", "cms"]) rmSync(join(g, t), { recursive: true, force: true });
mkdirSync(g, { recursive: true });
for (const t of ["dist", "functions", "src"]) cpSync(join(goc, t), join(g, t), { recursive: true });
// Hàm tinh-nguyen đọc tập mã trường của CMS (cùng một tệp để hai bên luôn khớp).
mkdirSync(join(g, "cms", "functions", "_thu-vien"), { recursive: true });
cpSync(join(goc, "cms", "functions", "_thu-vien", "tap-truong.json"), join(g, "cms", "functions", "_thu-vien", "tap-truong.json"));
console.log(`Chạy từ ${g}, dùng dữ liệu cục bộ ở ${trangThai}`);
spawnSync(wrangler, ["pages", "dev", "dist", "--port", "8790", "--d1", "DB=00000000-0000-0000-0000-000000000000", "--kv", "KV_CONG_DONG", "--persist-to", trangThai, "--compatibility-date", "2026-07-01"], { cwd: g, stdio: "inherit", shell: process.platform === "win32" });
