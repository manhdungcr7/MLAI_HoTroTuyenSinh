// Danh mục lựa chọn thật, sinh từ du-lieu-that.json (xuất bằng scripts/xuat-du-lieu-that.py từ pipeline trong legacy/).
// Chỉ có số liệu đo được từ đề án: điểm chuẩn từng năm, tổ hợp, tỉnh, nguồn. Học phí, địa chỉ, môi trường học không có thì để trống.
// Ba tệp JSON (~2,7 MB) KHÔNG import tĩnh: chúng nạp lười qua `napLuaChon()` để màn đầu (chào, bắt đầu, giới thiệu) mở ngay.
// du-lieu-that.json: danh mục; viec-lam.json: tỷ lệ có việc làm trích thêm từ đề án (scripts/trich-viec-lam.py), chỉ bổ sung ngành chưa có;
// hoc-phi.json: học phí theo năm trích từ đề án (scripts/trich-hoc-phi.py), chỉ vài chục ngành.
import type { LuaChon, MonKhoi, NguonNam, ToneTen } from "@/state/types";
import { TEN_PHUONG_THUC as TEN_PT, lyDoKhacPhuongThuc, nhanNguyenVong } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { laHocPhiDaKiemChung, type HocPhiNguon } from "./hoc-phi-kiem-chung";

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
  let t = goc.replace(/^Chương trình đào tạo (ngành )?/i, "")
    .replace(/^\(\d+\)\s+/, "") // "(1) Tài chính": số thứ tự còn sót khi trích PDF của NEU
    .trim();
  const cat: number[] = [];
  for (let i = t.indexOf(" - "); i >= 0; i = t.indexOf(" - ", i + 1)) cat.push(i);
  for (const i of cat) {
    const trai = t.slice(0, i).trim(), phai = t.slice(i + 3).trim();
    if (khongDau(trai) === khongDau(phai) || khongDau(trai).startsWith(khongDau(phai) + " ")) return { ten: trai }; // "X (CT tiên tiến) - X" -> "X (CT tiên tiến)"
    if (TIEN_TO_CHUNG.test(trai)) return { ten: phai, them: trai };
  }
  return { ten: t };
}

// Tệp vẫn có thể chứa ứng viên/chứng cứ chưa đủ; chỉ `laHocPhiDaKiemChung` mới được đưa vào LuaChon.
type HocPhiTep = Record<string, HocPhiNguon>;
type ViecMoiTep = Record<string, { phanTram: number; nam: string; trang: number; url: string }>;
let HOC_PHI: HocPhiTep = {};
// hoc-phi-vnexpress.json: học phí theo bảng VnExpress (nguồn thứ cấp, scripts/hoc-phi-vnexpress.py): [thấp, cao, năm, đường dẫn]; chỉ dùng khi chưa có học phí từ văn bản sơ cấp.
let HOC_PHI_VN: Record<string, [number, number, string, string]> = {};
let VIEC_MOI: ViecMoiTep = {};
type ChiTieuTep = Record<string, { chiTieu: number; nam: string; url: string; trang: number }>;
let CHI_TIEU: ChiTieuTep = {};

