// Đăng ký làm tình nguyện viên cập nhật dữ liệu cho một trường (sinh viên, giáo viên, cán bộ tuyển sinh).
// Chỉ ghi vào hàng chờ (D1 `tinh_nguyen_dang_ky`). Việc cấp quyền do quản trị viên làm ở CMS sau khi liên hệ và xác minh.
import tapTruong from "../../cms/functions/_thu-vien/tap-truong.json";
import { docThanNho, traLoiJson, vuotGioiHan, type KhoKvGhi } from "../_thu-vien/gioi-han";
import { kiemTraLienHe } from "./dang-ky-som";

interface D1Ghi { prepare: (sql: string) => { bind: (...a: unknown[]) => { run: () => Promise<unknown> } } }
export interface EnvTinhNguyen { DB?: D1Ghi; KV_CONG_DONG?: KhoKvGhi }

export type VaiTroTinhNguyen = "sinh_vien" | "giao_vien" | "can_bo_tuyen_sinh" | "khac";
export const CAC_VAI_TRO: VaiTroTinhNguyen[] = ["sinh_vien", "giao_vien", "can_bo_tuyen_sinh", "khac"];
const TEN_TRUONG = tapTruong as Record<string, string>;
const TOI_DA_MOI_GIO = 3;

export interface DangKyTinhNguyen { hoTen: string; vaiTro: VaiTroTinhNguyen; maTruong: string; lienHe: string; ghiChu: string }

const sach = (v: unknown, toiDa: number) => (typeof v === "string" ? v.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, toiDa) : "");

export function kiemTraDangKyTinhNguyen(x: Record<string, unknown>): { ok: true; duLieu: DangKyTinhNguyen } | { ok: false; loi: string } {
  const hoTen = sach(x.hoTen, 100);
  if (hoTen.length < 2) return { ok: false, loi: "Bạn cho mình biết họ tên nhé (ít nhất 2 chữ)" };
  if (typeof x.vaiTro !== "string" || !CAC_VAI_TRO.includes(x.vaiTro as VaiTroTinhNguyen)) return { ok: false, loi: "Bạn chọn vai trò của mình" };
  const maTruong = typeof x.maTruong === "string" ? x.maTruong.trim().toUpperCase() : "";
  if (!TEN_TRUONG[maTruong]) return { ok: false, loi: "Bạn chọn trường trong danh sách" };
  const lienHe = sach(x.lienHe, 120);
  if (!kiemTraLienHe(lienHe)) return { ok: false, loi: "Bạn nhập email hoặc số điện thoại để mình liên hệ" };
  const ghiChu = sach(x.ghiChu, 500);
  return { ok: true, duLieu: { hoTen, vaiTro: x.vaiTro as VaiTroTinhNguyen, maTruong, lienHe, ghiChu } };
}

export async function xuLyTinhNguyen(request: Request, env: EnvTinhNguyen, bayGio = new Date()): Promise<Response> {
  if (request.method !== "POST") return traLoiJson({ thanhCong: false, loi: "Chỉ nhận phương thức POST" }, 405);
  const b = await docThanNho(request);
  if (!b) return traLoiJson({ thanhCong: false, loi: "Nội dung gửi lên không hợp lệ hoặc quá lớn" }, 400);
  if (typeof b.website === "string" && b.website.trim() !== "") return traLoiJson({ thanhCong: true }); // ô ẩn chống máy tự điền
  const kq = kiemTraDangKyTinhNguyen(b);
  if (!kq.ok) return traLoiJson({ thanhCong: false, loi: kq.loi }, 400);
  if (!env.DB) return traLoiJson({ thanhCong: false, loi: "Hệ thống chưa sẵn sàng nhận đăng ký, bạn thử lại sau nhé" }, 503);
  if (await vuotGioiHan(env.KV_CONG_DONG, "tinh-nguyen", request, TOI_DA_MOI_GIO, 3600, bayGio.getTime())) {
    return traLoiJson({ thanhCong: false, loi: "Bạn đã gửi đăng ký vài lần rồi. Mình sẽ liên hệ sớm, bạn không cần gửi lại." }, 429);
  }
  const d = kq.duLieu;
  try {
    await env.DB.prepare("INSERT INTO tinh_nguyen_dang_ky (id, ho_ten, vai_tro, ma_truong, lien_he, ghi_chu, trang_thai, tao_luc) VALUES (?, ?, ?, ?, ?, ?, 'moi', ?)")
      .bind(crypto.randomUUID(), d.hoTen, d.vaiTro, d.maTruong, d.lienHe, d.ghiChu || null, bayGio.toISOString()).run();
  } catch {
    return traLoiJson({ thanhCong: false, loi: "Không lưu được đăng ký, bạn thử lại sau nhé" }, 500);
  }
  return traLoiJson({ thanhCong: true });
}

export const onRequest = (ctx: { request: Request; env: EnvTinhNguyen }) => xuLyTinhNguyen(ctx.request, ctx.env);
