import "./nap-du-lieu";
import assert from "node:assert/strict";
import { danhGiaDanhMucToanDien, toiUuThuTuDanhMuc, timKiemDanhMucToiUu } from "../src/engine/toi-uu-nguyen-vong";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { timTruongTrongCau, phanTichCau } from "../src/features/tu-van/hieu-cau";
import { timNganhKhop } from "../src/features/tu-van/lay-du-lieu";
import { hocPhiChu } from "../src/data/lua-chon-phu";
import { tenCongCu } from "../functions/_thu-vien/ket-noi-cong-cu";
import type { DiemDayDu, LuaChon } from "../src/state/types";

const lcA00: LuaChon = {
  id: "test-a00",
  nganh: "Công nghệ thông tin",
  truong: "BKA",
  maTruong: "BKA",
  tenTruong: "Đại học Bách khoa Hà Nội",
  bac: "Đại học",
  nhomNganh: "CNTT",
  khuVuc: "Hà Nội",
  diemMin: 27.5,
  diemMax: 28.5,
  namDiem: 2025,
  diemTheoNam: { "2023": 27.0, "2024": 27.2, "2025": 27.5 },
  toHopXet: ["A00"],
  hocPhiMin: 25,
  hocPhiMax: 30,
  moTa: "CNTT BKA",
  lyDoPhuHop: [],
  canLuuY: [],
  nguon: "Đề án 2025",
  daKiemChung: true,
  tone: "xanh",
};

const lcAnToan: LuaChon = {
  ...lcA00,
  id: "test-safe",
  nganh: "Kỹ thuật phần mềm",
  truong: "SPK",
  maTruong: "SPK",
  tenTruong: "ĐH Sư phạm Kỹ thuật TP.HCM",
  diemMin: 24.0,
  diemMax: 25.0,
  diemTheoNam: { "2023": 23.8, "2024": 24.0, "2025": 24.0 },
};

const lcThieuMon: LuaChon = {
  ...lcA00,
  id: "test-d07",
  nganh: "Khoa học dữ liệu",
  toHopXet: ["B00"], // thiếu môn Sinh
  diemMin: 26.5,
  diemMax: 27.0,
};

const baseDiem = (overrides: Partial<DiemDayDu>): DiemDayDu => ({
  toan: null,
  vatLy: null,
  hoaHoc: null,
  sinh: null,
  nguVan: null,
  tiengAnh: null,
  lichSu: null,
  diaLy: null,
  gdktpl: null,
  tinHoc: null,
  congNghe: null,
  ...overrides,
});

// 1. Kiểm tra không cộng điểm ưu tiên 2 lần (P0-01)
{
  const diem: DiemDayDu = baseDiem({
    toan: 8.5,
    vatLy: 8.5,
    hoaHoc: 8.0, // tổng 3 môn = 25.0
    nguVan: 7.0,
    tiengAnh: 8.0,
    uuTien: 0.5, // KV2-NT
  });
  const tong = tongChoLuaChon(lcA00, diem);
  // Với tổng 3 môn = 25.0 (>= 22.5), điểm ưu tiên thực tế = ((30 - 25) / 7.5) * 0.5 = 0.333... -> tổng = 25.33
  assert.equal(tong.tong, 25.33);

  const chanDoan = danhGiaDanhMucToanDien(
    ["test-a00"],
    (id) => (id === "test-a00" ? lcA00 : undefined),
    diem,
    { uuTienTuyenSinh: { khuVuc: "KV2-NT", doiTuong: "khong" } },
  );
  assert.equal(chanDoan.cacNguyenVong[0].diemXet, 25.33, "Điểm xét không được cộng ưu tiên lần 2");
  assert.equal(chanDoan.cacNguyenVong[0].chenhDiem, Math.round((25.33 - lcA00.diemMin) * 100) / 100);
}

