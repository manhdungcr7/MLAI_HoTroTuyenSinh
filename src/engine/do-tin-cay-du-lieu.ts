// Đếm "dữ liệu đang dùng mạnh đến đâu" cho khối Độ tin cậy ở trang Về dữ liệu. TypeScript thuần, không React.
// Mọi con số là ĐẾM từ danh sách chương trình truyền vào (không số cứng). Không tính độ chính xác: chưa có phép đo nào để gọi tên.
import type { LuaChon } from "@/state/types";
import type { ThongKeBienDong } from "./du-bao-diem-chuan";
import { phanLoaiDuLieu, type LoaiDuLieu } from "./trang-thai-du-lieu";

export type MucTinCayDuBao = "cao" | "vua" | "thap";

export interface DoTinCayDuLieu {
  /** Tổng số chương trình trong danh sách. */
  tong: number;
  /** Số chương trình theo loại dữ liệu điểm. Tổng các loại bằng `tong`. */
  theoLoai: Record<LoaiDuLieu, number>;
  /** Nguồn: từ đề án PDF chính thức, từ trang tổng hợp đã kiểm chứng, và nguồn không ghi rõ. Tổng ba số bằng `tong`. */
  nguonChinhThuc: number;
  nguonTongHop: number;
  nguonKhac: number;
  /** Năm điểm mới nhất trong các chương trình có điểm THPT (null nếu không có), và số chương trình có điểm năm đó. */
  namDiemMoiNhat: number | null;
  soCoNamDiemMoiNhat: number;
  /** Số chương trình có học phí đã đối chiếu văn bản (đang có `hocPhiMin`). */
  hocPhiDaKiemChung: number;
  /** Số chương trình có tỷ lệ việc làm. */
  coViecLam: number;
  /** Năm tuyển sinh được dự báo, và số chương trình có dự báo theo từng mức tin cậy. */
  namDuBao: number;
  duBaoTheoTinCay: Record<MucTinCayDuBao, number>;
  /** Số dự báo có cận trên chạm trần 30 điểm. */
  chamTran: number;
  /** Số trường (đếm theo mã trường; chương trình không có mã thì đếm theo tên trường). */
  soTruong: number;
}

/** Đếm các chỉ số độ tin cậy của danh sách chương trình đang dùng. `tk` và `namDuBao` dùng để tính dự báo cho từng chương trình. */
export function tinhDoTinCayDuLieu(danhSach: readonly LuaChon[], tk: ThongKeBienDong, namDuBao: number): DoTinCayDuLieu {
  const theoLoai: Record<LoaiDuLieu, number> = { nhieuNam: 0, motNam: 0, chiDiemSan: 0, khongDu: 0, phuongThucKhac: 0 };
  const duBaoTheoTinCay: Record<MucTinCayDuBao, number> = { cao: 0, vua: 0, thap: 0 };
  const truong = new Set<string>();
  let nguonChinhThuc = 0, nguonTongHop = 0, nguonKhac = 0, hocPhiDaKiemChung = 0, coViecLam = 0, chamTran = 0;
  let namDiemMoiNhat: number | null = null, soCoNamDiemMoiNhat = 0;

  for (const lc of danhSach) {
    const t = phanLoaiDuLieu(lc, tk, namDuBao);
    theoLoai[t.loai]++;

    if (lc.nguonCap === "official_pdf") nguonChinhThuc++;
    else if (lc.nguonCap === "aggregator_verified") nguonTongHop++;
    else nguonKhac++;

    // Năm điểm THPT mới nhất: chỉ tính các chương trình có điểm chuẩn (không tính điểm sàn hay phương thức khác).
    if ((t.loai === "nhieuNam" || t.loai === "motNam") && t.namCuoi !== null) {
      if (namDiemMoiNhat === null || t.namCuoi > namDiemMoiNhat) { namDiemMoiNhat = t.namCuoi; soCoNamDiemMoiNhat = 1; }
      else if (t.namCuoi === namDiemMoiNhat) soCoNamDiemMoiNhat++;
    }

    if (lc.hocPhiMin !== undefined) hocPhiDaKiemChung++;
    if (lc.tiLeViecLam !== undefined) coViecLam++;

    if (t.duBao) {
      duBaoTheoTinCay[t.duBao.doTinCay]++;
      if (t.duBao.chamTran) chamTran++;
    }

    truong.add(lc.maTruong ?? lc.truong);
  }

  return {
    tong: danhSach.length, theoLoai, nguonChinhThuc, nguonTongHop, nguonKhac,
    namDiemMoiNhat, soCoNamDiemMoiNhat, hocPhiDaKiemChung, coViecLam,
    namDuBao, duBaoTheoTinCay, chamTran, soTruong: truong.size,
  };
}
