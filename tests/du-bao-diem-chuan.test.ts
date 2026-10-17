import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử dự báo khoảng điểm chuẩn, kèm KIỂM ĐỊNH BỎ-MỘT-NĂM trên dữ liệu thật: bỏ hết biến động của năm T, dùng phần còn lại
// để đoán điểm năm T từ điểm năm T-1, rồi so với điểm thật năm T. Chạy: npx tsx tests/du-bao-diem-chuan.test.ts
import assert from "node:assert/strict";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { MO_TA_VI_TRI, duBaoDiemChuan, namTuyenSinhToi, phanVi, thongKeBienDong, viTriSoVoiDuBao } from "../src/engine/du-bao-diem-chuan";
import type { LuaChon } from "../src/state/types";

const mau = (diemTheoNam: Record<string, number>, nhom = "CNTT", pt = "THPT") => ({ id: "x", nhomNganh: nhom, phuongThuc: pt, diemTheoNam } as unknown as LuaChon);

// 1) Phân vị
assert.equal(phanVi([1, 2, 3, 4, 5], 0.5), 3);
assert.equal(phanVi([0, 10], 0.1), 1);
assert.ok(Number.isNaN(phanVi([], 0.5)));

// 2) Chỉ nhận hai năm liền nhau, điểm thang 30, phương thức THPT, từ năm 2023
const tk0 = thongKeBienDong([
  mau({ "2023": 24, "2024": 25 }), mau({ "2022": 20, "2024": 25 }), mau({ "2024": 900, "2025": 901 }, "CNTT", "DGNL_HCM"),
  mau({ "2024": 5, "2025": 6 }), mau({ "2021": 20, "2022": 22 }),
]);
assert.deepEqual(tk0.tatCa, [1], "chỉ cặp 2023-2024 hợp lệ: bỏ cặp cách năm, bỏ điểm ĐGNL, bỏ điểm ngoài thang, bỏ năm quá sớm");
assert.deepEqual(thongKeBienDong([mau({ "2023": 24, "2024": 25 })], 2024).tatCa, [], "bỏ-một-năm loại cặp có năm sau là năm đó");

// 3) Dự báo trên dữ liệu thật
const tk = thongKeBienDong(LUA_CHON);
assert.ok(tk.tatCa.length > 1000, `đủ mẫu biến động (${tk.tatCa.length})`);
const nam = namTuyenSinhToi(new Date("2026-10-09"));
assert.equal(nam, 2027);
assert.equal(namTuyenSinhToi(new Date("2026-03-01")), 2026);
let soDuBao = 0;
for (const lc of LUA_CHON) {
  const d = duBaoDiemChuan(lc, tk, nam);
  if (!d) continue;
  soDuBao++;
  assert.ok(d.thap <= d.kyVong + 1e-9 && d.kyVong <= d.cao + 1e-9, `thấp ≤ giữa ≤ cao: ${lc.id}`);
  assert.ok(d.thap >= 10 && d.cao <= 30, `trong thang điểm: ${lc.id}`);
}
assert.ok(soDuBao > 1200, `các chương trình có điểm từ năm ${nam - 2} trở đi đều có dự báo (${soDuBao})`);
assert.equal(duBaoDiemChuan(mau({ "2023": 25 }), tk, 2027), null, "điểm cuối cách quá 2 năm thì không dự báo (khoảng sẽ rộng vô nghĩa)");
assert.equal(duBaoDiemChuan(mau({ "2026": 25 }), tk, 2026), null, "đã có điểm của năm đó thì không dự báo");
assert.equal(duBaoDiemChuan(mau({}), tk, 2027), null);
assert.equal(duBaoDiemChuan(mau({ "2026": 25 }, "CNTT", "HOC_BA"), tk, 2027), null, "không dự báo điểm học bạ như điểm thi");
assert.equal(duBaoDiemChuan(mau({ "2026": 25 }), { tatCa: [1, 2, 3] }, 2027), null, "quá ít mẫu thì không dự báo");
const xa = duBaoDiemChuan(mau({ "2025": 25 }), tk, 2027)!, gan = duBaoDiemChuan(mau({ "2026": 25 }), tk, 2027)!;
assert.ok(xa.cao - xa.thap > gan.cao - gan.thap, "dự báo xa hơn thì khoảng rộng hơn");
assert.ok(xa.luuY.some((x) => x.includes("cách 2 năm")) && gan.luuY.some((x) => x.includes("một năm")), "có cảnh báo khi dữ liệu yếu");
assert.equal(gan.kyVong, 25, "tâm dự báo là điểm năm mới nhất");
assert.ok(duBaoDiemChuan(mau({ "2026": 29.9 }), tk, 2027)!.cao <= 30, "không vượt thang 30");

