import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const base = process.env.NV_BROWSER_URL || 'http://127.0.0.1:3030';
const output = resolve('.agent-runtime/agent-native-browser');
const fixtureRun = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/agent-native-browser-fixture.ts'], { encoding: 'utf8' });
if (fixtureRun.status !== 0) throw new Error(fixtureRun.stderr);
const fixture = JSON.parse(fixtureRun.stdout.trim());
const emptyPreferencesFixture = { ...fixture, nguyenVong: [] };
const executablePath = process.env.NV_BROWSER_CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
if (!executablePath) throw new Error('Set NV_BROWSER_CHROME to an installed Chrome executable.');
await mkdir(output, { recursive: true });
const report = { base, at: new Date().toISOString(), checks: [], pages: [], errors: [], warnings: [] };
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const context = await browser.createBrowserContext();
const page = await context.newPage();
page.setDefaultTimeout(30000);
let location = '';
page.on('pageerror', e => report.errors.push({ location, type: 'pageerror', message: e.message }));
page.on('console', e => { if (e.type() === 'error') report.errors.push({ location, type: 'console', message: e.text() }); });
page.on('response', r => { if (r.status() >= 400) report.errors.push({ location, type: 'http', status: r.status(), url: r.url() }); });
page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') report.errors.push({ location, type: 'network', url: r.url(), message: r.failure()?.errorText }); });
const pause = () => new Promise(r => setTimeout(r, 250));
async function go(route) {
  location = route;
  await page.goto(`${base}/#${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.body?.innerText?.trim().length > 20, { timeout: 30000 });
  await pause();
  if (route === '/kham-pha') {
    await page.waitForFunction(() => !document.body.innerText.includes('Đang tải dữ liệu chương trình…'), { timeout: 60000 });
  }
}
async function clickText(text, exact = true) {
  const clicked = await page.evaluate((text, exact) => {
    const el = [...document.querySelectorAll('button,a')].find(el => exact ? el.textContent.trim() === text : el.textContent.includes(text));
    if (!el) return false;
    el.scrollIntoView({ block: 'center' }); el.click(); return true;
  }, text, exact);
  if (!clicked) throw new Error(`Missing action: ${text}`);
  await pause();
}
async function assert(value, message) { if (!value) throw new Error(message); }
async function check(name, fn) {
  try { await fn(); report.checks.push({ name, pass: true }); }
  catch (e) { report.checks.push({ name, pass: false, message: e.message }); await page.screenshot({ path: resolve(output, `failure-${report.checks.length}.png`), fullPage: true }); }
  console.log(JSON.stringify(report.checks.at(-1)));
}
async function state() { return page.evaluate(() => JSON.parse(localStorage.getItem('nvai:v2') || 'null')); }
async function audit(route, width, mode) {
  await page.setViewport({ width, height: 900 }); await go(route);
  const evidence = await page.evaluate(() => {
    const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    return {
      textLength: document.body.innerText.trim().length,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      brokenImages: [...document.images].filter(el => visible(el) && el.complete && el.naturalWidth === 0).map(el => el.src),
      smallTargets: [...document.querySelectorAll('button,a,input,select')].filter(el => visible(el) && !el.disabled && el.getBoundingClientRect().height < 44).length,
      overflowElements: [...document.querySelectorAll('body *')].filter(el => visible(el) && el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 6).map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 70), class: el.className })),
    };
  });
  report.pages.push({ mode, route, width, ...evidence });
  if (evidence.overflow > 1 || evidence.brokenImages.length || evidence.textLength < 30) report.errors.push({ type: 'render', mode, route, width, ...evidence });
  if (evidence.smallTargets) report.warnings.push({ type: 'touch-target', mode, route, width, count: evidence.smallTargets });
  if ([320, 390, 1440].includes(width)) await page.screenshot({ path: resolve(output, `${mode}-${width}-${route.replaceAll('/', '_') || 'home'}.png`), fullPage: true });
}
try {
  await page.setViewport({ width: 390, height: 900 }); await go('/chao');
  await check('minimal-grade11-no-scores', async () => {
    await go('/bat-dau/1');
    const hoTen = await page.$('#bd-ho-ten') ?? await page.$('input[placeholder="Ví dụ: Minh Anh"]');
    await assert(hoTen, 'Onboarding name field did not render');
    await hoTen.type('Học sinh kiểm tra');
    await clickText('Lớp 10–11'); await page.select('#bd-tinh', 'Hà Nội');
    await page.type('[aria-label="Tìm nhanh nhóm ngành"]', 'Công nghệ thông tin'); await pause();
    await page.click('#bd-nganh .grid button'); await clickText('Tiếp tục');
    await assert(page.url().endsWith('/bat-dau/2'), 'Step 1 did not advance');
    await clickText('Tiếp tục'); await clickText('Phân tích cơ hội');
    await assert((await state()).hoSo.hoanTat, 'Profile was not completed');
    await assert(Object.values((await state()).hoSo.diem).every(x => x === null), 'Blank scores became numeric');
    await go('/kham-pha'); await page.reload({ waitUntil: 'domcontentloaded' });
    await assert((await state()).hoSo.hoTen === 'Học sinh kiểm tra', 'Profile did not survive reload');
  });
  await check('BKA-search-and-preference-add-reorder-reload', async () => {
    await go('/chao');
    await page.evaluate(fixture => { localStorage.clear(); localStorage.setItem('nvai:v2', JSON.stringify(fixture)); }, emptyPreferencesFixture);
    await page.reload({ waitUntil: 'domcontentloaded' }); await pause();
    await go('/kham-pha'); await page.type('[aria-label="Tìm trường hoặc ngành"]', 'Bách Khoa Hà Nội');
    await page.waitForFunction(() => [...document.querySelectorAll('ul.space-y-3 > li > article > button')].some(el => el.innerText.includes('ĐH Bách Khoa Hà Nội')), { timeout: 10000 });
    const links = [];
    const seen = new Set();
    for (let attempt = 0; attempt < 20 && links.length < 2; attempt++) {
      const cards = await page.$$('ul.space-y-3 > li > article > button');
      let cardLabel;
      for (const candidate of cards) {
        const label = (await candidate.evaluate(el => el.innerText)).trim();
        if (label.includes('ĐH Bách Khoa Hà Nội') && !seen.has(label)) { seen.add(label); cardLabel = label; break; }
      }
      if (!cardLabel) {
        const more = await page.$$('button');
        const showMore = await Promise.all(more.map(async button => ({ button, label: (await button.evaluate(el => el.innerText)).trim() })));
        const next = showMore.find(x => x.label.startsWith('Xem thêm'))?.label;
        if (!next) break;
        await clickText(next); continue;
      }
      const navigated = await page.evaluate(label => {
        const el = [...document.querySelectorAll('ul.space-y-3 > li > article > button')].find(x => x.innerText.trim() === label);
        if (!el) return false;
        el.scrollIntoView({ block: 'center' }); el.click(); return true;
      }, cardLabel);
      if (!navigated) continue;
      await pause();
      const route = new URL(page.url()).hash.replace(/^#/, '');
      if (/^\/kham-pha\/[^/]+$/.test(route)) links.push(route);
      await go('/kham-pha'); await page.type('[aria-label="Tìm trường hoặc ngành"]', 'Bách Khoa Hà Nội');
      await page.waitForFunction(() => [...document.querySelectorAll('ul.space-y-3 > li > article > button')].some(el => el.innerText.includes('ĐH Bách Khoa Hà Nội')), { timeout: 10000 });
    }
    await assert(links.length >= 2, `BKA returned only ${links.length} detail routes`);
    report.bkaPrograms = links.slice(0, 2);
    for (const href of links.slice(0, 2)) {
      const id = href.split('/').at(-1);
      await go(href.replace(/^#/, ''));
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(el => ['+ Thêm Nguyện Vọng', 'Đã trong Nguyện Vọng'].includes(el.innerText.trim())), { timeout: 10000 });
      await clickText('+ Thêm Nguyện Vọng');
      await page.waitForFunction(id => JSON.parse(localStorage.getItem('nvai:v2') || 'null')?.nguyenVong?.includes(id), { timeout: 3000 }, id);
    }
    await go('/nguyen-vong'); const before = (await state()).nguyenVong;
    await assert(links.slice(0, 2).every(href => before.includes(href.split('/').at(-1))), `Preferences were not persisted: ${JSON.stringify({ expected: links, actual: before })}`);
    await page.click('button[aria-label$="xuống dưới"]'); await pause(); const after = (await state()).nguyenVong;
    await assert(after[0] === before[1], 'Reorder did not change priority');
    await page.reload({ waitUntil: 'domcontentloaded' }); await assert((await state()).nguyenVong[0] === after[0], 'Preference reorder not persisted');
    report.preferenceAnalysis = await page.$eval('main', el => el.innerText).catch(() => page.$eval('body', el => el.innerText));
  });
  await check('chat-composer-renders-without-request', async () => {
    await go('/tu-van');
    await assert(await page.$('input[placeholder^="Ví dụ:"]'), 'Chat composer did not render');
    await assert(await page.$$eval('button', els => els.some(el => el.textContent.trim() === 'Gửi')), 'Chat send action did not render');
  });
  await check('unknown-school-honest-empty-state', async () => { await go('/truong/QA-NOT-A-SCHOOL'); await assert(/không tìm|chưa có|không có/i.test(await page.$eval('body', el => el.innerText)), 'Unknown school has no honest empty state'); });
  const routes = ['/gioi-thieu', '/chao', '/bat-dau/1', '/', '/ho-so', '/ho-so/chia-se', '/kham-pha', '/tu-van', '/huong-nghiep', '/nguyen-vong', '/ke-hoach/tuan', '/ke-hoach/tien-do', '/ho-so/cai-dat'];
  for (const mode of ['empty', 'seeded']) {
    await go('/chao'); await page.evaluate((fixture) => { localStorage.clear(); sessionStorage.clear(); if (fixture) localStorage.setItem('nvai:v2', JSON.stringify(fixture)); }, mode === 'seeded' ? fixture : null);
    await page.reload({ waitUntil: 'domcontentloaded' }); await pause();
    for (const width of [320, 375, 390, 430, 768, 1440]) { for (const route of routes) await audit(route, width, mode); console.log(`${mode} ${width}: ${routes.length} routes checked`); }
  }
  await check('five-preferences-320px-chat-and-companion', async () => {
    await page.setViewport({ width: 320, height: 900 });
    await go('/chao');
    await page.evaluate((fixture) => { localStorage.clear(); localStorage.setItem('nvai:v2', JSON.stringify(fixture)); }, fixture);
    await page.reload({ waitUntil: 'domcontentloaded' }); await pause();
    await go('/nguyen-vong');
    await assert((await state()).nguyenVong.length >= 5, 'Seed needs at least five preferences');
    await assert((await page.$eval('main', el => el.innerText)).includes('5 nguyện vọng'), 'Preference total is missing or inconsistent');
    const chatButton = await page.$('button[aria-label="Hỏi trợ lý tuyển sinh"]');
    await assert(chatButton, 'Preference list has no in-flow chat entry');
    await assert(!(await page.$('button[aria-label="Mở Chatbot AI"]')), 'Floating chat button overlaps the preference list');
    await chatButton.click();
    await assert(await page.$('[role="dialog"][aria-label="Chatbot AI Tuyển sinh"]'), 'Chat dialog did not open');
    await page.keyboard.press('Escape'); await pause();
    await assert(!(await page.$('[role="dialog"][aria-label="Chatbot AI Tuyển sinh"]')), 'Escape did not close chat dialog');

    await go('/ho-so/chia-se');
    const shareText = await page.$eval('main', el => el.innerText);
    await assert(shareText.includes('Nguyện vọng của Minh Anh'), 'Share page does not use the short student name');
    await clickText('Tạo liên kết');
    const shareUrl = await page.$eval('p.select-all', el => el.textContent.trim());
    await assert(shareUrl.startsWith('http'), 'Share link was not created');
    await go(new URL(shareUrl).hash.replace(/^#/, ''));
    const companionText = await page.$eval('main', el => el.innerText);
    await assert(companionText.includes('Nguyện vọng học sinh chia sẻ') && companionText.includes('5 lựa chọn đang cân nhắc'), 'Companion view is missing its privacy-safe title or correct count');
  });
} catch (e) { report.errors.push({ type: 'harness', message: e.stack }); }
finally {
  await browser.close();
  report.pass = report.errors.length === 0 && report.checks.every(x => x.pass);
  await writeFile(resolve(output, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pass: report.pass, pages: report.pages.length, checks: report.checks, errors: report.errors.length, warnings: report.warnings.length, output, note: 'Chat was checked without submitting a question; API/provider behavior was not exercised.' }));
  if (!report.pass) process.exitCode = 1;
}
