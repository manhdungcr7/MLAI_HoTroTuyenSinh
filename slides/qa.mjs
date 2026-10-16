// QA hình ảnh: node slides/qa.mjs  → slides/screenshots/*.png + contact-sheet.png
import { chromium } from 'file:///C:/Users/ppnh1/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'screenshots'); fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(dir, 'thuyet-trinh.html')).href;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const sizes = [[1920, 1080, ''], [1366, 768, '-1366']];
for (const [w, h, suf] of sizes) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto(url + '#1', { waitUntil: 'networkidle' });
  for (let n = 1; n <= 14; n++) {
    await page.keyboard.press(n === 1 ? 'Home' : 'ArrowRight');
    await page.waitForTimeout(1000);
    // kiểm tra tràn: phần tử nào của slide hiện tại nằm ngoài canvas 1920x1080
    const bad = await page.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect(); const r = [];
      document.querySelectorAll('.slide.on *').forEach((el) => {
        const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
        if (getComputedStyle(el).position === 'absolute' && el.closest('.codes')) return;
        if (b.left < st.left - 2 || b.right > st.right + 2 || b.top < st.top - 2 || b.bottom > st.bottom + 2) r.push(el.className || el.tagName);
      });
      const broken = [...document.querySelectorAll('.slide.on img')].filter((i) => !i.naturalWidth).length;
      return { out: r.slice(0, 5), broken };
    });
    if (bad.out.length || bad.broken) console.log(w, 'slide', n, JSON.stringify(bad));
    await page.screenshot({ path: path.join(out, `slide-${String(n).padStart(2, '0')}${suf}.png`) });
  }
}
// contact sheet + offline PDF
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const imgs = Array.from({ length: 14 }, (_, k) => pathToFileURL(path.join(out, `slide-${String(k + 1).padStart(2, '0')}.png`)).href);
const sheet = path.join(out, 'contact-sheet.html');
fs.writeFileSync(sheet, `<body style="margin:0;background:#0b1020;padding:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${imgs.map((u, k) => `<div style="position:relative"><img src="${u}" style="width:100%;display:block;border-radius:8px"><span style="position:absolute;right:10px;top:8px;color:#fff;font:700 20px sans-serif;background:#0008;padding:2px 10px;border-radius:6px">${k + 1}</span></div>`).join('')}</body>`);
await page.goto(pathToFileURL(sheet).href, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'contact-sheet.png'), fullPage: true });

// Offline PDF (14 pages, 1920x1080 landscape)
const pdfDir = path.join(dir, '..', 'evidence', 'presentation');
fs.mkdirSync(pdfDir, { recursive: true });
const pdfHtml = path.join(out, 'slides-pdf.html');
fs.writeFileSync(pdfHtml, `<!doctype html><html><head><style>@page{size:1920px 1080px;margin:0}body{margin:0;background:#000}.p{width:1920px;height:1080px;page-break-after:always;overflow:hidden}.p:last-child{page-break-after:auto}.p img{width:1920px;height:1080px;display:block}</style></head><body>${imgs.map((u) => `<div class="p"><img src="${u}"></div>`).join('')}</body></html>`);
await page.goto(pathToFileURL(pdfHtml).href, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.pdf({ path: path.join(pdfDir, 'NguyenvongAI-Slides-Offline.pdf'), width: '1920px', height: '1080px', printBackground: true });
await browser.close();
console.log('xong 14 slides + PDF');
