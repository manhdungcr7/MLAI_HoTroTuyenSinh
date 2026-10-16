import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử dữ liệu thật và logic Khám phá / Nguyện vọng (hàm thuần). Chạy: npx tsx tests/du-lieu.test.ts
import assert from "node:assert/strict";
import { LUA_CHON, idHoSoMau, tenGon, timLuaChon } from "../src/data/lua-chon-that";
import { readFileSync } from "node:fs";
import { coHocPhi, hocPhiChu } from "../src/data/lua-chon-phu";
import { NGUONG_PHU_HOP, nhanNguyenVong } from "../src/engine/phan-tich";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { boiCanhTu, coDiemDeSo, danhGia, sapXep } from "../src/features/kham-pha/phu-hop";
import { dungDanhSach, demNhan } from "../src/features/nguyen-vong/tinh-toan";
import { taoHoSoMau } from "../src/state/mau";
import { diemHienTaiCuaTungMon } from "../src/state/diem-hien-tai";
import type { DiemDayDu, MonKhoi } from "../src/state/types";
import { goiYDanhSach } from "../src/features/nguyen-vong/goi-y-danh-sach";
import { tinhCoHoi } from "../src/features/kham-pha/co-hoi";
import deAnTruong from "../src/data/de-an-truong.json";
import nguonNam from "../src/data/nguon-nam.json";
import chuongTrinh from "../src/data/chuong-trinh.json";
import nguonNamTC from "../src/data/nguon-nam-thu-cap.json";
import deAnTruongTC from "../src/data/de-an-truong-thu-cap.json";
import hocPhi from "../src/data/hoc-phi.json";
import trangTruong from "../src/data/trang-nganh-truong.json";
import viecLam from "../src/data/viec-lam.json";

const diem = (o: Partial<Record<MonKhoi, number>>): DiemDayDu =>
  ({ toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null, ...o });

// 1) Toàn vẹn dữ liệu
assert.ok(LUA_CHON.length > 2000, "phải có hơn 2000 chương trình");
assert.equal(new Set(LUA_CHON.map((l) => l.id)).size, LUA_CHON.length, "id không được trùng");
for (const l of LUA_CHON) {
  assert.ok(l.diemMin > 0 && l.diemMax <= 30 && l.diemMin <= l.diemMax, `điểm ngoài thang 30: ${l.id}`);
  assert.ok(l.nganh.trim().length > 1 && l.truong && l.khuVuc !== undefined, `thiếu tên: ${l.id}`);
  assert.ok(Object.keys(l.diemTheoNam ?? {}).length >= 1, `không có điểm theo năm: ${l.id}`);
  assert.ok(!/undefined|NaN/.test(l.nganh + l.moTa + l.tenTruong), `chữ lỗi: ${l.id}`);
  assert.ok(l.nguonCap === "official_pdf" || l.nguonCap === "aggregator_verified");
  assert.equal(l.daKiemChung, false, "nhãn nguồn không chứng minh xác minh độc lập");
}
// không bịa học phí: chỉ ngành có số mới có học phí, và học phí hợp lý (triệu đồng/năm)
for (const l of LUA_CHON.filter(coHocPhi)) assert.ok((l.hocPhiMin as number) > 0 && (l.hocPhiMax as number) < 500, `học phí lạ: ${l.id}`);

