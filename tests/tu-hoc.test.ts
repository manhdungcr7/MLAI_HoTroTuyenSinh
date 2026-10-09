// Kiểm tra các hàm thuần của slice S8 (Tiến độ + tự học). Chạy: npx tsx tests/tu-hoc.test.ts
import assert from "node:assert/strict";
import { CAU_HINH_MAC_DINH } from "../src/engine/xep-lich";
import { LICH_CO_DINH_MAU, VIEC_MAU } from "../src/data/lich-mau";
import { DUONG_DAN } from "../src/duong-dan";
import type { DiemThi, KhoiHoc, LichSuHoanThanh, TrangThaiViec } from "../src/state/types";
import { loaiCuaCanhBao, taoCanhBao, type DuLieuCanhBao } from "../src/features/tu-hoc/canh-bao";
import { CAU_NOI, chonCauNoi } from "../src/features/tu-hoc/cau-noi";
import { nhacSapToi } from "../src/features/tu-hoc/nhac-nho";
import {
  buoiBoLo, chuoiNgayHoc, demTienDo, monTangLienTiep, nhanThoiDiem, soVoiTuanTruoc, uocLuongGioTuHoc, xuHuongCacMon,
} from "../src/features/tu-hoc/tinh-tien-do";

// Thứ 5, 08/10/2026 lúc 20:00 (tuần 05/10 – 11/10)
const BAY_GIO = new Date(2026, 9, 8, 20, 0);
const khoi = (id: string, viecId: string, ngay: string, batDau: string, ketThuc: string, mon: KhoiHoc["mon"] = "vatLy"): KhoiHoc =>
  ({ id, viecId, ten: id, loai: "tuHoc", mon, ngay, batDau, ketThuc });
const rong: DuLieuCanhBao = { viec: [], trangThaiViec: {}, khoiHoc: [], coDinh: [], diemThi: [], lichSu: [] };

// 1) Thời điểm dễ đọc
assert.equal(nhanThoiDiem(new Date(2026, 9, 8, 9, 5), BAY_GIO), "Hôm nay, 09:05");
assert.equal(nhanThoiDiem(new Date(2026, 9, 7, 21, 0), BAY_GIO), "Hôm qua, 21:00");
assert.equal(nhanThoiDiem(new Date(2026, 9, 9, 7, 0), BAY_GIO), "Ngày mai, 07:00");
assert.equal(nhanThoiDiem(new Date(2026, 9, 5, 19, 20), BAY_GIO), "T2 5/10, 19:20");

// 2) Hồ sơ trống: không cảnh báo, không lỗi
assert.deepEqual(taoCanhBao(rong, BAY_GIO), []);
assert.equal(demTienDo(rong, BAY_GIO).phanTram, 0);
assert.equal(soVoiTuanTruoc([], BAY_GIO), null, "không có tuần trước thì không so sánh");

// 3) Bỏ lỡ 2 buổi Vật lý → cảnh báo có nút tới Lịch; buổi chưa tới giờ không tính
const boLo: DuLieuCanhBao = {
  ...rong, viec: VIEC_MAU, coDinh: LICH_CO_DINH_MAU,
  khoiHoc: [
    khoi("a", "v-ly-dien", "2026-10-06", "20:00", "21:00"),
    khoi("b", "v-ly-dien", "2026-10-07", "20:00", "21:00"),
    khoi("c", "v-ly-dien", "2026-10-08", "20:30", "21:30"), // tối nay, chưa tới giờ
    khoi("d", "v-toan-ham-so", "2026-10-06", "15:00", "16:00", "toan"),
  ],
};
assert.equal(buoiBoLo(boLo, BAY_GIO).length, 3);
const cb1 = taoCanhBao(boLo, BAY_GIO);
const canhBaoBoLo = cb1.find((c) => loaiCuaCanhBao(c) === "boLo");
assert.ok(canhBaoBoLo, "phải có cảnh báo bỏ lỡ");
assert.equal(canhBaoBoLo!.tieuDe, "Em đã bỏ lỡ 2 buổi Vật lý");
assert.equal(canhBaoBoLo!.hanhDong?.den, DUONG_DAN.tuan("lich"));
const td1 = demTienDo(boLo, BAY_GIO);
assert.equal(td1.quaHan, 2, "2 việc có buổi quá giờ");
assert.equal(td1.conLai, VIEC_MAU.length);

