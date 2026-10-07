// Kiểm thử biên của nhãn nguyện vọng, tổng điểm theo tổ hợp và mục tiêu khi thiếu môn. Chạy: npx tsx tests/nhan-nguyen-vong.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { lyDoKhacPhuongThuc, monThieuCuaToHop, nhanChoLuaChon, nhanNguyenVong } from "../src/engine/phan-tich";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { demNhan, dungDanhSach, ketLuan, xetCoCau } from "../src/features/nguyen-vong/tinh-toan";
import { mucTieuDayDu, mucTieuTuLuaChon } from "../src/state/chon";
import { taoHoSoMau } from "../src/state/mau";
import type { LuaChon, MonKhoi } from "../src/state/types";

const lc = (o: Partial<LuaChon> = {}): LuaChon => ({ ...LUA_CHON.find((l) => l.phuongThuc === "THPT")!, diemMin: 25, diemMax: 25, phuongThuc: "THPT", ...o });
const diem = (o: Partial<Record<MonKhoi, number>>) =>
  ({ toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null, ...o });

// 1) Biên nhãn: chênh = tổng - điểm chuẩn
const nhan = (chenh: number) => nhanNguyenVong(lc(), Math.round((25 + chenh) * 100) / 100);
assert.equal(nhan(-0.01), "Thử sức");
assert.equal(nhan(0), "Vừa sức", "đúng bằng điểm chuẩn là Vừa sức");
assert.equal(nhan(1.49), "Vừa sức");
assert.equal(nhan(1.5), "An toàn");
assert.equal(nhan(3.99), "An toàn");
assert.equal(nhan(4), "Dự phòng");
// số thực lệch 1e-15 không được đẩy sang nhãn khác
assert.equal(nhanNguyenVong(lc({ diemMin: 25.1 }), 26.6), "An toàn", "26,6 - 25,1 = 1,5 (số thực ra 1,5000000000000036)");
assert.equal(nhanNguyenVong(lc({ diemMin: 22.7 }), 22.7), "Vừa sức");

// 2) Không xếp nhãn khi không so được: NaN, null, khác phương thức
assert.equal(nhanChoLuaChon(lc(), NaN), null, "NaN không được thành Dự phòng");
assert.equal(nhanChoLuaChon(lc(), Infinity), null);
assert.equal(nhanChoLuaChon(lc(), null), null);
assert.equal(nhanChoLuaChon(lc(), 26), "Vừa sức");
for (const pt of ["HOC_BA", "DGNL_HCM", "DGTD", "NANG_KHIEU", "KET_HOP"]) {
  assert.equal(nhanChoLuaChon(lc({ phuongThuc: pt }), 29), null, `${pt}: điểm khác thang với điểm thi THPT`);
  assert.match(lyDoKhacPhuongThuc(lc({ phuongThuc: pt }))!, /chưa so được với điểm thi THPT/);
}
assert.equal(lyDoKhacPhuongThuc(lc()), null);
assert.equal(lyDoKhacPhuongThuc(lc({ phuongThuc: undefined })), null, "dữ liệu cũ không ghi phương thức coi là THPT");

// 3) tongChoLuaChon: thiếu một môn thì không tự điền 0; không tổ hợp nào đủ thì suyRa vẫn báo, tong = null
const thieuMotMon = tongChoLuaChon({ toHopXet: ["A00"] }, diem({ toan: 8, vatLy: 7 }));
assert.equal(thieuMotMon.tong, null);
assert.deepEqual(thieuMotMon.thieuMon, ["hoaHoc"]);
const khongToHopNaoDu = tongChoLuaChon({ toHopXet: [] }, diem({ toan: 8, vatLy: 7 }));
assert.equal(khongToHopNaoDu.tong, null);
assert.equal(khongToHopNaoDu.suyRa, true, "đề án chưa ghi tổ hợp: vẫn là nhánh suy ra");
assert.equal(khongToHopNaoDu.toHop, null);
const coSuyRa = tongChoLuaChon({ toHopXet: [] }, diem({ toan: 8, vatLy: 7, tiengAnh: 9 }));
assert.deepEqual([coSuyRa.tong, coSuyRa.toHop, coSuyRa.suyRa], [24, "A01", true]);

