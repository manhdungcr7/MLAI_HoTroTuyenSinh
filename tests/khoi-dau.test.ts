// Kiểm thử hàm thuần của luồng Khởi đầu. Chạy: npx tsx tests/khoi-dau.test.ts
import assert from "node:assert/strict";
import {
  demVuaNganSach, docDiem, goiYHocPhi, ketQuaBanDau, kiemTraBuoc1, tinhCacToHop, toHopCaoNhatDayDu, vietDiem,
} from "../src/features/khoi-dau/tinh-toan";
import { HO_SO_TRONG } from "../src/state/mau";
import type { MonId } from "../src/state/types";

// ---------- Đọc điểm ----------
assert.deepEqual(docDiem(""), { loai: "trong" });
assert.deepEqual(docDiem("  "), { loai: "trong" });
assert.deepEqual(docDiem("7,5"), { loai: "hopLe", gia: 7.5 });
assert.deepEqual(docDiem("7.25"), { loai: "hopLe", gia: 7.25 });
assert.deepEqual(docDiem("7,"), { loai: "hopLe", gia: 7 }, "gõ dở '7,' vẫn là 7");
assert.deepEqual(docDiem("10"), { loai: "hopLe", gia: 10 });
assert.deepEqual(docDiem("0"), { loai: "hopLe", gia: 0 });
assert.equal(docDiem("11").loai, "ngoaiKhoang");
assert.equal(docDiem("abc").loai, "khongPhaiSo");
assert.equal(docDiem("7.555").loai, "khongPhaiSo", "tối đa 2 chữ số thập phân");
assert.equal(docDiem("-1").loai, "khongPhaiSo");
assert.equal(vietDiem(7.5), "7,5");
assert.equal(vietDiem(null), "");

// ---------- Kiểm tra bước 1 ----------
const loiTrong = kiemTraBuoc1(HO_SO_TRONG);
assert.deepEqual(Object.keys(loiTrong).sort(), ["khoi", "nganhQuanTam", "tinh"]);
assert.deepEqual(kiemTraBuoc1({ ...HO_SO_TRONG, khoi: 12, tinh: "Hà Nội", nganhQuanTam: ["CNTT"] }), {});

// ---------- Tổ hợp tự tính (4 tổ hợp của app) ----------
const diem: Record<MonId, number | null> = { toan: 8, vatLy: 7, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: 8 };
const th = tinhCacToHop(diem);
assert.equal(th.find((t) => t.ma === "A01")!.tong, 23);
const a00 = th.find((t) => t.ma === "A00")!;
assert.equal(a00.tong, null, "thiếu môn thì không tính, không coi là 0");
assert.deepEqual(a00.thieu, ["hoaHoc"]);

// ---------- Gợi ý học phí ----------
assert.equal(goiYHocPhi(null, null), null);
assert.equal(goiYHocPhi("duoi30", "oNha")!.khoang, "dưới 30 triệu đồng/năm");
assert.equal(goiYHocPhi("tren100", null)!.khoang, "từ 100 triệu đồng/năm trở lên");
assert.equal(goiYHocPhi("30-60", "oNha")!.ghiChu, null);
assert.ok(goiYHocPhi("30-60", "oTro")!.ghiChu!.includes("ở trọ"));
assert.equal(demVuaNganSach("duoi30", [{ hocPhiMax: 25 }, { hocPhiMax: 35 }, {}]), 1, "ngành chưa có học phí không được tính là vừa");
assert.equal(demVuaNganSach("tren100", [{ hocPhiMax: 25 }, {}]), 2);

// ---------- Kết quả ngay sau khi tạo hồ sơ ----------
const chuaCo = ketQuaBanDau(null, ["CNTT"]);
assert.equal(chuaCo.coDiem, false);
assert.deepEqual(chuaCo.nhomQuanTam, []);
const kq = ketQuaBanDau(
  { tong: 24.5, toHop: "A01", soDuDiem: 120, soThuSuc: 40, theoNhom: [{ nhom: "Kinh tế", duDiem: 30, thuSuc: 5 }, { nhom: "CNTT", duDiem: 12, thuSuc: 6 }] },
  ["CNTT", "Y Dược"],
);
assert.equal(kq.coDiem, true);
assert.deepEqual(kq.nhomQuanTam, [{ nhom: "CNTT", duDiem: 12, thuSuc: 6 }, { nhom: "Y Dược", duDiem: 0, thuSuc: 0 }], "giữ thứ tự em chọn, nhóm không có thì 0");

// ---------- Tổ hợp cao nhất khi tính đủ (như Khám phá) ----------
const day6: Record<MonId, number | null> = { toan: 6, vatLy: 6, hoaHoc: 6, sinh: 6, nguVan: 9, tiengAnh: 6 };
assert.equal(toHopCaoNhatDayDu({ ...day6, nguVan: null, toan: null }, undefined, undefined), null, "chưa đủ tổ hợp nào thì null");
const khongThem = toHopCaoNhatDayDu(day6, undefined, undefined)!;
assert.equal(khongThem.uuTienCong, 0);
const coThem = toHopCaoNhatDayDu(day6, { lichSu: 9, diaLy: 9 }, undefined)!;
assert.equal(coThem.toHop, "C00", "Văn + Sử + Địa cao nhất khi có môn thêm");
assert.equal(coThem.tong, 27);
const coUuTien = toHopCaoNhatDayDu(day6, undefined, { khuVuc: "KV1", doiTuong: null })!;
assert.ok(coUuTien.uuTienCong > 0 && coUuTien.tong > khongThem.tong, "cộng điểm ưu tiên khu vực");
assert.equal(coUuTien.tong, Math.round((khongThem.tong + coUuTien.uuTienCong) * 100) / 100);

console.log("khoi-dau: tất cả kiểm tra đều qua");