// 4) Đã xong thì không còn là bỏ lỡ
const daXong = { ...boLo, trangThaiViec: { "v-ly-dien": "xong" } as Record<string, TrangThaiViec> };
assert.ok(!taoCanhBao(daXong, BAY_GIO).some((c) => loaiCuaCanhBao(c) === "boLo"));

// 5) Giữa tuần còn ≥2 việc quan trọng → "Cần điều chỉnh kế hoạch tuần này"
// Chỉ nhắc khi các buổi đã xếp của ≥2 việc quan trọng đều ĐÃ QUA mà chưa xong (buổi "c" còn ở phía trước nên không tính)
assert.ok(!cb1.some((c) => loaiCuaCanhBao(c) === "dieuChinh"), "còn buổi phía trước thì chưa phải chậm");
const cb2 = taoCanhBao({ ...boLo, khoiHoc: boLo.khoiHoc.filter((k) => k.id !== "c") }, BAY_GIO);
const dc = cb2.find((c) => loaiCuaCanhBao(c) === "dieuChinh");
assert.ok(dc && dc.hanhDong?.nhan === "Xem đề xuất điều chỉnh" && dc.hanhDong.den === DUONG_DAN.tuan("lich"));
// Kế hoạch vừa tạo giữa tuần, mọi buổi còn ở phía trước: không được báo "cần điều chỉnh"
assert.ok(!taoCanhBao({ ...rong, viec: VIEC_MAU, coDinh: LICH_CO_DINH_MAU, khoiHoc: [khoi("m1", "v-ly-dien", "2026-10-09", "20:00", "21:00"), khoi("m2", "v-toan-ham-so", "2026-10-10", "15:00", "16:00", "toan")] }, BAY_GIO).some((c) => loaiCuaCanhBao(c) === "dieuChinh"));
// Đầu tuần (thứ 2) chưa nhắc
assert.ok(!taoCanhBao({ ...rong, viec: VIEC_MAU, coDinh: LICH_CO_DINH_MAU }, new Date(2026, 9, 5, 9)).some((c) => loaiCuaCanhBao(c) === "dieuChinh"));

// 6) Trùng giờ: tự học đè câu lạc bộ thứ 6? (Thứ 6 có học thêm Vật lý 19:15–21:00)
const trung = taoCanhBao({ ...rong, coDinh: LICH_CO_DINH_MAU, khoiHoc: [khoi("t", "v-anh-reading", "2026-10-09", "19:30", "20:30", "tiengAnh")] }, BAY_GIO);
const cbTrung = trung.find((c) => loaiCuaCanhBao(c) === "trung");
assert.ok(cbTrung && cbTrung.hanhDong?.den === DUONG_DAN.tuan("lich"));
// Hai tiết cố định trùng nhau → dẫn tới sửa lịch học
const haiTiet = taoCanhBao({ ...rong, coDinh: [
  { id: "x", ten: "X", loai: "chinhKhoa", thu: 7, batDau: "08:00", ketThuc: "09:00" },
  { id: "y", ten: "Y", loai: "hocThem", thu: 7, batDau: "08:30", ketThuc: "10:00" },
] }, BAY_GIO);
assert.equal(haiTiet.find((c) => loaiCuaCanhBao(c) === "trung")?.hanhDong?.den, DUONG_DAN.caiDatLichHoc());

// 7) Việc bỏ qua → tới chi tiết việc
const lsBoQua: LichSuHoanThanh[] = [{ viecId: "v-van-dan-y", ten: "Văn", luc: BAY_GIO.toISOString(), trangThai: "boQua" }];
const bq = taoCanhBao({ ...rong, viec: VIEC_MAU, coDinh: LICH_CO_DINH_MAU, trangThaiViec: { "v-van-dan-y": "boQua" }, lichSu: lsBoQua }, BAY_GIO);
assert.equal(bq.find((c) => loaiCuaCanhBao(c) === "boQua")?.hanhDong?.den, DUONG_DAN.viec("v-van-dan-y"));

