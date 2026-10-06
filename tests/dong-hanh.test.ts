// Kiểm thử trắc nghiệm hướng nghiệp và gói chia sẻ/lời nhắn của người đồng hành. Chạy: npx tsx tests/dong-hanh.test.ts
import assert from "node:assert/strict";
import { CAC_CAU_HOI, CAC_LOAI, khongRoNet, moTaTop, nhomNganhGoiY, tinhKetQua } from "../src/features/huong-nghiep/cau-hoi";
import { docGoiChiaSe, docLoiNhan, giaiMa, maHoa, taoGoiChiaSe, taoLoiNhan } from "../src/features/dong-hanh/goi-tin";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { taoHoSoMau } from "../src/state/mau";
import { tomTatChiaSe } from "../src/features/hanh-trinh/tom-tat";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";

// ---- Trắc nghiệm ----
assert.equal(CAC_CAU_HOI.length, 18);
for (const l of CAC_LOAI) assert.equal(CAC_CAU_HOI.filter((c) => c.loai === l).length, 3, `mỗi nhóm đúng 3 câu (${l})`);
assert.equal(tinhKetQua([1, 2]), null, "thiếu câu thì không kết luận");
assert.equal(tinhKetQua(CAC_CAU_HOI.map(() => 5)), null, "mức sai thì không kết luận");
const dau = (loai: string) => CAC_CAU_HOI.map((c) => (c.loai === loai ? 3 : 0));
const a = tinhKetQua(dau("A"))!;
assert.equal(a.diem.A, 9); assert.equal(a.diem.R, 0); assert.equal(a.top[0], "A");
assert.equal(khongRoNet(a), false);
assert.equal(nhomNganhGoiY(a)[0].nhom, "Thiết kế", "thích sáng tạo thì ngành đầu là Thiết kế");
assert.ok(moTaTop(a).startsWith("Sáng tạo"));
const deu = tinhKetQua(CAC_CAU_HOI.map(() => 2))!;
assert.ok(khongRoNet(deu), "trả lời đều nhau thì nói chưa rõ nét");
// Mọi nhóm ngành được gợi ý đều có trong dữ liệu thật
const cacNhom = new Set(LUA_CHON.map((l) => l.nhomNganh));
for (const l of CAC_LOAI) for (const g of nhomNganhGoiY(tinhKetQua(dau(l))!, 20)) assert.ok(cacNhom.has(g.nhom), `nhóm ngành "${g.nhom}" không có trong dữ liệu`);
// Ổn định: cùng câu trả lời, cùng kết quả
assert.deepEqual(nhomNganhGoiY(a), nhomNganhGoiY(tinhKetQua(dau("A"))!));

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
