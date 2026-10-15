import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử việc cần học sinh từ mục tiêu thật và lịch tuần. Chạy: npx tsx tests/ke-hoach.test.ts
import assert from "node:assert/strict";
import { nganSachPhut, taoViecTuan, type DauVaoViecTuan } from "../src/engine/tao-viec";
import { CAU_HINH_MAC_DINH, xepLichTuan } from "../src/engine/xep-lich";
import { viecChoTuan } from "../src/features/ke-hoach/tao-viec-tuan";
import { tuanHienTai, viecCuaTuan } from "../src/state/chon";
import { taoHoSoMau } from "../src/state/mau";
import { LICH_CO_DINH_MAU } from "../src/data/lich-mau";
import type { MonId } from "../src/state/types";

const A00: MonId[] = ["toan", "vatLy", "hoaHoc"];
const dv = (o: Partial<DauVaoViecTuan> = {}): DauVaoViecTuan => ({
  toHop: A00, diem: { toan: 7, vatLy: 8.5, hoaHoc: 8, sinh: null, nguVan: null, tiengAnh: null }, diemMucTieu: 25, canCaiThien: [], tuan: "2026-10-05", chiSoTuan: 40, phutTuHoc: 15 * 60, ...o,
});

// 1) Ngân sách phút
assert.equal(nganSachPhut(900), 720, "80% thời gian trống");
assert.equal(nganSachPhut(900, "met"), 450, "mệt thì giảm một nửa");
assert.equal(nganSachPhut(100000), 1200, "không quá 20 giờ");

// 2) Môn thiếu nhiều nhất được nhiều thời gian và ưu tiên cao nhất
const v = taoViecTuan(dv());
const phutMon = (m: MonId) => v.filter((x) => x.mon === m).reduce((s, x) => s + x.phut, 0);
assert.ok(v.length >= 3 && v.every((x) => x.phut >= 25 && x.phut <= 115), "mỗi buổi 25–115 phút");
assert.ok(phutMon("toan") > phutMon("hoaHoc"), "Toán đang thiếu nhiều nhất phải nhiều giờ hơn Hóa");
assert.equal(v.find((x) => x.mon === "toan")!.mucUuTien, "cao");
assert.ok(v.reduce((s, x) => s + x.phut, 0) <= nganSachPhut(900) + 45, "tổng thời gian không vượt ngân sách quá một buổi tối thiểu");
assert.equal(new Set(v.map((x) => x.id)).size, v.length, "id không trùng");
assert.ok(v.every((x) => x.id.includes("2026-10-05") && x.tuan === "2026-10-05"), "mỗi việc gắn đúng tuần");
// lý do được tính từ số thật của em
const lyDoToan = v.find((x) => x.mon === "toan")!.lyDo;
assert.ok(lyDoToan.includes("7,0") && lyDoToan.includes("25,0") && /còn thiếu \d,\d/.test(lyDoToan), "lý do phải nêu điểm hiện tại, mục tiêu, phần thiếu");

// 3) Đã đủ điểm thì không còn mức "cao"; môn chưa có điểm được hỏi điểm đầu vào
const du = taoViecTuan(dv({ diemMucTieu: 22 })); // 7 + 8.5 + 8 = 23.5 >= 22
assert.ok(du.length > 0 && du.every((x) => x.mucUuTien !== "cao"), "đạt mục tiêu thì chỉ giữ nhịp");
const thieuDiem = taoViecTuan(dv({ diem: { toan: 7, vatLy: null, hoaHoc: 8, sinh: null, nguVan: null, tiengAnh: null } }));
assert.ok(thieuDiem.find((x) => x.mon === "vatLy")!.lyDo.includes("chưa có điểm"), "môn chưa có điểm phải nói rõ");

// 4) Điểm đang giảm thì được thêm thời gian; mệt thì ít việc hơn; chủ đề xoay theo tuần
const giam = taoViecTuan(dv({ doDoc: { hoaHoc: -0.5 } }));
const phutG = (m: MonId) => giam.filter((x) => x.mon === m).reduce((s, x) => s + x.phut, 0);
assert.ok(phutG("hoaHoc") >= phutMon("hoaHoc"), "môn đang giảm không được ít hơn");
assert.ok(giam.find((x) => x.mon === "hoaHoc")!.lyDo.includes("đang giảm"));
assert.ok(taoViecTuan(dv({ tamTrang: "met" })).reduce((s, x) => s + x.phut, 0) < v.reduce((s, x) => s + x.phut, 0), "mệt thì lịch nhẹ hơn");
const chuDe = (t: number) => taoViecTuan(dv({ chiSoTuan: t })).filter((x) => x.mon === "toan" && !x.tieuDe.includes("đề tính giờ")).map((x) => x.tieuDe).join("|");
assert.notEqual(chuDe(40), chuDe(41), "tuần khác thì ôn chủ đề khác");
assert.deepEqual(taoViecTuan(dv({ phutTuHoc: 30 })), [], "không còn giờ thì không tạo việc");

// 5) Chạy thật trên hồ sơ mẫu: việc tạo ra phải xếp được vào lịch, đúng tuần, không bị trùng giờ học
const mau = taoHoSoMau();
const tuan = tuanHienTai();
assert.ok(mau.viec.length >= 3 && mau.viec.every((x) => x.tuan === tuan), "hồ sơ mẫu có việc sinh từ mục tiêu, thuộc tuần này");
assert.ok(mau.khoiHoc.some((k) => k.viecId && k.loai === "tuHoc"), "việc đã được xếp giờ");
const kq = viecChoTuan(mau, tuan);
assert.ok(kq.ok && kq.moi >= 3);
// Xếp lại: cùng việc, cùng lịch cố định, không có buổi nào chồng tiết học
const r = xepLichTuan({ tuanBatDau: tuan, coDinh: LICH_CO_DINH_MAU, viec: mau.viec, cfg: CAU_HINH_MAC_DINH, tamTrang: mau.tamTrang });
assert.equal(r.chuaXep.length, 0, "đủ chỗ cho mọi việc trong tuần");
// Việc đã xong được giữ khi tạo lại
const daXong = mau.viec[0];
const lai = viecChoTuan({ ...mau, trangThaiViec: { ...mau.trangThaiViec, [daXong.id]: "xong" } }, tuan);
assert.ok(lai.ok && lai.viec.filter((x) => x.id === daXong.id).length === 1, "việc đã xong còn đúng một bản, không bị tạo trùng");
// Việc của tuần khác không lẫn vào tuần này
assert.deepEqual(viecCuaTuan([{ ...daXong, tuan: "2026-09-28" }, daXong], tuan).map((x) => x.tuan), [tuan]);
assert.equal(viecCuaTuan([{ ...daXong, tuan: undefined }], tuan).length, 1, "việc không ghi tuần (dữ liệu cũ) vẫn tính");
// Chưa có mục tiêu thì không tạo việc bừa
const khongMucTieu = viecChoTuan({ ...mau, mucTieu: null }, tuan);
assert.equal(khongMucTieu.ok, false);

console.log("ke-hoach: tất cả kiểm tra đều qua");
