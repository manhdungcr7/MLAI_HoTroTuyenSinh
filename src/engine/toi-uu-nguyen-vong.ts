// Chẩn đoán khoảng cách điểm lịch sử và tạo danh sách tham khảo.
// Điểm không phải xác suất; thứ tự nguyện vọng luôn do học sinh quyết định.
import type { DiemDayDu, HoSo, LuaChon, NhanNguyenVong } from "@/state/types";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { NGAN_SACH_TOI_DA, nhanChoLuaChon } from "@/engine/phan-tich";
import { mucUuTien } from "@/engine/diem-uu-tien";
import { tinhXacSuatTrungTuyen } from "@/engine/xac-suat-trung-tuyen";

export interface PhapNghiemNguyenVong {
  id: string;
  thuTu: number;
  lc: LuaChon;
  diemXet: number | null;
  chenhDiem: number | null;
  nhan: NhanNguyenVong | null;
  biNghichDao: boolean;
  canhBaoNghichDao?: string;
  vuotNganSach: boolean;
}

export interface ChanDoanDanhMuc {
  soLuong: number;
  cacNguyenVong: PhapNghiemNguyenVong[];
  danhGiaRuiRo: "Có điểm cần xem lại" | "Cần bổ sung dữ liệu" | "Cân đối theo điểm lịch sử" | "Cần xem ngân sách";
  canhBaoNghiemTrong: string[];
  diemManh: string[];
  deXuatHanhDong: string[];
  coCau: { thuSuc: number; vuaSuc: number; anToan: number };
  xacSuatDoItNhatMotNV?: number;
}

export interface HoSoXetTuyenToiUu {
  nganSach?: HoSo["nganSach"];
  khuVuc?: string[];
  nganhQuanTam?: string[];
  uuTienTuyenSinh?: HoSo["uuTienTuyenSinh"] | null;
}

/**
 * Phân loại chính xác 4 nhóm vị thế nguyện vọng chuẩn quy chế tuyển sinh:
 * - Thử sức: Chênh lệch điểm xét tuyển Δ ∈ [-2.0, -0.5) điểm (hoặc Δ < -0.5)
 * - Vừa sức: Chênh lệch điểm xét tuyển Δ ∈ [-0.5, +1.0] điểm
 * - An toàn: Chênh lệch điểm xét tuyển Δ ∈ (+1.0, +2.5] điểm
 * - Dự phòng: Chênh lệch điểm xét tuyển Δ > +2.5 điểm
 */
export function phanLoaiViThe(chenhDiem: number): NhanNguyenVong {
  const x = Math.round(chenhDiem * 100) / 100;
  if (x < -0.5) return "Thử sức";
  if (x <= 1.0) return "Vừa sức";
  if (x <= 2.5) return "An toàn";
  return "Dự phòng";
}

function diemCoUuTien(diemThi: DiemDayDu, uuTien?: HoSo["uuTienTuyenSinh"] | null): DiemDayDu {
  if (diemThi.uuTien !== undefined) return diemThi;
  const muc = mucUuTien(uuTien);
  return muc > 0 ? { ...diemThi, uuTien: muc } : diemThi;
}

