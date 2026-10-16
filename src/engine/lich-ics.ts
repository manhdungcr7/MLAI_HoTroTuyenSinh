// Xuất kế hoạch tuần ra lịch: file .ics (RFC 5545) và liên kết "Thêm vào Google Calendar". TypeScript thuần, không React, không gọi mạng.
import type { AppState } from "@/state/store";
import type { SuKienLich } from "@/engine/ket-noi-kieu";
import { bayNgayCuaTuan, isoNgay, thuHaiCuaTuan } from "@/engine/xep-lich";

const MUI_GIO = "Asia/Ho_Chi_Minh";
const RE_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
const GIOI_HAN_SU_KIEN_TUAN = 40;
const TEN_LICH_MAC_DINH = "Kế hoạch tuần · Nguyện Vọng AI";

/** Băm FNV-1a 32 bit hai lần (hai hạt giống khác nhau) để UID ổn định và đủ ít trùng. */
function bamChuoi(chuoi: string): string {
  const mot = (seed: number) => {
    let h = seed;
    for (let i = 0; i < chuoi.length; i++) {
      h ^= chuoi.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  };
  return mot(0x811c9dc5) + mot(0x9e3779b1);
}

/** Số byte UTF-8 của một ký tự (đơn vị dòng trong RFC 5545 là octet). */
function byteUtf8(ky: string): number {
  const cp = ky.codePointAt(0) ?? 0;
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

/** Gập dòng: dòng đầu tối đa 75 octet, dòng nối bắt đầu bằng một khoảng trắng (tổng 75). Không cắt giữa ký tự UTF-8. */
function gapDong(dong: string): string[] {
  const ra: string[] = [];
  let hienTai = "";
  let soByte = 0;
  for (const ky of dong) {
    const b = byteUtf8(ky);
    const gioiHan = ra.length === 0 ? 75 : 74;
    if (soByte + b > gioiHan) {
      ra.push(hienTai);
      hienTai = "";
      soByte = 0;
    }
    hienTai += ky;
    soByte += b;
  }
  ra.push(hienTai);
  return ra.map((d, i) => (i === 0 ? d : ` ${d}`));
}

/** Escape giá trị văn bản: \\ trước, rồi \; \, và xuống dòng thành \n. */
const escapeIcs = (x: string): string =>
  x.replace(/\r\n|\r|\n/g, "\n").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** "2026-10-19T19:00:00+07:00" -> "20261019T190000" (giờ địa phương, bỏ múi). */
const gioCucBo = (iso: string): string => iso.slice(0, 19).replace(/[-:]/g, "");

/** Dấu thời gian UTC cho DTSTAMP, ví dụ 20261016T120000Z. */
const dauThoiGianUtc = (d: Date): string => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

const VTIMEZONE_HCM = [
  "BEGIN:VTIMEZONE",
  `TZID:${MUI_GIO}`,
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0700",
  "TZOFFSETTO:+0700",
  "TZNAME:ICT",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/**
 * Tạo nội dung lịch iCalendar. Mỗi sự kiện có UID băm từ tiêu đề + giờ bắt đầu (cùng việc, cùng giờ thì UID không đổi).
 * Giờ dùng TZID=Asia/Ho_Chi_Minh kèm khối VTIMEZONE, nên không cần đổi sang UTC. Sự kiện có giờ sai định dạng bị bỏ qua.
 */
export function taoIcs(suKien: SuKienLich[], tenLich: string = TEN_LICH_MAC_DINH): string {
  const dauThoiGian = dauThoiGianUtc(new Date());
  const dong: string[] = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Nguyen Vong AI//Ke hoach tuan//VI",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(tenLich)}`,
    `X-WR-TIMEZONE:${MUI_GIO}`,
    ...VTIMEZONE_HCM,
  ];
  for (const e of suKien) {
    if (!RE_GIO.test(e.batDau) || !RE_GIO.test(e.ketThuc) || e.batDau >= e.ketThuc) continue;
    dong.push(
      "BEGIN:VEVENT",
      `UID:nvai-${bamChuoi(`${e.tieuDe}|${e.batDau}`)}@nguyenvongai`,
      `DTSTAMP:${dauThoiGian}`,
      `DTSTART;TZID=${MUI_GIO}:${gioCucBo(e.batDau)}`,
      `DTEND;TZID=${MUI_GIO}:${gioCucBo(e.ketThuc)}`,
      `SUMMARY:${escapeIcs(e.tieuDe)}`,
    );
    if (e.ghiChu) dong.push(`DESCRIPTION:${escapeIcs(e.ghiChu)}`);
    dong.push("END:VEVENT");
  }
  dong.push("END:VCALENDAR");
  return dong.flatMap(gapDong).join("\r\n") + "\r\n";
}

/** Liên kết mở form "Tạo sự kiện" của Google Calendar với giờ địa phương Việt Nam (ctz, không kèm Z). */
export function linkGoogleCalendar(e: SuKienLich): string {
  const tham = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(e.tieuDe)}`,
    `dates=${gioCucBo(e.batDau)}/${gioCucBo(e.ketThuc)}`,
    `ctz=${encodeURIComponent(MUI_GIO)}`,
  ];
  if (e.ghiChu) tham.push(`details=${encodeURIComponent(e.ghiChu)}`);
  return `https://calendar.google.com/calendar/render?${tham.join("&")}`;
}

/**
 * Sự kiện của tuần chứa `bayGio` lấy từ lịch đã xếp giờ thật (khối tự học, kể cả "xem trước bài").
 * Ghi chú ưu tiên lý do của việc (trường lyDo), rồi đến ghi chú của khối. Tối đa 40 sự kiện, sắp theo giờ.
 */
export function suKienTuanNay(s: AppState, bayGio: Date = new Date()): SuKienLich[] {
  const ngays = new Set(bayNgayCuaTuan(thuHaiCuaTuan(isoNgay(bayGio))));
  const viecTheoId = new Map(s.viec.map((v) => [v.id, v] as const));
  const ra: SuKienLich[] = [];
  for (const k of s.khoiHoc) {
    if (k.loai !== "tuHoc" || !ngays.has(k.ngay)) continue;
    const batDau = `${k.ngay}T${k.batDau}:00+07:00`;
    const ketThuc = `${k.ngay}T${k.ketThuc}:00+07:00`;
    if (!RE_GIO.test(batDau) || !RE_GIO.test(ketThuc) || batDau >= ketThuc) continue;
    const viec = k.viecId ? viecTheoId.get(k.viecId) : undefined;
    const ghiChu = viec?.lyDo || k.ghiChu || undefined;
    ra.push({ tieuDe: k.ten, batDau, ketThuc, ...(ghiChu ? { ghiChu } : {}) });
  }
  ra.sort((a, b) => a.batDau.localeCompare(b.batDau));
  return ra.slice(0, GIOI_HAN_SU_KIEN_TUAN);
}
