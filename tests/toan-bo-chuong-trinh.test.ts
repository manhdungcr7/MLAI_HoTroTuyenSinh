import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Chạy mọi chương trình qua các hàm hiển thị với nhiều kiểu học sinh: không được ra NaN, undefined, số vô lý hay câu rỗng.
// Lỗi ở đây hiện thẳng ra trước mắt học sinh, nên kiểm toàn bộ dữ liệu thay vì vài ví dụ. Chạy: npx tsx tests/toan-bo-chuong-trinh.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { coHocPhi, hocPhiChu } from "../src/data/lua-chon-phu";
import { boiCanhTu, danhGia } from "../src/features/kham-pha/phu-hop";
import { duBaoCua } from "../src/features/kham-pha/du-bao";
import { tongChoLuaChon, diemDayDu } from "../src/features/kham-pha/to-hop";
import { goiYDanhSach } from "../src/features/nguyen-vong/goi-y-danh-sach";
import { dungDanhSach, demNhan, xetCoCau, ketLuan, chamDiem } from "../src/features/nguyen-vong/tinh-toan";
import { tim } from "../src/data/lua-chon-mau";
import { taoHoSoMau, TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { tenGon } from "../src/data/lua-chon-that";
import type { AppState } from "../src/state/store";

const XAU = /NaN|undefined|\[object|Infinity|null\b/;
const mau = taoHoSoMau();
const bien = (hoSo: Partial<AppState["hoSo"]>, them: Partial<AppState> = {}): AppState => ({ ...mau, ...them, hoSo: { ...mau.hoSo, ...hoSo } });

const DIEM = (v: number | null) => ({ toan: v, vatLy: v, hoaHoc: v, sinh: v, nguVan: v, tiengAnh: v });
const nguoi: [string, AppState][] = [
  ["mẫu", mau],
  ["trống", TRANG_THAI_BAN_DAU],
  ["giỏi 9,5 + ưu tiên", bien({ diem: DIEM(9.5), uuTienTuyenSinh: { khuVuc: "KV1", doiTuong: "UT1" } })],
  ["yếu 4", bien({ diem: DIEM(4), nganSach: "duoi30", khuVuc: ["Hà Nội"], nganhQuanTam: ["Y Dược"] })],
  ["đủ môn thêm", bien({ diem: DIEM(7), diemThem: { lichSu: 8, diaLy: 8, gdktpl: 7, tinHoc: 9, congNghe: 7 }, tinh: "Cần Thơ", khuVuc: ["Cần Thơ", "Tỉnh khác"], hocXaNha: false })],
  ["thiếu môn", bien({ diem: { toan: 8, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: 8 } })],
  ["điểm biên 10 và 0", bien({ diem: { toan: 10, vatLy: 0, hoaHoc: 10, sinh: 0, nguVan: 10, tiengAnh: 0 } })],
];

let soKiem = 0;
for (const lc of LUA_CHON) {
  const ten = `${lc.id} (${lc.nganh.slice(0, 40)})`;
  // Thông tin tĩnh
  for (const x of [lc.nganh, lc.truong, lc.tenTruong, lc.khuVuc, tenGon(lc.nganh).ten, tenGon(lc.nganh).them ?? "-", coHocPhi(lc) ? hocPhiChu(lc) : "chưa có"])
    assert.ok(typeof x === "string" && x.trim() !== "" && !XAU.test(x), `${ten}: chữ lỗi "${x}"`);
  assert.ok(Number.isFinite(lc.diemMin) && lc.diemMin >= 5 && lc.diemMin <= 1200, `${ten}: điểm chuẩn vô lý ${lc.diemMin}`);
  assert.ok(lc.id && tim(lc.id)?.id === lc.id, `${ten}: tim() không trả lại đúng chương trình`);
  if (coHocPhi(lc)) assert.ok((lc.hocPhiMin as number) > 0 && (lc.hocPhiMax as number) >= (lc.hocPhiMin as number) && (lc.hocPhiMax as number) < 1000, `${ten}: học phí vô lý`);
  const db = duBaoCua(lc);
  if (db) assert.ok(db.thap <= db.cao && Number.isFinite(db.thap) && Number.isFinite(db.cao) && db.cao <= 30, `${ten}: dự báo vô lý`);
  // Theo từng học sinh
  for (const [tenNguoi, s] of nguoi) {
    const bc = boiCanhTu(s);
    const kq = danhGia(lc, bc);
    for (const x of [kq.tomTat, kq.giaiThich, ...kq.tot, ...kq.luuY]) assert.ok(typeof x === "string" && !XAU.test(x), `${ten} / ${tenNguoi}: chữ lỗi "${x}"`);
    if (kq.tong !== null) assert.ok(kq.tong >= 0 && kq.tong <= 30.001, `${ten} / ${tenNguoi}: tổng điểm vô lý ${kq.tong}`);
    if (kq.chenh !== null) assert.ok(Number.isFinite(kq.chenh), `${ten} / ${tenNguoi}: chênh không phải số`);
    const t = tongChoLuaChon(lc, diemDayDu(s));
    assert.ok(t.tong === null || (Number.isFinite(t.tong) && t.tong <= 30.001), `${ten} / ${tenNguoi}: tong vô lý`);
  }
}
soKiem += LUA_CHON.length * nguoi.length;

// Gợi ý danh sách và nhận xét danh sách cho từng kiểu học sinh
for (const [tenNguoi, s] of nguoi) {
  const diem = diemDayDu(s);
  const goiY = goiYDanhSach(diem, s.hoSo);
  assert.ok(goiY.length <= 6, `${tenNguoi}: gợi ý quá 6 nguyện vọng (${goiY.length})`);
  assert.equal(new Set(goiY.map((g) => g.lc.id)).size, goiY.length, `${tenNguoi}: gợi ý trùng`);
  for (const g of goiY) for (const x of g.lyDo) assert.ok(!XAU.test(x), `${tenNguoi}: lý do lỗi "${x}"`);
  const ds = dungDanhSach(goiY.map((g) => g.lc.id), diem, tim);
  const dem = demNhan(ds);
  const c = xetCoCau(dem);
  const kl = ketLuan(c);
  for (const x of [kl.tieuDe, kl.hienTrang, kl.lyDo]) assert.ok(typeof x === "string" && !XAU.test(x), `${tenNguoi}: kết luận lỗi "${x}"`);
  for (const d of chamDiem(ds, s.hoSo, ds.some((x) => x.nhan !== null))) assert.ok(!XAU.test(`${d.nhanXet} ${d.chiTiet}`) && (d.diem === null || (d.diem >= 0 && d.diem <= 100)), `${tenNguoi}: chấm điểm lỗi ${d.khoa}`);
}
// Học sinh điểm cao phải ra gợi ý; học sinh không có điểm thì không có gợi ý (không bịa)
assert.ok(goiYDanhSach(diemDayDu(bien({ diem: DIEM(8) })), bien({ diem: DIEM(8) }).hoSo).length >= 4, "học sinh có điểm phải nhận được gợi ý");
assert.equal(goiYDanhSach(diemDayDu(TRANG_THAI_BAN_DAU), TRANG_THAI_BAN_DAU.hoSo).length, 0, "chưa có điểm thì không gợi ý");

console.log(`toan-bo-chuong-trinh: ${LUA_CHON.length} chương trình × ${nguoi.length} kiểu học sinh (${soKiem} lượt) không có chữ lỗi hay số vô lý`);
