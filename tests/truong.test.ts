import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// University Entity System (src/engine/truong.ts). Chạy: npx tsx tests/truong.test.ts
import assert from "node:assert/strict";
import dulieu from "../src/data/du-lieu-that.json";
import { DANH_MUC_TRUONG } from "../src/data/truong-danh-muc";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { nhanDienTruongTinh } from "../functions/_thu-vien/ai/ten-truong";
import { chuanHoa, chuanHoaTinh, coSoCuaChuongTrinh, locTheoTinh, maTuVietTat, resolveTruong, tinhCuaTruong, TINH_CU_SANG_MOI } from "../src/engine/truong";

type Dong = { ma: string; truong: string; nganh: string; tinh: string };
const dl = dulieu as unknown as Dong[];

// 0) Danh mục sinh ra đồng bộ với dữ liệu thật (không tự bịa mã/tên)
{
  const thuc = new Map<string, { ten: string; tinh: Set<string> }>();
  for (const r of dl) { const x = thuc.get(r.ma) ?? { ten: r.truong, tinh: new Set() }; x.tinh.add(r.tinh); thuc.set(r.ma, x); }
  assert.equal(DANH_MUC_TRUONG.length, thuc.size, "danh mục lệch dữ liệu: chạy node scripts/sinh-danh-muc-truong.mjs");
  for (const [ma, ten, tinh] of DANH_MUC_TRUONG) {
    assert.equal(thuc.get(ma)?.ten, ten, `tên ${ma}`);
    assert.deepEqual([...tinh].sort(), [...(thuc.get(ma)?.tinh ?? [])].sort(), `tỉnh ${ma}`);
  }
}

// 1) Chuẩn hóa duy nhất
assert.equal(chuanHoa("Đại học Công nghệ - ĐHQG TP.HCM"), "dai hoc cong nghe dhqg tp hcm");
assert.equal(chuanHoa("  ĐẠI HỌC  Thăng-Long "), "dai hoc thang long");

// 2) Mã và tên chính xác
const ma = (q: string) => resolveTruong(q).ma;
assert.equal(ma("BKA"), "BKA");
assert.equal(ma("hust"), "BKA");
assert.equal(ma("uit"), "QSC");
assert.equal(ma("Đại học Kinh tế Quốc dân"), "KHA");
assert.equal(ma("dai hoc kinh te quoc dan"), "KHA", "không dấu = có dấu");
assert.equal(ma("DAI HOC BACH KHOA HA NOI"), "BKA");
assert.equal(ma("Bách khoa Hà Nội"), "BKA");
assert.equal(ma("hutech"), "DKC", "tên trong ngoặc của trường");

// 3) Trà Vinh / DTL: tra dữ liệu, không đoán
{
  const traVinh = new Set(dl.filter((r) => /Trà Vinh/.test(r.truong)).map((r) => r.ma));
  assert.deepEqual([...traVinh], ["DTV"], "dữ liệu: ĐH Trà Vinh mang mã DTV");
  const thangLong = new Set(dl.filter((r) => /Thăng Long/.test(r.truong)).map((r) => r.ma));
  assert.deepEqual([...thangLong], ["DTL"], "dữ liệu: DTL là ĐH Thăng Long");
  for (const q of ["DTV", "ĐH Trà Vinh", "Đại học Trà Vinh", "Tra Vinh University", "tra vinh", "TVU"]) assert.equal(ma(q), "DTV", q);
  assert.equal(ma("DTL"), "DTL", "DTL không được trỏ sang Trà Vinh");
  assert.equal(ma("thang long"), "DTL");
  assert.notEqual(ma("DTL"), ma("Tra Vinh University"));
}

// 4) Mã/viết tắt dùng chung -> mơ hồ, không đoán
{
  const bk = resolveTruong("bk");
  assert.equal(bk.kieu, "mo-ho"); assert.equal(bk.ma, null);
  assert.ok(bk.ung_vien.includes("BKA") && bk.ung_vien.includes("DDK"), "bk: ít nhất Bách khoa Hà Nội và Đà Nẵng");
  assert.ok(!bk.ung_vien.includes("QSB"), "QSB chưa có trong dữ liệu nên không được gợi ý");
  assert.match(bk.ly_do, /BKA/);
  assert.equal(resolveTruong("bk ha noi").ma, "BKA", "thêm 'Hà Nội' thì rõ");
  for (const q of ["utc", "ftu", "ussh", "kinh te", "dh cong nghe"]) assert.equal(resolveTruong(q).kieu, "mo-ho", q);
  assert.deepEqual(resolveTruong("utc").ung_vien, ["GHA", "GSA"]);
}

