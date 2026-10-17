import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Chat hỏi tiến độ học lớp 12: chạy bằng quy tắc và dữ liệu, không gọi AI, không bịa chương trình. Chạy: npx tsx tests/tien-do-chat.test.ts
import assert from "node:assert/strict";
import { CHU_DE_LOP12 } from "../src/data/chuong-trinh-lop12";
import { traLoiTienDoChat } from "../src/features/tu-van/tien-do-chat";
import { layTinTraLoi } from "../src/features/tu-van/cau-tra-loi";
import { lamSachLichSu } from "../src/features/tu-van/hoi-thoai";
import { taoHoSoMau } from "../src/state/mau";
import { apDungTienDo } from "../src/engine/tien-do-chu-de";
import { viecChoTuan } from "../src/features/ke-hoach/tao-viec-tuan";
import { tuanHienTai } from "../src/state/chon";

const s = taoHoSoMau();
const sTrong = { ...s, hoSo: { ...s.hoSo, tienDoKienThuc: undefined } };

// 1) Mở hỏi tiến độ: thẻ môn đầu tiên của tổ hợp mục tiêu, có nút sang môn khác
const mo = traLoiTienDoChat("Lập kế hoạch học theo tiến độ của mình", sTrong)!;
assert.ok(mo && mo.tienDo?.the && /chưa thể đề xuất theo tiến độ|không đoán/.test(mo.traLoi), "chưa có tiến độ thì nói thẳng là chưa đề xuất được, không đoán");
const monA = traLoiTienDoChat("Hỏi tiến độ môn Hóa học", sTrong)!;
assert.equal(monA.tienDo?.the, "hoaHoc");
assert.ok(monA.traLoi.includes("chưa đối chiếu sách in") && monA.traLoi.includes("Kết nối tri thức"), "luôn ghi nguồn và giới hạn dữ liệu");
assert.ok(monA.luaChon && monA.luaChon.length >= 2);

// 2) Câu gõ tự do: hiểu, nói lại để xác nhận, chưa tự lưu
const nd = traLoiTienDoChat("lý em học xong từ trường, hạt nhân chưa học, toán giỏi xác suất", sTrong)!;
assert.deepEqual(nd.tienDo?.deXuat?.map((x) => [x.ten, x.mucDo]), [["Từ trường", "dangHoc"], ["Vật lí hạt nhân", "chuaHoc"], ["Xác suất có điều kiện", "namVung"]]);
assert.ok(/Mình hiểu là/.test(nd.traLoi) && /bấm Lưu/.test(nd.traLoi));

// 3) Kiến thức lớp 11 hoặc không có trong dữ liệu: báo rõ, không gán bừa
const l11 = traLoiTienDoChat("lý em học rồi dao động sóng", sTrong)!;
assert.ok(l11 && !l11.tienDo?.deXuat && /Chưa có dữ liệu cho/.test(l11.traLoi) && /lớp 11/.test(l11.traLoi), "dao động sóng thuộc lớp 11: nói chưa có dữ liệu");
const khong = traLoiTienDoChat("toán em chưa học đại số", sTrong)!;
assert.ok(khong && !khong.tienDo?.deXuat && /chưa tìm thấy chủ đề phù hợp/.test(khong.traLoi));

// 4) Hỏi chương trình: chỉ liệt kê đúng dữ liệu
const ct = traLoiTienDoChat("chương trình vật lý 12 gồm những gì", sTrong)!;
const tenLy = CHU_DE_LOP12.filter((c) => c.mon === "vatLy").map((c) => c.ten);
assert.ok(ct && tenLy.every((t) => ct.traLoi.includes(t)) && /4 chương/.test(ct.traLoi));
assert.ok(!/dao động|sóng cơ/.test(ct.traLoi.toLowerCase()), "không nêu chương không có trong dữ liệu");

// 5) Kế hoạch theo tiến độ: đúng thứ tự, nêu lý do và ý cần nắm, nhắc giới hạn
const sCo = { ...s, hoSo: { ...s.hoSo, tienDoKienThuc: apDungTienDo(undefined, [
  ...CHU_DE_LOP12.filter((c) => c.mon === "toan").slice(0, 2).map((chuDe) => ({ chuDe, mucDo: "namVung" as const })),
  ...CHU_DE_LOP12.filter((c) => c.mon === "toan").slice(3, 4).map((chuDe) => ({ chuDe, mucDo: "chuaHoc" as const })),
]) } };
const kh = traLoiTienDoChat("Gợi ý kế hoạch học theo tiến độ của mình", sCo)!;
assert.ok(kh.tienDo?.moLich && /Nguyên hàm và tích phân \(em ghi là chưa học\)/.test(kh.traLoi), "chủ đề chưa học đứng đầu, kèm lý do");
assert.ok(/chưa có số liệu mức quan trọng/.test(kh.traLoi), "nói rõ không có trọng số theo đề thi");
assert.ok(!/Vectơ và hệ trục tọa độ trong không gian \(em ghi là đã vững\)/.test(kh.traLoi), "chủ đề đã vững không đưa vào danh sách cần học");

// 6) Câu về tuyển sinh không bị luồng này nuốt
for (const c of ["điểm chuẩn ngành công nghệ thông tin", "em được 25 điểm khối A00 vào trường nào", "thêm ngành này vào nguyện vọng", "học phí trường UIT"]) assert.equal(traLoiTienDoChat(c, sTrong), null, c);

