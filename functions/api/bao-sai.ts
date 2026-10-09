// Học sinh báo một số liệu sai (điểm chuẩn, học phí, tổ hợp...) của một chương trình. Không bao giờ tự đè số liệu:
// báo cáo vào hộp thư (D1 `bao_sai`), tình nguyện viên của trường kiểm tra nguồn rồi sửa qua CMS.
import { kiemTraBaoSai } from "../../src/data/dong-gop-kiem-tra";
import { docThanNho, traLoiJson, vuotGioiHan, type KhoKvGhi } from "../_thu-vien/gioi-han";

interface D1Ghi { prepare: (sql: string) => { bind: (...a: unknown[]) => { run: () => Promise<unknown> } } }
export interface EnvBaoSai { DB?: D1Ghi; KV_CONG_DONG?: KhoKvGhi }

const TOI_DA_MOI_GIO = 5;

export async function xuLyBaoSai(request: Request, env: EnvBaoSai, bayGio = new Date()): Promise<Response> {
  if (request.method !== "POST") return traLoiJson({ thanhCong: false, loi: "Chỉ nhận phương thức POST" }, 405);
  const b = await docThanNho(request);
  if (!b) return traLoiJson({ thanhCong: false, loi: "Nội dung gửi lên không hợp lệ hoặc quá lớn" }, 400);
  // Ô ẩn "website": người thật không thấy nên không điền; máy tự điền thì bị bỏ qua mà vẫn báo thành công để không lộ cách chặn.
  if (typeof b.website === "string" && b.website.trim() !== "") return traLoiJson({ thanhCong: true });

  const kq = kiemTraBaoSai({ ...b, id: crypto.randomUUID(), trangThai: "moi", luc: bayGio.toISOString() }, { bayGio });
  if (!kq.ok) return traLoiJson({ thanhCong: false, loi: Object.values(kq.loi)[0] ?? "Thông tin chưa hợp lệ", chiTiet: kq.loi }, 400);
  if (!env.DB) return traLoiJson({ thanhCong: false, loi: "Hệ thống chưa sẵn sàng nhận báo sai, bạn thử lại sau nhé" }, 503);
  if (await vuotGioiHan(env.KV_CONG_DONG, "bao-sai", request, TOI_DA_MOI_GIO, 3600, bayGio.getTime())) {
    return traLoiJson({ thanhCong: false, loi: "Bạn đã gửi khá nhiều báo cáo trong một giờ. Bạn đợi một lát rồi gửi tiếp nhé." }, 429);
  }
  const d = kq.duLieu;
  try {
    await env.DB.prepare("INSERT INTO bao_sai (id, ma_chuong_trinh, truong_du_lieu, noi_dung, link, trang_thai, tao_luc) VALUES (?, ?, ?, ?, ?, 'moi', ?)")
      .bind(d.id, d.maChuongTrinh, d.truongDuLieu, d.noiDung, d.link ?? null, d.luc).run();
  } catch {
    return traLoiJson({ thanhCong: false, loi: "Không lưu được báo cáo, bạn thử lại sau nhé" }, 500);
  }
  return traLoiJson({ thanhCong: true });
}

export const onRequest = (ctx: { request: Request; env: EnvBaoSai }) => xuLyBaoSai(ctx.request, ctx.env);
