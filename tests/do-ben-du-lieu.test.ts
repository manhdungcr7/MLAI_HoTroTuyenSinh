// Kiểm thử độ bền dữ liệu: chuẩn hóa state đọc từ máy, đọc sao lưu hỏng, xếp lại lịch hai lần liền. Chạy: npx tsx tests/do-ben-du-lieu.test.ts
import assert from "node:assert/strict";
import { chuanHoa } from "../src/state/chuan-hoa";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";
import { TRANG_THAI_BAN_DAU, taoHoSoMau } from "../src/state/mau";
import { xepLaiTuan } from "../src/state/xep-lai";
import { thuHaiCuaTuan, isoNgay } from "../src/engine/xep-lich";
import type { ViecCanHoc } from "../src/state/types";

const mau = taoHoSoMau();

// ---- chuanHoa: đầu vào xấu không throw, luôn ra state hợp lệ
for (const xau of [null, undefined, 5, "chuỗi", [], {}, { hoSo: null, nguyenVong: null, cauHinh: null, nhacNho: 3, diemThi: "x" }]) {
  const s = chuanHoa(xau);
  assert.ok(Array.isArray(s.nguyenVong) && Array.isArray(s.viec) && Array.isArray(s.loiNhan));
  assert.equal(s.phienBan, 2);
  assert.equal(typeof s.cauHinh.gioHocToiDaMoiNgay, "number");
  assert.equal(typeof s.nhacNho.truocPhut, "number");
  assert.equal(s.mucTieu, null);
  assert.deepEqual(Object.keys(s.hoSo.diem).sort(), Object.keys(TRANG_THAI_BAN_DAU.hoSo.diem).sort());
}

// Dữ liệu cũ thiếu trường mới: gộp sâu với mặc định
const cu = chuanHoa({ hoSo: { hoTen: "An", diem: { toan: 8 } }, cauHinh: { gioBatDau: "07:00" } });
assert.equal(cu.hoSo.hoTen, "An");
assert.equal(cu.hoSo.diem.toan, 8);
assert.equal(cu.hoSo.diem.vatLy, null);
assert.equal(cu.cauHinh.gioBatDau, "07:00");
assert.equal(cu.cauHinh.gioKetThuc, TRANG_THAI_BAN_DAU.cauHinh.gioKetThuc);
assert.equal(cu.nhacNho.truocPhut, TRANG_THAI_BAN_DAU.nhacNho.truocPhut);

// Điểm NaN/không phải số/ngoài thang bị loại; ngayThi hỏng thì bỏ mục tiêu
const xau = chuanHoa({
  hoSo: { diem: { toan: "9", vatLy: Number.NaN, hoaHoc: 11, sinh: -1, nguVan: 7.5, tiengAnh: null }, diemThem: { lichSu: "x", diaLy: 6 } },
  mucTieu: { ...mau.mucTieu, ngayThi: "2026-13-45" },
  diemThi: [{ mon: "toan", diem: Number.NaN, ngay: "2026-01-01" }, { mon: "toan", diem: 7, ngay: "2026-01-01" }, { mon: "zzz", diem: 5, ngay: "x" }, null],
  nguyenVong: null, cauNoiHomNay: Number.NaN,
});
assert.deepEqual(xau.hoSo.diem, { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: 7.5, tiengAnh: null });
assert.equal(xau.hoSo.diemThem?.lichSu, null);
assert.equal(xau.hoSo.diemThem?.diaLy, 6);
assert.equal(xau.mucTieu, null);
assert.equal(xau.diemThi.length, 1);
assert.deepEqual(xau.nguyenVong, []);
assert.equal(xau.cauNoiHomNay, 0);

// Hồ sơ mẫu đi qua chuẩn hóa không đổi gì (và chạy lặp ra cùng kết quả)
assert.deepEqual(chuanHoa(mau), mau);
assert.deepEqual(chuanHoa(chuanHoa(mau)), chuanHoa(mau));

// Không prototype pollution
chuanHoa(JSON.parse('{"__proto__":{"polluted":1},"trangThaiViec":{"__proto__":"xong","constructor":"xong","a":"xong"},"viec":[{"__proto__":{"polluted":2},"id":"v","tieuDe":"t","mon":"toan","phut":30}]}'));
assert.equal(({} as Record<string, unknown>).polluted, undefined);
const ttv = chuanHoa(JSON.parse('{"trangThaiViec":{"__proto__":"xong","a":"xong","b":"sai"}}')).trangThaiViec;
assert.deepEqual(Object.keys(ttv), ["a"]);

