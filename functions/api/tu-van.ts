// Máy chủ nhỏ cho Tư vấn AI (Cloudflare Pages Function). Khóa API nằm ở biến bí mật của Cloudflare, không bao giờ xuống trình duyệt.
// Bật: Cloudflare Pages > Settings > Variables and Secrets > thêm OPENROUTER_API_KEY (hoặc ANTHROPIC_API_KEY / OPENAI_API_KEY).
// Bậc thang: cache KV > Clef > RAG > LLM (xem _thu-vien/ai/bac-thang.ts). Chưa có bậc server nào dùng được thì trả 503 và app tự dùng chế độ trả lời từ số liệu có sẵn.
import { GIOI_HAN, choPhepTanSuat, kiemTraYeuCau } from "../../src/engine/tu-van";
import { traLoiBacThang, type EnvBacThang } from "../_thu-vien/ai/bac-thang";
import { coKhoaLLM } from "../_thu-vien/ai/sinh-van-ban";

export { goiMoHinh } from "../_thu-vien/ai/sinh-van-ban";
export type Env = EnvBacThang;
interface Ctx { request: Request; env: Env }

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function xuLy(request: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return json({ loi: "Chỉ nhận POST" }, 405);
  if (!coKhoaLLM(env) && !env.AI) return json({ loi: "chua-cau-hinh" }, 503);
  const khai = Number(request.headers.get("content-length"));
  if (Number.isFinite(khai) && khai > GIOI_HAN.kichThuocBody) return json({ loi: "Yêu cầu quá lớn" }, 413);
  // Request.text() đọc toàn bộ body trước khi kiểm tra kích thước; đọc theo luồng để giới hạn bộ nhớ.
  const reader = request.body?.getReader();
  if (!reader) return json({ loi: "Yêu cầu không hợp lệ" }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > GIOI_HAN.kichThuocBody) {
        await reader.cancel();
        return json({ loi: "Yêu cầu quá lớn" }, 413);
      }
      chunks.push(value);
    }
  } catch { return json({ loi: "Không đọc được yêu cầu" }, 400); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const chu = new TextDecoder().decode(bytes);
  let goc: unknown;
  try { goc = JSON.parse(chu); } catch { return json({ loi: "Yêu cầu không hợp lệ" }, 400); }
  const kt = kiemTraYeuCau(goc);
  if (!kt.ok) return json({ loi: kt.loi }, 400);
  // Không gọi mô hình nếu thiếu rate limit hoặc KV gặp lỗi: endpoint công khai có thể phát sinh chi phí.
  if (!env.RATE_KV) return json({ loi: "Dịch vụ tư vấn chưa được cấu hình giới hạn truy cập" }, 503);
  const ip = request.headers.get("cf-connecting-ip") ?? "khong-ro";
  try {
    if (!await choPhepTanSuat(env.RATE_KV, ip, Date.now())) return json({ loi: "Bạn hỏi hơi nhanh, đợi một phút rồi thử lại nhé" }, 429);
  } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  try {
    const r = await traLoiBacThang(env, kt.v, f);
    if (!r.ok) return json({ loi: r.loi, ...(r.goiY ? { goiY: r.goiY } : {}) }, 503);
    return json(r.kq);
  } catch {
    return json({ loi: "Dịch vụ tư vấn đang bận, bạn thử lại sau ít phút" }, 502);
  }
}

export const onRequest = ({ request, env }: Ctx) => xuLy(request, env);
