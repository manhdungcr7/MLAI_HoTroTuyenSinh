import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Khối "Độ tin cậy dữ liệu" (trang Về dữ liệu): đếm đúng, tổng các loại = tổng số. Chạy: npx tsx tests/do-tin-cay-du-lieu.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { thongKeBienDong, namTuyenSinhToi } from "../src/engine/du-bao-diem-chuan";
import { tinhDoTinCayDuLieu } from "../src/engine/do-tin-cay-du-lieu";
import type { LuaChon } from "../src/state/types";

const NAM = 2027;
const goc = LUA_CHON.find((l) => l.phuongThuc === "THPT" && Object.keys(l.diemTheoNam ?? {}).length >= 2)!;
const fake = (id: string, o: Partial<LuaChon>): LuaChon => {
  const diemTheoNam = o.diemTheoNam ?? {};
  const nam = Object.keys(diemTheoNam).map(Number).sort((a, b) => a - b);
  const cuoi = nam.length ? nam[nam.length - 1] : 0;
  return { ...goc, id, maTruong: "maTruong" in o ? o.maTruong : "FAK", truong: "FAK", phuongThuc: "THPT", nguonCap: "official_pdf", hocPhiMin: undefined, tiLeViecLam: undefined, maTheoNam: undefined, namBatDauTuyenSinh: undefined, ...o, diemTheoNam, diemMin: cuoi ? diemTheoNam[String(cuoi)] : 0, namDiem: cuoi };
};

const tk = thongKeBienDong(LUA_CHON);

// 1. Chương trình giả đủ các loại
const ds: LuaChon[] = [
  fake("a", { diemTheoNam: { "2023": 20, "2024": 21, "2025": 22 }, hocPhiMin: 20, tiLeViecLam: 90 }), // nhieuNam, có học phí, việc làm
  fake("b", { diemTheoNam: { "2025": 23 }, nguonCap: "aggregator_verified", maTruong: "FA2" }), // motNam, nguồn tổng hợp
  fake("c", { diemTheoNam: { "2023": 15, "2024": 15 }, scoreEvidence: Object.fromEntries(["2023", "2024"].map((nam) => [nam, {
    kind: "diem_san" as const, score: 15, scale: 30, sourceUrl: "https://fixture.edu.vn/diem-san",
    checkedAt: "2026-10-17", checkedBy: "test fixture", independentReviewer: null, includesPriority: null,
  }])) }), // có bằng chứng điểm sàn
  fake("d", { diemTheoNam: {} }), // khongDu
  fake("e", { diemTheoNam: { "2024": 24, "2025": 25 }, phuongThuc: "HOC_BA" }), // phuongThucKhac
  fake("f", { diemTheoNam: { "2025": 21 }, nguonCap: undefined, maTruong: undefined, truong: "KHAC" }), // nguồn không rõ, không mã
];
const r = tinhDoTinCayDuLieu(ds, tk, NAM);
assert.equal(r.tong, ds.length);
assert.equal(r.theoLoai.nhieuNam, 1);
assert.equal(r.theoLoai.motNam, 2);
assert.equal(r.theoLoai.chiDiemSan, 1);
assert.equal(r.theoLoai.khongDu, 1);
assert.equal(r.theoLoai.phuongThucKhac, 1);
const tongLoai = Object.values(r.theoLoai).reduce((a, b) => a + b, 0);
assert.equal(tongLoai, r.tong, "tổng các loại phải bằng tổng số");
assert.equal(r.nguonChinhThuc, 4);
assert.equal(r.nguonTongHop, 1);
assert.equal(r.nguonKhac, 1);
assert.equal(r.nguonChinhThuc + r.nguonTongHop + r.nguonKhac, r.tong);
assert.equal(r.hocPhiDaKiemChung, 1);
assert.equal(r.coViecLam, 1);
assert.equal(r.namDiemMoiNhat, 2025);
assert.equal(r.soCoNamDiemMoiNhat, 3, "a, b, f đều có điểm THPT năm 2025; e (phương thức khác) không được tính");
assert.equal(r.soTruong, 3, "FAK, FA2 và tên KHAC (không có mã)");
assert.equal(r.namDuBao, NAM);
const tongDuBao = r.duBaoTheoTinCay.cao + r.duBaoTheoTinCay.vua + r.duBaoTheoTinCay.thap;
assert.ok(tongDuBao <= r.tong, "dự báo không vượt tổng số");
assert.ok(r.chamTran <= tongDuBao, "chạm trần là tập con của dự báo");

// 2. Danh sách rỗng không gây lỗi và không bịa số
const rong = tinhDoTinCayDuLieu([], tk, NAM);
assert.equal(rong.tong, 0);
assert.equal(rong.namDiemMoiNhat, null);
assert.equal(rong.soTruong, 0);

// 3. Dữ liệu thật: mọi nhóm đếm đều khớp tổng
const real = tinhDoTinCayDuLieu(LUA_CHON, tk, namTuyenSinhToi());
assert.equal(real.tong, LUA_CHON.length);
assert.equal(Object.values(real.theoLoai).reduce((a, b) => a + b, 0), real.tong);
assert.equal(real.nguonChinhThuc + real.nguonTongHop + real.nguonKhac, real.tong);
assert.ok(real.tong > 0, "dữ liệu thật phải đã nạp (chạy sau napDanhMuc)");

console.log("Độ tin cậy dữ liệu (dữ liệu thật):", JSON.stringify(real));
console.log("OK: tests/do-tin-cay-du-lieu.test.ts");
