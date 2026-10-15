import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Tìm kiếm ngành/trường: có dấu hay không dấu, viết tắt, biệt danh, khớp theo từng từ. Chạy: npx tsx tests/tim-kiem.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { TRUONG_CHUA_CO, hangTimKiem, khongDau, locTimKiem, truongChuaCoDuLieu, tuCuaTruyVan, xepHangTimKiem } from "../src/engine/tim-kiem";

const truongCua = (q: string) => new Set(locTimKiem(LUA_CHON_MAU, q).map((l) => l.maTruong));
const ids = (q: string) => locTimKiem(LUA_CHON_MAU, q).map((l) => l.id).sort().join(",");

assert.equal(khongDau("Đại học Công nghệ - ĐHQG TP.HCM"), "dai hoc cong nghe dhqg tp hcm");
assert.deepEqual(tuCuaTruyVan("Trường Đại học Kinh tế"), ["dh", "kt"]);
assert.equal(locTimKiem(LUA_CHON_MAU, "   ").length, LUA_CHON_MAU.length, "ô trống thì không lọc");

// 1) "đại học công nghệ" phải ra ĐH Công nghệ (UET), ĐH Công nghệ Thông tin (UIT), ĐH Công nghệ TP.HCM (HUTECH)
{
  const t = truongCua("đại học công nghệ");
  for (const ma of ["QHI", "QSC", "DKC"]) assert.ok(t.has(ma), `đại học công nghệ phải có ${ma}`);
  assert.ok(t.size >= 3);
  assert.equal(ids("đại học công nghệ"), ids("dai hoc cong nghe"), "có dấu và không dấu như nhau");
  assert.equal(ids("trường ĐH công nghệ"), ids("đại học công nghệ"), "trường ĐH ~ đại học");
}

// 2) Không dấu = có dấu
{
  assert.ok(locTimKiem(LUA_CHON_MAU, "dai hoc kinh te").length > 0);
  assert.equal(ids("dai hoc kinh te"), ids("đại học kinh tế"));
  assert.equal(ids("dh kt"), ids("đại học kinh tế"), "viết tắt dh kt");
  assert.ok(truongCua("dai hoc kinh te").has("QHE"), "ĐH Kinh tế - ĐHQGHN");
}

// 3) Biệt danh và mã trường
// "uit" chỉ ra UIT (QSC); chương trình liên kết có chữ "UITM" (GTA) chỉ ra khi gõ "uitm".
{
  const uit = locTimKiem(LUA_CHON_MAU, "uit");
  assert.deepEqual([...truongCua("uit")], ["QSC"], "uit không dính uitm");
  assert.equal(uit.length, LUA_CHON_MAU.filter((l) => l.maTruong === "QSC").length);
  assert.ok(locTimKiem(LUA_CHON_MAU, "uitm").every((l) => /uitm/i.test(l.nganh)) && locTimKiem(LUA_CHON_MAU, "uitm").length > 0);
  // từ ngắn phải trùng nguyên từ: "an" không dính "anh", "quản"...
  assert.ok(locTimKiem(LUA_CHON_MAU, "kt").every((l) => /kinh t|KT/i.test(`${l.tenTruong} ${l.nganh} ${l.nhomNganh}`)));
}
assert.deepEqual([...truongCua("UET")], ["QHI"]);
assert.deepEqual([...truongCua("qsc")], ["QSC"]);
assert.ok(truongCua("hust").has("BKA"));
assert.ok(truongCua("ftu").has("NTH"));
assert.ok(truongCua("neu").has("KHA"));

// 4) Khớp theo từng từ, từ nằm ở trường khác nhau của bản ghi
{
  const bk = locTimKiem(LUA_CHON_MAU, "bách khoa cntt");
  assert.ok(bk.length > 0, "bách khoa cntt");
  assert.ok(bk.every((l) => /bách khoa/i.test(l.tenTruong) && /thông tin|CNTT/i.test(`${l.nganh} ${l.nhomNganh}`)), "đúng trường Bách Khoa và ngành CNTT");
  assert.ok(locTimKiem(LUA_CHON_MAU, "cntt qsc").every((l) => l.maTruong === "QSC"));
  assert.ok(locTimKiem(LUA_CHON_MAU, "cong ngh").length > 0, "đang gõ dở vẫn ra");
  assert.ok(locTimKiem(LUA_CHON_MAU, "học viện công nghệ").some((l) => l.maTruong === "BVH"));
}

