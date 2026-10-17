import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync } from 'node:fs';

const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const seedData = JSON.parse(readFileSync('scripts/seed.json', 'utf8'));

async function main() {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((d) => {
    localStorage.setItem('nvai:v2', JSON.stringify(d));
  }, seedData);

  // 1. Viewport 375px - Top View
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3030/#/nguyen-vong', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'evidence/after-375.png' });
  console.log('Saved evidence/after-375.png');

  // 2. Viewport 375px - Scrolled View (Xem rõ các compact cards)
  await page.evaluate(() => window.scrollBy(0, 240));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'evidence/after-375-scrolled.png' });
  console.log('Saved evidence/after-375-scrolled.png');

  // 3. Viewport 430px - Top View
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'evidence/after-430.png' });
  console.log('Saved evidence/after-430.png');

  // 4. Viewport 320px - Narrow mobile
  await page.setViewport({ width: 320, height: 600, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'evidence/after-320.png' });
  console.log('Saved evidence/after-320.png');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('320px overflow:', overflow);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