// 4) Vị trí của em so với khoảng
const d = { namDuBao: 2027, namCuoi: 2026, diemCuoi: 25, kyVong: 25.3, thap: 23.8, cao: 28, mucTinCay: 0.8 as const, soMau: 100, luuY: [], doTinCay: "vua" as const, chamTran: false };
assert.equal(viTriSoVoiDuBao(28.5, d), "caoHonCa");
assert.equal(viTriSoVoiDuBao(26, d), "tren");
assert.equal(viTriSoVoiDuBao(24.5, d), "trongKhoang");
assert.equal(viTriSoVoiDuBao(23.3, d), "duoi");
assert.equal(viTriSoVoiDuBao(20, d), "thapHonCa");
for (const v of Object.values(MO_TA_VI_TRI)) assert.ok(!/chắc chắn|đảm bảo|100%|xác suất đậu/i.test(v), "không hứa hẹn");

// 5) KIỂM ĐỊNH BỎ-MỘT-NĂM trên dữ liệu thật
const ketQua: { nam: number; n: number; phu: number; sai: number }[] = [];
for (const T of [2023, 2024, 2025]) {
  const tkBo = thongKeBienDong(LUA_CHON, T);
  let n = 0, trong = 0, sai = 0;
  for (const lc of LUA_CHON) {
    const thuc = lc.diemTheoNam?.[String(T)], truoc = lc.diemTheoNam?.[String(T - 1)];
    if (thuc === undefined || truoc === undefined || thuc < 10 || thuc > 30 || truoc < 10 || truoc > 30) continue;
    const dd = duBaoDiemChuan(mau({ [String(T - 1)]: truoc }, lc.nhomNganh, lc.phuongThuc ?? "THPT"), tkBo, T);
    if (!dd) continue;
    n++;
    if (thuc >= dd.thap && thuc <= dd.cao) trong++;
    sai += Math.abs(thuc - dd.kyVong);
  }
  ketQua.push({ nam: T, n, phu: trong / n, sai: sai / n });
}
for (const r of ketQua) console.log(`kiểm định năm ${r.nam}: ${r.n} chương trình, khoảng 80% phủ ${(r.phu * 100).toFixed(1)}% điểm thật, sai số trung bình ${r.sai.toFixed(2)} điểm`);
const phuTB = ketQua.reduce((t, r) => t + r.phu, 0) / ketQua.length;
console.log(`phủ trung bình ${(phuTB * 100).toFixed(1)}%`);
assert.ok(ketQua.every((r) => r.n >= 300), "đủ mẫu mỗi năm kiểm định");
assert.ok(phuTB >= 0.75 && phuTB <= 0.92, `khoảng 80% phải phủ trung bình 75–92% (thực tế ${(phuTB * 100).toFixed(1)}%)`);
assert.ok(ketQua.every((r) => r.phu >= 0.6), "năm xấu nhất vẫn phủ ít nhất 60%");
assert.ok(ketQua.filter((r) => r.nam < 2025).every((r) => r.phu >= 0.78), "năm bình thường phủ ít nhất 78%");

// 6) ĐỘ TIN CẬY và TRẦN 30 (phát hiện khi kiểm 2027: ~1.300 dự báo xuất phát từ MỘT năm 2026 của trang tổng hợp, không kiểm định ngược được)
{
  const tk = thongKeBienDong(LUA_CHON);
  const thuCap = { ...mau({ "2026": 22 }, "x", "THPT"), nguonCap: "aggregator_verified" as const };
  const dt = duBaoDiemChuan(thuCap, tk, 2027)!;
  assert.equal(dt.doTinCay, "thap");
  assert.ok(dt.luuY.some((x) => /trang tổng hợp/.test(x)));
  const chinhThuc = { ...mau({ "2024": 24, "2025": 24.5 }, "x", "THPT"), nguonCap: "official_pdf" as const };
  assert.equal(duBaoDiemChuan(chinhThuc, tk, 2026)!.doTinCay, "thap", "nhãn official_pdf không chứng minh dữ liệu đã được kiểm chứng");
  const daThamDinh = { ...chinhThuc, scoreEvidence: Object.fromEntries(Object.entries(chinhThuc.diemTheoNam!).map(([nam, score]) => [nam, { kind: "diem_chuan" as const, score, scale: 30, sourceUrl: "https://fixture.edu.vn/diem", checkedAt: "2026-10-17", checkedBy: "test fixture", independentReviewer: "independent test fixture", includesPriority: true }])) };
  assert.equal(duBaoDiemChuan(daThamDinh, tk, 2026)!.doTinCay, "cao");
  assert.equal(duBaoDiemChuan(daThamDinh, tk, 2027)!.doTinCay, "vua", "cách 2 năm thì chỉ mức vừa");
  const cao = duBaoDiemChuan({ ...chinhThuc, diemTheoNam: { "2024": 29.2, "2025": 29.5 } }, tk, 2026)!;
  assert.equal(cao.cao, 30);
  assert.equal(cao.chamTran, true);
  assert.ok(cao.luuY.some((x) => /trần/.test(x)));
}

console.log("du-bao-diem-chuan: tất cả kiểm tra đều qua");
