// Bản CMS xuất bản được hợp nhất vào dữ liệu thật: thiếu nguồn thì bỏ, không ghi đè số đã có bằng số suy ra.
import assert from "node:assert/strict";
import { hopNhatLuaChonVaCms, layChiTietTruongHopNhat } from "../src/engine/du-lieu-tuyen-sinh/hop-nhat";
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
console.log("✓ hợp nhất snapshot: nguồn bắt buộc, không ghi đè số gốc bằng số suy ra");
