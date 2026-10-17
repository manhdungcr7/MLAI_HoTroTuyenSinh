import assert from "node:assert/strict";
import { chuDeCuaMon } from "../src/data/chuong-trinh-lop12";
import { apDungTienDo, chuDeConHoc, coTienDoMon, hieuTienDoTuCau, xepUuTienChuDe } from "../src/engine/tien-do-chu-de";

const ten = (mon: Parameters<typeof chuDeCuaMon>[0], i: number) => chuDeCuaMon(mon)[i].ten;

// 1) Hiểu câu gõ
const a = hieuTienDoTuCau("lý em học xong từ trường, hạt nhân thì chưa học, toán giỏi hình học");
const muc = (t: string) => a.khop.find((k) => k.chuDe.ten === t)?.mucDo;
assert.equal(muc("Từ trường"), "dangHoc");
assert.equal(muc("Vật lí hạt nhân"), "chuaHoc");
assert.equal(muc("Vectơ và hệ trục tọa độ trong không gian"), "namVung");
assert.equal(muc("Phương pháp tọa độ trong không gian"), "namVung");
assert.equal(a.ngoaiPhamVi.length, 0);

// 2) Chủ đề lớp 11: nói thẳng là ngoài phạm vi, KHÔNG ghi vào chủ đề nào của lớp 12
const b = hieuTienDoTuCau("lý em học rồi dao động sóng");
assert.equal(b.khop.length, 0, "dao động sóng không được gán nhầm vào chương lớp 12");
assert.ok(b.ngoaiPhamVi.some((x) => x.lop === "11" && x.mon === "vatLy"));
// "mũ logarit" của Toán 11
assert.ok(hieuTienDoTuCau("toán em giỏi logarit").ngoaiPhamVi.some((x) => x.lop === "11"));

// 3) Không khớp chủ đề nào: báo lại, không đoán
const c = hieuTienDoTuCau("toán em chưa học đại số");
assert.equal(c.khop.length, 0);
assert.ok(c.khongKhop.length > 0, "đại số không có trong dữ liệu lớp 12: phải báo chưa có dữ liệu phù hợp");
// Không nêu mức học thì không ghi nhận gì
const d = hieuTienDoTuCau("từ trường là gì");
assert.equal(d.khop.length, 0);
// Câu không liên quan
assert.deepEqual(hieuTienDoTuCau("hôm nay trời đẹp"), { khop: [], ngoaiPhamVi: [], khongKhop: [], mon: [] });
// Môn khác nhau trong cùng câu
const e = hieuTienDoTuCau("hóa em giỏi polymer, sinh còn yếu tiến hóa");
assert.equal(e.khop.find((k) => k.chuDe.ten === "Polymer")?.mucDo, "namVung");
assert.equal(e.khop.find((k) => k.chuDe.ten === "Bằng chứng và các học thuyết tiến hóa")?.mucDo, "canOnTap");
// Không dấu
assert.equal(hieuTienDoTuCau("toan em gioi xac suat").khop[0]?.chuDe.ten, "Xác suất có điều kiện");

// 4) Thứ tự học: em giỏi hình học thì hình học xuống cuối, đại số/giải tích lên đầu
let td = apDungTienDo(undefined, a.khop);
for (const nm of ["Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số", "Nguyên hàm và tích phân"]) td[nm] = "chuaHoc";
const thuTu = xepUuTienChuDe("toan", td).map((x) => x.chuDe.ten);
const vi = (t: string) => thuTu.indexOf(t);
assert.ok(vi("Nguyên hàm và tích phân") < vi("Vectơ và hệ trục tọa độ trong không gian"), "chưa học nằm trước đã vững");
assert.ok(vi("Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số") < vi("Phương pháp tọa độ trong không gian"));
assert.ok(!chuDeConHoc("toan", td).some((x) => x.mucDo === "namVung"), "chủ đề đã vững không còn trong danh sách cần học");
// Tiên quyết: chương Sinh sau đứng sau chương nền khi nền chưa vững
const sinh = xepUuTienChuDe("sinh", { [ten("sinh", 3)]: "chuaHoc", [ten("sinh", 1)]: "canOnTap" }).map((x) => x.chuDe.ten);
assert.ok(sinh.indexOf(ten("sinh", 1)) < sinh.indexOf(ten("sinh", 3)), "chủ đề tiên quyết đứng trước chủ đề phụ thuộc");
// Vững hết thì vẫn có việc giữ nhịp
const hetVung = Object.fromEntries(chuDeCuaMon("vatLy").map((x) => [x.ten, "namVung" as const]));
assert.equal(chuDeConHoc("vatLy", hetVung).length, chuDeCuaMon("vatLy").length);
// Chưa trả lời: coi là chưa biết, trung tính
assert.equal(coTienDoMon("toan", undefined), false);
assert.equal(coTienDoMon("toan", td), true);
assert.ok(xepUuTienChuDe("hoaHoc", undefined).every((x) => x.mucDo === null && x.lyDo.includes("chưa cho mình biết")));
// Tên chủ đề cũ (không còn trong dữ liệu) không làm lỗi
assert.doesNotThrow(() => xepUuTienChuDe("toan", { "Ôn số phức và tổ hợp": "canOnTap" } as never));
assert.equal(coTienDoMon("toan", { "Ôn số phức và tổ hợp": "canOnTap" } as never), false);

console.log("tien-do-chu-de.test.ts: tất cả kiểm tra đều qua");
