// Điểm hội tụ của MỌI màn khi nói về "điểm của em so với một ngành": trạng thái dữ liệu, điểm chuẩn gần nhất hợp lệ, dự báo,
// vị trí điểm em, nhãn, câu mô tả định tính. TypeScript thuần, không React. Một nguồn: màn nào cần số này đều gọi hàm này.
//
// Không có phần trăm "xác suất đậu" ở đây (mô hình xác suất chưa được kiểm định hiệu chỉnh, xem `XAC_SUAT_DA_HIEU_CHINH`).
// Thiếu dữ liệu thì trả null kèm lý do, không điền 0, không so điểm sàn 15,0, không so điểm học bạ/ĐGNL với điểm thi THPT.
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { NHAN_DU_BAO } from "@/noi-dung/du-bao";
import type { DiemDayDu, LuaChon, NhanNguyenVong } from "@/state/types";
import { dinhDang, dinhDangDiem } from "./dinh-dang";
import { MO_TA_VI_TRI, viTriSoVoiDuBao, type DuBaoDiemChuan, type ThongKeBienDong, type ViTriSoVoiDuBao } from "./du-bao-diem-chuan";
import { nhanNguyenVong } from "./phan-tich";
import { lyDoKhongSoDuoc, phanLoaiDuLieu, type TrangThaiDuLieu } from "./trang-thai-du-lieu";

export interface DiemChuanGanNhat {
  diem: number;
  nam: number;
  /** Điểm lấy từ trang tổng hợp, chưa đối chiếu đề án. */
  nguonThuCap: boolean;
  /** Năm chưa kết thúc / dự kiến: chỉ để tham khảo. */
  laThamChieu: boolean;
}

export interface TomTatDiemNganh {
  id: string;
  trangThai: TrangThaiDuLieu;
  /** true khi được phép đem điểm chuẩn so với điểm thi THPT của em (loại A hoặc B). */
  soSanhDuoc: boolean;
  /** Vì sao không so được (điểm sàn, phương thức khác, chưa có điểm); null khi so được. */
  lyDoKhongSo: string | null;
  diemChuan: DiemChuanGanNhat | null;
  duBao: DuBaoDiemChuan | null;
  /** Tổng điểm em theo tổ hợp của CHÍNH ngành này; null khi thiếu điểm môn hoặc tổ hợp chưa tính được. */
  tongEm: number | null;
  toHopEm: string | null;
  /** Tổ hợp là suy ra (đề án chưa ghi), nên nói rõ với em. */
  suyRa: boolean;
  /** Lý do chưa có `tongEm` (null khi đã có). */
  lyDoThieuDiemEm: string | null;
  /** Điểm em trừ điểm chuẩn gần nhất, làm tròn 2 chữ số; null khi không so được. */
  chenh: number | null;
  /** Thử sức / Vừa sức / An toàn / Dự phòng: chỉ khi so được. Không phải xác suất. */
  nhan: NhanNguyenVong | null;
  /** Điểm em nằm ở đâu so với khoảng dự báo (chỉ khi có dự báo và có điểm em). */
  viTriDuBao: ViTriSoVoiDuBao | null;
  /** Một đoạn ngắn định tính cho học sinh, đủ để dùng nguyên văn trên thẻ và gửi AI làm gợi ý. */
  moTa: string;
}

const lam2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Gộp mọi thứ cần biết về một ngành so với điểm của em. `diemEm` là điểm đủ các môn (đã gồm `uuTien` nếu em khai),
 * `tk` là thống kê biến động chung (`thongKeChung()`), `namDuBao` là năm tuyển sinh tới (`namTuyenSinhToi()`).
 */
