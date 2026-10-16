// Kiểm thử các hàm định dạng số và điểm số thuần Việt.
// Chạy: npx tsx tests/dinh-dang.test.ts
import assert from "node:assert/strict";
import { dinhDang, dinhDangDiem, dinhDangSo } from "../src/engine/dinh-dang";

// ---------- 1) Định dạng số thông thường (dinhDang) ----------
assert.equal(dinhDang(24.5, 1), "24,5", "Đổi dấu chấm sang phẩy");
assert.equal(dinhDang(24, 1), "24,0", "Giữ đúng số chữ số thập phân");
assert.equal(dinhDang(24.125, 2), "24,13", "Làm tròn chuẩn số thập phân");
assert.equal(dinhDang(null), "—", "Fallback mặc định là gạch ngang dài");
assert.equal(dinhDang(undefined), "—");
assert.equal(dinhDang(NaN), "—");
assert.equal(dinhDang(Infinity), "—");
assert.equal(dinhDang(null, 1, "Chưa có"), "Chưa có", "Fallback tùy chỉnh");

// ---------- 2) Định dạng điểm (dinhDangDiem) ----------
// 24.50 -> 24,5 (bỏ số 0 thừa ở đuôi)
assert.equal(dinhDangDiem(24.5), "24,5", "Bỏ số 0 thừa");
assert.equal(dinhDangDiem(24.0), "24", "Điểm chẵn không hiển thị phần thập phân");
assert.equal(dinhDangDiem(24.75), "24,75", "Giữ 2 chữ số lẻ nếu có nghĩa");
assert.equal(dinhDangDiem(24.2), "24,2");
assert.equal(dinhDangDiem(0), "0");
assert.equal(dinhDangDiem(null), "—");
assert.equal(dinhDangDiem(undefined), "—");

console.log("dinh-dang: tất cả kiểm tra đều qua");

// ---------- 3) Số nguyên có dấu chấm hàng nghìn (dinhDangSo) ----------
assert.equal(dinhDangSo(3652), "3.652", "Số bốn chữ số có một dấu chấm");
assert.equal(dinhDangSo(999), "999", "Dưới một nghìn không có dấu chấm");
assert.equal(dinhDangSo(1234567), "1.234.567", "Nhiều nhóm nghìn");
assert.equal(dinhDangSo(null), "—", "Thiếu thì trả về nội dung dự phòng");
