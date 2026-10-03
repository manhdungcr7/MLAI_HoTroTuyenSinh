import { chromium } from "playwright-core";
const BASE = process.env.BASE || "http://localhost:3030/";
const b = await chromium.launch({ channel: "msedge" });
const state = { version: 5, profile: { name: "", grade: "", highSchool: "", homeProvince: "Hà Nội", examScores: { toan: 8, ly: 7.5, hoa: 7.5, anh: 7 }, hocBaScores: { toan: 8, ly: 8, hoa: 8, anh: 8 }, altScores: {}, priority: { area: "KV3", object: "none" }, annualBudgetVnd: 0, relocationWillingness: "khong_gioi_han", availableHoursPerWeek: 0, activeCombination: "A00", graduationYear: 2027, interestMajorGroups: [] }, wishlist: [], target: null };
for (const [name, ctxOpts] of [["desktop", { viewport: { width: 1280, height: 720 } }], ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  await p.goto(BASE + "#/start");
  await p.evaluate((s) => { localStorage.setItem("nguyen_vong_ai_app_state_v5", JSON.stringify(s)); }, state);
  for (const r of ["results", "portfolio", "improve", "about", "start"]) {
    await p.goto(`${BASE}#/${r}`); await p.reload(); await p.waitForTimeout(1800);
    const before = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, ih: window.innerHeight, bodyOv: getComputedStyle(document.body).overflow }));
    await p.mouse.move(200, 300);
    await p.mouse.wheel(0, 900); await p.waitForTimeout(500);
    const y = await p.evaluate(() => window.scrollY);
    console.log(name, r, JSON.stringify(before), "scrollY", y, before.h > before.ih ? (y > 0 ? "OK" : "KHÔNG CUỘN ĐƯỢC") : "vừa một màn");
  }
  await ctx.close();
}
await b.close();
