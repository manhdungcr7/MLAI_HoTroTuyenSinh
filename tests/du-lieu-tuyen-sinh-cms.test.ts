import assert from "node:assert/strict";
import type { BanGhiCms, NguonKiemChung } from "../src/engine/du-lieu-tuyen-sinh/kieu";
import { hopNhatLuaChonVaCms } from "../src/engine/du-lieu-tuyen-sinh/hop-nhat";
import { taoSnapshotVaManifest, tinhHashSha256 } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import {
  chuyenTrangThaiWorkflow,
  kiemTraNguonKiemChung,
  taoBanNhapMoi,
  taoPhienBanSuaDoi,
} from "../src/engine/du-lieu-tuyen-sinh/workflow";
import type { LuaChon } from "../src/state/types";

console.log("--- BẮT ĐẦU KIỂM THỬ WORKFLOW CMS, SNAPSHOT & MERGE ENGINE ---");

const nguonChuan: NguonKiemChung = {
  url: "https://tuyensinh.uit.edu.vn/de-an-2026",
  tieuDe: "Đề án tuyển sinh Đại học chính quy 2026",
  donViCongBo: "Trường ĐH Công nghệ Thông tin - ĐHQG-HCM",
  ngayKiemChung: "2026-10-07T08:00:00.000Z",
};

// 1. Kiểm tra Provenance
const nguonLoi = { url: "khong-phai-link", tieuDe: "", donViCongBo: "" };
assert.equal(kiemTraNguonKiemChung(nguonLoi).hopLe, false, "Nguồn sai URL phải bị từ chối");

const kqTaoLoi = taoBanNhapMoi({
  id: "test-01",
  entityType: "tuition",
  entityId: "QSC",
  data: { mucThap: 35, mucCao: 50 },
  source: nguonLoi as unknown as NguonKiemChung,
  changeNote: "Test",
  actorEmail: "ctv@nguyenvongai.vn",
  actorRole: "contributor",
});
assert.equal(kqTaoLoi.thanhCong, false, "Không tạo được DRAFT nếu nguồn lỗi");

// 2. Tạo DRAFT hợp lệ
const kqTao = taoBanNhapMoi({
  id: "test-02",
  entityType: "tuition",
  entityId: "QSC",
  data: { mucThap: 35, mucCao: 55, nam: 2026 },
  source: nguonChuan,
  changeNote: "Cập nhật học phí UIT năm 2026",
  actorEmail: "ctv@nguyenvongai.vn",
  actorRole: "contributor",
});
assert.equal(kqTao.thanhCong, true);
assert.equal(kqTao.duLieu?.status, "DRAFT");
assert.equal(kqTao.duLieu?.version, 1);
assert.equal(kqTao.auditLog?.action, "CREATE");
console.log("✓ Test 1: Tạo DRAFT và kiểm tra Provenance đạt 100%");

// 3. Workflow transitions: DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED
let banGhi = kqTao.duLieu!;

const kqSubmit = chuyenTrangThaiWorkflow({
  banGhi,
  trangThaiDich: "SUBMITTED",
  actorEmail: "ctv@nguyenvongai.vn",
  actorRole: "contributor",
});
assert.equal(kqSubmit.thanhCong, true);
banGhi = kqSubmit.duLieu!;
assert.equal(banGhi.status, "SUBMITTED");

// Contributor không được tự Approve
const kqTuApprove = chuyenTrangThaiWorkflow({
  banGhi,
  trangThaiDich: "APPROVED",
  actorEmail: "ctv@nguyenvongai.vn",
  actorRole: "contributor",
});
assert.equal(kqTuApprove.thanhCong, false, "CTV không thể tự duyệt bài");

// Reviewer Approve
const kqApprove = chuyenTrangThaiWorkflow({
  banGhi,
  trangThaiDich: "APPROVED",
  actorEmail: "reviewer@nguyenvongai.vn",
  actorRole: "reviewer",
});
assert.equal(kqApprove.thanhCong, true);
banGhi = kqApprove.duLieu!;
assert.equal(banGhi.status, "APPROVED");

// Admin Publish
const kqPublish = chuyenTrangThaiWorkflow({
  banGhi,
  trangThaiDich: "PUBLISHED",
  actorEmail: "admin@nguyenvongai.vn",
  actorRole: "admin",
});
assert.equal(kqPublish.thanhCong, true);
banGhi = kqPublish.duLieu!;
assert.equal(banGhi.status, "PUBLISHED");
console.log("✓ Test 2: Lifecycle DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED đạt 100%");