// 5) TP.HCM viết kiểu nào cũng ra
{
  const a = ids("tp.hcm"), b = ids("tphcm"), c = ids("thành phố hồ chí minh"), d = ids("hcm");
  assert.ok(a.length > 0 && a === b && b === c && c === d, "tp.hcm = tphcm = thành phố hồ chí minh = hcm");
}

// 6) Không có gì thì 0, và nới từ chung chỉ khi cần
assert.equal(locTimKiem(LUA_CHON_MAU, "xyzzyk").length, 0);
assert.ok(locTimKiem(LUA_CHON_MAU, "đại học sư phạm").length > 0);
assert.ok(locTimKiem(LUA_CHON_MAU, "dai hoc ngoai thuong").some((l) => l.maTruong === "NTH"));

// 7) Biệt danh phổ biến của các trường có trong dữ liệu
{
  const aliasChuan: Record<string, string> = { ussh: "QHX", hcmus: "QST", hcmute: "SPK", hcmue: "SPS", ptit: "BVH", haui: "DCN", ctu: "TCT", hnue: "SPH", ump: "YDS", hutech: "DKC", sgu: "SGD", iuh: "IUH", vlu: "DVL", uef: "UEF", tdmu: "TDM", dut: "DDK", hanu: "NHF", hmu: "YHB", tlu: "TLA", vnua: "HVN" };
  for (const [q, ma] of Object.entries(aliasChuan)) assert.ok(truongCua(q).has(ma), `${q} phải ra ${ma}`);
}

// 8) Xếp hạng: mã/biệt danh hoặc cụm liền nhau trong tên lên trước, rồi mới tới khớp rời; cùng mức giữ thứ tự đầu vào
{
  const kq = locTimKiem(LUA_CHON_MAU, "kinh te qhe");
  assert.ok(kq.length > 0 && kq[0].maTruong === "QHE");
  const ds = locTimKiem(LUA_CHON_MAU, "cong nghe thong tin");
  const hang = ds.map((l) => hangTimKiem(l, "cong nghe thong tin"));
  assert.ok(hang.every((h, i) => i === 0 || hang[i - 1] >= h), "hạng giảm dần");
  const dao = [...LUA_CHON_MAU].reverse();
  const a = xepHangTimKiem(LUA_CHON_MAU.filter((l) => l.maTruong === "QSC"), "qsc").map((l) => l.id);
  assert.deepEqual(a, LUA_CHON_MAU.filter((l) => l.maTruong === "QSC").map((l) => l.id), "cùng hạng thì giữ thứ tự");
  assert.ok(dao.length === LUA_CHON_MAU.length);
}

console.log("tim-kiem: tất cả kiểm tra đều qua");

// Trường lớn chưa có dữ liệu: nhận ra để báo thẳng; và không được trùng với trường đã có (nếu đã thêm thì xóa khỏi danh sách).
{
  assert.equal(truongChuaCoDuLieu("bach khoa tphcm"), "ĐH Bách khoa – ĐHQG TP.HCM");
  assert.equal(truongChuaCoDuLieu("Bách khoa TP.HCM"), "ĐH Bách khoa – ĐHQG TP.HCM");
  assert.equal(truongChuaCoDuLieu("ueh marketing"), "ĐH Kinh tế TP.HCM (UEH)");
  assert.equal(truongChuaCoDuLieu("bach khoa ha noi"), null);
  assert.equal(truongChuaCoDuLieu("uit"), null);
  for (const t of TRUONG_CHUA_CO) assert.ok(!LUA_CHON_MAU.some((l) => l.tenTruong.includes(t.ten.split(" (")[0])), `đã có dữ liệu, xóa khỏi TRUONG_CHUA_CO: ${t.ten}`);
}
