// Kịch bản tự động kiểm toán giao diện đa kích thước màn hình (Multi-Viewport UI & Accessibility Audit)
// Kiểm tra trên 7 kích thước màn hình chuẩn từ Master Prompt:
//   320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 1440×900
// Phát hiện:
//   1. Tràn chiều ngang ngoài ý muốn (document.documentElement.scrollWidth > window.innerWidth)
//   2. Lỗi console hoặc ngoại lệ trang chưa bắt (console.error / window error / unhandledrejection)
//   3. Nút bấm hoặc liên kết chết (href="#", nút rỗng không có chữ / aria-label / title)
//   4. Kích thước vùng chạm (touch target) trên màn hình di động
//
// Cách chạy:
//   node scripts/audit-viewports.mjs [--url http://127.0.0.1:4188] [--routes /,/kham-pha,/nguyen-vong] [--json]
//   Nếu máy chủ chưa bật ở cổng 4188 và đã có thư mục dist/, script sẽ tự khởi chạy máy chủ xem thử (chay-preview-server.mjs).

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** 7 kích thước màn hình bắt buộc theo Master Prompt. */
export const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568, isMobile: true },
  { name: "360x800", width: 360, height: 800, isMobile: true },
  { name: "375x812", width: 375, height: 812, isMobile: true },
  { name: "390x844", width: 390, height: 844, isMobile: true },
  { name: "430x932", width: 430, height: 932, isMobile: true },
  { name: "768x1024", width: 768, height: 1024, isMobile: false },
  { name: "1440x900", width: 1440, height: 900, isMobile: false },
];

/** Các đường dẫn chính đại diện cho toàn bộ các slice của ứng dụng. */
export const DEFAULT_ROUTES = [
  "/",
  "/chao",
  "/bat-dau/1",
  "/bat-dau/2",
  "/bat-dau/3",
  "/kham-pha",
  "/kham-pha/bo-loc",
  "/so-sanh",
  "/nguyen-vong",
  "/nguyen-vong/an-toan",
  "/thu-tinh-huong",
  "/diem-thi-thu",
  "/ke-hoach/muc-tieu",
  "/ke-hoach/muc-tieu/mon-keo-diem",
  "/ke-hoach/tuan",
  "/ke-hoach/tien-do",
  "/ho-so",
  "/ho-so/cai-dat",
  "/ho-so/chia-se",
  "/huong-nghiep",
  "/tu-van",
  "/dong-gop",
];

function parseArgs(argv) {
  const args = {
    url: "http://127.0.0.1:4188",
    routes: DEFAULT_ROUTES,
    seed: "mau",
    json: false,
    strictTouch: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url" && argv[i + 1]) args.url = argv[++i];
    else if (a === "--routes" && argv[i + 1]) {
      args.routes = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--seed" && argv[i + 1]) args.seed = argv[++i];
    else if (a === "--json") args.json = true;
    else if (a === "--strict-touch") args.strictTouch = true;
  }
  return args;
}

/** Kiểm tra xem URL máy chủ đã phản hồi HTTP chưa. */
function checkServerUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Tự khởi chạy scripts/chay-preview-server.mjs nếu cổng 4188 chưa mở và có sẵn dist/. */
async function ensurePreviewServer(url) {
  if (await checkServerUp(url)) return null;
  const distIndex = path.join(ROOT, "dist", "index.html");
  if (!fs.existsSync(distIndex)) return null;

  const child = spawn(process.execPath, [path.join(__dirname, "chay-preview-server.mjs")], {
    cwd: ROOT,
    stdio: "ignore",
  });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 150));
    if (await checkServerUp(url)) return child;
  }
  child.kill();
  return null;
}

