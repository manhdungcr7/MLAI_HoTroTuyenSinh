import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Bản đồ cơ hội + Phòng thử điểm: đếm 4 nhãn, loại điểm sàn/phương thức khác/thiếu điểm, +điểm không làm nhãn thấp đi, khớp tomTatDiemChoNganh,
// và đo thời gian thật. Chạy: npx tsx tests/ban-do-co-hoi.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { BAC_NHAN, congDiemMon, demNganhTheoNhan, doNhayTheoMon, soSanhHaiDiem, THU_TU_NHAN } from "../src/engine/ban-do-co-hoi";
import { namTuyenSinhToi, thongKeBienDong } from "../src/engine/du-bao-diem-chuan";
import { tomTatDiemChoNganh } from "../src/engine/tom-tat-nganh";
import { diemDayDu } from "../src/features/kham-pha/to-hop";
import { taoHoSoMau } from "../src/state/mau";
import type { DiemDayDu, LuaChon } from "../src/state/types";

const NAM = namTuyenSinhToi();
const goc = LUA_CHON.find((l) => l.phuongThuc === "THPT")!;
const fake = (id: string, o: Partial<LuaChon> & { diem?: number }): LuaChon => {
  const { diem, ...rest } = o;
  const diemTheoNam = diem === undefined ? {} : { "2025": diem, "2024": diem };
  return { ...goc, id, maTruong: "FAK", truong: "FAK", nhomNganh: "Thử", phuongThuc: "THPT", toHopXet: ["A00"], nguonCap: "official_pdf", maTheoNam: undefined,
    diemMin: diem ?? 0, diemMax: diem ?? 0, namDiem: diem === undefined ? 0 : 2025, ...rest, diemTheoNam } as LuaChon;
};
const D = (toan: number | null, ly: number | null, hoa: number | null): DiemDayDu =>
  ({ toan, vatLy: ly, hoaHoc: hoa, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null });

// Em 8 + 8 + 8 = 24 điểm tổ hợp A00.
const em = D(8, 8, 8);
const ds = [
  fake("thu", { diem: 25 }),       // 24 - 25 < 0 → Thử sức
  fake("vua", { diem: 23 }),       // +1 → Vừa sức
  fake("an", { diem: 21 }),        // +3 → An toàn
  fake("dp", { diem: 18 }),        // +6 → Dự phòng
  fake("san", { diem: 15, scoreEvidence: Object.fromEntries(["2024", "2025"].map((nam) => [nam, {
    kind: "diem_san" as const, score: 15, scale: 30, sourceUrl: "https://fixture.edu.vn/diem-san",
    checkedAt: "2026-10-17", checkedBy: "test fixture", independentReviewer: null, includesPriority: null,
  }])) }), // có bằng chứng điểm sàn: không so
  fake("hb", { diem: 20, phuongThuc: "HOC_BA" }),
  fake("khongdiem", {}),
  fake("nk", { diem: 20, toHopXet: ["V00"] }), // tổ hợp năng khiếu, chưa tính được
];

// 1. Đếm nhãn và lý do.
const d = demNganhTheoNhan(ds, em, undefined, NAM);
assert.deepEqual(d.theoNhan, { "Thử sức": 1, "Vừa sức": 1, "An toàn": 1, "Dự phòng": 1 });
assert.equal(d.soSoDuoc, 4);
assert.equal(d.chuaSo.diemSan, 1);
assert.equal(d.chuaSo.phuongThucKhac, 1);
assert.equal(d.chuaSo.chuaCoDiemChuan, 1);
assert.equal(d.chuaSo.toHopChuaTinh, 1);
assert.equal(d.tongChuaSo + d.soSoDuoc, d.tong, "mọi ngành đều được tính đúng một lần");
assert.equal(d.theoNhom.reduce((s, g) => s + g.tong, 0), d.soSoDuoc);

// 2. Thiếu điểm môn: không điền 0, đếm riêng.
const thieu = demNganhTheoNhan(ds, D(8, 8, null), undefined, NAM);
assert.equal(thieu.soSoDuoc, 0);
assert.equal(thieu.chuaSo.thieuDiemMon, 4);
assert.equal(demNganhTheoNhan(ds, D(null, null, null), undefined, NAM).soSoDuoc, 0);