export function tomTatDiemChoNganh(lc: LuaChon, diemEm: DiemDayDu, tk: ThongKeBienDong, namDuBao: number): TomTatDiemNganh {
  const trangThai = phanLoaiDuLieu(lc, tk, namDuBao);
  const lyDoKhongSo = lyDoKhongSoDuoc(lc);
  const soSanhDuoc = lyDoKhongSo === null;
  const diemChuan: DiemChuanGanNhat | null = soSanhDuoc && trangThai.diemCuoi !== null && trangThai.namCuoi !== null
    ? { diem: trangThai.diemCuoi, nam: trangThai.namCuoi, nguonThuCap: trangThai.nguonThuCap, laThamChieu: trangThai.laThamChieu } : null;
  const duBao = soSanhDuoc ? trangThai.duBao : null;

  // Tổng điểm của em: chỉ có nghĩa khi so được; phương thức khác thì không tính để không ai lỡ so nhầm thang.
  const tl = soSanhDuoc ? tongChoLuaChon(lc, diemEm) : null;
  const tongEm = tl?.tong ?? null;
  const lyDoThieuDiemEm = !soSanhDuoc || tongEm !== null ? null
    : tl?.khongTinhDuoc ? `Ngành xét tổ hợp ${tl.khongTinhDuoc.slice(0, 3).join(", ")}, mình chưa tính được điểm này.`
      : tl?.thieuMon?.length ? "Bạn chưa nhập đủ điểm các môn của tổ hợp xét tuyển."
        : "Bạn chưa nhập đủ điểm 3 môn của một tổ hợp.";

  const chenh = diemChuan && tongEm !== null ? lam2(tongEm - diemChuan.diem) : null;
  const nhan = diemChuan && tongEm !== null ? nhanNguyenVong({ ...lc, diemMin: diemChuan.diem }, tongEm) : null;
  const viTriDuBao = duBao && tongEm !== null ? viTriSoVoiDuBao(tongEm, duBao) : null;

  return {
    id: lc.id, trangThai, soSanhDuoc, lyDoKhongSo, diemChuan, duBao,
    tongEm, toHopEm: tl?.toHop ?? null, suyRa: tl?.suyRa ?? false, lyDoThieuDiemEm, chenh, nhan, viTriDuBao,
    moTa: dungMoTa({ soSanhDuoc, lyDoKhongSo, diemChuan, duBao, tongEm, lyDoThieuDiemEm, chenh, viTriDuBao, trangThai }),
  };
}

function dungMoTa(t: Pick<TomTatDiemNganh, "soSanhDuoc" | "lyDoKhongSo" | "diemChuan" | "duBao" | "tongEm" | "lyDoThieuDiemEm" | "chenh" | "viTriDuBao" | "trangThai">): string {
  if (!t.soSanhDuoc) return t.lyDoKhongSo ?? "";
  const dc = t.diemChuan;
  if (!dc) return "Chưa có điểm chuẩn để so.";
  const phan: string[] = [];
  const ghiChu = [dc.laThamChieu ? "điểm tham chiếu" : "", dc.nguonThuCap ? "từ trang tổng hợp" : "", t.trangThai.loai === "motNam" ? "mới có một năm" : ""].filter(Boolean).join(", ");
  if (t.tongEm === null || t.chenh === null) {
    phan.push(`Điểm chuẩn năm ${dc.nam} là ${dinhDangDiem(dc.diem)}${ghiChu ? ` (${ghiChu})` : ""}. ${t.lyDoThieuDiemEm ?? ""}`.trim());
  } else {
    const so = dinhDang(Math.abs(t.chenh), 1);
    const vs = t.chenh >= 0 ? (t.chenh < 0.05 ? "bằng" : `cao hơn ${so} điểm so với`) : `thấp hơn ${so} điểm so với`;
    phan.push(`Điểm của bạn ${dinhDangDiem(t.tongEm)} ${vs} điểm chuẩn năm ${dc.nam} (${dinhDangDiem(dc.diem)}${ghiChu ? `, ${ghiChu}` : ""}).`);
  }
  if (t.duBao) {
    phan.push(`Khoảng dự kiến năm ${t.duBao.namDuBao}: ${dinhDangDiem(t.duBao.thap)} đến ${dinhDangDiem(t.duBao.cao)}. ${NHAN_DU_BAO(t.duBao.namDuBao)}`);
    if (t.viTriDuBao) phan.push(MO_TA_VI_TRI[t.viTriDuBao]);
  }
  return phan.join(" ");
}
