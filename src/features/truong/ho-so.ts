// Dựng dữ liệu hồ sơ một trường từ các chương trình có thật. TypeScript thuần, không React.
// Nguyên tắc: thiếu thì ghi "chưa có", không suy ra số; điểm khác thang không đặt chung một thang.
import type { LuaChon } from "@/state/types";
import { coHocPhi, hocPhiChu } from "@/data/lua-chon-phu";
import { DIEM_SAN_XET_TUYEN } from "@/engine/trang-thai-du-lieu";
import { coSoCuaChuongTrinh, coTruong, tenTruong, tinhCuaTruong } from "@/engine/truong";

export const CHUA_CO = "Chưa có dữ liệu xác minh";

export const TEN_PHUONG_THUC: Record<string, string> = {
  THPT: "Điểm thi tốt nghiệp THPT", HOC_BA: "Học bạ THPT", DGNL_HCM: "ĐGNL ĐHQG TP.HCM", DGNL_HN: "ĐGNL ĐHQG Hà Nội",
  DGNL_KHAC: "Đánh giá năng lực (khác)", DGTD: "Đánh giá tư duy", KET_HOP: "Kết hợp nhiều tiêu chí", NANG_KHIEU: "Có thi năng khiếu",
};

/** Thang điểm của từng phương thức; phương thức chưa rõ thang thì không gắn thang. */
export function thangDiem(pt?: string): string | null {
  if (pt === "THPT" || pt === "HOC_BA" || pt === "KET_HOP" || pt === "NANG_KHIEU") return "thang 30";
  if (pt === "DGNL_HCM") return "thang 1.200";
  if (pt === "DGNL_HN") return "thang 150";
  return null;
}

export interface DongChuongTrinh {
  id: string;
  phuongThuc: string; // nhãn đã dịch
  ptMa: string;
  thang: string | null;
  nam: string | null; // năm mới nhất có điểm
  diem: number | null;
  theoNam: [string, number][]; // mới nhất trước; điểm THPT đúng mức sàn 15,0 không nằm ở đây
  /** Chỉ có mức sàn xét tuyển (15,0), không phải điểm chuẩn: năm mới nhất ở mức sàn. */
  diemSan: { nam: string; diem: number } | null;
  nguonDiem: "chinh-thuc" | "tong-hop";
  nhanNguon: string;
  toHop: string[] | null; // null = chưa ghi
  hocPhi: string | null; // đã định dạng, null = chưa có
  hocPhiGhiChu: string | null;
}

export interface NganhHoSo { khoa: string; ten: string; coSo: string | null; dong: DongChuongTrinh[] }

export interface HoSoTruong {
  ma: string;
  ten: string;
  tinh: string[];
  coSo: string[];
  bac: string[];
  loaiHinh: string; // dữ liệu chưa có phân loại công lập/tư thục
  soChuongTrinh: number;
  nganh: NganhHoSo[];
  phuongThuc: string[];
  toHop: string[];
  linkDeAn: { nam: string; url: string }[];
}

export const nhanNguonDiem = (cap?: LuaChon["nguonCap"]): { loai: DongChuongTrinh["nguonDiem"]; nhan: string } =>
  cap === "official_pdf" ? { loai: "chinh-thuc", nhan: "Đề án chính thức của trường" } : { loai: "tong-hop", nhan: "Từ trang tổng hợp, chưa phải văn bản của trường" };

export function hocPhiDayDu(l: Pick<LuaChon, "hocPhiMin" | "hocPhiMax" | "hocPhiUocTinh" | "nguonHocPhi">): string | null {
  if (!coHocPhi(l)) return null;
  const so = hocPhiChu(l).replace(/\./g, ",");
  return `${so} triệu đồng/năm${l.nguonHocPhi?.nam ? ` (đề án ${l.nguonHocPhi.nam})` : l.hocPhiUocTinh ? " (ước tính)" : ""}`;
}

