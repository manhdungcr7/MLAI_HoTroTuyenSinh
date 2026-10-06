// Kiểm thử dữ liệu thật và logic Khám phá / Nguyện vọng (hàm thuần). Chạy: npx tsx tests/du-lieu.test.ts
import assert from "node:assert/strict";
import { LUA_CHON, idHoSoMau, tenGon, timLuaChon } from "../src/data/lua-chon-that";
import { coHocPhi } from "../src/data/lua-chon-phu";
import { NGUONG_PHU_HOP } from "../src/engine/phan-tich";
import { tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { boiCanhTu, coDiemDeSo, danhGia, sapXep } from "../src/features/kham-pha/phu-hop";
import { dungDanhSach, demNhan } from "../src/features/nguyen-vong/tinh-toan";
import { taoHoSoMau } from "../src/state/mau";
import type { MonId } from "../src/state/types";
import deAnTruong from "../src/data/de-an-truong.json";
import nguonNam from "../src/data/nguon-nam.json";
import chuongTrinh from "../src/data/chuong-trinh.json";

const diem = (o: Partial<Record<MonId, number>>): Record<MonId, number | null> =>
  ({ toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, ...o });

// 1) Toàn vẹn dữ liệu
assert.ok(LUA_CHON.length > 2000, "phải có hơn 2000 chương trình");
assert.equal(new Set(LUA_CHON.map((l) => l.id)).size, LUA_CHON.length, "id không được trùng");
for (const l of LUA_CHON) {
  assert.ok(l.diemMin > 0 && l.diemMax <= 30 && l.diemMin <= l.diemMax, `điểm ngoài thang 30: ${l.id}`);
  assert.ok(l.nganh.trim().length > 1 && l.truong && l.khuVuc !== undefined, `thiếu tên: ${l.id}`);
  assert.ok(Object.keys(l.diemTheoNam ?? {}).length >= 1, `không có điểm theo năm: ${l.id}`);
  assert.ok(!/undefined|NaN/.test(l.nganh + l.moTa + l.tenTruong), `chữ lỗi: ${l.id}`);
  assert.ok(l.nguonCap === "official_pdf" || l.nguonCap === "aggregator_verified");
  assert.equal(l.daKiemChung, l.nguonCap === "official_pdf");
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
assert.equal(khong.tong, null, "C00 cần Sử, Địa: chưa tính được");
assert.deepEqual(khong.khongTinhDuoc, ["C00"]);
const suy = tongChoLuaChon({ toHopXet: [] }, d);
assert.ok(suy.suyRa && suy.tong === 24 && suy.toHop === "A01", "đề án chưa ghi tổ hợp thì suy ra và báo suyRa");
assert.equal(tongChoLuaChon({ toHopXet: ["A00"] }, diem({ toan: 8 })).tong, null, "thiếu môn thì không so");

// 5) Hồ sơ mẫu: danh sách nguyện vọng có đủ các nhóm nhãn và mọi id tồn tại
const mau = taoHoSoMau();
assert.ok(mau.nguyenVong.length >= 4 && mau.nguyenVong.every((id) => timLuaChon(id)));
const dsMau = dungDanhSach(mau.nguyenVong, diem({ toan: 7.8, vatLy: 6.9, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.1 }), timLuaChon);
const dem = demNhan(dsMau);
assert.ok(dem["Thử sức"] >= 1 && dem["An toàn"] + dem["Dự phòng"] >= 1, "hồ sơ mẫu phải có cả thử sức và chỗ chắc chân");
assert.deepEqual(idHoSoMau(diem({ toan: 7.8, vatLy: 6.9, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.1 })), mau.nguyenVong);

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
if (chiC00) { const k = danhGia(chiC00, bcGioi); assert.equal(k.muc, null); assert.match(k.giaiThich, /chưa có điểm/); }

console.log("du-lieu: tất cả kiểm tra đều qua");
