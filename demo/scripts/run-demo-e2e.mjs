import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const base = process.env.NV_BROWSER_URL || "http://127.0.0.1:8790";
const output = resolve("demo/assets");
const chrome = process.env.NV_BROWSER_CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find(existsSync);
if (!chrome) throw new Error("Set NV_BROWSER_CHROME to the installed Chrome executable.");
await mkdir(output, { recursive: true });

const report = {
  base,
  startedAt: new Date().toISOString(),
  syntheticProfile: true,
  screens: [],
  checks: [],
  browserErrors: [],
  failedRequests: [],
  httpErrors: [],
  chat: null,
};

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const context = await browser.createBrowserContext();
const page = await context.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => report.browserErrors.push({ type: "pageerror", message: error.message }));
page.on("console", (message) => {
  if (message.type() === "error") report.browserErrors.push({ type: "console", message: message.text() });
});
page.on("requestfailed", (request) => {
  if (request.failure()?.errorText !== "net::ERR_ABORTED") report.failedRequests.push({ url: request.url(), message: request.failure()?.errorText });
});
page.on("response", async (response) => {
  if (response.status() >= 400) {
    const url = response.url();
    const entry = { status: response.status(), path: new URL(url).pathname };
    if (entry.path === "/api/tu-van" && response.request().method() === "POST") {
      const requestBody = (() => {
        try { return JSON.parse(response.request().postData() || "{}"); } catch { return {}; }
      })();
      let responseBody = {};
      try { responseBody = await response.json(); } catch {}
      report.chat = {
        method: "POST",
        path: entry.path,
        status: response.status(),
        question: requestBody.cauHoi,
        checkboxUncheckedAtSend: requestBody.hoSo === null,
        serializedProfileWasNull: requestBody.hoSo === null,
        contextContainsScore: /\b\d{1,2}[,.]\d\b/.test(requestBody.nguCanh || ""),
        contextContainsInterest: /CNTT|Công nghệ thông tin/i.test(requestBody.nguCanh || ""),
        responseBody: { loi: typeof responseBody.loi === "string" ? responseBody.loi : undefined },
      };
    } else report.httpErrors.push(entry);
  }
});

