import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Dựng hồ sơ trường (src/features/truong/ho-so.ts). Chạy: npx tsx tests/truong-ho-so.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { DANH_MUC_TRUONG } from "../src/data/truong-danh-muc";
import { CHUA_CO, diemGhiThang, dungHoSoTruong, hocPhiDayDu, thangDiem } from "../src/features/truong/ho-so";

// Mã lạ -> null (màn hình báo lỗi)
assert.equal(dungHoSoTruong("ZZZ", LUA_CHON), null);

// Mọi trường trong danh mục dựng được; số chương trình khớp dữ liệu; điểm chỉ lấy từ dữ liệu
for (const [ma] of DANH_MUC_TRUONG) {
  const h = dungHoSoTruong(ma, LUA_CHON)!;
  assert.ok(h, ma);
  assert.equal(h.soChuongTrinh, LUA_CHON.filter((l) => l.maTruong === ma).length, ma);
  assert.equal(h.nganh.flatMap((n) => n.dong).length, h.soChuongTrinh, ma);
  for (const d of h.nganh.flatMap((n) => n.dong)) {
    const goc = LUA_CHON.find((l) => l.id === d.id)!;
    if (d.diem !== null) assert.equal(d.diem, goc.diemTheoNam![d.nam!], `${d.id} điểm phải đúng dữ liệu`);
    else assert.equal(diemGhiThang(d, String), CHUA_CO);
    assert.equal(d.hocPhi === null, goc.hocPhiMin === undefined || goc.hocPhiMax === undefined, `${d.id} học phí không được bịa`);
    assert.equal(d.nguonDiem, goc.nguonCap === "official_pdf" ? "chinh-thuc" : "tong-hop", d.id);
  }
}

// Trường nhiều cơ sở (KTS)
const kts = dungHoSoTruong("KTS", LUA_CHON)!;
assert.ok(kts.coSo.length >= 2, "KTS có nhiều cơ sở");
assert.ok(kts.tinh.length >= 2);

// Học phí: ước tính có chữ "ước tính" và dấu ≈; có nguồn thì ghi năm
// Học phí ước tính (hocPhiUocTinh) đã bị bỏ khỏi LuaChon: chỉ học phí có nguồn sơ cấp đã kiểm chứng mới tới được màn hình (xem hoc-phi-kiem-chung.ts).
assert.equal(hocPhiDayDu({ hocPhiMin: 35, hocPhiMax: 45, nguonHocPhi: { nam: "2025", url: "https://x", trang: 1 } }), "35 – 45 triệu đồng/năm (đề án 2025)");
assert.equal(hocPhiDayDu({}), null);

// Điểm luôn đi kèm thang riêng; phương thức lạ không gắn thang 30
assert.equal(thangDiem("THPT"), "thang 30");
assert.equal(thangDiem("DGNL_HCM"), "thang 1.200");
assert.equal(thangDiem("DGTD"), null);

// Trường có trong danh mục nhưng không có chương trình -> hồ sơ trống, không số liệu
const trong = dungHoSoTruong("BKA", []);
assert.ok(trong && trong.soChuongTrinh === 0 && trong.nganh.length === 0 && trong.toHop.length === 0);

// Link đề án: chỉ nhận http(s)
const h = dungHoSoTruong("BKA", LUA_CHON, [{ nam: "2024", url: "javascript:alert(1)" }, { nam: "2025", url: "https://ts.hust.edu.vn/a.pdf" }])!;
assert.deepEqual(h.linkDeAn.map((d) => d.url), ["https://ts.hust.edu.vn/a.pdf"]);

console.log("truong-ho-so: OK");
