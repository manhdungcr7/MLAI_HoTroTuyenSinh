import assert from "node:assert/strict";
import {
  kiemTraBanGhiTruong, dungBanChup,
  type BanGhiTruong, type ThongTinTruong,
} from "../src/data/dong-gop-kiem-tra";
import {
  formTrong, bodyTuForm, kiemTraForm, type FormThongTin
} from "../cms/src/tinh-nang/truong/bieu-mau";
import { DANH_SACH_TRUONG, truongTheoMa } from "../cms/src/du-lieu/danh-sach-truong";
import { xuLyDuLieuMau } from "../cms/src/may-chu/gia-lap";
import type { ChiTietTruongApi, ThongTinCms } from "../cms/src/may-chu/kieu";

console.log("--- BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CRUD & MAPPING CMS ---");

// =========================================================================
// TEST 1: Mapping Dataset 100 trường đại học
// =========================================================================
assert.ok(DANH_SACH_TRUONG.length >= 100, `Cần ít nhất 100 trường, hiện có: ${DANH_SACH_TRUONG.length}`);
const uit = truongTheoMa("QSC");
assert.ok(uit, "Trường QSC (ĐH Công nghệ Thông tin - ĐHQG TP.HCM) phải tồn tại");
assert.equal(uit.ma, "QSC");
assert.equal(uit.khuVuc, "TP.HCM");
console.log("✓ Test 1 Passed: Dataset 100 trường hợp lệ.");

// =========================================================================
// TEST 2: CRUD Kênh chính thức của trường (BanGhiTruong)
// =========================================================================
const kenhRaw = {
  maTruong: "QSC",
  websiteTuyenSinhUrl: "https://tuyensinh.uit.edu.vn",
  fanpageUrl: "https://facebook.com/uit.edu.vn",
  nhomTuyenSinhChinhThucUrl: "https://zalo.me/g/uit2026",
  nhomCongDongUrl: "https://facebook.com/groups/uit.k21",
};
const kqKenh = kiemTraBanGhiTruong(kenhRaw);
assert.ok(kqKenh.ok, "Kênh chính thức phải hợp lệ");
assert.equal(kqKenh.duLieu.websiteTuyenSinhUrl, "https://tuyensinh.uit.edu.vn/");

// Cập nhật kênh qua API giả lập CMS
const resKenh = await xuLyDuLieuMau("PUT", "/truong/QSC", {}, kenhRaw);
assert.ok(resKenh, "PUT /truong/QSC thành công");
console.log("✓ Test 2 Passed: CRUD Kênh chính thức thành công.");

// =========================================================================
// TEST 3: CRUD Học phí (hoc_phi) - Form -> Body -> Validation -> Create -> Approve
// =========================================================================
const formHocPhi: FormThongTin = {
  ...formTrong("hoc_phi"),
  nam: "2026",
  linkNguon: "https://tuyensinh.uit.edu.vn/hoc-phi-2026",
  donVi: "trieu_nam",
  mucThap: "35",
  mucCao: "45",
  phamVi: "Chương trình chuẩn",
  loTrinhTang: "Không quá 10%/năm",
};

// 1. Kiểm tra validation form
const loiHocPhi = kiemTraForm("hoc_phi", formHocPhi);
assert.equal(Object.keys(loiHocPhi).length, 0, "Form học phí phải hợp lệ 100%");

// 2. Chuyển đổi Form -> Body
const bodyHocPhi = bodyTuForm("hoc_phi", formHocPhi);
assert.equal(bodyHocPhi.nam, 2026);
assert.equal((bodyHocPhi.duLieu as any).mucThap, 35);
assert.equal((bodyHocPhi.duLieu as any).mucCao, 45);

// 3. Tạo mới qua API
const taoHocPhiRes = await xuLyDuLieuMau("POST", "/thong-tin", {}, {
  maTruong: "QSC",
  loai: "hoc_phi",
  nam: 2026,
  linkNguon: formHocPhi.linkNguon,
  duLieu: bodyHocPhi.duLieu,
  trangThai: "cho",
}) as ThongTinCms;