function dongTu(l: LuaChon): DongChuongTrinh {
  const tho = Object.entries(l.diemTheoNam ?? {}).filter(([, d]) => typeof d === "number" && Number.isFinite(d)).sort((a, b) => b[0].localeCompare(a[0]));
  // Điểm THPT đúng bằng mức sàn 15,0 không phải điểm chuẩn (cùng luật với engine/trang-thai-du-lieu). Phương thức khác giữ thang riêng.
  const laThpt = !l.phuongThuc || l.phuongThuc === "THPT";
  const theoNam = laThpt ? tho.filter(([, d]) => d !== DIEM_SAN_XET_TUYEN) : tho;
  const san = laThpt ? tho.find(([, d]) => d === DIEM_SAN_XET_TUYEN) : undefined;
  const ng = nhanNguonDiem(l.nguonCap);
  const pt = l.phuongThuc ?? "";
  const hp = hocPhiDayDu(l);
  return {
    id: l.id,
    ptMa: pt,
    phuongThuc: pt ? TEN_PHUONG_THUC[pt] ?? pt : CHUA_CO,
    thang: thangDiem(pt),
    nam: theoNam[0]?.[0] ?? null,
    diem: theoNam[0]?.[1] ?? null,
    theoNam,
    diemSan: theoNam.length === 0 && san ? { nam: san[0], diem: san[1] } : null,
    nguonDiem: ng.loai,
    nhanNguon: ng.nhan,
    toHop: l.toHopXet && l.toHopXet.length > 0 ? l.toHopXet : null,
    hocPhi: hp,
    hocPhiGhiChu: hp ? null : null,
  };
}

/** Mã không có trong danh mục -> null (màn hình hiện trạng thái lỗi). Có mã nhưng không có chương trình -> hồ sơ rỗng (trạng thái trống). */
export function dungHoSoTruong(ma: string, dsLuaChon: readonly LuaChon[], deAn?: { nam: string; url: string }[]): HoSoTruong | null {
  if (!coTruong(ma)) return null;
  const cua = dsLuaChon.filter((l) => l.maTruong === ma || l.truong === ma);
  const nhom = new Map<string, NganhHoSo>();
  const coSo = new Set<string>();
  for (const l of cua) {
    const { nganh, coSo: cs } = coSoCuaChuongTrinh(l.nganh);
    if (cs) coSo.add(cs);
    const khoa = `${nganh}|${cs ?? ""}`;
    const n = nhom.get(khoa) ?? { khoa, ten: nganh, coSo: cs, dong: [] };
    n.dong.push(dongTu(l));
    nhom.set(khoa, n);
  }
  const nganh = [...nhom.values()].sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  const dong = nganh.flatMap((n) => n.dong);
  const duy = <T,>(xs: T[]) => [...new Set(xs)];
  return {
    ma,
    ten: tenTruong(ma) ?? ma,
    tinh: tinhCuaTruong(ma),
    coSo: [...coSo].sort((a, b) => a.localeCompare(b, "vi")),
    bac: duy(cua.map((l) => l.bac)),
    loaiHinh: CHUA_CO,
    soChuongTrinh: cua.length,
    nganh,
    phuongThuc: duy(dong.map((d) => d.phuongThuc).filter((x) => x !== CHUA_CO)),
    toHop: duy(dong.flatMap((d) => d.toHop ?? [])).sort(),
    linkDeAn: (deAn ?? []).filter((d) => /^https?:\/\//.test(d.url)).sort((a, b) => b.nam.localeCompare(a.nam)),
  };
}

/** Điểm một dòng: "26,35 (2025, thang 30)" hoặc "Chưa có dữ liệu xác minh". Mỗi điểm luôn đi kèm thang của chính nó. */
export function diemGhiThang(d: DongChuongTrinh, dinhDang: (n: number) => string): string {
  if (d.diem === null || d.nam === null) return CHUA_CO;
  return `${dinhDang(d.diem)} (${d.nam}${d.thang ? `, ${d.thang}` : ", thang riêng của phương thức"})`;
}
