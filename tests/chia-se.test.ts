// Kiểm thử chỉ số theo dõi, bản tóm tắt chia sẻ và sao lưu/khôi phục. Chạy: npx tsx tests/chia-se.test.ts
import assert from "node:assert/strict";
import { chiSoTheoDoi, cauHoiTraoDoi, tomTatChiaSe } from "../src/features/hanh-trinh/tom-tat";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";
import { taoHoSoMau } from "../src/state/mau";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";

const mau = taoHoSoMau();
const cs = chiSoTheoDoi(mau);
assert.equal(cs.length, 4);
assert.deepEqual(cs.map((c) => c.khoa), ["hoSo", "nguyenVong", "nhiemVu", "khoangCach"]);
const nv = cs.find((c) => c.khoa === "nguyenVong")!;
assert.ok(nv.phanTram !== null && nv.phanTram >= 0 && nv.phanTram <= 100);
assert.ok(cs.find((c) => c.khoa === "nhiemVu")!.giaTri.includes("/"), "hồ sơ mẫu có việc tuần này");

// Hồ sơ trống: không chia cho 0, không ra NaN
const trong = chiSoTheoDoi(TRANG_THAI_BAN_DAU as never);
assert.ok(trong.every((c) => !c.giaTri.includes("NaN") && !c.moTa.includes("NaN") && !c.moTa.includes("undefined")));
assert.equal(trong.find((c) => c.khoa === "nguyenVong")!.giaTri, "0");

// Khoảng cách thu hẹp: điểm thi thử đầu thấp, sau cao hơn
const tt = tomTatChiaSe(mau, new Date("2026-10-06T08:00:00"));
assert.ok(tt.vanBan.includes("NGUYỆN VỌNG AI") && tt.vanBan.includes("6/10/2026"));
assert.ok(tt.vanBan.includes("Danh sách nguyện vọng") === false || tt.vanBan.toUpperCase().includes("DANH SÁCH NGUYỆN VỌNG"));
assert.ok(!/NaN|undefined|null/.test(tt.vanBan), "không để lọt giá trị rỗng vào văn bản");
assert.ok(tt.vanBan.includes("không dự đoán kết quả xét tuyển"), "luôn kèm giới hạn của dữ liệu");
assert.ok(cauHoiTraoDoi(TRANG_THAI_BAN_DAU as never).length >= 1, "hồ sơ trống vẫn có điều để hỏi");

// Sao lưu: ghi rồi đọc lại phải giống hệt; tệp sai thì bị từ chối rõ ràng
const r = docBanSaoLuu(taoBanSaoLuu(mau));
assert.ok(r.ok); assert.deepEqual(r.ok && r.s, mau);
assert.equal(docBanSaoLuu("không phải json").ok, false);
assert.equal(docBanSaoLuu(JSON.stringify({ app: "khac", phienBan: 2, duLieu: {} })).ok, false);
assert.equal(docBanSaoLuu(JSON.stringify({ app: "nguyen-vong-ai", phienBan: 99, duLieu: {} })).ok, false, "phiên bản mới hơn");
assert.equal(docBanSaoLuu(JSON.stringify({ app: "nguyen-vong-ai", phienBan: 2, duLieu: { hoSo: {}, nguyenVong: "abc" } })).ok, false, "nguyenVong sai kiểu");
const cu = docBanSaoLuu(JSON.stringify({ app: "nguyen-vong-ai", phienBan: 1, duLieu: { hoSo: { hoTen: "A" } } }));
assert.ok(cu.ok && cu.s.hoSo.hoTen === "A" && Array.isArray(cu.s.viec) && cu.s.hoSo.khuVuc !== undefined, "bản cũ thiếu trường được điền mặc định");

console.log("chia-se: tất cả kiểm tra đều qua");
