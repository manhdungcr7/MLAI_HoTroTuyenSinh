import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const shotsDir = path.join(__dirname, 'shots');

if (!fs.existsSync(shotsDir)) {
  fs.mkdirSync(shotsDir, { recursive: true });
}

const MIMES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let file = req.url?.split('?')[0] || '/';
  if (file === '/' || !path.extname(file)) file = '/index.html';
  const filePath = path.join(distDir, file);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIMES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(distDir, 'index.html')).pipe(res);
  }
});

const PORT = 5175;
server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
    });

    const page = await browser.newPage();

    // 1. First go to #/chao and click "Xem hồ sơ mẫu" so the app is populated with complete realistic state
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/#/chao`, { waitUntil: 'networkidle0' });
    
    // Click "Xem hồ sơ mẫu"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent && b.textContent.includes('Xem hồ sơ mẫu'));
      if (target) target.click();
    });

    await new Promise(r => setTimeout(r, 1200));
    console.log('Sample profile applied! Current URL:', page.url());

    // Function to capture mobile screen
    async function captureMobile(route, filename, delay = 800) {
      await page.setViewport({ width: 412, height: 890, deviceScaleFactor: 2 });
      await page.goto(`http://localhost:${PORT}/#${route}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, delay));
      const dest = path.join(shotsDir, filename);
      await page.screenshot({ path: dest });
      console.log(`Captured mobile: ${filename}`);
    }

    // Function to capture desktop screen
    async function captureDesktop(route, filename, delay = 800) {
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
      await page.goto(`http://localhost:${PORT}/#${route}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, delay));
      const dest = path.join(shotsDir, filename);
      await page.screenshot({ path: dest });
      console.log(`Captured desktop: ${filename}`);
    }

    // Capture individual real screens
    await captureMobile('/', 'mobile-hom-nay.png');
    await captureMobile('/kham-pha', 'mobile-kham-pha.png');
    await captureMobile('/nguyen-vong', 'mobile-nguyen-vong.png');
    await captureMobile('/ke-hoach/muc-tieu', 'mobile-muc-tieu.png');
    await captureMobile('/ke-hoach/tuan', 'mobile-tuan.png');
    await captureMobile('/ho-so', 'mobile-ho-so.png');

    await captureDesktop('/', 'desktop-hom-nay.png');
    await captureDesktop('/kham-pha', 'desktop-kham-pha.png');
    await captureDesktop('/nguyen-vong', 'desktop-nguyen-vong.png');
    await captureDesktop('/ke-hoach/muc-tieu', 'desktop-muc-tieu.png');
    await captureDesktop('/ho-so', 'desktop-ho-so.png');

    await browser.close();
    console.log('All real app screens captured successfully!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    server.close();
  }
});
