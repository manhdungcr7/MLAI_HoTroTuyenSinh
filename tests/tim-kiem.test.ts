import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { khopTuKhoa, boDau, chuanHoaTuKhoa } from "../src/features/kham-pha/tim-kiem";

console.log("--- Bắt đầu kiểm thử Tìm kiếm thông minh (tim-kiem) ---");

// Test 1: Bỏ dấu tiếng Việt
assert.equal(boDau("Đại Học Công Nghệ"), "dai hoc cong nghe");
assert.equal(boDau("Bách Khoa"), "bach khoa");
assert.equal(boDau("Sư phạm Kỹ thuật"), "su pham ky thuat");
console.log("✓ Test 1: boDau hoạt động chính xác");

// Test 2: Chuẩn hóa từ khóa
assert.equal(chuanHoaTuKhoa("đại học bách khoa"), "đh bách khoa");
assert.equal(chuanHoaTuKhoa("học viện bưu chính"), "hv bưu chính");
assert.equal(chuanHoaTuKhoa("công nghệ thông tin"), "cntt");
console.log("✓ Test 2: chuanHoaTuKhoa hoạt động chính xác");

// Test 3: Tìm kiếm "đại học công nghệ"
const kqDaiHocCongNghe = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "đại học công nghệ"));
assert.ok(kqDaiHocCongNghe.length > 50, `Phải tìm thấy nhiều hơn 50 ngành, thực tế: ${kqDaiHocCongNghe.length}`);
// Phải chứa QSC (ĐH Công nghệ Thông tin) và QHI (ĐH Công nghệ - ĐHQGHN)
assert.ok(kqDaiHocCongNghe.some((l) => l.truong === "QSC"), "Phải có trường ĐH Công nghệ Thông tin (QSC)");
assert.ok(kqDaiHocCongNghe.some((l) => l.truong === "QHI"), "Phải có trường ĐH Công nghệ ĐHQGHN (QHI)");
console.log(`✓ Test 3: "đại học công nghệ" tìm thấy ${kqDaiHocCongNghe.length} ngành (gồm cả QSC, QHI)`);

// Test 4: Tìm kiếm không dấu "dai hoc cong nghe"
const kqKhongDau = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "dai hoc cong nghe"));
assert.ok(kqKhongDau.length > 50, `Tìm kiếm không dấu phải tương đương có dấu: ${kqKhongDau.length}`);
console.log(`✓ Test 4: "dai hoc cong nghe" (không dấu) tìm thấy ${kqKhongDau.length} ngành`);

// Test 5: Tìm theo biệt danh / tên viết tắt trường (UET, UIT, HUST, NEU, FTU...)
const kqUET = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "uet"));
assert.ok(kqUET.length > 0 && kqUET.every((l) => l.truong === "QHI"), "UET phải ra toàn bộ ngành của ĐH Công nghệ - ĐHQGHN");

const kqUIT = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "uit"));
assert.ok(kqUIT.filter((l) => l.truong === "QSC").length >= 13, "UIT phải ra toàn bộ ngành của ĐH Công nghệ Thông tin (QSC)");

const kqHUST = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "hust"));
assert.ok(kqHUST.length > 0 && kqHUST.some((l) => l.truong === "BKA"), "HUST phải ra toàn bộ ngành của ĐH Bách Khoa Hà Nội");

const kqNEU = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "neu"));
assert.ok(kqNEU.length > 0 && kqNEU.some((l) => l.truong === "KHA"), "NEU phải ra toàn bộ ngành của ĐH Kinh tế Quốc dân");
console.log("✓ Test 5: Tìm kiếm theo tên viết tắt (UET, UIT, HUST, NEU) thành công 100%");

// Test 6: Tìm kiếm đa từ (bách khoa cntt)
const kqBkhnCntt = LUA_CHON_MAU.filter((l) => khopTuKhoa(l, "bách khoa cntt"));
assert.ok(kqBkhnCntt.length > 0, "Phải tìm thấy ngành CNTT tại các trường Bách Khoa");
console.log(`✓ Test 6: Tìm kiếm tổ hợp "bách khoa cntt" tìm thấy ${kqBkhnCntt.length} ngành`);

console.log("🎉 TẤT CẢ KIỂM THỬ TÌM KIẾM THÔNG MINH ĐỀU ĐẠT 100%!");
