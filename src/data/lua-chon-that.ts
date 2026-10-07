// Danh mục lựa chọn thật, sinh từ du-lieu-that.json (xuất bằng scripts/xuat-du-lieu-that.py từ pipeline trong legacy/).
// Chỉ có số liệu đo được từ đề án: điểm chuẩn từng năm, tổ hợp, tỉnh, nguồn. Học phí, địa chỉ, môi trường học không có thì để trống.
import raw from "./du-lieu-that.json";
import viecLamMoi from "./viec-lam.json"; // tỷ lệ có việc làm trích thêm từ đề án (scripts/trich-viec-lam.py), chỉ bổ sung ngành chưa có
import hocPhi from "./hoc-phi.json"; // học phí theo năm trích từ đề án (scripts/trich-hoc-phi.py), chỉ vài chục ngành
import type { LuaChon, MonKhoi, NguonNam, ToneTen } from "@/state/types";
import { TEN_PHUONG_THUC as TEN_PT, nhanNguyenVong } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";

interface Dong {
  id: string; ma: string; truong: string; nganh: string; nhom: string; tinh: string; pt: string;
  toHop: string[]; diem: Record<string, number>; dk: number | null; viec: number | null; nguon: string | null; tier: string | null;
}

const TONES: ToneTen[] = ["xanh", "luc", "cam", "tim", "do"];
const toneCua = (ma: string): ToneTen => TONES[[...ma].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];

// `viec` là phần trăm (71–100), không phải tỉ lệ 0–1.
const viecLam = (phanTram: number | null): LuaChon["coHoiViecLam"] => (phanTram === null ? undefined : phanTram >= 95 ? "Rất cao" : phanTram >= 85 ? "Cao" : "Khá");

const khongDau = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// Phần đứng trước " - " chỉ là loại chương trình (không phải tên ngành): hiện tên ngành, giữ phần kia ở dòng mô tả.
const TIEN_TO_CHUNG = /^(CT chuẩn|Chuẩn QT|Đại học chính quy|Khoa học giáo dục và đào tạo giáo viên|Chương trình GD Mầm non|Chương trình GD [^-]+)$/i;

/** Tên ngành gọn cho người đọc; phần bỏ đi (nếu có) trả ở `them`. Không đổi nghĩa: chỉ bỏ chữ lặp và nhãn loại chương trình. */
export function tenGon(goc: string): { ten: string; them?: string } {
  let t = goc.replace(/^Chương trình đào tạo (ngành )?/i, "").trim();
  const cat: number[] = [];
  for (let i = t.indexOf(" - "); i >= 0; i = t.indexOf(" - ", i + 1)) cat.push(i);
  for (const i of cat) {
    const trai = t.slice(0, i).trim(), phai = t.slice(i + 3).trim();
    if (khongDau(trai) === khongDau(phai) || khongDau(trai).startsWith(khongDau(phai) + " ")) return { ten: trai }; // "X (CT tiên tiến) - X" -> "X (CT tiên tiến)"
    if (TIEN_TO_CHUNG.test(trai)) return { ten: phai, them: trai };
  }
  return { ten: t };
}

const HOC_PHI = hocPhi as Record<string, { trieuNam: number; nam: string; trang: number; url: string }>;

const VIEC_MOI = viecLamMoi as Record<string, { phanTram: number; nam: string; trang: number; url: string }>;

function chuyen(d: Dong): LuaChon {
  const hp = HOC_PHI[d.id];
  const vm = d.viec === null ? VIEC_MOI[d.id] : undefined;
  const viec = d.viec ?? vm?.phanTram ?? null;
  const gon = tenGon(d.nganh);
  const laCaoDang = /cao đẳng/i.test(d.nganh) || /cao đẳng/i.test(d.truong);
  const nam = Object.keys(d.diem).sort();
  const moiNhat = nam[nam.length - 1];
  const diemMoiNhat = d.diem[moiNhat]; // mọi nhãn, mục tiêu và chữ hiển thị đều dựa vào điểm của đúng năm này (namDiem)
  const luuY: string[] = [];
  if (nam.length === 1) luuY.push(`Mới có điểm chuẩn của một năm (${moiNhat}), độ tin cậy còn thấp.`);
  if (d.tier === "aggregator_verified") luuY.push("Điểm lấy từ trang tổng hợp, chưa đối chiếu với đề án của trường.");
  if (d.pt !== "THPT") luuY.push(`Điểm chuẩn này thuộc phương thức "${TEN_PT[d.pt] ?? d.pt}", không phải điểm thi tốt nghiệp.`);
  return {
    id: d.id,
    truong: d.ma,
    tenTruong: d.truong,
    nganh: gon.ten,
    nhomNganh: d.nhom,
    moTa: `${TEN_PT[d.pt] ?? d.pt}${d.toHop.length ? ` · Tổ hợp ${d.toHop.slice(0, 6).join(", ")}${d.toHop.length > 6 ? "…" : ""}` : ""}${gon.them ? ` · ${gon.them}` : ""}`,
    bac: laCaoDang ? "Cao đẳng" : "Đại học",
    khuVuc: d.tinh,
    diemMin: diemMoiNhat,
    diemMax: diemMoiNhat, // một năm duy nhất; các năm khác xem ở diemTheoNam
    namDiem: Number(moiNhat),
    coHoiViecLam: viecLam(viec),
    ...(viec !== null ? { tiLeViecLam: viec } : {}),
    ...(vm ? { nguonViecLam: { nam: vm.nam, url: vm.url, trang: vm.trang } } : {}),
    tone: toneCua(d.ma),
    lyDoPhuHop: [],
    canLuuY: luuY,
    nguon: d.tier === "official_pdf" ? "Đề án tuyển sinh chính thức của trường (file PDF)" : "Bảng điểm chuẩn trên trang tổng hợp tuyensinh247 (nguồn thứ cấp)",
    daKiemChung: d.tier === "official_pdf",
    linkNguon: d.nguon ?? undefined,
    ...(hp ? { hocPhiMin: hp.trieuNam, hocPhiMax: hp.trieuNam, nguonHocPhi: { nam: hp.nam, url: hp.url, trang: hp.trang } } : {}),
    maTruong: d.ma,
    phuongThuc: d.pt,
    toHopXet: d.toHop,
    diemTheoNam: d.diem,
    diemDuKien: d.dk,
    nguonCap: d.tier === "official_pdf" ? "official_pdf" : "aggregator_verified",
  };
}

