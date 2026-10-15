import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử trắc nghiệm hướng nghiệp và gói chia sẻ/lời nhắn của người đồng hành. Chạy: npx tsx tests/dong-hanh.test.ts
import assert from "node:assert/strict";
import { CAC_CAU_HOI, CAC_LOAI, khongRoNet, moTaTop, nhomNganhGoiY, tinhKetQua } from "../src/features/huong-nghiep/cau-hoi";
import { docGoiChiaSe, docLoiNhan, giaiMa, maHoa, taoGoiChiaSe, taoLoiNhan } from "../src/features/dong-hanh/goi-tin";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { taoHoSoMau } from "../src/state/mau";
import { tomTatChiaSe } from "../src/features/hanh-trinh/tom-tat";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";

// ---- Trắc nghiệm ----
import { CAC_GIA_TRI, NHOM_NGANH_THEO_LOAI, SO_LAN_XUAT_HIEN, tyLe } from "../src/features/huong-nghiep/cau-hoi";
assert.equal(CAC_CAU_HOI.length, 12);
// Chất lượng nội dung: câu nào cũng có 4 tình huống khác nhau thuộc 4 nhóm khác nhau; không trùng chữ; độ dài vừa phải
const moiChu = new Set<string>();
for (const c of CAC_CAU_HOI) {
  assert.equal(c.luaChon.length, 4, `câu "${c.chu}" phải có 4 tình huống`);
  assert.equal(new Set(c.luaChon.map((l) => l.loai)).size, 4, `câu "${c.chu}": 4 tình huống thuộc 4 nhóm khác nhau`);
  assert.ok(c.chu.length >= 20 && c.chu.length <= 90 && c.chu.trim().endsWith("?"), `câu hỏi dài vừa phải và là câu hỏi: "${c.chu}"`);
  assert.ok(!moiChu.has(c.chu), "không trùng câu hỏi"); moiChu.add(c.chu);
  for (const l of c.luaChon) { assert.ok(l.chu.length >= 15 && l.chu.length <= 110, `tình huống dài vừa phải: "${l.chu}"`); assert.ok(!moiChu.has(l.chu), `trùng tình huống: ${l.chu}`); moiChu.add(l.chu); }
}
// Cân bằng: mỗi nhóm được đưa ra gần như nhau (chênh nhau không quá 2 lần), không nhóm nào bị bỏ rơi
const lan = CAC_LOAI.map((l) => SO_LAN_XUAT_HIEN[l]);
assert.ok(Math.min(...lan) >= 6 && Math.max(...lan) - Math.min(...lan) <= 3, `các nhóm xuất hiện đều nhau: ${lan.join(",")}`);
assert.equal(lan.reduce((t, x) => t + x, 0), 48, "12 câu × 4 tình huống");
// Tính kết quả
assert.equal(tinhKetQua([1, 2]), null, "thiếu câu thì không kết luận");
assert.equal(tinhKetQua(CAC_CAU_HOI.map(() => 9)), null, "vị trí sai thì không kết luận");
assert.equal(tinhKetQua(CAC_CAU_HOI.map(() => -1)), null, "chưa chọn thì không kết luận");
/** Mỗi câu chọn tình huống của nhóm `loai` nếu có, không thì tình huống đầu. */
const chonNhom = (loai: string) => CAC_CAU_HOI.map((c) => { const vt = c.luaChon.findIndex((l) => l.loai === loai); return vt >= 0 ? vt : 0; });
const a = tinhKetQua(chonNhom("A"))!;
assert.equal(a.top[0], "A"); assert.ok(a.diem.A >= 6);
assert.equal(a.diem.R + a.diem.I + a.diem.A + a.diem.S + a.diem.E + a.diem.C, 12, "mỗi câu đúng một lựa chọn");
assert.equal(khongRoNet(a), false);
assert.equal(nhomNganhGoiY(a)[0].nhom, "Thiết kế", "nghiêng về sáng tạo thì ngành đầu là Thiết kế");
assert.ok(moTaTop(a).startsWith("Sáng tạo"));
// Mỗi nhóm Holland khi được chọn nhiều nhất phải ra đúng nhóm ngành đầu danh sách của nó
for (const l of CAC_LOAI) { const kq = tinhKetQua(chonNhom(l))!; assert.equal(kq.top[0], l, `chọn thiên về ${l} thì nhóm đầu là ${l}`); assert.equal(nhomNganhGoiY(kq)[0].nhom, NHOM_NGANH_THEO_LOAI[l][0], `${l} -> ${NHOM_NGANH_THEO_LOAI[l][0]}`); }
// Chọn rải đều thì nói "chưa rõ nét"
const rai = tinhKetQua(CAC_CAU_HOI.map((_, i) => i % 4))!;
assert.ok(Math.max(...CAC_LOAI.map((l) => rai.diem[l])) <= 5);
const deu = tinhKetQua([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3].map((x, i) => (x + i) % 4))!;
assert.ok(deu.diem.R + deu.diem.I + deu.diem.A + deu.diem.S + deu.diem.E + deu.diem.C === 12);
// Điều em coi trọng: tối đa 2, id lạ bị bỏ, và chỉ nhích thứ tự chứ không lật kết quả
const kg = tinhKetQua(chonNhom("A"), ["sangTao", "thuNhap", "onDinh", "khongCo"])!;
assert.deepEqual(kg.giaTri, ["sangTao", "thuNhap"]);
assert.equal(nhomNganhGoiY(kg)[0].nhom, "Thiết kế", "điều em coi trọng không lật kết quả chính");
assert.ok(nhomNganhGoiY(kg).find((g) => g.nhom === "Thiết kế")!.vi.giaTri.includes("sangTao"), "nêu rõ điều em coi trọng khớp ngành nào");
assert.equal(tinhKetQua(chonNhom("A"), ["bay"])!.giaTri, undefined);
assert.ok(CAC_GIA_TRI.every((g) => g.nhom.length >= 3), "mỗi giá trị gắn ít nhất 3 nhóm ngành");
// Mọi nhóm ngành được gợi ý (kể cả do điều em coi trọng) đều có trong dữ liệu thật và đủ chương trình
const cacNhom = new Set(LUA_CHON.map((l) => l.nhomNganh));
for (const l of CAC_LOAI) for (const g of nhomNganhGoiY(tinhKetQua(chonNhom(l), CAC_GIA_TRI.map((x) => x.id))!, 40)) assert.ok(cacNhom.has(g.nhom), `nhóm ngành "${g.nhom}" không có trong dữ liệu`);
for (const g of CAC_GIA_TRI.flatMap((x) => x.nhom)) assert.ok(cacNhom.has(g), `giá trị gợi ý nhóm "${g}" không có trong dữ liệu`);
for (const l of CAC_LOAI) for (const g of NHOM_NGANH_THEO_LOAI[l]) assert.ok(LUA_CHON.filter((x) => x.nhomNganh === g).length >= 5, `nhóm "${g}" quá ít chương trình`);
// Ổn định: cùng câu trả lời, cùng kết quả; tyLe nằm trong 0..1
assert.deepEqual(nhomNganhGoiY(a), nhomNganhGoiY(tinhKetQua(chonNhom("A"))!));
for (const l of CAC_LOAI) assert.ok(tyLe(a, l) >= 0 && tyLe(a, l) <= 1);

