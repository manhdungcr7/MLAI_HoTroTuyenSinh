// Điểm chuẩn dự đoán của mô hình học máy (LightGBM hồi quy phân vị), tính sẵn cho từng chương trình bằng ml/huan-luyen-2027.py.
// Dữ liệu là tệp tĩnh (mỗi chương trình: cận thấp, mức giữa, cận cao, năm điểm làm cơ sở), nạp một lần khi cần, không chạy mô hình trong trình duyệt.
import fingerprint from "./du-lieu-fingerprint.json";

export interface DuBaoML { thap: number; giua: number; cao: number; namCoSo: number }
export interface MetaDuBaoML {
  namDuBao: number;
  catalogSha256?: string;
  moHinh: string;
  mucTinCay: number;
  heSoHieuChinh: number;
  taoLuc: string;
  kiemDinh: { phuGop: number; phuNgoaiMau: number; winkler: number; winklerHeuristicCu: number };
}
interface Kho { meta: MetaDuBaoML; ds: Record<string, [number, number, number, number]> }

let kho: Kho | null = null;
let hua: Promise<Kho | null> | null = null;

/** Nạp tệp dự báo (một lần). Lỗi mạng thì trả null: giao diện chỉ ẩn dòng dự báo, không ảnh hưởng phần còn lại. */
export function napDuBaoML(): Promise<Kho | null> {
  return (hua ??= import("./du-bao-2027.json").then((m) => {
    const duBao = (m as unknown as { default: Kho }).default;
    // Dấu vân tay = băm điểm gốc + bản ghi đè (ml/thu-nghiem.py). Dữ liệu điểm đổi sau huấn luyện thì không áp dụng dự báo ML cũ cho học sinh.
    return (kho = duBao.meta.catalogSha256 === fingerprint.sha256 ? duBao : null);
  }).catch(() => null));
}

/** Dự báo của một chương trình nếu tệp đã nạp xong và có chương trình đó (chỉ chương trình xét điểm thi THPT có điểm từ 2024). */
export function duBaoMLCua(id: string): DuBaoML | null {
  const v = kho?.ds[id];
  return v ? { thap: v[0], giua: v[1], cao: v[2], namCoSo: v[3] } : null;
}

export const metaDuBaoML = (): MetaDuBaoML | null => kho?.meta ?? null;
