import "./nap-du-lieu";
// Kiểm thử khắt khe toàn diện Decision Intelligence & Recommendation Layer (Tester Persona).
// Đảm bảo không lỗi toán học, tính liên tục, tính đơn điệu, và dữ liệu sạch 100%.
import assert from "node:assert/strict";
import { tinhXacSuatTrungTuyen } from "../src/engine/xac-suat-trung-tuyen";
import { danhGiaDanhMucToanDien } from "../src/engine/toi-uu-nguyen-vong";
import { diemUuTien, tongCoUuTien } from "../src/engine/diem-uu-tien";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { DANH_MUC_TRUONG } from "../src/data/truong-danh-muc";
import type { DiemDayDu } from "../src/state/types";

console.log("=== BẮT ĐẦU KIỂM THỬ KHẮT KHE DECISION INTELLIGENCE & RECOMMENDATION LAYER ===");

// 1. Kiểm tra tính liên tục và đơn điệu của Hàm Điểm Ưu Tiên (Thông tư 08/2022/TT-BGDĐT)
{
  const MUC_GOC = 2.75; // KV1 (0.75) + UT1 (2.0)
  
  // A. Tính liên tục tại điểm gãy x = 22.5
  const utTruoc = diemUuTien(22.499, MUC_GOC);
  const utTai = diemUuTien(22.5, MUC_GOC);
  const utSau = diemUuTien(22.501, MUC_GOC);
  assert.ok(Math.abs(utTruoc - utTai) < 0.02, `tính liên tục bên trái tại 22.5: ${utTruoc} vs ${utTai}`);
  assert.ok(Math.abs(utSau - utTai) < 0.02, `tính liên tục bên phải tại 22.5: ${utSau} vs ${utTai}`);

  // B. Tính đơn điệu không giảm của Tổng điểm sau ưu tiên: nếu raw_1 > raw_2 thì tongCoUuTien(raw_1) >= tongCoUuTien(raw_2)
  for (let d = 15.0; d <= 29.5; d += 0.25) {
    const t1 = tongCoUuTien(d, MUC_GOC);
    const t2 = tongCoUuTien(d + 0.25, MUC_GOC);
    assert.ok(t2 >= t1, `tổng điểm sau ưu tiên phải không giảm: ${d} (${t1}) -> ${d + 0.25} (${t2})`);
  }

  // C. Biên tại 30 điểm
  assert.equal(diemUuTien(30.0, MUC_GOC), 0, "thí sinh 30 điểm tuyệt đối không được cộng thêm ưu tiên");
  assert.equal(tongCoUuTien(30.0, MUC_GOC), 30.0);
}

// 2. Kiểm tra tính đơn điệu của Xác suất trúng tuyển (Calibrated Probability Model)
{
  const lcMau = LUA_CHON.find((l) => l.diemTheoNam && Object.keys(l.diemTheoNam).length >= 2) ?? LUA_CHON[0];
  
  // Điểm tăng thì xác suất trúng tuyển phải tăng hoặc giữ nguyên (Monotonically non-decreasing)
  let prevProb = 0;
  for (let d = 15.0; d <= 30.0; d += 0.5) {
    const res = tinhXacSuatTrungTuyen(d, lcMau, null);
    assert.ok(res !== null);
    assert.ok(res.xacSuat >= prevProb, `xác suất phải đơn điệu tăng theo điểm: tại ${d} là ${res.xacSuat} < ${prevProb}`);
    assert.ok(res.xacSuat >= 0.01 && res.xacSuat <= 0.99, "xác suất phải luôn nằm trong (0, 1)");
    assert.ok(res.khoangTinCay[0] <= res.phanTram && res.phanTram <= res.khoangTinCay[1], "phần trăm phải nằm trong khoảng tin cậy");
    prevProb = res.xacSuat;
  }
}

// 3. Kiểm tra tính chất danh mục (Portfolio Optimization Monotonicity)
{
  const mapById = new Map(LUA_CHON.map((l) => [l.id, l]));
  const tim = (id: string) => mapById.get(id);

  const diemEm: DiemDayDu = {
    toan: 8.0, vatLy: 8.0, hoaHoc: 8.0, sinh: null, nguVan: null,
    tiengAnh: 8.0, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null,
  };

  const sampleIds = LUA_CHON.slice(0, 5).map((l) => l.id);

  // Thêm nguyện vọng thì xác suất đỗ ít nhất 1 nguyện vọng P(>=1) KHÔNG BAO GIỜ GIẢM
  let prevTotalProb = 0;
  for (let k = 1; k <= sampleIds.length; k++) {
    const subList = sampleIds.slice(0, k);
    const diag = danhGiaDanhMucToanDien(subList, tim, diemEm, {});
    const prob = diag.xacSuatDoItNhatMotNV ?? 0;
    assert.ok(prob >= prevTotalProb, `thêm NV không bao giờ giảm xác suất gộp: k=${k}, ${prob} vs ${prevTotalProb}`);
    prevTotalProb = prob;
  }
}

// 4. Kiểm tra dữ liệu sạch 100% không rác (Zero Garbage Data Guarantee)
{
  assert.ok(DANH_MUC_TRUONG.length >= 118, `danh mục trường phải có ít nhất 118 trường: hiện có ${DANH_MUC_TRUONG.length}`);
  
  // Kiểm tra mã trường chuẩn không trùng lặp
  const maTruongSet = new Set<string>();
  for (const [ma, ten, tinh] of DANH_MUC_TRUONG) {
    assert.ok(ma && ma.length >= 2, `mã trường hợp lệ: ${ma}`);
    assert.ok(!maTruongSet.has(ma), `mã trường không được trùng: ${ma}`);
    maTruongSet.add(ma);
    assert.ok(ten && ten.length >= 3, `tên trường hợp lệ: ${ten}`);
    assert.ok(Array.isArray(tinh) && tinh.length > 0, `tỉnh thành hợp lệ: ${tinh}`);
  }

  // Kiểm tra 100% chương trình trong LUA_CHON
  let chuongTrinhCoDiem = 0;
  for (const lc of LUA_CHON) {
    assert.ok(lc.id, "mỗi chương trình phải có ID");
    assert.ok(lc.truong, `chương trình ${lc.id} phải có tên trường`);
    assert.ok(lc.nganh, `chương trình ${lc.id} phải có tên ngành`);
    
    // Nếu có điểm chuẩn thì phải nằm trong thang điểm [10, 30]
    if (lc.diemMin !== undefined) {
      assert.ok(lc.diemMin >= 10 && lc.diemMin <= 30, `điểm min trong thang 30: ${lc.id} có điểm ${lc.diemMin}`);
    }
    if (lc.diemTheoNam) {
      chuongTrinhCoDiem++;
      for (const [namStr, diem] of Object.entries(lc.diemTheoNam)) {
        const nam = Number(namStr);
        assert.ok(nam >= 2020 && nam <= 2026, `năm điểm chuẩn hợp lệ: ${nam} ở ${lc.id}`);
        assert.ok(diem >= 10.0 && diem <= 30.0, `điểm chuẩn ${diem} của năm ${nam} ở ${lc.id} phải trong [10, 30]`);
      }
    }
  }
  assert.ok(chuongTrinhCoDiem > 2500, `hơn 2500 chương trình có điểm lịch sử: thực tế ${chuongTrinhCoDiem}`);
}

console.log("=== TẤT CẢ CÁC KIỂM THỬ KHẮT KHE ĐÃ VƯỢT QUA 100% ===");
