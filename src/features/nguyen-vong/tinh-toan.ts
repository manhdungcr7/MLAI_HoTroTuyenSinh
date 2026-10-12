// Tính toán riêng của slice Nguyện vọng. TypeScript thuần, không import React.
// Dựa trên nhanNguyenVong / phanTichDanhSach của engine, KHÔNG sửa engine.
// Mọi câu chữ sinh ra ở đây là lời thường cho học sinh; không dùng lại câu canhBao của engine
// vì vài câu trong đó có từ ngữ dự án đã bỏ.
import { NGAN_SACH_TOI_DA, lyDoKhacPhuongThuc, nhanChoLuaChon, phanTichDanhSach } from "@/engine/phan-tich";
import type { DiemDayDu, HoSo, LuaChon, NhanNguyenVong, ToneTen } from "@/state/types";
import { coHocPhi } from "@/data/lua-chon-phu";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { tongChoLuaChon, type TongToHop } from "@/features/kham-pha/to-hop";
import { TEN_MON, TEN_MON_THEM, type MonId, type MonThem } from "@/state/types";

/** Gợi ý giữ khoảng 5–6 nguyện vọng; vượt thì nhắc nhẹ, không chặn. */
export const SO_NV_GOI_Y = 6;

export const THU_TU_NHAN: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];

/** Một hàng trong danh sách. lc = undefined khi id không còn trong dữ liệu (dữ liệu mẫu đổi). nhan = null khi không xếp được nhãn (xem lyDoKhongNhan). */
export interface DongNV {
  id: string;
  viTri: number; // 0 = NV1
  lc: LuaChon | undefined;
  nhan: NhanNguyenVong | null;
  /** Tổ hợp dùng để tính tổng điểm (null khi chưa tính được). */
  toHop: string | null;
  /** true = đề án chưa ghi tổ hợp, đã lấy tổ hợp cao nhất của em. */
  suyRa: boolean;
  /** Vì sao hàng này không có nhãn (khác phương thức THPT, thiếu điểm môn, tổ hợp chưa tính được); null khi đã có nhãn. */
  lyDoKhongNhan: string | null;
  /** Điểm em hơn (+) hoặc kém (−) điểm chuẩn của năm `lc.namDiem`, làm tròn 2 chữ số. null khi không so được (xem lyDoKhongNhan). */
  chenh: number | null;
}

type DiemMon = DiemDayDu;

/** Tổ hợp tốt nhất của em trong các tổ hợp tính được từ điểm đã nhập. */
export const toHopTotNhat = (diem: DiemMon) => tongChoLuaChon({ toHopXet: [] }, diem);

/** Tổng điểm của em theo đúng tổ hợp của ngành này (đề án ghi); đề án chưa ghi thì lấy tổ hợp cao nhất của em. */
export const tongChoNganh = (lc: LuaChon, diem: DiemMon): number | null => tongChoLuaChon(lc, diem).tong;

const tenMon = (m: string) => TEN_MON[m as MonId] ?? TEN_MON_THEM[m as MonThem] ?? m;

/** Lý do không so được điểm của em với điểm chuẩn của chương trình này (null = so được). */
export function lyDoChuaSoDuoc(lc: LuaChon, tl: TongToHop): string | null {
  const khac = lyDoKhacPhuongThuc(lc);
  if (khac) return khac;
  if (tl.tong !== null) return null;
  if (tl.khongTinhDuoc) return `Ngành xét tổ hợp ${tl.khongTinhDuoc.slice(0, 3).join(", ")}, mình chưa tính được điểm này.`;
  if (tl.thieuMon) return `Em chưa nhập điểm ${tl.thieuMon.map(tenMon).join(", ")}.`;
  return "Em chưa nhập đủ điểm 3 môn của một tổ hợp.";
}

