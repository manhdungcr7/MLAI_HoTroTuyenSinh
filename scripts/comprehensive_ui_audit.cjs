const { chromium } = require('C:/Users/ppnh1/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: 'Mobile iPhone 12/13/14', width: 390, height: 844 },
  { name: 'Mobile iPhone 14/15 Pro Max', width: 430, height: 932 },
  { name: 'Tablet iPad Portrait', width: 768, height: 1024 },
  { name: 'Laptop HD 1366x768', width: 1366, height: 768 },
  { name: 'Desktop FHD 1440x900', width: 1440, height: 900 }
];

const ROUTES = [
  { path: '/dashboard', name: 'Dashboard Tổng Quan' },
  { path: '/profile', name: 'Hồ sơ Thí Sinh' },
  { path: '/options', name: 'Khám phá Trường & Ngành' },
  { path: '/analysis', name: 'Phân tích Gap, ROI & What-If' },
  { path: '/portfolio', name: 'Portfolio Nguyện Vọng' },
  { path: '/study-plan', name: 'Kế Hoạch Ôn Tập' },
  { path: '/explanation', name: 'Thuyết Minh & Báo Cáo' }
];

async function runAudit() {
  console.log('🚀 Running Comprehensive UI & Layout Audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  const anomalies = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      const url = `http://localhost:3030${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(600);

        const check = await page.evaluate(() => {
          const body = document.body;
          const docEl = document.documentElement;
          const windowW = window.innerWidth;
          const scrollW = Math.max(body.scrollWidth, docEl.scrollWidth);

          // 1. Horizontal overflow check
          const hasHorizontalOverflow = scrollW > windowW + 1;

          // 2. Buttons touch target check (< 40px on mobile)
          const smallButtons = [];
          const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"]'));
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            // Visible only
            if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
              if (windowW <= 430 && (rect.width < 36 || rect.height < 36)) {
                const text = (btn.innerText || btn.getAttribute('aria-label') || btn.title || '').trim().slice(0, 30);
                if (text) {
                  smallButtons.push({
                    text,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    classes: btn.className.slice(0, 50)
                  });
                }
              }
            }
          });

          // 3. Text clipping or broken text
          const clippedTexts = [];
          const textElements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, label'));
          textElements.forEach(el => {
            if (el.children.length === 0) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && el.scrollWidth > el.clientWidth + 2) {
                const style = window.getComputedStyle(el);
                if (style.overflow !== 'hidden' && style.textOverflow !== 'ellipsis') {
                  clippedTexts.push({
                    text: el.innerText.slice(0, 40),
                    clientWidth: el.clientWidth,
                    scrollWidth: el.scrollWidth
                  });
                }
              }
            }
          });

          // 4. Glassmorphism check (backdrop-filter)
          const glassElements = [];
          const allElements = Array.from(document.querySelectorAll('*'));
          allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.backdropFilter && style.backdropFilter !== 'none') {
              glassElements.push({
                tag: el.tagName.toLowerCase(),
                classes: el.className.slice(0, 50),
                filter: style.backdropFilter
              });
            }
          });

          return {
            windowW,
            scrollW,
            hasHorizontalOverflow,
            smallButtons: smallButtons.slice(0, 5),
            clippedTexts: clippedTexts.slice(0, 5),
            glassCount: glassElements.length,
            glassSamples: glassElements.slice(0, 3)
          };
        });

        if (check.hasHorizontalOverflow) {
          anomalies.push({
            severity: 'critical',
            type: 'horizontal_overflow',
            viewport: `${vp.width}x${vp.height}`,
            route: route.path,
            details: `Tràn ngang: window=${check.windowW}px, scrollWidth=${check.scrollW}px (dư ${check.scrollW - check.windowW}px)`
          });
          console.log(`  ❌ [OVERFLOW] ${route.path} dư ${check.scrollW - check.windowW}px`);
        } else {
          console.log(`  ✅ [PASS] ${route.path} fit width (${check.windowW}px)`);
        }

        if (check.smallButtons.length > 0) {
          anomalies.push({
            severity: 'medium',
            type: 'touch_target_small',
            viewport: `${vp.width}x${vp.height}`,
            route: route.path,
            details: `Nút bấm nhỏ trên mobile (<36px): ${check.smallButtons.map(b => `"${b.text}" (${b.width}x${b.height})`).join(', ')}`
          });
        }

        if (check.clippedTexts.length > 0) {
          anomalies.push({
            severity: 'high',
            type: 'text_clipping',
            viewport: `${vp.width}x${vp.height}`,
            route: route.path,
            details: `Rớt/cắt chữ không có ellipsis: ${check.clippedTexts.map(t => `"${t.text}"`).join(', ')}`
          });
        }

        if (check.glassCount > 0) {
          anomalies.push({
            severity: 'high',
            type: 'glassmorphism_violation',
            viewport: `${vp.width}x${vp.height}`,
            route: route.path,
            details: `Phát hiện backdrop-filter (cấm glassmorphism): ${JSON.stringify(check.glassSamples)}`
          });
        }

      } catch (err) {
        anomalies.push({
          severity: 'critical',
          type: 'navigation_error',
          viewport: `${vp.width}x${vp.height}`,
          route: route.path,
          details: err.message
        });
        console.error(`  ⚠️ Lỗi điều hướng ${route.path}:`, err.message);
      }
    }
  }

  await browser.close();

  const auditReport = {
    timestamp: new Date().toISOString(),
    totalAnomalies: anomalies.length,
    anomalies,
    consoleErrorsCount: consoleLogs.filter(l => l.type === 'error').length,
    consoleWarningsCount: consoleLogs.filter(l => l.type === 'warning').length,
    consoleLogs: consoleLogs.slice(0, 30),
    pageErrors
  };

  const outputDir = path.resolve(__dirname, '../artifacts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'ui-anomalies.json'), JSON.stringify(auditReport, null, 2));

  console.log(`\n🎉 Audit finished! Found ${anomalies.length} UI anomalies. Report written to artifacts/ui-anomalies.json`);
}

runAudit().catch(console.error);
