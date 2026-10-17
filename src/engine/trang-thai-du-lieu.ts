// Phân loại "dữ liệu điểm chuẩn của một chương trình đang ở trạng thái nào" để MỌI màn (danh sách, chi tiết, nguyện vọng, tư vấn AI)
// cùng nói một ngôn ngữ. TypeScript thuần, không React. Câu chữ hiển thị nằm ở `@/noi-dung/du-bao`.
//
// Nguyên tắc: chỉ khẳng định điều dữ liệu cho phép. Điểm sàn không bao giờ được gọi là điểm chuẩn; điểm của phương thức khác
// (học bạ, ĐGNL...) không so trực tiếp với điểm thi THPT; thiếu dữ liệu thì nói thiếu.
import type { LuaChon } from "@/state/types";
import { GIAI_THICH_TRANG_THAI } from "@/noi-dung/du-bao";
import { loaiDiemCuaNam } from "./du-lieu-tuyen-sinh/kiem-tra-diem";
import { TOI_DA_NAM_XA, duBaoDiemChuan, namTuyenSinhToi, type DuBaoDiemChuan, type ThongKeBienDong } from "./du-bao-diem-chuan";

export type LoaiDuLieu =
  | "nhieuNam" //      A: có điểm chuẩn THPT từ 2 năm trở lên → lịch sử + dự báo
  | "motNam" //        B: chỉ một năm → tham chiếu hạn chế
  | "chiDiemSan" //    C: các điểm có được đều là mức sàn → "Chỉ có điểm sàn"
  | "khongDu" //       D: không có điểm hợp lệ → "Chưa đủ dữ liệu để dự báo"
  | "phuongThucKhac"; // F: điểm thuộc học bạ/ĐGNL/... → không so với điểm THPT
// E (chương trình mới), G (đổi mã), H (dự báo cũ) là các cờ phụ trên TrangThaiDuLieu, không phải loại riêng.

export interface TrangThaiDuLieu {
  loai: LoaiDuLieu;
  /** Các năm có điểm hợp lệ (tăng dần). Riêng `chiDiemSan`: các năm chỉ có mức sàn. */
  cacNam: number[];
  /** Năm có điểm gần nhất, null nếu không có. */
  namCuoi: number | null;
  /** Điểm gần nhất dùng để so (null khi không được phép so với điểm THPT). */
  diemCuoi: number | null;
  /** Điểm lấy từ trang tổng hợp, chưa đối chiếu đề án (nguồn thứ cấp). */
  nguonThuCap: boolean;
  /** Dữ liệu chưa thẩm định độc lập hoặc nguồn thứ cấp: chỉ là tham chiếu. */
  laThamChieu: boolean;
  /** Có thể hiện dự báo khoảng điểm hay không. */
  duocDuBao: boolean;
  /** Dữ liệu đã cũ so với năm dự báo (cách từ 2 năm trở lên). */
  loiThoi: boolean;
  /** Dự báo (khi `duocDuBao`). */
  duBao: DuBaoDiemChuan | null;
  /** Các năm nguồn xác định là điểm sàn, bị loại khỏi lịch sử điểm chuẩn. */
  cacNamSan?: number[];
  /** G: dữ liệu ghi mã trường/ngành khác nhau giữa các năm; chỉ giữ các năm cùng mã với năm mới nhất, không ghép lịch sử khác mã. */
  doiMa?: boolean;
  /** G: các năm bị bỏ vì khác mã với năm mới nhất. */
  cacNamBoQuaDoiMa?: number[];
  /** E: chương trình mới mở (chỉ khi dữ liệu có `namBatDauTuyenSinh`), chưa có lịch sử. Không đoán từ việc thiếu điểm. */
  chuongTrinhMoi?: boolean;
  /** H: dự báo dựa trên điểm cách năm dự báo đúng 2 năm (khoảng đã nở rộng), nên chỉ để tham khảo. */
  duBaoCu?: boolean;
  /** H: đã có điểm chuẩn của chính năm dự báo hoặc muộn hơn, không cần (và không được) dự báo. */
  daCoDiemNamDuBao?: boolean;
  /** H: điểm mới nhất cách năm dự báo quá xa nên không đưa dự báo. */
  duBaoQuaXa?: boolean;
}