assert.ok(taoHocPhiRes.id, "Phải sinh ID cho bản ghi học phí");
assert.equal(taoHocPhiRes.trangThai, "cho");

// 4. QTV Phê duyệt bản ghi
const duyetHocPhiRes = await xuLyDuLieuMau("PATCH", `/thong-tin/${taoHocPhiRes.id}`, {}, {
  phienBan: taoHocPhiRes.phienBan ?? 1,
  trangThai: "duyet",
}) as ThongTinCms;
assert.equal(duyetHocPhiRes.trangThai, "duyet");
console.log("✓ Test 3 Passed: CRUD Học phí hoàn tất.");

// =========================================================================
// TEST 4: CRUD Học bổng (hoc_bong) - Create -> Reject with Reason -> Edit -> Approve
// =========================================================================
const formHocBong: FormThongTin = {
  ...formTrong("hoc_bong"),
  linkNguon: "https://tuyensinh.uit.edu.vn/hoc-bong",
  ten: "Học bổng Thủ khoa Tuyển sinh",
  giaTri: "100% học phí toàn khóa",
  dieuKien: "Thủ khoa đầu vào khối A00/A01",
};

const loiHocBong = kiemTraForm("hoc_bong", formHocBong);
assert.equal(Object.keys(loiHocBong).length, 0);

const bodyHocBong = bodyTuForm("hoc_bong", formHocBong);
const taoHocBongRes = await xuLyDuLieuMau("POST", "/thong-tin", {}, {
  maTruong: "QSC",
  loai: "hoc_bong",
  linkNguon: formHocBong.linkNguon,
  duLieu: bodyHocBong.duLieu,
  trangThai: "cho",
}) as ThongTinCms;

// QTV Từ chối trả về nháp kèm lý do
const tuChoiHocBong = await xuLyDuLieuMau("PATCH", `/thong-tin/${taoHocBongRes.id}`, {}, {
  phienBan: taoHocBongRes.phienBan ?? 1,
  trangThai: "nhap",
  lyDo: "Cần bổ sung chi tiết điều kiện duy trì học bổng các năm sau.",
}) as ThongTinCms;
assert.equal(tuChoiHocBong.trangThai, "nhap");
assert.equal(tuChoiHocBong.lyDoTuChoi, "Cần bổ sung chi tiết điều kiện duy trì học bổng các năm sau.");

// CTV Sửa lại và gửi duyệt lại
const suaHocBongRes = await xuLyDuLieuMau("PATCH", `/thong-tin/${taoHocBongRes.id}`, {}, {
  phienBan: (tuChoiHocBong.phienBan ?? 1) + 1,
  duLieu: { ...(bodyHocBong.duLieu as any), dieuKien: "Thủ khoa đầu vào và duy trì GPA >= 8.0" },
  trangThai: "duyet",
}) as ThongTinCms;
assert.equal(suaHocBongRes.trangThai, "duyet");
console.log("✓ Test 4 Passed: CRUD Học bổng + Luồng Trả về nháp kèm lý do thành công.");

// =========================================================================
// TEST 5: CRUD Nơi lưu trú (noi_luu_tru) & Đánh giá (review)
// =========================================================================
const formLuuTru: FormThongTin = {
  ...formTrong("noi_luu_tru"),
  linkNguon: "https://ktxdhqg.edu.vn",
  coKyTucXa: "co",
  ktxThap: "0.5",
  ktxCao: "1.2",
  khuTro: "nhieu",
  troThap: "1.5",
  troCao: "3.5",
  khoangCachKm: "1.5",
  ghiChu: "Ký túc xá Khu A và Khu B ĐHQG-HCM, xe buýt đưa đón tận trường.",
};
const loiLuuTru = kiemTraForm("noi_luu_tru", formLuuTru);
assert.equal(Object.keys(loiLuuTru).length, 0);

