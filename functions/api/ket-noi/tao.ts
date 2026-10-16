// POST /api/ket-noi/tao: tạo mã ghép nối (hiện một lần cho học sinh) và lưu bản chụp. Máy chủ chỉ giữ SHA-256 của mã.
import { docBanChup, taoKetNoi, traJson, type EnvKetNoi } from "../../_thu-vien/ket-noi";

/** Số lần tạo mã mới tối đa mỗi IP mỗi giờ. */
export const TOI_DA_TAO_MOI_GIO = 5;

export async function xuLyTao(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "POST") return traJson({ loi: "Chỉ nhận POST" }, 405);
  if (!env.DB) return traJson({ loi: "Dịch vụ kết nối chưa sẵn sàng" }, 503);
  // Công khai và không cần đăng nhập: giới hạn theo IP để không ai làm đầy D1. Thiếu KV hoặc KV lỗi thì từ chối (fail-closed).
  if (!env.RATE_KV) return traJson({ loi: "Dịch vụ kết nối chưa sẵn sàng" }, 503);
  try {
    const gio = Math.floor(Date.now() / 3_600_000);
    const khoa = `nvk-tao:${request.headers.get("cf-connecting-ip") ?? "khong-ro"}:${gio}`;
    const dem = Number(await env.RATE_KV.get(khoa)) || 0;
    if (dem >= TOI_DA_TAO_MOI_GIO) return traJson({ loi: "Bạn tạo kết nối hơi nhiều, thử lại sau một giờ nhé" }, 429);
    await env.RATE_KV.put(khoa, String(dem + 1), { expirationTtl: 3700 });
  } catch { return traJson({ loi: "Dịch vụ kết nối đang tạm thời không sẵn sàng" }, 503); }
  const doc = await docBanChup(request);
  if (!doc.ok) return traJson({ loi: doc.loi }, 400);
  let kq: { ma: string; hetHan: number };
  try {
    kq = await taoKetNoi(env.DB, doc.banChup);
  } catch {
    return traJson({ loi: "Không tạo được kết nối, bạn thử lại sau nhé" }, 503);
  }
  const origin = new URL(request.url).origin;
  return traJson({
    ma: kq.ma,
    mcpUrl: `${origin}/mcp/${kq.ma}`,
    actionsUrl: `${origin}/api/gpt/${kq.ma}`,
    hetHan: new Date(kq.hetHan).toISOString(),
  }, 201);
}

export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi }) => xuLyTao(ctx.request, ctx.env);
