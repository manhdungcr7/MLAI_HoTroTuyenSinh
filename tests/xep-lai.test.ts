// Kiểm thử engine xếp lịch ở các tình huống biên: Chủ nhật nghỉ, lịch rỗng, học thêm sát giờ ăn, xếp lại tuần,
// lớp 11, ôn nhẹ, tiêu đề đề tính giờ, gom buổi trong ngày. Không phụ thuộc đồng hồ máy: dùng NGAY_CO_DINH.
// Chạy: npx tsx tests/xep-lai.test.ts
import assert from "node:assert/strict";
import { LICH_CO_DINH_MAU, VIEC_MAU } from "../src/data/lich-mau";
import { taoViecTuan, tenPhanDe, type DauVaoViecTuan, NGAN_SACH_ON_NHE } from "../src/engine/tao-viec";
import {
  CAU_HINH_MAC_DINH, isoNgay, khungTrongTrongNgay, phatHienTrung, phutTuGio, thuHaiCuaTuan, xepLichTuan,
} from "../src/engine/xep-lich";
import { dauVaoViecTuan, dauVaoViecTuanNhe, viecChoTuan } from "../src/features/ke-hoach/tao-viec-tuan";
import { viecTrongNgay } from "../src/features/hanh-trinh/tinh-toan";
import { uocLuongGioTuHoc } from "../src/features/tu-hoc/tinh-tien-do";
import { taoHoSoMau } from "../src/state/mau";
import { xepLaiTuan } from "../src/state/xep-lai";
import type { AppState } from "../src/state/store";
import type { KhoiHoc, MonId, TietCoDinh, ViecCanHoc } from "../src/state/types";
import { NGAY_CO_DINH, ngayThu } from "./ngay-co-dinh";

const TUAN = thuHaiCuaTuan(isoNgay(NGAY_CO_DINH)); // 2026-10-05 (thứ 2)
assert.equal(TUAN, "2026-10-05");
const CN = "2026-10-11"; // Chủ nhật của tuần
const cfgNghiCN = { ...CAU_HINH_MAC_DINH, ngayNghi: [7] };
const phutKhoi = (k: KhoiHoc) => phutTuGio(k.ketThuc) - phutTuGio(k.batDau);

// ---------- 1) Chủ nhật nghỉ vẫn có buổi xem trước bài thứ Hai ----------
{
  const kq = xepLichTuan({ tuanBatDau: TUAN, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: cfgNghiCN });
  const cn = kq.khoi.filter((k) => k.ngay === CN);
  assert.ok(cn.length >= 2, "thứ Hai có 2 môn nên Chủ nhật tối phải có 2 buổi xem trước");
  assert.ok(cn.every((k) => k.viecId === null && k.ten.startsWith("Xem trước bài")), "ngày nghỉ chỉ có buổi xem trước bài, không có việc khác");
  for (const k of cn) {
    assert.ok(phutTuGio(k.batDau) >= 19 * 60, "xem trước sau 19:00, không đè giờ ăn tối");
    assert.ok(phutTuGio(k.ketThuc) <= phutTuGio(cfgNghiCN.gioKetThuc) - 30, "xong trước giờ ngủ");
  }
  assert.equal(phatHienTrung(cn).length, 0, "các buổi xem trước không trùng giờ");
  // ngày nghỉ khác (thứ Bảy khi nghỉ cả thứ 7 và CN) vẫn không có gì
  const kqNghiT7 = xepLichTuan({ tuanBatDau: TUAN, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: { ...CAU_HINH_MAC_DINH, ngayNghi: [6, 7] } });
  assert.equal(kqNghiT7.khoi.filter((k) => k.ngay === "2026-10-10").length, 0, "chỉ Chủ nhật được ngoại lệ, ngày nghỉ khác vẫn trống");

  // Trần ngày: chỉ cho 15 phút/ngày (tâm trạng tốt) thì Chủ nhật chỉ còn một buổi xem trước
  const tran = xepLichTuan({ tuanBatDau: TUAN, coDinh: LICH_CO_DINH_MAU, viec: [], cfg: { ...cfgNghiCN, gioHocToiDaMoiNgay: 0.25 }, tamTrang: "tot" });
  assert.equal(tran.khoi.filter((k) => k.ngay === CN).length, 1, "trần 15 phút/ngày tính cả buổi xem trước ở Chủ nhật");
  assert.equal(tran.khoi.filter((k) => k.ngay === CN).reduce((s, k) => s + phutKhoi(k), 0), 15);

  // tuNgay sau Chủ nhật thì không xếp lại Chủ nhật; Chủ nhật không nghỉ thì như mọi ngày
  const sauCN = xepLichTuan({ tuanBatDau: TUAN, tuNgay: "2026-10-10", coDinh: LICH_CO_DINH_MAU, viec: [], cfg: cfgNghiCN });
  assert.ok(sauCN.khoi.every((k) => k.ngay >= "2026-10-10"), "không xếp vào ngày đã qua");
  const khongNghi = xepLichTuan({ tuanBatDau: TUAN, coDinh: LICH_CO_DINH_MAU, viec: VIEC_MAU, cfg: CAU_HINH_MAC_DINH });
  assert.ok(khongNghi.khoi.some((k) => k.ngay === CN), "Chủ nhật không nghỉ: vẫn xếp như thường");
}

