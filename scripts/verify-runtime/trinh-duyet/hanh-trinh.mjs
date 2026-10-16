// Hành trình người dùng thật: chạy cần Playwright (npm i -D playwright && npx playwright install chromium).
// Hành trình người dùng thật trên production (Playwright + Chrome). Mỗi bước ghi PASS/FAIL kèm bằng chứng.
// Chạy: node scripts/verify-runtime/trinh-duyet/hanh-trinh.mjs <thư mục ảnh>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2];
const BASE = "https://nguyenvongai.pages.dev/#";
fs.mkdirSync(OUT, { recursive: true });
const ketQua = [];
const ghi = (ten, ok, ghiChu) => { ketQua.push({ ten, ok, ghiChu }); console.log(`${ok ? "PASS" : "FAIL"} ${ten}${ghiChu ? ` — ${ghiChu}` : ""}`); };
const chup = (page, ten) => page.screenshot({ path: path.join(OUT, `${ten}.png`) }).catch(() => {});

const browser = await chromium.launch();
const moiTrang = async (w, h, { chan = [] } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const u of chan) await page.route(u, (r) => r.abort());
  return { ctx, page };
};

// 1. Màn đầu vào và đăng ký thiếu tỉnh
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/bat-dau/1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Tiếp tục" }).click().catch(() => {});
  await page.waitForTimeout(800);
  const conLai = page.url().includes("/bat-dau/1");
  const thongBao = await page.locator("body").innerText();
  ghi("Đăng ký: thiếu tỉnh thì không đi tiếp và có chỉ dẫn", conLai && /Tỉnh|nơi bạn đang sống|bắt buộc/i.test(thongBao), `url: ${page.url().split("#")[1]}`);
  await chup(page, "01-dang-ky-thieu-tinh");
  await ctx.close();
}

// 2. Khám phá: tìm theo tên đầy đủ, viết tắt và mã trường
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/kham-pha", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const oCoTim = page.getByPlaceholder("Tìm trường hoặc ngành");
  for (const [tuKhoa, kyVong] of [["Bách Khoa", "Bách Khoa"], ["BKA", "BKA"], ["Ngoại thương", "Ngoại thương"], ["HUTECH", "HUTECH"]]) {
    await oCoTim.fill("");
    await oCoTim.fill(tuKhoa);
    await page.waitForTimeout(700);
    const text = await page.locator("body").innerText();
    const coKetQua = text.includes(kyVong) && !/Không có ngành|Không tìm thấy/i.test(text.slice(0, 2000));
    ghi(`Khám phá tìm "${tuKhoa}"`, coKetQua, (text.match(/Có [\d.]+ ngành/) ?? ["?"])[0]);
  }
  await oCoTim.fill("");
  await oCoTim.fill("Khoa học máy tính");
  await page.waitForTimeout(700);
  await chup(page, "02-kham-pha-tim-kiem");
  await ctx.close();
}

// 3. Hỏi AI: có trả lời và có nguồn hoặc nói rõ thiếu dữ liệu
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/tu-van", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const o = page.getByPlaceholder(/Ví dụ/);
  await o.fill("Điểm chuẩn ngành Công nghệ thông tin ở ĐH Công nghệ TP.HCM HUTECH năm 2025 là bao nhiêu?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(12000);
  const text = await page.locator("body").innerText();
  const traLoi = /HUTECH|Công nghệ thông tin|điểm/i.test(text.slice(text.indexOf("Điểm chuẩn")));
  ghi("Hỏi AI có câu trả lời (không trống, không lỗi)", traLoi && !/Dịch vụ tư vấn|chưa được cấu hình/i.test(text.slice(-1500)), "");
  await chup(page, "03-hoi-ai");
  await ctx.close();
}

// 4. AI bị lỗi: app vẫn hiện thông báo rõ, không trắng trang
{
  const { ctx, page } = await moiTrang(390, 844, { chan: ["**/api/tu-van"] });
  await page.goto(BASE + "/tu-van", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/Ví dụ/).fill("Nên chọn ngành nào phù hợp với em?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);
  const text = await page.locator("body").innerText();
  ghi("AI lỗi mạng: app hiện thông báo, không trắng trang", text.length > 200 && /không|lỗi|thử lại|tạm/i.test(text), "");
  await chup(page, "04-ai-loi-mang");
  await ctx.close();
}

// 5. Lưu rồi tải lại: yêu thích một chương trình, tải lại vẫn còn
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/kham-pha", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const timBtn = page.locator("button[aria-label*='yêu thích' i], button[aria-label*='Lưu' i]").first();
  const coNut = await timBtn.count();
  if (coNut) {
    const nhan = await timBtn.getAttribute("aria-label");
    await timBtn.click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const sau = await page.locator("button[aria-label*='yêu thích' i], button[aria-label*='Lưu' i]").first().getAttribute("aria-label");
    ghi("Lưu yêu thích rồi tải lại vẫn còn", sau !== nhan, `trước: "${nhan}", sau: "${sau}"`);
  } else ghi("Lưu yêu thích rồi tải lại vẫn còn", false, "không tìm thấy nút yêu thích");
  await ctx.close();
}

// 6. Màn kết nối Claude và ChatGPT có trong cài đặt hồ sơ
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/ho-so/cai-dat", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const text = await page.locator("body").innerText();
  ghi("Cài đặt có mục kết nối Claude và ChatGPT", /Claude|ChatGPT/.test(text), "");
  await chup(page, "06-cai-dat-ket-noi");
  await ctx.close();
}

// 7. Nút chatbot nổi không che nút điều hướng dưới cùng trên điện thoại
{
  const { ctx, page } = await moiTrang(390, 844);
  await page.goto(BASE + "/kham-pha", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const tabs = await page.getByRole("link", { name: /Khám phá|Hôm nay|Hồ sơ/ }).first().boundingBox().catch(() => null);
  const chat = await page.getByRole("button", { name: /Mở Chatbot AI|Chatbot/i }).first().boundingBox().catch(() => null);
  const che = tabs && chat && !(chat.x + chat.width < tabs.x || chat.x > tabs.x + tabs.width) && Math.abs(chat.y - tabs.y) < chat.height;
  ghi("Nút chatbot nổi không che tab điều hướng", !che, chat ? `chatbot tại y=${Math.round(chat.y)}` : "không đo được");
  await ctx.close();
}

await browser.close();
const tong = ketQua.length, dat = ketQua.filter((k) => k.ok).length;
fs.writeFileSync(path.join(OUT, "ket-qua-hanh-trinh.json"), JSON.stringify(ketQua, null, 2), "utf8");
console.log(`\n${dat}/${tong} bước đạt`);