// 2) Liên kết nguồn: mọi link là https, trang PDF hợp lệ, thuộc chương trình có thật
const ids = new Set(LUA_CHON.map((l) => l.id));
for (const [id, ds] of Object.entries(nguonNam as Record<string, { nam: string; url: string; trang?: number }[]>)) {
  assert.ok(ids.has(id), `nguon-nam trỏ tới id không có: ${id}`);
  for (const x of ds) { assert.ok(x.url.startsWith("https://") || x.url.startsWith("http://")); assert.ok(x.trang === undefined || (Number.isInteger(x.trang) && x.trang >= 1 && x.trang < 1000)); }
}
for (const [ma, v] of Object.entries(deAnTruong as Record<string, { docs: { url: string }[]; hocPhi?: { trang: number } }>)) {
  assert.ok(LUA_CHON.some((l) => l.maTruong === ma), `de-an-truong có mã trường lạ: ${ma}`);
  assert.ok(v.docs.length > 0);
}
for (const [id, v] of Object.entries(chuongTrinh as Record<string, { url: string; tieuDe: string }>)) {
  assert.ok(ids.has(id), `chuong-trinh trỏ tới id không có: ${id}`);
  assert.ok(/^https?:\/\//.test(v.url) && v.tieuDe.length > 2);
}

for (const id of Object.keys(nguonNamTC)) assert.ok(ids.has(id), `nguon-nam-thu-cap trỏ tới id không có: ${id}`);
for (const ma of Object.keys(deAnTruongTC)) assert.ok(LUA_CHON.some((l) => l.maTruong === ma));
// học phí và việc làm trích từ đề án: số hợp lý, có trang nguồn, và gắn đúng vào dữ liệu
// Dòng có nguồn phải có link + trang; dòng ước tính (uocTinh) KHÔNG được có link (không gắn nguồn giả) và hiện "≈".
const LINK_HONG = new Set(readFileSync(new URL("../scripts/link-hong.txt", import.meta.url), "utf-8").split(/\r?\n/).filter((d) => d && !d.startsWith("#")));
for (const l of LUA_CHON) assert.ok(!/^\(\d+\)/.test(l.nganh), `tên ngành còn số thứ tự: ${l.id} ${l.nganh}`);
let soCoNguon = 0;
for (const [id, v] of Object.entries(hocPhi as Record<string, { trieuNam: number; trang?: number; url?: string; uocTinh?: boolean }>)) {
  assert.ok(ids.has(id) && v.trieuNam >= 5 && v.trieuNam <= 400, id);
  const l = timLuaChon(id)!; assert.equal(l.hocPhiMin, v.trieuNam);
  if (v.uocTinh) {
    assert.ok(!v.url && !l.nguonHocPhi && l.hocPhiUocTinh, `học phí ước tính không được có link: ${id}`);
    assert.ok(hocPhiChu(l).startsWith("≈"), `học phí ước tính phải hiện ≈: ${id}`);
  } else {
    soCoNguon++;
    assert.ok(v.url && (v.trang ?? 0) >= 1 && l.nguonHocPhi && !l.hocPhiUocTinh, `học phí có nguồn thiếu link/trang: ${id}`);
    assert.ok(!LINK_HONG.has(v.url!.split("#")[0]), `học phí trỏ link hỏng: ${id}`);
  }
}
assert.ok(soCoNguon >= 600, `số học phí có nguồn giảm bất thường: ${soCoNguon}`);
for (const [id, v] of Object.entries(viecLam as Record<string, { phanTram: number; url: string }>)) {
  assert.ok(ids.has(id) && v.phanTram >= 50 && v.phanTram <= 100);
  assert.ok(!LINK_HONG.has(v.url.split("#")[0]), `việc làm trỏ link hỏng: ${id}`);
}
// Chặn quay lại dữ liệu việc làm sinh hàng loạt (14/10 từng có 3.531 dòng sinh từ mã băm).
assert.ok(Object.keys(viecLam).length < 500, "viec-lam.json có quá nhiều dòng: kiểm tra lại nguồn, không sinh số");
for (const [ma, v] of Object.entries(deAnTruong as Record<string, { docs: { url: string }[] }>)) for (const d of v.docs) assert.ok(!LINK_HONG.has(d.url), `de-an-truong ${ma} trỏ link hỏng`);
// tỷ lệ việc làm là phần trăm: mức "Rất cao" chỉ khi từ 95% trở lên (từng bị đọc nhầm như tỉ lệ 0–1)
for (const l of LUA_CHON) if (l.tiLeViecLam !== undefined) assert.equal(l.coHoiViecLam, l.tiLeViecLam >= 95 ? "Rất cao" : l.tiLeViecLam >= 85 ? "Cao" : "Khá", l.id);
assert.ok(LUA_CHON.filter((l) => l.coHoiViecLam === "Rất cao").length < LUA_CHON.filter((l) => l.tiLeViecLam !== undefined).length, "không được để mọi ngành đều Rất cao");

for (const [ma, v] of Object.entries(trangTruong as Record<string, { url: string; tieuDe: string }>)) {
  assert.ok(LUA_CHON.some((l) => l.maTruong === ma), `trang-nganh-truong có mã trường lạ: ${ma}`);
  assert.ok(/^https?:\/\//.test(v.url) && v.tieuDe.length > 3);
}

// 3) Tên ngành gọn
assert.equal(tenGon("Chương trình đào tạo ngành Tài chính - Ngân hàng - Tài chính - Ngân hàng").ten, "Tài chính - Ngân hàng");
assert.equal(tenGon("Khoa học máy tính (Chương trình Tiên tiến) - Khoa học máy tính").ten, "Khoa học máy tính (Chương trình Tiên tiến)");
assert.deepEqual(tenGon("CT chuẩn - Quốc tế học"), { ten: "Quốc tế học", them: "CT chuẩn" });
assert.equal(tenGon("Y khoa").ten, "Y khoa");

// 4) Tổng điểm theo tổ hợp của ngành
const d = diem({ toan: 8, vatLy: 7, hoaHoc: 6, tiengAnh: 9, nguVan: 5, sinh: 4 });
assert.equal(tongChoLuaChon({ toHopXet: ["A00"] }, d).tong, 21);
assert.equal(tongChoLuaChon({ toHopXet: ["A00", "A01"] }, d).toHop, "A01", "nhiều tổ hợp thì lấy tổ hợp cao nhất của em");
const khong = tongChoLuaChon({ toHopXet: ["C00"] }, d);
assert.equal(khong.tong, null, "C00 cần Sử, Địa: em chưa nhập thì chưa tính được");
assert.deepEqual(khong.thieuMon, ["lichSu", "diaLy"]);
// nhập thêm Sử, Địa thì tính được C00, D14, X70...
const dXH = diem({ toan: 6, nguVan: 8, tiengAnh: 7, lichSu: 9, diaLy: 8.5, gdktpl: 9, tinHoc: 7 });
assert.equal(tongChoLuaChon({ toHopXet: ["C00"] }, dXH).tong, 25.5);
assert.equal(tongChoLuaChon({ toHopXet: ["D14"] }, dXH).tong, 24);
assert.equal(tongChoLuaChon({ toHopXet: ["X70"] }, dXH).tong, 26, "X70 = Văn, Sử, GDKT&PL");
assert.equal(tongChoLuaChon({ toHopXet: ["X26"] }, dXH).tong, 20, "X26 = Toán, Tin, Anh");
assert.equal(tongChoLuaChon({ toHopXet: ["C00", "D01"] }, dXH).toHop, "C00", "chọn tổ hợp cao nhất trong các tổ hợp ngành cho xét");
// tổ hợp năng khiếu / vẽ: không tính từ điểm hồ sơ
assert.deepEqual(tongChoLuaChon({ toHopXet: ["V00"] }, dXH).khongTinhDuoc, ["V00"]);
const suy = tongChoLuaChon({ toHopXet: [] }, d);
assert.ok(suy.suyRa && suy.tong === 24 && suy.toHop === "A01", "đề án chưa ghi tổ hợp thì suy ra và báo suyRa");
assert.equal(tongChoLuaChon({ toHopXet: ["A00"] }, diem({ toan: 8 })).tong, null, "thiếu môn thì không so");

// 5) Hồ sơ mẫu: danh sách nguyện vọng có đủ các nhóm nhãn và mọi id tồn tại
const mau = taoHoSoMau();
assert.ok(mau.nguyenVong.length >= 4 && mau.nguyenVong.every((id) => timLuaChon(id)));
// Nhãn tính theo điểm app thực sự dùng (lần thi thử mới nhất), giống màn Nguyện vọng.
const diemMau = diemHienTaiCuaTungMon(mau) as Partial<Record<MonKhoi, number>>; // hồ sơ mẫu đủ 6 môn
const dsMau = dungDanhSach(mau.nguyenVong, diem(diemMau), timLuaChon);
const dem = demNhan(dsMau);
assert.ok(dem["Thử sức"] >= 1 && dem["An toàn"] + dem["Dự phòng"] >= 1, "hồ sơ mẫu phải có cả thử sức và chỗ chắc chân");
assert.deepEqual(idHoSoMau(diem(diemMau), 60), mau.nguyenVong);

// 6) Xếp hạng "Phù hợp nhất": học sinh giỏi thấy ngành sát điểm mình trước, không phải ngành dễ nhất
const bcGioi = { ...boiCanhTu(mau), diem: diem({ toan: 9.5, vatLy: 9, hoaHoc: 9, sinh: 8, nguVan: 8, tiengAnh: 9 }), nganhQuanTam: ["CNTT"], khuVucUuTien: [], tinh: "" };
assert.ok(coDiemDeSo(bcGioi));
const cntt = LUA_CHON.filter((l) => l.nhomNganh === "CNTT" && l.phuongThuc === "THPT");
const xep = sapXep(cntt, "phuHop", bcGioi);
const top = xep.slice(0, 10).map((l) => l.diemMin);
const trungBinhTop = top.reduce((a, b) => a + b, 0) / top.length;
const trungBinhTatCa = cntt.reduce((a, l) => a + l.diemMin, 0) / cntt.length;
assert.ok(trungBinhTop > trungBinhTatCa + 2, `10 ngành đầu phải có điểm cao hơn trung bình (${trungBinhTop.toFixed(1)} vs ${trungBinhTatCa.toFixed(1)})`);
// chưa có điểm thì không so, không báo "Phù hợp"
const bcTrong = { ...bcGioi, diem: diem({}) };
assert.equal(coDiemDeSo(bcTrong), false);
assert.equal(danhGia(cntt[0], bcTrong).muc, null);

// 7) "Cần cân nhắc" thì điểm gợi ý dưới ngưỡng, hai thông tin không mâu thuẫn
const khacNganh = LUA_CHON.find((l) => l.nhomNganh === "Y Dược" && l.diemMin < 24)!;
const kq = danhGia(khacNganh, bcGioi);
if (kq.muc === "Cần cân nhắc") assert.ok((kq.diemGoiY ?? 0) < NGUONG_PHU_HOP);

// 8) Ngành chỉ xét tổ hợp chưa có môn (Sử, Địa) không bị so nhầm
const chiC00 = LUA_CHON.find((l) => l.toHopXet?.length && l.toHopXet.every((c) => ["C00", "C03", "C04", "D14", "D15"].includes(c)));
if (chiC00) {
  const k = danhGia(chiC00, bcGioi); assert.equal(k.muc, null); assert.match(k.giaiThich, /Bạn thêm điểm/);
  const kx = danhGia(chiC00, { ...bcGioi, diem: diem({ nguVan: 8, lichSu: 9, diaLy: 8.5, toan: 6, tiengAnh: 7 }) });
  assert.notEqual(kx.muc, null, "nhập đủ Sử, Địa thì phải so được");
}
// số ngành so được tăng khi có điểm Sử, Địa, Tin
const soSoDuoc = (dd: DiemDayDu) => LUA_CHON.filter((l) => tongChoLuaChon(l, dd).tong !== null).length;
assert.ok(soSoDuoc(dXH) > soSoDuoc(diem({ toan: 6, nguVan: 8, tiengAnh: 7 })), "thêm môn phải mở thêm ngành so được");

// 9) Cơ hội của em và gợi ý danh sách nguyện vọng
const dGioi = diem({ toan: 9, vatLy: 8.5, hoaHoc: 8, sinh: 7, nguVan: 7.5, tiengAnh: 8.5 });
const ch = tinhCoHoi(dGioi)!;
assert.ok(ch.tong >= 25 && ch.soDuDiem > ch.soThuSuc && ch.soDuDiem + ch.soThuSuc <= ch.soNganh && ch.theoNhom.length > 0);
assert.equal(tinhCoHoi(diem({})), null, "chưa có điểm thì không tính cơ hội");
const hsGoiY = { nganSach: "30-60" as const, khuVuc: ["TP.HCM"], nganhQuanTam: ["CNTT"], tinh: "TP. Hồ Chí Minh" };
const gy = goiYDanhSach(dGioi, hsGoiY);
const nhanGY = new Set(gy.map((x) => x.nhan));
assert.ok(gy.length >= 6 && nhanGY.has("Thử sức") && nhanGY.has("Vừa sức") && (nhanGY.has("An toàn") || nhanGY.has("Dự phòng")), "danh sách gợi ý phải cân bằng");
assert.equal(new Set(gy.map((x) => x.lc.id)).size, gy.length, "không trùng ngành");
assert.ok(gy.every((x) => !coHocPhi(x.lc) || (x.lc.hocPhiMin as number) <= 60), "không vượt ngân sách");
assert.ok(gy.every((x) => x.lyDo.length >= 1), "mỗi gợi ý có lý do");
assert.ok(gy.filter((x) => x.lc.nhomNganh === "CNTT").length >= gy.length - 2, "ưu tiên đúng nhóm ngành em chọn");
assert.ok(goiYDanhSach(dGioi, hsGoiY, gy.map((x) => x.lc.id)).every((x) => !gy.some((g) => g.lc.id === x.lc.id)), "không gợi ý lại ngành đã có");
assert.deepEqual(goiYDanhSach(diem({}), hsGoiY), [], "chưa có điểm thì không gợi ý");

// 9) Điểm dùng để dán nhãn, đặt mục tiêu và hiển thị là điểm của đúng năm `namDiem` (năm mới nhất), không phải mức thấp nhất của hai năm
for (const l of LUA_CHON) {
  const nam = Object.keys(l.diemTheoNam ?? {}).sort();
  assert.equal(l.namDiem, Number(nam[nam.length - 1]), `namDiem phải là năm mới nhất: ${l.id}`);
  assert.equal(l.diemMin, l.diemTheoNam![String(l.namDiem)], `điểm dán nhãn phải khớp điểm năm ${l.namDiem}: ${l.id}`);
  assert.equal(l.diemMax, l.diemMin, `diemMax cùng năm với diemMin: ${l.id}`);
  if (l.diemDuKien != null) assert.equal(l.diemDuKien, l.diemMin, `điểm dự kiến bằng điểm năm gần nhất: ${l.id}`);
}
assert.equal(nhanNguyenVong(LUA_CHON[0], LUA_CHON[0].diemMin), "Vừa sức");

// 10) Điểm của phương thức khác THPT không được dán nhãn Thử sức/Vừa sức/An toàn/Dự phòng
const khacPT = LUA_CHON.filter((l) => l.phuongThuc && l.phuongThuc !== "THPT");
assert.ok(khacPT.length > 100, "dữ liệu có nhiều chương trình phương thức khác");
const dDu = diem({ toan: 9, vatLy: 9, hoaHoc: 9, sinh: 9, nguVan: 9, tiengAnh: 9, lichSu: 9, diaLy: 9, gdktpl: 9, tinHoc: 9, congNghe: 9 });
for (const l of khacPT.slice(0, 200)) {
  const k = danhGia(l, { ...bcGioi, diem: dDu });
  assert.equal(k.muc, null, `khác phương thức không có mức phù hợp: ${l.id}`);
  assert.equal(k.chacChan, null);
  assert.ok(k.lyDoKhongSo && k.giaiThich.includes("phương thức"), `phải nói lý do: ${l.id}`);
  assert.equal(k.tot.some((t) => /mức tham khảo/.test(t)) || k.luuY.some((t) => /mức tham khảo/.test(t)), false, "không so điểm với điểm chuẩn khác thang");
}
const dsKhac = dungDanhSach(khacPT.slice(0, 5).map((l) => l.id), dDu, timLuaChon);
assert.ok(dsKhac.every((x) => x.nhan === null && /phương thức/.test(x.lyDoKhongNhan ?? "")), "dungDanhSach: khác phương thức thì không có nhãn, kèm lý do");
const thptNhan = LUA_CHON.find((l) => l.phuongThuc === "THPT" && l.toHopXet?.length === 1 && l.toHopXet[0] === "A01")!;
assert.ok(danhGia(thptNhan, { ...bcGioi, diem: dDu }).muc !== null, "THPT vẫn so bình thường");

// ---- Chất lượng danh mục (nhóm ngành, tên ngành, tỉnh): lỗi ở đây hiện thẳng ra trước mắt học sinh ----
import { PHAN_NHOM_NGANH, THANH_PHO, TINH } from "../src/features/khoi-dau/lua-chon";
const nhomTrongMan = new Set(PHAN_NHOM_NGANH.flatMap((g) => g.danhSach.map((x) => x.gia)));
const nhomTrongDuLieu = new Set(LUA_CHON.map((l) => l.nhomNganh));
for (const g of nhomTrongDuLieu) assert.ok(nhomTrongMan.has(g), `nhóm ngành "${g}" có trong dữ liệu mà màn Tạo hồ sơ không cho chọn`);
for (const g of nhomTrongMan) assert.ok(nhomTrongDuLieu.has(g), `màn Tạo hồ sơ cho chọn nhóm "${g}" nhưng dữ liệu không có chương trình nào`);
for (const g of nhomTrongDuLieu) assert.ok(LUA_CHON.filter((l) => l.nhomNganh === g).length >= 5, `nhóm "${g}" quá ít chương trình để lọc`);
const RAC = /^(kết hợp|kết quả|nữ\s*:|nam\s*:|tổng chỉ tiêu|sử dụng k|đhqg|\d{6,})/i;
for (const l of LUA_CHON) {
  assert.ok(l.nganh.trim().length >= 4 && !RAC.test(l.nganh.trim()), `tên ngành không phải ngành: "${l.nganh}" (${l.id})`);
  assert.ok(!/[̀-ͯṭṇ�]/.test(l.nganh.normalize("NFC")), `tên ngành lỗi ký tự: "${l.nganh}" (${l.id})`);
}
const tinhHopLe = new Set([...THANH_PHO, ...TINH, "TP.HCM"]);
for (const l of LUA_CHON) assert.ok(tinhHopLe.has(l.khuVuc), `tỉnh "${l.khuVuc}" của ${l.id} không thuộc 34 tỉnh thành hiện hành (dữ liệu còn tên tỉnh cũ?)`);

console.log("du-lieu: tất cả kiểm tra đều qua");