export function dungDanhSach(ids: string[], diem: DiemMon, tim: (id: string) => LuaChon | undefined): DongNV[] {
  return ids.map((id, viTri) => {
    const lc = tim(id);
    if (!lc) return { id, viTri, lc, nhan: null, toHop: null, suyRa: false, chenh: null, lyDoKhongNhan: "Lựa chọn này không còn trong dữ liệu." };
    const tl = tongChoLuaChon(lc, diem);
    const nhan = nhanChoLuaChon(lc, tl.tong);
    return { id, viTri, lc, nhan, toHop: nhan ? tl.toHop : null, suyRa: nhan ? tl.suyRa : false, chenh: nhan && tl.tong !== null ? Math.round((tl.tong - lc.diemMin) * 100) / 100 : null, lyDoKhongNhan: nhan ? null : lyDoChuaSoDuoc(lc, tl) };
  });
}

export function demNhan(ds: DongNV[]): Record<NhanNguyenVong, number> {
  const dem: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 0, "An toàn": 0, "Dự phòng": 0 };
  for (const d of ds) if (d.nhan) dem[d.nhan]++;
  return dem;
}

// ---------- Cơ cấu và lời nhận xét ----------

export interface CoCau {
  n: number;
  dem: Record<NhanNguyenVong, number>;
  /** Số nguyện vọng có điểm chuẩn thấp hơn điểm em từ 1,5 điểm (An toàn + Dự phòng). */
  chacChan: number;
  /** Số hàng không có nhãn (thiếu điểm môn, phương thức khác...). > 0 thì chưa đủ căn cứ để kết luận về cả danh sách. */
  chuaDuCanCu: number;
  canThemAnToan: boolean;
  thuSucNhieu: boolean;
  thieuVuaSuc: boolean;
  danhSachNgan: boolean;
}

/** `soHang` = tổng số hàng trong danh sách (kể cả hàng không có nhãn). Bỏ trống nghĩa là mọi hàng đều có nhãn. */
export function xetCoCau(dem: Record<NhanNguyenVong, number>, soHang?: number): CoCau {
  const n = THU_TU_NHAN.reduce((s, k) => s + dem[k], 0);
  const chacChan = dem["An toàn"] + dem["Dự phòng"];
  const chuaDuCanCu = Math.max(0, (soHang ?? n) - n);
  // Còn hàng chưa có nhãn thì không kết luận gì về cơ cấu: dựa vào một phần danh sách sẽ ra kết luận sai.
  const duCanCu = chuaDuCanCu === 0;
  return {
    n, dem, chacChan, chuaDuCanCu,
    // Nên có ít nhất 1 nguyện vọng điểm chuẩn thấp hơn điểm em; danh sách từ 3 nguyện vọng thì nên có 2.
    canThemAnToan: duCanCu && n > 0 && (chacChan === 0 || (chacChan < 2 && n >= 3)),
    thuSucNhieu: duCanCu && n >= 2 && (dem["Thử sức"] >= 3 || dem["Thử sức"] / n > 0.5),
    thieuVuaSuc: duCanCu && n > 0 && dem["Vừa sức"] === 0,
    danhSachNgan: duCanCu && n > 0 && n < 4,
  };
}

/** "2 nguyện vọng thử sức, 1 vừa sức, 1 dự phòng" – bỏ nhãn bằng 0. */
export function moTaSoLuong(dem: Record<NhanNguyenVong, number>): string {
  const phan = THU_TU_NHAN.filter((k) => dem[k] > 0).map((k, i) => `${dem[k]}${i === 0 ? " nguyện vọng" : ""} ${k.toLowerCase()}`);
  if (phan.length <= 1) return phan.join("");
  return `${phan.slice(0, -1).join(", ")} và ${phan[phan.length - 1]}`;
}

export interface KetLuan {
  tone: ToneTen;
  tieuDe: string;
  /** Câu tả hiện trạng, sinh từ số liệu thật. */
  hienTrang: string;
  /** Việc nên làm, in đậm trong khung cảnh báo. */
  nenLam: string | null;
  lyDo: string | null;
  onDinh: boolean;
}

