// Truy cập D1: chỉ prepared statements (bind), mọi truy vấn danh sách có LIMIT. Tên cột snake_case <-> kiểu camelCase dùng chung.
import type { VaiTro } from "../../../src/data/dong-gop-kiem-tra";
import type { KhoD1, KhoD1Cau } from "./kieu";

/** Trần cho truy vấn gom (tiến độ, bản chụp): đọc theo trang, dừng cứng để không quét vô hạn. */
export const TRANG_GOM = 1000;
export const TRAN_DONG_GOM = 20_000;
export const TOI_DA_PHAN_CONG = 200;

export async function vaiTroCua(d1: KhoD1, email: string): Promise<VaiTro | null> {
  const r = await d1.prepare("SELECT vai_tro FROM quan_tri WHERE email = ? LIMIT 1").bind(email).first<{ vai_tro: VaiTro }>();
  return r?.vai_tro ?? null;
}

/** Tạo qtv đầu tiên một cách nguyên tử: chỉ chèn khi bảng còn rỗng. Trả true nếu vừa tạo. */
export async function taoQtvDauTien(d1: KhoD1, email: string, luc: string): Promise<boolean> {
  const r = await d1.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) SELECT ?, 'qtv', ? WHERE NOT EXISTS (SELECT 1 FROM quan_tri)").bind(email, luc).run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function truongDuocGiao(d1: KhoD1, email: string): Promise<string[]> {
  const r = await d1.prepare("SELECT ma_truong FROM phan_cong WHERE email = ? ORDER BY ma_truong LIMIT ?").bind(email, TOI_DA_PHAN_CONG).all<{ ma_truong: string }>();
  return r.results.map((x) => x.ma_truong);
}

export async function coPhanCong(d1: KhoD1, email: string, maTruong: string): Promise<string[]> {
  const r = await d1.prepare("SELECT ma_truong FROM phan_cong WHERE email = ? AND ma_truong = ? LIMIT 1").bind(email, maTruong).first();
  return r ? [maTruong] : [];
}

export const cauNhatKy = (d1: KhoD1, ai: string, hanhDong: string, doiTuong: string, luc: string): KhoD1Cau =>
  d1.prepare("INSERT INTO nhat_ky (ai, hanh_dong, doi_tuong, luc) VALUES (?, ?, ?, ?)").bind(ai, hanhDong, doiTuong, luc);

export const ghiNhatKy = async (d1: KhoD1, ai: string, hanhDong: string, doiTuong: string, luc: string) => { await cauNhatKy(d1, ai, hanhDong, doiTuong, luc).run(); };

/** Đọc mọi trang của một truy vấn có khóa phân trang, dừng cứng ở TRAN_DONG_GOM. `cau(conLai)` trả câu đã bind với LIMIT TRANG_GOM. */
export async function docHetTheoKhoa<T>(d1: KhoD1, sql: string, khoaCot: keyof T & string): Promise<T[]> {
  const ra: T[] = [];
  let sau = "";
  for (;;) {
    const r = await d1.prepare(sql).bind(sau, TRANG_GOM).all<T>();
    ra.push(...r.results);
    if (r.results.length < TRANG_GOM) return ra;
    if (ra.length >= TRAN_DONG_GOM) throw new Error("Quá nhiều dòng để gom, cần tăng trần hoặc đổi cách gom");
    sau = String(r.results[r.results.length - 1][khoaCot]);
  }
}