const laDiemHopLe = (d: unknown): d is number => typeof d === "number" && Number.isFinite(d) && d >= 10 && d <= 30;
const laThpt = (lc: Pick<LuaChon, "phuongThuc">) => !lc.phuongThuc || lc.phuongThuc === "THPT";

/** Mọi cặp (năm, điểm) hợp lệ về thang, kể cả mức sàn, tăng dần theo năm. Chưa lọc sàn hay đổi mã. */
function cacDiemTho(lc: Pick<LuaChon, "diemTheoNam" | "diemMin" | "namDiem">): [number, number][] {
  const tuBang = Object.entries(lc.diemTheoNam ?? {}).map(([n, d]) => [Number(n), d] as [number, number]).filter(([n, d]) => Number.isInteger(n) && laDiemHopLe(d));
  if (tuBang.length) return tuBang.sort((a, b) => a[0] - b[0]);
  return lc.namDiem && laDiemHopLe(lc.diemMin) ? [[lc.namDiem, lc.diemMin]] : [];
}

const maCuaNam = (lc: Pick<LuaChon, "maTheoNam" | "maTruong">, nam: number): string | null => {
  const m = lc.maTheoNam?.[String(nam)];
  return m ? `${m.maTruong ?? lc.maTruong ?? ""}|${m.maNganh ?? ""}` : null;
};

/** Không suy loại điểm từ trị số. Dữ liệu cũ thiếu chứng cứ chỉ là số tham khảo chưa kiểm chứng. */
export function cacDiemHopLe(lc: LuaChon): [number, number][] {
  const tho = cacDiemTho(lc);
  return laThpt(lc) ? tho.filter(([n]) => !["diem_san", "du_kien", "chua_ro"].includes(loaiDiemCuaNam(lc, n) ?? "")) : tho;
}

/** Phân loại dữ liệu của một chương trình. `tk` và `namDuBao` cho phép tính dự báo cùng lúc (tuỳ chọn). */
export function phanLoaiDuLieu(lc: LuaChon, tk?: ThongKeBienDong, namDuBao?: number): TrangThaiDuLieu {
  const tho = cacDiemTho(lc);
  const khac = !!lc.phuongThuc && lc.phuongThuc !== "THPT";
  const nguonThuCap = lc.nguonCap === "aggregator_verified";
  const mkBase = (dsDiem: [number, number][]) => {
    const cacNam = dsDiem.map(([n]) => n);
    const namCuoi = cacNam.length ? cacNam[cacNam.length - 1] : null;
    return { cacNam, namCuoi, nguonThuCap, laThamChieu: namCuoi !== null && (nguonThuCap || lc.daKiemChung !== true) };
  };
  const trong = { diemCuoi: null, duocDuBao: false, loiThoi: false, duBao: null };

  if (tho.length === 0) {
    const moi = lc.namBatDauTuyenSinh !== undefined && lc.namBatDauTuyenSinh >= (namDuBao ?? namTuyenSinhToi()) - 1;
    return { ...mkBase([]), loai: "khongDu", ...trong, ...(moi ? { chuongTrinhMoi: true } : {}) };
  }
  if (khac) return { ...mkBase(tho), loai: "phuongThucKhac", ...trong };

  // G: đổi mã giữa các năm thì chỉ giữ các năm cùng mã với năm mới nhất. Không có dữ liệu mã từng năm thì không suy đoán.
  const maMoi = maCuaNam(lc, tho[tho.length - 1][0]);
  const khacMa = maMoi === null ? [] : tho.filter(([n]) => { const m = maCuaNam(lc, n); return m !== null && m !== maMoi; }).map(([n]) => n);
  const cungMa = tho.filter(([n]) => !khacMa.includes(n));
  const cacNamSan = cungMa.filter(([n]) => loaiDiemCuaNam(lc, n) === "diem_san").map(([n]) => n);
  const diem = cungMa.filter(([n]) => !["diem_san", "du_kien", "chua_ro"].includes(loaiDiemCuaNam(lc, n) ?? ""));
  const phu = { ...(khacMa.length ? { doiMa: true, cacNamBoQuaDoiMa: khacMa } : {}), ...(cacNamSan.length ? { cacNamSan } : {}) };

  if (diem.length === 0) return { ...mkBase(cungMa), loai: cacNamSan.length === cungMa.length ? "chiDiemSan" : "khongDu", ...trong, ...phu };

  const base = mkBase(diem);
  const namCuoi = base.namCuoi as number, diemMoi = diem[diem.length - 1][1];
  // Đổi mã giữa các năm: không dự báo (lịch sử không liền mạch). Điểm sàn đã bị `duBaoDiemChuan` bỏ riêng.
  const duBao = tk && namDuBao && khacMa.length === 0 ? duBaoDiemChuan(lc, tk, namDuBao) : null;
  const cach = namDuBao !== undefined ? namDuBao - namCuoi : null;
  const flagH = cach === null ? {} : { daCoDiemNamDuBao: cach < 1, duBaoQuaXa: cach > TOI_DA_NAM_XA, duBaoCu: duBao !== null && cach >= 2 };
  return { ...base, ...phu, ...flagH, loai: diem.length >= 2 ? "nhieuNam" : "motNam", diemCuoi: diemMoi, duocDuBao: duBao !== null, loiThoi: cach !== null && cach >= 2, duBao };
}