// 4. Không sửa trực tiếp PUBLISHED mà tạo new DRAFT version + 1
const kqSua = taoPhienBanSuaDoi({
  newId: "bg-draft-v2",
  banGhiHienTai: banGhi,
  duLieuMoi: { mucThap: 40, mucCao: 60 },
  sourceMoi: nguonChuan,
  changeNote: "Hiệu chỉnh học phí UIT năm 2026",
  actorEmail: "editor@nguyenvongai.vn",
  actorRole: "editor",
});
assert.equal(kqSua.thanhCong, true);
assert.equal(kqSua.duLieu?.id, "bg-draft-v2");
assert.equal(kqSua.duLieu?.version, 2);
assert.equal(kqSua.duLieu?.status, "DRAFT");
assert.equal(kqSua.duLieu?.previousVersionId, banGhi.id);
console.log("✓ Test 3: Versioning & Không sửa trực tiếp Production đạt 100%");

// 5. Từ chối bản ghi
const kqRejectNoReason = chuyenTrangThaiWorkflow({
  banGhi: { ...banGhi, status: "SUBMITTED" },
  trangThaiDich: "REJECTED",
  actorEmail: "reviewer@nguyenvongai.vn",
  actorRole: "reviewer",
  lyDoTuChoi: "",
});
assert.equal(kqRejectNoReason.thanhCong, false, "Bắt buộc có lý do khi từ chối");

const kqRejectOk = chuyenTrangThaiWorkflow({
  banGhi: { ...banGhi, status: "SUBMITTED" },
  trangThaiDich: "REJECTED",
  actorEmail: "reviewer@nguyenvongai.vn",
  actorRole: "reviewer",
  lyDoTuChoi: "Link đề án không tải được",
});
assert.equal(kqRejectOk.thanhCong, true);
assert.equal(kqRejectOk.duLieu?.status, "REJECTED");
console.log("✓ Test 4: Rejection flow kèm lý do đạt 100%");

// 6. Snapshot Builder & Manifest Generation
async function testSnapshot() {
  const dsPublic: BanGhiCms[] = [banGhi];
  const res = await taoSnapshotVaManifest(dsPublic, "2026.10.07.01");
  assert.equal(res.manifest.schemaVersion, 1);
  assert.equal(res.manifest.dataVersion, "2026.10.07.01");
  assert.equal(res.datasets.tuition.duLieu.length, 1);
  assert.ok(res.manifest.datasets.tuition.hash.length > 0);

  const hash1 = await tinhHashSha256("test-content");
  const hash2 = await tinhHashSha256("test-content");
  assert.equal(hash1, hash2, "Mã băm SHA-256 phải deterministic");
  console.log("✓ Test 5: Snapshot Builder & Domain Manifest đạt 100%");
}

// 7. Core Dataset + CMS Overrides Merge Logic
const coreSample: LuaChon[] = [
  {
    id: "QSC-7480201",
    truong: "QSC",
    tenTruong: "Trường ĐH Công nghệ Thông tin",
    nganh: "Công nghệ Thông tin",
    nhomNganh: "Máy tính và CNTT",
    moTa: "THPT",
    bac: "Đại học",
    khuVuc: "TP.HCM",
    diemMin: 27.5,
    diemMax: 27.5,
    namDiem: 2025,
    tone: "xanh",
    lyDoPhuHop: [],
    canLuuY: [],
    nguon: "Đề án chính thức",
    daKiemChung: true,
    maTruong: "QSC",
    phuongThuc: "THPT",
    toHopXet: ["A00", "A01"],
    diemTheoNam: { "2025": 27.5 },
  },
];

const cmsData = {
  tuition: [
    {
      id: "QSC",
      maTruong: "QSC",
      nam: 2026,
      mucThap: 35,
      mucCao: 55,
      donVi: "trieu_nam" as const,
      nguon: nguonChuan,
      capNhatLuc: "2026-10-07",
    },
  ],
  cutoffScores: [
    {
      id: "QSC-7480201",
      maTruong: "QSC",
      maNganh: "7480201",
      nam: 2026,
      phuongThuc: "THPT",
      toHop: "A00",
      diemChuan: 28.0,
      nguon: nguonChuan,
      capNhatLuc: "2026-10-07",
    },
  ],
};

const ketQuaHopNhat = hopNhatLuaChonVaCms(coreSample, cmsData);
assert.equal(ketQuaHopNhat.length, 1);
assert.equal(ketQuaHopNhat[0].hocPhiMin, 35);
assert.equal(ketQuaHopNhat[0].hocPhiMax, 55);
assert.equal(ketQuaHopNhat[0].diemMin, 28.0);
assert.equal(ketQuaHopNhat[0].namDiem, 2026);
assert.equal(ketQuaHopNhat[0].diemTheoNam?.["2026"], 28.0);
console.log("✓ Test 6: Hợp nhất Core Dataset + CMS Snapshot Overrides đạt 100%");

testSnapshot().then(() => {
  console.log("🎉 TẤT CẢ KIỂM THỬ KIẾN TRÚC DỮ LIỆU TUYỂN SINH & CMS ĐỀU ĐẠT 100%!");
});