// ---------- 2) Lịch rỗng ----------
{
  const rong = xepLichTuan({ tuanBatDau: TUAN, coDinh: [], viec: [], cfg: CAU_HINH_MAC_DINH });
  assert.deepEqual(rong.khoi, [], "không có tiết và không có việc thì không có khối nào (kể cả xem trước bài)");
  assert.deepEqual(rong.chuaXep, []);
  const chiViec = xepLichTuan({ tuanBatDau: TUAN, coDinh: [], viec: VIEC_MAU, cfg: CAU_HINH_MAC_DINH });
  assert.equal(chiViec.chuaXep.length, 0, "lịch trống hoàn toàn thì xếp được hết");
  assert.ok(chiViec.khoi.every((k) => k.viecId !== null));
}

// ---------- 3) Học thêm sát giờ ăn và giờ ăn chỉnh được ----------
{
  const thu4 = "2026-10-08";
  const hocThem = (batDau: string, ketThuc: string): TietCoDinh => ({ id: "them", ten: "Học thêm", loai: "hocThem", thu: 4, batDau, ketThuc });
  const khung = (coDinh: TietCoDinh[], baoVe?: { batDau: string; ketThuc: string }[]) => khungTrongTrongNgay(thu4, coDinh, CAU_HINH_MAC_DINH, [], baoVe);
  const dau = (ds: ReturnType<typeof khung>) => ds.map((k) => k.batDau);

  // học thêm 17:30-19:30 đè giờ ăn tối: tự học bắt đầu ngay sau lớp (19:40), không bị chặn tới 19:00 rồi lại chặn tiếp
  const a = khung([hocThem("17:30", "19:30")]);
  assert.ok(a.some((k) => k.batDau === phutTuGio("19:40") && k.ketThuc === phutTuGio("21:30")), "sau lớp học thêm còn trọn khung 19:40-21:30");
  assert.ok(a.every((k) => k.ketThuc <= phutTuGio("17:20") || k.batDau >= phutTuGio("19:40")), "không đè lớp học thêm");
  // học thêm 17:00-18:30: không chặn vô cớ phần 18:40-19:00 vì khung ăn đã bị lớp đè lên
  const b = khung([hocThem("17:00", "18:30")]);
  assert.ok(dau(b).includes(phutTuGio("18:40")), "tự học được ngay sau lớp, không phải chờ hết khung ăn 19:00");
  // học thêm không đè giờ ăn thì giữ nguyên khung ăn
  const c = khung([hocThem("14:00", "15:30")]);
  assert.ok(c.every((k) => k.ketThuc <= phutTuGio("18:00") || k.batDau >= phutTuGio("19:00")), "giờ ăn tối vẫn được giữ");
  // tiết chính khóa chạm giờ ăn trưa thì KHÔNG bỏ khung ăn trưa
  const d = khung([{ id: "ck", ten: "Toán", loai: "chinhKhoa", thu: 4, batDau: "10:00", ketThuc: "12:00" }]);
  assert.ok(d.every((k) => k.ketThuc <= phutTuGio("11:45") || k.batDau >= phutTuGio("13:00")), "chỉ học thêm mới làm khung ăn nhường chỗ");

  // tham số tắt / chỉnh giờ ăn
  const macDinh = khung([]);
  assert.equal(macDinh.length, 3, "mặc định: sáng, chiều, tối");
  assert.deepEqual(khung([], []), [{ batDau: phutTuGio("06:30"), ketThuc: phutTuGio("21:30") }], "mảng rỗng = tắt giờ ăn");
  assert.equal(khung([], [{ batDau: "12:00", ketThuc: "12:30" }]).length, 2, "chỉnh còn một khung ăn ngắn");

  // xepLichTuan nhận khungBaoVe: tắt giờ ăn thì có thể xếp vào 18:00-19:00
  const mot: ViecCanHoc[] = [{ ...VIEC_MAU[0], id: "v-an", phut: 60 }];
  const cfgToi = { ...CAU_HINH_MAC_DINH, thoiDiemTot: "toi" as const, gioBatDau: "18:00", gioKetThuc: "19:30" };
  const macDinhXep = xepLichTuan({ tuanBatDau: TUAN, coDinh: [], viec: mot, cfg: cfgToi });
  assert.ok(macDinhXep.khoi.every((k) => phutTuGio(k.batDau) >= 19 * 60 || phutTuGio(k.ketThuc) <= 18 * 60), "mặc định không xếp vào giờ ăn tối");
  const tatAn = xepLichTuan({ tuanBatDau: TUAN, coDinh: [], viec: mot, cfg: cfgToi, khungBaoVe: [] });
  assert.equal(tatAn.chuaXep.length, 0);
  assert.ok(tatAn.khoi.some((k) => phutTuGio(k.batDau) >= 18 * 60 && phutTuGio(k.ketThuc) <= 19 * 60 + 30), "tắt giờ ăn thì xếp được vào 18:00-19:30");
}

