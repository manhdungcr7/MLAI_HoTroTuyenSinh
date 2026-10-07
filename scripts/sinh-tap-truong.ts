// Sinh tệp nhỏ {mã trường: tên} cho Function của CMS (Function không import được LUA_CHON 800KB).
// Chạy lại khi dữ liệu trường đổi: npx tsx scripts/sinh-tap-truong.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const goc = join(import.meta.dirname, "..");
const ds = JSON.parse(readFileSync(join(goc, "src/data/du-lieu-that.json"), "utf8")) as { ma: string; truong: string }[];
const ra: Record<string, string> = {};
for (const x of ds) ra[x.ma] = x.truong;
const sapXep = Object.fromEntries(Object.entries(ra).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(goc, "cms/functions/_thu-vien/tap-truong.json"), JSON.stringify(sapXep, null, 1) + "\n");
console.log(`Đã ghi ${Object.keys(sapXep).length} trường`);