// 8) Điểm tăng 3 lần liền → ghi nhận tích cực, không có hành động
const diem = (mon: DiemThi["mon"], ds: number[]): DiemThi[] => ds.map((d, i) => ({ mon, diem: d, ngay: `2026-0${i + 6}-01` }));
const dThi = [...diem("toan", [7.2, 7.6, 8.0]), ...diem("vatLy", [7.0, 6.8, 7.0])];
assert.deepEqual(monTangLienTiep(dThi).map((x) => x.mon), ["toan"]);
const tang = taoCanhBao({ ...rong, diemThi: dThi }, BAY_GIO);
assert.equal(tang.length, 1);
assert.equal(tang[0].tone, "luc");
assert.equal(tang[0].hanhDong, undefined);
const xh = xuHuongCacMon({ diemThi: dThi, mucTieu: null });
assert.equal(xh.find((x) => x.mon === "toan")?.chenh, 0.4);
assert.equal(xh.find((x) => x.mon === "vatLy")?.chenh, 0.2);

// 9) Không spam: tối đa 4 dòng, cảnh báo đỏ đứng trước
const nhieu = taoCanhBao({ ...boLo, coDinh: LICH_CO_DINH_MAU, diemThi: dThi, trangThaiViec: { "v-van-dan-y": "boQua" }, lichSu: lsBoQua,
  khoiHoc: [...boLo.khoiHoc, khoi("t", "v-anh-reading", "2026-10-09", "19:30", "20:30", "tiengAnh")] }, BAY_GIO);
assert.ok(nhieu.length <= 4);
assert.equal(nhieu[0].tone, "do");

// 10) So với tuần trước chỉ khi tuần trước có dữ liệu
const ls: LichSuHoanThanh[] = [
  { viecId: "a", ten: "A", luc: new Date(2026, 9, 7, 20).toISOString(), trangThai: "xong" },
  { viecId: "b", ten: "B", luc: new Date(2026, 9, 6, 20).toISOString(), trangThai: "xong" },
  { viecId: "c", ten: "C", luc: new Date(2026, 9, 2, 20).toISOString(), trangThai: "xong" },
];
assert.deepEqual(soVoiTuanTruoc(ls, BAY_GIO), { tuanNay: 2, tuanTruoc: 1, chenh: 1 });
assert.equal(chuoiNgayHoc(ls, BAY_GIO), 2, "học liền 6/10 và 7/10");

// 11) Ước lượng giờ tự học: ngày nghỉ = 0, không vượt trần mỗi ngày
const uoc = uocLuongGioTuHoc(LICH_CO_DINH_MAU, { ...CAU_HINH_MAC_DINH, ngayNghi: [7] }, "2026-10-05");
assert.equal(uoc.theoNgay[6].phut, 0);
assert.ok(uoc.theoNgay.every((n) => n.phut <= CAU_HINH_MAC_DINH.gioHocToiDaMoiNgay * 60));
assert.ok(uoc.tongPhut > 0);

// 12) Nhắc sắp tới: trong 24 giờ, đúng thứ tự, có nhắc chuẩn bị bài tối nay cho tiết ngày mai
const nhac = nhacSapToi({
  coDinh: LICH_CO_DINH_MAU, trangThaiViec: {}, nhacNho: { bat: true, truocPhut: 15, nhacChuanBiBai: true, gioChuanBiBai: "20:30" },
  khoiHoc: [khoi("k1", "v-ly-dien", "2026-10-08", "21:00", "21:45"), khoi("k2", "v-ly-dien", "2026-10-07", "21:00", "21:45")],
}, BAY_GIO);
assert.ok(nhac.every((n) => n.luc > BAY_GIO && n.luc.getTime() <= BAY_GIO.getTime() + 24 * 3_600_000));
assert.ok(nhac.some((n) => n.loai === "chuanBi"), "tối nay nhắc chuẩn bị bài cho thứ 6");
assert.ok(nhac.some((n) => n.id === "tuHoc:k1") && !nhac.some((n) => n.id === "tuHoc:k2"));
assert.ok(nhac.some((n) => n.loai === "diHoc" && n.tieuDe === "Hóa học (lớp học)"), "sáng mai thứ 6 có Hóa");
for (let i = 1; i < nhac.length; i++) assert.ok(nhac[i - 1].luc <= nhac[i].luc);

// 13) Câu động lực: đủ 5 nhóm, câu ngắn, nhóm ưu tiên lên đầu
assert.ok(CAU_NOI.length >= 25);
assert.equal(new Set(CAU_NOI.map((c) => c.nhom)).size, 5);
assert.ok(CAU_NOI.every((c) => c.cau.length <= 70), "câu ngắn");
assert.equal(chonCauNoi(123, 0, "nghiNgoi").nhom, "nghiNgoi");

console.log("tu-hoc: tất cả kiểm tra đều qua");
