import "./nap-du-lieu";
// coDuLieuNguoiDung: mọi thứ em tự nhập đều tính, hồ sơ mẫu thì không. Chạy: npx tsx tests/co-du-lieu-nguoi-dung.test.ts
import assert from "node:assert/strict";
import { coDuLieuNguoiDung, coHoSoDeHienThi } from "../src/state/chon";
import { HO_SO_TRONG, TRANG_THAI_BAN_DAU, taoHoSoMau } from "../src/state/mau";
import type { AppState } from "../src/state/store";

const trong = TRANG_THAI_BAN_DAU;
assert.equal(coDuLieuNguoiDung(trong), false, "trạng thái trống");
assert.equal(coHoSoDeHienThi(trong), false);

const voi = (p: Partial<AppState>): AppState => ({ ...trong, ...p });
const voiHoSo = (p: Partial<AppState["hoSo"]>): AppState => voi({ hoSo: { ...HO_SO_TRONG, ...p } });

const cac: [string, AppState][] = [
  ["chỉ điểm Bước 2", voiHoSo({ diem: { ...HO_SO_TRONG.diem, toan: 7 } })],
  ["điểm bằng 0 vẫn là điểm em nhập", voiHoSo({ diem: { ...HO_SO_TRONG.diem, vatLy: 0 } })],
  ["họ tên", voiHoSo({ hoTen: "An" })],
  ["hoàn tất", voiHoSo({ hoanTat: true })],
  ["điểm thi thật", voiHoSo({ diemThiThat: { toan: 8 } })],
  ["điểm mục tiêu từng môn", voiHoSo({ diemMucTieuMon: { toan: 9 } })],
  ["điểm thêm", voiHoSo({ diemThem: { suDia: 7 } as never })],
  ["ưu tiên khu vực", voiHoSo({ uuTienTuyenSinh: { khuVuc: "KV1", doiTuong: null } })],
  ["sở thích", voiHoSo({ soThich: { diem: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 }, top: ["R", "I", "A"], giaTri: [], luc: "2026-01-01T00:00:00Z" } as never })],
  ["mục tiêu", voi({ mucTieu: { luaChonId: "x", phuongThuc: "THPT", maToHop: "A00", toHop: ["toan", "vatLy", "hoaHoc"], diemMucTieu: 25, ngayThi: "2027-06-26" } })],
  ["nguyện vọng", voi({ nguyenVong: ["a"] })],
  ["yêu thích", voi({ yeuThich: ["a"] })],
  ["thi thử", voi({ diemThi: [{ mon: "toan", diem: 7, ngay: "2026-01-01" }] })],
  ["tiết cố định", voi({ coDinh: [{ id: "t" } as never] })],
  ["khối học", voi({ khoiHoc: [{ id: "k" } as never] })],
  ["tình huống", voi({ tinhHuong: [{ id: "h" } as never] })],
  ["lời nhắn", voi({ loiNhan: [{ id: "l" } as never] })],
  ["lịch sử việc", voi({ lichSu: [{ viecId: "v", ten: "x", luc: "2026-01-01T00:00:00Z", trangThai: "xong" }] })],
];
for (const [ten, st] of cac) {
  assert.equal(coDuLieuNguoiDung(st), true, ten);
  assert.equal(coHoSoDeHienThi(st), true, ten);
}

const mau = taoHoSoMau();
assert.equal(coDuLieuNguoiDung(mau), false, "hồ sơ mẫu không phải dữ liệu của em");
assert.equal(coHoSoDeHienThi(mau), true, "nhưng vẫn có gì để hiện");
assert.equal(coDuLieuNguoiDung({ ...mau, loiNhan: [{ id: "l" } as never] }), true, "em thêm lời nhắn vào hồ sơ mẫu");
{
  const { laMau: _l, ...khongMau } = mau.hoSo;
  assert.equal(coDuLieuNguoiDung({ ...mau, hoSo: khongMau }), true, "bỏ cờ mẫu thì là dữ liệu của em");
}
// Hồ sơ mẫu: điểm hồ sơ khớp lần thi thử mới nhất, trạng thái việc khớp lịch sử.
for (const kieu of ["minhAnh", "giaBao"] as const) {
  const m = taoHoSoMau(kieu);
  const moi = Object.fromEntries(m.diemThi.map((d) => [d.mon, d.diem]));
  for (const [mon, d] of Object.entries(m.hoSo.diem)) assert.equal(d, moi[mon], `${kieu}: điểm hồ sơ ${mon} khớp thi thử mới nhất`);
  for (const l of m.lichSu) assert.equal(m.trangThaiViec[l.viecId], l.trangThai, `${kieu}: lịch sử khớp trạng thái việc`);
  assert.ok(m.lichSu.every((l) => m.viec.some((v) => v.id === l.viecId)), `${kieu}: lịch sử chỉ nói về việc có thật`);
}
console.log("co-du-lieu-nguoi-dung: ok");