export function ketLuan(c: CoCau): KetLuan {
  const hienTrang = c.n ? `Hiện em có ${moTaSoLuong(c.dem)}.` : "Em chưa có nguyện vọng nào.";
  if (c.chuaDuCanCu > 0)
    return { tone: "muc", onDinh: false, tieuDe: "Chưa đủ căn cứ để nhận xét cả danh sách", hienTrang, nenLam: null, lyDo: `Chưa đủ căn cứ cho ${c.chuaDuCanCu} nguyện vọng (thiếu điểm môn hoặc khác phương thức).` };
  if (c.chacChan === 0)
    return { tone: "do", onDinh: false, tieuDe: "Chưa có nguyện vọng điểm chuẩn thấp hơn điểm em", hienTrang, nenLam: "Thêm 1 nguyện vọng thấp hơn điểm em từ 1,5", lyDo: "phòng khi điểm thi thấp hơn dự kiến." };
  if (c.thuSucNhieu)
    return { tone: "cam", onDinh: false, tieuDe: "Thử sức đang hơi nhiều", hienTrang, nenLam: "Đổi 1 NV thử sức sang vừa sức", lyDo: "để cân giữa ước mơ và sức hiện tại." };
  if (c.canThemAnToan)
    return { tone: "cam", onDinh: false, tieuDe: "Mới có 1 nguyện vọng điểm chuẩn thấp hơn điểm em", hienTrang, nenLam: "Thêm 1 NV An toàn hoặc Dự phòng", lyDo: "để có thêm chỗ lùi." };
  if (c.thieuVuaSuc)
    return { tone: "cam", onDinh: false, tieuDe: "Chưa có nguyện vọng vừa sức", hienTrang, nenLam: "Thêm 1 trường điểm chuẩn sát điểm em", lyDo: "đây là nhóm dễ trúng nhất với sức hiện tại." };
  return { tone: "luc", onDinh: true, tieuDe: "Cơ cấu danh sách đủ các nhóm", hienTrang, nenLam: null, lyDo: "Có cả chỗ thử sức lẫn chỗ lùi. Nhãn so với điểm chuẩn năm trước, không dự đoán kết quả." };
}

// ---------- Ba điểm đánh giá ----------

export interface DiemDanhGia {
  khoa: "canBang" | "taiChinh" | "khuVuc";
  ten: string;
  diem: number | null; // null = chưa có dữ liệu để chấm
  nhanXet: string;
  chiTiet: string;
  tone: ToneTen;
  cachTinh: string[];
}

const toneDiem = (d: number): ToneTen => (d >= 85 ? "luc" : d >= 70 ? "xanh" : d >= 50 ? "cam" : "do");

