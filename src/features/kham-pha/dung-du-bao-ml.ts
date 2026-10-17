import { useEffect, useState } from "react";
import { metaDuBaoML, napDuBaoML } from "@/data/du-bao-ml";

/** Nạp dự báo của mô hình học máy khi màn hình cần; trả true khi đã sẵn sàng (để màn hình vẽ lại). */
export function useDuBaoML(): boolean {
  const [san, setSan] = useState(() => metaDuBaoML() !== null);
  useEffect(() => {
    let con = true;
    napDuBaoML().then((k) => { if (con) setSan(k !== null); });
    return () => { con = false; };
  }, []);
  return san;
}