// 2. Kiểm tra không sinh chuỗi "undefined%" khi có nguyện vọng thiếu điểm môn tổ hợp (P1-01)
{
  const diem: DiemDayDu = baseDiem({
    toan: 9.0,
    vatLy: 9.0,
    hoaHoc: 9.0,
    sinh: null, // thiếu môn Sinh cho B00
    nguVan: 7.5,
    tiengAnh: 8.5,
  });
  const map: Record<string, LuaChon> = {
    "test-safe": lcAnToan,
    "test-d07": lcThieuMon,
    "test-a00": lcA00,
  };
  const chanDoan = danhGiaDanhMucToanDien(["test-safe", "test-d07", "test-a00"], (id) => map[id], diem, {});
  for (const cb of chanDoan.canhBaoNghiemTrong) {
    assert.ok(!cb.includes("undefined"), `Cảnh báo không được chứa undefined: ${cb}`);
  }
  const nvThieu = chanDoan.cacNguyenVong.find((x) => x.id === "test-d07");
  assert.equal(nvThieu?.diemXet, null, "Nguyện vọng thiếu môn phải giữ điểm so sánh là null");
  assert.equal(nvThieu?.nhan, null, "Nguyện vọng thiếu môn không nhận nhãn điểm");
}

// 3. Kiểm tra phân biệt tên ngành "Công nghệ thông tin" và tên trường ĐH CNTT - QSC (P1-04)
{
  const truongDaNang = timTruongTrongCau("Ở Đà Nẵng có trường nào đào tạo Công nghệ thông tin?", ["da nang"]);
  assert.equal(truongDaNang.length, 0, "Không được nhận nhầm tên ngành Công nghệ thông tin là trường QSC");

  const pt = phanTichCau("Ở Đà Nẵng có trường nào đào tạo Công nghệ thông tin?");
  assert.equal(pt.kieu, "kham-pha-truong");
  assert.equal(pt.tinh, "Đà Nẵng");

  const truongThucSu = timTruongTrongCau("Điểm chuẩn trường Công nghệ thông tin năm 2025?");
  assert.equal(truongThucSu.length, 1);
  assert.equal(truongThucSu[0].kq.ma, "QSC");
}

// 4. Trường chưa có dữ liệu không được trả điểm của trường khác (P1-04).
{
  const kq = timNganhKhop("Điểm chuẩn ngành Khoa học máy tính Bách khoa TP.HCM năm 2025 là bao nhiêu?", 5);
  assert.ok(kq.every((l) => l.maTruong === "QSB"), "Chỉ được trả chương trình QSB nếu danh mục có, không đoán sang BKA/DDK");
}

// 5. Kiểm tra định dạng dấu phẩy học phí và alias công cụ MCP (P2)
{
  assert.equal(hocPhiChu({ hocPhiMin: 28.5, hocPhiMax: 28.5, nguonHocPhi: { nam: "2025", url: "https://example.edu.vn", trang: 1 } }), "28,5");
  assert.equal(tenCongCu("get_student_profile")?.ten, "lay_ho_so");
  assert.equal(tenCongCu("get_study_plan")?.ten, "get_study_plan", "Dùng schema công cụ mới khi đã đăng ký trực tiếp");
  assert.equal(tenCongCu("ke_hoach_tuan")?.ten, "ke_hoach_tuan", "Giữ công cụ lịch cũ để không làm hỏng kết nối trước đây");
}

// 6. Kiểm tra tối ưu thứ tự và gợi ý danh mục không cộng ưu tiên 2 lần
{
  const diem: DiemDayDu = baseDiem({
    toan: 8.5,
    vatLy: 8.5,
    hoaHoc: 8.5,
    nguVan: 7.5,
    tiengAnh: 8.5,
    uuTien: 0.5,
  });
  const thuTu = toiUuThuTuDanhMuc(["test-safe", "test-a00"]);
  assert.deepEqual(thuTu, ["test-safe", "test-a00"], "không tự đổi thứ tự theo điểm thay học sinh");
  const goiY = timKiemDanhMucToiUu([lcAnToan, lcA00], diem, {
    uuTienTuyenSinh: { khuVuc: "KV2-NT", doiTuong: "khong" },
  }, 2);
  assert.equal(goiY.length, 2);
}

console.log("final-acceptance-fixes: OK");