const bodyLuuTru = bodyTuForm("noi_luu_tru", formLuuTru);
const taoLuuTruRes = await xuLyDuLieuMau("POST", "/thong-tin", {}, {
  maTruong: "QSC",
  loai: "noi_luu_tru",
  linkNguon: formLuuTru.linkNguon,
  duLieu: bodyLuuTru.duLieu,
  trangThai: "duyet",
}) as ThongTinCms;
assert.equal(taoLuuTruRes.trangThai, "duyet");

const formReview: FormThongTin = {
  ...formTrong("review"),
  linkNguon: "https://facebook.com/groups/uit.k21",
  tieuDe: "Môi trường học tập năng động và cơ sở vật chất hiện đại",
  noiDung: "Trường có trang thiết bị thực hành đầy đủ, giảng viên hỗ trợ tận tình.",
  nguoiVietLa: "sinh_vien",
};
const loiReview = kiemTraForm("review", formReview);
assert.equal(Object.keys(loiReview).length, 0);

const bodyReview = bodyTuForm("review", formReview);
const taoReviewRes = await xuLyDuLieuMau("POST", "/thong-tin", {}, {
  maTruong: "QSC",
  loai: "review",
  linkNguon: formReview.linkNguon,
  duLieu: bodyReview.duLieu,
  trangThai: "duyet",
}) as ThongTinCms;
assert.equal(taoReviewRes.trangThai, "duyet");
console.log("✓ Test 5 Passed: CRUD Nơi lưu trú và Đánh giá thành công.");

// =========================================================================
// TEST 6: Kiểm tra Tính toán Tiến độ & Đạt Chuẩn 5/5 Mục
// =========================================================================
const chiTietQSC = await xuLyDuLieuMau("GET", "/truong/QSC", {}) as ChiTietTruongApi;
assert.ok(chiTietQSC.kenh, "Phải có kênh thông tin");
assert.equal(chiTietQSC.thongTin.filter((t) => t.trangThai === "duyet").length >= 4, true);
assert.equal(chiTietQSC.tienDo.du, true, "Trường QSC phải đạt chuẩn 100% (5/5 mục)");
assert.equal(chiTietQSC.tienDo.thieu.length, 0, "Không còn mục nào bị thiếu");
console.log("✓ Test 6 Passed: Tiến độ 5/5 mục tính toán chính xác.");

// =========================================================================
// TEST 7: Snapshot Mapping sang Web Học Sinh
// =========================================================================
const banGhiDaDuyet: ThongTinTruong[] = chiTietQSC.thongTin
  .filter((t) => t.trangThai === "duyet")
  .map((t) => ({
    id: t.id,
    maTruong: t.maTruong,
    loai: t.loai,
    nam: t.nam,
    linkNguon: t.linkNguon,
    trangThai: "duyet" as const,
    phienBan: t.phienBan ?? 1,
    luc: t.luc,
    duLieu: t.duLieu as any,
  }));

const banChup = dungBanChup(
  [chiTietQSC.kenh as BanGhiTruong],
  banGhiDaDuyet,
  new Date()
);
assert.equal(banChup.phienBan, 1);
assert.ok(banChup.truong.QSC.websiteTuyenSinhUrl);
console.log("Các loại bản ghi trong banChup:", banChup.thongTin.QSC.map((x) => x.loai));
assert.ok(banChup.thongTin.QSC.length >= 4, `Số bản ghi: ${banChup.thongTin.QSC?.length}`);

console.log("✓ Test 7 Passed: Snapshot JSON map 100% sang Web Học Sinh.");
console.log("\n=======================================================");
console.log("🎉 TẤT CẢ 7 TEST SUITES CRUD & DATA MAPPING ĐỀU PASS 100%!");
console.log("=======================================================");
