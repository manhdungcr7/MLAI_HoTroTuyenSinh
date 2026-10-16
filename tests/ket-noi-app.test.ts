import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử kết nối Claude/ChatGPT phía app: dựng bản chụp, không lộ thông tin cá nhân, áp đề xuất, đọc khóa cục bộ hỏng.
// Chạy: npx tsx tests/ket-noi-app.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU, tim } from "../src/data/lua-chon-mau";
import { taoHoSoMau } from "../src/state/mau";
import { GIOI_HAN_BAN_CHUP, lamSachBanChup, type DeXuat } from "../src/engine/ket-noi-kieu";
import { KHOA_KET_NOI, apDungDeXuat, docKetNoi, ghiKetNoi, taoBanChup, xoaKetNoi } from "../src/state/ket-noi";
import type { AppState } from "../src/state/store";

const THOI_DIEM = new Date("2026-10-16T10:00:00+07:00");

/** Bộ nhớ giả thay localStorage (Node không có). */
function khoGia(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
  } as Storage;
}

const demDe = (id: string): DeXuat => ({ id, loai: "them-nguyen-vong", tomTat: "Thêm ngành", duLieu: {}, taoLuc: 0 });

// ---- 1. Bản chụp từ hồ sơ mẫu: không mất nguyện vọng/kế hoạch khi làm sạch ----
const mau = taoHoSoMau();
const TEN_GIA = "Nguyễn Thị Tên Giả Kiểm Tra";
const s: AppState = { ...mau, hoSo: { ...mau.hoSo, hoTen: TEN_GIA } };
const b = taoBanChup(s, THOI_DIEM);

assert.ok(lamSachBanChup(b), "bản chụp phải qua được lamSachBanChup");
assert.deepEqual(lamSachBanChup(b), b, "làm sạch lần hai không được làm mất hoặc đổi dữ liệu");
assert.equal(b.nguyenVong.length, Math.min(s.nguyenVong.length, GIOI_HAN_BAN_CHUP.nguyenVong), "đủ nguyện vọng (tối đa 30)");
assert.deepEqual(b.nguyenVong.map((n) => n.id), s.nguyenVong.slice(0, 30), "giữ đúng thứ tự nguyện vọng");
assert.deepEqual(b.nguyenVong.map((n) => n.thuTu), b.nguyenVong.map((_, i) => i + 1), "thuTu đánh liên tiếp từ 1");
assert.ok(b.goiY.length <= GIOI_HAN_BAN_CHUP.goiY, "gợi ý tối đa 20");
assert.equal(b.keHoachTuan.length, Math.min(lamSachBanChup(b)!.keHoachTuan.length, GIOI_HAN_BAN_CHUP.suKien));
assert.ok(b.capNhat.startsWith("2026-10-16"), "capNhat là ISO của thời điểm dựng");

// ---- 2. Không chứa tên, liên hệ, lịch sử chat ----
const chuoi = JSON.stringify(b);
assert.ok(!chuoi.includes("Tên Giả Kiểm Tra"), "không được chứa họ tên");
for (const khoa of ["hoTen", "email", "sdt", "soDienThoai", "lichSu", "loiNhan", "lienHe"]) {
  assert.ok(!chuoi.includes(`"${khoa}"`), `không được có trường ${khoa}`);
}

// ---- 3. Mọi id gợi ý và nguyện vọng đều là chương trình thật ----
for (const g of b.goiY) {
  assert.ok(tim(g.id), `gợi ý ${g.id} phải tồn tại`);
  assert.ok(LUA_CHON_MAU.some((l) => l.id === g.id), `gợi ý ${g.id} phải nằm trong danh mục`);
}
for (const n of b.nguyenVong) assert.ok(tim(n.id), `nguyện vọng ${n.id} phải tồn tại`);
for (const n of b.nguyenVong) assert.ok(Object.keys(n.diemChuan ?? {}).length <= 2, "điểm chuẩn tối đa 2 năm");

// ---- 4. Điểm thi thử gom theo ngày: chỉ ghi tổng khi đủ môn của tổ hợp mục tiêu ----
const cs: AppState = {
  ...s,
  mucTieu: { luaChonId: "khong-co", phuongThuc: "THPT", maToHop: "A00", toHop: ["toan", "vatLy", "hoaHoc"], diemMucTieu: 24, ngayThi: "2027-06-20" },
  diemThi: [
    { mon: "toan", diem: 8, ngay: "2026-10-01" }, { mon: "vatLy", diem: 7, ngay: "2026-10-01" }, { mon: "hoaHoc", diem: 6, ngay: "2026-10-01" },
    { mon: "toan", diem: 9, ngay: "2026-10-05" },
  ],
};
const bt = taoBanChup(cs, THOI_DIEM);
assert.deepEqual(bt.diemThi, [{ ngay: "2026-10-01", tong: 21, toHop: "A00" }, { ngay: "2026-10-05" }]);
assert.equal(bt.mucTieu, null, "mục tiêu không tra được chương trình thì để null, không bịa");

