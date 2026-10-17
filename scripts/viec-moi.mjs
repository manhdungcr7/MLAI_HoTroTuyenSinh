// Mở một thư mục làm việc RIÊNG cho một việc (người hoặc agent): git worktree từ origin/main + liên kết node_modules.
//   npm run viec-moi -- ten-viec        → ../nv-ten-viec, nhánh feat/ten-viec
// Mỗi người/agent một thư mục, không ai sửa chung một cây, nên không còn "pending changes" lẫn nhau.
import { execSync } from "node:child_process";
import { existsSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
const ten = process.argv[2];
if (!ten || !/^[a-z0-9-]+$/.test(ten)) { console.error("Dùng: npm run viec-moi -- ten-viec (chữ thường, số, gạch ngang)"); process.exit(1); }
const goc = resolve(import.meta.dirname, "..");
const dich = resolve(goc, "..", `nv-${ten}`);
execSync("git fetch -q origin", { cwd: goc, stdio: "inherit" });
execSync(`git worktree add -b feat/${ten} "${dich}" origin/main`, { cwd: goc, stdio: "inherit" });
if (!existsSync(join(dich, "node_modules"))) symlinkSync(join(goc, "node_modules"), join(dich, "node_modules"), "junction");
execSync("git config core.hooksPath .githooks", { cwd: dich });
console.log(`\nXong. Làm việc trong: ${dich}\nCommit nhỏ, xong thì: git push -u origin feat/${ten} rồi mở PR hoặc merge fast-forward vào main.\nDọn khi xong: git worktree remove "${dich}" (gỡ liên kết node_modules trước nếu Windows báo lỗi).`);
