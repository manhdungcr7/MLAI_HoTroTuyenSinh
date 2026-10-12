// Kiểm thử hàm thuần của Hôm nay và Hồ sơ. Chạy: npx tsx tests/hanh-trinh.test.ts
import assert from "node:assert/strict";
import { DUONG_DAN } from "../src/duong-dan";
import { chuDaiDien, goiYChoEm, hieuEm, loiChaoTheoChang, monThieuDiem, nhacLocHocPhi } from "../src/features/hanh-trinh/tinh-toan";
import { HO_SO_TRONG, TRANG_THAI_BAN_DAU, taoHoSoMau } from "../src/state/mau";
import { mucTieuDayDu } from "../src/state/chon";
import { THIEU_MUC_TIEU_MAU } from "../src/data/lua-chon-that";
import type { AppState } from "../src/state/store";
import type { HoSo } from "../src/state/types";

const voi = (hoSo: Partial<HoSo>, them: Partial<AppState> = {}): AppState =>
  ({ ...TRANG_THAI_BAN_DAU, ...them, hoSo: { ...HO_SO_TRONG, hoanTat: true, tinh: "Hà Nội", nganhQuanTam: ["CNTT"], ...hoSo } });
const diemDu = { toan: 8, vatLy: 7.5, hoaHoc: 7, sinh: 7, nguVan: 7, tiengAnh: 8 };
const sachChu = (a: string[]) => a.every((x) => !/NaN|undefined|null/.test(x));

// ---------- Lời chào theo chặng ----------
assert.match(loiChaoTheoChang(voi({ khoi: 11 })), /từng bước nhỏ/);
assert.match(loiChaoTheoChang(voi({ khoi: 12, giaiDoan: "Đã tốt nghiệp THPT" })), /điểm năm trước/);
assert.equal(loiChaoTheoChang(voi({ khoi: 12 }, { tamTrang: "met" })), "Hôm nay mình học nhẹ thôi nhé.", "mệt thì nói nhẹ trước");

// ---------- Gợi ý cho em: luôn đúng một việc, đi đúng nơi ----------
assert.equal(goiYChoEm(voi({ khoi: 11 })).den, DUONG_DAN.tracNghiem(), "lớp 10–11 chưa làm trắc nghiệm");
const coSoThich = { diem: { R: 1, I: 5, A: 1, S: 1, E: 2, C: 2 }, top: ["I", "C", "E"] as const, luc: "2026-10-06T08:00:00Z" };
assert.equal(goiYChoEm(voi({ khoi: 11, soThich: { ...coSoThich, top: [...coSoThich.top] } })).den, DUONG_DAN.khamPha(), "đã làm trắc nghiệm, chưa có nguyện vọng");
assert.equal(goiYChoEm(voi({ khoi: 12, giaiDoan: "Đã tốt nghiệp THPT" })).den, DUONG_DAN.batDau(2), "thi lại chưa có điểm");
assert.equal(goiYChoEm(voi({ khoi: 12, diem: diemDu })).den, DUONG_DAN.khamPha(), "lớp 12 chưa có mục tiêu, chưa có nguyện vọng");
assert.equal(goiYChoEm(voi({ khoi: 11 })).nhacHocPhi, null, "lớp 10–11 không nhắc học phí");

// ---------- Nhắc lọc học phí ----------
assert.ok(nhacLocHocPhi({ nganSach: "duoi30", tinh: "Hà Nội" }));
assert.ok(nhacLocHocPhi({ nganSach: "30-60", tinh: "Nghệ An" }), "ở tỉnh xa thành phố lớn");
assert.equal(nhacLocHocPhi({ nganSach: "30-60", tinh: "Hà Nội" }), null);
assert.equal(nhacLocHocPhi({ nganSach: null, tinh: "" }), null);

// ---------- Hồ sơ trống: không lỗi, không số vô nghĩa ----------
const trong = hieuEm({ ...TRANG_THAI_BAN_DAU, hoSo: HO_SO_TRONG });
assert.equal(trong.manh.length, 0);
assert.ok(trong.dayDu >= 0 && trong.dayDu < 20);
assert.equal(trong.boSung[0].den, DUONG_DAN.batDau(1), "mục đầu cần bổ sung dẫn về Bước 1");
assert.ok(sachChu([...trong.manh, ...trong.luuY, ...trong.uuTien, ...trong.boSung.map((b) => b.ten)]));

// ---------- Hồ sơ mẫu: đủ dữ liệu ----------
const mau = taoHoSoMau();
const x = hieuEm(mau);
assert.ok(x.manh.length > 0 && x.uuTien.length > 0);
assert.ok(x.uuTien[0].startsWith("Đạt "), "có mục tiêu thì ưu tiên đầu là đạt điểm mục tiêu");
assert.ok(x.dayDu >= 80, `hồ sơ mẫu gần đầy đủ (đang ${x.dayDu}%)`);
assert.ok(sachChu([...x.manh, ...x.luuY, ...x.uuTien]));

// ---------- Hồ sơ mẫu: mục tiêu hợp lý cho demo ----------
const mt = mucTieuDayDu(mau);
assert.ok(mt, "hồ sơ mẫu có mục tiêu");
assert.ok(mt.lc.hocPhiMin === undefined || mt.lc.hocPhiMin <= 60, `mục tiêu không vượt ngân sách 60 tr (đang ${mt.lc.hocPhiMin})`);
assert.ok(mt.lc.toHopXet?.includes("A01"), "đề án mục tiêu có ghi tổ hợp A01 mà hồ sơ mẫu dùng");
assert.ok(Object.keys(mt.lc.diemTheoNam ?? {}).length >= 2, "mục tiêu có từ hai năm điểm");
assert.ok(mt.conThieu >= THIEU_MUC_TIEU_MAU.it && mt.conThieu <= THIEU_MUC_TIEU_MAU.nhieu, `mục tiêu thiếu 1–2,5 điểm (đang ${mt.conThieu})`);
assert.equal(mau.nguyenVong[0], mau.mucTieu?.luaChonId, "NV1 là mục tiêu");

// ---------- Môn thiếu điểm, chữ đại diện ----------
assert.deepEqual(monThieuDiem(voi({ diem: { ...diemDu, vatLy: null } }), ["toan", "vatLy", "tiengAnh"]), ["vatLy"]);
assert.equal(chuDaiDien("Nguyễn Minh Anh"), "MA");
assert.equal(chuDaiDien("  An "), "A");
assert.equal(chuDaiDien(""), "");

console.log("hanh-trinh: tất cả kiểm tra đều qua");