// ---- Gói chia sẻ ----
const mau = taoHoSoMau();
const { muc } = tomTatChiaSe(mau, new Date("2026-10-06T08:00:00"));
const goi = taoGoiChiaSe(muc, [{ ten: "Hồ sơ", giaTri: "100%" }], new Date("2026-10-06T08:00:00"), "  Minh Anh  ");
const ma = maHoa(goi);
assert.ok(/^[A-Za-z0-9_-]+$/.test(ma), "chỉ gồm ký tự an toàn trong đường dẫn");
assert.ok(ma.length < 6000, `liên kết đủ ngắn để gửi qua tin nhắn (${ma.length})`);
const doc = docGoiChiaSe(ma)!;
assert.equal(doc.ten, "Minh Anh"); assert.deepEqual(doc.muc, muc); assert.equal(doc.chiSo[0].giaTri, "100%");
assert.equal(docGoiChiaSe(taoGoiChiaSe(muc, [], new Date()) && maHoa(taoGoiChiaSe(muc, [], new Date())))!.ten, undefined, "không kèm tên thì không có tên");
// Dữ liệu xấu
for (const xau of [null, "", "###", "abc", maHoa({ v: 2 }), maHoa({ v: 1, luc: "x", muc: [], chiSo: [] }), maHoa({ v: 1, luc: new Date().toISOString(), muc: "x", chiSo: [] }), maHoa({ v: 1, luc: new Date().toISOString(), muc: [], chiSo: [] }), "A".repeat(20000)])
  assert.equal(docGoiChiaSe(xau as string), null, `phải từ chối: ${String(xau).slice(0, 20)}`);