/** Chấm 3 điểm. coNhan = false khi em chưa đủ điểm nên chưa chấm được độ cân bằng. */
export function chamDiem(ds: DongNV[], hoSo: Pick<HoSo, "nganSach" | "khuVuc">, coNhan: boolean): DiemDanhGia[] {
  const coDuLieu = ds.filter((d): d is DongNV & { lc: LuaChon } => !!d.lc);
  // Khi chưa có nhãn, gán tạm "Vừa sức" chỉ để engine chấm tài chính/khu vực; điểm cân bằng không dùng.
  const pt = phanTichDanhSach(coDuLieu.map((d) => ({ lc: d.lc, nhan: d.nhan ?? "Vừa sức" })), hoSo);
  const ns = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : null;
  const c = xetCoCau(demNhan(coDuLieu), coDuLieu.length);

  const canBang: DiemDanhGia = coNhan
    ? {
      khoa: "canBang", ten: "Độ cân bằng", diem: pt.canBang.diem, nhanXet: pt.canBang.nhanXet, tone: toneDiem(pt.canBang.diem),
      chiTiet: c.chuaDuCanCu > 0 ? `Chưa đủ căn cứ cho ${c.chuaDuCanCu} nguyện vọng (thiếu điểm môn hoặc phương thức khác).` : c.chacChan === 0 ? "Chưa có trường An toàn hay Dự phòng." : c.thuSucNhieu ? "Tỉ lệ thử sức đang cao." : c.thieuVuaSuc ? "Chưa có trường vừa sức." : c.canThemAnToan ? "Đã có đủ các nhóm chính. Có thể thêm 1 nguyện vọng An toàn hoặc Dự phòng nữa." : "Có cả trường thử sức, vừa sức, An toàn hoặc Dự phòng.",
      cachTinh: [
        "Bắt đầu từ 100 điểm, rồi trừ khi:",
        "• Chưa có nguyện vọng An toàn hay Dự phòng: trừ 40.",
        "• Hơn một nửa danh sách là Thử sức: trừ 20.",
        "• Chưa có nguyện vọng Vừa sức: trừ 15.",
        "• Không có Dự phòng và ít hơn 2 An toàn: trừ 5.",
        "• Từ 3 nguyện vọng trở lên mà không có Thử sức nào: trừ 5.",
      ],
    }
    : { khoa: "canBang", ten: "Độ cân bằng", diem: null, nhanXet: "Chưa có dữ liệu", tone: "muc", chiTiet: "Cần đủ điểm 3 môn của một tổ hợp để xếp nhãn cho từng nguyện vọng.", cachTinh: ["Cần đủ điểm 3 môn của một tổ hợp để xếp nhãn rồi mới chấm được."] };

  const coPhiNao = coDuLieu.some((d) => coHocPhi(d.lc));
  const taiChinh: DiemDanhGia = ns !== null && coDuLieu.length > 0 && !coPhiNao
    ? { khoa: "taiChinh", ten: "Phù hợp tài chính", diem: null, nhanXet: "Chưa có dữ liệu", tone: "muc", chiTiet: "Các nguyện vọng chưa có học phí trong dữ liệu.", cachTinh: ["Cần ít nhất một nguyện vọng có học phí trong dữ liệu mới chấm được."] }
    : ns === null
    ? { khoa: "taiChinh", ten: "Phù hợp tài chính", diem: null, nhanXet: "Chưa có dữ liệu", tone: "muc", chiTiet: "Em chưa chọn mức học phí gia đình có thể lo.", cachTinh: ["Cần em chọn ngân sách học phí ở bước Mục tiêu & ưu tiên."] }
    : {
      khoa: "taiChinh", ten: "Phù hợp tài chính", diem: pt.taiChinh.diem, nhanXet: pt.taiChinh.nhanXet, tone: toneDiem(pt.taiChinh.diem), chiTiet: pt.taiChinh.chiTiet,
      cachTinh: [
        `Điểm = số nguyện vọng có học phí thấp nhất không vượt ${ns} triệu/năm, chia cho tổng số nguyện vọng, nhân 100.`,
        "Chỉ tính các nguyện vọng đã có học phí trong dữ liệu; học phí có thể khác ở năm em vào học.",
      ],
    };

  const dungKV = coDuLieu.filter((d) => dungKhuVuc(d.lc, hoSo.khuVuc) === true).length;
  const diemKV = coDuLieu.length ? Math.round((dungKV / coDuLieu.length) * 100) : 0;
  const khuVuc: DiemDanhGia = hoSo.khuVuc.length === 0
    ? { khoa: "khuVuc", ten: "Phù hợp khu vực", diem: null, nhanXet: "Chưa có dữ liệu", tone: "muc", chiTiet: "Em chưa chọn nơi muốn học.", cachTinh: ["Cần em chọn nơi muốn học ở bước Mục tiêu & ưu tiên."] }
    : {
      khoa: "khuVuc", ten: "Phù hợp khu vực", diem: diemKV, nhanXet: diemKV >= 85 ? "Rất phù hợp" : diemKV >= 70 ? "Phù hợp" : diemKV >= 50 ? "Khá xa" : "Rất xa", tone: toneDiem(diemKV),
      chiTiet: `${dungKV}/${coDuLieu.length} nguyện vọng ở khu vực em ưu tiên.`,
      cachTinh: [`Điểm = số nguyện vọng ở nơi em muốn học (${hoSo.khuVuc.join(", ")}), chia cho tổng số nguyện vọng, nhân 100.`],
    };

  return [canBang, taiChinh, khuVuc];
}

// ---------- Gợi ý hành động ----------

export interface GoiY {
  loai: "themAnToan" | "giamThuSuc" | "themPhuHop";
  tieuDe: string;
  moTa: string;
  /** Trường cụ thể đề xuất (chưa có trong danh sách). */
  truong: { lc: LuaChon; nhan: NhanNguyenVong }[];
  /** Nguyện vọng thử sức có thể bỏ (với gợi ý giảm thử sức). */
  thuSuc: DongNV[];
}

