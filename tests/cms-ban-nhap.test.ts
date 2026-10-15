// Bản nháp CMS: khóa, ghi/đọc đúng người, chặn nháp của người khác, kiểm hình dạng, giới hạn kích thước, trình duyệt chặn.
import assert from "node:assert/strict";
import {
  khoaNhap, ghiBanNhap, docBanNhap, xoaBanNhap, gioPhut, laDoiTuongChuoi, GIOI_HAN_NHAP,
} from "../cms/src/trang-thai/ban-nhap";

// localStorage giả lập, có thể bật chế độ bị chặn.
const kho = new Map<string, string>();
let bi = { doc: false, ghi: false, xoa: false };
const gia = {
  getItem: (k: string) => { if (bi.doc) throw new Error("bi chặn"); return kho.get(k) ?? null; },
  setItem: (k: string, v: string) => { if (bi.ghi) throw new Error("đầy"); kho.set(k, v); },
  removeItem: (k: string) => { if (bi.xoa) throw new Error("bi chặn"); kho.delete(k); },
};
Object.defineProperty(globalThis, "localStorage", { value: gia, configurable: true });
const reset = () => { kho.clear(); bi = { doc: false, ghi: false, xoa: false }; };

interface Form { ten: string; ghiChu: string }
const laForm = laDoiTuongChuoi<Form>(["ten", "ghiChu"]);

// 1) Khóa đúng dạng cms:nhap:<loaiForm>:<id>
assert.equal(khoaNhap("thong-tin", "ABC:hoc_phi:moi"), "cms:nhap:thong-tin:ABC:hoc_phi:moi");

// 2) Ghi rồi đọc lại đúng người, kèm thời điểm lưu
reset();
const k = khoaNhap("thong-tin", "ABC:hoc_phi:moi");
assert.equal(ghiBanNhap(k, "a@x.vn", { ten: "Học phí", ghiChu: "nháp" }, 1_700_000_000_000), true);
assert.deepEqual(docBanNhap(k, "a@x.vn", laForm), { du: { ten: "Học phí", ghiChu: "nháp" }, luuLuc: 1_700_000_000_000 });

// 3) Người khác đăng nhập trên cùng máy: không thấy nháp, và không bị xóa
assert.equal(docBanNhap(k, "b@x.vn", laForm), null);
assert.ok(kho.has(k), "nháp của người đầu vẫn còn");

// 4) Không có email thì không ghi, không đọc (đóng cửa, không lộ)
assert.equal(ghiBanNhap(k, "", { ten: "x", ghiChu: "y" }), false);
assert.equal(docBanNhap(k, "", laForm), null);

// 5) Hình dạng hỏng: JSON lỗi, sai phiên bản, sai kiểu thời điểm, thiếu trường, không phải đối tượng
const sai = (chuoi: string) => { kho.set(k, chuoi); return docBanNhap(k, "a@x.vn", laForm); };
assert.equal(sai("{không phải json"), null);
assert.equal(sai(JSON.stringify({ v: 2, email: "a@x.vn", luuLuc: 1, du: { ten: "a", ghiChu: "b" } })), null);
assert.equal(sai(JSON.stringify({ v: 1, email: "a@x.vn", luuLuc: "hôm qua", du: { ten: "a", ghiChu: "b" } })), null);
assert.equal(sai(JSON.stringify({ v: 1, email: "a@x.vn", luuLuc: 1, du: { ten: "a" } })), null);
assert.equal(sai(JSON.stringify({ v: 1, email: "a@x.vn", luuLuc: 1, du: { ten: 5, ghiChu: "b" } })), null);
assert.equal(sai("null"), null);
assert.equal(sai("[1,2]"), null);

// 6) Giới hạn kích thước: quá lớn thì không ghi và không để lại gì
reset();
const lon = { ten: "x".repeat(GIOI_HAN_NHAP), ghiChu: "" };
assert.equal(ghiBanNhap(k, "a@x.vn", lon), false);
assert.equal(kho.has(k), false);

// 7) Trình duyệt chặn: không ném lỗi ra ngoài, kết quả an toàn
reset();
bi = { doc: false, ghi: true, xoa: false };
assert.equal(ghiBanNhap(k, "a@x.vn", { ten: "a", ghiChu: "b" }), false);
bi = { doc: true, ghi: false, xoa: false };
assert.equal(docBanNhap(k, "a@x.vn", laForm), null);
bi = { doc: false, ghi: false, xoa: true };
assert.doesNotThrow(() => xoaBanNhap(k));
reset();

// 8) Xóa nháp: sau khi xóa không còn gì để đọc
ghiBanNhap(k, "a@x.vn", { ten: "a", ghiChu: "b" });
xoaBanNhap(k);
assert.equal(docBanNhap(k, "a@x.vn", laForm), null);

// 9) Giờ:phút theo giờ máy, luôn hai chữ số
assert.equal(gioPhut(new Date(2026, 9, 13, 9, 5).getTime()), "09:05");
assert.equal(gioPhut(new Date(2026, 9, 13, 21, 47).getTime()), "21:47");

// 10) Hàm kiểm hình dạng: đối tượng thiếu khóa hoặc không phải chuỗi bị loại
assert.equal(laForm(null), false);
assert.equal(laForm("chuỗi"), false);
assert.equal(laForm({ ten: "a" }), false);
assert.equal(laForm({ ten: "a", ghiChu: "" }), true);

console.log("cms-ban-nhap: ok");
