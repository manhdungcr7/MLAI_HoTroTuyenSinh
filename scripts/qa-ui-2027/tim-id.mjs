// Tìm chương trình thật cho từng trạng thái dữ liệu A/B/C/D/F (theo engine/trang-thai-du-lieu.ts).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const du = JSON.parse(fs.readFileSync(path.join(goc, "src/data/du-lieu-that.json"), "utf8"));
const hopLe = (d) => typeof d === "number" && d >= 10 && d <= 30;
export function phanLoai(r) {
  const diem = Object.entries(r.diem || {}).filter(([n, d]) => hopLe(d)).sort((a, b) => a[0] - b[0]);
  if (!diem.length) return "D";
  if (r.pt && r.pt !== "THPT") return "F";
  if (diem.every(([, d]) => d === 15)) return "C";
  return diem.length >= 2 ? "A" : "B";
}
export function timId() {
  const nhom = { A: [], B: [], C: [], D: [], F: [] };
  for (const r of du) nhom[phanLoai(r)].push(r);
  const chon = (k, loc = () => true) => {
    const ds = nhom[k].filter(loc);
    const r = ds[0];
    return r && { id: r.id, truong: r.truong, ma: r.ma, nganh: r.nganh, pt: r.pt, diem: r.diem, toHop: r.toHop, tong: nhom[k].length };
  };
  return {
    A: chon("A", (r) => r.pt === "THPT" && Object.keys(r.diem).length >= 3 && r.tier === "official_pdf" && r.toHop.includes("A00") && r.diem["2024"] > 20 && r.diem["2024"] < 28),
    B: chon("B", (r) => r.pt === "THPT" && r.toHop.length),
    C: chon("C", (r) => r.toHop.length),
    D: chon("D", (r) => r.nganh),
    F: chon("F", (r) => r.pt === "HOC_BA") || chon("F"),
    demTheoNhom: Object.fromEntries(Object.entries(nhom).map(([k, v]) => [k, v.length])),
    pt: [...new Set(du.map((r) => r.pt))],
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(timId(), null, 1));