const pause = (ms = 250) => new Promise((resolvePause) => setTimeout(resolvePause, ms));
const bodyText = () => page.$eval("body", (body) => body.innerText);
async function waitText(text, timeout = 10000) {
  await page.waitForFunction((needle) => document.body?.innerText?.includes(needle), { timeout }, text);
}
async function button(text, exact = true) {
  const clicked = await page.evaluate((label, exactMatch) => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const found = [...document.querySelectorAll("button,a")].find((el) => {
      const name = (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
      const target = label.replace(/\s+/g, " ").trim();
      return visible(el) && (exactMatch ? name === target : name.includes(target));
    });
    if (!found) return false;
    found.scrollIntoView({ block: "center" });
    found.click();
    return true;
  }, text, exact);
  if (!clicked) throw new Error(`Missing visible button/link: ${text}`);
  await pause();
}
async function namedInput(name, value) {
  const index = await page.evaluate((label) => [...document.querySelectorAll("input")].findIndex((input) => {
    const names = [...(input.labels || [])].map((item) => item.innerText.trim());
    return input.getAttribute("aria-label") === label || names.includes(label);
  }), name);
  if (index < 0) throw new Error(`Missing input: ${name}`);
  const inputs = await page.$$("input");
  const input = inputs[index];
  await input.click({ clickCount: 3 });
  await page.keyboard.type(value);
}
async function screenshot(name) {
  const path = resolve(output, name);
  await page.screenshot({ path, fullPage: false });
  const route = new URL(page.url()).hash.replace(/(#\/dong-hanh\?d=)[^&]+/, "$1[redacted-demo-payload]");
  report.screens.push({ file: name, route, viewport: "390x844 CSS px", capturedAt: new Date().toISOString() });
}
async function check(name, pass, evidence = {}) {
  if (!pass) throw new Error(`Failed check: ${name}`);
  report.checks.push({ name, pass: true, ...evidence });
}

try {
  await page.goto(`${base}/#/chao`, { waitUntil: "domcontentloaded" });
  await waitText("Bắt đầu ngay");
  await screenshot("01-start.png");
  await button("Bắt đầu ngay");
  await page.waitForSelector("input#bd-ho-ten");
  await page.type("#bd-ho-ten", "An Demo");
  await button("Lớp 10–11");
  await page.select("#bd-tinh", "Hà Nội");
  await page.type('[aria-label="Tìm nhanh nhóm ngành"]', "Công nghệ thông tin");
  await pause();
  await page.click("#bd-nganh .grid button");
  await screenshot("02-profile.png");
  await button("Tiếp tục");
  await waitText("Điểm các môn");
  await namedInput("Toán", "8.2");
  await namedInput("Lý", "7.5");
  await namedInput("Hóa", "7.8");
  await namedInput("Anh", "8.0");
  await waitText("Tổ hợp xét tuyển tự tính");
  await screenshot("03-scores.png");
  await button("Tiếp tục");
  await waitText("Mục tiêu & ưu tiên");
  await button("30 – 60 triệu");
  await button("Ở nhà");
  await button("Hà Nội");
  await button("Có");
  await button("Rất quan tâm");
  await button("Phân tích cơ hội");
  await waitText("Hồ sơ của bạn đã sẵn sàng");
  const analysis = await bodyText();
  await check("profile-analysis", analysis.includes("Hồ sơ của bạn đã sẵn sàng") && analysis.includes("24,0 điểm"), { hasDeterministicScore: true });
  await screenshot("04-analysis.png");

  await button("Khám phá ngành học");
  await pause(1000);
  report.discoveryAfterClick = { route: new URL(page.url()).hash, bodyStart: (await bodyText()).slice(0, 500) };
  await page.waitForSelector('[aria-label="Tìm trường hoặc ngành"]');
  await screenshot("05-discovery.png");
  await page.type('[aria-label="Tìm trường hoặc ngành"]', "Kỹ thuật phần mềm");
  await pause();
  await screenshot("06-discovery-search.png");

  await button("Nguyện vọng", false);
  await waitText("Bắt đầu lập danh sách");
  await button("Gợi ý danh sách");
  await waitText("Gợi ý danh sách phù hợp");
  const suggestionDialog = await bodyText();
  await check("suggestion-review", suggestionDialog.includes("Thử sức") && suggestionDialog.includes("An toàn") && suggestionDialog.includes("Dự phòng"));
  await screenshot("07-preference-review.png");
  await button("Lưu cả 6 ngành vào danh sách");
  await waitText("Danh sách nguyện vọng");
  const savedList = await page.$eval('main [aria-label="Danh sách nguyện vọng theo thứ tự ưu tiên"]', (list) => list.innerText);
  await check("six-preferences-saved", (savedList.match(/NV 0[1-6]/g) || []).length === 6);
  await button("Đưa QHQ · Công nghệ thông tin ứng dụng lên trên");
  const beforeReload = await page.$eval('main [aria-label="Danh sách nguyện vọng theo thứ tự ưu tiên"]', (list) => list.innerText);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitText("Danh sách nguyện vọng");
  const afterReload = await page.$eval('main [aria-label="Danh sách nguyện vọng theo thứ tự ưu tiên"]', (list) => list.innerText);
  const orderSaved = beforeReload.slice(0, 200) === afterReload.slice(0, 200) && afterReload.includes("NV 01\nVừa sức\nCông nghệ thông tin ứng dụng");
  await check("preference-order-survives-reload", orderSaved);
  await screenshot("08-preferences-saved.png");

  await button("Kế hoạch", false);
  await waitText("Mục tiêu chính");
  if ((await bodyText()).includes("Bạn chưa chọn mục tiêu chính")) await button("Chọn Công nghệ thông tin ứng dụng làm mục tiêu");
  await waitText("Phương thức xét tuyển");
  await screenshot("09-study-goal.png");
  await button("Kế hoạch tuần");
  await waitText("Tạo việc và xếp lịch");
  await button("Tạo việc và xếp lịch");
  if ((await bodyText()).includes("Chưa có lịch học trên lớp")) await button("Vẫn tạo");
  await waitText("Đã tạo");
  const planText = await bodyText();
  await check("study-plan-generated", /Trong tuần\s+\(\d+ việc\)/.test(planText), { schoolScheduleWasNotEntered: true });
  await screenshot("10-study-plan.png");

  await button("Hồ sơ", false);
  await waitText("Hồ sơ của bạn");
  await button("Chia sẻ Phụ huynh, thầy cô");
  await waitText("Chia sẻ với người đồng hành");
  const warning = await bodyText();
  await check("share-privacy-warning-visible", warning.includes("ai có liên kết đều xem được") && warning.includes("không thu hồi được"));
  await screenshot("11-companion-share-warning.png");
  await button("Tạo liên kết");
  await waitText("Ngày tạo:");
  const shareUrl = await page.$eval("p.select-all", (el) => el.textContent.trim());
  if (!shareUrl.startsWith(base)) throw new Error("Share link did not stay on the local environment.");
  await page.goto(shareUrl, { waitUntil: "domcontentloaded" });
  await waitText("Nguyện vọng học sinh chia sẻ");
  const companion = await bodyText();
  await check("companion-view-opens-locally", companion.includes("6 lựa chọn đang cân nhắc") && !companion.includes("An Demo"));
  await screenshot("12-companion-view.png");

  await page.goto(`${base}/#/tu-van`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[placeholder^="Ví dụ:"]');
  const privacyControl = await page.evaluate(() => {
    const label = [...document.querySelectorAll("label")].find((el) => el.innerText.includes("Kèm hồ sơ của bạn"));
    const input = label?.querySelector("input");
    if (input?.checked) label.click();
    return { found: !!input, checked: input?.checked ?? null };
  });
  if (!privacyControl.found || privacyControl.checked !== false) throw new Error("Could not turn off the profile context control in the chat.");
  await page.type('input[placeholder^="Ví dụ:"]', "Em lớp 11 chưa có điểm thi thử, nên bắt đầu từ đâu?");
  await button("Gửi");
  await waitText("Dịch vụ tư vấn", 12000).catch(() => {});
  await page.waitForFunction(() => document.querySelector('[aria-label="Cuộc trò chuyện"]')?.innerText.length > 60, { timeout: 15000 });
  const chatText = await page.$eval('[aria-label="Cuộc trò chuyện"]', (el) => el.innerText);
  const fallbackLộHoSo = chatText.includes("Với tổ hợp D07") || chatText.includes("24,0 điểm");
  await check("local-chat-opt-out", report.chat?.checkboxUncheckedAtSend === true && report.chat.contextContainsScore === false && report.chat.contextContainsInterest === false && !fallbackLộHoSo);
  report.chat ||= { method: "POST", path: "/api/tu-van", status: null, note: "No 4xx/5xx response captured." };
  report.chat.uiFallbackMentionsProfileDespiteUnchecked = fallbackLộHoSo;
  report.chat.uiAnswerExcerpt = chatText.slice(0, 420);
  // Do not capture this chat screen. It is a privacy finding, not demo footage.

  const stored = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("nvai:v2") || "null");
    return {
      name: state?.hoSo?.hoTen,
      grade: state?.hoSo?.lop,
      preferenceCount: state?.nguyenVong?.length ?? 0,
      profileSurvivedReload: state?.hoSo?.hoTen === "An Demo" && state?.nguyenVong?.length === 6,
    };
  });
  await check("profile-and-preferences-persist", stored.profileSurvivedReload, { name: "An Demo", grade: stored.grade, preferenceCount: stored.preferenceCount });
  report.finishedAt = new Date().toISOString();
  report.pass = report.checks.every((item) => item.pass);
} catch (error) {
  report.pass = false;
  report.fatal = error.stack || String(error);
  report.fatalRoute = page.url();
  report.fatalBody = await bodyText().catch(() => "");
} finally {
  await browser.close();
  await writeFile(resolve(output, "e2e-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    pass: report.pass,
    checks: report.checks,
    browserErrors: report.browserErrors.length,
    failedRequests: report.failedRequests.length,
    httpErrors: report.httpErrors,
    chat: report.chat && {
      status: report.chat.status,
      checkboxUncheckedAtSend: report.chat.checkboxUncheckedAtSend,
      contextContainsScore: report.chat.contextContainsScore,
      contextContainsInterest: report.chat.contextContainsInterest,
      uiFallbackMentionsProfileDespiteUnchecked: report.chat.uiFallbackMentionsProfileDespiteUnchecked,
      responseBody: report.chat.responseBody,
    },
    screens: report.screens.map((screen) => screen.file),
    fatal: report.fatal,
  }, null, 2));
  if (!report.pass) process.exitCode = 1;
}
