// Chạy: npx tsx tests/thu-tinh-huong.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU, tim } from "../src/data/tham-khao/lua-chon-mau-cu";
import { NGUONG_PHU_HOP } from "../src/engine/phan-tich";
import { TO_HOP, type MonId } from "../src/state/types";
import {
  DANG_THU_MAC_DINH, apDungCong, bangSoSanh, chupTruocSau, dieuKienTuHoSo, docODiem, moTaCongDiem, tenTinhHuong,
  tinhTinhHuong, tomTatTruocSau, tongCacToHop, trungTinhHuong, taoTinhHuongLuu, vietCong,
} from "../src/features/thu-tinh-huong/tinh-toan";

const diem: Record<MonId, number | null> = { toan: 8.0, vatLy: 8.5, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.0 };
const hoSo = { nganSach: "30-60" as const, khuVuc: ["TP.HCM"], quanTamViecLam: "rat" as const, hocXaNha: true };
const dk = dieuKienTuHoSo(hoSo);
assert.deepEqual([dk.nganSachTrieu, dk.khuVuc, dk.uuTien, dk.coNganSach], [60, "TP.HCM", "viecLam", true]);
assert.equal(dieuKienTuHoSo({ nganSach: null, khuVuc: [], quanTamViecLam: null, hocXaNha: null }).nganSachTrieu, 150);

// Cộng điểm giữ trong 0–10, môn chưa có điểm vẫn null
assert.equal(apDungCong(diem, { vatLy: 2 }).vatLy, 10);
assert.equal(apDungCong({ ...diem, sinh: null }, { sinh: 1 }).sinh, null);

// Không đổi gì: không có thay đổi, mọi dòng "không đổi"
const goc = tinhTinhHuong(LUA_CHON_MAU, diem, TO_HOP.A01, dk, DANG_THU_MAC_DINH);
assert.equal(goc.coThayDoi, false);
assert.equal(goc.tongTruoc, 24.5);
assert.equal(goc.dem.khongDoi, LUA_CHON_MAU.length);

// Toán +1: tổng 25.5, UIT (mức tham khảo 26) mới phù hợp
const t1 = { ...DANG_THU_MAC_DINH, congMon: { toan: 1 } };
const kq = tinhTinhHuong(LUA_CHON_MAU, diem, TO_HOP.A01, dk, t1);
assert.equal(kq.tongSau, 25.5);
assert.ok(kq.coThayDoi);
const uit = kq.dong.find((d) => d.lc.id === "uit-cntt")!;
assert.ok(uit.goc < NGUONG_PHU_HOP && uit.moi >= NGUONG_PHU_HOP);
assert.equal(uit.trangThai, "moiPhuHop");
assert.equal(kq.dong[0].trangThai, "moiPhuHop", "mới phù hợp xếp đầu");
assert.equal(kq.dem.moiMo + kq.dem.tang + kq.dem.khongDoi + kq.dem.giam, LUA_CHON_MAU.length);
assert.ok(kq.phuHop[1] >= kq.phuHop[0]);
assert.equal(moTaCongDiem(t1.congMon), "Toán tăng 1 điểm");
assert.equal(tenTinhHuong(t1, dk), "Toán +1");
assert.equal(vietCong(-0.25), "−0.25");

// Ngân sách thấp làm giảm điểm phù hợp, có lý do học phí
const t2 = { ...DANG_THU_MAC_DINH, nganSachTrieu: 20 };
const kq2 = tinhTinhHuong(LUA_CHON_MAU, diem, TO_HOP.A01, dk, t2);
assert.ok(kq2.dem.giam > 0);
assert.ok(kq2.dong.some((d) => d.trangThai === "giamDi" && d.lyDo.includes("ngân sách")));
assert.equal(tenTinhHuong(t2, dk), "Ngân sách 20 tr");

// Lưu tình huống: phát hiện trùng
const a = taoTinhHuongLuu(t1, dk, kq.tongSau);
assert.ok(trungTinhHuong(a, taoTinhHuongLuu({ ...t1, congMon: { toan: 1, vatLy: 0 } }, dk, 25.5)));
assert.ok(!trungTinhHuong(a, taoTinhHuongLuu(t2, dk, 24.5)));

// Bảng so sánh: cột Hiện tại + tình huống, 3 dòng
const bang = bangSoSanh(LUA_CHON_MAU, diem, TO_HOP.A01, dk, [{ ...a, id: "x", luc: "" }]);
assert.equal(bang.cot.length, 2);
assert.equal(bang.dong.length, 3);
assert.equal(bang.cot[1].tong, 25.5);

// Đọc ô điểm
assert.deepEqual(docODiem("7,5"), { gia: 7.5 });
assert.deepEqual(docODiem(""), { gia: null });
assert.ok(docODiem("11").loi);
assert.ok(docODiem("abc").loi);
assert.ok(docODiem("-1").loi);

// Tổ hợp: thiếu môn thì báo thiếu
const th = tongCacToHop({ ...diem, hoaHoc: null });
assert.equal(th.A01.tong, 24.5);
assert.equal(th.A00.tong, null);
assert.deepEqual(th.A00.thieu, ["hoaHoc"]);

// Ảnh chụp trước/sau và 3 dòng tóm tắt
const nv = ["uit-cntt", "hcmus-khdl", "hcmute-ktpm", "ute-kdqt", "fpt-poly-thietke"].map((id) => tim(id)!);
const anh = chupTruocSau({ lcs: nv, nguon: "nguyenVong", diemTruoc: diem, diemSau: { ...diem, toan: 9.0 }, maToHop: "A01", toHop: TO_HOP.A01, dk, luc: "2026-10-05T00:00:00Z" });
assert.equal(anh.tongSau, 25.5);
assert.deepEqual(anh.monDoi, [{ mon: "toan", truoc: 8, sau: 9 }]);
assert.ok(anh.coTruoc);
const tt = tomTatTruocSau(anh, tim);
assert.equal(tt.length, 3);
assert.equal(tt[0].loai, "len");
// Lần đầu đủ điểm: không so "trước"
const anh2 = chupTruocSau({ lcs: nv, nguon: "nguyenVong", diemTruoc: { ...diem, vatLy: null }, diemSau: diem, maToHop: "A01", toHop: TO_HOP.A01, dk, luc: "x" });
assert.equal(anh2.coTruoc, false);
assert.ok(tomTatTruocSau(anh2, tim)[0].tieuDe.startsWith("Lần đầu"));

console.log("thu-tinh-huong: tất cả kiểm tra đều qua");
