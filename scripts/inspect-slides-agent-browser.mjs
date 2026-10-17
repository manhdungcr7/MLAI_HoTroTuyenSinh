// Script tự động hóa Inspect & Audit toàn bộ 14 Slide thuyết trình Nguyện Vọng AI
// Sử dụng Playwright / Chrome Engine tiêu chuẩn của agent-browser
import { chromium } from 'file:///C:/Users/ppnh1/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const slidesDir = path.join(root, 'slides');
const outDir = path.join(slidesDir, 'screenshots', 'agent-browser');
fs.mkdirSync(outDir, { recursive: true });

const htmlPath = path.join(slidesDir, 'thuyet-trinh.html');
if (!fs.existsSync(htmlPath)) {
  console.error('Không tìm thấy file:', htmlPath);
  process.exit(1);
}
const fileUrl = pathToFileURL(htmlPath).href;

console.log('🚀 Bắt đầu khởi động Inspect Browser...');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true
});

const report = {
  timestamp: new Date().toISOString(),
  target: 'slides/thuyet-trinh.html',
  totalSlides: 14,
  viewports: [
    { name: '1080p (Full HD)', width: 1920, height: 1080 },
    { name: '768p (Laptop HD)', width: 1366, height: 768 }
  ],
  interactions: {},
  slides: []
};

// 1. Kiểm tra ở Viewport chuẩn 1920x1080 (1080p)
console.log('\n--- 📸 VIEWPORT 1: 1920x1080 (16:9 Full HD) ---');
const ctx1080 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page1080 = await ctx1080.newPage();

// Lắng nghe console log / lỗi
page1080.on('pageerror', (err) => console.error('[Page Error 1080p]:', err.message));

await page1080.goto(fileUrl + '#1', { waitUntil: 'networkidle' });
await page1080.waitForTimeout(600);

// Ép hiển thị nhanh không bị kẹt transition opacity
await page1080.addStyleTag({
  content: `
    .slide.on [data-r] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .slide.on { transition: none !important; opacity: 1 !important; }
  `
});

for (let idx = 1; idx <= 14; idx++) {
  // Chuyển slide bằng phím tuần tự từ Home
  await page1080.keyboard.press('Home');
  await page1080.waitForTimeout(100);
  for (let k = 1; k < idx; k++) {
    await page1080.keyboard.press('ArrowRight');
    await page1080.waitForTimeout(50);
  }
  await page1080.waitForTimeout(500);

  // Thu thập thông tin và kiểm tra lỗi của slide hiện tại
  const slideInfo = await page1080.evaluate((slideIdx) => {
    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();
    const curSlide = document.querySelector('.slide.on');
    if (!curSlide) return { id: `s${slideIdx}`, error: 'Không tìm thấy class .slide.on' };

    const titleEl = curSlide.querySelector('h1, h2, .eyebrow');
    const title = titleEl ? titleEl.textContent.trim().replace(/\s+/g, ' ') : `Slide ${slideIdx}`;

    // 1. Kiểm tra phần tử tràn viền (Overflow) ngoài khung #stage
    const overflows = [];
    const elements = curSlide.querySelectorAll('*');
    elements.forEach((el) => {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) return;
      // Bỏ qua pseudo hoặc tooltip ẩn
      if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') return;
      if (getComputedStyle(el).position === 'absolute' && el.closest('.codes')) return;
      if (el.classList.contains('nt')) return; // Ghi chú speaker note ẩn

      const leakLeft = b.left < stageRect.left - 4;
      const leakRight = b.right > stageRect.right + 4;
      const leakTop = b.top < stageRect.top - 4;
      const leakBottom = b.bottom > stageRect.bottom + 4;

      if (leakLeft || leakRight || leakTop || leakBottom) {
        overflows.push({
          tag: el.tagName.toLowerCase(),
          className: el.className || '',
          text: (el.textContent || '').slice(0, 40).trim(),
          leaks: { leakLeft, leakRight, leakTop, leakBottom }
        });
      }
    });

    // 2. Kiểm tra ảnh vỡ (Broken images)
    const images = Array.from(curSlide.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      loaded: img.complete && img.naturalWidth > 0,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
    const brokenImages = images.filter((img) => !img.loaded);

    // 3. Kiểm tra thanh số trang / HUD
    const hud = document.getElementById('hud');
    const hudText = hud ? hud.textContent.trim() : '';

    return {
      slideIdx,
      id: curSlide.id || `s${slideIdx}`,
      title,
      hud: hudText,
      overflowCount: overflows.length,
      overflows: overflows.slice(0, 3), // Lấy tối đa 3 phần tử tiêu biểu
      imagesCount: images.length,
      brokenImagesCount: brokenImages.length,
      brokenImages,
      allImages: images
    };
  }, idx);

  // Chụp ảnh 1080p
  const shotPath = path.join(outDir, `slide-${String(idx).padStart(2, '0')}-1080p.png`);
  await page1080.screenshot({ path: shotPath });
  console.log(`[Slide ${String(idx).padStart(2, '0')}] ${slideInfo.title} -> ${shotPath.split(/[\\/]/).pop()}`);
  if (slideInfo.overflowCount > 0) {
    console.warn(`  ⚠️ CẢNH BÁO TRÀN VIỀN: có ${slideInfo.overflowCount} phần tử vượt khung stage.`);
  }
  if (slideInfo.brokenImagesCount > 0) {
    console.error(`  ❌ LỖI ẢNH VỠ: ${slideInfo.brokenImagesCount} ảnh không hiển thị.`);
  }

  report.slides.push({
    ...slideInfo,
    screenshot1080p: `slide-${String(idx).padStart(2, '0')}-1080p.png`
  });
}