function chuyen(d: Dong): LuaChon {
  const hpUngVien = HOC_PHI[d.id];
  const hp = laHocPhiDaKiemChung(hpUngVien) ? hpUngVien : undefined;
  const hv = hp ? undefined : HOC_PHI_VN[d.id];
  const vm = d.viec === null ? VIEC_MOI[d.id] : undefined;
  const viec = d.viec ?? vm?.phanTram ?? null;
  const gon = tenGon(d.nganh);
  const laCaoDang = /cao đẳng/i.test(d.nganh) || /cao đẳng/i.test(d.truong);
  const nam = Object.keys(d.diem).sort();
  // THPT: năm mới nhất mà điểm là điểm chuẩn thật; điểm đúng 15,0 là điểm sàn nên không làm "điểm chuẩn gần nhất" khi còn năm khác.
  const khongSan = d.pt === "THPT" ? nam.filter((n) => d.diem[n] !== 15) : nam;
  const moiNhat = (khongSan.length ? khongSan : nam)[(khongSan.length ? khongSan : nam).length - 1];
  const diemMoiNhat = d.diem[moiNhat]; // mọi nhãn, mục tiêu và chữ hiển thị đều dựa vào điểm của đúng năm này (namDiem)
  const luuY: string[] = [];
  if (nam.length === 1) luuY.push(`Mới có điểm chuẩn của một năm (${moiNhat}), độ tin cậy còn thấp.`);
  if (d.tier === "aggregator_verified") luuY.push("Điểm lấy từ trang tổng hợp, chưa đối chiếu với đề án của trường.");
  if (d.pt !== "THPT") {
    luuY.push(`Điểm chuẩn này thuộc phương thức "${TEN_PT[d.pt] ?? d.pt}", không phải điểm thi tốt nghiệp.`);
    if (diemMoiNhat <= 30) {
      luuY.push("Điểm chuẩn hiển thị theo thang 30 (đã quy đổi từ điểm ĐGNL/ĐGTD theo công thức của trường).");
    }
  }
  if (d.pt === "THPT" && diemMoiNhat === 15) {
    luuY.push("Mức 15,0 điểm là điểm sàn xét tuyển chuẩn của trường đối với phương thức này.");
  }
  if (moiNhat === "2026" && d.tier === "aggregator_verified") {
    luuY.push("Điểm 2026 từ trang tổng hợp mang tính tham chiếu / dự kiến công bố.");
  }
  return {
    id: d.id,
    truong: d.truong,
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
    daKiemChung: false,
    linkNguon: d.nguon ?? undefined,
    ...(hp ? { hocPhiMin: hp.trieuNam, hocPhiMax: hp.trieuNam, nguonHocPhi: { nam: hp.nam, url: hp.url, trang: hp.trang ?? 0 } } : {}),
    ...(hv ? { hocPhiMin: hv[0], hocPhiMax: hv[1], nguonHocPhi: { nam: hv[2], url: `https://diemthi.vnexpress.net${hv[3]}`, trang: 0, thuCap: true } } : {}),
    ...(CHI_TIEU[d.id] ? { chiTieu: { so: CHI_TIEU[d.id].chiTieu, nam: CHI_TIEU[d.id].nam, url: CHI_TIEU[d.id].url, trang: CHI_TIEU[d.id].trang } } : {}),
    maTruong: d.ma,
    phuongThuc: d.pt,
    toHopXet: d.toHop,
    diemTheoNam: d.diem,
    diemDuKien: d.dk,
    nguonCap: d.tier === "official_pdf" ? "official_pdf" : "aggregator_verified",
  };
}

/**
 * Danh mục gốc. RỖNG cho đến khi `napLuaChon()` xong; được điền TẠI CHỖ (cùng một mảng) nên các tham chiếu giữ trước đó vẫn đúng.
 * Màn cần dữ liệu phải chờ `napLuaChon()` / `daNapLuaChon()` (xem `useDuLieuSan`, `trang()` ở routes-type); test thì `await napLuaChon()`.
 */
export const LUA_CHON: LuaChon[] = [];
let THEO_ID = new Map<string, LuaChon>();
let dangNap: Promise<void> | null = null;
export const daNapLuaChon = (): boolean => LUA_CHON.length > 0;
/** Nạp danh mục gốc một lần (gọi nhiều lần vẫn một lần tải). Lỗi mạng thì lần gọi sau thử lại. */
export function napLuaChon(): Promise<void> {
  dangNap ??= (async () => {
    const [raw, viec, hp, hpVn, ct] = await Promise.all([import("./du-lieu-that.json"), import("./viec-lam.json"), import("./hoc-phi.json"), import("./hoc-phi-vnexpress.json"), import("./chi-tieu.json")]);
    CHI_TIEU = ct.default as unknown as ChiTieuTep;
    VIEC_MOI = viec.default as unknown as ViecMoiTep;
    HOC_PHI = hp.default as unknown as HocPhiTep;
    HOC_PHI_VN = hpVn.default as unknown as typeof HOC_PHI_VN;
    LUA_CHON.splice(0, LUA_CHON.length, ...(raw.default as unknown as Dong[]).map(chuyen));
    THEO_ID = new Map(LUA_CHON.map((l) => [l.id, l]));
  })().catch((e) => { dangNap = null; throw e; });
  return dangNap;
}
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

