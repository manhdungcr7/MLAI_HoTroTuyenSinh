// Logic thuần của danh sách trường: gộp, lọc, sắp xếp, tỉ lệ đủ. Không React.
import { MUC_CAN_DU, type BanGhiTruong, type MucTienDo, type TienDoTruong } from "@/data/dong-gop-kiem-tra";

export interface DongTruong { ma: string; ten: string; tienDo: TienDoTruong; kenh?: BanGhiTruong; giaoChoToi: boolean }
export type ChipLoc = "thieuHocPhi" | "thieuNoiLuuTru" | "chuaCoKenh" | "giaoChoToi";
export const CAC_CHIP: { id: ChipLoc; nhan: string; tham: string }[] = [
  { id: "thieuHocPhi", nhan: "Thiếu học phí", tham: "thieu-hoc-phi" },
  { id: "thieuNoiLuuTru", nhan: "Thiếu nơi ở", tham: "thieu-noi-luu-tru" },
  { id: "chuaCoKenh", nhan: "Chưa có kênh", tham: "chua-co-kenh" },
  { id: "giaoChoToi", nhan: "Giao cho tôi", tham: "giao-cho-toi" },
];
const MUC_CUA_CHIP: Partial<Record<ChipLoc, MucTienDo>> = { thieuHocPhi: "hoc_phi", thieuNoiLuuTru: "noi_luu_tru", chuaCoKenh: "kenh" };

/** Đọc ?loc=thieu-hoc-phi từ đường dẫn (các lối tắt ở Tổng quan dùng). */
export const chipTuThamSo = (tham: string | null): ChipLoc | null => CAC_CHIP.find((c) => c.tham === tham)?.id ?? null;

export const SO_MUC_CAN_DU = MUC_CAN_DU.length;

export const khongDau = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

/** Danh sách trường lấy hoàn toàn từ máy chủ (tên, kênh, tiến độ). `maGiao` là mã trường giao cho người đang đăng nhập. */
export function gopTruong(
  tuApi: readonly { maTruong: string; ten?: string; kenh?: BanGhiTruong; tienDo: TienDoTruong }[],
  maGiao: readonly string[] = [],
): DongTruong[] {
  const giao = new Set(maGiao);
  return tuApi.map((a) => ({ ma: a.maTruong, ten: a.ten ?? a.maTruong, kenh: a.kenh, tienDo: a.tienDo, giaoChoToi: giao.has(a.maTruong) }));
}

/** Lọc theo ô tìm (tên hoặc mã, không phân biệt dấu) và các chip (chọn nhiều chip thì phải thỏa tất cả). */
export function locTruong(ds: readonly DongTruong[], q: string, chip: ReadonlySet<ChipLoc>): DongTruong[] {
  const tim = khongDau(q);
  return ds.filter((t) => {
    if (tim && !khongDau(t.ten).includes(tim) && !t.ma.toLowerCase().includes(tim)) return false;
    for (const c of chip) {
      if (c === "giaoChoToi") { if (!t.giaoChoToi) return false; continue; }
      const muc = MUC_CUA_CHIP[c];
      if (muc && !t.tienDo.thieu.includes(muc)) return false;
    }
    return true;
  });
}

export type KieuSapXep = "ten" | "thieu";
/** "ten": theo tên (tiếng Việt). "thieu": thiếu nhiều mục nhất lên đầu, bằng nhau thì theo tên. Không đổi mảng gốc. */
export function sapXepTruong(ds: readonly DongTruong[], kieu: KieuSapXep): DongTruong[] {
  const theoTen = (a: DongTruong, b: DongTruong) => a.ten.localeCompare(b.ten, "vi");
  return [...ds].sort(kieu === "ten" ? theoTen : (a, b) => b.tienDo.thieu.length - a.tienDo.thieu.length || theoTen(a, b));
}

/** Phần trăm mục đã đủ (0-100). */
export const tiLeDu = (t: TienDoTruong): number => Math.round(((SO_MUC_CAN_DU - t.thieu.length) / SO_MUC_CAN_DU) * 100);
