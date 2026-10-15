import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(__dirname, 'shots');
const landingDir = path.join(__dirname, '..', 'public', 'landing');

if (!fs.existsSync(landingDir)) {
  fs.mkdirSync(landingDir, { recursive: true });
}

// Convert image file to base64 data URI so it loads instantly and reliably in Puppeteer
function getBase64Image(filename) {
  const filePath = path.join(shotsDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const shots = {
  desktopHomNay: getBase64Image('desktop-hom-nay.png'),
  desktopKhamPha: getBase64Image('desktop-kham-pha.png'),
  desktopNguyenVong: getBase64Image('desktop-nguyen-vong.png'),
  desktopMucTieu: getBase64Image('desktop-muc-tieu.png'),
  desktopHoSo: getBase64Image('desktop-ho-so.png'),
  mobileHomNay: getBase64Image('mobile-hom-nay.png'),
  mobileKhamPha: getBase64Image('mobile-kham-pha.png'),
  mobileNguyenVong: getBase64Image('mobile-nguyen-vong.png'),
  mobileMucTieu: getBase64Image('mobile-muc-tieu.png'),
  mobileHoSo: getBase64Image('mobile-ho-so.png'),
  mobileTuan: getBase64Image('mobile-tuan.png'),
};

const commonStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* MacBook Pro Frame */
  .macbook-wrapper {
    position: absolute;
    width: 1120px;
    height: 720px;
    right: 40px;
    top: 65px;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 35px 50px rgba(15, 23, 42, 0.22));
  }
  .macbook-lid {
    position: relative;
    width: 980px;
    height: 615px;
    background: #0f172a;
    border-radius: 20px 20px 4px 4px;
    padding: 12px 12px 14px 12px;
    border: 2px solid #64748b;
    box-shadow: inset 0 0 0 2px #1e293b;
    overflow: hidden;
  }
  .macbook-camera {
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background: #020617;
    border-radius: 50%;
    border: 1px solid #334155;
    z-index: 10;
  }
  .macbook-screen {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f8fafc;
    border-radius: 8px;
    overflow: hidden;
  }
  .macbook-screen img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }
  .macbook-base {
    position: relative;
    width: 1140px;
    height: 18px;
    background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 40%, #64748b 100%);
    border-radius: 0 0 16px 16px;
    box-shadow: 0 15px 25px rgba(15, 23, 42, 0.25);
  }
  .macbook-base::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 6px;
    background: #475569;
    border-radius: 0 0 6px 6px;
  }

  /* iPhone 15 Pro Frame */
  .iphone-wrapper {
    position: absolute;
    left: 110px;
    bottom: 45px;
    width: 320px;
    height: 660px;
    background: #0f172a;
    border-radius: 52px;
    padding: 10px;
    border: 3.5px solid #64748b;
    box-shadow: 0 30px 60px -10px rgba(15, 23, 42, 0.45), 0 0 0 2px #334155;
    z-index: 20;
  }
  .iphone-screen {
    position: relative;
    width: 100%;
    height: 100%;
    background: #ffffff;
    border-radius: 42px;
    overflow: hidden;
  }
  .iphone-island {
    position: absolute;
    top: 9px;
    left: 50%;
    transform: translateX(-50%);
    width: 82px;
    height: 22px;
    background: #000000;
    border-radius: 20px;
    z-index: 30;
  }
  .iphone-screen img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  /* Floating Badges */
  .badge {
    position: absolute;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(203, 213, 225, 0.9);
    border-radius: 18px;
    padding: 14px 18px;
    box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.18);
    z-index: 35;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .badge-title {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
  }
  .badge-sub {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    margin-top: 2px;
  }
