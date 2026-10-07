// Trạng thái RIÊNG của một slice, lưu localStorage. Dùng khi slice cần nhớ thêm gì đó mà state/store.tsx chưa có.
// Không sửa store.tsx để thêm trường; dùng hook này với khóa bắt đầu bằng tên slice.
import { useCallback, useEffect, useState } from "react";

export function useLuuCucBo<T>(khoa: string, macDinh: T): [T, (v: T | ((c: T) => T)) => void] {
  const k = `nvai:${khoa}`;
  const [gia, setGia] = useState<T>(() => {
    try {
      const t = localStorage.getItem(k);
      return t ? ({ ...(macDinh as object), ...JSON.parse(t) } as T) : macDinh;
    } catch { return macDinh; }
  });
  useEffect(() => {
    try { localStorage.setItem(k, JSON.stringify(gia)); } catch { window.dispatchEvent(new Event("nvai-luu-loi")); /* store hiện banner báo không lưu được */ }
  }, [k, gia]);
  const dat = useCallback((v: T | ((c: T) => T)) => setGia(v), []);
  return [gia, dat];
}
