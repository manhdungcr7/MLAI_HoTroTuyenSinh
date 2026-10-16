// Kiểm thử thuật toán phân tích điểm nghẽn môn thi và cảnh báo lệch tổ hợp (Issue #04)
// Chạy: npx tsx tests/diem-nghen.test.ts
import assert from "node:assert/strict";
import { phanTichDiemNghen } from "../src/engine/phan-tich";
import { TO_HOP, type MonId } from "../src/state/types";

// 1. Tổ hợp thiếu môn -> trả về null
const diemThieu: Record<MonId, number | null> = {
  toan: 8.5,
  nguVan: null,
  tiengAnh: 7.0,
  vatLy: 8.0,
  hoaHoc: null,
  sinh: null,
};
assert.equal(phanTichDiemNghen(diemThieu, TO_HOP.D01, "D01"), null, "Thiếu môn Ngữ văn trong D01 thì trả về null");

// 2. Tổ hợp cân bằng (các môn xêm xêm nhau, độ lệch < 0.5) -> trả về null
const diemCanBang: Record<MonId, number | null> = {
  toan: 8.0,
  nguVan: 8.2,
  tiengAnh: 8.1,
  vatLy: 8.0,
  hoaHoc: 8.0,
  sinh: 8.0,
};
assert.equal(phanTichDiemNghen(diemCanBang, TO_HOP.D01, "D01"), null, "Độ lệch nhỏ hơn 0.5 thì coi là cân bằng, không có điểm nghẽn");

// 3. Tổ hợp có điểm nghẽn rõ rệt (Toán: 9.0, Lý: 8.5, Anh: 6.0 trong A01)
const diemLech: Record<MonId, number | null> = {
  toan: 9.0,
  vatLy: 8.5,
  tiengAnh: 6.0,
  nguVan: 7.0,
  hoaHoc: 7.0,
  sinh: 7.0,
};
const kqLech = phanTichDiemNghen(diemLech, TO_HOP.A01, "A01");
assert.ok(kqLech !== null, "Phải phát hiện điểm nghẽn");
assert.equal(kqLech?.monNghen, "tiengAnh", "Môn tiếng Anh phải là điểm nghẽn");
assert.equal(kqLech?.diemHienTai, 6.0, "Điểm hiện tại của môn nghẽn là 6.0");
assert.equal(kqLech?.diemTbMonKhac, 8.75, "Điểm TB 2 môn còn lại (Toán 9 + Lý 8.5) / 2 = 8.75");
assert.equal(kqLech?.doLech, 2.75, "Độ lệch là 8.75 - 6.0 = 2.75");
assert.equal(kqLech?.mucTieuGoiY, 7.0, "Mục tiêu gợi ý kéo thêm 1.0 điểm lên 7.0");
assert.ok(kqLech?.thongDiep.includes("Tiếng Anh"), "Thông điệp phải nêu tên môn Tiếng Anh");
assert.ok(kqLech?.thongDiep.includes("A01"), "Thông điệp phải nhắc đến tổ hợp A01");

// 4. Môn đã quá cao (Toán 9.8, Lý 9.8, Hóa 9.6) -> không coi là điểm nghẽn cần kéo vì trần 10 điểm
const diemSatTran: Record<MonId, number | null> = {
  toan: 9.8,
  vatLy: 9.8,
  hoaHoc: 9.6,
  nguVan: null,
  tiengAnh: null,
  sinh: null,
};
assert.equal(phanTichDiemNghen(diemSatTran, TO_HOP.A00, "A00"), null, "Điểm đã sát trần (>9.5) không kích hoạt cảnh báo điểm nghẽn");

console.log("diem-nghen: tất cả kiểm tra đều qua");
