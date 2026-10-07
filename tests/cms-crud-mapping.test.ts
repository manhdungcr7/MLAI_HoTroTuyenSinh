// Logic thuần của CMS (không dữ liệu mẫu, không mạng): biểu mẫu -> data, tiến độ từ bản ghi, lọc/sắp xếp danh sách trường, so sánh bản.
import assert from "node:assert/strict";
import { formTrong, bodyTuForm, kiemTraForm, type FormThongTin } from "../cms/src/du-lieu-truong/bieu-mau";
import { banDaiDien, dataTuForm, entityIdCho, maTruongCua, nhomTheoTruong, tienDoTuBanGhi } from "../cms/src/du-lieu-truong/mo-hinh";
import { gopTruong, locTruong, sapXepTruong, tiLeDu } from "../cms/src/du-lieu-truong/loc-truong";
import { soSanhBan } from "../cms/src/du-lieu-truong/so-sanh";
import { layDanhSachTenTruong } from "../cms/src/trang-thai/ten-truong";
import type { BanGhiCms } from "../src/engine/du-lieu-tuyen-sinh/kieu";

let n = 0;
const ok = (ten: string) => console.log(`✓ ${++n}. ${ten}`);

const ban = (o: Partial<BanGhiCms> & { entityType: string; entityId: string }): BanGhiCms => ({
  id: `${o.entityType}-${o.entityId}-${o.version ?? 1}`, version: 1, status: "DRAFT", data: {},
  source: { url: "https://example.edu.vn/a", tieuDe: "Nguồn", donViCongBo: "Trường", ngayKiemChung: "2026-01-01T00:00:00Z", nguoiKiemChung: "a@b.c" },
  importance: "normal", changeNote: "", createdBy: "a@b.c", createdAt: "2026-01-01T00:00:00Z", updatedBy: "a@b.c", updatedAt: "2026-01-01T00:00:00Z", ...o,
} as BanGhiCms);

// 1. Tập trường lấy từ cùng tệp với máy chủ
const ds = await layDanhSachTenTruong();
assert.ok(ds.length >= 50);
assert.ok(ds.every((t) => t.maTruong && t.ten));
assert.equal(ds.find((t) => t.maTruong === "BKA")?.ten, "ĐH Bách Khoa Hà Nội");
ok("danh sách trường khớp tệp máy chủ");

// 2. Mã trường từ entityId
assert.equal(maTruongCua("BKA"), "BKA");
assert.equal(maTruongCua("bka-HP2026-x"), "BKA");
ok("mã trường từ entityId");

// 3. Học phí: form -> kiểm tra -> body -> data
const hp: FormThongTin = { ...formTrong("hoc_phi"), nam: "2026", linkNguon: "https://tuyensinh.uit.edu.vn/hoc-phi", donVi: "trieu_nam", mucThap: "35", mucCao: "45", phamVi: "Chương trình chuẩn" };
assert.deepEqual(kiemTraForm("hoc_phi", hp), {});
const b = bodyTuForm("hoc_phi", hp);
assert.equal(b.nam, 2026);
assert.equal((b.duLieu as { mucThap: number }).mucThap, 35);
const id = entityIdCho("hoc_phi", "QSC", hp);
assert.equal(id, "QSC-HP2026-chuongtrinhchuan");
const d = dataTuForm("hoc_phi", "QSC", id, hp);
assert.equal(d.maTruong, "QSC");
assert.equal(d.id, id);
assert.equal(d.mucCao, 45);
assert.ok(Object.keys(kiemTraForm("hoc_phi", { ...hp, mucThap: "50", mucCao: "40" })).length > 0, "mức cao < mức thấp phải báo lỗi");
ok("học phí: form, kiểm tra, entityId, data");

