// Mỗi hồ sơ mẫu phải hợp lệ qua chuanHoa, có đủ 5 nguyện vọng thật, mục tiêu tính được và việc tuần được sinh. Chạy: npx tsx tests/ho-so-mau.test.ts
import assert from "node:assert/strict";
import { chuanHoa } from "../src/state/chuan-hoa";
import { DANH_SACH_MAU, taoHoSoMau } from "../src/state/mau";
import { timLuaChon } from "../src/data/lua-chon-that";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";

assert.ok(DANH_SACH_MAU.length >= 2);
for (const { kieu } of DANH_SACH_MAU) {
  const m = taoHoSoMau(kieu);
  const n = chuanHoa(JSON.parse(JSON.stringify(m)));
  assert.equal(n.hoSo.hoanTat, true, kieu);
  assert.equal(n.hoSo.laMau, true, kieu);
  assert.equal(n.nguyenVong.length, 5, `${kieu}: đủ 5 nguyện vọng`);
  assert.ok(n.nguyenVong.every((id) => timLuaChon(id)), `${kieu}: id nguyện vọng có thật`);
  assert.equal(n.mucTieu?.luaChonId, n.nguyenVong[0], kieu);
  assert.ok(n.mucTieu && n.mucTieu.diemMucTieu > 0 && n.mucTieu.toHop.length === 3, kieu);
  assert.ok(n.viec.length > 0, `${kieu}: có việc tuần`);
}
assert.equal(taoHoSoMau("giaBao").mucTieu?.maToHop, "D01");
{
  // Gia Bảo thiếu khoảng 0,3–0,8 điểm so với ngành mục tiêu: ca "cố thêm một chút là chạm tới".
  const gb = taoHoSoMau("giaBao");
  const mt = gb.mucTieu!;
  const lc = timLuaChon(mt.luaChonId)!;
  const tong = tongChoLuaChon(lc, Object.fromEntries(gb.diemThi.map((d) => [d.mon, d.diem])) as never).tong!;
  assert.ok(lc.diemMin - tong >= 0.3 - 1e-9 && lc.diemMin - tong <= 0.8 + 1e-9, `thiếu ${lc.diemMin - tong} điểm, cần 0,3–0,8`);
}
console.log("ho-so-mau: ok");
