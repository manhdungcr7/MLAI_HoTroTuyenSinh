// Sinh cms/src/du-lieu/danh-sach-truong.json: mã, tên, khu vực của từng trường (khoảng 100 dòng).
// Lý do: CMS không nên kéo cả LUA_CHON (hơn 800KB) vào bundle chỉ để có danh sách trường.
// Chạy: npx tsx scripts/xuat-danh-sach-truong.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Dong { ma: string; truong: string; tinh: string }
const goc = join(import.meta.dirname, "..");
const dong = JSON.parse(readFileSync(join(goc, "src/data/du-lieu-that.json"), "utf8")) as Dong[];

const theoMa = new Map<string, { ma: string; ten: string; khuVuc: string }>();
for (const d of dong) if (d.ma && !theoMa.has(d.ma)) theoMa.set(d.ma, { ma: d.ma, ten: d.truong, khuVuc: d.tinh });

const ra = [...theoMa.values()].sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
mkdirSync(join(goc, "cms/src/du-lieu"), { recursive: true });
writeFileSync(join(goc, "cms/src/du-lieu/danh-sach-truong.json"), JSON.stringify(ra) + "\n");
console.log(`Đã ghi ${ra.length} trường.`);
