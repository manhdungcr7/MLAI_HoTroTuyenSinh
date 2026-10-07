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
