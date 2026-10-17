import assert from "node:assert/strict";
import {
  danhGiaDanhMucToanDien,
  toiUuThuTuDanhMuc,
  timKiemDanhMucToiUu,
} from "../src/engine/toi-uu-nguyen-vong";
import type { DiemDayDu, LuaChon } from "../src/state/types";

const dsMau: LuaChon[] = [
  {
    id: "uit-cntt",
    truong: "QSC",
    tenTruong: "ĐH Công nghệ Thông tin",
    nganh: "Công nghệ thông tin",
    nhomNganh: "Công nghệ thông tin",
    moTa: "THPT",
    bac: "Đại học",
    khuVuc: "TP.HCM",
    diemMin: 27.5,
    diemMax: 27.5,
    namDiem: 2025,
    tone: "xanh",
    lyDoPhuHop: [],
    canLuuY: [],
    nguon: "Đề án",
    daKiemChung: true,
    maTruong: "QSC",
    phuongThuc: "THPT",
    toHopXet: ["A00"],
    diemTheoNam: { "2025": 27.5, "2024": 27.2 },
    hocPhiMin: 35,
    hocPhiMax: 35,
    nguonCap: "official_pdf",
  },
  {
    id: "spkt-cntt",
    truong: "SPK",
    tenTruong: "ĐH Sư phạm Kỹ thuật TP.HCM",
    nganh: "Công nghệ thông tin",
    nhomNganh: "Công nghệ thông tin",
    moTa: "THPT",
    bac: "Đại học",
    khuVuc: "TP.HCM",
    diemMin: 25.5,
    diemMax: 25.5,
    namDiem: 2025,
    tone: "luc",
    lyDoPhuHop: [],
    canLuuY: [],
    nguon: "Đề án",
    daKiemChung: true,
    maTruong: "SPK",
    phuongThuc: "THPT",
    toHopXet: ["A00"],
    diemTheoNam: { "2025": 25.5, "2024": 25.0 },
    hocPhiMin: 28,
    hocPhiMax: 28,
    nguonCap: "official_pdf",
  },
  {
    id: "hutech-cntt",
    truong: "DKC",
    tenTruong: "ĐH Công nghệ TP.HCM (HUTECH)",
    nganh: "Công nghệ thông tin",
    nhomNganh: "Công nghệ thông tin",
    moTa: "THPT",
    bac: "Đại học",
    khuVuc: "TP.HCM",
    diemMin: 20.0,
    diemMax: 20.0,
    namDiem: 2025,
    tone: "cam",
    lyDoPhuHop: [],
    canLuuY: [],
    nguon: "Đề án",
    daKiemChung: true,
    maTruong: "DKC",
    phuongThuc: "THPT",
    toHopXet: ["A00"],
    diemTheoNam: { "2025": 20.0, "2024": 19.5 },
    hocPhiMin: 45,
    hocPhiMax: 45,
    nguonCap: "official_pdf",
  },
];

const mapById = new Map(dsMau.map((l) => [l.id, l]));
const tim = (id: string) => mapById.get(id);

const diemEm: DiemDayDu = {
  toan: 8.5,
  vatLy: 8.5,
  hoaHoc: 8.5, // Tổng A00 = 25.5
  sinh: null,
  nguVan: null,
  tiengAnh: null,
  lichSu: null,
  diaLy: null,
  gdktpl: null,
  tinHoc: null,
  congNghe: null,
};

// 1. Nhóm nhãn khớp với khoảng cách điểm lịch sử, không tạo xác suất.
{
  // Danh mục thứ tự chuẩn: NV1 UIT (Thử sức), NV2 SPKT (Vừa sức), NV3 HUTECH (An toàn)
  const cd = danhGiaDanhMucToanDien(["uit-cntt", "spkt-cntt", "hutech-cntt"], tim, diemEm, {
    nganSach: null,
    khuVuc: ["TP.HCM"],
    uuTienTuyenSinh: null,
  });

  assert.equal(cd.soLuong, 3);
  assert.equal(JSON.stringify(cd).includes("xacSuat"), false);
  assert.equal(cd.canhBaoNghiemTrong.length, 0, "không được có cảnh báo nghịch đảo khi xếp đúng");
  assert.equal(cd.coCau.thuSuc, 1);
  assert.equal(cd.coCau.vuaSuc, 1);
  assert.equal(cd.coCau.anToan, 1);
}

// 2. Phát hiện nghịch đảo thứ tự (Inversion Detection)
{
  // Xếp ngược theo khoảng cách điểm: NV1 HUTECH (An toàn), NV2 UIT (Thử sức).
  const cdNghichDao = danhGiaDanhMucToanDien(["hutech-cntt", "uit-cntt"], tim, diemEm, {
    nganSach: null,
    khuVuc: ["TP.HCM"],
    uuTienTuyenSinh: null,
  });

  assert.ok(cdNghichDao.canhBaoNghiemTrong.length > 0, "phải cảnh báo nghịch đảo thứ tự");
  assert.ok(cdNghichDao.cacNguyenVong[0].biNghichDao, "NV1 phải bị đánh dấu nghịch đảo");

  // Thứ tự nguyện vọng phản ánh sở thích; engine không tự đổi.
  const thuTuMoi = toiUuThuTuDanhMuc(["hutech-cntt", "uit-cntt"]);
  assert.deepEqual(thuTuMoi, ["hutech-cntt", "uit-cntt"]);
}

// 3. Kiểm tra Smart Portfolio Builder
{
  const goiY = timKiemDanhMucToiUu(dsMau, diemEm, {
    nganSach: "30-60",
    khuVuc: ["TP.HCM"],
    nganhQuanTam: ["Công nghệ thông tin"],
    uuTienTuyenSinh: null,
  }, 2, "can_bang");

  assert.ok(goiY.length > 0);
  // Không được chứa ngành vượt ngân sách 60tr
  for (const item of goiY) {
    assert.ok((item.hocPhiMin ?? 0) <= 60, "không được vượt ngân sách");
  }
}

// 4. Kiểm thử danh mục rỗng hoặc ID không tồn tại
{
  const cdRong = danhGiaDanhMucToanDien([], tim, diemEm, {
    nganSach: null,
    khuVuc: ["TP.HCM"],
    uuTienTuyenSinh: null,
  });
  assert.equal(cdRong.soLuong, 0);
  assert.equal(cdRong.xacSuatDoItNhatMotNV, 0);
  assert.equal(cdRong.cacNguyenVong.length, 0);
  assert.ok(cdRong.deXuatHanhDong.length > 0);

  // ID không tồn tại
  const cdIdLa = danhGiaDanhMucToanDien(["id-khong-ton-tai"], tim, diemEm, {});
  assert.equal(cdIdLa.soLuong, 0);
}

console.log("toi-uu-nguyen-vong.test.ts: tất cả kiểm tra đều qua");
