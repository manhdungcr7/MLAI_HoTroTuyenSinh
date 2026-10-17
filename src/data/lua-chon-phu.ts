// Hàm phụ cho dữ liệu lựa chọn: học phí và việc làm chỉ có khi đề án hoặc dữ liệu đo được, nên có thể để trống.
import type { LuaChon } from "@/state/types";

export const CHUA_CO_HOC_PHI = "Chưa có dữ liệu học phí";

export const coHocPhi = (l: Pick<LuaChon, "hocPhiMin" | "hocPhiMax" | "nguonHocPhi">): boolean =>
  typeof l.hocPhiMin === "number" && typeof l.hocPhiMax === "number" && !!l.nguonHocPhi?.url;

/** "35 – 45" (triệu đồng/năm), hoặc "chưa có" khi chưa có chứng cứ sơ cấp. */
export const hocPhiChu = (l: Pick<LuaChon, "hocPhiMin" | "hocPhiMax" | "nguonHocPhi">): string => {
  if (!coHocPhi(l)) return "chưa có";
  const d = (x: number) => String(x).replace(".", ",");
  const so = l.hocPhiMin === l.hocPhiMax ? d(l.hocPhiMin!) : `${d(l.hocPhiMin!)} – ${d(l.hocPhiMax!)}`;
  return so;
};

/** Tương thích dữ liệu cũ; học phí ước tính không còn được đưa vào danh mục. */
export const ghiUocTinh = (_l: { hocPhiUocTinh?: boolean }): string => "";

/** Học phí có vượt ngân sách không; chưa biết học phí thì không coi là vượt. */
export const vuotNganSach = (l: Pick<LuaChon, "hocPhiMin" | "hocPhiMax">, nganSach: number): boolean => coHocPhi(l) && (l.hocPhiMin as number) > nganSach;

const PT_NGAN: Record<string, string> = { HOC_BA: "Học bạ", DGNL_HCM: "ĐGNL", DGNL_HN: "ĐGNL", DGNL_KHAC: "ĐGNL", DGTD: "Đánh giá tư duy", KET_HOP: "Xét kết hợp", NANG_KHIEU: "Năng khiếu" };
/** Tên ngắn của phương thức để gắn lên thẻ khi khác thi THPT (cùng một ngành có thể có nhiều dòng điểm theo phương thức). */
export const phuongThucNgan = (l: Pick<LuaChon, "phuongThuc">): string => (l.phuongThuc ? PT_NGAN[l.phuongThuc] ?? "" : "");
