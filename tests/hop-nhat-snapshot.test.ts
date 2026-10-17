import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Bản CMS xuất bản được hợp nhất vào dữ liệu thật: thiếu nguồn thì bỏ, không ghi đè số đã có bằng số suy ra.
import assert from "node:assert/strict";
import { hopNhatLuaChonVaCms, layChiTietTruongHopNhat } from "../src/engine/du-lieu-tuyen-sinh/hop-nhat";
import { chuanHoaChoSnapshot, taoSnapshotVaManifest } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import type { BanGhiCms } from "../src/engine/du-lieu-tuyen-sinh/kieu";
import { LUA_CHON_MAU, datDanhMuc, tim } from "../src/data/lua-chon-mau";
import { LUA_CHON } from "../src/data/lua-chon-that";
import type { LuaChon } from "../src/state/types";

const nguon = { url: "https://truong.example/de-an.pdf", tieuDe: "Đề án", donViCongBo: "Trường", ngayKiemChung: "2026-10-07" };
const lc = { id: "abc-1", truong: "ABC", maTruong: "ABC", tenTruong: "Trường ABC", nganh: "CNTT", hocPhiMin: 30, hocPhiMax: 30, nguonHocPhi: { nam: "2025", url: nguon.url, trang: 4 } } as unknown as LuaChon;

// 1) Bản ghi chỉ lặp lại số gốc: giữ nguyên, không kéo mức cao suy ra
const lai = hopNhatLuaChonVaCms([lc], { tuition: [{ id: "abc-1", maTruong: "ABC", nam: 2025, mucThap: 30, mucCao: 36, donVi: "trieu_nam", nguon, capNhatLuc: "x" }] });
assert.equal(lai[0].hocPhiMax, 30);
assert.equal(lai[0].nguonHocPhi?.trang, 4);

// 2) Bản ghi có số mới: ghi đè, không bịa số trang
const moi = hopNhatLuaChonVaCms([lc], { tuition: [{ id: "abc-1", maTruong: "ABC", nam: 2026, mucThap: 32, mucCao: 40, donVi: "trieu_nam", nguon: { ...nguon, url: "https://khac.example/hp" }, capNhatLuc: "x" }] });
assert.equal(moi[0].hocPhiMin, 32);
assert.equal(moi[0].nguonHocPhi?.trang, 0);

// 3) Thông tin trường: không có nguồn thì bỏ hết; có nguồn thì nhận
const khongNguon = layChiTietTruongHopNhat("ABC", [lc], {
  schools: [{ maTruong: "ABC", fanpageUrl: "https://facebook.com/ABC", kyTucXa: { coKyTuc: true, giaThangMin: 0.3 }, capNhatLuc: "x" }],
  scholarships: [{ id: "h1", maTruong: "ABC", tenHocBong: "A", giaTri: "1", dieuKien: "2", nguon: undefined as never, capNhatLuc: "x" }],
});
assert.equal(khongNguon?.fanpageUrl, undefined);
assert.equal(khongNguon?.kyTucXa, undefined);
assert.equal(khongNguon?.hocBong.length, 0);
const coNguon = layChiTietTruongHopNhat("ABC", [lc], { schools: [{ maTruong: "ABC", fanpageUrl: "https://facebook.com/ABC", nguon, capNhatLuc: "x" }] });
assert.equal(coNguon?.fanpageUrl, "https://facebook.com/ABC");