// 2. Kiểm tra ở Viewport Laptop 1366x768
console.log('\n--- 📸 VIEWPORT 2: 1366x768 (16:9 Laptop HD) ---');
const ctx768 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page768 = await ctx768.newPage();
await page768.goto(fileUrl + '#1', { waitUntil: 'networkidle' });
await page768.waitForTimeout(500);

await page768.addStyleTag({
  content: `
    .slide.on [data-r] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .slide.on { transition: none !important; opacity: 1 !important; }
  `
});

for (let idx = 1; idx <= 14; idx++) {
  await page768.keyboard.press('Home');
  await page768.waitForTimeout(50);
  for (let k = 1; k < idx; k++) {
    await page768.keyboard.press('ArrowRight');
    await page768.waitForTimeout(30);
  }
  await page768.waitForTimeout(300);

  const shotPath = path.join(outDir, `slide-${String(idx).padStart(2, '0')}-1366p.png`);
  await page768.screenshot({ path: shotPath });
  report.slides[idx - 1].screenshot1366p = `slide-${String(idx).padStart(2, '0')}-1366p.png`;
}
console.log('✅ Đã chụp xong 14 slide ở độ phân giải 1366x768.');

// 3. Kiểm tra Tương tác Bàn phím & Chế độ Presenter
console.log('\n--- ⌨️ KIỂM TRA TƯƠNG TÁC BÀN PHÍM VÀ SPEAKER NOTES ---');
// Thao tác phím 'n' (Bật Presenter Notes)
await page1080.keyboard.press('Home');
await page1080.waitForTimeout(300);
await page1080.keyboard.press('n');
await page1080.waitForTimeout(400);

const notesStatus = await page1080.evaluate(() => {
  const notes = document.getElementById('notes');
  return {
    isVisible: notes ? notes.classList.contains('on') : false,
    content: notes ? notes.textContent.slice(0, 100).trim() : ''
  };
});
const notesShotPath = path.join(outDir, 'slide-01-notes-active.png');
await page1080.screenshot({ path: notesShotPath });
console.log(`👉 Phím 'n' (Speaker Notes): ${notesStatus.isVisible ? 'BẬT THÀNH CÔNG' : 'LỖI'} -> slide-01-notes-active.png`);
report.interactions.speakerNotesToggle = notesStatus;