interface DkGoiY { diem: DiemMon; hoSo: Pick<HoSo, "nganSach" | "khuVuc" | "nganhQuanTam">; tatCa: LuaChon[]; daCo: string[] }

// "Tỉnh khác" nghĩa là mọi nơi ngoài 4 thành phố lớn: dùng đúng hàm của Khám phá thay vì so chuỗi.
const trongKhuVuc = (lc: LuaChon, kv: string[]) => dungKhuVuc(lc, kv) === true;

/** Chọn trường mẫu chưa có trong danh sách, có nhãn thuộc `nhans` và vừa ngân sách; ưu tiên đúng khu vực, đúng nhóm ngành. */
export function chonTruong(dk: DkGoiY, nhans: NhanNguyenVong[], soLuong: number, boQua: string[] = []) {
  const ns = dk.hoSo.nganSach ? NGAN_SACH_TOI_DA[dk.hoSo.nganSach] : Infinity;
  return dk.tatCa
    .filter((lc) => !dk.daCo.includes(lc.id) && !boQua.includes(lc.id) && (lc.hocPhiMin ?? 0) <= ns)
    .map((lc) => ({ lc, nhan: nhanChoLuaChon(lc, tongChoNganh(lc, dk.diem)) }))
    .filter((x): x is { lc: LuaChon; nhan: NhanNguyenVong } => x.nhan !== null && nhans.includes(x.nhan))
    .sort((a, b) =>
      Number(trongKhuVuc(b.lc, dk.hoSo.khuVuc)) - Number(trongKhuVuc(a.lc, dk.hoSo.khuVuc))
      || Number(dk.hoSo.nganhQuanTam.includes(b.lc.nhomNganh)) - Number(dk.hoSo.nganhQuanTam.includes(a.lc.nhomNganh))
      || nhans.indexOf(a.nhan) - nhans.indexOf(b.nhan)
      || b.lc.diemMin - a.lc.diemMin) // trường điểm cao hơn trước: chắc chân mà ít "phí" điểm nhất
    .slice(0, soLuong);
}

/** Chỉ trả về gợi ý đang thật sự cần. Rỗng nghĩa là danh sách ổn. */
export function goiYHanhDong(ds: DongNV[], dk: DkGoiY): GoiY[] {
  const c = xetCoCau(demNhan(ds), ds.length);
  const ra: GoiY[] = [];
  if (c.canThemAnToan) {
    const truong = chonTruong(dk, ["An toàn", "Dự phòng"], 2);
    ra.push({
      loai: "themAnToan", tieuDe: "Nên thêm 1 nguyện vọng An toàn", thuSuc: [], truong,
      moTa: c.chacChan === 0
        ? "Danh sách chưa có trường nào có điểm tham khảo thấp hơn rõ so với điểm của em."
        : `Em mới có ${c.chacChan} nguyện vọng An toàn hoặc Dự phòng. Thêm 1 trường điểm tham khảo thấp hơn điểm em từ 1,5 điểm trở lên.`,
    });
  }
  if (c.thuSucNhieu) {
    // Giữ lại 1–2 trường thử sức xếp trên cùng (em muốn nhất), đề xuất cân nhắc đổi các trường còn lại.
    const tatCaThuSuc = ds.filter((d) => d.nhan === "Thử sức");
    const giu = Math.max(1, Math.min(2, tatCaThuSuc.length - 1));
    ra.push({
      loai: "giamThuSuc", tieuDe: "Có thể giảm bớt nguyện vọng thử sức", truong: [], thuSuc: tatCaThuSuc.slice(giu),
      moTa: `Em đang có ${c.dem["Thử sức"]}/${c.n} nguyện vọng thử sức (điểm tham khảo cao hơn điểm em). Giữ ${giu} trường em muốn nhất, cân nhắc đổi ${tatCaThuSuc.length - giu === 1 ? "trường" : "các trường"} dưới đây sang trường vừa sức.`,
    });
  }
  if (c.thieuVuaSuc || c.danhSachNgan) {
    const daGoiY = ra.flatMap((g) => g.truong.map((t) => t.lc.id));
    const truong = chonTruong(dk, ["Vừa sức", "An toàn"], 2, daGoiY);
    ra.push({
      loai: "themPhuHop", tieuDe: "Gợi ý thêm trường phù hợp", thuSuc: [], truong,
      moTa: c.thieuVuaSuc
        ? "Chưa có trường vừa sức. Đây là những trường có điểm tham khảo gần với điểm của em."
        : `Danh sách mới có ${c.n} nguyện vọng. Thêm vài trường hợp điểm để em có nhiều lựa chọn hơn.`,
    });
  }
  return ra;
}

