// Endpoint tiếp nhận đăng ký trải nghiệm sớm từ học sinh và phụ huynh
// Cloudflare Pages Function kết nối D1 Database
import { docChuGioiHan, ThanQuaLon } from "../_thu-vien/doc-body";
import { vuotGioiHan, type KhoKvGhi } from "../_thu-vien/gioi-han";

export type LopHoc = "11" | "12" | "khac";
export type NhuCau = "nganh" | "truong" | "nguyen_vong" | "ke_hoach";

export interface DuLieuDangKySom {
  hoTen: string;
  lop: LopHoc;
  nhuCau: NhuCau;
  lienHe: string;
}

export interface KetQuaKiemTra {
  hopLe: boolean;
  duLieu?: DuLieuDangKySom;
  loi?: string;
}

export interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => {
      run: () => Promise<{ success: boolean; meta?: unknown }>;
      first?: <T>() => Promise<T | null>;
    };
  };
}

export interface EnvDangKySom {
  KV_CONG_DONG?: KhoKvGhi;
  D1_CONG_DONG?: D1DatabaseLike;
  /** Tên binding trong wrangler.jsonc; nhận cả hai tên. */
  DB?: D1DatabaseLike;
}

const DANH_SACH_LOP: LopHoc[] = ["11", "12", "khac"];
const DANH_SACH_NHU_CAU: NhuCau[] = ["nganh", "truong", "nguyen_vong", "ke_hoach"];

const BIEU_THUC_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const BIEU_THUC_SO_DIEN_THOAI = /^(?:\+84|0)[35789]\d{8}$/;

/**
 * Kiểm tra xem chuỗi liên hệ có phải là email hoặc số điện thoại Việt Nam hợp lệ hay không.
 */
export function kiemTraLienHe(chuoiLienHe: string): boolean {
  if (!chuoiLienHe || typeof chuoiLienHe !== "string") return false;
  const chuoi = chuoiLienHe.trim();
  if (BIEU_THUC_EMAIL.test(chuoi)) return true;

  const chuoiSo = chuoi.replace(/[\s.-]/g, "");
  return BIEU_THUC_SO_DIEN_THOAI.test(chuoiSo);
}

/**
 * Kiểm tra toàn diện dữ liệu đăng ký gửi lên từ người dùng.
 * Không tin tưởng dữ liệu từ máy khách, lọc và chuẩn hóa dữ liệu.
 */
export function kiemTraDuLieuDangKy(duLieuTho: unknown): KetQuaKiemTra {
  if (!duLieuTho || typeof duLieuTho !== "object" || Array.isArray(duLieuTho)) {
    return { hopLe: false, loi: "Dữ liệu gửi lên không đúng định dạng" };
  }

  const goc = duLieuTho as Record<string, unknown>;

  // 1. Kiểm tra họ tên
  if (typeof goc.hoTen !== "string") {
    return { hopLe: false, loi: "Họ tên không được để trống" };
  }
  const hoTen = goc.hoTen.trim();
  if (hoTen.length < 2 || hoTen.length > 100) {
    return { hopLe: false, loi: "Họ tên phải từ 2 đến 100 ký tự" };
  }

  // 2. Kiểm tra lớp
  if (typeof goc.lop !== "string" || !DANH_SACH_LOP.includes(goc.lop as LopHoc)) {
    return { hopLe: false, loi: "Lớp học không hợp lệ (chọn 11, 12 hoặc khác)" };
  }
  const lop = goc.lop as LopHoc;

  // 3. Kiểm tra nhu cầu
  if (typeof goc.nhuCau !== "string" || !DANH_SACH_NHU_CAU.includes(goc.nhuCau as NhuCau)) {
    return { hopLe: false, loi: "Nhu cầu không hợp lệ" };
  }
  const nhuCau = goc.nhuCau as NhuCau;

  // 4. Kiểm tra phương thức liên hệ (email hoặc số điện thoại)
  if (typeof goc.lienHe !== "string" || !kiemTraLienHe(goc.lienHe)) {
    return { hopLe: false, loi: "Vui lòng nhập email hoặc số điện thoại hợp lệ" };
  }
  const lienHe = goc.lienHe.trim();

  return {
    hopLe: true,
    duLieu: {
      hoTen,
      lop,
      nhuCau,
      lienHe,
    },
  };
}

const taoPhanHoiJson = (duLieu: unknown, maTrangThai = 200) =>
  new Response(JSON.stringify(duLieu), {
    status: maTrangThai,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

/**
 * Xử lý yêu cầu đăng ký sớm từ người dùng.
 */
export async function xuLyDangKySom(request: Request, env: EnvDangKySom): Promise<Response> {
  if (request.method !== "POST") {
    return taoPhanHoiJson({ thanhCong: false, loi: "Chỉ nhận phương thức POST" }, 405);
  }

  let duLieuGoc: unknown;
  try {
    const chuoiVanBan = await docChuGioiHan(request, 8 * 1024);
    duLieuGoc = JSON.parse(chuoiVanBan);
  } catch (e) {
    if (e instanceof ThanQuaLon) return taoPhanHoiJson({ thanhCong: false, loi: "Nội dung quá lớn" }, 413);
    return taoPhanHoiJson({ thanhCong: false, loi: "Nội dung yêu cầu không hợp lệ" }, 400);
  }

  const ketQua = kiemTraDuLieuDangKy(duLieuGoc);
  if (!ketQua.hopLe || !ketQua.duLieu) {
    return taoPhanHoiJson({ thanhCong: false, loi: ketQua.loi ?? "Thông tin chưa hợp lệ" }, 400);
  }
  if (await vuotGioiHan(env.KV_CONG_DONG, "dang-ky-som", request, 5, 3600)) return taoPhanHoiJson({ thanhCong: false, loi: "Em đã gửi vài lần rồi, vui lòng thử lại sau." }, 429);

  const id = crypto.randomUUID();
  const taoLuc = new Date().toISOString();

  // Không có cơ sở dữ liệu thì báo lỗi, không báo "đã nhận": đăng ký không được lưu mà vẫn báo thành công là mất người dùng.
  const csdl = env.D1_CONG_DONG ?? env.DB;
  if (!csdl) {
    return taoPhanHoiJson({ thanhCong: false, loi: "Hệ thống chưa sẵn sàng nhận đăng ký, bạn thử lại sau nhé" }, 503);
  }
  {
    try {
      await csdl
        .prepare(
          "INSERT INTO dang_ky_truy_cap_som (id, ho_ten, lop, nhu_cau, lien_he, tao_luc) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          ketQua.duLieu.hoTen,
          ketQua.duLieu.lop,
          ketQua.duLieu.nhuCau,
          ketQua.duLieu.lienHe,
          taoLuc
        )
        .run();
    } catch {
      return taoPhanHoiJson({ thanhCong: false, loi: "Không thể lưu dữ liệu vào hệ thống, vui lòng thử lại" }, 500);
    }
  }

  return taoPhanHoiJson({ thanhCong: true, id }, 200);
}

export const onRequestPost = async (context: { request: Request; env: EnvDangKySom }) => {
  return xuLyDangKySom(context.request, context.env);
};

export const onRequest = async (context: { request: Request; env: EnvDangKySom }) => {
  return xuLyDangKySom(context.request, context.env);
};