// ---------- Trạng thái dùng chung cho các phần sau ----------
const viecMau = (id: string, mon: MonId, phut = 45): ViecCanHoc => ({ ...VIEC_MAU[0], id, mon, phut, tuan: TUAN, mucUuTien: "vua" });
const khoiAuto = (id: string, ngay: string, batDau: string, ketThuc: string, viecId: string | null, extra: Partial<KhoiHoc> = {}): KhoiHoc =>
  ({ id, viecId, ten: id, loai: "tuHoc", ngay, batDau, ketThuc, ...extra });
const goc = taoHoSoMau();
const nen: AppState = { ...goc, coDinh: LICH_CO_DINH_MAU, cauHinh: cfgNghiCN, viec: [], khoiHoc: [], trangThaiViec: {}, tamTrang: "binhThuong", tamTrangNgay: undefined } as AppState;

// ---------- 4) xepLaiTuan: giữ khối khóa, việc đã xong, khối trước tuNgay, khối em tự thêm ----------
{
  const [vKhoa, vXong, vTruoc, vCon] = [viecMau("v-khoa", "toan"), viecMau("v-xong", "vatLy"), viecMau("v-truoc", "hoaHoc"), viecMau("v-con", "tiengAnh")];
  const kKhoa = khoiAuto("auto-khoa", "2026-10-08", "16:00", "16:45", vKhoa.id, { khoa: true });
  const kXong = khoiAuto("auto-xong", "2026-10-08", "17:00", "17:45", vXong.id);
  const kTruoc = khoiAuto("auto-truoc", "2026-10-05", "16:00", "16:45", vTruoc.id);
  const kTay = khoiAuto("tay-1", "2026-10-09", "16:00", "17:00", null, { ten: "Việc em tự thêm" });
  const kCu = khoiAuto("auto-cu", "2026-10-09", "19:30", "20:15", vCon.id);
  const kTuanKhac = khoiAuto("auto-tuan-truoc", "2026-09-29", "16:00", "16:45", null);
  const s: AppState = {
    ...nen, viec: [vKhoa, vXong, vTruoc, vCon], trangThaiViec: { [vXong.id]: "xong" },
    khoiHoc: [kKhoa, kXong, kTruoc, kTay, kCu, kTuanKhac],
  };
  const tuNgay = "2026-10-07"; // thứ Tư
  const bayGio = ngayThu(1); // thứ Tư 07/10 08:00 theo NGAY_CO_DINH + 1 ngày: hôm nay là 07/10, nhưng ta dùng tuNgay khác ngày này bên dưới
  const r = xepLaiTuan(s, TUAN, tuNgay, undefined, bayGio);
  const theoId = new Map(r.s.khoiHoc.map((k) => [k.id, k]));
  assert.deepEqual(theoId.get("auto-khoa"), kKhoa, "khối khóa giữ nguyên");
  assert.deepEqual(theoId.get("auto-xong"), kXong, "khối của việc đã xong giữ nguyên");
  assert.deepEqual(theoId.get("auto-truoc"), kTruoc, "khối trước tuNgay giữ nguyên");
  assert.deepEqual(theoId.get("tay-1"), kTay, "khối em tự thêm giữ nguyên");
  assert.deepEqual(theoId.get("auto-tuan-truoc"), kTuanKhac, "khối ngoài tuần giữ nguyên");
  assert.ok(!theoId.has("auto-cu") || theoId.get("auto-cu")!.viecId !== vCon.id || theoId.get("auto-cu")!.batDau !== "19:30", "khối tự xếp chưa khóa được xếp lại");
  // việc đã khóa không bị xếp thêm lần nữa; việc đã xong không sinh khối mới
  assert.equal(r.s.khoiHoc.filter((k) => k.viecId === vKhoa.id).length, 1, "việc đã khóa chỉ còn đúng một khối");
  assert.equal(r.s.khoiHoc.filter((k) => k.viecId === vXong.id).length, 1, "việc đã xong không xếp lại");
  assert.equal(r.s.khoiHoc.filter((k) => k.viecId === vTruoc.id).length, 1, "việc đã qua trước tuNgay không xếp thêm vào ngày đã qua");
  // việc còn lại được xếp từ tuNgay trở đi, không trùng giờ với bất kỳ khối nào
  const moi = r.s.khoiHoc.filter((k) => k.viecId === vCon.id);
  assert.ok(moi.length >= 1 && moi.every((k) => k.ngay >= tuNgay), "việc còn lại xếp từ tuNgay");
  const theoNgay = new Map<string, KhoiHoc[]>();
  for (const k of r.s.khoiHoc) theoNgay.set(k.ngay, [...(theoNgay.get(k.ngay) ?? []), k]);
  for (const [ngay, ds] of theoNgay) assert.equal(phatHienTrung(ds).length, 0, `trùng giờ ngày ${ngay}`);
  assert.equal(new Set(r.s.khoiHoc.map((k) => k.id)).size, r.s.khoiHoc.length, "id không trùng");

  // xếp ngay trong ngày hôm nay: không xếp vào giờ đã qua
  const hom = xepLaiTuan(s, TUAN, "2026-10-06", undefined, new Date(2026, 9, 6, 15, 0));
  const tuHom = hom.s.khoiHoc.filter((k) => k.viecId === vCon.id && k.ngay === "2026-10-06");
  assert.ok(tuHom.every((k) => phutTuGio(k.batDau) >= 15 * 60), "hôm nay chỉ xếp từ giờ hiện tại");
}

