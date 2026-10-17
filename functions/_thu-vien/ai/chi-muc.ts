// Chỉ mục vector (Cloudflare Vectorize `nvai-kb`) cho RAG: dựng đoạn văn từ bản ghi CMS đã xuất bản, nhúng, upsert/xóa, và truy vấn.
// Mọi hàm ghi đều "an toàn": thiếu binding hoặc lỗi thì trả kết quả báo lại, không ném (xuất bản không được hỏng vì vector).
import type { BanGhiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { chuanHoaChoSnapshot, lamSachDuLieuPublic } from "../../../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import type { EnvAI, VectorGhi, VectorMeta } from "./kieu";
import { nhungVanBan } from "./nhung";
import { tinhCuaTruong, tinhGanKe } from "./tinh-lan-can";
import { nguonChiNoiDiemSan } from "../../../src/engine/du-lieu-tuyen-sinh/kiem-tra-diem";

const LO_UPSERT = 100;
const DAI_TOI_DA = 600;
const LOAI_CONG_DONG = ["noi_luu_tru", "review", "luu_y"];
/** Tên tập trong snapshot_tap -> loại thực thể (tập community tự mang `loai` ở từng dòng). */
const LOAI_CUA_TAP: Record<string, string> = { schools: "school", tuition: "tuition", scholarships: "scholarship", admissions: "admission", announcements: "announcement", cutoffScores: "cutoff_score" };

/** Một mục sẵn sàng chỉ mục: `data` đã ở hình dạng snapshot (có maTruong, nguon). */
export interface MucChiMuc { loai: string; id: string; data: Record<string, unknown>; phienBan: string }
type Dau = BanGhiCms | MucChiMuc;

const chu = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const ghep = (...p: unknown[]) => p.filter((x): x is string => typeof x === "string" && x !== "").join(" ");
const cat = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const khoang = (v: unknown) => (Array.isArray(v) && v.length === 2 ? `${v[0]}-${v[1]}` : "");

/** Mã vector ổn định giữa lúc xuất bản và lúc dựng lại từ snapshot: id có sẵn > mã trường (trường) > khóa ghép từ nội dung. */
function idVector(loai: string, d: Record<string, unknown>, idNgoai?: string): string {
  const goc = idNgoai || chu(d.id) || (loai === "school" ? chu(d.maTruong) : [d.maTruong, d.maNganh, d.nam, d.phuongThuc].map(chu).filter(Boolean).join("-"));
  return `${loai}:${goc}`;
}

export function mucTuBanGhi(bg: BanGhiCms, phienBan: string): MucChiMuc {
  const d = chuanHoaChoSnapshot(bg, lamSachDuLieuPublic((bg.data ?? {}) as Record<string, unknown>));
  return { loai: bg.entityType, id: idVector(bg.entityType, d, LOAI_CONG_DONG.includes(bg.entityType) ? bg.entityId : undefined), data: d, phienBan };
}

/** Các mục của một tập trong snapshot_tap (dùng khi dựng lại toàn bộ hoặc rollback). */
export function mucTuTap(ten: string, json: string, phienBan: string): MucChiMuc[] {
  let ds: Record<string, unknown>[];
  try { ds = JSON.parse(json); } catch { return []; }
  if (!Array.isArray(ds)) return [];
  if (ten === "community") {
    return ds.map((x) => ({ loai: chu(x.loai), id: `${chu(x.loai)}:${chu(x.id)}`, data: { ...(x.noiDung as object), maTruong: x.maTruong, nguon: x.nguon } as Record<string, unknown>, phienBan }));
  }
  const loai = LOAI_CUA_TAP[ten];
  return loai ? ds.map((d) => ({ loai, id: idVector(loai, d), data: d, phienBan })) : [];
}

const aMuc = (x: Dau, pb = ""): MucChiMuc => ("entityType" in x ? mucTuBanGhi(x, pb || String(x.version)) : x);

/** Đoạn văn ngắn (<= 600 ký tự) mô tả mục; null nếu loại này không đưa vào chỉ mục. */
export function vanBanCuaMuc(m: MucChiMuc): string | null {
  const d = m.data;
  const ma = chu(d.maTruong);
  const nganh = chu(d.maNganh);
  let s: string;
  switch (m.loai) {
    case "school": {
      const ktx = d.kyTucXa as { coKyTuc?: boolean; giaThangMin?: number; giaThangMax?: number; ghiChu?: string } | undefined;
      s = ghep(`Trường ${chu(d.tenTruong) || ma} (${ma}).`, d.diaChi && `Địa chỉ: ${chu(d.diaChi)}.`, ktx && (ktx.coKyTuc ? `Có ký túc xá${ktx.giaThangMin ? `, ${ktx.giaThangMin}-${ktx.giaThangMax ?? ktx.giaThangMin} nghìn đồng/tháng` : ""}. ${chu(ktx.ghiChu)}` : "Chưa có ký túc xá."), chu(d.ghiChu), d.websiteTuyenSinh && `Web tuyển sinh: ${chu(d.websiteTuyenSinh)}`);
      break;
    }
    case "tuition":
      s = ghep(`Học phí ${ma}${nganh ? ` ngành ${nganh}` : ""} năm ${chu(d.nam)}: ${d.mucThap === d.mucCao ? chu(d.mucThap).replace(".", ",") : `${chu(d.mucThap)}-${chu(d.mucCao)}`} ${d.donVi === "trieu_tin_chi" ? "triệu đồng/tín chỉ" : "triệu đồng/năm"}.`, d.phamVi && `Áp dụng: ${chu(d.phamVi)}.`, d.loTrinhTang && `Lộ trình tăng: ${chu(d.loTrinhTang)}.`);
      break;
    case "scholarship":
      s = ghep(`Học bổng ${chu(d.tenHocBong)} của ${ma}: ${chu(d.giaTri)}.`, `Điều kiện: ${chu(d.dieuKien)}.`, d.hanNop && `Hạn nộp: ${chu(d.hanNop)}.`);
      break;
    case "admission":
      s = ghep(`Tuyển sinh ${ma}${nganh ? ` ngành ${nganh}` : ""} năm ${chu(d.nam)}, phương thức ${chu(d.phuongThuc)}.`, d.chiTieu && `Chỉ tiêu ${chu(d.chiTieu)}.`, Array.isArray(d.toHop) && d.toHop.length > 0 && `Tổ hợp: ${d.toHop.join(", ")}.`, d.dieuKienNhanHoSo && `Điều kiện nhận hồ sơ: ${chu(d.dieuKienNhanHoSo)}.`);
      break;
    case "cutoff_score":
      if (d.loaiDiem !== "diem_chuan" || nguonChiNoiDiemSan((d.nguon as { tieuDe?: string } | undefined)?.tieuDe ?? "")) return null;
      s = ghep(`Điểm chuẩn ${ma}${nganh ? ` ngành ${nganh}` : ""} năm ${chu(d.nam)}: ${chu(d.diemChuan)} điểm, tổ hợp ${chu(d.toHop)}, phương thức ${chu(d.phuongThuc)}.`, d.tieuChiPhu && `Tiêu chí phụ: ${chu(d.tieuChiPhu)}.`);
      break;
    case "announcement":
      s = ghep(`Thông báo${ma ? ` ${ma}` : ""}: ${chu(d.tieuDe)}.`, chu(d.tomTat), d.ngayHetHan && `Hết hạn ${chu(d.ngayHetHan)}.`);
      break;
    case "noi_luu_tru": {
      const ktx = ({ co: "có ký túc xá", khong: "không có ký túc xá", chua_ro: "chưa rõ ký túc xá" } as Record<string, string>)[chu(d.coKyTucXa)] ?? "";
      const tro = ({ nhieu: "nhiều", it: "ít", khong: "không có", chua_ro: "chưa rõ" } as Record<string, string>)[chu(d.khuTroXungQuanh)] ?? "";
      s = ghep(`Nơi ở quanh ${ma} (cộng đồng, chưa chính thức):`, `${ktx}${tro ? `, khu trọ xung quanh ${tro}` : ""}.`, khoang(d.giaKyTucThang) && `Ký túc xá ${khoang(d.giaKyTucThang)} nghìn đồng/tháng.`, khoang(d.giaTroThang) && `Trọ ${khoang(d.giaTroThang)} nghìn đồng/tháng.`, d.khoangCachKm !== undefined && `Cách trường ${chu(d.khoangCachKm)} km.`, chu(d.ghiChu));
      break;
    }
    case "luu_y":
      s = ghep(`Lưu ý về ${ma} (cộng đồng, chưa chính thức): ${chu(d.tieuDe)}.`, chu(d.noiDung));
      break;
    case "review":
      // Đánh giá chưa có khuôn cố định: gom các trường chữ/số, bỏ trường kỹ thuật.
      s = ghep(`Đánh giá về ${ma} (cộng đồng, chưa chính thức):`, ...Object.entries(d).filter(([k, v]) => !["maTruong", "nguon", "capNhatLuc", "id"].includes(k) && chu(v)).map(([k, v]) => `${k}: ${chu(v)}.`));
      break;
    default:
      return null;
  }
  return cat(s, DAI_TOI_DA);
}

export const vanBanCuaBanGhi = (bg: BanGhiCms) => vanBanCuaMuc(mucTuBanGhi(bg, String(bg.version)));

function metaCua(m: MucChiMuc, vanBan: string): VectorMeta {
  const ma = chu(m.data.maTruong).toUpperCase();
  const nguon = m.data.nguon as { url?: string } | undefined;
  return {
    maTruong: ma, tinh: chu(m.data.tinh) || tinhCuaTruong(ma) || "khong-ro", loai: m.loai, phienBan: m.phienBan,
    chinhThuc: !LOAI_CONG_DONG.includes(m.loai),
    noiDung: vanBan, // Vectorize không lưu nội dung gốc: giữ ngay trong metadata (<= 600 ký tự, xa mức 10 KiB/vector)
    nguon: cat(chu(nguon?.url), 300),
  };
}

export interface KetQuaCapNhat { daLam: boolean; soBanGhi: number; soXoa?: number; loi?: string }

/** Nhúng và upsert các mục đổi, xóa các mã vector đã hết hiệu lực. Không ném lỗi. `pb` = mã phiên bản dữ liệu ghi vào metadata. */
export async function capNhatChiMuc(env: EnvAI, doi: Dau[], xoa: (Dau | string)[] = [], pb = ""): Promise<KetQuaCapNhat> {
  if (!env.AI || !env.VECTORIZE) return { daLam: false, soBanGhi: 0 };
  let soBanGhi = 0;
  try {
    const kemVan = doi.map((x) => aMuc(x, pb)).map((m) => ({ m, v: vanBanCuaMuc(m) })).filter((x): x is { m: MucChiMuc; v: string } => x.v !== null);
    for (let i = 0; i < kemVan.length; i += LO_UPSERT) {
      const lo = kemVan.slice(i, i + LO_UPSERT);
      const vec = await nhungVanBan(env.AI, lo.map((x) => x.v));
      if (!vec) return { daLam: false, soBanGhi, loi: "nhung-loi" };
      const ghi: VectorGhi[] = lo.map((x, j) => ({ id: x.m.id, values: vec[j], metadata: metaCua(x.m, x.v) }));
      await env.VECTORIZE.upsert(ghi);
      soBanGhi += ghi.length;
    }
    const ids = xoa.map((x) => (typeof x === "string" ? x : aMuc(x, pb).id));
    for (let i = 0; i < ids.length; i += LO_UPSERT) await env.VECTORIZE.deleteByIds(ids.slice(i, i + LO_UPSERT));
    return { daLam: true, soBanGhi, soXoa: ids.length };
  } catch (e) {
    return { daLam: false, soBanGhi, loi: e instanceof Error ? e.message : "loi-la" };
  }
}

export interface MangChiMuc { id: string; diem: number; noiDung: string; chinhThuc: boolean; maTruong: string; tinh: string; loai: string; nguon: string }

export interface BoLoc { tinh?: string; maTruong?: string; k?: number }

/** Nhúng câu hỏi MỘT lần rồi chạy song song nhiều truy vấn (mỗi bộ lọc một truy vấn; bộ lọc rỗng = toàn kho). Mỗi phần tử là kết quả một truy vấn; null = lỗi. */
export async function truyVanNhieuBoLoc(env: EnvAI, cauHoi: string, bo: BoLoc[]): Promise<(MangChiMuc[] | null)[] | null> {
  if (!env.AI || !env.VECTORIZE || !cauHoi.trim() || !bo.length) return null;
  try {
    const vec = await nhungVanBan(env.AI, [cauHoi]);
    if (!vec) return null;
    const kho = env.VECTORIZE;
    return await Promise.all(bo.map(async (o) => {
      try {
        const filter: Record<string, unknown> = {};
        if (o.maTruong) filter.maTruong = o.maTruong.toUpperCase();
        else if (o.tinh) filter.tinh = { $in: tinhGanKe(o.tinh) };
        const r = await kho.query(vec[0], { topK: Math.min(o.k ?? 6, 20), returnMetadata: "all", ...(Object.keys(filter).length ? { filter } : {}) });
        return r.matches.map((m): MangChiMuc => ({
          id: m.id, diem: m.score, noiDung: chu(m.metadata?.noiDung), chinhThuc: m.metadata?.chinhThuc === true,
          maTruong: chu(m.metadata?.maTruong), tinh: chu(m.metadata?.tinh), loai: chu(m.metadata?.loai), nguon: chu(m.metadata?.nguon),
        }));
      } catch { return null; }
    }));
  } catch {
    return null;
  }
}

/** Truy vấn ngữ nghĩa; `tinh` mở rộng sang các tỉnh giáp ranh. null = không dùng được vector (thiếu binding hoặc lỗi). */
export async function truyVanChiMuc(env: EnvAI, cauHoi: string, o: BoLoc = {}): Promise<MangChiMuc[] | null> {
  const r = await truyVanNhieuBoLoc(env, cauHoi, [o]);
  return r?.[0] ?? null;
}
