// Dựng SuKien từ dữ liệu thật (du-lieu-that.json) giống cách app gửi lên, để đo AI trên đúng loại đầu vào.
import fs from "node:fs";
import path from "node:path";
import type { SuKien } from "../../src/engine/tu-van";

interface Dong { id: string; ma: string; truong: string; nganh: string; tinh: string; pt: string; toHop: string[]; diem: Record<string, number>; nguon: string | null; tier: string | null }
const DS = JSON.parse(fs.readFileSync(path.join("src", "data", "du-lieu-that.json"), "utf8")) as Dong[];
const khongDau = (t: string) => t.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function timDong(ma: string, tuKhoa: string): Dong {
  const d = DS.find((x) => x.ma === ma && khongDau(x.nganh).includes(khongDau(tuKhoa)) && x.pt === "THPT");
  if (!d) throw new Error(`Không thấy ${ma} / ${tuKhoa}`);
  return d;
}

/** Nhãn theo chênh điểm: dưới 0 Thử sức, dưới 1,5 Vừa sức, dưới 4 An toàn, còn lại Dự phòng (đúng ngưỡng của app). */
export const nhanTheoChenh = (c: number) => (c < 0 ? "Thử sức" : c < 1.5 ? "Vừa sức" : c < 4 ? "An toàn" : "Dự phòng");

export function suKien(ma: string, tuKhoa: string, tongCuaEm?: number): SuKien {
  const d = timDong(ma, tuKhoa);
  const nam = Object.keys(d.diem).sort().reverse()[0];
  const chenh = tongCuaEm !== undefined ? Math.round((tongCuaEm - d.diem[nam]) * 100) / 100 : undefined;
  return {
    id: d.id, nganh: d.nganh, truong: d.ma, tenTruong: d.truong, tinh: d.tinh, phuongThuc: d.pt, toHop: d.toHop, diem: d.diem,
    ...(tongCuaEm !== undefined && chenh !== undefined ? { tongCuaEm, chenh, nhanCuaEm: nhanTheoChenh(chenh), toHopDaTinh: d.toHop[0] } : {}),
    nguon: d.tier === "official_pdf" ? "Đề án tuyển sinh" : "Trang tổng hợp, chưa đối chiếu",
  };
}