// ---------- 5) Lớp 11 ----------
{
  const dv = (o: Partial<DauVaoViecTuan> = {}): DauVaoViecTuan => ({
    toHop: ["toan", "vatLy", "hoaHoc"], diem: { toan: 7, vatLy: 8.5, hoaHoc: 8, sinh: null, nguVan: null, tiengAnh: null },
    diemMucTieu: 25, canCaiThien: [], tuan: TUAN, chiSoTuan: 40, phutTuHoc: 15 * 60, ...o,
  });
  const l12 = taoViecTuan(dv());
  assert.ok(l12.every((v) => /12$/.test(v.taiLieu![0].ten)), "mặc định là lớp 12");
  const l11 = taoViecTuan(dv({ lop: 11 }));
  assert.ok(l11.length > 0 && l11.every((v) => v.taiLieu![0].ten.endsWith("(chương trình em đang học)") && !/ 12/.test(v.taiLieu![0].ten)), "lớp 11 không ghi SGK 12");
  assert.ok(l11.every((v) => !v.lyDo.includes("ngày đến kỳ thi")), "không có ngày thi thì bỏ câu đếm ngày");
  assert.ok(taoViecTuan(dv({ ngayConDenThi: 0 })).every((v) => !v.lyDo.includes("ngày đến kỳ thi")), "0 ngày cũng không in");
  assert.ok(taoViecTuan(dv({ ngayConDenThi: 120 })).some((v) => v.lyDo.includes("Còn 120 ngày đến kỳ thi")), "có ngày thi thì vẫn in");

  const s11: AppState = { ...goc, hoSo: { ...goc.hoSo, khoi: 11 } };
  assert.equal(dauVaoViecTuan(s11, TUAN)?.lop, 11, "đầu vào lấy lớp từ hồ sơ");
  assert.equal(dauVaoViecTuan({ ...goc, hoSo: { ...goc.hoSo, khoi: null } }, TUAN)?.lop, 12, "chưa rõ lớp thì mặc định 12");
}

