import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";


import { randomUUID } from "node:crypto";
import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));

function taoManifestDevRong() {
  const rong = (ten: string) => ({
    version: "0",
    hash: "",
    url: `/snapshots/${ten}.json`,
    size: 0,
    recordCount: 0,
    updatedAt: "",
  });
  return {
    schemaVersion: 1,
    dataVersion: "2026.10.07.01",
    generatedAt: new Date().toISOString(),
    datasets: {
      schools: rong("schools"),
      tuition: rong("tuition"),
      scholarships: rong("scholarships"),
      admissions: rong("admissions"),
      announcements: rong("announcements"),
      cutoffScores: rong("cutoff-scores"),
    },
    recentChanges: [],
  };
}

function apiDevPlugin() {
  return {
    name: "tu-van-dev-plugin",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.split("?", 1)[0] === "/api/manifest" && req.method === "GET") {
          try {
            const upstream = await fetch("http://127.0.0.1:8790/api/manifest", {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(750),
            });
            if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`);
            const body = Buffer.from(await upstream.arrayBuffer());
            res.writeHead(upstream.status, {
              "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
              "Cache-Control": "no-store",
            });
            res.end(body);
          } catch {
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "no-store",
            });
            res.end(JSON.stringify(taoManifestDevRong()));
          }
          return;
        }
        if (process.env.NV_AI_REMOTE === "1" && req.url === "/api/tu-van" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: any) => { body += chunk; });
          req.on("end", async () => {
            try {
              let apiKey = process.env.OPENROUTER_API_KEY;
              let model = process.env.AI_MODEL || "deepseek/deepseek-chat";
              const devVarsPath = resolve(__dir, ".dev.vars");
              if (!apiKey && existsSync(devVarsPath)) {
                const content = readFileSync(devVarsPath, "utf-8");
                const mKey = content.match(/^OPENROUTER_API_KEY=(.*)$/m);
                if (mKey) apiKey = mKey[1].trim();
                const mModel = content.match(/^AI_MODEL=(.*)$/m);
                if (mModel) model = mModel[1].trim();
              }
              if (!apiKey) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ loi: "chua-cau-hinh" }));
                return;
              }
              const data = JSON.parse(body || "{}");
              const cauHoi = data.cauHoi || "";
              const isStream = data.stream === true || (req.headers.accept && req.headers.accept.includes("text/event-stream"));

              const systemPrompt = 'Bạn là Trợ lý tư vấn tuyển sinh đại học Nguyện Vọng AI thông minh, thân thiện. Xưng "mình", gọi học sinh là "bạn" hoặc "em". Trả lời súc tích, tự nhiên, chính xác dựa trên câu hỏi của học sinh. Khi học sinh hỏi về KẾ HOẠCH HỌC TẬP, PHƯƠNG PHÁP ÔN THI, TĂNG ĐIỂM, PHÂN BỔ THỜI GIAN: Hãy dựa vào mục tiêu, môn trọng tâm kéo điểm và tiến độ tuần trong ngữ cảnh/hồ sơ để tư vấn thiết thực, chỉ rõ môn cần bứt phá, phương pháp phân bổ thời gian (60-35-5) và gợi ý lịch ôn tập cụ thể. Nếu hỏi về phương thức xét tuyển (như học bạ, ĐGNL, tuyển thẳng), giải thích rõ ràng và khuyên đối chiếu thêm đề án chính thức của trường.';

              const userContent = [
                data.nguCanh ? `[NGỮ CẢNH VÀ KẾ HOẠCH HỌC TẬP]\n${data.nguCanh}` : "",
                data.hoSo ? `[HỒ SƠ HỌC SINH]\n${JSON.stringify(data.hoSo)}` : "",
                `[CÂU HỎI CỦA HỌC SINH]\n${cauHoi}`,
              ].filter(Boolean).join("\n\n");

              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                  "HTTP-Referer": "https://nguyenvongai.pages.dev",
                  "X-Title": "Nguyen Vong AI",
                },
                body: JSON.stringify({
                  model: model || "deepseek/deepseek-chat",
                  temperature: 0.3,
                  max_tokens: 600,
                  stream: isStream,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent },
                  ],
                }),
              });

              if (!response.ok) {
                const errText = await response.text();
                res.writeHead(response.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ loi: "mang", chiTiet: errText }));
                return;
              }

              if (isStream && response.body) {
                res.writeHead(200, {
                  "Content-Type": "text/event-stream; charset=utf-8",
                  "Cache-Control": "no-cache",
                  Connection: "keep-alive",
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullTraLoi = "";
                let buffer = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n\n");
                  buffer = lines.pop() ?? "";

                  for (const block of lines) {
                    for (const line of block.split("\n")) {
                      const tr = line.trim();
                      if (!tr.startsWith("data:")) continue;
                      const jsonStr = tr.slice(5).trim();
                      if (jsonStr === "[DONE]") continue;
                      try {
                        const parsed = JSON.parse(jsonStr);
                        const token = parsed.choices?.[0]?.delta?.content || "";
                        if (token) {
                          fullTraLoi += token;
                          res.write(`data: ${JSON.stringify({ token })}\n\n`);
                        }
                      } catch {}
                    }
                  }
                }

                res.write(`data: ${JSON.stringify({ xong: true, traLoi: fullTraLoi, nguon: [], tang: "llm", luot: { con: 49, toiDa: 50 } })}\n\n`);
                res.end();
                return;
              }

              const result = (await response.json()) as any;
              const traLoi = result.choices?.[0]?.message?.content || "";
              res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              res.end(
                JSON.stringify({
                  traLoi,
                  nguon: [],
                  tang: "llm",
                  luot: { con: 49, toiDa: 50 },
                })
              );
            } catch (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ loi: "mang", message: String(err) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: "./",
  // Mỗi lần chạy dev có cache riêng để tiến trình Vite khác không khóa file đang được tối ưu lại trên Windows.
  cacheDir: command === "serve"
    ? resolve(__dir, ".agent-runtime", "vite-cache", randomUUID())
    : resolve(__dir, ".agent-runtime", "vite-cache-build"),
  // Manifest có dữ liệu rỗng khi chưa chạy Pages; AI trả phí chỉ dùng khi bật NV_AI_REMOTE.
  plugins: [apiDevPlugin(), react(), tailwindcss()],
  server: { proxy: { "/api": "http://127.0.0.1:8790", "/snapshots": "http://127.0.0.1:8790" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
}));
