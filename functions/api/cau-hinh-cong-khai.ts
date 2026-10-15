// Endpoint trả cấu hình công khai an toàn cho Web học sinh (GET /api/cau-hinh-cong-khai).
// Chỉ trả các trường công khai (`tenHeThong`, `thongBaoChung`, `lienHe`, `cauHinhNghiepVu`, `cauHoiThuongGap`),
// tuyệt đối không trả metadata quản trị nội bộ (`capNhatBoi`, `emailGuiDi`, khóa bí mật...).
// Nếu D1/KV chưa được gắn hoặc chưa có bản ghi, trả về cấu hình mặc định an toàn.
import {
  banSaoCaiDatMacDinh,
  KHOA_CAI_DAT_CHINH,
  kiemTraCaiDatHeThong,
  type CauHinhNghiepVuHeThong,
  type CauHoiThuongGapMuc,
  type LienHeHeThong,
  type ThongBaoChungHeThong,
} from "../../cms/functions/api/cai-dat";

export interface CauHinhCongKhai {
  tenHeThong: string;
  thongBaoChung: ThongBaoChungHeThong;
  lienHe: LienHeHeThong;
  cauHinhNghiepVu: CauHinhNghiepVuHeThong;
  cauHoiThuongGap: CauHoiThuongGapMuc[];
}

type D1Like = {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => {
      first: <T = Record<string, unknown>>() => Promise<T | null>;
    };
  };
};

export interface EnvCauHinhCongKhai {
  D1_CONG_DONG?: D1Like;
  DB?: D1Like;
  KV_CONG_DONG?: {
    get: (key: string) => Promise<string | null>;
  };
}

export function chonCauHinhCongKhai(nguon?: Partial<CauHinhCongKhai>): CauHinhCongKhai {
  const macDinh = banSaoCaiDatMacDinh();
  const hopLe = (() => {
    if (!nguon || typeof nguon !== "object") return macDinh;
    try {
      return kiemTraCaiDatHeThong({
        ...macDinh,
        ...nguon,
      });
    } catch {
      return macDinh;
    }
  })();

  return {
    tenHeThong: hopLe.tenHeThong,
    thongBaoChung: hopLe.thongBaoChung,
    lienHe: hopLe.lienHe,
    cauHinhNghiepVu: hopLe.cauHinhNghiepVu,
    cauHoiThuongGap: hopLe.cauHoiThuongGap,
  };
}

const TIEU_DE_CONG_KHAI = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
  "Access-Control-Allow-Origin": "*",
};

export async function xuLyCauHinhCongKhai(request: Request, env: EnvCauHinhCongKhai = {}): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ loi: "Chỉ hỗ trợ phương thức GET" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // 1. Thử đọc từ KV nếu có bản đệm công khai
  if (env.KV_CONG_DONG) {
    try {
      const kvRaw = await env.KV_CONG_DONG.get("cau_hinh_cong_khai:active");
      if (kvRaw) {
        const parsed = JSON.parse(kvRaw) as Partial<CauHinhCongKhai>;
        return new Response(JSON.stringify(chonCauHinhCongKhai(parsed)), {
          status: 200,
          headers: TIEU_DE_CONG_KHAI,
        });
      }
    } catch {
      /* KV lỗi hoặc chưa có thì đọc tiếp từ D1 */
    }
  }

  // 2. Thử đọc từ D1 (`cai_dat_he_thong`)
  const csdl = env.D1_CONG_DONG ?? env.DB;
  if (csdl) {
    try {
      const dong = await csdl
        .prepare("SELECT gia_tri_json FROM cai_dat_he_thong WHERE khoa = ? LIMIT 1")
        .bind(KHOA_CAI_DAT_CHINH)
        .first<{ gia_tri_json: string }>();

      if (dong?.gia_tri_json) {
        const parsed = JSON.parse(dong.gia_tri_json) as Partial<CauHinhCongKhai>;
        return new Response(JSON.stringify(chonCauHinhCongKhai(parsed)), {
          status: 200,
          headers: TIEU_DE_CONG_KHAI,
        });
      }
    } catch {
      /* Bảng chưa tạo hoặc truy vấn lỗi thì trả về mặc định an toàn */
    }
  }

  // 3. Fallback mặc định an toàn
  return new Response(JSON.stringify(chonCauHinhCongKhai()), {
    status: 200,
    headers: TIEU_DE_CONG_KHAI,
  });
}

export const onRequestGet = async (context: { request?: Request; env?: EnvCauHinhCongKhai }) =>
  xuLyCauHinhCongKhai(context.request ?? new Request("http://localhost/api/cau-hinh-cong-khai"), context.env ?? {});

export const onRequest = async (context: { request: Request; env: EnvCauHinhCongKhai }) =>
  xuLyCauHinhCongKhai(context.request, context.env);
