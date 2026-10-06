import { useCallback, useEffect, useState } from "react";
import { BO_LOC_MAC_DINH, type BoLoc } from "./bo-loc";

const KHOA = "nvai:bo-loc";
// Bộ lọc nhớ trong phiên làm việc, dùng chung giữa màn Khám phá và màn Bộ lọc.
const nguoiNghe = new Set<(b: BoLoc) => void>();
let hienTai: BoLoc | null = null;

function doc(khuVucMacDinh?: string, nhomMacDinh?: string): BoLoc {
  if (hienTai) return hienTai;
  try {
    const t = sessionStorage.getItem(KHOA);
    // Gộp với mặc định để bộ lọc lưu từ bản cũ (thiếu trường mới) vẫn dùng được.
    if (t) return (hienTai = { ...BO_LOC_MAC_DINH, ...JSON.parse(t) });
  } catch { /* bỏ qua */ }
  return (hienTai = { ...BO_LOC_MAC_DINH, khuVuc: khuVucMacDinh ?? "", nhom: nhomMacDinh ?? "" });
}

export function useBoLoc(khuVucMacDinh?: string, nhomMacDinh?: string): [BoLoc, (p: Partial<BoLoc>) => void, () => void] {
  const [b, setB] = useState<BoLoc>(() => doc(khuVucMacDinh, nhomMacDinh));
  useEffect(() => { nguoiNghe.add(setB); return () => void nguoiNghe.delete(setB); }, []);
  const ghi = useCallback((moi: BoLoc) => {
    hienTai = moi;
    try { sessionStorage.setItem(KHOA, JSON.stringify(moi)); } catch { /* bỏ qua */ }
    nguoiNghe.forEach((f) => f(moi));
  }, []);
  const sua = useCallback((p: Partial<BoLoc>) => ghi({ ...(hienTai ?? BO_LOC_MAC_DINH), ...p }), [ghi]);
  const datLai = useCallback(() => ghi({ ...BO_LOC_MAC_DINH }), [ghi]);
  return [b, sua, datLai];
}