// Thao tác phím 'End' và 'Home'
await page1080.keyboard.press('n'); // tắt notes
await page1080.waitForTimeout(200);
await page1080.keyboard.press('End');
await page1080.waitForTimeout(400);
const endHud = await page1080.evaluate(() => document.getElementById('hud')?.textContent.trim());
console.log(`👉 Phím 'End': Chuyển tới slide cuối: ${endHud === '14 / 14' ? 'THÀNH CÔNG (14/14)' : `LỖI (${endHud})`}`);
report.interactions.keyEnd = { expected: '14 / 14', actual: endHud, ok: endHud === '14 / 14' };

await page1080.keyboard.press('Home');
await page1080.waitForTimeout(400);
const homeHud = await page1080.evaluate(() => document.getElementById('hud')?.textContent.trim());
console.log(`👉 Phím 'Home': Quay về slide đầu: ${homeHud === '01 / 14' ? 'THÀNH CÔNG (01/14)' : `LỖI (${homeHud})`}`);
report.interactions.keyHome = { expected: '01 / 14', actual: homeHud, ok: homeHud === '01 / 14' };

// Thao tác phím 'ArrowLeft' (Lùi trang)
await page1080.keyboard.press('ArrowRight');
await page1080.waitForTimeout(200);
await page1080.keyboard.press('ArrowLeft');
await page1080.waitForTimeout(200);
const leftHud = await page1080.evaluate(() => document.getElementById('hud')?.textContent.trim());
console.log(`👉 Phím 'ArrowLeft': Lùi trang: ${leftHud === '01 / 14' ? 'THÀNH CÔNG' : `LỖI (${leftHud})`}`);
report.interactions.keyLeft = { expected: '01 / 14', actual: leftHud, ok: leftHud === '01 / 14' };

// 4. Tạo Contact Sheet HTML & PNG tổng hợp
console.log('\n--- 🖼️ TẠO BẢN TỔNG HỢP CONTACT SHEET ---');
const contactSheetHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Nguyện Vọng AI — 14 Slide Visual Overview</title>
<style>
  body { margin: 0; background: #070d1e; padding: 32px; font-family: system-ui, sans-serif; color: #fff; }
  h1 { font-size: 28px; margin-bottom: 8px; color: #60c5fa; }
  p { font-size: 16px; color: #94a3b8; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .item { position: relative; background: #111a36; border-radius: 12px; overflow: hidden; border: 1px solid #233159; transition: transform .2s; }
  .item:hover { transform: scale(1.02); border-color: #3b82f6; }
  .item img { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }
  .meta { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75%; }
  .badge { background: #2563eb; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
  .warn { color: #f59e0b; font-size: 12px; }
</style>
</head>
<body>
  <h1>Nguyện Vọng AI — Tổng Hợp Kiểm Tra 14 Slide (1920×1080)</h1>
  <p>Tự động inspect bởi Agent Browser • Tổng số: 14 màn hình • Tỉ lệ 16:9 chuẩn</p>
  <div class="grid">
    ${report.slides.map((s, idx) => `
      <div class="item">
        <img src="${s.screenshot1080p}" alt="${s.title}">
        <div class="meta">
          <span class="title">Slide ${idx + 1}: ${s.title}</span>
          <span class="badge">${idx + 1} / 14</span>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

const sheetPath = path.join(outDir, 'contact-sheet.html');
fs.writeFileSync(sheetPath, contactSheetHtml, 'utf8');

// Chụp contact sheet thành 1 ảnh duy nhất
const sheetPage = await ctx1080.newPage();
await sheetPage.goto(pathToFileURL(sheetPath).href, { waitUntil: 'load' });
await sheetPage.waitForTimeout(500);
const sheetShotPath = path.join(outDir, 'contact-sheet.png');
await sheetPage.screenshot({ path: sheetShotPath, fullPage: true });
console.log('✅ Đã tạo Contact Sheet tổng hợp:', sheetShotPath);

// Lưu JSON report
const jsonPath = path.join(outDir, 'audit-report.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
console.log('✅ Đã lưu kết quả Audit JSON:', jsonPath);

await browser.close();
console.log('\n🎉 TOÀN BỘ QUÁ TRÌNH INSPECT & CHỤP ẢNH ĐÃ HOÀN TẤT!');
