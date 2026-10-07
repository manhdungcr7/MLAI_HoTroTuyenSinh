// Chế độ dùng dữ liệu mẫu (không gọi API thật): bật bằng VITE_GIA_LAP=1 khi build/chạy, hoặc thêm ?gia-lap=1 vào địa chỉ.
// ?vai=ctv đổi sang tình nguyện viên để thử giao diện của họ. Lựa chọn nhớ trong sessionStorage.
import type { VaiTro } from "./kieu";

const KHOA_GIA_LAP = "cms:gia-lap";
const KHOA_VAI = "cms:vai";

function doc(khoa: string): string | null { try { return sessionStorage.getItem(khoa); } catch { return null; } }
function ghi(khoa: string, v: string | null) { try { if (v === null) sessionStorage.removeItem(khoa); else sessionStorage.setItem(khoa, v); } catch { /* bỏ qua */ } }

export function dangDungDuLieuMau(): boolean {
  if (import.meta.env?.VITE_GIA_LAP === "1") return true;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "";
    const hashParams = new URLSearchParams(hashQuery);
    const giaLap = searchParams.get("gia-lap") ?? hashParams.get("gia-lap");
    if (giaLap === "1") ghi(KHOA_GIA_LAP, "1");
    if (giaLap === "0") ghi(KHOA_GIA_LAP, null);
    const vai = searchParams.get("vai") ?? hashParams.get("vai");
    if (vai === "ctv" || vai === "qtv") ghi(KHOA_VAI, vai);
  } catch { /* không có window */ }
  return doc(KHOA_GIA_LAP) === "1";
}


export function vaiTroMau(): VaiTro { return doc(KHOA_VAI) === "ctv" ? "ctv" : "qtv"; }

export function datVaiTroMau(vai: VaiTro) {
  ghi(KHOA_VAI, vai);
  window.dispatchEvent(new Event("cms:vai-doi"));
}

export function chuyenDoiVaiTroMau(): VaiTro {
  const moi = vaiTroMau() === "ctv" ? "qtv" : "ctv";
  datVaiTroMau(moi);
  return moi;
}
