import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử điểm ưu tiên khu vực/đối tượng và việc nó đi vào tổng điểm so với điểm chuẩn. Chạy: npx tsx tests/diem-uu-tien.test.ts
import assert from "node:assert/strict";
import { diemUuTien, mucUuTien, tongCanDatDeDen, tongCoUuTien } from "../src/engine/diem-uu-tien";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { diemDayDu } from "../src/features/kham-pha/to-hop";
import { mucTieuDayDu } from "../src/state/chon";
import { taoHoSoMau } from "../src/state/mau";
import { chuanHoa } from "../src/state/chuan-hoa";

// 1) Mức theo quy định
assert.equal(mucUuTien(null), 0);
assert.equal(mucUuTien({ khuVuc: "KV1", doiTuong: "khong" }), 0.75);
assert.equal(mucUuTien({ khuVuc: "KV2-NT", doiTuong: null }), 0.5);
assert.equal(mucUuTien({ khuVuc: "KV3", doiTuong: "UT2" }), 1);
assert.equal(mucUuTien({ khuVuc: "KV1", doiTuong: "UT1" }), 2.75);

// 2) Dưới 22,5 cộng đủ; từ 22,5 giảm dần; 30 điểm thì không cộng
assert.equal(diemUuTien(20, 0.75), 0.75);
assert.equal(diemUuTien(22.4, 0.75), 0.75);
assert.equal(diemUuTien(22.5, 0.75), 0.75, "đúng 22,5: (30-22,5)/7,5 = 1 nên vẫn đủ mức");
assert.equal(diemUuTien(26.25, 0.75), 0.38, "(30-26,25)/7,5×0,75 = 0,375");
assert.equal(diemUuTien(26.25, 2.75), 1.38);
assert.equal(diemUuTien(30, 2), 0);
assert.equal(diemUuTien(25, 0), 0);
assert.equal(diemUuTien(Number.NaN, 1), 0);
assert.equal(tongCoUuTien(26.25, 0.75), 26.63);
assert.ok(tongCoUuTien(29.9, 2.75) <= 30 && tongCoUuTien(29.9, 2.75) > 29.9, "gần 30 thì cộng rất ít và không vượt 30");
// ưu tiên không bao giờ làm tổng giảm, và đơn điệu theo mức
for (let t = 10; t <= 30; t += 0.25) for (const m of [0.25, 0.75, 2, 2.75]) assert.ok(tongCoUuTien(t, m) >= t && diemUuTien(t, m) <= m + 1e-9);

// 3) Tổng cần đạt để đến mục tiêu
assert.equal(tongCanDatDeDen(26, 0), 26);
const r = tongCanDatDeDen(26, 0.75);
assert.ok(r < 26 && r > 25, `cần ít hơn 26 điểm một chút (${r})`);
assert.ok(Math.abs(tongCoUuTien(r, 0.75) - 26) <= 0.02, "cộng ưu tiên vào r thì đúng bằng mục tiêu");
assert.equal(tongCanDatDeDen(20, 0.75), 19.25, "dưới 22,5 thì trừ đủ mức");
assert.equal(tongCanDatDeDen(31, 2), 30, "đã tối đa mà vẫn chưa đủ thì trả 30");

// 4) Đi vào tổng điểm theo tổ hợp của ngành
const d = { toan: 8, vatLy: 8, tiengAnh: 8.5, hoaHoc: null, sinh: null, nguVan: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null };
const khong = tongChoLuaChon({ toHopXet: ["A01"] }, d);
assert.equal(khong.tong, 24.5); assert.equal(khong.uuTienCong, undefined);
const co = tongChoLuaChon({ toHopXet: ["A01"] }, { ...d, uuTien: 0.75 });
assert.equal(co.uuTienCong, 0.55, "24,5: (30-24,5)/7,5×0,75 = 0,55");
assert.equal(co.tong, 25.05);
// mỗi tổ hợp tính ưu tiên riêng theo tổng của nó, rồi mới chọn tổ hợp cao nhất
const hai = tongChoLuaChon({ toHopXet: ["A00", "A01"] }, { ...d, hoaHoc: 9, uuTien: 2 });
assert.equal(hai.toHop, "A00"); assert.ok(hai.tong! > 25 + 0.5);

// 5) Đi qua hồ sơ: điểm đầy đủ mang mức ưu tiên, và mục tiêu cần ít điểm thi hơn
const mau = taoHoSoMau();
assert.equal(diemDayDu(mau).uuTien, undefined, "chưa khai thì không có ưu tiên");
const m0 = mucTieuDayDu(mau)!;
const voi = { ...mau, hoSo: { ...mau.hoSo, uuTienTuyenSinh: { khuVuc: "KV1" as const, doiTuong: "khong" as const } } };
assert.equal(diemDayDu(voi).uuTien, 0.75);
const m1 = mucTieuDayDu(voi)!;
assert.equal(m1.mucTieu, m0.mucTieu, "mục tiêu hiển thị vẫn là điểm chuẩn của ngành");
assert.ok(m1.mucTieuTho < m0.mucTieuTho && m1.conThieu < m0.conThieu, "có ưu tiên thì còn thiếu ít hơn");
assert.ok(m1.uuTienCong > 0 && m1.uuTienCong <= 0.75);
assert.equal(m0.uuTienCong, 0);

// 6) Sống sót qua chuẩn hóa dữ liệu (tải lại trang, khôi phục sao lưu): trước đây khai báo ưu tiên bị mất mỗi lần tải lại
const sauTai = chuanHoa(JSON.parse(JSON.stringify(voi)));
assert.deepEqual(sauTai.hoSo.uuTienTuyenSinh, { khuVuc: "KV1", doiTuong: "khong" }, "ưu tiên còn nguyên sau khi tải lại");
assert.equal(sauTai.hoSo.laMau, true, "nhãn hồ sơ mẫu còn nguyên");
const xau = chuanHoa({ hoSo: { uuTienTuyenSinh: { khuVuc: "KV9", doiTuong: "hack" } } });
assert.deepEqual(xau.hoSo.uuTienTuyenSinh, { khuVuc: null, doiTuong: null }, "giá trị lạ bị bỏ");
assert.equal(chuanHoa({ hoSo: { laMau: "co" } }).hoSo.laMau, undefined);

console.log("diem-uu-tien: tất cả kiểm tra đều qua");