/** Điểm chuẩn gần nhất được phép đem so với điểm thi THPT của em; null nếu không (điểm sàn, phương thức khác, không có). */
export const diemChuanDeSo = (lc: LuaChon): number | null => phanLoaiDuLieu(lc).diemCuoi;

/** Lý do (câu ngắn cho người đọc) khi KHÔNG được đem điểm chuẩn của chương trình so với điểm thi THPT của em; null nếu so được. */
export function lyDoKhongSoDuoc(lc: LuaChon): string | null {
  const t = phanLoaiDuLieu(lc);
  if (t.loai === "nhieuNam" || t.loai === "motNam") return null;
  return GIAI_THICH_TRANG_THAI[t.loai];
}

/** Chỉ có id mới xác định "cùng một chương trình". Hai chương trình chỉ giống tên không bao giờ được ghép lịch sử. */
export const cungChuongTrinh = (a: Pick<LuaChon, "id">, b: Pick<LuaChon, "id">): boolean => a.id === b.id;

export interface KetQuaRaSoatMa {
  /** Cùng tên trường nhưng khác mã trường (có thể là đổi mã). */
  cungTenKhacMaTruong: string[];
  /** Cùng mã trường nhưng tên trường khác nhau. */
  cungMaKhacTenTruong: string[];
  /** Cùng (mã trường, tên ngành, phương thức) nhưng nhiều id: là các chương trình riêng, lịch sử giữ riêng theo id. */
  trungTenKhacId: string[];
}

/** Rà dữ liệu để phát hiện nguy cơ ghép nhầm lịch sử giữa các mã. Chỉ báo cáo, không tự gộp. */
export function raSoatMaChuongTrinh(ds: readonly LuaChon[]): KetQuaRaSoatMa {
  const theoTen = new Map<string, Set<string>>(), theoMa = new Map<string, Set<string>>(), theoKhoa = new Map<string, number>();
  for (const l of ds) {
    const ma = l.maTruong ?? "";
    (theoTen.get(l.truong) ?? theoTen.set(l.truong, new Set()).get(l.truong)!).add(ma);
    (theoMa.get(ma) ?? theoMa.set(ma, new Set()).get(ma)!).add(l.truong);
    const k = `${ma}|${l.nganh}|${l.phuongThuc ?? "THPT"}`;
    theoKhoa.set(k, (theoKhoa.get(k) ?? 0) + 1);
  }
  return {
    cungTenKhacMaTruong: [...theoTen].filter(([, s]) => s.size > 1).map(([t]) => t),
    cungMaKhacTenTruong: [...theoMa].filter(([m, s]) => m !== "" && s.size > 1).map(([m]) => m),
    trungTenKhacId: [...theoKhoa].filter(([, n]) => n > 1).map(([k]) => k),
  };
}
