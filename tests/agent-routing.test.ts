import "./nap-du-lieu";
import assert from "node:assert/strict";
import { layTinTraLoi } from "../src/features/tu-van/cau-tra-loi";
import { timNganhKhop } from "../src/features/tu-van/lay-du-lieu";
import { timTruongMoHo } from "../src/features/tu-van/hieu-cau";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { goiMoHinh } from "../functions/_thu-vien/ai/sinh-van-ban";

let network = 0;
const answer = (cau: string) => layTinTraLoi({
  cau, truoc: [], s: TRANG_THAI_BAN_DAU, nguon: null, dungHoSo: false, manHinh: "Tư vấn",
  phien: { cheDo: "ai", idHoSo: "test", luot: null, fetch: async () => { network++; throw new Error("Unexpected AI call"); } },
});
for (const cau of ["Điểm chuẩn Khoa học máy tính UIT năm 2025?", "Học phí UIT bao nhiêu?", "Lịch học tuần này", "Danh sách nguyện vọng của em"]) {
  const t = await answer(cau);
  assert.equal(t.cheDo, "tuDong", cau);
  assert.ok(!t.thuLai, cau);
}
assert.equal(network, 0, "Tra số liệu và kế hoạch không gọi AI dù đã bật chế độ AI");

for (const name of ["BK", "Bách khoa", "UTC"]) {
  const q = `Điểm chuẩn ${name} năm 2025?`;
  const ambiguous = await answer(q);
  assert.ok(ambiguous.hoiLai && (ambiguous.luaChon?.length ?? 0) >= 2, q);
  assert.equal(ambiguous.nguon?.length, 0);
  assert.ok(ambiguous.luaChon?.every((c) => !timTruongMoHo(c.cau)), "Lựa chọn gửi lại nguyên câu với mã trường đã chọn");
}
const precise = timNganhKhop("Điểm chuẩn Khoa học máy tính Bách khoa Hà Nội", 5);
assert.ok(precise.length > 0 && precise.every((l) => l.maTruong === "BKA"));
for (const school of ["Bách khoa TP.HCM", "QSB", "HCMUT", "Đại học Sao Hoả"]) {
  const q = `Điểm chuẩn ${school} ngành Khoa học máy tính năm 2025?`;
  assert.equal(timNganhKhop(q).length, 0, school);
  const missing = await answer(q);
  assert.equal(missing.trangThaiDuLieu, "chua-co", school);
  assert.equal(missing.nguon?.length, 0, school);
}
assert.equal(network, 0);

// Workers AI treo hoặc lỗi: dừng chờ đúng budget và không tự gọi model thứ hai.
let calls = 0;
await assert.rejects(goiMoHinh({ AI: { run: async () => { calls++; return new Promise(() => {}); } } }, "x", fetch, 5), /cf-ai-timeout/);
assert.equal(calls, 1);
calls = 0;
await assert.rejects(goiMoHinh({ AI: { run: async () => { calls++; throw new Error("unavailable"); } } }, "x"), /unavailable/);
assert.equal(calls, 1);
await assert.rejects(goiMoHinh({}, "x", fetch, 0), /het-thoi-gian/);
console.log("agent-routing: OK");
