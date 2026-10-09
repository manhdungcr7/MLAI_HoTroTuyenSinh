// Sinh danh sách chương trình theo trường cho CMS (cms/src/du-lieu-truong/chuong-trinh-truong.json).
// Người nhập điểm chuẩn CHỌN chương trình từ danh sách này thay vì gõ mã ngành, nên bản ghi điểm chuẩn gắn đúng chương trình trong dữ liệu gốc.
// Mỗi dòng: [id, tên ngành, năm điểm chuẩn mới nhất đang có, điểm đó, phương thức]. Chạy lại khi dữ liệu gốc đổi: npx tsx scripts/sinh-chuong-trinh-cms.ts
import { writeFileSync } from "node:fs";
import { LUA_CHON } from "../src/data/lua-chon-that";

const ra: Record<string, [string, string, number | null, number | null, string][]> = {};
for (const l of LUA_CHON) {
  const nam = Object.keys(l.diemTheoNam ?? {}).sort().at(-1);
  const ma = (l.maTruong ?? l.truong).toUpperCase();
  (ra[ma] ??= []).push([l.id, l.nganh, nam ? Number(nam) : null, nam ? l.diemTheoNam![nam] : null, l.phuongThuc ?? ""]);
}
for (const k of Object.keys(ra)) ra[k].sort((a, b) => a[1].localeCompare(b[1], "vi"));
const duong = new URL("../cms/src/du-lieu-truong/chuong-trinh-truong.json", import.meta.url);
writeFileSync(duong, JSON.stringify(ra));
console.log(`Đã ghi ${Object.keys(ra).length} trường, ${LUA_CHON.length} chương trình`);
