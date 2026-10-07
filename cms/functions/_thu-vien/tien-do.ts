// Tiến độ "đã đủ / thiếu" theo từng trường, tính bằng tienDoTruong dùng chung (bản ghi 'cho' và 'duyet').
import { tienDoTruong, type BanGhiTruong, type LoaiThongTin, type ThongTinTruong, type TienDoTruong } from "../../../src/data/dong-gop-kiem-tra";
import { banGhiTruongTuHang, docHetTheoKhoa, type HangTruong } from "./d1";
import type { KhoD1 } from "./kieu";

export interface DuLieuTienDo { kenh: Map<string, BanGhiTruong>; loai: Map<string, ThongTinTruong[]> }

/** Gom kênh và các loại đã có của mọi trường bằng vài truy vấn có phân trang theo khóa (không N+1). */
export async function gomTienDo(d1: KhoD1): Promise<DuLieuTienDo> {
  const hang = await docHetTheoKhoa<HangTruong>(d1, "SELECT * FROM truong_cong_dong WHERE ma_truong > ? ORDER BY ma_truong LIMIT ?", "ma_truong");
  const kenh = new Map(hang.map((h) => [h.ma_truong, banGhiTruongTuHang(h)]));
  const cap = await docHetTheoKhoa<{ k: string }>(
    d1,
    "SELECT DISTINCT ma_truong || '|' || loai AS k FROM thong_tin_truong WHERE trang_thai IN ('cho', 'duyet') AND (ma_truong || '|' || loai) > ? ORDER BY k LIMIT ?",
    "k",
  );
  const loai = new Map<string, ThongTinTruong[]>();
  for (const { k } of cap) {
    const i = k.lastIndexOf("|");
    const ma = k.slice(0, i);
    // tienDoTruong chỉ đọc maTruong, loai, trangThai
    (loai.get(ma) ?? loai.set(ma, []).get(ma)!).push({ maTruong: ma, loai: k.slice(i + 1) as LoaiThongTin, trangThai: "cho" } as unknown as ThongTinTruong);
  }
  return { kenh, loai };
}

export const tienDoCua = (ma: string, d: DuLieuTienDo): TienDoTruong => tienDoTruong(ma, d.kenh.get(ma), d.loai.get(ma) ?? []);
