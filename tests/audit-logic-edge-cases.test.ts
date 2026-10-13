import assert from "node:assert/strict";
import {
  diemPhuHop,
  khoangCachTheoMon,
  monThieuCuaToHop,
  phanTichDanhSach,
  soSanhTinhHuong,
  tongDiem,
} from "../src/engine/phan-tich";
import {
  CAU_HINH_MAC_DINH,
  KHUNG_BAO_VE_GIO,
  khungTrongTrongNgay,
  thuHaiCuaTuan,
  xepLichTuan,
} from "../src/engine/xep-lich";
import { nganSachPhut, taoViecTuan } from "../src/engine/tao-viec";
import { diemDayDu, tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { doDocXuHuong, congSucMon } from "../src/features/muc-tieu/tinh-toan";
import { dangGio, soVoiTuanTruoc } from "../src/features/tu-hoc/tinh-tien-do";
import { apDungCong, chonToHopHienThi } from "../src/features/thu-tinh-huong/tinh-toan";
import type { AppState } from "../src/state/store";
import type { LuaChon, MonId } from "../src/state/types";
import { taoHoSoMau } from "../src/state/mau";

console.log("=== BẮT ĐẦU AUDIT LOGIC & EDGE CASES ENGINE ===");

// 1. Phân tích: Không lỗi khi điểm rỗng, 0 điểm, NaN hoặc thiếu môn
{
  const diemRong = { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null };
  const diemNaN = { toan: Number.NaN, vatLy: null, hoaHoc: 0, sinh: null, nguVan: null, tiengAnh: null } as unknown as Record<MonId, number | null>;
  
  assert.equal(tongDiem(diemRong, ["toan", "vatLy", "hoaHoc"]), 0);
  assert.equal(tongDiem(diemNaN, ["toan", "vatLy", "hoaHoc"]), 0);
  assert.equal(tongDiem(diemRong, []), 0);

  const thieu = monThieuCuaToHop(diemNaN, ["toan", "vatLy", "hoaHoc"]);
  assert.deepEqual(thieu, ["toan", "vatLy"]);

  const kc = khoangCachTheoMon(diemRong, ["toan", "vatLy", "hoaHoc"], 27);
  assert.equal(kc.length, 3);
  assert.ok(kc.every((k) => Number.isFinite(k.thieu) && Number.isFinite(k.mucTieu)));

  const kcNan = khoangCachTheoMon(diemNaN, ["toan", "vatLy", "hoaHoc"], Number.NaN);
  assert.equal(kcNan.length, 3);
  assert.ok(kcNan.every((k) => Number.isFinite(k.thieu)));

  const kcRong = khoangCachTheoMon(diemRong, [], 25);
  assert.deepEqual(kcRong, []);
}

// 2. Điểm phù hợp & So sánh tình huống: Không NaN hay chia cho 0
{
  const lcs: LuaChon[] = [
    {
      id: "test-1", truong: "TEST", tenTruong: "Trường Test", nganh: "CNTT", nhomNganh: "Công nghệ thông tin",
      moTa: "", bac: "Đại học", khuVuc: "TP.HCM", diemMin: 25, diemMax: 27, namDiem: 2024, tone: "xanh",
      lyDoPhuHop: [], canLuuY: [], nguon: "test", daKiemChung: true,
    },
  ];

  const diem = diemPhuHop(lcs[0], { tong: Number.NaN, nganSachTrieu: 0, khuVuc: "", uuTien: "viecLam" });
  assert.ok(Number.isFinite(diem) && diem >= 0 && diem <= 100);

  const ss = soSanhTinhHuong([], { tong: 20, nganSachTrieu: 50, khuVuc: "", uuTien: "hocPhi" }, { tong: 22, nganSachTrieu: 50, khuVuc: "", uuTien: "hocPhi" });
  assert.equal(ss.thayDoiLonNhat, null);
  assert.equal(ss.dong.length, 0);

  const pt = phanTichDanhSach([], { nganSach: null, khuVuc: [] });
  assert.equal(pt.canBang.diem, 0);
  assert.equal(pt.taiChinh.diem, 0);
  assert.equal(pt.khuVuc.diem, 0);
}

// 3. Tương thích GDPT 2018 với 5 môn thêm (Sử, Địa, GDKT&PL, Tin học, Công nghệ)
{
  const appState: AppState = {
    ...taoHoSoMau(),
    diemThi: [],
    hoSo: {
      ...taoHoSoMau().hoSo,
      diem: { toan: 8, vatLy: null, hoaHoc: null, sinh: null, nguVan: 8.5, tiengAnh: 9 },
      diemThem: { lichSu: 8, diaLy: 7.5, gdktpl: 9, tinHoc: 8.5, congNghe: 8 },
    },
  };

  const dayDu = diemDayDu(appState);
  assert.equal(dayDu.toan, 8);
  assert.equal(dayDu.lichSu, 8);
  assert.equal(dayDu.tinHoc, 8.5);
  assert.equal(dayDu.gdktpl, 9);

  // Test C00 (Văn, Sử, Địa)
  const c00 = tongChoLuaChon({ toHopXet: ["C00"] }, dayDu);
  assert.equal(c00.tong, 24); // 8.5 + 8 + 7.5
  assert.equal(c00.toHop, "C00");

  // Test D14 (Văn, Sử, Anh)
  const d14 = tongChoLuaChon({ toHopXet: ["D14"] }, dayDu);
  assert.equal(d14.tong, 25.5); // 8.5 + 8 + 9
  assert.equal(d14.toHop, "D14");

  // Test X26 (Toán, Tin, Anh)
  const x26 = tongChoLuaChon({ toHopXet: ["X26"] }, dayDu);
  assert.equal(x26.tong, 25.5); // 8 + 8.5 + 9
  assert.equal(x26.toHop, "X26");

  // Test ngành có tổ hợp nhưng thiếu điểm môn
  const dayDuThieu = { ...dayDu, lichSu: null };
  const c00Thieu = tongChoLuaChon({ toHopXet: ["C00"] }, dayDuThieu);
  assert.equal(c00Thieu.tong, null);
  assert.ok(c00Thieu.thieuMon?.includes("lichSu"));
}

// 4. Xếp lịch: Bảo vệ giờ ăn/nghỉ ngơi & Bẫy vòng lặp khi lịch học kín 100%
{
  const thuHai = thuHaiCuaTuan("2026-10-05");

  // Tạo lịch kín 100% từ 06:30 đến 21:30 suốt 7 ngày
  const coDinhKin = [1, 2, 3, 4, 5, 6, 7].map((thu) => ({
    id: `kin-${thu}`,
    ten: "Học kín ngày",
    loai: "chinhKhoa" as const,
    thu,
    batDau: "06:30",
    ketThuc: "21:30",
  }));

  const kqKin = xepLichTuan({
    tuanBatDau: thuHai,
    coDinh: coDinhKin,
    viec: [
      { id: "v1", mon: "toan", tieuDe: "Toán", chiTiet: "", phut: 60, mucUuTien: "cao", lyDo: "", tieuChi: [], taiLieu: [] },
      { id: "v2", mon: "vatLy", tieuDe: "Lý", chiTiet: "", phut: 90, mucUuTien: "cao", lyDo: "", tieuChi: [], taiLieu: [] },
    ],
    cfg: CAU_HINH_MAC_DINH,
  });

  // Không bị treo, xếp được 0 khối và đưa toàn bộ vào danh sách chưa xếp
  assert.equal(kqKin.khoi.length, 0);
  assert.equal(kqKin.chuaXep.length, 2);
  assert.ok(kqKin.ghiChu.length > 0);

  // Kiểm tra giờ bắt đầu >= giờ kết thúc trong config không làm crash
  const khungLoi = khungTrongTrongNgay("2026-10-05", [], { ...CAU_HINH_MAC_DINH, gioBatDau: "22:00", gioKetThuc: "06:00" });
  assert.deepEqual(khungLoi, []);

  // Giờ ăn uống và nghỉ ngơi được bảo vệ nghiêm ngặt
  const kqBinhThuong = xepLichTuan({
    tuanBatDau: thuHai,
    coDinh: [],
    viec: [{ id: "v1", mon: "toan", tieuDe: "Toán", chiTiet: "", phut: 180, mucUuTien: "cao", lyDo: "", tieuChi: [], taiLieu: [] }],
    cfg: CAU_HINH_MAC_DINH,
  });
  for (const k of kqBinhThuong.khoi) {
    for (const b of KHUNG_BAO_VE_GIO) {
      assert.ok(k.ketThuc <= b.batDau || k.batDau >= b.ketThuc, `Khối ${k.batDau}-${k.ketThuc} xâm phạm ${b.ten}`);
    }
  }
}

// 5. Sinh việc: ngân sách 0 hoặc âm không crash
{
  assert.equal(nganSachPhut(0), 0);
  assert.equal(nganSachPhut(-100), 0);
  assert.equal(nganSachPhut(Number.NaN), 0);

  const viecRong = taoViecTuan({
    toHop: ["toan", "vatLy", "hoaHoc"],
    diem: { toan: 8, vatLy: 8, hoaHoc: 8, sinh: null, nguVan: null, tiengAnh: null },
    diemMucTieu: 24,
    canCaiThien: [],
    tuan: "2026-10-05",
    chiSoTuan: 0,
    phutTuHoc: 0,
  });
  assert.deepEqual(viecRong, []);
}

// 6. Mục tiêu & Tiến độ: Các hàm tính toán xu hướng và tiến độ
{
  assert.equal(doDocXuHuong([]), null);
  assert.equal(doDocXuHuong([8]), null);
  assert.equal(doDocXuHuong([7, 8, 9]), 1);
  assert.equal(doDocXuHuong([Number.NaN, 8, 9]), 1);

  const cs = congSucMon(1.5, 8.5, [8, 8.5]);
  assert.ok(cs.diem > 0);
  assert.equal(cs.muc, "cao");

  const cs0 = congSucMon(0, 9, [9]);
  assert.equal(cs0.muc, "thap");

  assert.equal(dangGio(0), "0 phút");
  assert.equal(dangGio(-50), "0 phút");
  assert.equal(dangGio(90), "1 giờ 30 phút");
  assert.equal(dangGio(60), "1 giờ");
  assert.equal(dangGio(Number.NaN), "0 phút");

  assert.equal(soVoiTuanTruoc([], new Date()), null);
  assert.equal(soVoiTuanTruoc([{ viecId: "v1", ten: "V1", luc: "ngay-sai", trangThai: "xong" }], new Date()), null);
}

// 7. Thử tình huống: Chuyển đổi và cộng điểm an toàn
{
  const diemGoc = { toan: 8, vatLy: 7.5, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null };
  const diemCong = apDungCong(diemGoc, { toan: 1.5, vatLy: -1, hoaHoc: 2 });
  assert.equal(diemCong.toan, 9.5);
  assert.equal(diemCong.vatLy, 6.5);
  assert.equal(diemCong.hoaHoc, null); // môn null giữ nguyên null

  const th = chonToHopHienThi(diemGoc, null);
  assert.ok(th.ma === "A01" || th.ma === "A00");
}

console.log("🎉 TẤT CẢ TEST LOGIC & EDGE CASES ĐỀU ĐẠT 100%!");
