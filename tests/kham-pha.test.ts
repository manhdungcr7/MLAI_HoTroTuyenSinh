// Kiểm thử hàm thuần của slice Khám phá (phù hợp, bộ lọc, khu vực).
// Chạy: npx tsx tests/kham-pha.test.ts
import assert from "node:assert/strict";
import { cungNoi, loc, dem, BO_LOC_MAC_DINH, type BoLoc } from "../src/features/kham-pha/bo-loc";
import { danhGia, dungKhuVuc, type BoiCanh } from "../src/features/kham-pha/phu-hop";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import type { LuaChon } from "../src/state/types";

// ---------- 1) So khớp địa danh (cungNoi) ----------
assert.equal(cungNoi("TP. Hồ Chí Minh", "TP.HCM"), true, "TP. Hồ Chí Minh khớp với TP.HCM");
assert.equal(cungNoi("TP.HCM", "TP. Hồ Chí Minh"), true, "Đối xứng hai chiều");
assert.equal(cungNoi("Hà Nội", "Hà Nội"), true);
assert.equal(cungNoi("Hà Nội", "TP.HCM"), false);

// ---------- 2) Ưu tiên khu vực (dungKhuVuc) ----------
const lcHCM: LuaChon = { ...LUA_CHON_MAU[0], khuVuc: "TP.HCM" };
const lcHN: LuaChon = { ...LUA_CHON_MAU[0], khuVuc: "Hà Nội" };
const lcCanTho: LuaChon = { ...LUA_CHON_MAU[0], khuVuc: "Cần Thơ" };

assert.equal(dungKhuVuc(lcHCM, []), null, "Chưa chọn khu vực ưu tiên thì ra null");
assert.equal(dungKhuVuc(lcHCM, ["TP.HCM"]), true);
assert.equal(dungKhuVuc(lcHN, ["TP.HCM"]), false);
assert.equal(dungKhuVuc(lcCanTho, ["Tỉnh khác"]), true, "Cần Thơ thuộc Tỉnh khác ngoài HN/TP.HCM/Đà Nẵng");
assert.equal(dungKhuVuc(lcHCM, ["Tỉnh khác"]), false, "TP.HCM không thuộc Tỉnh khác");

// ---------- 3) Bộ lọc (loc và dem) ----------
assert.equal(dem(BO_LOC_MAC_DINH), 0, "Bộ lọc mặc định có 0 tiêu chí đổi");
const locKhac: BoLoc = { ...BO_LOC_MAC_DINH, hocPhi: "duoi20", khuVuc: "Hà Nội" };
assert.equal(dem(locKhac), 2, "Đổi học phí và khu vực tính là 2 tiêu chí");

const ketQuaLoc = loc(LUA_CHON_MAU, { ...BO_LOC_MAC_DINH, diemTu: 24, diemDen: 27 });
assert.ok(ketQuaLoc.length > 0, "Có kết quả trong khoảng điểm 24-27");
assert.ok(ketQuaLoc.every((l) => l.diemMax >= 24 && l.diemMin <= 27), "Mọi kết quả đều chạm khoảng điểm");

// ---------- 4) Đánh giá mức độ phù hợp (danhGia) ----------
const boiCanhChuan: BoiCanh = {
  tong: 26,
  diem: { toan: 8.5, vatLy: 8.5, hoaHoc: 8.0, sinh: null, nguVan: null, tiengAnh: 9.0, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null },
  nganSach: 35, // 35 triệu/năm
  khuVucUuTien: ["TP.HCM"],
  tinh: "TP.HCM",
  hocXaNha: true,
  nganhQuanTam: [LUA_CHON_MAU[0].nhomNganh],
  nganhHopSoThich: [LUA_CHON_MAU[0].nhomNganh],
  uuTienViecLam: true,
};

// Trường hợp điểm cao hơn điểm chuẩn (Ví dụ điểm min 24, điểm em 26)
const lcVua: LuaChon = {
  ...LUA_CHON_MAU[0],
  diemMin: 24.0,
  diemMax: 25.5,
  hocPhiMin: 25,
  hocPhiMax: 30,
  khuVuc: "TP.HCM",
  toHopXet: ["A00", "A01"],
};
const dgVua = danhGia(lcVua, boiCanhChuan);
assert.equal(dgVua.muc, "Phù hợp", "Điểm hơn điểm chuẩn thì đánh giá Phù hợp");
assert.equal(dgVua.vuotNganSach, false, "Học phí 25-30 trong ngân sách 35");
assert.ok(dgVua.chenh !== null && dgVua.chenh > 0, "Độ chênh điểm dương");

// Trường hợp điểm thấp hơn điểm chuẩn nhiều (Ví dụ điểm min 28, điểm em 26)
const lcCao: LuaChon = {
  ...LUA_CHON_MAU[0],
  diemMin: 28.5,
  diemMax: 29.0,
  toHopXet: ["A00", "A01"],
};
const dgCao = danhGia(lcCao, boiCanhChuan);
assert.equal(dgCao.muc, "Cần cân nhắc", "Điểm thiếu nhiều thì xếp Cần cân nhắc");
assert.ok(dgCao.chenh !== null && dgCao.chenh < 0, "Độ chênh điểm âm");

// Trường hợp vượt ngân sách
const lcDat: LuaChon = {
  ...LUA_CHON_MAU[0],
  diemMin: 24.0,
  hocPhiMin: 60,
  hocPhiMax: 80,
  toHopXet: ["A00", "A01"],
};
const dgDat = danhGia(lcDat, boiCanhChuan);
assert.equal(dgDat.vuotNganSach, true, "Học phí 60 vượt ngân sách 35");

// Trường hợp chưa nhập điểm
const boiCanhChuaDiem: BoiCanh = {
  ...boiCanhChuan,
  tong: null,
  diem: { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null },
};
const dgChuaDiem = danhGia(lcVua, boiCanhChuaDiem);
assert.equal(dgChuaDiem.muc, null, "Chưa nhập điểm thì mức là null");
assert.equal(dgChuaDiem.chenh, null);

console.log("kham-pha: tất cả kiểm tra đều qua");
