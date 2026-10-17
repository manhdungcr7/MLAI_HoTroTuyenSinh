import "./nap-du-lieu";
import assert from "node:assert/strict";
import { LUA_CHON, timLuaChon } from "../src/data/lua-chon-that";
import raw from "../src/data/du-lieu-that.json";
import yearly from "../src/data/nguon-nam.json";
import cmsIndex from "../cms/src/du-lieu-truong/chuong-trinh-truong.json";
import { hopNhatLuaChonVaCms } from "../src/engine/du-lieu-tuyen-sinh/hop-nhat";
import type { SnapshotDiemChuanHieuChinh } from "../src/engine/du-lieu-tuyen-sinh/kieu";
import { kiemTraData, kiemTraNguonDiemChuan } from "../cms/functions/_thu-vien/ban-ghi-d1";
import { kiemNguonMcp } from "../cms/functions/_thu-vien/dong-gop-kiem";
import { vanBanCuaMuc } from "../functions/_thu-vien/ai/chi-muc";
import { loadCatalog, programDetails } from "../src/capabilities/catalog";

const nguon = { url: "https://truong.edu.vn/diem-trung-tuyen", tieuDe: "Điểm trúng tuyển", donViCongBo: "Trường", ngayKiemChung: "2026-10-17" };
const base = { ...LUA_CHON[0], id: "abc-1", maTruong: "ABC", truong: "ABC", phuongThuc: "THPT", toHopXet: ["A00", "A01"], diemMin: 26, diemMax: 26, namDiem: 2025, diemTheoNam: { "2025": 26 } };
const dc = (extra: Partial<SnapshotDiemChuanHieuChinh> = {}): SnapshotDiemChuanHieuChinh => ({
  id: "abc-1", maTruong: "ABC", maNganh: "", nam: 2026, phuongThuc: "THPT", toHop: "TATCA", diemChuan: 27,
  loaiDiem: "diem_chuan", thangDiem: 30, nguon, capNhatLuc: "2026-10-17", ...extra,
});
const merge = (...scores: SnapshotDiemChuanHieuChinh[]) => hopNhatLuaChonVaCms([base], { cutoffScores: scores })[0];

// Điểm 15 có thể là điểm chuẩn thật; cấm suy loại điểm từ trị số.
assert.equal(merge(dc({ diemChuan: 15 })).diemMin, 15);
assert.ok(LUA_CHON.every((l) => !l.canLuuY.some((s) => s.includes("Mức 15,0 điểm là điểm sàn") || s.includes("đã quy đổi từ điểm ĐGNL/ĐGTD"))));
for (const loaiDiem of ["diem_san", "du_kien", "chua_ro", undefined] as const) {
  assert.equal(merge(dc({ loaiDiem })).diemMin, 26);
}
for (const extra of [{ maTruong: "XYZ" }, { phuongThuc: "HOC_BA" }, { thangDiem: 100 }, { diemChuan: NaN }, { diemChuan: Infinity }, { nguon: undefined as never }]) {
  assert.equal(merge(dc(extra)).diemMin, 26);
}
// Sửa năm cũ chỉ cập nhật lịch sử; năm mới nhất và nguồn mới nhất không lùi.
const old = merge(dc({ nam: 2024, diemChuan: 24 }));
assert.equal(old.diemTheoNam?.["2024"], 24);
assert.equal(old.namDiem, 2025); assert.equal(old.diemMin, 26);
const both = merge(dc(), dc({ nam: 2024, diemChuan: 24 }));
assert.equal(both.diemTheoNam?.["2024"], 24); assert.equal(both.diemTheoNam?.["2026"], 27);
assert.equal(both.linkNguon, nguon.url);
// Không lan điểm một tổ hợp sang tổ hợp khác, không lấy max/median khi nguồn mâu thuẫn.
assert.equal(merge(dc({ toHop: "A00" })).diemMin, 26);
assert.equal(merge(dc({ toHop: "A00" }), dc({ toHop: "A01" })).diemMin, 27);
assert.equal(merge(dc({ toHop: "A00" }), dc({ toHop: "A01", diemChuan: 28 })).diemMin, 26);
assert.equal(merge(dc(), dc({ diemChuan: 28 })).diemMin, 26);
assert.equal(merge(dc(), dc({ toHop: "A00", diemChuan: 28 })).diemMin, 26);

