import assert from "node:assert/strict";
import { CAC_MON } from "../src/state/types";
import { CHU_DE_LOP12, NGOAI_PHAM_VI_LOP12, NGUON_CHUONG_TRINH, chuDeCuaMon, timChuDeTheoId } from "../src/data/chuong-trinh-lop12";
import { NOI_DUNG_ON } from "../src/engine/tao-viec";

// 1) Toàn vẹn dữ liệu
const ids = new Set<string>();
for (const c of CHU_DE_LOP12) {
  assert.ok(!ids.has(c.id), `id trùng: ${c.id}`); ids.add(c.id);
  assert.ok(c.ten.trim() && c.canNam.length >= 1 && c.canNam.length <= 4, `${c.id}: 1–4 ý cần nắm (chương chỉ có một bài thì chỉ một ý)`);
  assert.ok(c.tuKhoa.length >= 1 && c.tuKhoa.every((k) => k === k.trim() && k === k.toLowerCase()), `${c.id}: từ khóa chữ thường, không thừa khoảng trắng`);
  assert.ok(c.daDuyet === false, "chưa có người duyệt thì phải ghi đúng là chưa duyệt");
  assert.ok(c.id.startsWith({ toan: "toan-12", vatLy: "ly-12", hoaHoc: "hoa-12", sinh: "sinh-12", nguVan: "van-12", tiengAnh: "anh-12" }[c.mon]), `${c.id}: tiền tố theo môn`);
  for (const q of c.tienQuyet ?? []) assert.ok(timChuDeTheoId(q) && timChuDeTheoId(q)!.mon === c.mon, `${c.id}: tiên quyết ${q} phải là chủ đề cùng môn`);
}
// tên chủ đề (khóa lưu tiến độ) không trùng trong cùng môn
for (const m of CAC_MON) { const t = chuDeCuaMon(m).map((c) => c.ten); assert.equal(new Set(t).size, t.length); assert.ok(t.length >= 4, `${m}: đủ chủ đề`); }
// không có vòng tiên quyết
for (const c of CHU_DE_LOP12) { const thay = new Set<string>(); const di = (x: string): void => { assert.ok(!thay.has(x), `vòng tiên quyết ở ${c.id}`); thay.add(x); for (const q of timChuDeTheoId(x)?.tienQuyet ?? []) di(q); }; di(c.id); }

// 2) Số lượng khớp mục lục đã cào (bộ Kết nối tri thức, lớp 12)
const dem = (m: (typeof CAC_MON)[number]) => chuDeCuaMon(m).length;
assert.deepEqual([dem("toan"), dem("vatLy"), dem("hoaHoc"), dem("sinh"), dem("nguVan"), dem("tiengAnh")], [6, 4, 8, 8, 9, 10]);
assert.deepEqual(NGUON_CHUONG_TRINH.daDoiChieuSachIn, false);

// 3) Chương trình hiện hành: KHÔNG còn chủ đề cũ trong danh sách ôn
const tatCa = JSON.stringify(NOI_DUNG_ON).toLowerCase();
assert.ok(!/số phức|logarit|este và lipit/.test(tatCa), "danh sách ôn không còn nội dung chương trình cũ");
assert.ok(Object.values(NOI_DUNG_ON).every((ds) => ds.length >= 4), "NOI_DUNG_ON lấy từ dữ liệu chương trình");

// 4) Chủ đề ngoài phạm vi không trùng chủ đề lớp 12 (tránh nói "ngoài phạm vi" cho thứ có trong dữ liệu)
for (const n of NGOAI_PHAM_VI_LOP12) for (const k of n.tuKhoa) for (const c of CHU_DE_LOP12.filter((x) => x.mon === n.mon)) {
  assert.ok(!c.tuKhoa.includes(k), `từ khóa "${k}" vừa ngoài phạm vi vừa thuộc ${c.id}`);
}
console.log("chuong-trinh-lop12.test.ts: tất cả kiểm tra đều qua");