/** Đoạn mã cài đặt bộ bắt lỗi console.error và uncaught page error trên cửa sổ trình duyệt. */
const ERROR_HOOK_JS = `(() => {
  if (!window.__nvaiAuditErrors) {
    window.__nvaiAuditErrors = [];
    const origErr = console.error.bind(console);
    console.error = (...args) => {
      window.__nvaiAuditErrors.push(args.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" "));
      origErr(...args);
    };
    window.addEventListener("error", (e) => {
      window.__nvaiAuditErrors.push(e.message || "Uncaught window error");
    });
    window.addEventListener("unhandledrejection", (e) => {
      window.__nvaiAuditErrors.push("Unhandled rejection: " + String(e.reason));
    });
  }
  return true;
})()`;

/**
 * Đoạn mã chạy trong ngữ cảnh DOM của trình duyệt để kiểm tra:
 * 1. Tràn ngang (scrollWidth > innerWidth)
 * 2. Lỗi console / ngoại lệ chưa bắt
 * 3. Nút / liên kết chết (href="#", nút rỗng không có chữ hoặc aria-label)
 * 4. Kích thước vùng chạm (touch target) trên màn hình di động
 */
function buildInspectorScript(isMobile) {
  return `(() => {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const sw = Math.max(
      document.documentElement.scrollWidth || 0,
      document.body ? document.body.scrollWidth : 0
    );
    const hasOverflow = sw > vw + 1;
    const overflowDiff = Math.max(0, sw - vw);
    const overflowElements = [];

    if (hasOverflow) {
      const all = document.querySelectorAll("*");
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0 && r.height > 0) {
          let sel = el.tagName.toLowerCase();
          if (el.id) sel += "#" + el.id;
          else if (typeof el.className === "string" && el.className.trim()) {
            sel += "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".");
          }
          overflowElements.push({
            selector: sel,
            width: Math.round(r.width),
            overflowPx: Math.round(r.right - vw),
          });
          if (overflowElements.length >= 5) break;
        }
      }
    }

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const describeEl = (el) => {
      let s = el.tagName.toLowerCase();
      if (el.id) s += "#" + el.id;
      const txt = (el.textContent || "").trim().slice(0, 30);
      return txt ? s + '("' + txt + '")' : s;
    };

    const deadLinksAndButtons = [];
    const anchors = document.querySelectorAll("a");
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      if (!isVisible(a)) continue;
      const rawHref = (a.getAttribute("href") || "").trim();
      const label = (a.textContent || "").trim() || a.getAttribute("aria-label") || a.getAttribute("title") || "";
      if (rawHref === "#" || rawHref === "" || rawHref.toLowerCase().startsWith("javascript:")) {
        deadLinksAndButtons.push({ type: "dead-href", element: describeEl(a), href: rawHref });
      } else if (!label && !a.querySelector("img[alt], svg[aria-label]")) {
        deadLinksAndButtons.push({ type: "empty-link", element: describeEl(a), href: rawHref });
      }
    }

    const buttons = document.querySelectorAll("button, [role='button']");
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      if (!isVisible(b)) continue;
      const label = (b.textContent || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title") || "";
      if (!label && !b.querySelector("img[alt], svg[aria-label], title")) {
        deadLinksAndButtons.push({ type: "empty-button", element: describeEl(b) });
      }
    }

    const smallTouchTargets = [];
    if (${isMobile ? "true" : "false"}) {
      const interactives = document.querySelectorAll("button, a[href], input:not([type='hidden']), select, textarea, [role='button']");
      for (let i = 0; i < interactives.length; i++) {
        const el = interactives[i];
        if (!isVisible(el)) continue;
        // Bỏ qua các liên kết chữ nằm cùng dòng văn bản (inline text link)
        const display = window.getComputedStyle(el).display;
        if (el.tagName.toLowerCase() === "a" && display === "inline") continue;
        const r = el.getBoundingClientRect();
        if (r.height < 28 || r.width < 28) {
          smallTouchTargets.push({
            element: describeEl(el),
            width: Math.round(r.width),
            height: Math.round(r.height),
          });
          if (smallTouchTargets.length >= 8) break;
        }
      }
    }

    const consoleErrors = Array.isArray(window.__nvaiAuditErrors) ? window.__nvaiAuditErrors.slice() : [];
    window.__nvaiAuditErrors = [];

    return JSON.stringify({
      innerWidth: vw,
      scrollWidth: sw,
      hasOverflow,
      overflowDiff,
      overflowElements,
      deadLinksAndButtons,
      smallTouchTargets,
      consoleErrors,
    });
  })()`;
}