// 4) dungDanhSach: tổ hợp, suy ra, lý do không có nhãn
const thpt = LUA_CHON.filter((l) => l.phuongThuc === "THPT");
const coGhiToHop = thpt.find((l) => l.toHopXet?.includes("A00") && l.toHopXet.length === 1)!;
const chuaGhiToHop = thpt.find((l) => !l.toHopXet?.length)!;
const khacPt = LUA_CHON.find((l) => l.phuongThuc === "HOC_BA")!;
const tim = (id: string) => LUA_CHON.find((l) => l.id === id);
const ds = dungDanhSach([coGhiToHop.id, chuaGhiToHop.id, khacPt.id, "khong-ton-tai"], diem({ toan: 8, vatLy: 7, hoaHoc: 6, tiengAnh: 9 }), tim);
assert.equal(ds[0].toHop, "A00"); assert.equal(ds[0].suyRa, false); assert.equal(ds[0].lyDoKhongNhan, null);
assert.equal(ds[1].suyRa, true); assert.equal(ds[1].toHop, "A01", "tổ hợp tốt nhất của em: Toán 8 + Lý 7 + Anh 9");
assert.equal(ds[2].nhan, null); assert.match(ds[2].lyDoKhongNhan!, /phương thức/);
assert.equal(ds[3].lc, undefined); assert.ok(ds[3].lyDoKhongNhan);
const thieuDiem = dungDanhSach([coGhiToHop.id], diem({ toan: 8 }), tim)[0];
assert.equal(thieuDiem.nhan, null); assert.match(thieuDiem.lyDoKhongNhan!, /chưa nhập điểm/i);

// 5) Cơ cấu: còn hàng không nhãn thì không kết luận đỏ
const demMot = demNhan([{ ...ds[0], nhan: "Thử sức" }, ds[2]]);
const coCauMot = xetCoCau(demMot, 2);
assert.equal(coCauMot.chuaDuCanCu, 1);
assert.equal(coCauMot.canThemAnToan, false);
const kl = ketLuan(coCauMot);
assert.notEqual(kl.tone, "do");
assert.match(kl.lyDo!, /chưa đủ căn cứ cho 1 nguyện vọng/i);
const dayDuMotThuSuc = ketLuan(xetCoCau(demNhan([{ ...ds[0], nhan: "Thử sức" }])));
assert.equal(dayDuMotThuSuc.tone, "do", "đủ nhãn mà chỉ có Thử sức thì mới cảnh báo");

// 6) mucTieuDayDu khi thiếu môn: không coi môn thiếu là 0 như số thật
const mau = taoHoSoMau();
const muc = thpt.find((l) => l.toHopXet?.includes("A01") && l.diemMin > 15)!;
const sThieu = { ...mau, diemThi: [], hoSo: { ...mau.hoSo, diem: { ...mau.hoSo.diem, hoaHoc: null, vatLy: null } }, mucTieu: mucTieuTuLuaChon(muc, { ...mau.hoSo.diem, vatLy: null, hoaHoc: null }) };
const m1 = mucTieuDayDu(sThieu)!;
assert.equal(m1.duDiem, false);
assert.ok(m1.monThieu.length > 0, "phải khai báo môn thiếu để màn hình không in số");
const sDu = { ...mau, mucTieu: mucTieuTuLuaChon(muc, mau.hoSo.diem) };
const m2 = mucTieuDayDu(sDu)!;
assert.equal(m2.duDiem, true); assert.deepEqual(m2.monThieu, []);
assert.deepEqual(monThieuCuaToHop({ toan: 5, vatLy: null, hoaHoc: 6, sinh: null, nguVan: null, tiengAnh: null }, ["toan", "vatLy", "hoaHoc"]), ["vatLy"]);

console.log("nhan-nguyen-vong: tất cả kiểm tra đều qua");