// 3. Độ nhạy: Toán +1 → "thu" (25) vẫn thử (25 > 25? 8+8+8+1=25: bằng điểm chuẩn → Vừa sức) mở ra; "vua" 23: 25-23=2 → An toàn.
const dn = doNhayTheoMon(ds, em, undefined, NAM, 1);
assert.equal(dn.toHop, "A00");
assert.equal(dn.theoMon.length, 3);
const toan = dn.theoMon.find((m) => m.mon === "toan")!;
assert.equal(toan.moRa, 1, "chỉ ngành 'thu' được mở ra");
assert.equal(toan.doiNhan, 3, "thu→Vừa, vua→An toàn (chênh 2), an→Dự phòng? 25-21=4 → Dự phòng");
assert.equal(doNhayTheoMon(ds, D(8, 8, null), undefined, NAM).theoMon.length, 0, "chưa có tổ hợp đủ điểm: không có môn nào để thử");
// Môn đã 10 điểm: cộng thêm không đổi, và bị kẹp ở 10.
assert.equal(congDiemMon(D(9.9, 8, 8), "toan", 1).toan, 10);
assert.equal(congDiemMon(D(null, 8, 8), "toan", 1).toan, null, "môn thiếu điểm giữ null, không điền");
assert.equal(doNhayTheoMon(ds, D(10, 8, 8), undefined, NAM).theoMon.find((m) => m.mon === "toan")!.daToiDa, true);

// 4. So hai điểm.
const ss = soSanhHaiDiem(ds, em, congDiemMon(em, "toan", 1), NAM);
assert.equal(ss.len, 3); assert.equal(ss.xuong, 0);
assert.ok(ss.noiBat.length <= 5);
const giam = soSanhHaiDiem(ds, em, congDiemMon(em, "toan", -2), NAM);
assert.ok(giam.xuong >= 1 && giam.len === 0);

// 5. Dữ liệu thật: hồ sơ mẫu. +điểm không bao giờ làm nhãn thấp đi; nhãn khớp tomTatDiemChoNganh; đo thời gian.
const app = taoHoSoMau();
const diem = diemDayDu(app);
const tk = thongKeBienDong(LUA_CHON);
const t0 = performance.now();
const that = demNganhTheoNhan(LUA_CHON, diem, tk, NAM);
const msLanDau = performance.now() - t0;
const t1 = performance.now();
const that2 = demNganhTheoNhan(LUA_CHON, diem, tk, NAM);
const msLanSau = performance.now() - t1;
assert.deepEqual(that, that2);
assert.equal(that.soSoDuoc + that.tongChuaSo, LUA_CHON.length);

// đối chiếu với tomTatDiemChoNganh trên toàn bộ danh mục
const kiem = { "Thử sức": 0, "Vừa sức": 0, "An toàn": 0, "Dự phòng": 0 };
for (const lc of LUA_CHON) { const n = tomTatDiemChoNganh(lc, diem, tk, NAM).nhan; if (n) kiem[n]++; }
assert.deepEqual(kiem, that.theoNhan, "đếm nhãn phải khớp tomTatDiemChoNganh (một nguồn sự thật)");

for (const buoc of [0.25, 1, 2]) {
  const dn2 = doNhayTheoMon(LUA_CHON, diem, tk, NAM, buoc);
  for (const m of dn2.theoMon) {
    assert.ok(m.doiNhan >= m.moRa && m.doiNhan >= 0);
    const moi = congDiemMon(diem, m.mon, buoc);
    const r = soSanhHaiDiem(LUA_CHON, diem, moi, NAM);
    assert.equal(r.xuong, 0, `+${buoc} điểm ${m.ten} không được làm nhãn thấp đi`);
    assert.equal(r.len, m.doiNhan);
  }
}
const ngau = soSanhHaiDiem(LUA_CHON, diem, congDiemMon(congDiemMon(diem, "toan", 2), "vatLy", 1), NAM);
assert.equal(ngau.xuong, 0);
const t2 = performance.now();
const dnTime = doNhayTheoMon(LUA_CHON, diem, tk, NAM, 1);
const msDoNhay = performance.now() - t2;
const t3 = performance.now();
soSanhHaiDiem(LUA_CHON, diem, congDiemMon(diem, "toan", 1), NAM);
const msSoSanh = performance.now() - t3;
for (const n of THU_TU_NHAN) assert.ok(BAC_NHAN[n] >= 0);

console.log(`Hồ sơ mẫu: ${LUA_CHON.length} ngành, so được ${that.soSoDuoc}, chưa so ${that.tongChuaSo}`, that.theoNhan, that.chuaSo);
console.log(`Đo thời gian: đếm lần đầu (gồm chuẩn bị) ${msLanDau.toFixed(0)} ms, đếm lại ${msLanSau.toFixed(0)} ms, độ nhạy ${dnTime.theoMon.length} môn ${msDoNhay.toFixed(0)} ms, so hai điểm ${msSoSanh.toFixed(0)} ms`);
console.log("ban-do-co-hoi: OK");
