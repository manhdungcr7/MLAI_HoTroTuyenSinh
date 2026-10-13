// Ai được thêm/đổi vai/xóa ai trong CMS. Hàm thuần, dùng chung cho máy chủ (ép quyền) và giao diện (ẩn nút).
import type { VaiTro } from "./dong-gop-kiem-tra";

export type HanhDongNguoi = "them" | "doi-vai" | "xoa" | "dat-lai-mat-khau";

/** Vai đích mà mỗi vai người thực hiện được tác động, theo hành động. sa: tất cả; qtv: chỉ ctv; ctv: không. */
const BANG_QUAN_LY: Record<VaiTro, Record<HanhDongNguoi, readonly VaiTro[]>> = {
  sa: { them: ["sa", "qtv", "ctv"], "doi-vai": ["sa", "qtv", "ctv"], xoa: ["sa", "qtv", "ctv"], "dat-lai-mat-khau": ["sa", "qtv", "ctv"] },
  qtv: { them: ["ctv"], "doi-vai": ["ctv"], xoa: ["ctv"], "dat-lai-mat-khau": ["ctv"] },
  ctv: { them: [], "doi-vai": [], xoa: [], "dat-lai-mat-khau": [] },
};

/** Người có vai `nguoiLam` được `hanhDong` lên người có vai `vaiDich` không. Đổi vai thì kiểm cả vai hiện tại lẫn vai mới. */
export const duocQuanLy = (nguoiLam: VaiTro, vaiDich: VaiTro, hanhDong: HanhDongNguoi): boolean => BANG_QUAN_LY[nguoiLam]?.[hanhDong]?.includes(vaiDich) ?? false;