// 4) Học phí cấp trường chỉ lấy bản ghi cấp trường, không lấy học phí của một ngành
const hpNganh = layChiTietTruongHopNhat("ABC", [lc], { tuition: [{ id: "abc-1", maTruong: "ABC", nam: 2025, mucThap: 30, mucCao: 36, donVi: "trieu_nam", nguon, capNhatLuc: "x" }] });
assert.equal(hpNganh?.hocPhiMoiNhat, undefined);
// 5) Dữ liệu thật: tên ngắn của trường KHÁC mã trường (ĐH Bách Khoa Hà Nội / BKA). CMS gọi trường bằng mã.
const that = { id: "bka-1", truong: "ĐH Bách Khoa Hà Nội", maTruong: "BKA", tenTruong: "Đại học Bách khoa Hà Nội", nganh: "CNTT", phuongThuc: "THPT", toHopXet: ["A00"] } as unknown as LuaChon;
const ctThat = layChiTietTruongHopNhat("BKA", [that], {
  scholarships: [{ id: "h1", maTruong: "BKA", tenHocBong: "Tài năng", giaTri: "100%", dieuKien: "Thủ khoa", nguon, capNhatLuc: "x" }],
  community: [
    { id: "BKA", loai: "noi_luu_tru", maTruong: "BKA", noiDung: { coKyTucXa: "co" }, nguon, capNhatLuc: "x" },
    { id: "BKA-x", loai: "review", maTruong: "bka", noiDung: { tieuDe: "t", noiDung: "n" }, nguon: undefined as never, capNhatLuc: "x" }, // không nguồn: bỏ
    { id: "KHA", loai: "luu_y", maTruong: "KHA", noiDung: {}, nguon, capNhatLuc: "x" }, // trường khác: bỏ
  ],
});
assert.ok(ctThat, "tìm được trường bằng mã dù tên ngắn khác mã");
assert.equal(ctThat?.hocBong.length, 1);
assert.equal(ctThat?.congDong.length, 1, "chỉ giữ thông tin cộng đồng có nguồn và đúng trường");
const hpMa = hopNhatLuaChonVaCms([that], { tuition: [{ id: "BKA", maTruong: "BKA", nam: 2026, mucThap: 28, mucCao: 35, donVi: "trieu_nam", nguon, capNhatLuc: "x" }] });
assert.equal(hpMa[0].hocPhiMin, 28, "chương trình chưa có học phí thì lấy học phí cấp trường theo mã trường");
const coSan = hopNhatLuaChonVaCms([{ ...that, hocPhiMin: 40, hocPhiMax: 40 } as LuaChon], { tuition: [{ id: "BKA", maTruong: "BKA", nam: 2026, mucThap: 28, mucCao: 35, donVi: "trieu_nam", nguon, capNhatLuc: "x" }] });
assert.equal(coSan[0].hocPhiMin, 40, "học phí cấp trường không đè số riêng của chương trình");
// 6) Bộ dựng snapshot chuẩn hóa dữ liệu CMS: nguồn lấy từ bản ghi đã duyệt, không tin nguồn người dùng tự ghi trong data
const bg = (entityType: string, entityId: string, data: Record<string, unknown>): BanGhiCms => ({
  id: "r", entityType, entityId, version: 1, status: "PUBLISHED", data, source: { url: "https://hust.edu.vn/tuyen-sinh", tieuDe: "Tuyển sinh", donViCongBo: "ĐH Bách khoa", ngayKiemChung: "2026-10-09" },
  importance: "normal", changeNote: "x", createdBy: "a", createdAt: "t", updatedBy: "a", updatedAt: "2026-10-09T01:00:00Z",
} as unknown as BanGhiCms);
const hp = chuanHoaChoSnapshot(bg("tuition", "BKA-HP2026-chuan", { mucThap: 28, mucCao: 35, nam: 2026, donVi: "trieu_nam", nguon: { url: "https://gia.mao/x" } }), { mucThap: 28, mucCao: 35, nam: 2026, donVi: "trieu_nam", nguon: { url: "https://gia.mao/x" } });
assert.equal((hp.nguon as { url: string }).url, "https://hust.edu.vn/tuyen-sinh", "nguồn giả trong data bị thay bằng nguồn đã kiểm chứng");
assert.equal(hp.maTruong, "BKA"); assert.equal(hp.id, "BKA-HP2026-chuan"); assert.equal(hp.capNhatLuc, "2026-10-09T01:00:00Z");
const tr = chuanHoaChoSnapshot(bg("school", "BKA", { websiteTuyenSinhUrl: "https://ts.hust.edu.vn", fanpageUrl: "https://facebook.com/hust" }), { websiteTuyenSinhUrl: "https://ts.hust.edu.vn", fanpageUrl: "https://facebook.com/hust" });
assert.equal(tr.websiteTuyenSinh, "https://ts.hust.edu.vn");
const tb = chuanHoaChoSnapshot(bg("announcement", "TB-hocba-2026", { tieuDe: "t" }), { tieuDe: "t" });
assert.equal(tb.maTruong, undefined, "thông báo chung không bị gán mã trường giả");
const dc = chuanHoaChoSnapshot(bg("cutoff_score", "BKA-DC2025-bka-47a6194c-thpt-a00", { id: "bka-47a6194c", maNganh: "", nam: 2025, phuongThuc: "THPT", toHop: "A00", diemChuan: 26.5 }), { id: "bka-47a6194c", maNganh: "", nam: 2025, phuongThuc: "THPT", toHop: "A00", diemChuan: 26.5 });
assert.equal(dc.id, "bka-47a6194c", "điểm chuẩn giữ mã chương trình để ghép đúng ngành");
// Cả chuỗi: dựng snapshot rồi hợp nhất → ngành thật nhận điểm chuẩn mới; điểm DGNL thang 1200 không đè điểm THPT
const kq = await taoSnapshotVaManifest([bg("cutoff_score", "BKA-DC2025-bka-1-thpt-a00", { id: "bka-1", nam: 2026, phuongThuc: "THPT", toHop: "A00", diemChuan: 27.5, maNganh: "", loaiDiem: "diem_chuan", thangDiem: 30 }), bg("cutoff_score", "BKA-DC2025-bka-1-dgnl", { id: "bka-1", nam: 2026, phuongThuc: "DGNL", toHop: "KHONG", diemChuan: 900, maNganh: "" })], "2026.10.09.01");
const hn = hopNhatLuaChonVaCms([that], { cutoffScores: kq.datasets.cutoffScores.duLieu });
assert.equal(hn[0].diemMin, 27.5, "THPT ghi đè; DGNL 900 không được đè");
assert.equal(hn[0].namDiem, 2026);
// 7) Danh mục đang dùng được thay tại chỗ: mọi màn đọc LUA_CHON_MAU/tim thấy số mới, dữ liệu gốc không đổi
const soLuong = LUA_CHON_MAU.length, goc0 = LUA_CHON[0];
datDanhMuc([{ ...goc0, diemMin: 29.9 }, ...LUA_CHON.slice(1)]);
assert.equal(LUA_CHON_MAU.length, soLuong);
assert.equal(LUA_CHON_MAU[0].diemMin, 29.9, "mảng dùng chung thấy bản mới");
assert.equal(tim(goc0.id)?.diemMin, 29.9, "tim() thấy bản mới");
assert.notEqual(LUA_CHON[0].diemMin, 29.9, "dữ liệu gốc không bị sửa");
datDanhMuc([...LUA_CHON]);
assert.equal(tim(goc0.id)?.diemMin, goc0.diemMin);

console.log("✓ hợp nhất snapshot: nguồn bắt buộc, không ghi đè số gốc bằng số suy ra");
