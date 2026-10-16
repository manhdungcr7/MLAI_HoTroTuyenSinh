// Máy chủ nhỏ cho Tư vấn AI (Cloudflare Pages Function). Khóa API nằm ở biến bí mật của Cloudflare, không bao giờ xuống trình duyệt.
// Bật: Cloudflare Pages > Settings > Variables and Secrets > thêm OPENROUTER_API_KEY (hoặc ANTHROPIC_API_KEY / OPENAI_API_KEY).
// Hạn mức: mỗi hồ sơ ẩn danh (hoSoId, UUID do client sinh) tối đa AI_QUOTA_DAILY (mặc định 50) lượt AI mỗi ngày giờ Việt Nam, đếm bằng D1 (binding DB, migration 0008).
// Chỉ trừ lượt khi AI trả lời thành công; mã yêu cầu (requestId) giúp gửi lại không bị trừ hai lần. Thiếu DB thì không gọi AI (fail-closed).
// Bậc thang: cache KV > Clef > RAG > LLM (xem _thu-vien/ai/bac-thang.ts). Chưa có bậc server nào dùng được thì trả 503 và app tự dùng chế độ trả lời từ số liệu có sẵn.
import { GIOI_HAN, choPhepTanSuat, kiemTraYeuCau } from "../../src/engine/tu-van";
import { traLoiBacThang, type EnvBacThang } from "../_thu-vien/ai/bac-thang";
import { coKhoaLLM } from "../_thu-vien/ai/sinh-van-ban";
import { chotLuot, docHanMuc, giuLuot, laUuid, luotConLai, traLaiLuot, type KhoD1HanMuc } from "../_thu-vien/han-muc-ai";

export { goiMoHinh } from "../_thu-vien/ai/sinh-van-ban";
export interface Env extends EnvBacThang { DB?: KhoD1HanMuc; AI_QUOTA_DAILY?: string }
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
  const o = goc as Record<string, unknown>;
  if (!laUuid(o.hoSoId) || !laUuid(o.requestId)) return json({ loi: "ho-so-sai" }, 400);
  const hoSo = o.hoSoId.toLowerCase(), yeuCau = o.requestId.toLowerCase();
  // Không gọi mô hình nếu thiếu rate limit hoặc KV gặp lỗi: endpoint công khai có thể phát sinh chi phí.
  if (!env.RATE_KV) return json({ loi: "Dịch vụ tư vấn chưa được cấu hình giới hạn truy cập" }, 503);
  const ip = request.headers.get("cf-connecting-ip") ?? "khong-ro";
  try {
    if (!await choPhepTanSuat(env.RATE_KV, ip, Date.now())) return json({ loi: "Bạn hỏi hơi nhanh, đợi một phút rồi thử lại nhé" }, 429);
  } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  // Hạn mức theo ngày: giữ chỗ nguyên tử trước khi gọi AI, chốt khi thành công, trả lại khi lỗi.
  if (!env.DB) return json({ loi: "chua-cau-hinh-han-muc" }, 503);
  const toiDa = docHanMuc(env.AI_QUOTA_DAILY);
  let giu;
  try { giu = await giuLuot(env.DB, hoSo, yeuCau, toiDa); } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  if (!giu.ok) return giu.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-ngay", luot: { con: 0, toiDa } }, 429);
  const tra = () => traLaiLuot(env.DB!, giu.giu).catch(() => {});
  try {
    const r = await traLoiBacThang(env, kt.v, f);
    if (!r.ok) { await tra(); return json({ loi: r.loi, ...(r.goiY ? { goiY: r.goiY } : {}) }, r.loi === "chua-cau-hinh" ? 503 : 422); }
    // Trả từ cache không tốn nhà cung cấp nên không tính lượt.
    if (r.kq.tang === "cache") await tra(); else await chotLuot(env.DB, giu.giu).catch(() => {});
    const luot = await luotConLai(env.DB, hoSo, toiDa).catch(() => undefined);
    return json(luot ? { ...r.kq, luot } : r.kq);
  } catch (e) {
    await tra();
    // Mã ngắn (ví dụ "openrouter 401", "rong") để chẩn đoán; không chứa khóa hay dữ liệu người dùng.
    const ma = (e instanceof Error ? `${e.name}: ${e.message}` : "loi-la").replace(/[^\w .:/-]/g, "").slice(0, 80);
    console.error(JSON.stringify({ tang: "tu-van", loi: "502", ma }));
    return json({ loi: "Dịch vụ tư vấn đang bận, bạn thử lại sau ít phút", ma }, 502);
  }
}

export const onRequest = ({ request, env }: Ctx) => xuLy(request, env);
