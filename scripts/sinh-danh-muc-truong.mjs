// Sinh src/data/truong-danh-muc.ts từ src/data/du-lieu-that.json (mã, tên, các tỉnh/cơ sở). Chạy: node scripts/sinh-danh-muc-truong.mjs
import { readFileSync, writeFileSync } from "node:fs";
const d = JSON.parse(readFileSync("src/data/du-lieu-that.json", "utf8"));
const m = new Map();
for (const r of d) {
  const x = m.get(r.ma) ?? { ten: r.truong, tinh: new Map() };
  x.tinh.set(r.tinh, (x.tinh.get(r.tinh) ?? 0) + 1);
  m.set(r.ma, x);
}
const dong = [...m].sort(([a], [b]) => (a < b ? -1 : 1)).map(([ma, x]) => {
  const tinh = [...x.tinh].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map((t) => t[0]);
  return `  [${JSON.stringify(ma)}, ${JSON.stringify(x.ten)}, ${JSON.stringify(tinh)}],`;
});
writeFileSync("src/data/truong-danh-muc.ts",
`// Danh mục trường (mã, tên, các tỉnh/cơ sở có chương trình). SINH TỰ ĐỘNG từ du-lieu-that.json bằng scripts/sinh-danh-muc-truong.mjs; test kiểm tra đồng bộ.
// Tách riêng để máy chủ (functions/) dùng được mà không phải nạp 1,8 MB dữ liệu chương trình.
export const DANH_MUC_TRUONG: readonly (readonly [ma: string, ten: string, tinh: readonly string[]])[] = [
${dong.join("\n")}
];
`);
console.log(m.size, "trường");
