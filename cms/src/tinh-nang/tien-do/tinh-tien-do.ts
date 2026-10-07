// Tổng hợp tiến độ nhiều trường và chọn trường kế tiếp còn thiếu. Thuần TypeScript.
import { MUC_CAN_DU, type MucTienDo, type TienDoTruong } from "@/data/dong-gop-kiem-tra";

export interface TongHopTienDo {
  tong: number;
  du: number;
  /** Số trường còn thiếu từng mục. */
  thieuTheoMuc: Record<MucTienDo, number>;
  /** Phần trăm trường đã đủ (0-100). */
  phanTram: number;
  conThieu: TienDoTruong[];
}

export function tongHopTienDo(ds: readonly TienDoTruong[]): TongHopTienDo {
  const thieuTheoMuc = Object.fromEntries(MUC_CAN_DU.map((m) => [m, 0])) as Record<MucTienDo, number>;
  for (const t of ds) for (const m of t.thieu) thieuTheoMuc[m] = (thieuTheoMuc[m] ?? 0) + 1;
  const conThieu = ds.filter((t) => !t.du);
  const du = ds.length - conThieu.length;
  return { tong: ds.length, du, thieuTheoMuc, phanTram: ds.length ? Math.round((du / ds.length) * 100) : 0, conThieu };
}

/** Trường còn thiếu đứng ngay sau `sauMa` trong danh sách (quay vòng). Không có `sauMa` thì lấy trường đầu tiên còn thiếu. */
export function truongKeTiep(ds: readonly TienDoTruong[], sauMa?: string): TienDoTruong | undefined {
  if (!ds.length) return undefined;
  const bat = Math.max(0, ds.findIndex((t) => t.maTruong === sauMa) + 1);
  for (let i = 0; i < ds.length; i++) {
    const t = ds[(bat + i) % ds.length];
    if (!t.du && t.maTruong !== sauMa) return t;
  }
  return undefined;
}
