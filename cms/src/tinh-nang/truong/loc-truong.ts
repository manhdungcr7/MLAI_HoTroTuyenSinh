// Logic thuần của danh sách trường: gộp, lọc, sắp xếp, tỉ lệ đủ. Không React.
import { MUC_CAN_DU, tienDoTruong, type BanGhiTruong, type MucTienDo, type TienDoTruong } from "@/data/dong-gop-kiem-tra";
import type { TruongCoBan } from "@cms/du-lieu/danh-sach-truong";

export interface DongTruong extends TruongCoBan { tienDo: TienDoTruong; kenh?: BanGhiTruong; giaoChoToi: boolean }
export type ChipLoc = "thieuHocPhi" | "thieuNoiLuuTru" | "chuaCoKenh" | "giaoChoToi";
export const CAC_CHIP: { id: ChipLoc; nhan: string }[] = [
  { id: "thieuHocPhi", nhan: "Thiếu học phí" },
  { id: "thieuNoiLuuTru", nhan: "Thiếu nơi lưu trú" },
  { id: "chuaCoKenh", nhan: "Chưa có kênh" },
  { id: "giaoChoToi", nhan: "Giao cho tôi" },
];
const MUC_CUA_CHIP: Partial<Record<ChipLoc, MucTienDo>> = { thieuHocPhi: "hoc_phi", thieuNoiLuuTru: "noi_luu_tru", chuaCoKenh: "kenh" };

export const SO_MUC_CAN_DU = MUC_CAN_DU.length;

export const khongDau = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

/** Danh sách đầy đủ lấy từ tệp trường; số liệu tiến độ lấy từ API. Trường API chưa trả về coi như còn thiếu mọi mục. */
export function gopTruong(
  danhSach: readonly TruongCoBan[],
  tuApi: readonly { maTruong: string; kenh?: BanGhiTruong; tienDo: TienDoTruong }[],
  maGiao: readonly string[] = [],
): DongTruong[] {
  const theoMa = new Map(tuApi.map((x) => [x.maTruong, x]));
  const giao = new Set(maGiao);
  return danhSach.map((t) => {
    const a = theoMa.get(t.ma);
    return { ...t, kenh: a?.kenh, tienDo: a?.tienDo ?? tienDoTruong(t.ma, undefined, []), giaoChoToi: giao.has(t.ma) };
  });
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