const san = { ...nguon, tieuDe: "Thông báo ngưỡng đảm bảo chất lượng đầu vào năm 2026" };
assert.equal(merge(dc({ nguon: san })).diemMin, 26);
assert.throws(() => kiemTraNguonDiemChuan("cutoff_score", san));
assert.doesNotThrow(() => kiemTraNguonDiemChuan("admission", san));
assert.doesNotThrow(() => kiemTraData(dc(), "ABC-DC2026", "cutoff_score"));
for (const extra of [{ loaiDiem: "diem_san" }, { loaiDiem: undefined }, { id: "xyz-1" }, { diemChuan: "27" }, { diemChuan: 31 }, { thangDiem: undefined }, { nam: 2025.5 }]) {
  assert.throws(() => kiemTraData({ ...dc(), ...extra }, "ABC-DC2026", "cutoff_score"));
}
assert.equal(kiemNguonMcp({ loai: "thong_bao", url: nguon.url, trang: 1, trichDan: "Điểm sàn nhận hồ sơ THPT 2025: 22 điểm" }).ok, false);
assert.equal(vanBanCuaMuc({ loai: "cutoff_score", id: "x", phienBan: "x", data: { ...dc(), loaiDiem: "diem_san" } }), null);
assert.equal(vanBanCuaMuc({ loai: "cutoff_score", id: "x", phienBan: "x", data: { ...dc(), nguon: san } }), null);
// HTTP/MCP capability cũng không trả điểm sàn dưới tên diemChuan, không lùi về năm cũ để che thiếu điểm mới.
const catalog = await loadCatalog();
for (const kind of ["diem_san", "du_kien", "chua_ro"] as const) {
  const data = programDetails({ ...catalog.records[0], diem: { "2024": 24, "2025": 18 }, scoreEvidence: {
    "2025": { kind, score: 18, scale: 30, sourceUrl: nguon.url, checkedAt: "2026-10-17", checkedBy: "test fixture", independentReviewer: null, includesPriority: null },
  } }, catalog);
  assert.equal(data.diemChuan, null); assert.equal(data.diemTheoNam["2025"], null); assert.equal(data.namDiem, 2025);
  assert.equal(data.diemTheoNam["2024"], 24);
}

// Đối chiếu bảng ảnh chính thức UIT 2025: 13 ngành đã có ID; bảng còn ngành Truyền thông đa phương tiện chưa có ID.
const uit2025 = { "qsc-0dfcc28e": 26.27, "qsc-2064f6c3": 26.6, "qsc-d3b4cfb0": 24.2, "qsc-24737475": 24.7,
  "qsc-aebf762b": 24.2, "qsc-e5c81a10": 27.7, "qsc-77d4a3a1": 27.2, "qsc-a65bd00b": 25.3,
  "qsc-81e88be7": 26, "qsc-255c8fcc": 24, "qsc-89da7ac2": 27, "qsc-cab2344d": 24.57, "qsc-670037f1": 29.6 };
for (const [id, score] of Object.entries(uit2025)) {
  const l = timLuaChon(id)!;
  assert.equal(l.diemMin, score); assert.equal(l.namDiem, 2025);
  assert.equal(l.daKiemChung, false, "Đối chiếu bằng agent chưa phải thẩm định độc lập");
  const r = raw.find((r) => r.id === id)!;
  assert.equal(r.scoreEvidence?.["2025"].includesPriority, true);
  assert.equal(r.scoreEvidence?.["2025"].independentReviewer, null);
  assert.ok((yearly as Record<string, { nam: string; url: string }[]>)[id].some((s) => s.nam === "2025" && s.url === "https://tuyensinh.uit.edu.vn/node/4147"));
}
// Danh mục để cộng tác viên chọn chương trình phải khớp danh mục app; chặn ID mồ côi và số liệu cũ.
const indexRows = Object.values(cmsIndex).flat() as [string, string, number | null, number | null, string][];
assert.deepEqual(new Set(indexRows.map(([id]) => id)), new Set(LUA_CHON.map((l) => l.id)));
assert.equal(indexRows.length, LUA_CHON.length);
for (const [id, name, year, score, method] of indexRows) {
  const l = timLuaChon(id)!;
  assert.equal(name, l.nganh, id); assert.equal(year, l.namDiem, id);
  assert.equal(score, l.diemMin, id); assert.equal(method, l.phuongThuc, id);
}
console.log("✓ Chất lượng dữ liệu: loại điểm, năm, phương thức, tổ hợp, nguồn và đối chiếu UIT 2025");
