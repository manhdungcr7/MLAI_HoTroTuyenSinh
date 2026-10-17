import assert from "node:assert/strict";
import { toiUuPhanBoLichHoc } from "../src/engine/toi-uu-lich-hoc";
import type { DiemDayDu, MonId } from "../src/state/types";

const diem = (o: Partial<Record<MonId, number | null>>): DiemDayDu => ({
  toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null, ...o,
} as DiemDayDu);
const A00: MonId[] = ["toan", "vatLy", "hoaHoc"];
const gio = (k: ReturnType<typeof toiUuPhanBoLichHoc>, m: MonId) => k.phanBoTungMon.find((x) => x.mon === m)!;

// 1) Cơ bản: tổng 22, mục tiêu 25 (thiếu 3), quỹ 15 giờ
const em = diem({ toan: 8.0, vatLy: 7.5, hoaHoc: 6.5 });
const k = toiUuPhanBoLichHoc(A00, em, 25.0, 0, 15);
assert.equal(k.tongGioTuan, 15);
assert.equal(k.khoangCachGap, 3.0);
assert.equal(k.phanBoTungMon.length, 3);
assert.ok(Math.abs(k.phanBoTungMon.reduce((s, m) => s + m.soGioMoiTuan, 0) - 15) < 0.3, "tổng giờ chia ra bằng quỹ giờ");
assert.ok(gio(k, "hoaHoc").soGioMoiTuan >= gio(k, "toan").soGioMoiTuan, "môn thấp điểm hơn, tăng dễ hơn thì được nhiều giờ hơn hoặc bằng");
assert.ok(gio(k, "hoaHoc").diemMoiGioDau > 0, "mỗi môn có hiệu quả giờ đầu để giải thích");

// 2) Lịch tuần dùng đúng số giờ đã chia (trước đây cố định 24,5 giờ bất kể quỹ)
const tongPhutLich = k.lichTuan.reduce((s, b) => s + b.thoiLuongPhut, 0);
assert.ok(Math.abs(tongPhutLich / 60 - 15) <= 1.5, `lịch tuần ~ quỹ giờ (${tongPhutLich / 60}h)`);
assert.ok(k.lichTuan.every((b) => b.thoiLuongPhut >= 15 && b.thoiLuongPhut <= 120));
const nho = toiUuPhanBoLichHoc(A00, em, 25.0, 0, 6);
assert.ok(nho.lichTuan.reduce((s, b) => s + b.thoiLuongPhut, 0) < tongPhutLich, "quỹ giờ nhỏ hơn thì lịch ít hơn");

// 3) Cá nhân hoá: cùng tổng điểm, yếu Toán khác yếu Hóa
const yeuToan = toiUuPhanBoLichHoc(A00, diem({ toan: 5.5, vatLy: 8.0, hoaHoc: 8.5 }), 25.0, 0, 15, { soNgayConDenThi: 120 });
const yeuHoa = toiUuPhanBoLichHoc(A00, diem({ toan: 8.5, vatLy: 8.0, hoaHoc: 5.5 }), 25.0, 0, 15, { soNgayConDenThi: 120 });
assert.ok(gio(yeuToan, "toan").soGioMoiTuan > gio(yeuToan, "hoaHoc").soGioMoiTuan, "yếu Toán thì Toán nhiều giờ nhất");
assert.ok(gio(yeuHoa, "hoaHoc").soGioMoiTuan > gio(yeuHoa, "toan").soGioMoiTuan, "yếu Hóa thì Hóa nhiều giờ nhất");
const soBuoi = (kq: typeof k, m: MonId) => kq.lichTuan.filter((b) => b.mon === m).length;
const doDaiTb = (kq: typeof k, m: MonId) => { const b = kq.lichTuan.filter((x) => x.mon === m); return b.reduce((s, x) => s + x.thoiLuongPhut, 0) / b.length; };
// Hóa là môn ôn nhớ: buổi ngắn hơn và nhiều buổi hơn Toán khi cùng được nhiều giờ nhất
assert.ok(soBuoi(yeuHoa, "hoaHoc") >= soBuoi(yeuToan, "toan"), "Hóa chia nhiều buổi hơn hoặc bằng Toán");
assert.ok(doDaiTb(yeuHoa, "hoaHoc") <= doDaiTb(yeuToan, "toan"), "buổi Hóa ngắn hơn hoặc bằng buổi Toán");
assert.notDeepEqual(yeuToan.lichTuan.map((b) => `${b.thu}${b.mon}${b.thoiLuongPhut}`), yeuHoa.lichTuan.map((b) => `${b.thu}${b.mon}${b.thoiLuongPhut}`), "hai học sinh khác nhau có lịch khác nhau");

