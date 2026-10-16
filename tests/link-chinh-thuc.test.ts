import assert from "node:assert/strict";
import { giaiQuyetLink, THONG_TIN_PHUONG_THUC } from "../src/engine/link-chinh-thuc";

// 1. Kiểm tra fallback khi URL bị hỏng 404
{
  const linkHong = "https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-dai-hoc-chinh-quy.pdf";
  const ketQuaBKA = giaiQuyetLink("BKA", linkHong);
  assert.equal(ketQuaBKA.url, "https://ts.hust.edu.vn", "URL hỏng của BKA phải fallback về cổng tuyển sinh Bách Khoa");
  assert.equal(ketQuaBKA.laCongChinhThuc, true);
  assert.equal(ketQuaBKA.daKiemChung, true);

  const ketQuaUIT = giaiQuyetLink("QSC", linkHong);
  assert.equal(ketQuaUIT.url, "https://tuyensinh.uit.edu.vn", "URL hỏng của UIT phải fallback về cổng tuyển sinh UIT");
  assert.equal(ketQuaUIT.laCongChinhThuc, true);
}

// 2. Kiểm tra URL hợp lệ có số trang
{
  const urlTot = "https://images.tuyensinh247.com/picture/2024/0506/de-an-ts-khoa-y-duoc-dh-da-nang-2024.pdf";
  const ketQua = giaiQuyetLink("DDY", urlTot, 12);
  assert.equal(ketQua.url, `${urlTot}#page=12`);
  assert.equal(ketQua.nhanHienThi, "Đề án tuyển sinh · tr. 12");
  assert.equal(ketQua.laCongChinhThuc, false);
}

// 3. Kiểm tra các phương thức tuyển sinh
{
  assert.ok(THONG_TIN_PHUONG_THUC.THPT !== undefined);
  assert.ok(THONG_TIN_PHUONG_THUC.DGNL_HCM !== undefined);
  assert.ok(THONG_TIN_PHUONG_THUC.DGNL_HN !== undefined);
  assert.ok(THONG_TIN_PHUONG_THUC.DGTD !== undefined);
  assert.ok(THONG_TIN_PHUONG_THUC.HOC_BA !== undefined);
  assert.ok(THONG_TIN_PHUONG_THUC.KET_HOP !== undefined);
}

console.log("link-chinh-thuc.test.ts: tất cả kiểm tra đều qua");