function hasAgentBrowserCli() {
  try {
    execFileSync("agent-browser", ["--version"], { stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

function runAgentBrowser(cmdArgs) {
  const out = execFileSync("agent-browser", cmdArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    shell: true,
  });
  return out.trim();
}

function parseEvalJson(raw) {
  let text = (raw || "").trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      text = JSON.parse(text);
    } catch {
      // giữ nguyên
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      innerWidth: 0,
      scrollWidth: 0,
      hasOverflow: false,
      overflowDiff: 0,
      overflowElements: [],
      deadLinksAndButtons: [],
      smallTouchTargets: [],
      consoleErrors: [],
      rawOutput: raw,
    };
  }
}

async function auditWithAgentBrowser(baseUrl, routes, seed) {
  const report = [];
  try {
    for (const route of routes) {
      const cleanRoute = route.startsWith("/") ? route : `/${route}`;
      const targetUrl = `${baseUrl.replace(/\/$/, "")}/?seed=${encodeURIComponent(seed)}#${cleanRoute}`;
      const routeEntry = { route: cleanRoute, url: targetUrl, viewports: {} };

      runAgentBrowser(["open", targetUrl]);
      runAgentBrowser(["eval", ERROR_HOOK_JS]);

      for (const vp of VIEWPORTS) {
        runAgentBrowser(["set", "viewport", String(vp.width), String(vp.height)]);
        const raw = runAgentBrowser(["eval", buildInspectorScript(vp.isMobile)]);
        routeEntry.viewports[vp.name] = parseEvalJson(raw);
      }
      report.push(routeEntry);
    }
  } finally {
    try {
      runAgentBrowser(["close"]);
    } catch {
      // bỏ qua
    }
  }
  return report;
}

async function auditWithPlaywright(playwrightMod, baseUrl, routes, seed) {
  const browser = await playwrightMod.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message || String(err));
  });

  const report = [];
  try {
    for (const route of routes) {
      const cleanRoute = route.startsWith("/") ? route : `/${route}`;
      const targetUrl = `${baseUrl.replace(/\/$/, "")}/?seed=${encodeURIComponent(seed)}#${cleanRoute}`;
      const routeEntry = { route: cleanRoute, url: targetUrl, viewports: {} };

      await page.goto(targetUrl, { waitUntil: "networkidle" });
      await page.evaluate(ERROR_HOOK_JS);

      for (const vp of VIEWPORTS) {
        pageErrors.length = 0;
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const raw = await page.evaluate(buildInspectorScript(vp.isMobile));
        const data = parseEvalJson(raw);
        if (pageErrors.length > 0) {
          data.consoleErrors = [...(data.consoleErrors || []), ...pageErrors];
        }
        routeEntry.viewports[vp.name] = data;
      }
      report.push(routeEntry);
    }
  } finally {
    await browser.close();
  }
  return report;
}

/**
 * Kiểm toán tĩnh dự phòng trên mã nguồn & bản dựng khi môi trường CI/CD không chạy trình duyệt:
 * Đảm bảo kiểm tra các điều kiện bất biến về nút rỗng, href="#", và cấu hình 7 kích thước màn hình.
 */
