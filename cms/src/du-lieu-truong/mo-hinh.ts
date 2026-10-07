// Cầu nối giữa biểu mẫu (học phí, học bổng, nơi lưu trú, đánh giá, lưu ý) và bản ghi CMS (/api/ban-ghi).
// Thuần TypeScript, không React. Nội dung `data` giữ đúng hình dạng đã kiểm tra ở biểu mẫu, thêm `maTruong`, `id`, `nam`.
import {
  MUC_CAN_DU, type MucTienDo, type ThongTinTruong, type TienDoTruong, type LoaiThongTin,
} from "@/data/dong-gop-kiem-tra";
import type { BanGhiCms, NguonGui, TrangThaiCms } from "@cms/may-chu/ban-ghi-api";
import { bodyTuForm, formTuBanGhi, type FormThongTin, type LoaiThemTay } from "./bieu-mau";

/** Loại thực thể CMS ứng với từng loại thông tin trong biểu mẫu. */
export const THUC_THE_CUA: Record<LoaiThemTay, string> = {
  hoc_phi: "tuition", hoc_bong: "scholarship", noi_luu_tru: "noi_luu_tru", review: "review", luu_y: "luu_y",
};
const LOAI_CUA_THUC_THE = Object.fromEntries(Object.entries(THUC_THE_CUA).map(([l, t]) => [t, l])) as Record<string, LoaiThemTay>;

export const loaiTuBanGhi = (b: Pick<BanGhiCms, "entityType">): LoaiThemTay | null => LOAI_CUA_THUC_THE[b.entityType] ?? null;
export const laKenh = (b: Pick<BanGhiCms, "entityType">) => b.entityType === "school";

/** Mã trường của một entityId: phần trước dấu "-" đầu tiên (BKA-HP2026 -> BKA). Giống quy tắc ở máy chủ. */
export const maTruongCua = (entityId: string): string => entityId.split("-")[0].toUpperCase();

export const boDau = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
export const slug = (s: string, toiDa = 24): string => boDau(s).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, toiDa) || "x";

/** Mã định danh ổn định của một mục: cùng trường + cùng năm + cùng phạm vi thì cùng mã, nên không tạo trùng. */
export function entityIdCho(loai: LoaiThemTay, ma: string, f: FormThongTin, ngauNhien: () => string = () => Math.random().toString(36).slice(2, 8)): string {
  switch (loai) {
    case "hoc_phi": return `${ma}-HP${f.nam.trim()}-${slug(f.phamVi)}`;
    case "hoc_bong": return `${ma}-HB-${slug(f.ten)}`;
    case "noi_luu_tru": return `${ma}-NLT`;
    case "review": return `${ma}-RV-${ngauNhien()}`;
    case "luu_y": return `${ma}-LY${f.nam.trim()}-${slug(f.tieuDe)}`;
  }
}

/** Trạng thái hiển thị cho người không rành kỹ thuật. */
export const NHAN_TT: Record<TrangThaiCms, string> = {
  DRAFT: "Bản nháp", SUBMITTED: "Chờ duyệt", IN_REVIEW: "Đang xem xét", APPROVED: "Đã duyệt, chờ xuất bản",
  PUBLISHED: "Đang chạy", REJECTED: "Bị trả lại", ARCHIVED: "Đã lưu trữ", SUPERSEDED: "Bản cũ",
};
export const TONE_TT: Record<TrangThaiCms, "muc" | "cam" | "luc" | "xanh" | "do" | "tim"> = {
  DRAFT: "muc", SUBMITTED: "cam", IN_REVIEW: "cam", APPROVED: "xanh", PUBLISHED: "luc", REJECTED: "do", ARCHIVED: "muc", SUPERSEDED: "muc",
};
/** Đang ở giai đoạn soạn/duyệt (chưa lên web). */
export const DANG_MO: readonly TrangThaiCms[] = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED"];
/** Đã gửi hoặc đã lên web: tính là "có dữ liệu" khi đếm mục còn thiếu. */
export const TINH_LA_CO: readonly TrangThaiCms[] = ["SUBMITTED", "IN_REVIEW", "APPROVED", "PUBLISHED"];
export const SUA_DUOC: readonly TrangThaiCms[] = ["DRAFT", "REJECTED", "PUBLISHED"];

/** Dựng `data` gửi máy chủ từ biểu mẫu đã kiểm tra. */
export function dataTuForm(loai: LoaiThemTay, ma: string, entityId: string, f: FormThongTin): Record<string, unknown> {
  const b = bodyTuForm(loai, f);
  const d: Record<string, unknown> = { ...b.duLieu, id: entityId, maTruong: ma };
  if (typeof b.nam === "number") d.nam = b.nam;
  if (loai === "hoc_bong") d.tenHocBong = f.ten;
  for (const k of Object.keys(d)) if (d[k] === undefined) delete d[k];
  return d;
}

