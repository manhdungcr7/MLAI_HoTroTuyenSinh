// Kiểm thử logic cơ cấu, nhãn và lời nhận xét nguyện vọng.
// Chạy: npx tsx tests/nguyen-vong.test.ts
import assert from "node:assert/strict";
import {
  xetCoCau, ketLuan, moTaSoLuong, dungDanhSach, demNhan,
} from "../src/features/nguyen-vong/tinh-toan";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import type { DiemDayDu, NhanNguyenVong } from "../src/state/types";

// ---------- 1) Mô tả số lượng (moTaSoLuong) ----------
const demMau: Record<NhanNguyenVong, number> = {
  "Thử sức": 2,
  "Vừa sức": 1,
  "An toàn": 1,
  "Dự phòng": 1,
};
const moTa = moTaSoLuong(demMau);
assert.equal(moTa, "2 nguyện vọng thử sức, 1 vừa sức, 1 an toàn và 1 dự phòng");

const demMot: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 0,
  "An toàn": 0,
  "Dự phòng": 0,
};
assert.equal(moTaSoLuong(demMot), "1 nguyện vọng thử sức");

// ---------- 2) Xét cơ cấu và kết luận (xetCoCau & ketLuan) ----------

// Trường hợp 1: Danh sách toàn Thử sức, không có An toàn hay Dự phòng
const demToanThuSuc: Record<NhanNguyenVong, number> = {
  "Thử sức": 3,
  "Vừa sức": 0,
  "An toàn": 0,
  "Dự phòng": 0,
};
const ccNguyHiem = xetCoCau(demToanThuSuc, 3);
assert.equal(ccNguyHiem.chacChan, 0);
assert.equal(ccNguyHiem.canThemAnToan, true);
const klNguyHiem = ketLuan(ccNguyHiem);
assert.equal(klNguyHiem.tone, "do", "Không có an toàn phải cảnh báo đỏ");
assert.equal(klNguyHiem.tieuDe, "Chưa có nguyện vọng điểm chuẩn thấp hơn điểm em");
assert.equal(klNguyHiem.onDinh, false);

// Trường hợp 2: Tỉ lệ Thử sức quá nhiều (>50%) dù có 1 An toàn
const demThuSucQuaNhieu: Record<NhanNguyenVong, number> = {
  "Thử sức": 3,
  "Vừa sức": 1,
  "An toàn": 1,
  "Dự phòng": 0,
};
const ccNhieuThuSuc = xetCoCau(demThuSucQuaNhieu, 5);
assert.equal(ccNhieuThuSuc.thuSucNhieu, true);
const klNhieuThuSuc = ketLuan(ccNhieuThuSuc);
assert.equal(klNhieuThuSuc.tone, "cam");
assert.equal(klNhieuThuSuc.tieuDe, "Thử sức đang hơi nhiều");

// Trường hợp 3: Thiếu nguyện vọng Vừa sức
const demThieuVuaSuc: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 0,
  "An toàn": 2,
  "Dự phòng": 1,
};
const ccThieuVuaSuc = xetCoCau(demThieuVuaSuc, 4);
assert.equal(ccThieuVuaSuc.thieuVuaSuc, true);
const klThieuVuaSuc = ketLuan(ccThieuVuaSuc);
assert.equal(klThieuVuaSuc.tone, "cam");
assert.equal(klThieuVuaSuc.tieuDe, "Chưa có nguyện vọng vừa sức");

// Trường hợp 4: Danh sách cân bằng chuẩn (1 Thử sức, 2 Vừa sức, 1 An toàn, 1 Dự phòng)
const demCanBang: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 2,
  "An toàn": 1,
  "Dự phòng": 1,
};
const ccCanBang = xetCoCau(demCanBang, 5);
assert.equal(ccCanBang.canThemAnToan, false);
assert.equal(ccCanBang.thuSucNhieu, false);
assert.equal(ccCanBang.thieuVuaSuc, false);
const klCanBang = ketLuan(ccCanBang);
assert.equal(klCanBang.tone, "luc", "Cân bằng đạt chuẩn ra tone lục");
assert.equal(klCanBang.onDinh, true);
assert.equal(klCanBang.tieuDe, "Cơ cấu danh sách đủ các nhóm");

// Trường hợp 5: Có nguyện vọng chưa đủ căn cứ
const ccChuaDu = xetCoCau({ "Thử sức": 1, "Vừa sức": 1, "An toàn": 0, "Dự phòng": 0 }, 4); // 2 hàng thiếu dữ liệu
assert.equal(ccChuaDu.chuaDuCanCu, 2);
const klChuaDu = ketLuan(ccChuaDu);
assert.equal(klChuaDu.tone, "muc");
assert.equal(klChuaDu.tieuDe, "Chưa đủ căn cứ để nhận xét cả danh sách");

// ---------- 3) Dựng danh sách nguyện vọng (dungDanhSach) ----------
const diemEm: DiemDayDu = {
  toan: 8.5, vatLy: 8.0, hoaHoc: 8.5, sinh: null, nguVan: null, tiengAnh: 8.0,
  lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null,
};
const dsId = [LUA_CHON_MAU[0].id, LUA_CHON_MAU[1].id];
const dsDong = dungDanhSach(dsId, diemEm, (id) => LUA_CHON_MAU.find((l) => l.id === id));
assert.equal(dsDong.length, 2);
assert.equal(dsDong[0].viTri, 0);
assert.equal(dsDong[1].viTri, 1);
assert.ok(dsDong[0].nhan !== null, "Có đủ điểm tổ hợp nên phải có nhãn");

// Đếm nhãn từ danh sách dòng
const ketQuaDem = demNhan(dsDong);
assert.equal(typeof ketQuaDem["Thử sức"], "number");
assert.equal(typeof ketQuaDem["Vừa sức"], "number");
assert.equal(typeof ketQuaDem["An toàn"], "number");
assert.equal(typeof ketQuaDem["Dự phòng"], "number");

console.log("nguyen-vong: tất cả kiểm tra đều qua");