// ---------- 6) Ôn nhẹ khi chưa có mục tiêu ----------
{
  const chuaMucTieu: AppState = { ...nen, mucTieu: null, hoSo: { ...goc.hoSo, khoi: 11, diem: { toan: 6, vatLy: null, hoaHoc: null, sinh: null, nguVan: 7, tiengAnh: null } } };
  assert.equal(dauVaoViecTuan(chuaMucTieu, TUAN), null, "đường chính vẫn cần mục tiêu");
  const dv = dauVaoViecTuanNhe(chuaMucTieu, TUAN);
  assert.equal(dv.nhe, true);
  const v = taoViecTuan(dv);
  assert.ok(v.length > 0, "vẫn sinh việc ôn nhẹ");
  assert.ok(v.reduce((t, x) => t + x.phut, 0) <= NGAN_SACH_ON_NHE + 45, "ôn nhẹ không quá khoảng 4 giờ");
  assert.ok(v.every((x) => x.mucUuTien === "thap"), "ôn nhẹ không có việc ưu tiên cao");
  assert.ok(v.every((x) => !/còn thiếu \d|cần khoảng \d/.test(x.lyDo)), "không nói về điểm thiếu cụ thể khi chưa có mục tiêu");
  assert.ok(v.some((x) => x.lyDo.includes("chưa chọn mục tiêu")) && v.every((x) => x.taiLieu![0].ten.includes("chương trình em đang học")));
  const kq = viecChoTuan(chuaMucTieu, TUAN, undefined, ngayThu(0), true);
  assert.ok(kq.ok && kq.viec.length > 0, "viecChoTuan có cờ nhẹ chạy được khi chưa có mục tiêu");
  assert.equal(viecChoTuan(chuaMucTieu, TUAN, undefined, ngayThu(0)).ok, false, "không có cờ thì vẫn đòi mục tiêu");
}

// ---------- 7) Tiêu đề đề tính giờ đúng với thời lượng ----------
{
  assert.equal(tenPhanDe(90), "làm 1 đề tính giờ");
  assert.equal(tenPhanDe(54), "làm nửa đề tính giờ");
  assert.equal(tenPhanDe(30), "làm một phần đề tính giờ");
  const v = taoViecTuan({
    toHop: ["toan", "vatLy", "hoaHoc"], diem: { toan: 7, vatLy: 8.5, hoaHoc: 8, sinh: null, nguVan: null, tiengAnh: null },
    diemMucTieu: 25, canCaiThien: [], tuan: TUAN, chiSoTuan: 40, phutTuHoc: 15 * 60,
  });
  const dauTien = v.filter((x) => x.tieuDe.includes("đề tính giờ"));
  assert.ok(dauTien.length >= 3);
  // mỗi buổi tối đa 90 phút, phần làm đề chỉ ~60%, nên không buổi nào được hứa "1 đề"
  assert.ok(dauTien.every((x) => !x.tieuDe.includes("làm 1 đề")), "không hứa 1 đề khi chỉ có ~54 phút làm đề");
  assert.ok(dauTien.every((x) => /nửa đề|một phần đề/.test(x.tieuDe)));
}