// ---------- Thứ tự nguyện vọng ----------
// Quy tắc xét tuyển: em vào nguyện vọng CAO NHẤT mà đủ điểm. Thứ tự do em chọn; mình chỉ cảnh báo và đề xuất, không tự đổi.

const laChacChan = (d: DongNV) => d.nhan === "An toàn" || d.nhan === "Dự phòng";
const laCaoHon = (d: DongNV) => d.nhan === "Thử sức" || d.nhan === "Vừa sức";

/** Một cặp: nguyện vọng An toàn/Dự phòng (`truoc`) đứng trước nguyện vọng Thử sức/Vừa sức (`sau`). */
export interface CanhBaoThuTu { truoc: DongNV; sau: DongNV; cau: string }

/** Mỗi nguyện vọng Thử sức/Vừa sức bị chặn bởi nguyện vọng An toàn/Dự phòng đứng trước nó cho một cảnh báo (cặp với nguyện vọng chắc chắn đứng đầu tiên). */
export function canhBaoThuTu(ds: DongNV[]): CanhBaoThuTu[] {
  const ra: CanhBaoThuTu[] = [];
  for (const sau of ds) {
    if (!laCaoHon(sau)) continue;
    const truoc = ds.find((d) => d.viTri < sau.viTri && laChacChan(d));
    if (!truoc) continue;
    ra.push({ truoc, sau, cau: `NV${truoc.viTri + 1} (${truoc.nhan}) đứng trước NV${sau.viTri + 1} (${sau.nhan}). Nếu em đủ điểm NV${truoc.viTri + 1} thì sẽ không xét NV${sau.viTri + 1}.` });
  }
  return ra;
}

/** Thứ tự id sau khi đưa `id` lên đứng ngay trước `truocId`; các nguyện vọng khác giữ nguyên thứ tự. */
export function duaLenTruoc(ids: string[], id: string, truocId: string): string[] {
  const a = ids.filter((x) => x !== id);
  const k = a.indexOf(truocId);
  if (k < 0 || !ids.includes(id)) return [...ids];
  a.splice(k, 0, id);
  return a;
}

/**
 * Đề xuất thứ tự: các nguyện vọng An toàn/Dự phòng xuống sau cùng, còn lại giữ NGUYÊN thứ tự em đặt
 * (Thử sức và Vừa sức không bị xáo theo nhãn). Chỉ là đề xuất, em xem trước rồi mới áp dụng.
 */
export function deXuatThuTu(ds: DongNV[]): string[] {
  return [...ds.filter((d) => !laChacChan(d)), ...ds.filter(laChacChan)].map((d) => d.id);
}

/** Chuỗi bước doiViTri(tu, den) để biến `hienTai` thành `dich` (store chỉ có hàm đổi một vị trí). */
export function cacBuocDoiCho(hienTai: string[], dich: string[]): [number, number][] {
  const a = [...hienTai];
  const buoc: [number, number][] = [];
  dich.forEach((id, i) => {
    const j = a.indexOf(id);
    if (j < 0 || j === i) return;
    const [m] = a.splice(j, 1); a.splice(i, 0, m);
    buoc.push([j, i]);
  });
  return buoc;
}

export const giongNhau = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---------- Kéo thả ----------

/** Vị trí đích khi kéo hàng `tu` đi một đoạn dy (px). tam = tâm dọc của từng hàng lúc bắt đầu kéo. */
export function viTriDich(tam: number[], tu: number, dy: number): number {
  const tamMoi = tam[tu] + dy;
  let den = tu;
  for (let i = tu + 1; i < tam.length; i++) if (tamMoi > tam[i]) den = i;
  for (let i = tu - 1; i >= 0; i--) if (tamMoi < tam[i]) den = i;
  return den;
}
