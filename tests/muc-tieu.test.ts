import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử hàm thuần của slice Mục tiêu. Chạy: npx tsx tests/muc-tieu.test.ts
import assert from "node:assert/strict";
import { khoangCachTheoMon } from "../src/engine/phan-tich";
import type { DiemThi, MonId } from "../src/state/types";
import {
  congSucMon, doDocXuHuong, goiYTuanNay, kiemTraDiemMucTieu, kiemTraNgayThi, loaiXuHuong, monChuaCoDiem,
  nguonDiemHienTai, nhanDinhMucTieu, phanLoaiMon, quyDoiSoCau, tinhPhanBoChienLuoc, tongPhanBu,
} from "../src/features/muc-tieu/tinh-toan";

const thi = (mon: MonId, ds: [string, number][]): DiemThi[] => ds.map(([ngay, diem]) => ({ mon, ngay, diem }));

// 1) Xu hướng: lấy 3 lần gần nhất theo ngày, kể cả khi dữ liệu không theo thứ tự
assert.equal(doDocXuHuong([7.2, 7.6, 8.0]), 0.4);
assert.equal(doDocXuHuong([8]), null);
assert.equal(loaiXuHuong(-0.3), "giam");
assert.equal(loaiXuHuong(0), "giu");

// 2) Công sức: cùng điểm thiếu, môn đang tăng đều nhẹ hơn môn đang giảm; sát 10 thì luôn Cao; không thiếu thì Thấp
const tang = congSucMon(0.5, 8, [7.2, 7.6, 8.0]);
const giam = congSucMon(0.5, 8, [8.6, 8.3, 8.0]);
assert.ok(tang.diem < giam.diem, "môn đang tăng phải tốn ít công sức hơn");
assert.equal(tang.muc, "thap");
assert.equal(giam.muc, "vua");
assert.equal(congSucMon(0.6, 9.3, []).muc, "cao");
assert.equal(congSucMon(0, 7, []).muc, "thap");
assert.equal(congSucMon(1.2, 6, []).muc, "cao");

// 3) Phân loại theo hồ sơ mẫu A01: Toán 8.0, Lý 8.5, Anh 8.0, mục tiêu 26, Lý là môn cần cải thiện
const diem: Record<MonId, number | null> = { toan: 8, vatLy: 8.5, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: 8 };
const kc = khoangCachTheoMon(diem, ["toan", "vatLy", "tiengAnh"], 26, ["Vật lý"]);
const diemThi = [
  ...thi("toan", [["2026-09-01", 7.2], ["2026-09-15", 7.6], ["2026-09-29", 8.0]]),
  ...thi("vatLy", [["2026-09-29", 8.5], ["2026-09-01", 8.0], ["2026-09-15", 8.3]]),
  ...thi("tiengAnh", [["2026-09-01", 7.0], ["2026-09-15", 7.5], ["2026-09-29", 8.0]]),
];
const loai = phanLoaiMon(kc, diemThi);
assert.equal(loai[0].mon, "toan", "môn thiếu nhiều nhất (cùng mức thì theo thứ tự tổ hợp) đứng đầu");
assert.equal(loai[0].nhan, "Nên ưu tiên");
assert.equal(loai.filter((m) => m.nhan === "Nên ưu tiên").length >= 1, true);
assert.deepEqual(loai.find((m) => m.mon === "vatLy")!.cacLan, [8.0, 8.3, 8.5]);
assert.equal(tongPhanBu(loai, 1.5).tong, 1.5);

// 4) Môn thiếu dưới 0.25 điểm là Giữ vững
const gan = phanLoaiMon(khoangCachTheoMon({ ...diem, toan: 9.8, vatLy: 9.8, tiengAnh: 6 }, ["toan", "vatLy", "tiengAnh"], 26.5), []);
assert.equal(gan.find((m) => m.mon === "toan")!.nhan, "Giữ vững");
assert.equal(gan[0].mon, "tiengAnh");

// 5) Nhận định: đạt rồi → giọng tích cực; thiếu lệch → "chủ yếu ở môn"; thiếu đều → không nói "chủ yếu"
assert.equal(nhanDinhMucTieu(kc, 0, 26.5, 26, "A01").datRoi, true);
const lech = khoangCachTheoMon({ ...diem, toan: 5, vatLy: 9.5, tiengAnh: 9.5 }, ["toan", "vatLy", "tiengAnh"], 26);
assert.match(nhanDinhMucTieu(lech, 2, 24, 26, "A01").tieuDe, /chủ yếu ở môn Toán/);
assert.doesNotMatch(nhanDinhMucTieu(kc, 1.5, 24.5, 26, "A01").tieuDe, /chủ yếu/);

