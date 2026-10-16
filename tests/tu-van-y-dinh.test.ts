import "./nap-du-lieu";
// Định tuyến ý định bằng quy tắc: lời chào không đi vào tra cứu hay AI. Hồi quy cho lỗi "chào" -> "chưa hiểu" + "Chưa kết nối được AI". Chạy: npx tsx tests/tu-van-y-dinh.test.ts
import assert from "node:assert/strict";
import { layTinTraLoi } from "../src/features/tu-van/cau-tra-loi";
import { bocLoiChao, nhanYDinhQuyTac } from "../src/features/tu-van/y-dinh";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";

const y = (c: string) => nhanYDinhQuyTac(c)?.y ?? null;
for (const c of ["chào", "Chào", "chao", "hello", "Hi", "xin chào", "chào bạn", "alo", "hey bot", "chào bạn ơi"]) assert.equal(y(c), "chao", c);
for (const c of ["cảm ơn", "cam on nhieu", "thanks", "Cảm ơn bạn nhé"]) assert.equal(y(c), "cam-on", c);
assert.equal(y("tạm biệt"), "tam-biet");
assert.equal(y("bạn làm được gì"), "tro-giup");
assert.equal(y("còn bao nhiêu lượt hỏi hôm nay"), "hoi-luot-ai");
assert.equal(y("AI bị lỗi thì sao"), "hoi-ai-loi");
assert.equal(y("thời tiết hôm nay thế nào"), "ngoai-pham-vi");
// Không nuốt câu tuyển sinh
for (const c of ["uit là trường gì", "điểm chuẩn uit 2025", "so sánh UEH với UIT", "cho em xem nguyện vọng", "hi vọng đỗ ngành y", "24 điểm học công nghệ thông tin ở đâu", "thời tiết ảnh hưởng thi thế nào"]) assert.equal(y(c), null, c);
assert.equal(bocLoiChao("chào, uit là trường gì"), "uit la truong gi");
assert.equal(bocLoiChao("chào"), null);
assert.equal(bocLoiChao("uit là trường gì"), null);

// Chào không gọi mạng và không bao giờ có thuLai/"chưa hiểu", kể cả khi AI hỏng
let goi = 0;
const fetchGoc = globalThis.fetch;
globalThis.fetch = (async () => { goi++; throw new Error("mạng hỏng"); }) as typeof fetch;
const lay = (cau: string) => layTinTraLoi({ cau, truoc: [], s: TRANG_THAI_BAN_DAU, nguon: null, dungHoSo: false, manHinh: "Tư vấn tuyển sinh" });
(async () => {
  for (const c of ["chào", "hello", "cảm ơn", "tạm biệt", "bạn làm được gì", "còn bao nhiêu lượt hỏi hôm nay"]) {
    const t = await lay(c);
    assert.equal(goi, 0, `${c}: không được gọi AI`);
    assert.ok(!t.thuLai && !/chưa hiểu/i.test(t.chu), `${c}: ${t.chu}`);
    assert.equal(t.cheDo, "tuDong");
  }
  // Câu không hiểu + AI hỏng: nói đúng nguyên nhân, có Thử lại, không "chưa hiểu rõ câu hỏi"
  const loi = await lay("xyzzy qwerty plugh");
  assert.ok(goi >= 1 && loi.thuLai === true && !/chưa hiểu rõ/i.test(loi.chu), loi.chu);
  // Chào kèm nội dung: phần nội dung vẫn được trả lời từ dữ liệu, không chặn ở lời chào
  const kem = await lay("chào, UIT là trường gì");
  assert.ok(/UIT|Công nghệ Thông tin/i.test(kem.chu) && !kem.thuLai, kem.chu);
  globalThis.fetch = fetchGoc;
  console.log("tu-van-y-dinh: OK");
})();
