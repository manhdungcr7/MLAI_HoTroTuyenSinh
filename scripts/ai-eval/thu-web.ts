// Thử tìm kiếm web của OpenRouter (plugin web) với model đang dùng: độ trễ, định dạng trích dẫn, chất lượng.
// Chạy: npx tsx scripts/ai-eval/thu-web.ts "F:/MLAI_Hackathon/env"
import { napEnvAI } from "./nap";

const env = napEnvAI(process.argv[2]);
const model = env.AI_MODEL ?? "deepseek/deepseek-v4.1-flash";
const cau = [
  "Học bổng đầu vào của trường Đại học Công nghệ TP.HCM HUTECH năm 2026 có những loại nào?",
  "Ký túc xá của Đại học Bách Khoa Hà Nội có đủ chỗ cho tân sinh viên không?",
];
for (const c of cau) {
  const t0 = Date.now();
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
    signal: AbortSignal.timeout(40_000),
    body: JSON.stringify({
      model, temperature: 0.2, max_tokens: 500,
      reasoning: { enabled: false },
      plugins: [{ id: "web", max_results: 3 }],
      messages: [{ role: "system", content: "Bạn là trợ lý tuyển sinh. Trả lời tiếng Việt, ngắn gọn, chỉ dựa trên kết quả tìm kiếm, nêu nguồn." }, { role: "user", content: c }],
    }),
  });
  const ms = Date.now() - t0;
  const d = (await r.json()) as { choices?: { message?: { content?: string; annotations?: { type: string; url_citation?: { url: string; title?: string; content?: string } }[] } }[]; error?: unknown; usage?: unknown };
  const m = d.choices?.[0]?.message;
  console.log(`\n=== ${c}\nHTTP ${r.status}, ${ms} ms, annotations: ${m?.annotations?.length ?? 0}`);
  if (d.error) console.log("lỗi:", JSON.stringify(d.error).slice(0, 300));
  console.log((m?.content ?? "").slice(0, 700));
  for (const a of m?.annotations ?? []) console.log(" •", a.url_citation?.url, "|", (a.url_citation?.title ?? "").slice(0, 70), "| snippet:", (a.url_citation?.content ?? "").length, "ký tự");
  console.log("usage:", JSON.stringify(d.usage ?? {}).slice(0, 200));
}
