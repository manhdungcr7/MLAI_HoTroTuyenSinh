// Danh mục lựa chọn thật, sinh từ du-lieu-that.json (xuất bằng scripts/xuat-du-lieu-that.py từ pipeline trong legacy/).
// Chỉ có số liệu đo được từ đề án: điểm chuẩn từng năm, tổ hợp, tỉnh, nguồn. Học phí, địa chỉ, môi trường học không có thì để trống.
import raw from "./du-lieu-that.json";
import type { LuaChon, NguonNam, ToneTen } from "@/state/types";
import nguonNam from "./nguon-nam.json";

interface Dong {
  id: string; ma: string; truong: string; nganh: string; nhom: string; tinh: string; pt: string;
  toHop: string[]; diem: Record<string, number>; dk: number | null; viec: number | null; nguon: string | null; tier: string | null;
}

const TEN_PT: Record<string, string> = {
  THPT: "Điểm thi tốt nghiệp THPT", HOC_BA: "Học bạ THPT", DGNL_HCM: "ĐGNL ĐHQG TP.HCM", DGNL_HN: "ĐGNL ĐHQG Hà Nội",
  DGNL_KHAC: "Đánh giá năng lực (khác)", DGTD: "Đánh giá tư duy", KET_HOP: "Kết hợp nhiều tiêu chí", NANG_KHIEU: "Có thi năng khiếu",
};
const TONES: ToneTen[] = ["xanh", "luc", "cam", "tim", "do"];
const toneCua = (ma: string): ToneTen => TONES[[...ma].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];

const viecLam = (rate: number | null): LuaChon["coHoiViecLam"] => (rate === null ? undefined : rate >= 0.95 ? "Rất cao" : rate >= 0.85 ? "Cao" : "Khá");

const NGUON_THEO_NAM = nguonNam as Record<string, NguonNam[]>;

function chuyen(d: Dong): LuaChon {
  const nam = Object.keys(d.diem).sort();
  const moiNhat = nam[nam.length - 1];
  const haiNam = nam.slice(-2).map((n) => d.diem[n]);
  const luuY: string[] = [];
  if (nam.length === 1) luuY.push(`Mới có điểm chuẩn của một năm (${moiNhat}), độ tin cậy còn thấp.`);
  if (d.tier === "aggregator_verified") luuY.push("Điểm lấy từ trang tổng hợp, chưa đối chiếu với đề án của trường.");
  if (d.pt !== "THPT") luuY.push(`Điểm chuẩn này thuộc phương thức "${TEN_PT[d.pt] ?? d.pt}", không phải điểm thi tốt nghiệp.`);
  return {
    id: d.id,
    truong: d.ma,
    tenTruong: d.truong,
    nganh: d.nganh,
    nhomNganh: d.nhom,
    moTa: `${TEN_PT[d.pt] ?? d.pt}${d.toHop.length ? ` · Tổ hợp ${d.toHop.slice(0, 6).join(", ")}${d.toHop.length > 6 ? "…" : ""}` : ""}`,
    bac: "Đại học",
    khuVuc: d.tinh,
    diemMin: Math.min(...haiNam),
    diemMax: Math.max(...haiNam),
    namDiem: Number(moiNhat),
    coHoiViecLam: viecLam(d.viec),
    tone: toneCua(d.ma),
    lyDoPhuHop: [],
    canLuuY: luuY,
    nguon: d.tier === "official_pdf" ? "Đề án tuyển sinh chính thức của trường (file PDF)" : "Bảng điểm chuẩn trên trang tổng hợp tuyensinh247 (nguồn thứ cấp)",
    daKiemChung: d.tier === "official_pdf",
    linkNguon: d.nguon ?? undefined,
    maTruong: d.ma,
    phuongThuc: d.pt,
    toHopXet: d.toHop,
    diemTheoNam: d.diem,
    diemDuKien: d.dk,
    nguonCap: d.tier === "official_pdf" ? "official_pdf" : "aggregator_verified",
    nguonTheoNam: NGUON_THEO_NAM[d.id],
  };
}

export const LUA_CHON: LuaChon[] = (raw as unknown as Dong[]).map(chuyen);
const THEO_ID = new Map(LUA_CHON.map((l) => [l.id, l]));
export const timLuaChon = (id: string): LuaChon | undefined => THEO_ID.get(id);

/** Vài lựa chọn CNTT ở TP.HCM có điểm nhiều năm, dùng cho hồ sơ mẫu "Minh Anh". Lấy theo dữ liệu, không gõ tay mã. */
export function idHoSoMau(): string[] {
  return LUA_CHON
    .filter((l) => l.nhomNganh === "CNTT" && l.khuVuc === "TP.HCM" && l.phuongThuc === "THPT" && Object.keys(l.diemTheoNam ?? {}).length >= 2)
    .sort((a, b) => b.diemMin - a.diemMin)
    .slice(0, 6)
    .map((l) => l.id);
}