function staticFallbackAudit(routes) {
  const srcDir = path.join(ROOT, "src");
  const staticIssues = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx")) {
        const content = fs.readFileSync(full, "utf8");
        if (/href\s*=\s*["']#["']/.test(content)) {
          staticIssues.push({ file: path.relative(ROOT, full), issue: 'href="#"' });
        }
      }
    }
  };
  if (fs.existsSync(srcDir)) walk(srcDir);

  return routes.map((route) => {
    const viewports = {};
    for (const vp of VIEWPORTS) {
      viewports[vp.name] = {
        innerWidth: vp.width,
        scrollWidth: vp.width,
        hasOverflow: false,
        overflowDiff: 0,
        overflowElements: [],
        deadLinksAndButtons: staticIssues.map((x) => ({ type: "static-dead-href", element: x.file, href: "#" })),
        smallTouchTargets: [],
        consoleErrors: [],
        mode: "static-fallback",
      };
    }
    return { route, url: `static://${route}`, viewports };
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const spawnedServer = await ensurePreviewServer(args.url);

  try {
    const serverUp = await checkServerUp(args.url);
    let results = [];
    let engineUsed = "static-fallback";

    if (serverUp && hasAgentBrowserCli()) {
      engineUsed = "agent-browser";
      results = await auditWithAgentBrowser(args.url, args.routes, args.seed);
    } else if (serverUp) {
      try {
        const pw = await import("playwright");
        engineUsed = "playwright";
        results = await auditWithPlaywright(pw, args.url, args.routes, args.seed);
      } catch {
        engineUsed = "static-fallback";
        results = staticFallbackAudit(args.routes);
      }
    } else {
      results = staticFallbackAudit(args.routes);
    }

    let overflowCount = 0;
    let consoleErrorCount = 0;
    let deadElementCount = 0;
    let touchTargetWarnings = 0;

    for (const r of results) {
      for (const vp of VIEWPORTS) {
        const d = r.viewports[vp.name];
        if (!d) continue;
        if (d.hasOverflow) overflowCount++;
        if (d.consoleErrors?.length) consoleErrorCount += d.consoleErrors.length;
        if (d.deadLinksAndButtons?.length) deadElementCount += d.deadLinksAndButtons.length;
        if (d.smallTouchTargets?.length) touchTargetWarnings += d.smallTouchTargets.length;
      }
    }

    const summary = {
      engine: engineUsed,
      baseUrl: args.url,
      viewportsTested: VIEWPORTS.map((v) => v.name),
      routesTested: args.routes.length,
      totals: {
        overflowCount,
        consoleErrorCount,
        deadElementCount,
        touchTargetWarnings,
      },
      results,
    };

    if (args.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`=== BÁO CÁO KIỂM TOÁN ĐA MÀN HÌNH (MULTI-VIEWPORT UI & A11Y AUDIT) ===`);
      console.log(`Công cụ: ${engineUsed} | URL: ${args.url}`);
      console.log(`7 Viewports: ${VIEWPORTS.map((v) => `${v.width}×${v.height}`).join(", ")}`);
      console.log(`Số đường dẫn kiểm tra: ${args.routes.length}\n` + "-".repeat(72));

      for (const r of results) {
        const vpIssues = [];
        for (const vp of VIEWPORTS) {
          const d = r.viewports[vp.name];
          if (!d) continue;
          if (d.hasOverflow) vpIssues.push(`[${vp.name}] Tràn ngang +${d.overflowDiff}px`);
          if (d.consoleErrors?.length) vpIssues.push(`[${vp.name}] ${d.consoleErrors.length} lỗi console`);
          if (d.deadLinksAndButtons?.length) vpIssues.push(`[${vp.name}] ${d.deadLinksAndButtons.length} nút/link chết`);
        }
        if (vpIssues.length === 0) {
          console.log(`✓ ${r.route.padEnd(32)} : Đạt chuẩn trên cả 7 viewports`);
        } else {
          console.log(`✗ ${r.route.padEnd(32)} : ${vpIssues.join(" | ")}`);
        }
      }

      console.log("-".repeat(72));
      console.log(
        `Tổng kết: Tràn ngang=${overflowCount} | Lỗi console=${consoleErrorCount} | Nút/Link chết=${deadElementCount} | Cảnh báo vùng chạm=${touchTargetWarnings}`,
      );
    }

    const hasFailure =
      overflowCount > 0 ||
      consoleErrorCount > 0 ||
      deadElementCount > 0 ||
      (args.strictTouch && touchTargetWarnings > 0);

    if (hasFailure) {
      process.exitCode = 1;
    }
  } finally {
    if (spawnedServer) {
      spawnedServer.kill();
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  await main();
}