// 4) Văn và Anh không còn nói "bấm máy tính"
const toHopD01: MonId[] = ["toan", "nguVan", "tiengAnh"];
const d01 = toiUuPhanBoLichHoc(toHopD01, diem({ toan: 7.5, nguVan: 7.5, tiengAnh: 7.5 }), 25.0, 0, 15);
for (const m of d01.phanBoTungMon.filter((x) => x.mon !== "toan")) assert.ok(!/máy tính/i.test(m.trongTamOnTap), `${m.tenMon} không có "bấm máy tính"`);
assert.ok(d01.lichTuan.filter((b) => b.mon === "nguVan").every((b) => /viết/i.test(b.noiDung)), "buổi Văn là viết bài");
assert.ok(d01.lichTuan.filter((b) => b.mon === "tiengAnh").every((b) => /từ vựng/i.test(b.noiDung)), "buổi Anh có từ vựng");

// 5) Kiểm khả thi nói thật
const du = toiUuPhanBoLichHoc(A00, diem({ toan: 8.5, vatLy: 8.0, hoaHoc: 8.0 }), 25.0, 0, 15, { soNgayConDenThi: 120 }); // thiếu 0,5
assert.ok(du.khaThi === "du" || du.khaThi === "daDat", `gần đủ điểm thì khả thi (${du.khaThi})`);
const xa = toiUuPhanBoLichHoc(A00, diem({ toan: 5, vatLy: 5, hoaHoc: 5 }), 28.0, 0, 6, { soNgayConDenThi: 28 }); // thiếu 13 trong 4 tuần
assert.equal(xa.khaThi, "khong", "thiếu quá nhiều trong thời gian ngắn thì phải nói không khả thi");
assert.ok(/ước lượng/i.test(xa.loiKetLuan) && !/chắc chắn/i.test(xa.loiKetLuan), "kết luận là ước lượng, không hứa chắc");
const them = toiUuPhanBoLichHoc(A00, diem({ toan: 7, vatLy: 7, hoaHoc: 7 }), 24.0, 0, 3, { soNgayConDenThi: 150 }); // thiếu 3, chỉ 3 giờ/tuần
if (them.khaThi === "gan" || them.khaThi === "khong") assert.ok(them.gioCanThemMoiTuan === null || them.gioCanThemMoiTuan > 0);
// Thêm giờ thì tổng điểm dự kiến không giảm
const tongDuKien = (q: number) => toiUuPhanBoLichHoc(A00, em, 25.0, 0, q, { soNgayConDenThi: 90 }).phanBoTungMon.reduce((s, m) => s + m.diemCanTang, 0);
assert.ok(tongDuKien(20) >= tongDuKien(10) - 0.05, "thêm giờ không làm giảm điểm dự kiến");

// 6) Điểm thi thử đang giảm: môn đó không bị bớt giờ
const giam = toiUuPhanBoLichHoc(A00, em, 25.0, 0, 15, { soNgayConDenThi: 90, doDoc: { vatLy: -0.5 } });
assert.ok(gio(giam, "vatLy").soGioMoiTuan >= gio(toiUuPhanBoLichHoc(A00, em, 25.0, 0, 15, { soNgayConDenThi: 90 }), "vatLy").soGioMoiTuan, "môn đang giảm không ít giờ hơn");

// 7) Biên
const rong = toiUuPhanBoLichHoc([], em, 25.0);
assert.equal(rong.phanBoTungMon.length, 0);
assert.equal(rong.lichTuan.length, 0);
assert.ok(rong.loiKhuyenChienLuoc.length > 0);
const vuot = toiUuPhanBoLichHoc(A00, em, 20.0);
assert.equal(vuot.khoangCachGap, 0);
assert.equal(vuot.khaThi, "daDat");
assert.ok(vuot.loiKhuyenChienLuoc.some((x) => x.includes("đạt mốc điểm chuẩn kỳ vọng")));
for (const m of vuot.phanBoTungMon) assert.equal(m.diemCanTang, 0, "không cần tăng điểm khi gap = 0");
const khongDiem = toiUuPhanBoLichHoc(A00, diem({ toan: 7 }), 25.0, 0, 12);
assert.ok(khongDiem.phanBoTungMon.every((m) => Number.isFinite(m.soGioMoiTuan)), "thiếu điểm vẫn không ra NaN");
const quyZero = toiUuPhanBoLichHoc(A00, em, 25.0, 0, 0);
assert.ok(quyZero.phanBoTungMon.every((m) => m.soGioMoiTuan === 0) && quyZero.lichTuan.length === 0, "không có giờ thì không có lịch");

console.log("toi-uu-lich-hoc.test.ts: tất cả kiểm tra đều qua");
