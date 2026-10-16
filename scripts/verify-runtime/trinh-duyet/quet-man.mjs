// Quét các màn chính trên production: chạy cần Playwright (npm i -D playwright && npx playwright install chromium).
// Quét các màn chính trên production ở hai viewport: tràn ngang, lỗi console, lỗi trang, API lỗi, ảnh chụp.
// Chạy: node scripts/verify-runtime/trinh-duyet/quet-man.mjs <thư mục ảnh> [màn1 màn2 ...]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2];
const BASE = "https://nguyenvongai.pages.dev/#";
const MAN = process.argv.length > 3 ? process.argv.slice(3) : ["/chao", "/kham-pha", "/nguyen-vong", "/tu-van", "/huong-nghiep", "/ke-hoach/tuan", "/ho-so", "/ho-so/cai-dat", "/ve-du-lieu", "/kham-pha/bo-loc", "/truong/DKC"];
const VP = [["mobile", 390, 844], ["desktop", 1440, 900]];

const browser = await chromium.launch();
const ketQua = [];
for (const [ten, w, h] of VP) {
  fs.mkdirSync(path.join(OUT, ten), { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  for (const man of MAN) {
    const page = await ctx.newPage();
    const loi = [];
    page.on("console", (m) => { if (m.type() === "error") loi.push(`console: ${m.text().slice(0, 160)}`); });
    page.on("pageerror", (e) => loi.push(`pageerror: ${e.message.slice(0, 160)}`));
    page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 400) loi.push(`api ${r.status()}: ${r.url().replace(/^https?:\/\/[^/]+/, "")}`); });
    try {
      await page.goto(BASE + man, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(800);
    } catch (e) { loi.push(`goto: ${e.message.slice(0, 120)}`); }
    const tran = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => null);
    const tieu = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? "").catch(() => "");
    const ten2 = man.replace(/[\/:]/g, "_").replace(/^_/, "") || "goc";
    await page.screenshot({ path: path.join(OUT, ten, `${ten2}.png`), fullPage: false }).catch(() => {});
    ketQua.push({ vp: ten, man, tran, tieu, loi: [...new Set(loi)] });
    console.log(`${ten} ${man} | tràn:${tran} | h1:"${tieu}" | lỗi:${[...new Set(loi)].length}`);
    for (const l of [...new Set(loi)].slice(0, 4)) console.log(`    ${l}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "ket-qua-quet.json"), JSON.stringify(ketQua, null, 2), "utf8");
