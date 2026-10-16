// Đưa bộ slide thuyết trình (slides/) vào dist/thuyetrinh/ để có ở https://nguyenvongai.pages.dev/thuyetrinh/
// Chạy sau `vite build` (Vite xóa dist mỗi lần build). Nguồn duy nhất là thư mục slides/: sửa ở đó, không sửa bản trong dist.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goc = join(dirname(fileURLToPath(import.meta.url)), "..");
const nguon = join(goc, "slides");
const dich = join(goc, "dist", "thuyetrinh");

if (!existsSync(join(goc, "dist"))) { console.error("copy-slides: chưa có dist/, chạy vite build trước"); process.exit(1); }
if (!existsSync(join(nguon, "thuyet-trinh.html"))) { console.error("copy-slides: thiếu slides/thuyet-trinh.html"); process.exit(1); }

mkdirSync(dich, { recursive: true });
cpSync(join(nguon, "assets"), join(dich, "assets"), { recursive: true });
const html = readFileSync(join(nguon, "thuyet-trinh.html"), "utf8");
writeFileSync(join(dich, "index.html"), html);
console.log("copy-slides: dist/thuyetrinh/ (index.html + assets)");
