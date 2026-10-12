// Máy chủ nhỏ cho Tư vấn AI (Cloudflare Pages Function). Khóa API nằm ở biến bí mật của Cloudflare, không bao giờ xuống trình duyệt.
// Bật: Cloudflare Pages > Settings > Variables and Secrets > thêm ANTHROPIC_API_KEY (hoặc OPENAI_API_KEY).
// Chưa có khóa thì trả 503 và app tự dùng chế độ trả lời từ số liệu có sẵn.
import { GIOI_HAN, NHAC_HE_THONG, choPhepTanSuat, dungNoiDung, kiemTraYeuCau, locNguon, type KhoKV } from "../../src/engine/tu-van";

export interface Env { ANTHROPIC_API_KEY?: string; OPENAI_API_KEY?: string; AI_MODEL?: string; RATE_KV?: KhoKV }
interface Ctx { request: Request; env: Env }
const HAN_GOI_MS = 20_000;

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function goiMoHinh(env: Env, noiDung: string, f: typeof fetch = fetch): Promise<string> {
  if (env.ANTHROPIC_API_KEY) {
    const r = await f("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(HAN_GOI_MS),
      body: JSON.stringify({ model: env.AI_MODEL ?? "claude-haiku-4-5-20251001", max_tokens: 700, temperature: 0.2, system: NHAC_HE_THONG, messages: [{ role: "user", content: noiDung }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    const d = (await r.json()) as { content?: { type: string; text?: string }[] };
    return (d.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
  }
  if (env.OPENAI_API_KEY) {
    const r = await f("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(HAN_GOI_MS),
      body: JSON.stringify({ model: env.AI_MODEL ?? "gpt-4o-mini", temperature: 0.2, max_tokens: 700, messages: [{ role: "system", content: NHAC_HE_THONG }, { role: "user", content: noiDung }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return (d.choices?.[0]?.message?.content ?? "").trim();
  }
  throw new Error("chua-cau-hinh");
}

export async function xuLy(request: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return json({ loi: "Chỉ nhận POST" }, 405);
  if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY) return json({ loi: "chua-cau-hinh" }, 503);
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
    if (!await choPhepTanSuat(env.RATE_KV, ip, Date.now())) return json({ loi: "Em hỏi hơi nhanh, đợi một phút rồi thử lại nhé" }, 429);
  } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  try {
    const tho = await goiMoHinh(env, dungNoiDung(kt.v), f);
    if (!tho) return json({ loi: "Chưa có câu trả lời, em thử lại nhé" }, 502);
    return json(locNguon(tho, kt.v.duLieu.map((d) => d.id)));
  } catch {
    return json({ loi: "Dịch vụ tư vấn đang bận, em thử lại sau ít phút" }, 502);
  }
}

export const onRequest = ({ request, env }: Ctx) => xuLy(request, env);