// ---- 5. Áp đề xuất ----
const [a, b2, c] = [LUA_CHON_MAU[0].id, LUA_CHON_MAU[1].id, LUA_CHON_MAU[2].id];
const co = (ids: string[]): AppState => ({ ...s, nguyenVong: ids });
const goc = co([a, b2]);

const idLa = apDungDeXuat(goc, { ...demDe("d2"), duLieu: { idChuongTrinh: "khong-ton-tai" } });
assert.equal(idLa.ok, false, "id lạ bị bỏ");

const themDau = apDungDeXuat(goc, { ...demDe("d3"), duLieu: { idChuongTrinh: c, viTri: 0 } });
assert.ok(themDau.ok && themDau.capNhat.nguyenVong?.join() === [c, a, b2].join(), "viTri 0 đưa lên đầu");
assert.ok(themDau.ok && themDau.chu.includes("thứ 1"), "báo đúng vị trí");

const themCuoi = apDungDeXuat(goc, { ...demDe("d4"), duLieu: { idChuongTrinh: c, viTri: 99 } });
assert.ok(themCuoi.ok && themCuoi.capNhat.nguyenVong?.join() === [a, b2, c].join(), "viTri ngoài danh sách thì xuống cuối");

const trung = apDungDeXuat(goc, { ...demDe("d5"), duLieu: { idChuongTrinh: a, viTri: 0 } });
assert.ok(trung.ok && trung.capNhat.nguyenVong === undefined, "id đã có thì không nhân đôi");
assert.ok(trung.ok && trung.chu.includes("đã có"), "báo đã có");

const sapXep = apDungDeXuat(co([a, b2, c]), { ...demDe("d6"), loai: "sap-xep-nguyen-vong", duLieu: { thuTuMoi: [b2, "la", a] } });
assert.ok(sapXep.ok && sapXep.capNhat.nguyenVong?.join() === [b2, a, c].join(), "sắp lại, bỏ id lạ, giữ phần còn lại ở cuối");
assert.deepEqual(goc.nguyenVong, [a, b2], "không đổi trạng thái gốc");

const loaiKhac = apDungDeXuat(goc, { ...demDe("d7"), loai: "cap-nhat-diem", duLieu: {} });
assert.equal(loaiKhac.ok, false, "loại chưa áp được trong app thì không tự đổi");

// ---- 6. Khóa cục bộ ----
const kho = khoGia();
assert.equal(docKetNoi(kho), null, "chưa có khóa thì trả null");
ghiKetNoi({ ma: "ma-bi-mat-123456", hetHan: "2026-11-16T00:00:00.000Z" }, kho);
assert.deepEqual(docKetNoi(kho), { ma: "ma-bi-mat-123456", hetHan: "2026-11-16T00:00:00.000Z" });
assert.ok(KHOA_KET_NOI.startsWith("nvai:"), "khóa nằm trong nhóm nvai: để Xóa hết xóa được");

kho.setItem(KHOA_KET_NOI, "{không phải json");
assert.equal(docKetNoi(kho), null, "JSON hỏng thì trả null, không ném lỗi");
kho.setItem(KHOA_KET_NOI, JSON.stringify({ ma: 123, hetHan: "x" }));
assert.equal(docKetNoi(kho), null, "sai kiểu thì trả null");
kho.setItem(KHOA_KET_NOI, JSON.stringify({ ma: "co dau cach", hetHan: "x" }));
assert.equal(docKetNoi(kho), null, "mã có khoảng trắng thì không dùng");
kho.setItem(KHOA_KET_NOI, "null");
assert.equal(docKetNoi(kho), null, "giá trị null thì trả null");
assert.equal(docKetNoi(null), null, "trình duyệt chặn lưu trữ thì trả null");
xoaKetNoi(kho);
assert.equal(kho.getItem(KHOA_KET_NOI), null, "xóa khóa cục bộ");

// ---- 7. Làm sạch không nhận dữ liệu sai hình dạng ----
assert.equal(lamSachBanChup(null), null);
assert.equal(lamSachBanChup({ phienBan: 2 }), null);
assert.equal(lamSachBanChup("chuoi"), null);

console.log("ket-noi-app.test: ok");
