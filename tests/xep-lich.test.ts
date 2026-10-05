import assert from "node:assert/strict";
import { CAU_HINH_MAC_DINH, phatHienTrung, phutTuGio, thuCuaNgay, thuHaiCuaTuan, xepLichTuan } from "../src/engine/xep-lich";
import { LICH_CO_DINH_MAU, VIEC_MAU } from "../src/data/lich-mau";

const thuHai = thuHaiCuaTuan("2026-10-07"); // thứ 4
assert.equal(thuHai, "2026-10-05");
assert.equal(thuCuaNgay("2026-10-11"), 7);

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

console.log("xep-lich: tất cả kiểm tra đều qua");
