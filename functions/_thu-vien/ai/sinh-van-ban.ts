import { NHAC_HE_THONG, type NguonWeb } from "../../../src/engine/tu-van";
import type { KhoAI } from "./kieu";

export interface EnvLLM {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  AI_MODEL?: string;
  AI?: KhoAI;
  CF_AI_LLM?: boolean;
}
export const coKhoaLLM = (env: EnvLLM) =>
  !!(
    env.ANTHROPIC_API_KEY ||
    env.OPENAI_API_KEY ||
    env.OPENROUTER_API_KEY ||
    (env.AI && (env.CF_AI_LLM || (env.AI_MODEL && !env.AI_MODEL.includes("clef"))))
  );

// Client chờ 15 giây, Clef tối đa 4 giây trước đó: giữ LLM dưới 10 giây để còn kịp trả.
const HAN_GOI_MS = 10_000;
// Câu trả lời mặc định ngắn (≤120 từ) + JSON có cấu trúc: 450 token là đủ, và chặn mô hình lan man.
export const TOKEN_RA = 450;

/** AI_MODEL dùng chung cho mọi nhà cung cấp; id Workers AI ("@cf/...") không hợp lệ ở OpenRouter, Anthropic hay OpenAI nên bị bỏ qua ở các nhánh đó. */
export const modelNgoai = (env: EnvLLM): string | undefined => (env.AI_MODEL && !env.AI_MODEL.startsWith("@cf/") ? env.AI_MODEL : undefined);

/** Lời nhắc hệ thống và giới hạn token đầu ra theo từng làn trả lời (tra cứu, so sánh, tư vấn mở). Không đặt thì dùng mặc định tra cứu. */
export interface TuyChonGoi { nhac?: string; tokenRa?: number }

export async function goiMoHinh(env: EnvLLM, noiDung: string, f: typeof fetch = fetch, hanMs = HAN_GOI_MS, tuyChon: TuyChonGoi = {}): Promise<string> {
  if (!Number.isFinite(hanMs) || hanMs <= 0) throw new Error("het-thoi-gian");
  const han = Math.max(1, Math.floor(Math.min(HAN_GOI_MS, hanMs)));
  const nhac = tuyChon.nhac ?? NHAC_HE_THONG;
  const tokenRa = tuyChon.tokenRa ?? TOKEN_RA;
  if (env.OPENROUTER_API_KEY) {
    const r = await f("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://nguyenvongai.vn",
        "X-Title": "Nguyen Vong AI",
      },
      signal: AbortSignal.timeout(han),
      body: JSON.stringify({
        model: modelNgoai(env) ?? "anthropic/claude-haiku-5.5",
        temperature: 0.2,
        max_tokens: tokenRa,
        // Mô hình suy luận nếu không tắt sẽ đốt hết max_tokens vào "reasoning" và trả content rỗng, chậm 15–20 giây.
        reasoning: { enabled: false },
        provider: { sort: "latency" },
        messages: [{ role: "system", content: nhac }, { role: "user", content: noiDung }],
      }),
    });
    if (!r.ok) throw new Error(`openrouter ${r.status}`);
    const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return (d.choices?.[0]?.message?.content ?? "").trim();
  }
  if (env.ANTHROPIC_API_KEY) {
    const r = await f("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(han),
      body: JSON.stringify({ model: modelNgoai(env) ?? "claude-haiku-4-5-20251001", max_tokens: tokenRa, temperature: 0.2, system: nhac, messages: [{ role: "user", content: noiDung }] }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    const d = (await r.json()) as { content?: { type: string; text?: string }[] };
    return (d.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
  }
  if (env.OPENAI_API_KEY) {
    const r = await f("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(han),
      body: JSON.stringify({ model: modelNgoai(env) ?? "gpt-4o-mini", temperature: 0.2, max_tokens: tokenRa, messages: [{ role: "system", content: nhac }, { role: "user", content: noiDung }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return (d.choices?.[0]?.message?.content ?? "").trim();
  }
  if (env.AI) {
    const model = env.AI_MODEL && (env.AI_MODEL.startsWith("@cf/") || env.AI_MODEL.startsWith("@hf/"))
      ? env.AI_MODEL
      : "@cf/meta/llama-3.3-70b-instruct";
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Binding không nhận AbortSignal trong contract hiện tại. Chặn thời gian chờ,
      // không gọi thêm model khi lỗi: retry sinh văn bản có thể tính tiền hai lần.
      const res = (await Promise.race([env.AI.run(model, {
        messages: [
          { role: "system", content: nhac },
          { role: "user", content: noiDung },
        ],
        max_tokens: tokenRa,
        temperature: 0.2,
      }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("cf-ai-timeout")), han); })])) as { response?: string };
      return (res?.response ?? "").trim();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw new Error("chua-cau-hinh");
}

export interface KetQuaWeb { text: string; nguonWeb: NguonWeb[]; trichDoan: string }

/**
 * Gọi mô hình kèm tìm kiếm web (plugin web của OpenRouter). Chỉ có với OpenRouter; nhà cung cấp khác trả null để bên gọi dùng đường thường.
 * Trả về lời đáp, danh sách nguồn (tối đa 3, chỉ http/https) và đoạn trích của nguồn (để hậu kiểm số liệu không tính là bịa).
 * Nội dung web là dữ liệu không đáng tin: bên gọi không bao giờ thi hành chỉ dẫn nào trong đó.
 */
export async function goiMoHinhCoWeb(env: EnvLLM, noiDung: string, f: typeof fetch = fetch, hanMs = HAN_GOI_MS, tuyChon: TuyChonGoi = {}): Promise<KetQuaWeb | null> {
  if (!env.OPENROUTER_API_KEY) return null;
  if (!Number.isFinite(hanMs) || hanMs <= 0) throw new Error("het-thoi-gian");
  const han = Math.max(1, Math.floor(Math.min(HAN_GOI_MS, hanMs)));
  const r = await f("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://nguyenvongai.vn",
      "X-Title": "Nguyen Vong AI",
    },
    signal: AbortSignal.timeout(han),
    body: JSON.stringify({
      model: modelNgoai(env) ?? "anthropic/claude-haiku-5.5",
      temperature: 0.2,
      max_tokens: tuyChon.tokenRa ?? TOKEN_RA,
      reasoning: { enabled: false },
      plugins: [{ id: "web", max_results: 3 }],
      messages: [{ role: "system", content: tuyChon.nhac ?? NHAC_HE_THONG }, { role: "user", content: noiDung }],
    }),
  });
  if (!r.ok) throw new Error(`openrouter-web ${r.status}`);
  const d = (await r.json()) as { choices?: { message?: { content?: string; annotations?: { type?: string; url_citation?: { url?: string; title?: string; content?: string } }[] } }[] };
  const m = d.choices?.[0]?.message;
  const nguon: NguonWeb[] = [];
  let trich = "";
  for (const a of m?.annotations ?? []) {
    const u = a.url_citation?.url;
    if (a.type !== "url_citation" || typeof u !== "string" || !/^https?:\/\//i.test(u) || nguon.some((n) => n.url === u) || nguon.length >= 3) continue;
    nguon.push({ url: u.slice(0, 300), tieuDe: String(a.url_citation?.title ?? "").replace(/\s+/g, " ").trim().slice(0, 120) });
    trich += `\n${String(a.url_citation?.content ?? "").slice(0, 2500)}`;
  }
  return { text: (m?.content ?? "").trim(), nguonWeb: nguon, trichDoan: trich.slice(0, 7000) };
}
