// Chặng của học sinh: một hàm duy nhất, thuần TS, không đọc/ghi thêm gì vào localStorage.
// Các màn chỉ gọi changCuaEm(s) để đổi lời chào, việc ưu tiên, đếm ngược; không tách màn riêng cho từng chặng.
import type { AppState } from "./store";

/** dinhHuong: lớp 10-11, nuocRut: lớp 12, thiLai: đã tốt nghiệp thi lại. */
export type Chang = "dinhHuong" | "nuocRut" | "thiLai";

/** Giá trị `HoSo.giaiDoan` đánh dấu em đã tốt nghiệp (dùng chung với danh sách chọn ở khoi-dau). */
export const GIAI_DOAN_DA_TOT_NGHIEP = "Đã tốt nghiệp THPT";

export function changCuaEm(s: Pick<AppState, "hoSo">): Chang {
  if (s.hoSo.giaiDoan === GIAI_DOAN_DA_TOT_NGHIEP) return "thiLai";
  if (s.hoSo.khoi === 12) return "nuocRut";
  return "dinhHuong";
}

/** Nhãn lớp ngắn để hiện ở Hồ sơ và bản tóm tắt; rỗng khi em chưa chọn lớp. */
export function nhanLop(hoSo: Pick<AppState["hoSo"], "khoi" | "giaiDoan">): string {
  if (hoSo.giaiDoan === GIAI_DOAN_DA_TOT_NGHIEP) return "Đã tốt nghiệp, thi lại";
  if (hoSo.khoi === 12) return "Lớp 12";
  if (hoSo.khoi === 11) return "Lớp 10 – 11";
  return "";
}

/** Chỉ chặng đang chuẩn bị thi mới có đếm ngược kỳ thi. */
export const coDemNguoc = (c: Chang): boolean => c !== "dinhHuong";
