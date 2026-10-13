// Kiểm thử logic trắc nghiệm hướng nghiệp Holland (RIASEC) và gợi ý nhóm ngành.
// Chạy: npx tsx tests/huong-nghiep.test.ts
import assert from "node:assert/strict";
import {
  CAC_CAU_HOI, CAC_LOAI,
  tinhKetQua, khongRoNet, nhomNganhGoiY, moTaTop,
} from "../src/features/huong-nghiep/cau-hoi";
import type { KetQuaSoThich } from "../src/state/types";

// ---------- 1) Bộ câu hỏi và thông tin nhóm ----------
assert.equal(CAC_CAU_HOI.length, 12, "Bộ trắc nghiệm có đúng 12 câu");
assert.ok(CAC_CAU_HOI.every((c) => c.luaChon.length === 4), "Mỗi câu có 4 tình huống để chọn");
assert.equal(CAC_LOAI.length, 6, "Đủ 6 nhóm RIASEC");

// ---------- 2) Tính kết quả (tinhKetQua) ----------

// Trường hợp thiếu câu hoặc câu trả lời không hợp lệ
assert.equal(tinhKetQua([]), null, "Rỗng thì trả về null");
assert.equal(tinhKetQua([0, 1, 2]), null, "Thiếu câu (chưa đủ 12) trả về null");
assert.equal(tinhKetQua([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 4]), null, "Index vượt quá 3 trả về null");
assert.equal(tinhKetQua([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, -1]), null, "Index âm trả về null");

// Trường hợp trả lời hợp lệ: ví dụ chọn toàn bộ đáp án vị trí 0
const traLoiHopLe = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const kq1 = tinhKetQua(traLoiHopLe, ["thuNhap", "sangTao"]);
assert.ok(kq1 !== null, "Kết quả phải hợp lệ");
assert.equal(kq1!.top.length, 3, "Luôn lọc ra đúng top 3 nhóm cao nhất");
assert.deepEqual(kq1!.giaTri, ["thuNhap", "sangTao"], "Lưu đúng 2 giá trị nghề nghiệp");

// Giới hạn giá trị coi trọng: tối đa 2 giá trị, bỏ giá trị không hợp lệ
const kqGiaTri = tinhKetQua(traLoiHopLe, ["thuNhap", "sangTao", "onDinh", "idLa"]);
assert.deepEqual(kqGiaTri!.giaTri, ["thuNhap", "sangTao"], "Chỉ lấy tối đa 2 giá trị và bỏ id lạ");

// ---------- 3) Độ rõ nét của kết quả (khongRoNet) ----------

// Chọn đều (mỗi nhóm <= 3 điểm)
const kqDeu: KetQuaSoThich = {
  diem: { R: 2, I: 2, A: 2, S: 2, E: 2, C: 2 },
  top: ["R", "I", "A"],
  luc: new Date().toISOString(),
};
assert.equal(khongRoNet(kqDeu), true, "Điểm tối đa <= 3 thì coi là không rõ nét");

// Chọn nổi trội một nhóm (ví dụ I có 6 điểm)
const kqNoiTroi: KetQuaSoThich = {
  diem: { R: 1, I: 6, A: 2, S: 1, E: 1, C: 1 },
  top: ["I", "A", "R"],
  luc: new Date().toISOString(),
};
assert.equal(khongRoNet(kqNoiTroi), false, "Có nhóm từ 4 điểm trở lên thì phân biệt rõ");

// ---------- 4) Gợi ý nhóm ngành (nhomNganhGoiY) ----------
const goiY = nhomNganhGoiY(kqNoiTroi, 5);
assert.equal(goiY.length, 5, "Gợi ý đủ 5 nhóm ngành");
assert.ok(goiY[0].diem >= goiY[1].diem, "Sắp xếp điểm giảm dần");

// Với nhóm nổi trội I (Tìm tòi), các ngành như CNTT hoặc Kỹ thuật/Y Dược phải có điểm cao
const cacNganhGoiY = goiY.map((g) => g.nhom);
assert.ok(cacNganhGoiY.includes("CNTT") || cacNganhGoiY.includes("Kỹ thuật"), "Nhóm I phải gợi ý CNTT hoặc Kỹ thuật");

// Thêm giá trị nghề nghiệp ảnh hưởng đến thứ tự
const goiYCoGiaTri = nhomNganhGoiY({ ...kqNoiTroi, giaTri: ["thuNhap"] }, 5);
assert.ok(goiYCoGiaTri.some((g) => g.vi.giaTri.includes("thuNhap")), "Có ghi nhận lý do từ giá trị thu nhập");

// ---------- 5) Mô tả top 3 (moTaTop) ----------
const moTa = moTaTop(kqNoiTroi);
assert.ok(moTa.includes("Tìm tòi"), "Mô tả phải có tên nhóm I (Tìm tòi)");
assert.ok(moTa.includes("và"), "Có liên từ 'và' kết nối");

console.log("huong-nghiep: tất cả kiểm tra đều qua");
