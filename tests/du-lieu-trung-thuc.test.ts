// Kiểm tra tính trung thực của dữ liệu: không bịa số, phạm vi học phí ghi đúng, nguồn có thật về cấu trúc.
// Số đo đầy đủ: python -I scripts/kiem-dinh-du-lieu.py. Chạy: npx tsx tests/du-lieu-trung-thuc.test.ts
import assert from "node:assert/strict";
import raw from "../src/data/du-lieu-that.json";
import hocPhi from "../src/data/hoc-phi.json";
import viecLam from "../src/data/viec-lam.json";
import { LUA_CHON } from "../src/data/lua-chon-that";

type Dong = { id: string; ma: string; nganh: string; pt: string; tier: string; diem: Record<string, number> };
type HP = { trieuNam: number; nam: string; trang: number; url: string; phamVi?: string; trangThai?: string };
const dl = raw as unknown as Dong[];
const hp = hocPhi as Record<string, HP>;
const vl = viecLam as Record<string, { phanTram: number; nam: string; trang: number; url: string }>;
const maCua = new Map(dl.map((d) => [d.id, d.ma]));

// 1) id duy nhất; khóa (trường, ngành, phương thức) không trùng ngoài 3 ca đã biết (ghi ở docs/DU-LIEU.md)
assert.equal(new Set(dl.map((d) => d.id)).size, dl.length, "id trùng");
const DA_BIET = new Set(["TSN|Kỹ thuật cơ khí động lực|THPT", "TSN|Kỹ thuật xây dựng|THPT", "YDS|Y học cổ truyền|THPT"]);
const dem = new Map<string, number>();
for (const d of dl) { const k = `${d.ma}|${d.nganh}|${d.pt}`; dem.set(k, (dem.get(k) ?? 0) + 1); }
for (const [k, n] of dem) if (n > 1) assert.ok(DA_BIET.has(k), `khóa trùng mới: ${k}`);

// 2) mã trường: 3 ký tự chữ hoa/số (C19, SP2 là mã thật của trường cao đẳng / ĐH Sư phạm Hà Nội 2)
for (const d of dl) assert.match(d.ma, /^[A-Z][A-Z0-9]{2}$/, `mã trường lạ: ${d.ma}`);

// 3) Học phí: mỗi dòng có nguồn (https + trang + năm) hoặc cờ chua-xac-minh; không mồ côi; thang hợp lý
const hopLe = (r: { url?: string; trang?: number; nam?: string }) => /^https:\/\//.test(r.url ?? "") && Number.isInteger(r.trang) && (r.trang as number) > 0 && /^20\d\d$/.test(r.nam ?? "");
for (const [id, r] of Object.entries(hp)) {
  assert.ok(maCua.has(id), `học phí mồ côi: ${id}`);
  assert.ok(r.trieuNam > 0 && r.trieuNam < 500, `học phí lạ: ${id}`);
  assert.ok(hopLe(r) || r.trangThai === "chua-xac-minh", `học phí không nguồn mà chưa gắn chua-xac-minh: ${id}`);
  assert.ok(r.phamVi === "truong" || r.phamVi === "nganh", `thiếu phamVi: ${id}`);
}
// Độ phủ 100% học phí/việc làm là dấu hiệu số do máy sinh (đã từng xảy ra, 2026-10-14, đã gỡ): giữ trần để cảnh báo sớm.
assert.ok(Object.keys(hp).length < dl.length * 0.5, "học phí phủ quá nửa danh mục: kiểm tra có số bịa không");
assert.ok(Object.keys(vl).length + dl.filter((d) => (d as unknown as { viec: number | null }).viec !== null).length < dl.length * 0.5, "việc làm phủ quá nửa danh mục: kiểm tra có số bịa không");

// 4) phamVi khớp quy tắc: trường có >=2 dòng và đúng 1 mức => "truong"; còn lại "nganh"
const theoTruong = new Map<string, { id: string; v: number }[]>();
for (const [id, r] of Object.entries(hp)) { const m = maCua.get(id)!; theoTruong.set(m, [...(theoTruong.get(m) ?? []), { id, v: r.trieuNam }]); }
for (const ds of theoTruong.values()) {
  const chung = ds.length >= 2 && new Set(ds.map((x) => x.v)).size === 1;
  for (const x of ds) assert.equal(hp[x.id].phamVi, chung ? "truong" : "nganh", `phamVi sai: ${x.id}`);
}
assert.ok(Object.values(hp).some((r) => r.phamVi === "truong"), "phải còn ít nhất một trường có học phí cấp trường được gắn nhãn");

// 5) Việc làm bổ sung có nguồn
for (const [id, r] of Object.entries(vl)) { assert.ok(maCua.has(id), `việc làm mồ côi: ${id}`); assert.ok(hopLe(r) && r.phanTram > 0 && r.phanTram <= 100, `việc làm thiếu nguồn: ${id}`); }

// 6) Chuyển đổi: học phí mang đúng phạm vi; loại điểm theo nguồn (điểm 2026 chỉ từ trang tổng hợp => thu-cap)
for (const l of LUA_CHON) {
  if (l.hocPhiMin !== undefined) assert.ok(l.phamViHocPhi === "truong" || l.phamViHocPhi === "nganh", `thiếu phamViHocPhi: ${l.id}`);
  assert.equal(l.loaiDiemMoiNhat, l.nguonCap === "official_pdf" ? "chinh-thuc" : "thu-cap", `loaiDiemMoiNhat sai: ${l.id}`);
}
for (const d of dl) if ("2026" in d.diem) assert.equal(d.tier, "aggregator_verified", `điểm 2026 phải từ nguồn thứ cấp cho tới khi có đề án đối chiếu: ${d.id}`);

console.log("du-lieu-trung-thuc.test.ts: OK");