// Lời nhắn hỏng bị loại, quá dài bị cắt, quá 30 bị cắt bớt
const ln = chuanHoa({ loiNhan: [
  { id: "1", tu: "Mẹ", vai: "phuHuynh", noiDung: "x".repeat(5000), luc: "2026-10-01T00:00:00.000Z" },
  { id: "2", tu: "Mẹ", vai: "hacker", noiDung: "x", luc: "2026-10-01T00:00:00.000Z" },
  { id: 3, tu: "Mẹ", vai: "phuHuynh", noiDung: "x", luc: "2026-10-01T00:00:00.000Z" },
  { id: "4", tu: "", vai: "giaoVien", noiDung: "x", luc: "2026-10-01T00:00:00.000Z" },
  "rác", null,
] }).loiNhan;
assert.equal(ln.length, 1);
assert.equal(ln[0].noiDung.length, 600);

// ---- docBanSaoLuu
const tep = (duLieu: unknown, phienBan = 2) => JSON.stringify({ app: "nguyen-vong-ai", phienBan, luc: "2026-10-01T00:00:00.000Z", duLieu });
const ok = docBanSaoLuu(taoBanSaoLuu(mau));
assert.ok(ok.ok);
if (ok.ok) assert.deepEqual(ok.s, mau, "ghi rồi đọc lại phải giống hệt");
assert.equal(docBanSaoLuu(tep({ hoSo: {}, cauHinh: 5 })).ok, false, "cauHinh sai dạng bị từ chối");
assert.equal(docBanSaoLuu(tep({ hoSo: {}, nhacNho: [] })).ok, false);
assert.equal(docBanSaoLuu(tep({ hoSo: {}, trangThaiViec: "x" })).ok, false);
assert.equal(docBanSaoLuu(tep({ hoSo: { diem: "x" } })).ok, false);
assert.equal(docBanSaoLuu(tep({ hoSo: {}, mucTieu: { ...mau.mucTieu, ngayThi: "hôm qua" } })).ok, false, "ngày thi hỏng bị từ chối");
assert.equal(docBanSaoLuu(tep({ hoSo: {}, nguyenVong: null })).ok, false, "mảng bị thay bằng null thì từ chối rõ ràng");
assert.equal(docBanSaoLuu(tep({ hoSo: {} })).ok, true, "tệp cũ thiếu trường mới vẫn đọc được");
const nan = docBanSaoLuu(tep({ hoSo: { diem: { toan: "abc" } }, loiNhan: [{ id: "x" }, { id: "1", tu: "Cô", vai: "giaoVien", noiDung: "Cố lên", luc: "2026-10-01T00:00:00.000Z" }] }));
assert.ok(nan.ok && nan.s.hoSo.diem.toan === null && nan.s.loiNhan.length === 1 && nan.s.cauHinh.gioBatDau === TRANG_THAI_BAN_DAU.cauHinh.gioBatDau);

// ---- xếp lại hai lần liên tiếp không mất cập nhật
const tuan1 = thuHaiCuaTuan(isoNgay(new Date()));
const viec = (id: string, tuan: string): ViecCanHoc => ({ id, tuan, mon: "toan", tieuDe: id, chiTiet: "", phut: 30, mucUuTien: "cao", lyDo: "", tieuChi: [], taiLieu: [] });
const tuan2 = isoNgay(new Date(new Date(`${tuan1}T00:00:00`).getTime() + 7 * 86_400_000));
const goc = { ...TRANG_THAI_BAN_DAU, viec: [viec("a", tuan1), viec("b", tuan2)] };
const a = xepLaiTuan(goc, tuan1);
const b = xepLaiTuan(a.s, tuan2); // xây trên kết quả của lần trước, không phải bản gốc
assert.ok(a.s.khoiHoc.some((k) => k.viecId === "a"), "tuần 1 có việc a");
assert.ok(b.s.khoiHoc.some((k) => k.viecId === "a") && b.s.khoiHoc.some((k) => k.viecId === "b"), "lần hai giữ việc lần một");

// ---- Dữ liệu cũ còn các trường hồ sơ đã bỏ ô nhập: vẫn đọc được, các trường đó không chép sang
const hoSoCu = chuanHoa({ ...mau, hoSo: { ...mau.hoSo, nguonDiem: "thiThu", mucTieuHienTai: "daCoMoUoc", truongMoUoc: "UIT", cachHoc: ["Xem video"], conDuong: "daiHoc", ghiChuChiPhi: "x" } });
for (const k of ["nguonDiem", "mucTieuHienTai", "truongMoUoc", "cachHoc", "conDuong", "ghiChuChiPhi"]) assert.ok(!(k in hoSoCu.hoSo), `bỏ ${k}`);
assert.equal(hoSoCu.hoSo.hoTen, mau.hoSo.hoTen);
assert.ok(docBanSaoLuu(JSON.stringify({ app: "nguyen-vong-ai", phienBan: 2, luc: "", duLieu: { ...mau, hoSo: { ...mau.hoSo, nguonDiem: "hocBa" } } })).ok, "tệp sao lưu cũ vẫn khôi phục được");

console.log("do-ben-du-lieu: OK");