// 4. Nơi lưu trú và lưu ý
const nlt: FormThongTin = { ...formTrong("noi_luu_tru"), linkNguon: "https://ktx.edu.vn/gia", coKyTucXa: "co", ktxThap: "300", ktxCao: "600", khuTro: "nhieu", troThap: "1500", troCao: "3000", khoangCachKm: "2,5" };
assert.deepEqual(kiemTraForm("noi_luu_tru", nlt), {});
assert.equal(entityIdCho("noi_luu_tru", "QSC", nlt), "QSC-NLT");
assert.equal((dataTuForm("noi_luu_tru", "QSC", "QSC-NLT", nlt)).khoangCachKm, 2.5);
assert.ok(Object.keys(kiemTraForm("noi_luu_tru", { ...nlt, coKyTucXa: "" as never })).length > 0);
const ly: FormThongTin = { ...formTrong("luu_y"), linkNguon: "https://tuyensinh.edu.vn/ly", tieuDe: "Hạn nộp hồ sơ", noiDung: "Nộp trước ngày 30/6 để kịp xét tuyển." };
assert.deepEqual(kiemTraForm("luu_y", ly), {});
assert.ok(entityIdCho("luu_y", "QSC", ly).startsWith("QSC-LY"));
ok("nơi lưu trú và lưu ý");

// 5. Tiến độ và bản đại diện
const bgs = [
  ban({ entityType: "school", entityId: "QSC", status: "APPROVED", data: { websiteTuyenSinhUrl: "https://uit.edu.vn" } }),
  ban({ entityType: "tuition", entityId: "QSC-HP2026-a", status: "PUBLISHED" }),
  ban({ entityType: "scholarship", entityId: "QSC-HB-a", status: "DRAFT" }),
  ban({ entityType: "noi_luu_tru", entityId: "QSC-NLT", status: "SUBMITTED" }),
  ban({ entityType: "review", entityId: "QSC-RV-1", status: "ARCHIVED" }),
  ban({ entityType: "tuition", entityId: "BKA-HP2026-a", status: "PUBLISHED" }),
];
const td = tienDoTuBanGhi("QSC", bgs);
assert.deepEqual([...td.co].sort(), ["hoc_phi", "kenh", "noi_luu_tru"]);
assert.deepEqual([...td.thieu].sort(), ["hoc_bong", "review"]);
assert.equal(td.du, false);
assert.equal(tiLeDu(td), 60);
assert.equal(nhomTheoTruong(bgs).get("QSC")?.length, 5);
const cu = ban({ entityType: "tuition", entityId: "QSC-HP2026-a", status: "PUBLISHED", version: 1 });
const moi = ban({ entityType: "tuition", entityId: "QSC-HP2026-a", status: "DRAFT", version: 2 });
const dd = banDaiDien([cu, moi, ban({ entityType: "review", entityId: "QSC-RV-1", status: "SUPERSEDED" })]);
assert.equal(dd.length, 1);
assert.equal(dd[0].status, "DRAFT");
ok("tiến độ, nhóm theo trường, bản đại diện");

// 6. Gộp, lọc, sắp xếp danh sách trường
const dong = gopTruong(
  [
    { maTruong: "QSC", ten: "ĐH Công nghệ Thông tin", tienDo: td },
    { maTruong: "BKA", ten: "ĐH Bách Khoa Hà Nội", tienDo: tienDoTuBanGhi("BKA", bgs) },
  ],
  ["BKA"],
);
assert.equal(dong.find((x) => x.ma === "BKA")?.giaoChoToi, true);
assert.equal(dong.find((x) => x.ma === "QSC")?.giaoChoToi, false);
assert.deepEqual(locTruong(dong, "bach khoa", new Set()).map((x) => x.ma), ["BKA"]);
assert.deepEqual(locTruong(dong, "", new Set(["giaoChoToi"])).map((x) => x.ma), ["BKA"]);
assert.deepEqual(locTruong(dong, "", new Set(["thieuHocPhi"])).map((x) => x.ma), []);
assert.equal(sapXepTruong(dong, "thieu")[0].ma, "BKA");
ok("gộp, lọc, sắp xếp danh sách trường");

// 7. So sánh bản cũ - mới
const kq = soSanhBan(
  ban({ entityType: "tuition", entityId: "QSC-HP2026-a", data: { mucThap: 35, mucCao: 45, donVi: "trieu_nam" } }),
  ban({ entityType: "tuition", entityId: "QSC-HP2026-a", version: 2, data: { mucThap: 35, mucCao: 50, donVi: "trieu_nam" } }),
);
assert.ok(kq.some((x) => x.khoa === "mucCao" && x.cu.includes("45") && x.moi.includes("50")));
assert.ok(!kq.some((x) => x.khoa === "mucThap"));
ok("so sánh bản cũ và mới");

console.log(`\nXong ${n}/7 nhóm kiểm thử logic CMS.`);
