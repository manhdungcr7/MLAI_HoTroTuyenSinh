import assert from "node:assert/strict";
import { BUOI_NANG_PHUT, CACH_GIO_NGU, CAU_HINH_MAC_DINH, KHUNG_BAO_VE_GIO, khungTrongGanNhat, phatHienTrung, phutTuGio, thuCuaNgay, thuHaiCuaTuan, xepLichTuan } from "../src/engine/xep-lich";
import { LICH_CO_DINH_MAU, VIEC_MAU } from "../src/data/lich-mau";

const thuHai = thuHaiCuaTuan("2026-10-07"); // thứ 4
assert.equal(thuHai, "2026-10-05");
assert.equal(thuCuaNgay("2026-10-11"), 7);

// 0) Mặc định không xếp vào Chủ nhật
assert.ok(CAU_HINH_MAC_DINH.ngayNghi.includes(7), "Chủ nhật (7) phải trong ngayNghi mặc định");

const kq = xepLichTuan({ tuanBatDau: thuHai, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: CAU_HINH_MAC_DINH });
assert.ok(kq.khoi.length > 0, "phải xếp được ít nhất một khối");

// 1) Không khối nào trùng tiết cố định hoặc trùng nhau
for (const k of kq.khoi) {
  const thu = thuCuaNgay(k.ngay);
  for (const t of LICH_CO_DINH_MAU.filter((x) => x.thu === thu)) {
    assert.ok(phutTuGio(k.ketThuc) <= phutTuGio(t.batDau) || phutTuGio(k.batDau) >= phutTuGio(t.ketThuc), `${k.ten} trùng ${t.ten}`);
  }
}
const theoNgay = new Map<string, typeof kq.khoi>();
for (const k of kq.khoi) theoNgay.set(k.ngay, [...(theoNgay.get(k.ngay) ?? []), k]);
for (const [ngay, ds] of theoNgay) assert.equal(phatHienTrung(ds).length, 0, `trùng giờ ngày ${ngay}`);

// 2) Không vượt trần giờ học mỗi ngày
for (const [ngay, ds] of theoNgay) {
  const tong = ds.reduce((s, k) => s + phutTuGio(k.ketThuc) - phutTuGio(k.batDau), 0);
  assert.ok(tong <= CAU_HINH_MAC_DINH.gioHocToiDaMoiNgay * 60, `ngày ${ngay} học ${tong} phút`);
}

// 3) Không xếp vào giờ ăn
for (const k of kq.khoi) {
  assert.ok(phutTuGio(k.ketThuc) <= 11 * 60 + 45 || phutTuGio(k.batDau) >= 13 * 60, `${k.ten} đè giờ ăn trưa`);
}

// 4) Mệt thì nhẹ đi
const met = xepLichTuan({ tuanBatDau: thuHai, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: CAU_HINH_MAC_DINH, tamTrang: "met" });
const phutNgay = new Map<string, number>();
for (const k of met.khoi) phutNgay.set(k.ngay, (phutNgay.get(k.ngay) ?? 0) + phutTuGio(k.ketThuc) - phutTuGio(k.batDau));
assert.ok([...phutNgay.values()].every((p) => p <= (CAU_HINH_MAC_DINH.gioHocToiDaMoiNgay * 60) / 2), "ngày mệt chỉ học tối đa một nửa");

// 5) Ngày nghỉ không có khối
const nghiCn = xepLichTuan({ tuanBatDau: thuHai, coDinh: [], viec: VIEC_MAU, cfg: { ...CAU_HINH_MAC_DINH, ngayNghi: [7] } });
assert.ok(nghiCn.khoi.every((k) => thuCuaNgay(k.ngay) !== 7));

// 6) Phát hiện trùng
assert.equal(phatHienTrung([
  { id: "a", ten: "A", batDau: "15:00", ketThuc: "16:00" },
  { id: "b", ten: "B", batDau: "15:30", ketThuc: "17:00" },
  { id: "c", ten: "C", batDau: "17:00", ketThuc: "18:00" },
]).length, 1);

// 7) Không xếp buổi nặng sát giờ ngủ
for (const k of kq.khoi) {
  const dai = phutTuGio(k.ketThuc) - phutTuGio(k.batDau);
  if (dai >= BUOI_NANG_PHUT) assert.ok(phutTuGio(k.ketThuc) <= phutTuGio(CAU_HINH_MAC_DINH.gioKetThuc) - CACH_GIO_NGU, `${k.ten} ${k.ngay} kết thúc ${k.ketThuc} sát giờ ngủ`);
}

// 8) Không đè khung ăn uống, nghỉ ngơi (cả trưa và tối)
for (const k of kq.khoi) for (const b of KHUNG_BAO_VE_GIO) {
  assert.ok(k.ketThuc <= b.batDau || k.batDau >= b.ketThuc, `${k.ten} đè ${b.ten}`);
}

