// Số gửi cho Tư vấn AI phải khớp số hiển thị ở màn chi tiết/danh sách. Chạy: npx tsx tests/lay-du-lieu.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { nhanNguyenVong } from "../src/engine/phan-tich";
import { danhGia, boiCanhTu } from "../src/features/kham-pha/phu-hop";
import { tongChoLuaChon, diemDayDu } from "../src/features/kham-pha/to-hop";
import { GIOI_HAN } from "../src/engine/tu-van";
import { catLichSu, docLichSu, ghiLichSu, goiYBanDau, KHOA_CHAT, lamSachLichSu, nganhLuotTruoc, taoNguCanh, TOI_DA_TIN, type TinNhan } from "../src/features/tu-van/hoi-thoai";
import { chonDuLieuKemTheo, coDaiTu, dungSuKien, timNganhKhop, tomTatHoSo, traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { xoaTatCaDuLieu } from "../src/state/store";
import { taoHoSoMau } from "../src/state/mau";

const s = taoHoSoMau();
const bc = boiCanhTu(s);
const diem = diemDayDu(s);
const mau = LUA_CHON_MAU.filter((l) => l.phuongThuc === undefined || l.phuongThuc === "THPT").slice(0, 400);
const ds = [...LUA_CHON_MAU.filter((l) => /^Trí tuệ nhân tạo/i.test(l.nganh) && /MBS|Kinh tế TP/i.test(l.truong + l.tenTruong + l.maTruong)), ...mau, ...s.nguyenVong.map((id) => LUA_CHON_MAU.find((l) => l.id === id)!).filter(Boolean)];
let dem = 0;
for (const l of ds) {
  const kq = danhGia(l, bc);
  const sk = dungSuKien(l, diem, null);
  if (kq.tong === null) { assert.equal(sk.chenh, undefined, l.id); continue; }
  dem++;
  assert.equal(sk.chenh, Math.round(kq.tong! * 100 - l.diemMin * 100) / 100 === 0 ? 0 : Math.round((kq.tong! - l.diemMin) * 100) / 100, `chênh lệch ${l.id}`);
  assert.equal(sk.nhanCuaEm, nhanNguyenVong(l, tongChoLuaChon(l, diem).tong!), `nhãn ${l.id}`);
}
assert.ok(dem > 50, "phải kiểm đủ chương trình");

// Chênh gửi AI = chênh màn hình (làm tròn 1 chữ số như hiển thị)
for (const id of s.nguyenVong) {
  const l = LUA_CHON_MAU.find((x) => x.id === id); if (!l) continue;
  const kq = danhGia(l, bc); if (kq.tong === null) continue;
  const sk = dungSuKien(l, diem, null);
  assert.equal(Math.round(sk.chenh! * 10) / 10, Math.round(kq.chenh! * 10) / 10, `chênh ${id}`);
}
// Tổng điểm gửi AI theo từng ngành phải là tổng theo tổ hợp của chính ngành đó, không phải tổ hợp cao nhất của hồ sơ
const ho = tomTatHoSo(s);
const khac = chonDuLieuKemTheo("danh sách nguyện vọng", s, null).filter((x) => x.tongCuaEm !== undefined && ho.toHopCaoNhat && x.tongCuaEm !== ho.toHopCaoNhat.tong);
assert.ok(khac.length > 0 || !ho.toHopCaoNhat, "mẫu cần có ngành tổng khác tổ hợp cao nhất để test có ý nghĩa");
// Ca lỗi gốc: MBS Trí tuệ nhân tạo, hồ sơ mẫu. Tổ hợp cao nhất hồ sơ là A02 (24,8) nhưng ngành này xét A01 (24,5), chênh 2,0.
const mbs = LUA_CHON_MAU.find((l) => l.id === "mbs-73175b7e");
if (mbs) {
  const e = dungSuKien(mbs, diem, null);
  assert.equal(e.tongCuaEm, 24.5); assert.equal(e.toHopDaTinh, "A01"); assert.equal(e.chenh, 2);
  assert.equal(ho.toHopCaoNhat?.ma, "A02"); assert.notEqual(e.tongCuaEm, ho.toHopCaoNhat?.tong);
}
// ---------- Hội thoại nối tiếp ----------
// Câu nối tiếp giữ ngành lượt trước; câu nêu ngành mới thì ngành mới lên đầu; không đại từ + có từ khóa mới thì không giữ.
const uit = timNganhKhop("Khoa học máy tính UIT", 3).map((l) => l.id);
assert.ok(uit.length >= 2);
assert.ok(coDaiTu("Còn ngành kia thì sao?") && coDaiTu("trường đó học phí bao nhiêu") && coDaiTu("so sánh hai ngành đó"));
assert.ok(!coDaiTu("Điểm chuẩn Khoa học máy tính UIT?"));
const giu = chonDuLieuKemTheo("Còn ngành kia thì sao?", s, null, 8, uit).map((x) => x.id);
assert.deepEqual(giu.slice(0, uit.length), uit, "câu đại từ phải giữ đúng ngành lượt trước");
const giu2 = chonDuLieuKemTheo("Học phí bao nhiêu?", s, null, 8, uit).map((x) => x.id);
assert.deepEqual(giu2.slice(0, uit.length), uit, "câu không nêu ngành cũng giữ ngành lượt trước");
const moi = timNganhKhop("Marketing", 8).map((l) => l.id);
const giu3 = chonDuLieuKemTheo("Điểm chuẩn Marketing", s, null, 8, uit).map((x) => x.id);
assert.deepEqual(giu3, moi.slice(0, giu3.length), "nêu ngành mới và không có đại từ thì không giữ ngành cũ");
const giu4 = chonDuLieuKemTheo("Còn Marketing thì sao?", s, null, 8, uit).map((x) => x.id);
assert.ok(uit.slice(0, 4).every((id) => giu4.includes(id)) && moi.some((id) => giu4.includes(id)), "đại từ + ngành mới: giữ cả hai");
const td = traLoiTuDong("Trường đó học phí bao nhiêu?", s, null, uit);
assert.ok(td.nguon.includes(uit[0]) && /học phí/.test(td.traLoi), "trả lời tự động cũng hiểu câu nối tiếp");
assert.equal(traLoiTuDong("Trường đó học phí bao nhiêu?", s, null, []).nguon.length, 0, "không có lượt trước thì không bịa ngành");

// Ngữ cảnh gửi kèm: có lượt gần nhất, tổng không quá giới hạn, bỏ lượt cũ nhất trước.
const dai = "x".repeat(900);
const lichSu: TinNhan[] = [];
for (let i = 0; i < 6; i++) lichSu.push({ vai: "em", chu: `Câu hỏi số ${i} ${dai}` }, { vai: "mayChu", chu: `Đáp số ${i} ${dai}`, nguon: [`id${i}`], idDuLieu: [`id${i}`, `kem${i}`] });
const nc = taoNguCanh("Tư vấn chung", lichSu);
assert.ok(nc.length <= GIOI_HAN.nguCanh && nc.startsWith("Tư vấn chung"));
assert.ok(nc.includes("Em hỏi: Câu hỏi số 5") && !nc.includes("số 0"));
assert.equal(taoNguCanh("Tư vấn chung", []), "Tư vấn chung");
assert.ok(taoNguCanh("a".repeat(500), lichSu, 100).length <= 100);
assert.deepEqual(nganhLuotTruoc(lichSu), ["id5", "kem5"]);
assert.deepEqual(nganhLuotTruoc([{ vai: "em", chu: "hi" }]), []);

// Lưu, khôi phục, giới hạn 30, bỏ tin hỏng
const kho = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
const k1 = kho();
const nhieu: TinNhan[] = Array.from({ length: 45 }, (_, i) => (i % 2 ? { vai: "mayChu", chu: `đáp ${i}`, nguon: ["a"], cheDo: "ai", tang: "llm", viecTiep: "việc", idDuLieu: ["a"] } : { vai: "em", chu: `hỏi ${i}` }));
assert.equal(catLichSu(nhieu).length, TOI_DA_TIN);
assert.ok(ghiLichSu(k1, nhieu));
const doc = docLichSu(k1);
assert.equal(doc.length, TOI_DA_TIN);
assert.equal(doc[doc.length - 1].chu, "hỏi 44");
const dap = doc[doc.length - 2];
assert.equal(dap.chu, "đáp 43"); assert.deepEqual(dap.nguon, ["a"]); assert.equal(dap.viecTiep, "việc"); assert.equal(dap.cheDo, "ai");
assert.deepEqual(lamSachLichSu([{ vai: "khac", chu: "x" }, null, { vai: "em", chu: "" }, { vai: "em", chu: "ok", nguon: ["bay"] }, "x"]), [{ vai: "em", chu: "ok" }], "chỉ giữ tin đúng hình dạng; tin của em không mang nguồn");
k1.m.set(KHOA_CHAT, "{hỏng"); assert.deepEqual(docLichSu(k1), []);
ghiLichSu(k1, []); assert.equal(k1.m.has(KHOA_CHAT), false, "rỗng thì xóa khóa");
assert.equal(goiYBanDau({ soNguyenVong: 0, nganhQuanTam: [] }).length, 3);
const gy = goiYBanDau({ soNguyenVong: 2, nganhQuanTam: ["Công nghệ thông tin"] });
assert.equal(gy.length, 4); assert.ok(gy[0].includes("nguyện vọng") && gy[1].includes("Công nghệ thông tin"));

// "Xóa hết" xóa khóa chat (và chỉ các khóa nvai:*)
{
  const luu: Record<string, string> = {};
  Object.defineProperty(luu, "getItem", { value: (k: string) => luu[k] ?? null });
  Object.defineProperty(luu, "setItem", { value: (k: string, v: string) => { luu[k] = v; } });
  Object.defineProperty(luu, "removeItem", { value: (k: string) => { delete luu[k]; } });
  (globalThis as { localStorage?: unknown }).localStorage = luu;
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {};
  assert.ok(KHOA_CHAT.startsWith("nvai:"));
  ghiLichSu(luu as never, [{ vai: "em", chu: "hỏi" }]);
  luu["khac:giu"] = "1";
  xoaTatCaDuLieu();
  assert.equal(luu[KHOA_CHAT], undefined); assert.equal(luu["khac:giu"], "1");
}
console.log("OK lay-du-lieu", dem);