/** Nguồn gửi lên: link, tên trang/văn bản nguồn, và ai công bố. */
export const nguonTuForm = (f: { linkNguon: string; tieuDeNguon: string; donViCongBo: string }): NguonGui =>
  ({ url: f.linkNguon.trim(), tieuDe: f.tieuDeNguon.trim(), donViCongBo: f.donViCongBo.trim() });

/** Đưa bản ghi CMS về dạng thông tin cũ để dùng lại các hàm định dạng và đổ biểu mẫu. */
export function thongTinTuBanGhi(b: BanGhiCms): ThongTinTruong | null {
  const loai = loaiTuBanGhi(b);
  if (!loai) return null;
  const d = (b.data ?? {}) as Record<string, unknown>;
  const duLieu = { ...d } as Record<string, unknown>;
  delete duLieu.id; delete duLieu.maTruong; delete duLieu.nam; delete duLieu.tenHocBong;
  if (loai === "hoc_bong") duLieu.ten = typeof d.ten === "string" ? d.ten : d.tenHocBong;
  return {
    id: b.id, maTruong: maTruongCua(b.entityId), loai, nam: typeof d.nam === "number" ? d.nam : undefined, linkNguon: b.source.url,
    trangThai: "nhap", phienBan: b.version, nguoiDang: b.createdBy, luc: b.updatedAt, duLieu,
  } as unknown as ThongTinTruong;
}

export function formTuBan(b: BanGhiCms): FormThongTin & { tieuDeNguon: string; donViCongBo: string; ghiChuThayDoi: string } {
  const tt = thongTinTuBanGhi(b);
  const f = tt ? formTuBanGhi(tt) : formTuBanGhi({ id: "", maTruong: "", loai: "khac", trangThai: "nhap", phienBan: 1, luc: "", duLieu: { tieuDe: "", noiDung: "" } });
  return { ...f, linkNguon: b.source.url, tieuDeNguon: b.source.tieuDe, donViCongBo: b.source.donViCongBo, ghiChuThayDoi: "" };
}

/** Bản "đại diện" của mỗi mục: bản đang soạn/duyệt nếu có, không thì bản đang chạy. Bỏ bản cũ và bản lưu trữ. */
export function banDaiDien(ds: readonly BanGhiCms[]): BanGhiCms[] {
  const theoMuc = new Map<string, BanGhiCms[]>();
  for (const b of ds) {
    if (b.status === "ARCHIVED" || b.status === "SUPERSEDED") continue;
    const k = `${b.entityType}|${b.entityId}`;
    (theoMuc.get(k) ?? theoMuc.set(k, []).get(k)!).push(b);
  }
  const ra: BanGhiCms[] = [];
  for (const nhom of theoMuc.values()) {
    nhom.sort((a, b) => b.version - a.version || b.updatedAt.localeCompare(a.updatedAt));
    ra.push(nhom.find((b) => b.status !== "PUBLISHED") ?? nhom[0]);
  }
  return ra.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const kenhDu = (d: Record<string, unknown>) => ["websiteTuyenSinhUrl", "fanpageUrl", "nhomTuyenSinhChinhThucUrl", "nhomCongDongUrl"].some((k) => typeof d[k] === "string" && d[k]);

/** Mục nào của trường đã có, mục nào còn thiếu, tính từ các bản ghi CMS. */
export function tienDoTuBanGhi(ma: string, ds: readonly BanGhiCms[]): TienDoTruong {
  const co = new Set<MucTienDo>();
  for (const b of ds) {
    if (maTruongCua(b.entityId) !== ma || !TINH_LA_CO.includes(b.status)) continue;
    if (laKenh(b)) { if (kenhDu((b.data ?? {}) as Record<string, unknown>)) co.add("kenh"); continue; }
    const l = loaiTuBanGhi(b);
    if (l) co.add(l as LoaiThongTin);
  }
  const thieu = MUC_CAN_DU.filter((m) => !co.has(m));
  return { maTruong: ma, co: MUC_CAN_DU.filter((m) => co.has(m)), thieu: [...thieu], du: thieu.length === 0 };
}

/** Nhóm bản ghi theo mã trường một lần để không phải lọc lại cho từng trường. */
export function nhomTheoTruong(ds: readonly BanGhiCms[]): Map<string, BanGhiCms[]> {
  const m = new Map<string, BanGhiCms[]>();
  for (const b of ds) { const ma = maTruongCua(b.entityId); (m.get(ma) ?? m.set(ma, []).get(ma)!).push(b); }
  return m;
}