// ---------- 8) Dò khả thi dùng điều kiện thật ----------
{
  const gocTuan = uocLuongGioTuHoc(LICH_CO_DINH_MAU, cfgNghiCN, TUAN);
  const tuT6 = uocLuongGioTuHoc(LICH_CO_DINH_MAU, cfgNghiCN, TUAN, "2026-10-09");
  assert.ok(tuT6.tongPhut < gocTuan.tongPhut, "chỉ tính từ tuNgay thì ít giờ hơn");
  assert.ok(tuT6.theoNgay.filter((n) => n.ngay < "2026-10-09").every((n) => n.phut === 0), "ngày đã qua tính 0 phút");
  assert.equal(tuT6.theoNgay.length, 7, "vẫn đủ 7 ngày để màn hình dựng bảng");

  // khối em tự thêm làm bận gần hết tuần còn lại: khối lượng phải giảm theo, và kết quả xếp lại phải thực sự xếp hết
  const s: AppState = {
    ...nen,
    khoiHoc: ["2026-10-07", "2026-10-08", "2026-10-09"].map((ngay, i) => khoiAuto(`tay-${i}`, ngay, "14:00", "17:30", null, { ten: "Em tự thêm" })),
  };
  const nhieuTrong = viecChoTuan({ ...nen }, TUAN, "2026-10-07", ngayThu(1));
  const bat = viecChoTuan(s, TUAN, "2026-10-07", ngayThu(1));
  assert.ok(nhieuTrong.ok && bat.ok);
  if (nhieuTrong.ok && bat.ok) {
    const tong = (x: ViecCanHoc[]) => x.reduce((t, v) => t + v.phut, 0);
    assert.ok(tong(bat.viec) < tong(nhieuTrong.viec), "có khối tự thêm thì việc phải ít hơn");
    const lai = xepLaiTuan({ ...s, viec: bat.viec }, TUAN, "2026-10-07", bat.viec, ngayThu(1));
    assert.equal(lai.chuaXep, 0, "việc sinh ra thực sự xếp hết khi xếp lại");
    const lai2 = xepLaiTuan({ ...nen, viec: nhieuTrong.viec }, TUAN, "2026-10-07", nhieuTrong.viec, ngayThu(1));
    assert.equal(lai2.chuaXep, 0, "lịch trống cũng xếp hết");
  }
}

// ---------- 9) Tick nhiều buổi: gom các khối của một việc trong ngày ----------
{
  const v1 = viecMau("v-nhieu", "toan", 120), v2 = viecMau("v-khac", "hoaHoc", 45), v3 = viecMau("v-bo", "sinh", 45);
  const ngay = "2026-10-07";
  const s: AppState = {
    ...nen, viec: [v1, v2, v3], trangThaiViec: { [v2.id]: "xong", [v3.id]: "boQua" },
    khoiHoc: [
      khoiAuto("auto-a", ngay, "19:30", "20:15", v1.id),
      khoiAuto("auto-b", ngay, "16:00", "16:45", v1.id),
      khoiAuto("auto-c", ngay, "17:00", "17:45", v2.id),
      khoiAuto("auto-d", ngay, "18:00", "18:45", v3.id),
      khoiAuto("auto-xt", ngay, "19:00", "19:15", null, { ten: "Xem trước bài" }),
      khoiAuto("auto-e", "2026-10-08", "16:00", "16:45", v1.id),
    ],
  };
  const ds = viecTrongNgay(s, ngay);
  assert.equal(ds.length, 2, "hai việc (một việc bị chia hai buổi gộp lại), không tính xem trước bài và việc bỏ qua");
  const g = ds.find((x) => x.viec.id === v1.id)!;
  assert.equal(g.phut, 90, "cộng phút các buổi");
  assert.equal(g.batDau, "16:00", "giờ bắt đầu sớm nhất");
  assert.equal(g.ketThuc, "20:15", "giờ kết thúc muộn nhất");
  assert.equal(g.xong, false);
  assert.equal(ds.find((x) => x.viec.id === v2.id)!.xong, true, "việc đã xong được đánh dấu");
  assert.equal(ds[0].viec.id, v1.id, "sắp theo giờ bắt đầu");
}

console.log("xep-lai: tất cả kiểm tra đều qua");
