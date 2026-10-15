// Chụp ảnh màn hình thật của app (dev server :3030) cho slide. Chạy: node slides/chup-man-hinh.mjs
import { chromium } from 'file:///C:/Users/ppnh1/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
const BASE = 'http://localhost:3030/#';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

async function datMau(ten) {
  await page.goto(BASE + '/chao', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/chao', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t));
    if (b) b.click();
    return !!b;
  }, ten);
  console.log('mau', ten, ok);
  await sleep(1500);
}
async function chup(route, file, truoc) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await sleep(1200);
  if (truoc) await page.evaluate(truoc);
  await sleep(500);
  await page.screenshot({ path: path.join(out, file) });
  console.log('ok', file, page.url());
}

await datMau('Minh Anh');
await chup('/', 'hom-nay.png');
await chup('/kham-pha', 'kham-pha.png');
await chup('/nguyen-vong', 'nguyen-vong.png');
await chup('/ke-hoach/muc-tieu', 'muc-tieu.png');
await chup('/ke-hoach/tuan', 'ke-hoach-tuan.png');
await chup('/ho-so', 'ho-so.png');
await chup('/tu-van', 'tu-van.png');
await chup('/ho-so/chia-se', 'chia-se.png');
await chup('/bat-dau/2', 'buoc-2.png');
await chup('/bat-dau/3', 'buoc-3.png');

await datMau('Gia Bảo');
await chup('/', 'gb-hom-nay.png');
await chup('/nguyen-vong', 'gb-nguyen-vong.png');
await chup('/ke-hoach/muc-tieu', 'gb-muc-tieu.png');
await browser.close();
