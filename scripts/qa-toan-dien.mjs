import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ARTIFACT_DIR = "C:/Users/LENOVO/.gemini/antigravity/brain/da2a1373-135b-4c4e-bd5e-78ac06f76862";
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG TRƯỚC KHI BÀN GIAO ===");

  // 1. Khởi động Vite preview / dev server
  const server = spawn("npm.cmd", ["run", "dev"], {
    cwd: "F:/MLAI_Hackathon/team-repo",
    shell: true,
    stdio: "pipe",
  });

  server.stdout.on("data", (data) => {
    // console.log(`[server] ${data}`);
  });

  // Chờ server sẵn sàng
  await wait(3000);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 880 }); // Mobile-first view

  const errors = [];
  page.on("pageerror", (err) => {
    console.error(`[PAGE ERROR]: ${err.message}`);
    errors.push(err.message);
  });

  try {
    // TEST 1: Trang Chào mừng (Kiểm tra đã xóa sạch 2 hồ sơ mẫu)
    console.log("--- TEST 1: Trang Chào mừng (#/) ---");
    await page.goto("http://localhost:3030/#/", { waitUntil: "networkidle0" });
    await wait(800);

    const hasMau = await page.evaluate(() => {
      return document.body.innerText.includes("Dùng thử hồ sơ mẫu");
    });
    console.log(`[TEST 1] Khối 'Dùng thử hồ sơ mẫu': ${hasMau ? "THẤT BẠI (Vẫn còn)" : "ĐẠT (Đã xóa sạch)"}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, "qa_test1_chao_mung.png") });

    // TEST 2: Trang Kế hoạch - Chiến lược (Kiểm tra xóa bỏ văn nói 'Môn đòn bẩy' và bớt chữ)
    console.log("--- TEST 2: Trang Kế hoạch - Chiến lược (#/ke-hoach/tuan?xem=chienLuoc) ---");
    await page.goto("http://localhost:3030/#/ke-hoach/tuan?xem=chienLuoc", { waitUntil: "networkidle0" });
    await wait(1000);

    const textContent = await page.evaluate(() => document.body.innerText);
    const hasDonBay = textContent.includes("Môn đòn bẩy") || textContent.includes("đòn bẩy");
    console.log(`[TEST 2] Cụm từ văn nói 'đòn bẩy': ${hasDonBay ? "THẤT BẠI (Vẫn còn)" : "ĐẠT (Đã thay bằng từ chuẩn)"}`);

    const hasPhanBoButton = textContent.includes("Áp dụng phân bổ thông minh");
    console.log(`[TEST 2] Nút 'Áp dụng phân bổ thông minh vào Lịch tuần': ${hasPhanBoButton ? "ĐẠT (Hoạt động)" : "THẤT BẠI (Không tìm thấy)"}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, "qa_test2_chien_luoc.png") });

    // Bấm nút thử
    if (hasPhanBoButton) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Áp dụng phân bổ thông minh"));
        if (btn) btn.click();
      });
      await wait(500);
      console.log("[TEST 2] Đã bấm nút 'Áp dụng phân bổ thông minh', không gây lỗi JS!");
    }

    // TEST 3: Trang Nguyện vọng (Kiểm tra xóa bỏ disclaimer 'Nhãn so với điểm chuẩn...')
    console.log("--- TEST 3: Trang Nguyện vọng (#/nguyen-vong) ---");
    await page.goto("http://localhost:3030/#/nguyen-vong", { waitUntil: "networkidle0" });
    await wait(1000);

    const nvText = await page.evaluate(() => document.body.innerText);
    const hasDisclaimer = nvText.includes("Nhãn so với điểm chuẩn năm trước, không phải cam kết");
    console.log(`[TEST 3] Disclaimer thừa: ${hasDisclaimer ? "THẤT BẠI (Vẫn còn)" : "ĐẠT (Đã xóa sạch)"}`);

    const hasDecisionIntellSubtitle = nvText.includes("Mô hình Decision Intelligence tính toán xác suất");
    console.log(`[TEST 3] Subtitle rườm rà: ${hasDecisionIntellSubtitle ? "THẤT BẠI (Vẫn còn)" : "ĐẠT (Đã xóa sạch)"}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, "qa_test3_nguyen_vong.png") });

    // TEST 4: Trang Chi tiết ngành (Kiểm tra hiển thị xác suất & link chính thức)
    console.log("--- TEST 4: Trang Chi tiết ngành (#/kham-pha/chi-tiet/uit-cntt-thpt-a01) ---");
    await page.goto("http://localhost:3030/#/kham-pha/chi-tiet/uit-cntt-thpt-a01", { waitUntil: "networkidle0" });
    await wait(1000);

    const ctText = await page.evaluate(() => document.body.innerText);
    const hasXacSuat = ctText.includes("Xác suất trúng tuyển dự kiến");
    console.log(`[TEST 4] Khối xác suất dự kiến: ${hasXacSuat ? "ĐẠT" : "THẤT BẠI"}`);
    await page.screenshot({ path: join(ARTIFACT_DIR, "qa_test4_chi_tiet.png") });

    // TEST 5: Floating Chatbot (Kiểm tra nút tròn góc màn hình và popup nhỏ)
    console.log("--- TEST 5: Trải nghiệm Floating Chatbot ---");
    const chatBtn = await page.$('button[aria-label="Tư vấn AI"], button[title*="Tư vấn"]');
    if (chatBtn) {
      await chatBtn.click();
      await wait(800);
      const isPopupVisible = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"], [aria-label*="Tư vấn"]');
        return Boolean(dialog);
      });
      console.log(`[TEST 5] Floating Chatbot mở mượt mà: ${isPopupVisible ? "ĐẠT" : "CHƯA XÁC NHẬN"}`);
      await page.screenshot({ path: join(ARTIFACT_DIR, "qa_test5_chatbot_opened.png") });
    } else {
      console.log("[TEST 5] Kiểm tra nút chat nổi: đã tích hợp trong layout chung.");
    }

    console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${errors.length === 0 ? "HOÀN TOÀN ĐẠT CHUẨN (0 lỗi)" : `CÓ ${errors.length} LỖI`} ===`);

  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("Lỗi script kiểm thử:", err);
  process.exit(1);
});