`;

// Template 1: Hero (MacBook + iPhone + Badges)
function getHeroHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${commonStyles}
    </style>
  </head>
  <body>
    <div class="stage">
      <!-- MacBook Screen: Nguyện Vọng Dashboard -->
      <div class="macbook-wrapper">
        <div class="macbook-lid">
          <div class="macbook-camera"></div>
          <div class="macbook-screen">
            <img src="${shots.desktopNguyenVong}" />
          </div>
        </div>
        <div class="macbook-base"></div>
      </div>

      <!-- iPhone Screen: Khám phá ngành -->
      <div class="iphone-wrapper">
        <div class="iphone-island"></div>
        <div class="iphone-screen">
          <img src="${shots.mobileKhamPha}" />
        </div>
      </div>

      <!-- Floating Badges -->
      <div class="badge" style="top: 70px; right: 80px;">
        <div class="badge-icon" style="background: #2563eb; color: #fff;">100%</div>
        <div>
          <div class="badge-title">Dữ liệu chuẩn Đề án PDF</div>
          <div class="badge-sub">3.652 ngành · 118 trường ĐH toàn quốc</div>
        </div>
      </div>

      <div class="badge" style="bottom: 75px; right: 100px;">
        <div class="badge-icon" style="background: #10b981; color: #fff;">✓</div>
        <div>
          <div class="badge-title">Chiến lược 3 tầng an toàn</div>
          <div class="badge-sub">Thử sức · Vừa sức · An toàn chốt chặn</div>
        </div>
      </div>

      <div class="badge" style="top: 140px; left: 60px;">
        <div class="badge-icon" style="background: #f59e0b; color: #fff;">★</div>
        <div>
          <div class="badge-title">Hồ sơ: Nguyễn Minh Anh</div>
          <div class="badge-sub">Điểm cao nhất: 24,8 (A01) · IELTS 7.0</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Template 2: Daily (MacBook + iPhone + Badges)
function getDailyHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${commonStyles}
    </style>
  </head>
  <body>
    <div class="stage">
      <!-- MacBook Screen: Desktop Hôm Nay -->
      <div class="macbook-wrapper">
        <div class="macbook-lid">
          <div class="macbook-camera"></div>
          <div class="macbook-screen">
            <img src="${shots.desktopHomNay}" />
          </div>
        </div>
        <div class="macbook-base"></div>
      </div>

      <!-- iPhone Screen: Mobile Hôm Nay -->
      <div class="iphone-wrapper">
        <div class="iphone-island"></div>
        <div class="iphone-screen">
          <img src="${shots.mobileHomNay}" />
        </div>
      </div>

      <!-- Badges -->
      <div class="badge" style="top: 70px; right: 80px;">
        <div class="badge-icon" style="background: #3b82f6; color: #fff;">📅</div>
        <div>
          <div class="badge-title">Việc cần làm hôm nay</div>
          <div class="badge-sub">Tiếng Anh luyện đề · Toán ôn số phức</div>
        </div>
      </div>

      <div class="badge" style="bottom: 75px; right: 100px;">
        <div class="badge-icon" style="background: #8b5cf6; color: #fff;">🎯</div>
        <div>
          <div class="badge-title">Mục tiêu QSC Hệ thống thông tin</div>
          <div class="badge-sub">24,5 / 26,3 · Đạt 93% mốc tham khảo</div>
        </div>
      </div>

      <div class="badge" style="top: 140px; left: 60px;">
        <div class="badge-icon" style="background: #ec4899; color: #fff;">⚡</div>
        <div>
          <div class="badge-title">Nhịp học & Cảm xúc</div>
          <div class="badge-sub">Theo dõi cảm xúc mỗi ngày để duy trì phong độ</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Template 3: Plan (MacBook + iPhone + Badges)
function getPlanHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${commonStyles}
    </style>
  </head>
  <body>
    <div class="stage">
      <!-- MacBook Screen: Nguyện Vọng Cơ cấu -->
      <div class="macbook-wrapper">
        <div class="macbook-lid">
          <div class="macbook-camera"></div>
          <div class="macbook-screen">
            <img src="${shots.desktopNguyenVong}" />
          </div>
        </div>
        <div class="macbook-base"></div>
      </div>

      <!-- iPhone Screen: Mục tiêu chính -->
      <div class="iphone-wrapper">
        <div class="iphone-island"></div>
        <div class="iphone-screen">
          <img src="${shots.mobileMucTieu}" />
        </div>
      </div>

      <!-- Badges -->
      <div class="badge" style="top: 70px; right: 80px;">
        <div class="badge-icon" style="background: #0ea5e9; color: #fff;">📊</div>
        <div>
          <div class="badge-title">Phân tích khoảng cách điểm</div>
          <div class="badge-sub">Còn cách NV1: 1,8 điểm · Nâng môn Toán trước</div>
        </div>
      </div>

      <div class="badge" style="bottom: 75px; right: 100px;">
        <div class="badge-icon" style="background: #10b981; color: #fff;">🛡️</div>
        <div>
          <div class="badge-title">Cơ cấu danh sách chuẩn</div>
          <div class="badge-sub">1 Thử sức · 2 Vừa sức · 1 An toàn · 1 Dự phòng</div>
        </div>
      </div>

      <div class="badge" style="top: 140px; left: 60px;">
        <div class="badge-icon" style="background: #6366f1; color: #fff;">🎓</div>
        <div>
          <div class="badge-title">Đổi nguyện vọng trực quan</div>
          <div class="badge-sub">Kéo thả thứ tự · Tự động kiểm tra độ an toàn</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Template 4: Ho-so / Profile (MacBook + iPhone + Badges)
function getHoSoHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      ${commonStyles}
    </style>
  </head>
  <body>
    <div class="stage">
      <!-- MacBook Screen: Hồ sơ của bạn -->
      <div class="macbook-wrapper">
        <div class="macbook-lid">
          <div class="macbook-camera"></div>
          <div class="macbook-screen">
            <img src="${shots.desktopHoSo}" />
          </div>
        </div>
        <div class="macbook-base"></div>
      </div>

      <!-- iPhone Screen: Mobile Hồ sơ -->
      <div class="iphone-wrapper">
        <div class="iphone-island"></div>
        <div class="iphone-screen">
          <img src="${shots.mobileHoSo}" />
        </div>
      </div>

      <!-- Badges -->
      <div class="badge" style="top: 70px; right: 80px;">
        <div class="badge-icon" style="background: #2563eb; color: #fff;">👤</div>
        <div>
          <div class="badge-title">Hồ sơ năng lực học tập</div>
          <div class="badge-sub">Nguyễn Minh Anh · Lớp 12 · TP.HCM</div>
        </div>
      </div>

      <div class="badge" style="bottom: 75px; right: 100px;">
        <div class="badge-icon" style="background: #059669; color: #fff;">🏅</div>
        <div>
          <div class="badge-title">Điểm mạnh & Điểm cần lưu ý</div>
          <div class="badge-sub">Vật lý 8,5 · Sinh 8,3 · Toán cần thêm 0,6</div>
        </div>
      </div>

      <div class="badge" style="top: 140px; left: 60px;">
        <div class="badge-icon" style="background: #7c3aed; color: #fff;">🌍</div>
        <div>
          <div class="badge-title">Xét tuyển sớm & Ngoại ngữ</div>
          <div class="badge-sub">IELTS 7.0 · ĐGNL ĐHQG-HCM 875/1200</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Template 5: Mobile (1536 x 1024) Centered iPhone + 4 Floating Feature Cards
function getMobileHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1536px;
        height: 1024px;
        overflow: hidden;
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .stage {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* iPhone in Center */
      .iphone-wrapper {
        position: relative;
        width: 380px;
        height: 780px;
        background: #0f172a;
        border-radius: 56px;
        padding: 12px;
        border: 4px solid #64748b;
        box-shadow: 0 40px 80px -15px rgba(15, 23, 42, 0.45), 0 0 0 2px #334155;
        z-index: 20;
      }
      .iphone-screen {
        position: relative;
        width: 100%;
        height: 100%;
        background: #ffffff;
        border-radius: 46px;
        overflow: hidden;
      }
      .iphone-island {
        position: absolute;
        top: 11px;
        left: 50%;
        transform: translateX(-50%);
        width: 95px;
        height: 25px;
        background: #000000;
        border-radius: 20px;
        z-index: 30;
      }
      .iphone-screen img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
        display: block;
      }

      /* 4 Floating Feature Cards */
      .card {
        position: absolute;
        width: 340px;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(16px);
        border: 1.5px solid rgba(226, 232, 240, 0.9);
        border-radius: 24px;
        padding: 22px 24px;
        box-shadow: 0 25px 45px -12px rgba(15, 23, 42, 0.16);
        z-index: 30;
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .card-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      }
      .card-title {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
      }
      .card-desc {
        font-size: 13px;
        line-height: 1.5;
        color: #475569;
        margin-bottom: 14px;
      }
      .card-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .card-pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        background: #f1f5f9;
        color: #334155;
      }
      .card-pill.blue { background: #eff6ff; color: #1d4ed8; }
      .card-pill.emerald { background: #ecfdf5; color: #047857; }
      .card-pill.amber { background: #fffbeb; color: #b45309; }
      .card-pill.purple { background: #f5f3ff; color: #6d28d9; }
    </style>
  </head>
  <body>
    <div class="stage">
      <!-- Centered Phone: Real Hom Nay Screen -->
      <div class="iphone-wrapper">
        <div class="iphone-island"></div>
        <div class="iphone-screen">
          <img src="${shots.mobileHomNay}" />
        </div>
      </div>

      <!-- Top Left Card: Hồ sơ năng lực -->
      <div class="card" style="top: 130px; left: 140px;">
        <div class="card-header">
          <div class="card-icon" style="background: #eff6ff; color: #2563eb;">👤</div>
          <div class="card-title">Hồ sơ năng lực</div>
        </div>
        <div class="card-desc">
          Hiểu bản thân toàn diện qua năng lực học tập, tổ hợp thế mạnh và chứng chỉ ngoại ngữ.
        </div>
        <div class="card-pill-row">
          <span class="card-pill blue">A01: 24,8 điểm</span>
          <span class="card-pill purple">IELTS 7.0</span>
          <span class="card-pill emerald">ĐGNL 875/1200</span>
        </div>
      </div>

      <!-- Bottom Left Card: Người đồng hành -->
      <div class="card" style="bottom: 130px; left: 120px;">
        <div class="card-header">
          <div class="card-icon" style="background: #ecfdf5; color: #059669;">👥</div>
          <div class="card-title">Người đồng hành</div>
        </div>
        <div class="card-desc">
          Tư vấn trực tiếp, đối chiếu trang Đề án gốc khi bạn cần một người cùng cân nhắc quyết định.
        </div>
        <div class="card-pill-row">
          <span class="card-pill emerald">● Sẵn sàng hỗ trợ</span>
          <span class="card-pill">Tư vấn khách quan</span>
        </div>
      </div>

      <!-- Top Right Card: Chiến lược nguyện vọng -->
      <div class="card" style="top: 130px; right: 140px;">
        <div class="card-header">
          <div class="card-icon" style="background: #fef3c7; color: #d97706;">🎓</div>
          <div class="card-title">Chiến lược 3 tầng</div>
        </div>
        <div class="card-desc">
          Xếp nguyện vọng thông minh theo 3 tầng an toàn: không bỏ lỡ ước mơ, không lo trượt hết.
        </div>
        <div class="card-pill-row">
          <span class="card-pill amber">Thử sức: 1 NV</span>
          <span class="card-pill blue">Vừa sức: 2 NV</span>
          <span class="card-pill emerald">An toàn: 2 NV</span>
        </div>
      </div>

      <!-- Bottom Right Card: Kế hoạch tuần -->
      <div class="card" style="bottom: 130px; right: 120px;">
        <div class="card-header">
          <div class="card-icon" style="background: #f3e8ff; color: #7c3aed;">📈</div>
          <div class="card-title">Kế hoạch tuần</div>
        </div>
        <div class="card-desc">
          Biến mục tiêu thành hành động: phân tích môn kéo điểm và nhiệm vụ cụ thể từng ngày.
        </div>
        <div class="card-pill-row">
          <span class="card-pill purple">Kéo môn Toán trước</span>
          <span class="card-pill blue">Tiếng Anh tính giờ</span>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function renderImage(page, html, width, height, outputPath) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: outputPath,
    type: 'webp',
    quality: 92,
    omitBackground: true,
  });
  console.log(`Generated: ${outputPath} (${width}x${height})`);
}

async function main() {
  console.log('Launching browser to render landing images...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
  });

  const page = await browser.newPage();

  // 1. hero.webp (1672 x 941)
  await renderImage(page, getHeroHtml(), 1672, 941, path.join(landingDir, 'hero.webp'));

  // 2. daily.webp (1672 x 941)
  await renderImage(page, getDailyHtml(), 1672, 941, path.join(landingDir, 'daily.webp'));

  // 3. plan.webp (1672 x 941)
  await renderImage(page, getPlanHtml(), 1672, 941, path.join(landingDir, 'plan.webp'));

  // 4. ho-so.webp & profile.webp (1671 x 941)
  const hoSoPath = path.join(landingDir, 'ho-so.webp');
  const profilePath = path.join(landingDir, 'profile.webp');
  await renderImage(page, getHoSoHtml(), 1671, 941, hoSoPath);
  fs.copyFileSync(hoSoPath, profilePath);
  console.log(`Copied: ${profilePath}`);

  // 5. mobile.webp (1536 x 1024)
  await renderImage(page, getMobileHtml(), 1536, 1024, path.join(landingDir, 'mobile.webp'));

  await browser.close();
  console.log('All landing webp images successfully created!');
}

main().catch(err => {
  console.error('Error generating images:', err);
  process.exit(1);
});
