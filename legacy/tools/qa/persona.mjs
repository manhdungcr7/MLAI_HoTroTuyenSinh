import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:3030/";
const SUB = { toan: "Toán", van: "Ngữ văn", anh: "Tiếng Anh", ly: "Vật lý", hoa: "Hóa học", sinh: "Sinh học", su: "Lịch sử", dia: "Địa lý" };

export const PERSONAS = JSON.parse(fs.readFileSync(new URL("./personas.json", import.meta.url), "utf-8"));

async function runPersona(browser, p, mobile = true) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true } : { viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const out = { id: p.id, title: p.title, steps: [], errors: errs };
  await page.goto(`${BASE}#/start`);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  const next = async () => { await page.getByRole("button", { name: /Tiếp tục|Bỏ qua|Xem kết quả/ }).click(); await page.waitForTimeout(250); };
  const title = async () => (await page.locator("h1").first().innerText()).trim();
  const startBtn = page.getByRole("button", { name: "Bắt đầu" });
  await page.getByRole("button", { name: /Bắt đầu|Năm 2027/ }).first().waitFor();
  if (await startBtn.count()) await startBtn.click();
  // year
  await page.getByRole("button", { name: `Năm ${p.year ?? 2027}` }).click(); await page.waitForTimeout(500);
  out.steps.push(await title());
  for (const [k, v] of Object.entries(p.exam ?? {})) await page.locator(`input[aria-label="Điểm thi – ${SUB[k] ?? k}"]`).fill(String(v));
  await next();
  out.steps.push(await title());
  for (const [k, v] of Object.entries(p.hocba ?? {})) await page.locator(`input[aria-label="Điểm học bạ – ${SUB[k] ?? k}"]`).fill(String(v));
  await next();
  out.steps.push(await title());
  for (const [k, v] of Object.entries(p.cert ?? {})) {
    const label = { ielts: "IELTS", dgnl_hcm: "ĐGNL ĐHQG-HCM", dgnl_hn: "ĐGNL ĐHQG Hà Nội", dgtd_bk: "ĐGTD Bách khoa" }[k];
    await page.locator(`input[aria-label="${label}"]`).fill(String(v));
  }
  await next();
  out.steps.push(await title());
  if (p.award) { await page.getByRole("button", { name: p.award, exact: true }).click(); await page.waitForTimeout(500); } else await next();
  out.steps.push(await title());
  if (p.rank) await page.getByRole("button", { name: p.rank, exact: true }).first().click();
  if (p.conduct) await page.getByRole("button", { name: p.conduct, exact: true }).last().click();
  await next();
  out.steps.push(await title());
  if (p.province) await page.locator("select").selectOption(p.province);
  if (p.reloc) await page.getByRole("button", { name: p.reloc }).click();
  await next();
  out.steps.push(await title());
  for (const q of p.search ?? []) { await page.locator('input[aria-label="Tìm ngành hoặc trường"]').fill(q); await page.waitForTimeout(300); await page.locator("ul li button").first().click(); await page.waitForTimeout(200); }
  for (const g of p.interest ?? []) await page.getByRole("button", { name: g, exact: true }).click();
  await next();
  out.steps.push(await title());
  if (p.area) await page.getByRole("button", { name: p.area, exact: true }).click();
  if (p.object) await page.getByRole("button", { name: p.object, exact: true }).click();
  await page.getByRole("button", { name: /Xem kết quả|Tiếp tục/ }).click();
  await page.waitForTimeout(1500);
  out.resultsTitle = await title();
  out.resultsText = (await page.locator("main").innerText()).slice(0, 2500);
  await page.screenshot({ path: `out-persona/${p.id}_results.png`, fullPage: false });
  // portfolio
  await page.getByRole("link", { name: /Xếp nguyện vọng/ }).first().click(); await page.waitForTimeout(1200);
  out.portfolioText = (await page.locator("main").innerText()).slice(0, 2500);
  await page.screenshot({ path: `out-persona/${p.id}_portfolio.png`, fullPage: false });
  await page.goto(`${BASE}#/improve`); await page.waitForTimeout(1000);
  const first = page.locator("ul button").first();
  if (await first.count()) { await first.click(); await page.waitForTimeout(800); }
  out.improveText = (await page.locator("main").innerText()).slice(0, 1500);
  await page.screenshot({ path: `out-persona/${p.id}_improve.png`, fullPage: false });
  out.errors = errs;
  await ctx.close();
  return out;
}

fs.mkdirSync("out-persona", { recursive: true });
const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: "msedge" });
const all = [];
for (const p of PERSONAS) {
  if (only.length && !only.includes(p.id)) continue;
  try { all.push(await runPersona(browser, p)); } catch (e) { all.push({ id: p.id, title: p.title, failure: String(e).slice(0, 400) }); }
  console.log("done", p.id, all.at(-1).failure ? "FAIL " + all.at(-1).failure : all.at(-1).resultsTitle);
}
fs.writeFileSync("out-persona/report.json", JSON.stringify(all, null, 1));
await browser.close();
