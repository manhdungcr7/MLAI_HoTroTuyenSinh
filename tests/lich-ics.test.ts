import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử xuất lịch (.ics, Google Calendar, sự kiện tuần). Chạy: npx tsx tests/lich-ics.test.ts
import assert from "node:assert/strict";
import { linkGoogleCalendar, suKienTuanNay, taoIcs } from "../src/engine/lich-ics";
import type { SuKienLich } from "../src/engine/ket-noi-kieu";
import { taoHoSoMau } from "../src/state/mau";
import type { AppState } from "../src/state/store";
import type { KhoiHoc, ViecCanHoc } from "../src/state/types";
import { NGAY_CO_DINH } from "./ngay-co-dinh";

const RE_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;

/** Gỡ gập dòng theo RFC 5545 (CRLF + một khoảng trắng). */
const goDong = (ics: string) => ics.replace(/\r\n /g, "").split("\r\n").filter((d) => d !== "");
const dongBatDau = (ics: string, tien: string) => goDong(ics).find((d) => d.startsWith(tien));

// 1) Cấu trúc và CRLF
const suKienMau: SuKienLich[] = [
  { tieuDe: "Ôn Toán; lớp 12, bài 3\\ mới", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T19:45:00+07:00", ghiChu: "Dòng một\nDòng hai, có dấu;" },
];
const ics = taoIcs(suKienMau);
assert.ok(!/(^|[^\r])\n/.test(ics), "mọi xuống dòng phải là CRLF");
assert.ok(ics.endsWith("\r\n"), "kết thúc bằng CRLF");
assert.equal(goDong(ics)[0], "BEGIN:VCALENDAR");
assert.equal(goDong(ics).at(-1), "END:VCALENDAR");
for (const dong of ics.split("\r\n")) assert.ok(dong.length === 0 || Buffer.byteLength(dong, "utf8") <= 75, `dòng quá 75 octet: ${dong}`);
for (const kq of ["VERSION:2.0", "PRODID:", "BEGIN:VTIMEZONE", "TZID:Asia/Ho_Chi_Minh", "TZOFFSETTO:+0700", "BEGIN:VEVENT", "END:VEVENT"]) {
  assert.ok(goDong(ics).some((d) => d.includes(kq)), `thiếu ${kq}`);
}

// 2) Múi giờ và thời gian
assert.equal(dongBatDau(ics, "DTSTART;"), "DTSTART;TZID=Asia/Ho_Chi_Minh:20261019T190000");
assert.equal(dongBatDau(ics, "DTEND;"), "DTEND;TZID=Asia/Ho_Chi_Minh:20261019T194500");
assert.ok(/^DTSTAMP:\d{8}T\d{6}Z$/.test(dongBatDau(ics, "DTSTAMP:")!), "DTSTAMP dạng UTC");
const lechNgay = taoIcs([{ tieuDe: "Muộn", batDau: "2026-10-19T23:30:00+07:00", ketThuc: "2026-10-19T23:50:00+07:00" }]);
assert.equal(dongBatDau(lechNgay, "DTSTART;"), "DTSTART;TZID=Asia/Ho_Chi_Minh:20261019T233000", "23:30 +07 không được lệch ngày");

// 3) Escape: \\ \; \, và xuống dòng \n
const summary = dongBatDau(ics, "SUMMARY:")!;
assert.equal(summary, "SUMMARY:Ôn Toán\\; lớp 12\\, bài 3\\\\ mới", "escape tiêu đề");
const mota = goDong(ics).find((d) => d.startsWith("DESCRIPTION:"))!;
assert.equal(mota, "DESCRIPTION:Dòng một\\nDòng hai\\, có dấu\\;", "escape mô tả có xuống dòng");

// 4) Gập dòng: mô tả dài tiếng Việt, không cắt giữa ký tự, nối lại đúng nguyên văn
const dai = "Đọc chậm từng đoạn, ghi ý chính bằng lời của em. ".repeat(12);
const icsDai = taoIcs([{ tieuDe: "Dài", batDau: "2026-10-19T08:00:00+07:00", ketThuc: "2026-10-19T08:30:00+07:00", ghiChu: dai }]);
for (const dong of icsDai.split("\r\n")) assert.ok(dong.length === 0 || Buffer.byteLength(dong, "utf8") <= 75, `gập dòng sai: ${dong}`);
const moTaDai = goDong(icsDai).find((d) => d.startsWith("DESCRIPTION:"))!;
assert.equal(moTaDai.slice("DESCRIPTION:".length), dai.replace(/,/g, "\\,").replace(/;/g, "\\;"), "gỡ gập dòng ra đúng nội dung");

// 5) UID ổn định giữa hai lần gọi, khác khi đổi giờ
const uid = (x: string) => dongBatDau(x, "UID:");
assert.equal(uid(taoIcs(suKienMau)), uid(taoIcs(suKienMau)), "UID không đổi giữa hai lần gọi");
assert.notEqual(uid(taoIcs(suKienMau)), uid(taoIcs([{ ...suKienMau[0], batDau: "2026-10-20T19:00:00+07:00", ketThuc: "2026-10-20T19:45:00+07:00" }])), "đổi giờ thì UID khác");

// 6) Sự kiện giờ sai bị bỏ qua, lịch rỗng vẫn hợp lệ
const xau = taoIcs([{ tieuDe: "Xấu", batDau: "2026-10-19 19:00", ketThuc: "2026-10-19T19:45:00+07:00" }, { tieuDe: "Ngược", batDau: "2026-10-19T10:00:00+07:00", ketThuc: "2026-10-19T09:00:00+07:00" }]);
assert.ok(!xau.includes("BEGIN:VEVENT"), "giờ sai hoặc ngược không tạo VEVENT");
assert.ok(taoIcs([]).includes("END:VCALENDAR"));

// 7) Liên kết Google Calendar giải mã ngược ra đúng giờ địa phương
const link = linkGoogleCalendar(suKienMau[0]);
const url = new URL(link);
assert.equal(url.origin + url.pathname, "https://calendar.google.com/calendar/render");
assert.equal(url.searchParams.get("action"), "TEMPLATE");
assert.equal(url.searchParams.get("ctz"), "Asia/Ho_Chi_Minh");
assert.equal(url.searchParams.get("text"), suKienMau[0].tieuDe, "tiêu đề giải mã đúng");
assert.equal(url.searchParams.get("dates"), "20261019T190000/20261019T194500", "giờ không có Z khi dùng ctz");
assert.equal(url.searchParams.get("details"), suKienMau[0].ghiChu, "mô tả giải mã đúng");
assert.ok(!link.includes("Z&") && !/dates=[^&]*Z/.test(link), "không kèm Z");

// 8) Sự kiện tuần lấy từ khối tự học thật (state cố định, tuần chứa NGAY_CO_DINH = 05/10 đến 11/10/2026)
const mau = taoHoSoMau();
const viec: ViecCanHoc = { ...mau.viec[0], id: "v-test", tuan: "2026-10-05", tieuDe: "Ôn hàm số bậc hai", lyDo: "Điểm Toán còn thấp hơn mục tiêu" };
const khoi = (o: Partial<KhoiHoc> & Pick<KhoiHoc, "id" | "ngay" | "batDau" | "ketThuc">): KhoiHoc => ({ viecId: null, ten: "Buổi", loai: "tuHoc", ...o });
const s: AppState = {
  ...mau,
  viec: [viec],
  khoiHoc: [
    khoi({ id: "k3", viecId: "v-test", ten: "Ôn hàm số bậc hai", ngay: "2026-10-06", batDau: "19:00", ketThuc: "19:45" }),
    khoi({ id: "k1", ten: "Xem trước bài Hóa", ngay: "2026-10-06", batDau: "08:00", ketThuc: "08:15", ghiChu: "Đọc lướt 15 phút để buổi mai nghe giảng dễ hơn." }),
    khoi({ id: "k2", ten: "Đêm muộn", ngay: "2026-10-07", batDau: "23:30", ketThuc: "23:50" }),
    khoi({ id: "kLop", ten: "Toán lớp", loai: "chinhKhoa", ngay: "2026-10-06", batDau: "07:00", ketThuc: "09:00" }),
    khoi({ id: "kTuanSau", ten: "Tuần sau", ngay: "2026-10-12", batDau: "08:00", ketThuc: "08:30" }),
  ],
};
const suKien = suKienTuanNay(s, NGAY_CO_DINH);
assert.equal(suKien.length, 3, "chỉ lấy khối tự học của tuần này");
assert.deepEqual(suKien.map((e) => e.batDau), ["2026-10-06T08:00:00+07:00", "2026-10-06T19:00:00+07:00", "2026-10-07T23:30:00+07:00"], "sắp theo giờ");
assert.equal(suKien[1].ghiChu, "Điểm Toán còn thấp hơn mục tiêu", "ghi chú lấy lý do của việc");
assert.equal(suKien[0].ghiChu, "Đọc lướt 15 phút để buổi mai nghe giảng dễ hơn.", "việc không có viecId thì lấy ghi chú khối");
assert.ok(suKien.every((e) => RE_GIO.test(e.batDau) && RE_GIO.test(e.ketThuc) && e.batDau < e.ketThuc));
assert.equal(suKienTuanNay({ ...s, khoiHoc: [] }, NGAY_CO_DINH).length, 0, "chưa xếp giờ thì mảng rỗng");

// 9) Hồ sơ mẫu thật: mọi sự kiện đúng định dạng, số lượng khớp khối tự học của tuần hiện tại
const hom = new Date();
const tuanHienTai = suKienTuanNay(mau, hom);
const ngayTuan = new Set(Array.from({ length: 7 }, (_, i) => { const d = new Date(hom.getFullYear(), hom.getMonth(), hom.getDate() - ((hom.getDay() + 6) % 7) + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }));
const kyVong = mau.khoiHoc.filter((k) => k.loai === "tuHoc" && ngayTuan.has(k.ngay)).length;
assert.equal(tuanHienTai.length, Math.min(kyVong, 40), "số sự kiện khớp khối tự học tuần này");
assert.ok(tuanHienTai.every((e) => RE_GIO.test(e.batDau) && RE_GIO.test(e.ketThuc) && e.batDau < e.ketThuc), "hồ sơ mẫu: giờ hợp lệ");
console.log(`lich-ics: ok (hồ sơ mẫu có ${tuanHienTai.length} sự kiện tuần này)`);