// 6) Kiểm tra nhập
assert.deepEqual(kiemTraDiemMucTieu("26,55"), { ok: true, gia: 26.6 });
assert.equal(kiemTraDiemMucTieu("31").ok, false);
assert.equal(kiemTraDiemMucTieu("abc").ok, false);
assert.equal(kiemTraDiemMucTieu("").ok, false);
assert.equal(kiemTraDiemMucTieu("0").ok, false);
assert.equal(kiemTraNgayThi("2026-06-26", "2026-10-05").ok, false);
assert.equal(kiemTraNgayThi("2027-06-26", "2026-10-05").ok, true);

// 7) Điểm thiếu, nguồn điểm, gợi ý tuần
assert.deepEqual(monChuaCoDiem(diem, ["toan", "nguVan", "tiengAnh"]), ["nguVan"]);
assert.equal(nguonDiemHienTai(diemThi, ["toan", "vatLy", "tiengAnh"]).loai, "thiThu");
assert.equal(nguonDiemHienTai(diemThi, ["toan", "hoaHoc", "sinh"]).loai, "tronLan");
assert.equal(nguonDiemHienTai([], ["toan"]).loai, "hoSo");
const g = goiYTuanNay([{ mon: "toan", thieu: 1 }, { mon: "vatLy", thieu: 0 }]);
assert.equal(g.length, 3);
assert.ok(g.every((x) => x.mon === "toan"), "chỉ gợi ý môn còn thiếu");

// Chọn nguyện vọng làm mục tiêu: bỏ qua ngành không đặt được, hết thì báo lý do
{
  const { chonNguyenVongLamMucTieu } = await import("../src/state/chon");
  const { LUA_CHON_MAU } = await import("../src/data/lua-chon-mau");
  const { taoHoSoMau } = await import("../src/state/mau");
  const mau = taoHoSoMau();
  const tot = LUA_CHON_MAU.find((l) => (!l.phuongThuc || l.phuongThuc === "THPT") && (!l.toHopXet?.length || l.toHopXet.some((c) => ["A00", "A01", "D01", "B00"].includes(c))))!;
  const hocBa = { ...tot, id: "hb-1", phuongThuc: "hocBa" } as typeof tot;
  const tim = (id: string) => [hocBa, ...LUA_CHON_MAU].find((l) => l.id === id);
  const s = (nv: string[]) => ({ nguyenVong: nv, hoSo: mau.hoSo, diemThi: [] as DiemThi[] });
  const a = chonNguyenVongLamMucTieu(s([tot.id]), tim);
  assert.ok(a.ok && a.mucTieu.luaChonId === tot.id && a.mucTieu.diemMucTieu === tot.diemMin, "NV1 đặt được thì chọn NV1");
  const b = chonNguyenVongLamMucTieu(s(["hb-1", tot.id]), tim);
  assert.ok(b.ok && b.lc.id === tot.id, "NV1 không đặt được thì thử NV kế");
  const c = chonNguyenVongLamMucTieu(s(["hb-1"]), tim);
  assert.ok(!c.ok && c.lyDo.includes("phương thức xét khác"), "hết ngành đặt được thì nêu lý do");
  const d = chonNguyenVongLamMucTieu(s([]), tim);
  assert.ok(!d.ok && d.lyDo.length > 0, "danh sách trống");
}

// 8) Quy đổi số câu trắc nghiệm & chiến lược bù điểm
assert.equal(quyDoiSoCau("toan", 2.4), 12); // 2.4 / 0.2 = 12 câu
assert.equal(quyDoiSoCau("hoaHoc", 4.1), 16); // 4.1 / 0.25 = 16.4 -> 16 câu
assert.equal(quyDoiSoCau("vatLy", 1.6), 6); // 1.6 / 0.25 = 6.4 -> 6 câu
assert.equal(quyDoiSoCau("toan", 0), 0);

const pbCanBang = tinhPhanBoChienLuoc(kc, 3.0, "canBang");
assert.equal(pbCanBang.length, 3);
// Khi chia đều 3.0đ cho 3 môn còn nhiều dư địa, mỗi môn nhận ~1.0đ
assert.ok(pbCanBang.every((x) => Math.abs(x.thieu - 1.0) < 0.2));

const pbSoTruong = tinhPhanBoChienLuoc(kc, 3.0, "soTruong", "toan");
const toanPB = pbSoTruong.find((x) => x.mon === "toan");
assert.ok(toanPB && toanPB.thieu > 1.5, "môn sở trường nhận phần lớn điểm bù");

console.log("muc-tieu: tất cả kiểm thử đều qua.");
