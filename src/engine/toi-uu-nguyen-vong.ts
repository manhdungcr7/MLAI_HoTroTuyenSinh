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

function diemCoUuTien(diemThi: DiemDayDu, uuTien?: HoSo["uuTienTuyenSinh"] | null): DiemDayDu {
  if (diemThi.uuTien !== undefined) return diemThi;
  const muc = mucUuTien(uuTien);
  return muc > 0 ? { ...diemThi, uuTien: muc } : diemThi;
}

function tenNhom(nhan: NhanNguyenVong | null): "thuSuc" | "vuaSuc" | "anToan" | null {
  if (nhan === "Thử sức") return "thuSuc";
  if (nhan === "Vừa sức") return "vuaSuc";
  if (nhan === "An toàn" || nhan === "Dự phòng") return "anToan";
  return null;
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
    return [{ id: lc.id, thuTu: index + 1, lc, diemXet, chenhDiem,
      nhan: nhanChoLuaChon(lc, diemXet), biNghichDao: false,
      vuotNganSach: nganSachToiDa !== null && (lc.hocPhiMin ?? 0) > nganSachToiDa }];
  });

  let thuSuc = 0, vuaSuc = 0, anToan = 0;
  for (const nv of cacNguyenVong) {
    const group = tenNhom(nv.nhan);
    if (group === "thuSuc") thuSuc++;
    else if (group === "vuaSuc") vuaSuc++;
    else if (group === "anToan") anToan++;
  }

  // Gợi ý học sinh xem lại thứ tự; không tự đổi vì thứ tự phải theo sở thích.
  for (let i = 0; i < cacNguyenVong.length; i++) {
    const current = cacNguyenVong[i];
    if (current.nhan !== "An toàn" && current.nhan !== "Dự phòng") continue;
    const later = cacNguyenVong.slice(i + 1).find((nv) => nv.nhan === "Thử sức");
    if (!later) continue;
    current.biNghichDao = true;
    current.canhBaoNghichDao = `NV${current.thuTu} có nhãn ${current.nhan} theo điểm lịch sử, đứng trước NV${later.thuTu} có nhãn Thử sức. Thứ tự vẫn nên theo sở thích của em.`;
    canhBaoNghiemTrong.push(current.canhBaoNghichDao);
  }

  const vuotPhi = cacNguyenVong.filter((nv) => nv.vuotNganSach);
  if (vuotPhi.length) canhBaoNghiemTrong.push(`${vuotPhi.length} nguyện vọng có học phí tối thiểu cao hơn ngân sách đã chọn.`);
  const chuaSoDuoc = cacNguyenVong.filter((nv) => nv.nhan === null).length;
  const diemManh: string[] = [];
  const deXuatHanhDong: string[] = [];
  if (cacNguyenVong.length === 0) {
    deXuatHanhDong.push("Em chưa chọn nguyện vọng nào. Hãy khám phá và thêm các ngành học mục tiêu vào danh mục để xem phân tích.");
  } else {
    if (thuSuc && vuaSuc && anToan) diemManh.push("Danh sách có lựa chọn ở cả ba nhóm khoảng cách điểm lịch sử.");
    if (!anToan) deXuatHanhDong.push("Chưa có lựa chọn An toàn hoặc Dự phòng theo điểm chuẩn lịch sử; em có thể xem thêm ngành khác.");
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
    coCau: { thuSuc, vuaSuc, anToan },
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