// 5) Không dấu, hoa thường, từ đệm, sai chính tả nhẹ
assert.equal(ma("truong dai hoc can tho"), "TCT");
assert.equal(ma("TRƯỜNG ĐẠI HỌC CẦN THƠ"), "TCT");
{
  const r = resolveTruong("bach khoa ha noy");
  assert.equal(r.kieu, "mo-ho", "sai chính tả không được tự khẳng định");
  assert.equal(r.gan_dung, true);
  assert.deepEqual(r.ung_vien, ["BKA"]);
  assert.deepEqual(resolveTruong("phenikaaa").ung_vien, ["PKA"]);
  assert.equal(resolveTruong("phenikaaa").kieu, "mo-ho");
}

// 6) Không thấy / tên tỉnh trần / rỗng
assert.equal(resolveTruong("zzzz qqqq").kieu, "khong-thay");
assert.equal(resolveTruong("").kieu, "khong-thay");
assert.equal(resolveTruong("Hà Nội").kieu, "khong-thay", "tên tỉnh không phải tên trường");
assert.equal(ma("Đại học Hà Nội"), "NHF");
assert.equal(resolveTruong("xin chao ban").kieu, "khong-thay");

// 7) Viết tắt trong câu hỏi dài (chatbot): chỉ viết tắt thật, không phải từ thường
assert.deepEqual(maTuVietTat("UIT"), ["QSC"]);
assert.deepEqual(maTuVietTat("hust"), ["BKA"]);
assert.deepEqual(maTuVietTat("vinh"), [], "'vinh' là từ thường (Trà Vinh), không phải viết tắt");
assert.deepEqual(maTuVietTat("bk"), []);
assert.ok(maTuVietTat("ftu").length === 2);

// 8) Cơ tách "(CS: X)"
{
  assert.deepEqual(coSoCuaChuongTrinh("Kỹ thuật xây dựng (CS: Cần Thơ)"), { nganh: "Kỹ thuật xây dựng", coSo: "Cần Thơ" });
  assert.deepEqual(coSoCuaChuongTrinh("Kỹ thuật xây dựng (cs : Đà Lạt) "), { nganh: "Kỹ thuật xây dựng", coSo: "Đà Lạt" });
  assert.deepEqual(coSoCuaChuongTrinh("Khoa học Máy tính (CSE)"), { nganh: "Khoa học Máy tính (CSE)", coSo: null }, "CSE không phải cơ sở");
  assert.equal(coSoCuaChuongTrinh("Kiến trúc").coSo, null);
  const kts = dl.filter((r) => r.ma === "KTS" && /\(CS:/.test(r.nganh));
  assert.ok(kts.length >= 2);
  for (const r of kts) {
    const { nganh, coSo } = coSoCuaChuongTrinh(r.nganh);
    assert.ok(coSo && !nganh.includes("CS"), r.nganh);
    assert.ok(tinhCuaTruong("KTS").includes(r.tinh), "tỉnh của chương trình là một tỉnh của trường"); // coSo là địa danh (Đà Lạt), tỉnh là Lâm Đồng: hai thứ khác nhau
  }
  assert.ok(tinhCuaTruong("KTS").includes("Cần Thơ") && tinhCuaTruong("KTS").includes("Lâm Đồng") && tinhCuaTruong("KTS").includes("TP.HCM"));
  assert.deepEqual(tinhCuaTruong("XXX"), []);
}

// 9) Lọc theo tỉnh sau sáp nhập
{
  assert.equal(chuanHoaTinh("Trà Vinh"), "Vĩnh Long");
  assert.equal(chuanHoaTinh("ben tre"), "Vĩnh Long");
  assert.equal(chuanHoaTinh("vinh long"), "Vĩnh Long");
  assert.equal(chuanHoaTinh("tphcm"), "TP.HCM");
  assert.equal(chuanHoaTinh("Sao Hỏa"), null);
  const codes = (q: string) => new Set(locTheoTinh(LUA_CHON_MAU, q).map((l) => l.maTruong));
  for (const q of ["Vĩnh Long", "Trà Vinh", "tra vinh", "Bến Tre"]) {
    const c = codes(q);
    assert.ok(c.has("DTV") && c.has("DCL"), `${q} phải gồm ĐH Trà Vinh và ĐH Cửu Long`);
  }
  assert.ok(!codes("Vĩnh Long").has("BKA"));
  assert.equal(locTheoTinh(LUA_CHON_MAU, "tp hcm").every((l) => l.khuVuc === "TP.HCM"), true);
  // Mọi dòng bảng sáp nhập phải trỏ vào tỉnh có thật trong dữ liệu
  const tinhThat = new Set(dl.map((r) => r.tinh));
  for (const moi of Object.values(TINH_CU_SANG_MOI)) assert.ok(tinhThat.has(moi), `tỉnh mới không có trong dữ liệu: ${moi}`);
}

// 10) Máy chủ (functions) dùng cùng danh mục
{
  const r = nhanDienTruongTinh("điểm chuẩn ĐH Bách Khoa Hà Nội ở Hà Nội");
  assert.deepEqual(r.truong, ["BKA"]);
  assert.ok(r.tinh.includes("Hà Nội"));
}

console.log("truong.test.ts: ok");
