import assert from "node:assert/strict";
import { tinhKyVongVaBienDong, tinhXacSuatTrungTuyen } from "../src/engine/xac-suat-trung-tuyen";
import type { LuaChon } from "../src/state/types";

// 1. Kiểm tra tính toán kỳ vọng và độ biến động tau
{
  const motNam = tinhKyVongVaBienDong({ "2025": 26.5 }, 2025);
  assert.equal(motNam.soNam, 1);
  assert.equal(motNam.kyVong, 26.5);
  assert.equal(motNam.tau, 1.45);

  const haiNam = tinhKyVongVaBienDong({ "2025": 27.0, "2024": 25.0 }, 2025);
  assert.equal(haiNam.soNam, 2);
  assert.ok(haiNam.kyVong > 26.0 && haiNam.kyVong < 27.0, "kỳ vọng 2 năm ưu tiên năm mới nhất");
  assert.ok(haiNam.tau >= 1.0, "tau 2 năm hợp lý");

  const baNam = tinhKyVongVaBienDong({ "2025": 26.0, "2024": 25.5, "2023": 24.8 }, 2025);
  assert.equal(baNam.soNam, 3);
  assert.ok(baNam.kyVong >= 25.5 && baNam.kyVong <= 26.0);
}

// 2. Kiểm tra hàm tính xác suất trúng tuyển (calibrated probability)
const lcMau: LuaChon = {
  id: "test-cntt",
  truong: "QSC",
  tenTruong: "ĐH Công nghệ Thông tin - ĐHQG-HCM",
  nganh: "Kỹ thuật Phần mềm",
  nhomNganh: "Công nghệ thông tin",
  moTa: "THPT · A00",
  bac: "Đại học",
  khuVuc: "TP.HCM",
  diemMin: 27.0,
  diemMax: 27.0,
  namDiem: 2025,
  tone: "xanh",
  lyDoPhuHop: [],
  canLuuY: [],
  nguon: "Đề án UIT",
  daKiemChung: true,
  maTruong: "QSC",
  phuongThuc: "THPT",
  toHopXet: ["A00", "A01"],
  diemTheoNam: { "2025": 27.0, "2024": 26.5, "2023": 26.0 },
  nguonCap: "official_pdf",
};

// Case A: Điểm bằng đúng điểm kỳ vọng -> Xác suất quanh 50%
{
  const kq = tinhXacSuatTrungTuyen(26.7, lcMau, null);
  assert.ok(kq !== null);
  assert.ok(kq.xacSuat >= 0.40 && kq.xacSuat <= 0.60, `xác suất điểm ngang nhau phải ~50%: ${kq.xacSuat}`);
  assert.equal(kq.nhanRuiRo, "Vừa sức");
}

// Case B: Điểm vượt xa điểm chuẩn (+2.5 điểm) -> Rất an toàn (xác suất >= 90%)
{
  const kq = tinhXacSuatTrungTuyen(29.2, lcMau, null);
  assert.ok(kq !== null);
  assert.ok(kq.xacSuat >= 0.90, `điểm cao hơn nhiều phải an toàn: ${kq.xacSuat}`);
  assert.equal(kq.nhanRuiRo, "Rất an toàn");
  assert.ok(kq.khoangTinCay[0] < kq.khoangTinCay[1]);
}

// Case C: Điểm thấp hơn 2 điểm -> Thử sức cao (xác suất <= 20%)
{
  const kq = tinhXacSuatTrungTuyen(24.5, lcMau, null);
  assert.ok(kq !== null);
  assert.ok(kq.xacSuat <= 0.20, `điểm thấp hơn 2 điểm phải thử sức: ${kq.xacSuat}`);
  assert.equal(kq.nhanRuiRo, "Thử sức cao");
}

// Case D: Điểm ưu tiên khu vực KV1 (+0.75) cộng đúng quy chế
{
  const kqKhongUT = tinhXacSuatTrungTuyen(26.0, lcMau, null)!;
  const kqCoUT = tinhXacSuatTrungTuyen(26.0, lcMau, { khuVuc: "KV1", doiTuong: "khong" })!;
  assert.ok(kqCoUT.diemUuTienThucTe > 0, "phải có ưu tiên");
  assert.ok(kqCoUT.xacSuat > kqKhongUT.xacSuat, "có ưu tiên xác suất phải tăng");
}

console.log("xac-suat-trung-tuyen.test.ts: tất cả kiểm tra đều qua");

