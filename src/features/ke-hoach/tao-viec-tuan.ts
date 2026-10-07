// Nối mục tiêu, điểm và lịch của em với bộ sinh việc (engine/tao-viec). Hàm thuần, không React.
import { nganSachPhut, taoViecTuan, type DauVaoViecTuan } from "@/engine/tao-viec";
import { soNgayTu, xepLichTuan, isoNgay } from "@/engine/xep-lich";
import { diemCacLanGanNhat, doDocXuHuong } from "@/features/muc-tieu/tinh-toan";
import { uocLuongGioTuHoc } from "@/features/tu-hoc/tinh-tien-do";
import { mucTieuDayDu } from "@/state/chon";
import { diemHienTaiCuaTungMon, type AppState } from "@/state/store";
import { CAC_MON, type MonId, type ViecCanHoc } from "@/state/types";

/** Mốc cố định để mỗi tuần xoay sang chủ đề ôn khác nhau. */
const MOC_TUAN = "2026-01-05";
const SO_TUAN_GIU_LAI = 6;

export function dauVaoViecTuan(s: AppState, tuan: string): DauVaoViecTuan | null {
  const m = mucTieuDayDu(s);
  if (!m) return null;
  const doDoc: Partial<Record<MonId, number | null>> = {};
  for (const mon of CAC_MON) doDoc[mon] = doDocXuHuong(diemCacLanGanNhat(s.diemThi, mon));
  const gio = uocLuongGioTuHoc(s.coDinh, s.cauHinh, tuan);
  // Nếu tamTrang được đặt nhưng không phải hôm nay, thì coi như bình thường
  const homNay = isoNgay(new Date());
  const tamTrangVanHieuLuc = s.tamTrangNgay === homNay ? s.tamTrang : "binhThuong";
  return {
    toHop: m.toHop, diem: diemHienTaiCuaTungMon(s), diemMucTieu: m.mucTieu, canCaiThien: s.hoSo.canCaiThien, doDoc,
    tuan, chiSoTuan: Math.max(0, Math.floor(soNgayTu(MOC_TUAN, tuan) / 7)), phutTuHoc: gio.tongPhut, tamTrang: tamTrangVanHieuLuc,
    ngayConDenThi: m.soNgayCon > 0 ? m.soNgayCon : undefined,
  };
}

export type KetQuaTaoViec = { ok: true; viec: ViecCanHoc[]; moi: number } | { ok: false; lyDo: string };

/**
 * Danh sách việc mới cho một tuần: giữ việc đã xong của tuần đó, tạo lại các việc còn lại theo điểm hiện tại,
 * bỏ việc cũ không thuộc tuần nào (dữ liệu mẫu) và việc quá cũ.
 */
export function viecChoTuan(s: AppState, tuan: string, tuNgay?: string): KetQuaTaoViec {
  const dv = dauVaoViecTuan(s, tuan);
  if (!dv) return { ok: false, lyDo: "Em chọn mục tiêu chính trước, mình mới biết nên ôn môn nào." };
  if (nganSachPhut(dv.phutTuHoc, dv.tamTrang) < 45) return { ok: false, lyDo: "Tuần này gần như không còn giờ tự học trống. Em nới giờ học trong Cài đặt tự học hoặc bớt ngày nghỉ." };
  const xong = new Set(s.viec.filter((v) => v.tuan === tuan && s.trangThaiViec[v.id] === "xong").map((v) => v.id));
  // Thời gian trống ước tính chưa tính các buổi xem trước bài, giờ nghỉ giữa buổi, giới hạn mỗi ngày và các ngày đã qua.
  // Nên thử xếp thật: giảm dần khối lượng cho tới khi mọi việc đều có chỗ, để không tạo ra việc không thể làm.
  let taoMoi: ViecCanHoc[] = [];
  for (const he of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
    taoMoi = taoViecTuan({ ...dv, phutTuHoc: dv.phutTuHoc * he }).filter((v) => !xong.has(v.id));
    if (taoMoi.length === 0) break;
    const thu = xepLichTuan({
      tuanBatDau: tuan, tuNgay, coDinh: s.coDinh, viec: taoMoi, cfg: s.cauHinh, tamTrang: s.tamTrang,
      khoiDaCo: s.khoiHoc.filter((k) => k.viecId && xong.has(k.viecId)),
    });
    if (thu.chuaXep.length === 0) break;
  }
  if (taoMoi.length === 0 && xong.size === 0) return { ok: false, lyDo: "Chưa còn chỗ trống để xếp việc trong phần còn lại của tuần này. Em thử sang tuần sau hoặc nới giờ học trong Cài đặt tự học." };
  // Giữ việc của các tuần khác trong vòng 6 tuần (để xem lại tiến độ), và việc đã xong của tuần này.
  const giu = s.viec.filter((v) => (v.tuan && v.tuan !== tuan && Math.abs(soNgayTu(tuan, v.tuan)) / 7 <= SO_TUAN_GIU_LAI) || (v.tuan === tuan && xong.has(v.id)));
  return { ok: true, viec: [...giu, ...taoMoi], moi: taoMoi.length };
}
