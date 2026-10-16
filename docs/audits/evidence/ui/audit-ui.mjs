import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const base = process.env.NV_BROWSER_URL || 'http://127.0.0.1:3030';
const output = resolve(process.env.NV_UI_EVIDENCE_DIR || 'docs/audits/evidence/ui');
const chrome = process.env.NV_BROWSER_CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!chrome) throw new Error('Set NV_BROWSER_CHROME to an installed browser.');
const fixtureRun = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/agent-native-browser-fixture.ts'], { encoding: 'utf8' });
if (fixtureRun.status !== 0) throw new Error(fixtureRun.stderr);
const fixture = JSON.parse(fixtureRun.stdout.trim());
const viewports = [[320, 720], [375, 812], [390, 844], [430, 932], [768, 1024], [1440, 900]];
const report = { base, at: new Date().toISOString(), viewports: [], routes: [], errors: [] };
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.setDefaultTimeout(20000);
let activeRoute = '';
page.on('pageerror', e => report.errors.push({ route: activeRoute, type: 'pageerror', message: e.message }));
page.on('console', e => { if (e.type() === 'error') report.errors.push({ route: activeRoute, type: 'console', message: e.text() }); });
page.on('response', r => { if (r.status() >= 400) report.errors.push({ route: activeRoute, type: 'http', status: r.status(), url: r.url() }); });
page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') report.errors.push({ route: activeRoute, type: 'network', url: r.url(), message: r.failure()?.errorText }); });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function go(route) {
  activeRoute = route;
  await page.goto(`${base}/#${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body?.innerText?.trim().length > 20);
  if (route === '/kham-pha') await page.waitForFunction(() => !document.body.innerText.includes('Đang tải dữ liệu chương trình…'), { timeout: 60000 });
  await pause(350);
}
async function inspect(route, width, height) {
  await page.setViewport({ width, height });
  await go(route);
  const metrics = await page.evaluate(() => {
    const visible = el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const interactives = [...document.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[role="button"]')].filter(visible);
    const textNodes = [...document.querySelectorAll('h1,h2,h3,button,a,[role="button"]')].filter(visible);
    const clippedText = textNodes.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => ({ tag: el.tagName, text: el.innerText.trim().slice(0, 100), width: el.clientWidth, scrollWidth: el.scrollWidth }));
    const smallTargets = interactives.filter(el => {
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') return false;
      const r = el.getBoundingClientRect();
      return r.width < 44 || r.height < 44;
    }).map(el => ({ tag: el.tagName, text: el.innerText.trim().slice(0, 80), aria: el.getAttribute('aria-label'), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) }));
    const overflowElements = [...document.querySelectorAll('body *')].filter(visible).filter(el => {
      const r = el.getBoundingClientRect();
      return r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed';
    }).slice(0, 8).map(el => ({ tag: el.tagName, text: el.innerText?.trim().slice(0, 60), right: Math.round(el.getBoundingClientRect().right), class: typeof el.className === 'string' ? el.className.slice(0, 100) : '' }));
    const bottomNav = document.querySelector('nav[aria-label="Điều hướng chính"]');
    const floating = [...document.querySelectorAll('button')].find(el => /Chatbot|chatbot/i.test(el.getAttribute('aria-label') || el.innerText));
    const navRect = bottomNav?.getBoundingClientRect(), floatRect = floating?.getBoundingClientRect();
    return {
      textLength: document.body.innerText.trim().length,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      clippedText,
      smallTargets,
      overflowElements,
      bottomNav: navRect ? { top: Math.round(navRect.top), bottom: Math.round(navRect.bottom), height: Math.round(navRect.height) } : null,
      floatingWidget: floatRect ? { top: Math.round(floatRect.top), bottom: Math.round(floatRect.bottom), width: Math.round(floatRect.width), height: Math.round(floatRect.height), overlapBottomNav: !!navRect && floatRect.bottom > navRect.top && floatRect.top < navRect.bottom } : null,
      headings: [...document.querySelectorAll('h1,h2')].filter(visible).map(el => el.innerText.trim()),
      title: document.title,
    };
  });
  report.routes.push({ route, width, height, ...metrics });
  if ([320, 390, 1440].includes(width)) {
    const slug = route.replaceAll('/', '_').replace(/^_/, '') || 'home';
    await page.screenshot({ path: resolve(output, `${width}-${slug}.png`) });
  }
}
try {
  await page.setViewport({ width: 390, height: 844 });
  await go('/chao');
  await page.evaluate(value => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nvai:v2', JSON.stringify(value)); }, fixture);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pause(500);

  const routes = ['/chao', '/bat-dau/1', '/bat-dau/2', '/bat-dau/3', '/nguyen-vong', '/tu-van', '/ho-so/chia-se', '/kham-pha', '/kham-pha/bo-loc'];
  for (const [width, height] of viewports) for (const route of routes) await inspect(route, width, height);

  await page.setViewport({ width: 390, height: 844 });
  await go('/kham-pha');
  await page.waitForSelector('ul.space-y-3 > li > article > button', { timeout: 15000 });
  await page.click('ul.space-y-3 > li > article > button');
  await pause(350);
  const detailRoute = new URL(page.url()).hash.replace(/^#/, '');
  report.detailRoute = detailRoute;
  if (!/^\/kham-pha\/[^/]+$/.test(detailRoute)) throw new Error(`Expected program detail route, got ${detailRoute}`);
  for (const [width, height] of viewports) await inspect(detailRoute, width, height);

  await page.setViewport({ width: 320, height: 720 });
  await go('/nguyen-vong');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('nvai:v2') || 'null'));
  state.nguyenVong = [];
  await page.evaluate(value => localStorage.setItem('nvai:v2', JSON.stringify(value)), state);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pause(250);
  report.emptyPreferenceState = await page.evaluate(() => ({ text: document.body.innerText, overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth }));
  await page.screenshot({ path: resolve(output, '320-nguyen-vong-empty.png') });
} finally {
  await browser.close();
}
await writeFile(resolve(output, 'metrics.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ routes: report.routes.length, viewportWidths: viewports.map(v => v[0]), detailRoute: report.detailRoute, errors: report.errors.length, output }));
