// Quản lý phiên làm việc, tài khoản và phân quyền cho CMS (RBAC: QTV vs CTV)
import type { VaiTro } from "@cms/may-chu/kieu";
import { dangDungDuLieuMau } from "@cms/may-chu/che-do";

export interface TaiKhoanCms {
  email: string;
  hoTen: string;
  vaiTro: VaiTro;
  truongDuocGiao: string[];
  anhDaiDien?: string;
}

const KHOA_LUU_PHIEN = "cms:phien-nguoi-dung";

export const TAI_KHOAN_MAU: Record<VaiTro, TaiKhoanCms> = {
  qtv: {
    email: "quantri@nguyenvongai.vn",
    hoTen: "Nguyễn Quản Trị",
    vaiTro: "qtv",
    truongDuocGiao: ["*"], // Toàn quyền tất cả trường
  },
  ctv: {
    email: "congtacvien@nguyenvongai.vn",
    hoTen: "Trần Cộng Tác Viên",
    vaiTro: "ctv",
    truongDuocGiao: ["QSC", "BKA", "NEU", "FTU", "HCMUT"],
  },
};

/** Tài khoản thật do máy chủ xác nhận qua /api/toi (Cloudflare Access). Chưa nạp xong thì quyền thấp nhất, không có quyền sửa trường nào. */
const CHUA_XAC_THUC: TaiKhoanCms = { email: "", hoTen: "Chưa xác thực", vaiTro: "ctv", truongDuocGiao: [] };
let taiKhoanMayChu: TaiKhoanCms | null = null;

/** Gọi một lần khi mở app (ở chế độ thật). Ném lỗi nếu 401/403 để UI hiện màn báo lỗi, không tự rơi về tài khoản mẫu. */
export async function napTaiKhoanTuMayChu(): Promise<TaiKhoanCms> {
  const r = await fetch("/api/toi", { headers: { Accept: "application/json" }, credentials: "same-origin" });
  const j = (await r.json().catch(() => null)) as { email?: string; vaiTro?: VaiTro; truongDuocGiao?: string[]; loi?: string } | null;
  if (!r.ok || !j?.email || !j.vaiTro) throw new Error(j?.loi ?? `Không xác thực được tài khoản (HTTP ${r.status})`);
  taiKhoanMayChu = { email: j.email, hoTen: j.email, vaiTro: j.vaiTro, truongDuocGiao: j.vaiTro === "qtv" ? ["*"] : (j.truongDuocGiao ?? []) };
  try { window.dispatchEvent(new CustomEvent("cms:tai-khoan-doi", { detail: taiKhoanMayChu })); window.dispatchEvent(new Event("cms:vai-doi")); } catch { /* bỏ qua */ }
  return taiKhoanMayChu;
}

export function layTaiKhoanHienTai(): TaiKhoanCms {
  if (!dangDungDuLieuMau()) return taiKhoanMayChu ?? CHUA_XAC_THUC;
  try {
    const raw = localStorage.getItem(KHOA_LUU_PHIEN) || sessionStorage.getItem(KHOA_LUU_PHIEN);
    if (raw) {
      const parsed = JSON.parse(raw) as TaiKhoanCms;
      if (parsed.email && parsed.vaiTro) return parsed;
    }
  } catch {
    // Không đọc được storage
  }
  // Mặc định khởi tạo là Quản trị viên để người dùng trải nghiệm đầy đủ
  return TAI_KHOAN_MAU.qtv;
}

export function luuTaiKhoan(taiKhoan: TaiKhoanCms, ghiNho = true): void {
  if (!dangDungDuLieuMau()) return; // chế độ thật: vai trò do máy chủ quyết định, không tự đặt ở trình duyệt
  try {
    const chuoi = JSON.stringify(taiKhoan);
    if (ghiNho) {
      localStorage.setItem(KHOA_LUU_PHIEN, chuoi);
    } else {
      sessionStorage.setItem(KHOA_LUU_PHIEN, chuoi);
    }
    // Phát sự kiện để cập nhật UI toàn hệ thống
    window.dispatchEvent(new CustomEvent("cms:tai-khoan-doi", { detail: taiKhoan }));
    window.dispatchEvent(new Event("cms:vai-doi"));
  } catch {
    // Bỏ qua lỗi storage
  }
}

export function chuyenDoiVaiTroNhanh(vaiTro: VaiTro): TaiKhoanCms {
  if (!dangDungDuLieuMau()) return layTaiKhoanHienTai();
  const taiKhoan = TAI_KHOAN_MAU[vaiTro];
  luuTaiKhoan(taiKhoan, true);
  return taiKhoan;
}

export function dangXuat(): void {
  try {
    localStorage.removeItem(KHOA_LUU_PHIEN);
    sessionStorage.removeItem(KHOA_LUU_PHIEN);
  } catch {
    // Bỏ qua
  }
  // Đặt lại tài khoản mặc định
  luuTaiKhoan(TAI_KHOAN_MAU.ctv, true);
}

export function laQuanTriVien(taiKhoan?: TaiKhoanCms): boolean {
  const tk = taiKhoan ?? layTaiKhoanHienTai();
  return tk.vaiTro === "qtv";
}

export function duocPhepSuaTruong(maTruong: string, taiKhoan?: TaiKhoanCms): boolean {
  const tk = taiKhoan ?? layTaiKhoanHienTai();
  if (tk.vaiTro === "qtv") return true;
  if (tk.truongDuocGiao.includes("*")) return true;
  return tk.truongDuocGiao.includes(maTruong);
}
