// Hook gắn bản nháp vào biểu mẫu: tự lưu sau khi sửa (trễ ~500 ms), hỏi khôi phục khi mở lại, xóa khi lưu thành công.
import { useEffect, useRef, useState } from "react";
import { docBanNhap, ghiBanNhap, xoaBanNhap, type BanNhap, type LaHopLe } from "./ban-nhap";

const TRE_MS = 500;

export interface KetQuaBanNhap<T> {
  /** Bản nháp đang chờ người dùng chọn Khôi phục hoặc Bỏ. Null nếu không có. */
  cho: BanNhap<T> | null;
  /** Lấy nội dung nháp để đổ vào form và ẩn thanh hỏi. */
  khoiPhuc: () => T | null;
  /** Xóa nháp và ẩn thanh hỏi. */
  bo: () => void;
  /** Gọi khi lưu/gửi thành công: hủy lần ghi đang chờ và xóa nháp. */
  xong: () => void;
}

/**
 * `hienTai` là toàn bộ nội dung form. Chỉ ghi khi nội dung khác lúc mở form, nên mở form mới không tạo nháp rỗng.
 * Khi đóng form (hoặc tải lại) lần ghi đang chờ được ghi ngay, không để mất chữ vừa gõ.
 */
export function useBanNhap<T extends object>(khoa: string, email: string, laHopLe: LaHopLe<T>, hienTai: T): KetQuaBanNhap<T> {
  const [cho, setCho] = useState<BanNhap<T> | null>(() => docBanNhap(khoa, email, laHopLe));
  const chuoi = JSON.stringify(hienTai);
  const banDau = useRef(chuoi);
  const dangCho = useRef<{ khoa: string; email: string; du: unknown } | null>(null);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ghiNgay = () => {
    if (hen.current) clearTimeout(hen.current);
    hen.current = null;
    const p = dangCho.current;
    dangCho.current = null;
    if (p) ghiBanNhap(p.khoa, p.email, p.du);
  };

  useEffect(() => {
    if (!email || chuoi === banDau.current) return;
    dangCho.current = { khoa, email, du: JSON.parse(chuoi) };
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(ghiNgay, TRE_MS);
  }, [chuoi, khoa, email]);

  useEffect(() => ghiNgay, []);

  return {
    cho,
    khoiPhuc: () => {
      const du = cho?.du ?? null;
      setCho(null);
      return du;
    },
    bo: () => {
      dangCho.current = null;
      if (hen.current) clearTimeout(hen.current);
      xoaBanNhap(khoa);
      setCho(null);
    },
    xong: () => {
      dangCho.current = null;
      if (hen.current) clearTimeout(hen.current);
      hen.current = null;
      xoaBanNhap(khoa);
      setCho(null);
    },
  };
}
