// Hook nạp dữ liệu từ máy chủ với đủ bốn trạng thái: đang tải, lỗi (nói thật), trống/có dữ liệu do màn tự xét.
import { useCallback, useEffect, useRef, useState } from "react";
import { thongBaoLoi } from "@cms/may-chu/api";

export interface KetQuaTai<T> {
  du: T | null;
  dangTai: boolean;
  loi: string | null;
  taiLai: () => void;
}

/** `lay` chạy lại mỗi khi `khoa` đổi. Kết quả cũ về muộn bị bỏ, không ghi đè kết quả mới. */
export function useTai<T>(lay: () => Promise<T>, khoa: string = ""): KetQuaTai<T> {
  const [du, setDu] = useState<T | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const lanGoi = useRef(0);
  const layRef = useRef(lay);
  layRef.current = lay;

  const taiLai = useCallback(() => {
    const lan = ++lanGoi.current;
    setDangTai(true);
    setLoi(null);
    layRef.current()
      .then((v) => { if (lan === lanGoi.current) { setDu(v); setDangTai(false); } })
      .catch((e: unknown) => { if (lan === lanGoi.current) { setLoi(thongBaoLoi(e)); setDangTai(false); } });
  }, []);

  useEffect(() => {
    taiLai();
    return () => { lanGoi.current++; };
  }, [taiLai, khoa]);

  return { du, dangTai, loi, taiLai };
}
