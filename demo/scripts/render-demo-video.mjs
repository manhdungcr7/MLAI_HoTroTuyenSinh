import puppeteer from "puppeteer-core";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const run = promisify(execFile);
const assets = resolve("demo/assets");
const out = resolve("demo/final");
const ffmpeg = process.env.FFMPEG || "C:/Users/ppnh1/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-essentials_build/bin/ffmpeg.exe";
const chrome = process.env.NV_BROWSER_CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
if (!existsSync(ffmpeg) || !existsSync(chrome)) throw new Error("Set FFMPEG and NV_BROWSER_CHROME to installed executables.");
await mkdir(out, { recursive: true });

const scenes = [
  ["01-start.png", 8, "Bắt đầu với mục tiêu rõ ràng", "Tạo hồ sơ học sinh lớp 11–12 để xem các lựa chọn phù hợp."],
  ["02-profile.png", 10, "Thiết lập hồ sơ", "Chọn khu vực, nhóm ngành và ưu tiên học tập."],
  ["03-scores.png", 12, "Nhập điểm đang có", "Môn chưa có điểm có thể để trống; dữ liệu chưa đủ vẫn dùng được."],
  ["04-analysis.png", 10, "Xem đánh giá ban đầu", "Tổ hợp điểm được tính tự động; số liệu là tham khảo theo dữ liệu hiện có."],
  ["05-discovery.png", 12, "Khám phá chương trình", "Lọc danh mục trường và ngành, rồi mở chi tiết để xem thông tin."],
  ["07-preference-review.png", 14, "Cân nhắc gợi ý", "Xem các mức An toàn, Vừa sức, Thử sức và Dự phòng trước khi lưu."],
  ["08-preferences-saved.png", 14, "Sắp xếp nguyện vọng", "Học sinh tự quyết định thứ tự; lựa chọn vẫn được lưu sau khi tải lại."],
  ["09-study-goal.png", 12, "Đặt mục tiêu học tập", "Chọn chương trình mục tiêu để theo dõi kế hoạch tiếp theo."],
  ["10-study-plan.png", 13, "Tạo việc học trong tuần", "Kế hoạch được tạo từ mục tiêu; demo không nhập thời khóa biểu trên lớp."],
  ["12-companion-view.png", 10, "Chia sẻ có cân nhắc", "Liên kết chia sẻ có thể xem hồ sơ; chỉ tạo trong môi trường local demo."],
];
const total = scenes.reduce((sum, scene) => sum + scene[1], 0);
if (total > 120 || total < 110) throw new Error(`Storyboard duration must be 110–120 sec; got ${total}.`);

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const concat = [];
try {
  for (let index = 0; index < scenes.length; index += 1) {
    const [file, seconds, title, caption] = scenes[index];
    const image = `data:image/png;base64,${(await readFile(resolve(assets, file))).toString("base64")}`;
    const progress = Math.round(((index + 1) / scenes.length) * 100);
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>
      *{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;font-family:'Segoe UI',Arial,sans-serif;background:#f4f7fb;color:#17294e}
      main{height:1080px;padding:10px 64px;display:grid;grid-template-columns:500px 1fr;gap:110px;align-items:center;background:linear-gradient(120deg,#f5f8fd,#e8eefb)}
      .screen{width:500px;height:1060px;object-fit:contain;filter:drop-shadow(0 18px 24px #142c5526);border-radius:26px;background:white}
      section{align-self:stretch;display:flex;flex-direction:column;justify-content:center;max-width:1080px;padding-right:110px}
      .brand{font-size:22px;letter-spacing:3px;font-weight:700;color:#2547c5;margin-bottom:90px}
      .kicker{font-size:20px;letter-spacing:2px;color:#667693;margin-bottom:22px}
      h1{font-size:58px;line-height:1.12;margin:0 0 30px;font-weight:700;letter-spacing:-1px}
      p{font-size:30px;line-height:1.45;margin:0;color:#536581;max-width:950px}
      .foot{position:absolute;right:64px;bottom:64px;font-size:17px;color:#67758c}
      .bar{position:absolute;left:674px;right:64px;bottom:34px;height:5px;background:#d8dfeb;border-radius:5px;overflow:hidden}.bar i{display:block;width:${progress}%;height:100%;background:#2948cc}
      .count{position:absolute;left:674px;bottom:59px;color:#68768f;font-size:18px}
    </style><main><img class="screen" src="${image}"><section><div class="brand">NGUYỆN VỌNG AI</div><div class="kicker">HÀNH TRÌNH HỌC SINH · ${String(index + 1).padStart(2, "0")}</div><h1>${title}</h1><p>${caption}</p><div class="foot">Demo local · hồ sơ tổng hợp · Không phải cam kết trúng tuyển</div></section><div class="count">${String(index + 1).padStart(2, "0")} / ${scenes.length}</div><div class="bar"><i></i></div></main>`);
    await page.waitForFunction(() => document.querySelector("img")?.complete && document.querySelector("img")?.naturalWidth > 0, { timeout: 10000 });
    const png = resolve(assets, `video-scene-${String(index + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: png });
    const segment = resolve(assets, `video-segment-${String(index + 1).padStart(2, "0")}.mp4`);
    await run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", png, "-t", String(seconds), "-vf", "zoompan=z='min(zoom+0.00025,1.03)':d=1:s=1920x1080:fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-an", segment]);
    concat.push(`file '${segment.replaceAll("\\", "/").replaceAll("'", "'\\''")}'`);
  }
  const list = resolve(assets, "video-concat.txt");
  await writeFile(list, `${concat.join("\n")}\n`, "utf8");
  const final = resolve(out, "nguyen-vong-ai-demo.mp4");
  await run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", final]);
  console.log(JSON.stringify({ final, durationSeconds: total, scenes: scenes.length, resolution: "1920x1080", fps: 30, codec: "H.264", audio: "none" }, null, 2));
} finally {
  await browser.close();
}
