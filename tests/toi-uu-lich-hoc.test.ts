import assert from "node:assert/strict";
import { toiUuPhanBoLichHoc } from "../src/engine/toi-uu-lich-hoc";
import type { DiemDayDu } from "../src/state/types";

const diemEm: DiemDayDu = {
  toan: 8.0,
  vatLy: 7.5,
  hoaHoc: 6.5, // Tổng 22.0
  sinh: null,
  nguVan: null,
  tiengAnh: null,
  lichSu: null,
  diaLy: null,
  gdktpl: null,
  tinHoc: null,
  congNghe: null,
};

// Mục tiêu NV1 cần 25.0 điểm (Gap = 3.0 điểm)
const keHoach = toiUuPhanBoLichHoc(["toan", "vatLy", "hoaHoc"], diemEm, 25.0, 0, 15);

assert.equal(keHoach.tongGioTuan, 15);
assert.equal(keHoach.khoangCachGap, 3.0);
assert.equal(keHoach.phanBoTungMon.length, 3);

// Kiểm tra tính chất lợi suất giảm dần:
// Môn Hóa học (6.5) có tiềm năng tăng lớn hơn và độ khó cận biên thấp hơn môn Toán (8.0),
// nên theo thuật toán knapsack liên tục, Hóa phải được giao tăng điểm nhiều hơn hoặc bằng Toán.
const monHoa = keHoach.phanBoTungMon.find((m) => m.mon === "hoaHoc")!;
const monToan = keHoach.phanBoTungMon.find((m) => m.mon === "toan")!;

assert.ok(monHoa.diemCanTang >= monToan.diemCanTang, "môn có tiềm năng cao hơn phải được giao tăng điểm lớn hơn");
assert.ok(monHoa.doKhoCanBien < monToan.doKhoCanBien, "độ khó của môn 6.5 phải thấp hơn môn 8.0");

// Kiểm tra lịch 7 ngày
assert.equal(keHoach.lichTuan.length, 14); // 7 ngày * 2 ca
const buoiT2 = keHoach.lichTuan.filter((b) => b.thu === "T2");
assert.equal(buoiT2.length, 2);

console.log("toi-uu-lich-hoc.test.ts: tất cả kiểm tra đều qua");

