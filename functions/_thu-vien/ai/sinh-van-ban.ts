import { NHAC_HE_THONG } from "../../../src/engine/tu-van";
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
const TOKEN_RA = 1000;

export async function goiMoHinh(env: EnvLLM, noiDung: string, f: typeof fetch = fetch, hanMs = HAN_GOI_MS): Promise<string> {
  const han = Math.min(HAN_GOI_MS, hanMs);
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
        model: env.AI_MODEL ?? "deepseek/deepseek-v4.1-flash",
        temperature: 0.2,
        max_tokens: TOKEN_RA,
        // Mô hình suy luận (deepseek v4.x) nếu không tắt sẽ đốt hết max_tokens vào "reasoning" và trả content rỗng, chậm 15–20 giây.
        reasoning: { enabled: false },
        provider: { sort: "latency" },
        messages: [{ role: "system", content: NHAC_HE_THONG }, { role: "user", content: noiDung }],
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
      body: JSON.stringify({ model: env.AI_MODEL ?? "claude-haiku-4-5-20251001", max_tokens: TOKEN_RA, temperature: 0.2, system: NHAC_HE_THONG, messages: [{ role: "user", content: noiDung }] }),
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
      body: JSON.stringify({ model: env.AI_MODEL ?? "gpt-4o-mini", temperature: 0.2, max_tokens: TOKEN_RA, messages: [{ role: "system", content: NHAC_HE_THONG }, { role: "user", content: noiDung }] }),
    });
    if (!r.ok) throw new Error(`openai ${r.status}`);
    const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return (d.choices?.[0]?.message?.content ?? "").trim();
  }
  if (env.AI) {
    const model = env.AI_MODEL ?? "@cf/meta/llama-3.3-70b-instruct";
    try {
      const res = (await env.AI.run(model, {
        messages: [
          { role: "system", content: NHAC_HE_THONG },
          { role: "user", content: noiDung },
        ],
        max_tokens: TOKEN_RA,
        temperature: 0.2,
      })) as { response?: string };
      return (res?.response ?? "").trim();
    } catch {
      if (model !== "@cf/meta/llama-3.1-8b-instruct") {
        const res8b = (await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: NHAC_HE_THONG },
            { role: "user", content: noiDung },
          ],
          max_tokens: TOKEN_RA,
          temperature: 0.2,
        })) as { response?: string };
        return (res8b?.response ?? "").trim();
      }
      throw new Error("cf-ai-error");
    }
  }
  throw new Error("chua-cau-hinh");
}

