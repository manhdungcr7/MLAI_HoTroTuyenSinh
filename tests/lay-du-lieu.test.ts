// Số gửi cho Tư vấn AI phải khớp số hiển thị ở màn chi tiết/danh sách. Chạy: npx tsx tests/lay-du-lieu.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { nhanNguyenVong } from "../src/engine/phan-tich";
import { danhGia, boiCanhTu } from "../src/features/kham-pha/phu-hop";
import { tongChoLuaChon, diemDayDu } from "../src/features/kham-pha/to-hop";
import { chonDuLieuKemTheo, dungSuKien, tomTatHoSo } from "../src/features/tu-van/lay-du-lieu";
import { taoHoSoMau } from "../src/state/mau";

const s = taoHoSoMau();
const bc = boiCanhTu(s);
const diem = diemDayDu(s);
const mau = LUA_CHON_MAU.filter((l) => l.phuongThuc === undefined || l.phuongThuc === "THPT").slice(0, 400);
const ds = [...LUA_CHON_MAU.filter((l) => /^Trí tuệ nhân tạo/i.test(l.nganh) && /MBS|Kinh tế TP/i.test(l.truong + l.tenTruong + l.maTruong)), ...mau, ...s.nguyenVong.map((id) => LUA_CHON_MAU.find((l) => l.id === id)!).filter(Boolean)];
let dem = 0;
for (const l of ds) {
  const kq = danhGia(l, bc);
  const sk = dungSuKien(l, diem, null);
  if (kq.tong === null) { assert.equal(sk.chenh, undefined, l.id); continue; }
  dem++;
  assert.equal(sk.chenh, Math.round(kq.tong! * 100 - l.diemMin * 100) / 100 === 0 ? 0 : Math.round((kq.tong! - l.diemMin) * 100) / 100, `chênh lệch ${l.id}`);
  assert.equal(sk.nhanCuaEm, nhanNguyenVong(l, tongChoLuaChon(l, diem).tong!), `nhãn ${l.id}`);
}
assert.ok(dem > 50, "phải kiểm đủ chương trình");

// Chênh gửi AI = chênh màn hình (làm tròn 1 chữ số như hiển thị)
for (const id of s.nguyenVong) {
  const l = LUA_CHON_MAU.find((x) => x.id === id); if (!l) continue;
  const kq = danhGia(l, bc); if (kq.tong === null) continue;
  const sk = dungSuKien(l, diem, null);
  assert.equal(Math.round(sk.chenh! * 10) / 10, Math.round(kq.chenh! * 10) / 10, `chênh ${id}`);
}
// Tổng điểm gửi AI theo từng ngành phải là tổng theo tổ hợp của chính ngành đó, không phải tổ hợp cao nhất của hồ sơ
const ho = tomTatHoSo(s);
const khac = chonDuLieuKemTheo("danh sách nguyện vọng", s, null).filter((x) => x.tongCuaEm !== undefined && ho.toHopCaoNhat && x.tongCuaEm !== ho.toHopCaoNhat.tong);
assert.ok(khac.length > 0 || !ho.toHopCaoNhat, "mẫu cần có ngành tổng khác tổ hợp cao nhất để test có ý nghĩa");
// Ca lỗi gốc: MBS Trí tuệ nhân tạo, hồ sơ mẫu. Tổ hợp cao nhất hồ sơ là A02 (24,8) nhưng ngành này xét A01 (24,5), chênh 2,0.
const mbs = LUA_CHON_MAU.find((l) => l.id === "mbs-73175b7e");
if (mbs) {
  const e = dungSuKien(mbs, diem, null);
  assert.equal(e.tongCuaEm, 24.5); assert.equal(e.toHopDaTinh, "A01"); assert.equal(e.chenh, 2);
  assert.equal(ho.toHopCaoNhat?.ma, "A02"); assert.notEqual(e.tongCuaEm, ho.toHopCaoNhat?.tong);
}
console.log("OK lay-du-lieu", dem);