/** Khoảng cách mong muốn tới mục tiêu của hồ sơ mẫu: đủ để có việc phải làm, không quá xa để demo hợp lý. */
export const THIEU_MUC_TIEU_MAU = { it: 1, nhieu: 2.5 };

/**
 * Danh sách nguyện vọng cho hồ sơ mẫu "Minh Anh": ngành CNTT ở TP.HCM, chọn theo nhãn tính từ chính điểm mẫu
 * (1 Thử sức, 2 Vừa sức, 1 An toàn, 1 Dự phòng) để màn Nguyện vọng có đủ các nhóm. Lấy theo dữ liệu, không gõ tay mã.
 * NV1 (Thử sức) cũng là mục tiêu: ưu tiên ngành đề án có ghi A01, có ≥ 2 năm điểm, học phí không vượt ngân sách,
 * và thiếu khoảng 1–2,5 điểm, để màn Hôm nay và Mục tiêu kể đúng câu chuyện "còn cách bao xa".
 * `diem` phải là điểm app thực sự dùng (lần thi thử mới nhất), không phải điểm hồ sơ ban đầu.
 */
export function idHoSoMau(diem: Partial<Record<MonKhoi, number | null>>, nganSachToiDa = Infinity): string[] {
  const goi = (loc: (l: LuaChon) => boolean) => LUA_CHON.filter((l) => l.nhomNganh === "CNTT" && l.phuongThuc === "THPT" && !lyDoKhacPhuongThuc(l) && loc(l))
    .map((l) => ({ l, tong: tongChoLuaChon(l, diem).tong }))
    .filter((x): x is { l: LuaChon; tong: number } => x.tong !== null)
    .map((x) => ({ ...x, nhan: nhanNguyenVong(x.l, x.tong) }))
    .sort((a, b) => b.l.diemMin - a.l.diemMin);
  const vuaTien = (l: LuaChon) => l.hocPhiMin === undefined || l.hocPhiMin <= nganSachToiDa;
  const haiNam = (l: LuaChon) => Object.keys(l.diemTheoNam ?? {}).length >= 2;
  const coA01 = (l: LuaChon) => !!l.toHopXet?.includes("A01");
  // Ưu tiên chặt nhất trước; thiếu nhãn nào thì nới dần để luôn đủ các nhóm.
  const tang = [
    goi((l) => l.khuVuc === "TP.HCM" && haiNam(l) && coA01(l) && vuaTien(l)),
    goi((l) => l.khuVuc === "TP.HCM" && coA01(l) && vuaTien(l)),
    goi((l) => l.khuVuc === "TP.HCM" && haiNam(l)),
    goi((l) => l.khuVuc === "TP.HCM"),
    goi(() => true),
  ];
  const giuaKhoang = -(THIEU_MUC_TIEU_MAU.it + THIEU_MUC_TIEU_MAU.nhieu) / 2;
  const hopMucTieu = (u: { l: LuaChon; tong: number }) => {
    const x = u.tong - u.l.diemMin;
    return x <= -THIEU_MUC_TIEU_MAU.it && x >= -THIEU_MUC_TIEU_MAU.nhieu;
  };
  const chon: LuaChon[] = [];
  const conTrong = (u: { l: LuaChon }) => !chon.includes(u.l) && !chon.some((c) => c.truong === u.l.truong && c.nganh === u.l.nganh);
  for (const [i, nhan] of (["Thử sức", "Vừa sức", "Vừa sức", "An toàn", "Dự phòng"] as const).entries()) {
    for (const ung of tang) {
      const hop = ung.filter((u) => u.nhan === nhan && conTrong(u));
      // NV1 là mục tiêu: lấy ngành có khoảng thiếu gần giữa khoảng mong muốn; các NV khác giữ thứ tự điểm chuẩn giảm dần.
      const x = i === 0
        ? [...hop.filter(hopMucTieu)].sort((a, b) => Math.abs(a.tong - a.l.diemMin - giuaKhoang) - Math.abs(b.tong - b.l.diemMin - giuaKhoang))[0] ?? hop[0]
        : hop[0];
      if (x) { chon.push(x.l); break; }
    }
  }
  return chon.map((l) => l.id);
}
