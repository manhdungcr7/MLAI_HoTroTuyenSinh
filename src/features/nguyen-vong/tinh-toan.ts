// Tính toán riêng của slice Nguyện vọng. TypeScript thuần, không import React.
// Dựa trên nhanNguyenVong / phanTichDanhSach của engine, KHÔNG sửa engine.
// Mọi câu chữ sinh ra ở đây là lời thường cho học sinh; không dùng lại câu canhBao của engine
// vì vài câu trong đó có từ ngữ dự án đã bỏ.
import { NGAN_SACH_TOI_DA, nhanNguyenVong, phanTichDanhSach } from "@/engine/phan-tich";
import type { HoSo, LuaChon, MonId, NhanNguyenVong, ToneTen } from "@/state/types";
import { coHocPhi } from "@/data/lua-chon-phu";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";

/** Gợi ý giữ khoảng 5–6 nguyện vọng; vượt thì nhắc nhẹ, không chặn. */
export const SO_NV_GOI_Y = 6;

export const THU_TU_NHAN: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];

/** Một hàng trong danh sách. lc = undefined khi id không còn trong dữ liệu (dữ liệu mẫu đổi). nhan = null khi em chưa đủ điểm. */
export interface DongNV {
  id: string;
  viTri: number; // 0 = NV1
  lc: LuaChon | undefined;
  nhan: NhanNguyenVong | null;
}

type DiemMon = Record<MonId, number | null>;

/** Tổ hợp tốt nhất của em trong các tổ hợp tính được từ điểm đã nhập. */
export const toHopTotNhat = (diem: DiemMon) => tongChoLuaChon({ toHopXet: [] }, diem);

/** Tổng điểm của em theo đúng tổ hợp của ngành này (đề án ghi); đề án chưa ghi thì lấy tổ hợp cao nhất của em. */
export const tongChoNganh = (lc: LuaChon, diem: DiemMon): number | null => tongChoLuaChon(lc, diem).tong;