// 7) Toàn đường ống: đi bằng chế độ Tiết kiệm (cấm gọi AI) vẫn trả lời, và tin sống sót qua lưu/đọc lịch sử
const tin = await layTinTraLoi({ cau: "Hỏi tiến độ môn Toán", truoc: [], s: sTrong, nguon: null, dungHoSo: true, manHinh: "/tu-van", phien: { cheDo: "tietKiem", idHoSo: "x", luot: null } });
assert.equal(tin.cheDo, "tuDong");
assert.equal(tin.tienDo?.the, "toan");
const lai = lamSachLichSu(JSON.parse(JSON.stringify([tin, { ...tin, tienDo: { the: "khongCoMon", deXuat: [{ ten: "Chủ đề bịa", mucDo: "namVung" }, { ten: "Từ trường", mucDo: "namVung" }] } }])));
assert.equal(lai[0].tienDo?.the, "toan");
assert.deepEqual(lai[1].tienDo?.deXuat, [{ ten: "Từ trường", mucDo: "namVung" }], "tên chủ đề bịa bị loại khi đọc lại lịch sử");
assert.equal(lai[1].tienDo?.the, undefined);

// 8) Kế hoạch tuần thật dùng tiến độ: Lý ghi "Từ trường: chưa học" thì việc Lý ôn đúng chủ đề đó, kèm "cần nắm" và lý do
const tuNay = tuanHienTai();
const sLy = { ...s, hoSo: { ...s.hoSo, tienDoKienThuc: { "Từ trường": "chuaHoc", "Vật lí nhiệt": "namVung", "Khí lí tưởng": "namVung", "Vật lí hạt nhân": "namVung" } as const } };
const viecLy = viecChoTuan(sLy, tuNay, undefined, new Date(), false);
assert.ok(viecLy.ok);
if (viecLy.ok) {
  const ly = viecLy.viec.filter((v) => v.mon === "vatLy");
  assert.ok(ly.length > 0 && ly.every((v) => v.chiTiet.includes("Từ trường")), "mọi buổi Lý ôn chủ đề còn chưa học");
  assert.ok(ly.some((v) => v.chiTiet.includes("Cần nắm:") && /em ghi là chưa học/.test(v.lyDo)), "có ý cần nắm và lý do theo tiến độ em đã cho");
}
// Không có tiến độ: chủ đề vẫn lấy từ chương trình lớp 12 hiện hành, không còn "số phức"
const viecKhong = viecChoTuan(sTrong, tuNay, undefined, new Date(), false);
if (viecKhong.ok) assert.ok(!viecKhong.viec.some((v) => /số phức|logarit/i.test(`${v.tieuDe} ${v.chiTiet}`)), "không gợi ý chương trình cũ");

// 9) Hỏi "kế hoạch/chương trình đề xuất dựa vào nguồn dữ liệu nào": trả lời tất định, nói đúng nguồn và giới hạn, không gọi AI
for (const c of ["Kế hoạch học tập với các chương trình được đề xuất dựa vào nguồn dữ liệu nào?", "Gợi ý này lấy từ đâu vậy", "chủ đề được đề xuất căn cứ vào đâu"]) {
  const r = traLoiTienDoChat(c, sTrong);
  assert.ok(r && /Kết nối tri thức/.test(r.traLoi) && /loigiaihay/.test(r.traLoi) && /chưa đối chiếu sách in/i.test(r.traLoi) && /giả định/.test(r.traLoi), `nêu nguồn và giới hạn: ${c}`);
}
for (const c of ["nguồn dữ liệu điểm chuẩn ngành CNTT lấy từ đâu", "dựa vào đâu để xếp nhãn nguyện vọng"]) assert.equal(traLoiTienDoChat(c, sTrong), null, `không nuốt câu về tuyển sinh: ${c}`);
const tinNguon = await layTinTraLoi({ cau: "Kế hoạch học tập được đề xuất dựa vào nguồn dữ liệu nào?", truoc: [], s: sTrong, nguon: null, dungHoSo: true, manHinh: "/tu-van", phien: { cheDo: "ai", idHoSo: "x", luot: null } });
assert.equal(tinNguon.cheDo, "tuDong", "câu về nguồn dữ liệu không đi qua AI kể cả khi bật chế độ AI");
console.log("tien-do-chat.test.ts: tất cả kiểm tra đều qua");

// Chương còn thiếu của một môn: không đoán khi chưa có tiến độ, có tiến độ thì chỉ liệt kê chủ đề chưa vững kèm nút lập kế hoạch
const thieuTrong = traLoiTienDoChat("những chương còn thiếu trong môn toán", sTrong)!;
assert.ok(thieuTrong && thieuTrong.tienDo?.the === "toan" && /không đoán/.test(thieuTrong.traLoi), "chưa có tiến độ: nói thẳng, mở thẻ chọn mức");
const sCoTD = { ...s, hoSo: { ...s.hoSo, tienDoKienThuc: { [CHU_DE_LOP12.find((c) => c.mon === "toan")!.ten]: "namVung" as const, [CHU_DE_LOP12.filter((c) => c.mon === "toan")[1].ten]: "chuaHoc" as const } } };
const thieuCo = traLoiTienDoChat("em còn thiếu chương nào môn toán", sCoTD)!;
assert.ok(thieuCo && /chưa vững/.test(thieuCo.traLoi) && !thieuCo.traLoi.includes(`• ${CHU_DE_LOP12.find((c) => c.mon === "toan")!.ten} (`), "bỏ chủ đề đã vững");
assert.ok(thieuCo.luaChon?.some((l) => /kế hoạch/i.test(l.nhan)), "có nút lập kế hoạch");
assert.ok(traLoiTienDoChat("Đề xuất chương trình học phù hợp để lập kế hoạch", sCoTD), "đề xuất chương trình học dẫn tới kế hoạch theo tiến độ");
console.log("tien-do-chat (chương còn thiếu): ok");
