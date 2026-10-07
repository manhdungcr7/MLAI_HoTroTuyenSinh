// Nối mục tiêu, điểm và lịch của em với bộ sinh việc (engine/tao-viec). Hàm thuần, không React.
import { nganSachPhut, taoViecTuan, type DauVaoViecTuan } from "@/engine/tao-viec";
import { bayNgayCuaTuan, soNgayTu, xepLichTuan, isoNgay } from "@/engine/xep-lich";
import { diemCacLanGanNhat, doDocXuHuong } from "@/features/muc-tieu/tinh-toan";
import { uocLuongGioTuHoc } from "@/features/tu-hoc/tinh-tien-do";
import { mucTieuDayDu } from "@/state/chon";
import { diemHienTaiCuaTungMon, type AppState } from "@/state/store";
import { CAC_MON, type MonId, type ViecCanHoc } from "@/state/types";

/** Mốc cố định để mỗi tuần xoay sang chủ đề ôn khác nhau. */
const MOC_TUAN = "2026-01-05";
const SO_TUAN_GIU_LAI = 6;

const lopCuaEm = (s: AppState): 11 | 12 => (s.hoSo.khoi === 11 ? 11 : 12);
const chiSoTuanCua = (tuan: string) => Math.max(0, Math.floor(soNgayTu(MOC_TUAN, tuan) / 7));
// Nếu tamTrang được đặt nhưng không phải hôm nay, thì coi như bình thường
const tamTrangVanHieuLuc = (s: AppState) => (s.tamTrangNgay === isoNgay(new Date()) ? s.tamTrang : "binhThuong");

/** `tuNgay`: chỉ tính giờ trống từ ngày đó trở đi (các ngày đã qua không xếp được nữa). */
export function dauVaoViecTuan(s: AppState, tuan: string, tuNgay?: string): DauVaoViecTuan | null {
  const m = mucTieuDayDu(s);
  if (!m) return null;
  const doDoc: Partial<Record<MonId, number | null>> = {};
  for (const mon of CAC_MON) doDoc[mon] = doDocXuHuong(diemCacLanGanNhat(s.diemThi, mon));
  const gio = uocLuongGioTuHoc(s.coDinh, s.cauHinh, tuan, tuNgay);
  return {
    toHop: m.toHop, diem: diemHienTaiCuaTungMon(s), diemMucTieu: m.mucTieu, canCaiThien: s.hoSo.canCaiThien, doDoc,
    tuan, chiSoTuan: chiSoTuanCua(tuan), phutTuHoc: gio.tongPhut, tamTrang: tamTrangVanHieuLuc(s),
    ngayConDenThi: m.soNgayCon > 0 ? m.soNgayCon : undefined, lop: lopCuaEm(s),
  };
}

/** Môn chung cho mọi tổ hợp, dùng ôn nhẹ khi em chưa có mục tiêu. */
const TO_HOP_ON_NHE: MonId[] = ["toan", "nguVan", "tiengAnh"];

/** Đầu vào ôn nhẹ khi chưa có mục tiêu: giữ nhịp ba môn chung, không nói về điểm còn thiếu. UI nối sau. */
export function dauVaoViecTuanNhe(s: AppState, tuan: string, tuNgay?: string): DauVaoViecTuan {
  const gio = uocLuongGioTuHoc(s.coDinh, s.cauHinh, tuan, tuNgay);
  return {
    toHop: TO_HOP_ON_NHE, diem: diemHienTaiCuaTungMon(s), diemMucTieu: 0, canCaiThien: s.hoSo.canCaiThien,
    tuan, chiSoTuan: chiSoTuanCua(tuan), phutTuHoc: gio.tongPhut, tamTrang: tamTrangVanHieuLuc(s), lop: lopCuaEm(s), nhe: true,
  };
}

export type KetQuaTaoViec = { ok: true; viec: ViecCanHoc[]; moi: number } | { ok: false; lyDo: string };

/**
 * Danh sách việc mới cho một tuần: giữ việc đã xong của tuần đó, tạo lại các việc còn lại theo điểm hiện tại,
 * bỏ việc cũ không thuộc tuần nào (dữ liệu mẫu) và việc quá cũ.
 */
export function viecChoTuan(s: AppState, tuan: string, tuNgay?: string, bayGio: Date = new Date(), nhe = false): KetQuaTaoViec {
  const dv = nhe ? dauVaoViecTuanNhe(s, tuan, tuNgay) : dauVaoViecTuan(s, tuan, tuNgay);
  if (!dv) return { ok: false, lyDo: "Em chọn mục tiêu chính trước, mình mới biết nên ôn môn nào." };
  if (nganSachPhut(dv.phutTuHoc, dv.tamTrang) < 45) return { ok: false, lyDo: "Tuần này gần như không còn giờ tự học trống. Em nới giờ học trong Cài đặt tự học hoặc bớt ngày nghỉ." };
  const xong = new Set(s.viec.filter((v) => v.tuan === tuan && s.trangThaiViec[v.id] === "xong").map((v) => v.id));
  // Thời gian trống ước tính chưa tính các buổi xem trước bài, giờ nghỉ giữa buổi, giới hạn mỗi ngày và các ngày đã qua.
  // Nên thử xếp thật: giảm dần khối lượng cho tới khi mọi việc đều có chỗ, để không tạo ra việc không thể làm.
  // Dò đúng điều kiện thật của "Xếp lại" (state/xep-lai.ts): giờ hiện tại, khối khóa, khối em tự thêm, khối việc đã xong, khối trước tuNgay.
  const ngays = bayNgayCuaTuan(tuan);
  const giuKhoi = s.khoiHoc.filter((k) => !ngays.includes(k.ngay) || k.khoa || !k.id.startsWith("auto-") || (k.viecId && xong.has(k.viecId)) || (tuNgay && k.ngay < tuNgay));
  const daKhoa = new Set(giuKhoi.filter((k) => k.khoa && k.viecId).map((k) => k.viecId));
  const tuPhut = tuNgay && tuNgay === isoNgay(bayGio) ? bayGio.getHours() * 60 + bayGio.getMinutes() : undefined;
  let taoMoi: ViecCanHoc[] = [];
  for (const he of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
    taoMoi = taoViecTuan({ ...dv, phutTuHoc: dv.phutTuHoc * he }).filter((v) => !xong.has(v.id));
    if (taoMoi.length === 0) break;
    const thu = xepLichTuan({
      tuanBatDau: tuan, tuNgay, tuPhut, coDinh: s.coDinh, viec: taoMoi.filter((v) => !daKhoa.has(v.id)), cfg: s.cauHinh, tamTrang: s.tamTrang, // đúng như xepLaiTuan sẽ dùng
      khoiDaCo: giuKhoi,
    });
    if (thu.chuaXep.length === 0) break;
  }
  if (taoMoi.length === 0 && xong.size === 0) return { ok: false, lyDo: "Chưa còn chỗ trống để xếp việc trong phần còn lại của tuần này. Em thử sang tuần sau hoặc nới giờ học trong Cài đặt tự học." };
  // Giữ việc của các tuần khác trong vòng 6 tuần (để xem lại tiến độ), và việc đã xong của tuần này.
  const giu = s.viec.filter((v) => (v.tuan && v.tuan !== tuan && Math.abs(soNgayTu(tuan, v.tuan)) / 7 <= SO_TUAN_GIU_LAI) || (v.tuan === tuan && xong.has(v.id)));
  return { ok: true, viec: [...giu, ...taoMoi], moi: taoMoi.length };
}
