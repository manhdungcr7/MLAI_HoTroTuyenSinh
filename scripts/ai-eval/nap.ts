// Nạp chỉ hai biến cần cho đo thử AI (OPENROUTER_API_KEY, AI_MODEL) từ một tệp env ngoài repo. Không in giá trị, không nạp biến khác.
import fs from "node:fs";
import type { EnvLLM } from "../../functions/_thu-vien/ai/sinh-van-ban";

export function napEnvAI(duong: string): EnvLLM {
  const kq: Record<string, string> = {};
  for (const dong of fs.readFileSync(duong, "utf8").split(/\r?\n/)) {
    const m = /^\s*(OPENROUTER_API_KEY|AI_MODEL)\s*=\s*(.*?)\s*$/.exec(dong);
    if (m) kq[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  if (!kq.OPENROUTER_API_KEY) throw new Error("Không thấy OPENROUTER_API_KEY trong tệp env");
  return { OPENROUTER_API_KEY: kq.OPENROUTER_API_KEY, AI_MODEL: kq.AI_MODEL };
}