const doc2 = docGoiChiaSe(maHoa({ v: 1, luc: new Date().toISOString(), ten: "x".repeat(500), muc: [{ tieuDe: "T", dong: ["a".repeat(2000), 5, null] }], chiSo: [{ ten: "n", giaTri: 7 }] }))!;
assert.equal(doc2.ten!.length, 40); assert.equal(doc2.muc[0].dong.length, 1); assert.equal(doc2.muc[0].dong[0].length, 320); assert.equal(doc2.chiSo[0].giaTri, "");
assert.equal(giaiMa("%%%"), null);

// ---- Lời nhắn ----
assert.equal(taoLoiNhan("", "phuHuynh", "ok", new Date()), null);
assert.equal(taoLoiNhan("Mẹ", "phuHuynh", "   ", new Date()), null);
assert.equal(taoLoiNhan("Mẹ", "hacker" as never, "ok", new Date()), null);
const ln = taoLoiNhan("Mẹ Minh Anh", "phuHuynh", "Gia đình ủng hộ con. 😊 Nhớ giữ trường an toàn nhé.", new Date("2026-10-06T09:00:00"))!;
const l1 = docLoiNhan(maHoa(ln))!, l2 = docLoiNhan(maHoa(ln))!;
assert.equal(l1.noiDung, ln.noiDung, "giữ nguyên tiếng Việt và emoji");
assert.equal(l1.id, l2.id, "mở cùng một liên kết thì cùng id (không lưu trùng)");
assert.equal(docLoiNhan(maHoa({ ...ln, vai: "admin" })), null);
assert.equal(docLoiNhan(maHoa({ ...ln, luc: "không phải ngày" })), null);
assert.equal(docLoiNhan("xxx"), null);
assert.equal(docLoiNhan(maHoa({ ...ln, noiDung: "<img src=x onerror=alert(1)>" }))!.noiDung, "<img src=x onerror=alert(1)>", "giữ nguyên chữ, việc chặn mã độc là do React chỉ hiển thị dạng chữ");

// ---- Sao lưu giữ nguyên lời nhắn và kết quả trắc nghiệm ----
const co = { ...mau, loiNhan: [l1] };
const r = docBanSaoLuu(taoBanSaoLuu(co));
assert.ok(r.ok && r.s.loiNhan[0].id === l1.id && r.s.hoSo.soThich?.top[0] === "I");
const hong = JSON.parse(taoBanSaoLuu(mau)); hong.duLieu.hoSo.soThich = { diem: "x", top: 1 };
assert.equal(docBanSaoLuu(JSON.stringify(hong)).ok, false, "kết quả trắc nghiệm hỏng thì từ chối");

console.log("dong-hanh: tất cả kiểm tra đều qua");
