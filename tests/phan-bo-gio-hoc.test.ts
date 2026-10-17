import assert from "node:assert/strict";
import { BUOC_PHUT, loiKetLuanKhaThi, phanBoGioHoc } from "../src/engine/phan-bo-gio-hoc";
import { HO_SO_MON } from "../src/engine/ho-so-mon";
import type { MonId } from "../src/state/types";

const MON: MonId[] = ["toan", "vatLy", "hoaHoc"];
const dv = (diem: Partial<Record<MonId, number | null>>, o: Partial<Parameters<typeof phanBoGioHoc>[0]> = {}) =>
  ({ mon: MON, diem, mucTieuTong: 25, quyPhutTuan: 14 * 60, soNgayConDenThi: 120, ...o });

// 1) Tổng phút chia ra đúng bằng quỹ (bội của 15 phút), không môn nào âm
const r = phanBoGioHoc(dv({ toan: 6, vatLy: 7.5, hoaHoc: 8 }));
assert.equal(r.phanBo.reduce((s, m) => s + m.phutMoiTuan, 0), 14 * 60);
assert.ok(r.phanBo.every((m) => m.phutMoiTuan >= 0 && m.phutMoiTuan % BUOC_PHUT === 0));
assert.equal(r.soTuan, 18);

// 2) Tối ưu: không cách chia ngẫu nhiên nào cho tổng điểm dự kiến cao hơn (hàm lõm, tham lam tối ưu)
const chiaMotMon = (i: number, p: number) => {
  // điểm dự kiến của một môn khi nhận p phút/tuần: chạy phanBoGioHoc với một môn duy nhất
  return phanBoGioHoc({ mon: [MON[i]], diem: { toan: 6, vatLy: 7.5, hoaHoc: 8 }, mucTieuTong: 30, quyPhutTuan: p, soNgayConDenThi: 120 }).phanBo[0].diemDuKien;
};
const tot = r.phanBo.reduce((s, m, i) => s + chiaMotMon(i, m.phutMoiTuan), 0);
let hon = 0;
for (let a = 60; a <= 14 * 60 - 120; a += 15) for (let b = 60; a + b <= 14 * 60 - 60; b += 15) {
  const c = 14 * 60 - a - b;
  if (chiaMotMon(0, a) + chiaMotMon(1, b) + chiaMotMon(2, c) > tot + 0.015) hon++;
}
assert.equal(hon, 0, "không có cách chia nào (bước 15 phút, sàn 60 phút) tốt hơn cách tham lam");

// 3) Môn đã gần 10 điểm không hút giờ; môn thiếu nhiều và dễ tăng được nhiều giờ hơn
const k3 = phanBoGioHoc(dv({ toan: 9.8, vatLy: 6, hoaHoc: 6 }));
const g = (m: MonId) => k3.phanBo.find((x) => x.mon === m)!.phutMoiTuan;
assert.ok(g("toan") < g("vatLy") && g("toan") < g("hoaHoc"));

// 4) Trần theo thời gian: còn ít tuần thì tổng điểm có thể tăng ít hơn
const dai = phanBoGioHoc(dv({ toan: 6, vatLy: 6, hoaHoc: 6 }, { soNgayConDenThi: 180 }));
const ngan = phanBoGioHoc(dv({ toan: 6, vatLy: 6, hoaHoc: 6 }, { soNgayConDenThi: 21 }));
assert.ok(ngan.tongDuKien < dai.tongDuKien, "ít thời gian thì tăng được ít hơn");

// 5) Hồ sơ môn: Văn có trần tăng thấp nhất, Hóa/Sinh cao nhất (giả định đã ghi trong ho-so-mon.ts)
assert.ok(HO_SO_MON.nguVan.tranBonTuan < HO_SO_MON.toan.tranBonTuan && HO_SO_MON.hoaHoc.tranBonTuan > HO_SO_MON.toan.tranBonTuan);
assert.ok(HO_SO_MON.hoaHoc.buoiToiUuPhut < HO_SO_MON.toan.buoiToiUuPhut, "môn ôn nhớ chia buổi ngắn hơn môn giải bài");

// 6) Đã đạt mục tiêu: chia đều, không đòi tăng điểm
const dat = phanBoGioHoc(dv({ toan: 9, vatLy: 9, hoaHoc: 9 }, { mucTieuTong: 24 }));
assert.equal(dat.khaThi, "daDat");
assert.ok(dat.phanBo.every((m) => m.diemCanTang === 0));
assert.ok(Math.max(...dat.phanBo.map((m) => m.phutMoiTuan)) - Math.min(...dat.phanBo.map((m) => m.phutMoiTuan)) <= 2 * BUOC_PHUT);

// 7) Không NaN, quỹ nhỏ, thiếu điểm
const x = phanBoGioHoc(dv({ toan: null }, { quyPhutTuan: 30 }));
assert.ok(x.phanBo.every((m) => Number.isFinite(m.phutMoiTuan) && Number.isFinite(m.diemDuKien)));
assert.equal(x.phanBo.reduce((s, m) => s + m.phutMoiTuan, 0), 30);
assert.ok(x.phanBo[0].chuaCoDiem);
assert.equal(phanBoGioHoc({ ...dv({}), mon: [] }).phanBo.length, 0);

// 8) Câu kết luận luôn là ước lượng
for (const kq of [r, k3, ngan, dat]) assert.ok(loiKetLuanKhaThi(kq).length > 0 && !/chắc chắn/.test(loiKetLuanKhaThi(kq)));

console.log("phan-bo-gio-hoc.test.ts: tất cả kiểm tra đều qua");