// 9) Có buổi xem trước bài tối hôm trước ngày có tiết
assert.ok(kq.khoi.some((k) => k.viecId === null && k.ten.startsWith("Xem trước bài")), "phải có buổi chuẩn bị bài");
assert.ok(kq.khoi.some((k) => k.ten === "Xem trước bài Văn (sáng mai có tiết)" && thuCuaNgay(k.ngay) === 2), "tối thứ 3 xem trước Văn cho sáng thứ 4");
assert.ok(kq.khoi.some((k) => k.ten === "Xem trước bài Lý (tối mai có tiết)" && thuCuaNgay(k.ngay) === 4), "học thêm buổi tối ghi là tối mai, không phải sáng mai");
// mỗi xem trước bài đều nằm trước tiết thật của ngày hôm sau
for (const k of kq.khoi.filter((x) => x.viecId === null)) assert.ok(LICH_CO_DINH_MAU.some((t) => t.mon === k.mon && t.thu === (thuCuaNgay(k.ngay) % 7) + 1), `${k.ten} không có tiết hôm sau`);

// 10) Mọi việc mẫu đều có chỗ trong một tuần bình thường, và id khối không trùng
assert.equal(kq.chuaXep.length, 0, "tuần mẫu phải xếp đủ việc");
assert.equal(new Set(kq.khoi.map((k) => k.id)).size, kq.khoi.length);

// 11) Id mới không trùng id khối đang giữ lại (khối của việc đã xong vẫn nằm trong tuần)
const giuLai = kq.khoi.slice(0, 3);
const lai = xepLichTuan({ tuanBatDau: thuHai, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU.slice(2), cfg: CAU_HINH_MAC_DINH, khoiDaCo: giuLai });
const ids = [...giuLai, ...lai.khoi].map((k) => k.id);
assert.equal(new Set(ids).size, ids.length, "id khối bị trùng sau khi xếp lại");
// và không trùng giờ với khối giữ lại
for (const k of lai.khoi) {
  const cung = [...giuLai, ...lai.khoi].filter((x) => x.ngay === k.ngay);
  assert.equal(phatHienTrung(cung).length, 0, `xếp lại bị trùng giờ ngày ${k.ngay}`);
}

// 12) tuPhut: ngày đầu không xếp vào giờ đã qua
const tuChieu = xepLichTuan({ tuanBatDau: thuHai, tuNgay: "2026-10-07", tuPhut: 17 * 60, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: CAU_HINH_MAC_DINH });
assert.ok(tuChieu.khoi.every((k) => k.ngay > "2026-10-07" || phutTuGio(k.batDau) >= 17 * 60), "không xếp vào giờ đã qua");
assert.ok(tuChieu.khoi.every((k) => k.ngay >= "2026-10-07"));

// 13) Việc nên làm trước được xếp sớm trong tuần hơn việc nhẹ
const ngayDau = (id: string) => kq.khoi.filter((k) => k.viecId === id).map((k) => k.ngay).sort()[0];
assert.ok(ngayDau("v-toan-ham-so") <= ngayDau("v-van-dan-y"), "việc ưu tiên cao phải làm sớm hơn việc nhẹ");

// 14) Khung trống gần nhất: đủ thời lượng, không trùng tiết cố định, không đè giờ ăn, đúng thứ tự
const goiY = khungTrongGanNhat({ tuNgay: "2026-10-05", tuPhut: 14 * 60, phut: 60, coDinh: LICH_CO_DINH_MAU, cfg: CAU_HINH_MAC_DINH, khoiDaCo: kq.khoi, soKhung: 4 });
assert.equal(goiY.length, 4);
for (const g of goiY) {
  assert.equal(phutTuGio(g.ketThuc) - phutTuGio(g.batDau), 60);
  const thu = thuCuaNgay(g.ngay);
  for (const t of LICH_CO_DINH_MAU.filter((x) => x.thu === thu)) assert.ok(g.ketThuc <= t.batDau || g.batDau >= t.ketThuc, `gợi ý ${g.ngay} ${g.batDau} trùng ${t.ten}`);
  for (const b of KHUNG_BAO_VE_GIO) assert.ok(g.ketThuc <= b.batDau || g.batDau >= b.ketThuc);
  for (const k of kq.khoi.filter((x) => x.ngay === g.ngay)) assert.ok(g.ketThuc <= k.batDau || g.batDau >= k.ketThuc, `gợi ý trùng ${k.ten}`);
}
assert.ok(goiY[0].ngay > "2026-10-05" || phutTuGio(goiY[0].batDau) >= 14 * 60, "gợi ý không được ở giờ đã qua");
const thuTu = goiY.map((g) => g.ngay + g.batDau);
assert.deepEqual(thuTu, [...thuTu].sort(), "gợi ý phải theo thứ tự thời gian");

// 15) Khung trống gần mốc: chọn giờ sát giờ cũ nhất trong ngày (dùng Thứ 2 vì Chủ nhật mặc định là ngày nghỉ)
const ganMoc = khungTrongGanNhat({ tuNgay: "2026-10-05", phut: 60, coDinh: [], cfg: CAU_HINH_MAC_DINH, soKhung: 1, soNgay: 1, ganMoc: 15 * 60 + 2 });
assert.deepEqual(ganMoc, [{ ngay: "2026-10-05", batDau: "15:00", ketThuc: "16:00" }]);
// ngày nghỉ không được gợi ý
assert.equal(khungTrongGanNhat({ tuNgay: "2026-10-11", phut: 30, coDinh: [], cfg: CAU_HINH_MAC_DINH, soNgay: 1 }).length, 0);

console.log("xep-lich: tất cả kiểm tra đều qua");