export function dungDanhSach(ids: string[], diem: DiemMon, tim: (id: string) => LuaChon | undefined): DongNV[] {
  return ids.map((id, viTri) => {
    const lc = tim(id);
    const tong = lc ? tongChoNganh(lc, diem) : null;
    return { id, viTri, lc, nhan: lc && tong !== null ? nhanNguyenVong(lc, tong) : null };
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
  /** Số chỗ chắc chân = An toàn + Dự phòng. */
  chacChan: number;
  canThemAnToan: boolean;
  thuSucNhieu: boolean;
  thieuVuaSuc: boolean;
  danhSachNgan: boolean;
}

export function xetCoCau(dem: Record<NhanNguyenVong, number>): CoCau {
  const n = THU_TU_NHAN.reduce((s, k) => s + dem[k], 0);
  const chacChan = dem["An toàn"] + dem["Dự phòng"];
  return {
    n, dem, chacChan,
    // Cần ít nhất 1 chỗ chắc chân; danh sách từ 3 nguyện vọng thì nên có 2.
    canThemAnToan: n > 0 && (chacChan === 0 || (chacChan < 2 && n >= 3)),
    thuSucNhieu: n >= 2 && (dem["Thử sức"] >= 3 || dem["Thử sức"] / n > 0.5),
    thieuVuaSuc: n > 0 && dem["Vừa sức"] === 0,
    danhSachNgan: n > 0 && n < 4,
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
  if (c.chacChan === 0)
    return { tone: "do", onDinh: false, tieuDe: "Danh sách chưa có chỗ chắc chân", hienTrang, nenLam: "Em nên thêm ít nhất 1 nguyện vọng an toàn", lyDo: "để vẫn có chỗ học nếu điểm thi không như mong đợi." };
  if (c.thuSucNhieu)
    return { tone: "cam", onDinh: false, tieuDe: "Thử sức đang hơi nhiều", hienTrang, nenLam: "Em có thể đổi bớt 1 nguyện vọng thử sức sang trường vừa sức", lyDo: "để danh sách cân hơn giữa ước mơ và khả năng hiện tại." };
  if (c.canThemAnToan)
    return { tone: "cam", onDinh: false, tieuDe: "Mới có 1 chỗ chắc chân", hienTrang, nenLam: "Em nên thêm ít nhất 1 nguyện vọng an toàn nữa", lyDo: "để có thêm lựa chọn chắc chắn phía sau." };
  if (c.thieuVuaSuc)
    return { tone: "cam", onDinh: false, tieuDe: "Chưa có nguyện vọng vừa sức", hienTrang, nenLam: "Em nên thêm 1 trường có điểm gần với điểm của em", lyDo: "vì đây thường là nhóm em có cơ hội tốt nhất." };
  return { tone: "luc", onDinh: true, tieuDe: "Danh sách của em đang khá cân đối", hienTrang, nenLam: null, lyDo: "Có cả trường để thử sức lẫn chỗ chắc chân. Em cứ giữ nhịp học là được." };
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
  const c = xetCoCau(demNhan(coDuLieu));

  const canBang: DiemDanhGia = coNhan
    ? {
      khoa: "canBang", ten: "Độ cân bằng", diem: pt.canBang.diem, nhanXet: pt.canBang.nhanXet, tone: toneDiem(pt.canBang.diem),
      chiTiet: c.chacChan === 0 ? "Chưa có trường an toàn hay dự phòng." : c.thuSucNhieu ? "Tỉ lệ thử sức đang cao." : c.thieuVuaSuc ? "Chưa có trường vừa sức." : c.canThemAnToan ? "Đã có đủ các nhóm chính. Thêm 1 chỗ chắc chân nữa sẽ yên tâm hơn." : "Có cả trường thử sức, vừa sức lẫn chỗ chắc chân.",
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
    ? { khoa: "taiChinh", ten: "Phù hợp tài chính", diem: null, nhanXet: "Chưa có dữ liệu", tone: "muc", chiTiet: "Các nguyện vọng này chưa có học phí trong dữ liệu, nên chưa so được với ngân sách. Em xem học phí trên trang của trường.", cachTinh: ["Cần ít nhất một nguyện vọng có học phí trong dữ liệu mới chấm được."] }
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
    .map((lc) => ({ lc, tong: tongChoNganh(lc, dk.diem) }))
    .filter((x): x is { lc: LuaChon; tong: number } => x.tong !== null)
    .map((x) => ({ lc: x.lc, nhan: nhanNguyenVong(x.lc, x.tong) }))
    .filter((x) => nhans.includes(x.nhan))
    .sort((a, b) =>
      Number(trongKhuVuc(b.lc, dk.hoSo.khuVuc)) - Number(trongKhuVuc(a.lc, dk.hoSo.khuVuc))
      || Number(dk.hoSo.nganhQuanTam.includes(b.lc.nhomNganh)) - Number(dk.hoSo.nganhQuanTam.includes(a.lc.nhomNganh))
      || nhans.indexOf(a.nhan) - nhans.indexOf(b.nhan)
      || b.lc.diemMin - a.lc.diemMin) // trường điểm cao hơn trước: chắc chân mà ít "phí" điểm nhất
    .slice(0, soLuong);
}

/** Chỉ trả về gợi ý đang thật sự cần. Rỗng nghĩa là danh sách ổn. */
export function goiYHanhDong(ds: DongNV[], dk: DkGoiY): GoiY[] {
  const c = xetCoCau(demNhan(ds));
  const ra: GoiY[] = [];
  if (c.canThemAnToan) {
    const truong = chonTruong(dk, ["An toàn", "Dự phòng"], 2);
    ra.push({
      loai: "themAnToan", tieuDe: "Nên thêm 1 trường an toàn", thuSuc: [], truong,
      moTa: c.chacChan === 0
        ? "Danh sách chưa có trường nào điểm tham khảo thấp hơn rõ so với điểm của em."
        : `Em mới có ${c.chacChan} chỗ chắc chân. Thêm 1 trường điểm tham khảo thấp hơn điểm em từ 1,5 điểm trở lên.`,
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

// ---------- Sắp xếp lại ----------

/** Thứ tự "theo mức vừa sức": Vừa sức trước, rồi Thử sức, An toàn, Dự phòng. Giữ nguyên thứ tự trong cùng nhãn. */
export const THU_TU_VUA_SUC: NhanNguyenVong[] = ["Vừa sức", "Thử sức", "An toàn", "Dự phòng"];

export function sapTheoVuaSuc(ds: DongNV[]): string[] {
  const hang = (d: DongNV) => (d.nhan ? THU_TU_VUA_SUC.indexOf(d.nhan) : THU_TU_VUA_SUC.length);
  return [...ds].sort((a, b) => hang(a) - hang(b) || a.viTri - b.viTri).map((d) => d.id);
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
