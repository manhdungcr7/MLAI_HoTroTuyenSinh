import "./nap-du-lieu";
// Kiểm cơ chế ghi đè điểm chuẩn có bằng chứng. Chạy: npx tsx tests/hieu-chinh-diem.test.ts
import assert from "node:assert/strict";
import { apDungHieuChinh, type HieuChinhTep } from "../src/data/hieu-chinh-diem";
import hieuChinhThat from "../src/data/hieu-chinh-diem.json";
import duLieu from "../src/data/du-lieu-that.json";
import { LUA_CHON } from "../src/data/lua-chon-that";

const dong = { id: "x-1", diem: { "2023": 24, "2024": 17.95 } as Record<string, number> };
const nguon = { url: "https://example.org/a.pdf", trang: 3, lyDo: "thử" };
const hc: HieuChinhTep = { "x-1": { "2023": { diem: 17, ...nguon } } };

// áp đúng số, không đổi bản gốc
const kq = apDungHieuChinh(dong, hc);
assert.equal(kq.diem["2023"], 17);
assert.equal(kq.diem["2024"], 17.95);
assert.equal(dong.diem["2023"], 24, "không đổi object gốc");
assert.notEqual(kq, dong);

// null gỡ năm
const g = apDungHieuChinh(dong, { "x-1": { "2023": { diem: null, ...nguon } } });
assert.deepEqual(Object.keys(g.diem), ["2024"]);
assert.equal("2023" in dong.diem, true);

// id hoặc năm không tồn tại thì bỏ qua
assert.deepEqual(apDungHieuChinh(dong, { "y-9": { "2023": { diem: 1, ...nguon } } }).diem, dong.diem);
const khongNam = apDungHieuChinh(dong, { "x-1": { "2022": { diem: 20, ...nguon } } });
assert.deepEqual(khongNam.diem, dong.diem);
assert.equal("2022" in khongNam.diem, false, "không thêm năm chưa có");

// mọi mục trong tệp thật có url + trang + lyDo và trỏ tới id/năm có thật
const ids = new Map((duLieu as unknown as { id: string; diem: Record<string, number> }[]).map((d) => [d.id, d]));
let dem = 0;
for (const [id, nams] of Object.entries(hieuChinhThat as unknown as HieuChinhTep)) {
  assert.ok(ids.has(id), `id không có trong dữ liệu: ${id}`);
  for (const [nam, h] of Object.entries(nams)) {
    dem++;
    assert.ok(nam in ids.get(id)!.diem, `${id} không có năm ${nam}`);
    assert.match(h.url, /^https?:\/\//, `${id}/${nam} thiếu url`);
    assert.ok(Number.isInteger(h.trang) && h.trang > 0, `${id}/${nam} thiếu trang`);
    assert.ok(h.lyDo.length > 10, `${id}/${nam} thiếu lý do`);
    assert.ok(h.diem === null || (h.diem > 0 && h.diem <= 30), `${id}/${nam} điểm ngoài thang`);
  }
}
assert.ok(dem > 0);

// Danh mục sau nạp đã áp ghi đè: ddk-a58ca670 năm 2023 là 17, dcl-91a83fa5 không còn năm 2024
const a = LUA_CHON.find((l) => l.id === "ddk-a58ca670")!;
assert.equal(a.diemTheoNam?.["2023"], 17);
const d = LUA_CHON.find((l) => l.id === "dcl-91a83fa5")!;
assert.equal("2024" in (d.diemTheoNam ?? {}), false);
console.log(`hieu-chinh-diem: ${dem} mục ghi đè, đều có url/trang/lý do. OK`);