export const LUA_CHON: LuaChon[] = (raw as unknown as Dong[]).map(chuyen);
const THEO_ID = new Map(LUA_CHON.map((l) => [l.id, l]));
/** Liên kết tới đề án từng năm (file lớn, chỉ tải khi mở trang chi tiết). */
export interface DeAnTruong { docs: { nam: string; url: string }[]; hocPhi?: { nam: string; url: string; trang: number } }
export interface TrangNganh { url: string; tieuDe: string }
export interface NguonTaiSau {
  nam: Record<string, NguonNam[]>; // id chương trình -> liên kết điểm chuẩn từng năm
  truong: Record<string, DeAnTruong>; // mã trường -> đề án các năm và trang học phí
  nganh: Record<string, TrangNganh>; // id chương trình -> trang của ngành trên website trường
  truongNganh: Record<string, TrangNganh>; // mã trường -> trang danh sách ngành / chương trình đào tạo của trường (khi chưa có trang riêng của ngành)
}
export const taiNguon = async (): Promise<NguonTaiSau> => {
  const [nam, truong, nganh, namTC, truongTC, truongNganh] = await Promise.all([
    import("./nguon-nam.json"), import("./de-an-truong.json"), import("./chuong-trinh.json"),
    import("./nguon-nam-thu-cap.json"), import("./de-an-truong-thu-cap.json"), import("./trang-nganh-truong.json"), // trường chỉ có điểm từ trang tổng hợp: đề án của trường và các điểm khớp được
  ]);
  return {
    nam: { ...(nam.default as unknown as NguonTaiSau["nam"]), ...(namTC.default as unknown as NguonTaiSau["nam"]) },
    truong: { ...(truong.default as unknown as NguonTaiSau["truong"]), ...(truongTC.default as unknown as NguonTaiSau["truong"]) },
    nganh: nganh.default as unknown as NguonTaiSau["nganh"],
    truongNganh: truongNganh.default as unknown as NguonTaiSau["truongNganh"],
  };
};

export const timLuaChon = (id: string): LuaChon | undefined => THEO_ID.get(id);

/**
 * Danh sách nguyện vọng cho hồ sơ mẫu "Minh Anh": ngành CNTT ở TP.HCM, chọn theo nhãn tính từ chính điểm mẫu
 * (1 Thử sức, 2 Vừa sức, 1 An toàn, 1 Dự phòng) để màn Nguyện vọng có đủ các nhóm. Lấy theo dữ liệu, không gõ tay mã.
 */
export function idHoSoMau(diem: Partial<Record<MonKhoi, number | null>>): string[] {
  const ung = LUA_CHON.filter((l) => l.nhomNganh === "CNTT" && l.khuVuc === "TP.HCM" && l.phuongThuc === "THPT" && Object.keys(l.diemTheoNam ?? {}).length >= 2)
    .map((l) => ({ l, tong: tongChoLuaChon(l, diem).tong }))
    .filter((x): x is { l: LuaChon; tong: number } => x.tong !== null)
    .map((x) => ({ ...x, nhan: nhanNguyenVong(x.l, x.tong) }))
    .sort((a, b) => b.l.diemMin - a.l.diemMin);
  const chon: LuaChon[] = [];
  for (const nhan of ["Thử sức", "Vừa sức", "Vừa sức", "An toàn", "Dự phòng"] as const) {
    const x = ung.find((u) => u.nhan === nhan && !chon.includes(u.l) && !chon.some((c) => c.truong === u.l.truong && c.nganh === u.l.nganh));
    if (x) chon.push(x.l);
  }
  return chon.map((l) => l.id);
}
