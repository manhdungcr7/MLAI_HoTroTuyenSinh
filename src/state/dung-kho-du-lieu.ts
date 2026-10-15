import { useEffect, useState } from "react";
import { khoDuLieu } from "@/engine/du-lieu-tuyen-sinh/kho-du-lieu";
import { SU_KIEN_CAP_NHAT_DU_LIEU } from "@/engine/du-lieu-tuyen-sinh/bo-dong-bo";

/** Kho dữ liệu đã hợp nhất với bản xuất bản của CMS. Màn hình dựng lại khi bản mới về. */
export function useKhoDuLieu() {
  const [, dem] = useState(0);
  useEffect(() => {
    const khiCoMoi = () => setTimeout(() => dem((n) => n + 1), 0); // đợi kho nạp xong cache rồi mới dựng lại
    window.addEventListener(SU_KIEN_CAP_NHAT_DU_LIEU, khiCoMoi);
    return () => window.removeEventListener(SU_KIEN_CAP_NHAT_DU_LIEU, khiCoMoi);
  }, []);
  return khoDuLieu;
}

/** Số lần bản dữ liệu đã đổi. Gốc ứng dụng dùng làm `key` để dựng lại màn đang mở khi có bản CMS mới, vì mọi màn đọc danh mục dùng chung. */
export function useBanDuLieu(): number {
  const [ban, dem] = useState(0);
  useEffect(() => {
    const khiCoMoi = () => setTimeout(() => dem((n) => n + 1), 0); // đợi kho nạp xong rồi mới dựng lại
    window.addEventListener(SU_KIEN_CAP_NHAT_DU_LIEU, khiCoMoi);
    return () => window.removeEventListener(SU_KIEN_CAP_NHAT_DU_LIEU, khiCoMoi);
  }, []);
  return ban;
}

/**
 * Danh mục chương trình (nạp lười, ~1,8 MB) đã sẵn sàng chưa. Màn nào đọc `LUA_CHON_MAU`/`tim` phải chờ cờ này,
 * không được hiện danh mục rỗng như thể "không có kết quả". `loi` có giá trị khi tải thất bại; `thuLai` tải lại.
 */
export function useDuLieuSan(): { san: boolean; loi: boolean; thuLai: () => void } {
  const [lan, datLan] = useState(0); // đổi giá trị = dựng lại + thử lại
  const [loi, datLoi] = useState(false);
  const san = khoDuLieu.daSanSang();
  useEffect(() => {
    if (khoDuLieu.daSanSang()) return;
    let con = true;
    datLoi(false);
    khoDuLieu.sanSang().then(() => { if (con) datLan((n) => n + 1); }, () => { if (con) datLoi(true); });
    return () => { con = false; };
  }, [lan]);
  return { san, loi, thuLai: () => datLan((n) => n + 1) };
}