export function danhGiaDanhMucToanDien(
  danhSachIds: string[],
  timLuaChon: (id: string) => LuaChon | undefined,
  diemThi: DiemDayDu,
  hoSo: HoSoXetTuyenToiUu,
): ChanDoanDanhMuc {
  const nganSachToiDa = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : null;
  const diemChuanHoa = diemCoUuTien(diemThi, hoSo.uuTienTuyenSinh);
  const canhBaoNghiemTrong: string[] = [];
  const cacNguyenVong: PhapNghiemNguyenVong[] = danhSachIds.flatMap((id, index) => {
    const lc = timLuaChon(id);
    if (!lc) return [];
    const diemXet = tongChoLuaChon(lc, diemChuanHoa).tong;
    const chenhDiem = diemXet === null ? null : Math.round((diemXet - lc.diemMin) * 100) / 100;
    const nhan = chenhDiem !== null ? phanLoaiViThe(chenhDiem) : nhanChoLuaChon(lc, diemXet);
    return [{ id: lc.id, thuTu: index + 1, lc, diemXet, chenhDiem,
      nhan, biNghichDao: false,
      vuotNganSach: nganSachToiDa !== null && (lc.hocPhiMin ?? 0) > nganSachToiDa }];
  });

  let thuSuc = 0, vuaSuc = 0, anToan = 0, duPhong = 0;
  for (const nv of cacNguyenVong) {
    if (nv.nhan === "Thử sức") thuSuc++;
    else if (nv.nhan === "Vừa sức") vuaSuc++;
    else if (nv.nhan === "An toàn") anToan++;
    else if (nv.nhan === "Dự phòng") duPhong++;
  }
  const tongAnToan = anToan + duPhong;

  // 1. Kiểm tra Lỗi 1 - Ngược vị thế (Inverted Order):
  // Học sinh đặt ngành điểm chuẩn thấp (An toàn/Dự phòng) ở trước ngành điểm chuẩn cao (Thử sức/Vừa sức).
  // Cảnh báo: "Nếu đỗ NV1, toàn bộ NV sau sẽ bị hủy bỏ theo quy chế lọc ảo của Bộ!".
  for (let i = 0; i < cacNguyenVong.length; i++) {
    const current = cacNguyenVong[i];
    const isChacChan = current.nhan === "An toàn" || current.nhan === "Dự phòng";
    if (!isChacChan) continue;

    const later = cacNguyenVong.slice(i + 1).find((nv) => {
      if (nv.nhan === "Thử sức" || nv.nhan === "Vừa sức") return true;
      if (current.lc.diemMin && nv.lc.diemMin && nv.lc.diemMin > current.lc.diemMin + 0.5) return true;
      return false;
    });

    if (later) {
      current.biNghichDao = true;
      current.canhBaoNghichDao = `Ngược vị thế: NV${current.thuTu} (${current.lc.nganh} - ${current.nhan}) xếp trước NV${later.thuTu} (${later.lc.nganh} - ${later.nhan}). Nếu đỗ NV${current.thuTu}, toàn bộ NV sau sẽ bị hủy bỏ theo quy chế lọc ảo của Bộ!`;
      canhBaoNghiemTrong.push(current.canhBaoNghichDao);
    }
  }

  // 2. Kiểm tra Lỗi 2 - Dồn rủi ro (Risk Clustering):
  // Toàn bộ hoặc đa số danh mục đều là Thử sức mà không có bất kỳ NV An toàn/Dự phòng nào.
  const coDonRuiRo = cacNguyenVong.length >= 2 && thuSuc >= 2 && tongAnToan === 0;
  if (coDonRuiRo) {
    canhBaoNghiemTrong.push(
      `Dồn rủi ro: Danh mục có ${thuSuc}/${cacNguyenVong.length} nguyện vọng Thử sức và thiếu hoàn toàn nguyện vọng An toàn hoặc Dự phòng. Cảnh báo nguy cơ trượt trắng cả mùa tuyển sinh!`
    );
  }

  const vuotPhi = cacNguyenVong.filter((nv) => nv.vuotNganSach);
  if (vuotPhi.length) canhBaoNghiemTrong.push(`${vuotPhi.length} nguyện vọng có học phí tối thiểu cao hơn ngân sách đã chọn.`);
  const chuaSoDuoc = cacNguyenVong.filter((nv) => nv.nhan === null).length;
  const diemManh: string[] = [];
  const deXuatHanhDong: string[] = [];
  if (cacNguyenVong.length === 0) {
    deXuatHanhDong.push("Em chưa chọn nguyện vọng nào. Hãy khám phá và thêm các ngành học mục tiêu vào danh mục để xem phân tích.");
  } else {
    if (thuSuc && vuaSuc && tongAnToan) diemManh.push("Danh sách cân bằng: có đủ lựa chọn ở cả ba nhóm vị thế (Thử sức, Vừa sức, An toàn/Dự phòng).");
    if (tongAnToan === 0) {
      deXuatHanhDong.push("Thiếu nguyện vọng dự phòng: Em cần bổ sung ít nhất 1–2 nguyện vọng An toàn hoặc Dự phòng (điểm chuẩn thấp hơn điểm của em từ 1.5 điểm trở lên) để đảm bảo không bị trượt đại học.");
    }
    if (!vuaSuc) deXuatHanhDong.push("Chưa có lựa chọn Vừa sức theo điểm chuẩn lịch sử.");
    if (chuaSoDuoc) deXuatHanhDong.push(`${chuaSoDuoc} nguyện vọng chưa đủ dữ liệu để so điểm; kiểm tra tổ hợp hoặc phương thức xét tuyển.`);
  }

  const danhGiaRuiRo = chuaSoDuoc ? "Cần bổ sung dữ liệu"
    : vuotPhi.length ? "Cần xem ngân sách"
      : canhBaoNghiemTrong.length ? "Có điểm cần xem lại"
        : "Cân đối theo điểm lịch sử";
  const res: ChanDoanDanhMuc = {
    soLuong: cacNguyenVong.length,
    cacNguyenVong,
    danhGiaRuiRo,
    canhBaoNghiemTrong,
    diemManh,
    deXuatHanhDong,
    coCau: { thuSuc, vuaSuc, anToan: tongAnToan },
  };

  let tichTruot = 1.0;
  for (const nv of cacNguyenVong) {
    const ts = nv.diemXet !== null ? tinhXacSuatTrungTuyen(nv.diemXet, nv.lc) : null;
    const p = ts ? ts.xacSuat : (nv.nhan === "Thử sức" ? 0.2 : nv.nhan === "Vừa sức" ? 0.6 : 0.85);
    tichTruot *= (1 - p);
  }
  const xacSuatDoItNhatMotNV = cacNguyenVong.length === 0 ? 0 : Math.round((1 - tichTruot) * 100);

  Object.defineProperty(res, "xacSuatDoItNhatMotNV", {
    value: xacSuatDoItNhatMotNV,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  return res;
}

/** Không sắp xếp nguyện vọng thay học sinh. Giữ hàm tương thích cho các caller cũ. */
export function toiUuThuTuDanhMuc(danhSachIds: string[]): string[] {
  return [...danhSachIds];
}

export function timKiemDanhMucToiUu(
  tatCa: LuaChon[],
  diemThi: DiemDayDu,
  hoSo: HoSoXetTuyenToiUu,
  soLuong = 5,
  chienLuoc: "can_bang" | "than_trong" | "but_pha" = "can_bang",
): LuaChon[] {
  const nganSachMax = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : Infinity;
  const khuVucHopLe = Array.isArray(hoSo.khuVuc) ? hoSo.khuVuc : [];
  const nganhQuanTam = Array.isArray(hoSo.nganhQuanTam) ? hoSo.nganhQuanTam : [];
  const diemChuanHoa = diemCoUuTien(diemThi, hoSo.uuTienTuyenSinh);
  const candidates = tatCa.flatMap((lc) => {
    if ((lc.hocPhiMin ?? 0) > nganSachMax) return [];
    const diem = tongChoLuaChon(lc, diemChuanHoa).tong;
    const nhan = nhanChoLuaChon(lc, diem);
    if (nhan === null) return [];
    const chenh = diem === null ? Infinity : Math.abs(diem - lc.diemMin);
    const interest = nganhQuanTam.some((n) => n === lc.nhomNganh) ? 0 : 1;
    const region = khuVucHopLe.length === 0 || dungKhuVuc(lc, khuVucHopLe) === true ? 0 : 1;
    return [{ lc, nhan, chenh, interest, region }];
  });
  const order: Record<typeof candidates[number]["nhan"], number> = chienLuoc === "than_trong"
    ? { "Dự phòng": 0, "An toàn": 1, "Vừa sức": 2, "Thử sức": 3 }
    : chienLuoc === "but_pha"
      ? { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 }
      : { "Vừa sức": 0, "An toàn": 1, "Dự phòng": 2, "Thử sức": 3 };
  candidates.sort((a, b) => a.interest - b.interest || a.region - b.region || order[a.nhan] - order[b.nhan] || a.chenh - b.chenh || a.lc.id.localeCompare(b.lc.id));
  return candidates.slice(0, Math.max(0, soLuong)).map((x) => x.lc);
}
