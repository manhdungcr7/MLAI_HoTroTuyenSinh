// Bộ kiểm thử trình duyệt UI/UX 2027 cho Nguyện Vọng AI. Không sửa mã sản phẩm.
//   node scripts/qa-ui-2027.mjs [--phase truoc|sau] [--base http://localhost:3030] [--chi <id,id>] [--bo-qua-viewport]
// Kết quả: evidence/ui-2027/qa/<phase>/ket-qua.json + ảnh. Trình duyệt: agent-browser chụp ảnh (mặc định),
// playwright chỉ cho setViewportSize, giả lập mạng (route/offline/delay) và kiểm tra nhiều bước.
// Dữ liệu thử nằm trong context trình duyệt tạm (không đụng profile thật của người dùng).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "file:///C:/Users/ppnh1/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs";
import { timId } from "./qa-ui-2027/tim-id.mjs";
import { doTrucQuan, doBanPhim } from "./qa-ui-2027/do-luong.mjs";

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith("--") || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const PHASE = arg("phase", "truoc");
const BASE = String(arg("base", "http://localhost:3030")).replace(/\/$/, "");
const CHI = arg("chi", null) ? String(arg("chi")).split(",") : null;
const OUT = path.join(goc, "evidence", "ui-2027", "qa", PHASE);
fs.mkdirSync(OUT, { recursive: true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const KHOA = "nvai:v2";
const IDS = timId();
const A = IDS.A.id, B = IDS.B.id, C = IDS.C.id, F = IDS.F.id, D = "qa-khong-du-lieu";
const VIEWPORTS = [320, 360, 375, 390, 430, 1280];
const ket = { phase: PHASE, base: BASE, luc: new Date().toISOString(), ids: { A: IDS.A, B: IDS.B, C: IDS.C, F: IDS.F, D: { id: D, ghiChu: "Dữ liệu thật không có chương trình trạng thái D (0/3.648): script chèn 1 dòng giả {diem:{2025:0}} vào du-lieu-that.json qua route của trình duyệt, chỉ trong context thử." }, demTheoNhom: IDS.demTheoNhom }, luong: [], truc_quan: {}, ban_phim: {}, console: {}, anh: [] };

// ---------- tiện ích ----------
const log = (...a) => console.log(...a);
const ghi = () => fs.writeFileSync(path.join(OUT, "ket-qua.json"), JSON.stringify(ket, null, 1));
const tien = (ms) => new Promise((r) => setTimeout(r, ms));
const so = (s) => (s == null ? null : Number(String(s).replace(",", ".")));
const chay = (id) => !CHI || CHI.includes(id);

function mo_luong(id, ten) {
  const l = { id, ten, ket: "PASS", kiem: [], ghiChu: [], anh: [], vanBan: {} };
  ket.luong.push(l);
  return {
    l,
    kiem(m, dung, chiTiet) { l.kiem.push({ m, ok: !!dung, ...(chiTiet !== undefined ? { chiTiet } : {}) }); if (!dung) l.ket = "FAIL"; log(`   ${dung ? "ok " : "LOI"} ${m}${!dung && chiTiet !== undefined ? " :: " + JSON.stringify(chiTiet).slice(0, 200) : ""}`); },
    luu(k, v) { l.vanBan[k] = typeof v === "string" ? v.slice(0, 1500) : v; },
    ghiChu(t) { l.ghiChu.push(t); },
    canhBao(t) { l.ghiChu.push("CẢNH BÁO: " + t); if (l.ket === "PASS") l.ket = "WARN"; },
    boQua(t) { l.ghiChu.push(t); l.ket = "SKIP"; },
  };
}
async function luong(id, ten, fn) {
  if (!chay(id)) return;
  log(`\n== ${id} ${ten}`);
  const r = mo_luong(id, ten);
  try { await fn(r); } catch (e) { r.l.ket = "FAIL"; r.l.ghiChu.push("Ngoại lệ: " + String(e.message).split("\n")[0]); log("   NGOẠI LỆ", e.message.split("\n")[0]); }
  log(`   => ${r.l.ket}`);
  ghi();
}

// ---------- trình duyệt ----------
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const DOI_TUONG_THU = "du-lieu-that.json";

async function taoCtx({ seed = null, w = 390, h = 844, ghiLoi = ket.console, ten = "ctx", chenD = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "vi-VN", deviceScaleFactor: 1 });
  const loi = { console: [], pageerror: [], yeuCauHong: [], http: [] };
  ctx.__loi = loi; ctx.__ten = ten;
  await ctx.addInitScript(({ k, v }) => { if (!sessionStorage.getItem("__qa")) { sessionStorage.setItem("__qa", "1"); if (v) localStorage.setItem(k, v); } }, { k: KHOA, v: seed });
  if (chenD) {
    await ctx.route(`**/${DOI_TUONG_THU}*`, async (route) => {
      const res = await route.fetch();
      let t = await res.text();
      try {
        const m = t.match(/JSON\.parse\(("(?:[^"\\]|\\.)*")\)/);
        const arr = m ? JSON.parse(JSON.parse(m[1])) : JSON.parse(t);
        const mau = arr.find((r) => r.id === A);
        arr.push({ ...mau, id: D, nganh: "Ngành thử nghiệm thiếu dữ liệu", diem: { 2025: 0 }, dk: null, viec: null, tier: "aggregator_verified" });
        t = m ? `export default ${JSON.stringify(arr)};` : JSON.stringify(arr);
      } catch { /* giữ nguyên */ }
      await route.fulfill({ response: res, body: t });
    });
  }
  const gan = (page) => {
    page.on("console", (m) => { if (m.type() === "error") loi.console.push(m.text().slice(0, 240)); });
    page.on("pageerror", (e) => loi.pageerror.push(String(e.message).slice(0, 240)));
    page.on("requestfailed", (r) => { if (!/ERR_ABORTED|net::ERR_FAILED/.test(r.failure()?.errorText || "") || !r.__qa) loi.yeuCauHong.push(`${r.method()} ${r.url().replace(BASE, "")} ${r.failure()?.errorText}`.slice(0, 200)); });
    page.on("response", (r) => { const u = r.url(); if (u.startsWith(BASE) && r.status() >= 400 && !/favicon|\/api\/|\/snapshots\//.test(u)) loi.http.push(`${r.status()} ${u.replace(BASE, "")}`.slice(0, 160)); });
  };
  ctx.on("page", gan);
  return ctx;
}
const donLoi = (ctx, nhan) => {
  const l = ctx.__loi;
  const tong = l.console.length + l.pageerror.length + l.http.length;
  if (tong || l.yeuCauHong.length) ket.console[nhan] = { console: [...new Set(l.console)].slice(0, 8), pageerror: [...new Set(l.pageerror)].slice(0, 8), http: [...new Set(l.http)].slice(0, 8), yeuCauHong: [...new Set(l.yeuCauHong)].slice(0, 8) };
  return l;
};
async function on(page, ms = 450) { await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); await tien(ms); }
async function di(page, hash, ms) {
  const url = `${BASE}/#${hash}`;
  if (page.url().startsWith(BASE + "/")) await page.evaluate((h) => { location.hash = h; }, hash); else await page.goto(url);
  await on(page, ms);
}
const vanBan = (page) => page.evaluate(() => document.body.innerText);
const moi = (t) => (t.match(/\b(NaN|undefined|Infinity|\[object Object\])\b/g) || []);
async function chup(page, ten) { const f = path.join(OUT, ten + ".png"); await page.screenshot({ path: f }); ket.anh.push(path.relative(goc, f).replace(/\\/g, "/")); return f; }
async function layState(page) { return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KHOA); }
/** Tìm trong Khám phá thẻ có chữ nganh (ô tìm) và trường khớp truongRe; bấm 'Xem thêm' nếu cần. Trả về chữ của thẻ hoặc "". */
async function timThe(page, nganh, truongRe) {
  await di(page, "/kham-pha", 600);
  await page.getByRole("searchbox").fill(nganh); await tien(900);
  for (let i = 0; i < 6; i++) {
    const c = page.locator("button").filter({ hasText: truongRe }).filter({ hasText: /Điểm chuẩn|Chỉ có điểm sàn|Chưa đủ/ }).first();
    if (await c.isVisible().catch(() => false)) return await c.innerText();
    const them = page.getByRole("button", { name: /^Xem thêm/ });
    if (!(await them.isVisible().catch(() => false))) break;
    await them.click(); await tien(500);
  }
  return "";
}
const nutTheoTen = (page, re) => page.getByRole("button", { name: re }).first();
const coHienThi = async (loc) => loc.isVisible().catch(() => false);

// ---------- bước 0: dựng seed từ hồ sơ mẫu thật của app ----------
let MAU = null;
{
  const ctx = await taoCtx({ ten: "dung-mau", chenD: false });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/ho-so/cai-dat`); await on(p, 700);
  await nutTheoTen(p, /^Hồ sơ mẫu$/).click();
  await tien(500);
  const xn = p.getByRole("button", { name: /Dùng hồ sơ mẫu/ });
  if (await coHienThi(xn)) await xn.click();
  await on(p, 900);
  MAU = await layState(p);
  await ctx.close();
  if (!MAU?.hoSo?.laMau) { log("Không dựng được hồ sơ mẫu"); }
}
const seedMau = () => JSON.stringify(MAU);
/** Học sinh thật (không phải mẫu) đã nhập điểm; nguyện vọng tuỳ chọn. */
const seedThat = (nv = []) => { const s = JSON.parse(JSON.stringify(MAU)); s.hoSo.laMau = false; s.hoSo.hoTen = "Học sinh QA"; s.nguyenVong = nv; s.yeuThich = []; s.soSanh = []; s.mucTieu = null; s.diemThi = []; s.hoSo.khuVuc = []; s.hoSo.nganhQuanTam = ["Sư phạm"]; s.hoSo.nganSach = null; s.hoSo.hocXaNha = null; s.hoSo.choO = null; return JSON.stringify(s); };

// =====================================================================================
// LUỒNG 1: hồ sơ trống đi Khám phá và mở chi tiết ngành
await luong("L1", "Hồ sơ trống đi qua Khám phá và mở chi tiết ngành", async (r) => {
  const ctx = await taoCtx({ ten: "L1" }); const p = await ctx.newPage();
  await di(p, "/kham-pha", 900);
  let t = await vanBan(p); r.luu("khamPha", t);
  r.kiem("Khám phá hiện danh sách ngành khi chưa có điểm", /Điểm chuẩn \d{4}/.test(t) || (await p.getByRole("button", { name: /ĐH|Học viện|Trường/ }).count()) > 3, t.slice(0, 200));
  r.kiem("Không có NaN/undefined trên Khám phá", moi(t).length === 0, moi(t));
  r.kiem("Không giả vờ đánh giá phù hợp khi chưa có điểm (không có 'thấp hơn mức tham khảo')", !/(thấp|cao) hơn mức tham khảo/.test(t));
  await chup(p, "L1-kham-pha-trong");
  for (const q of ["Bảo vệ thực vật", "Giáo dục Tiểu học", "Công nghệ thông tin", "Báo chí"]) {
    await p.getByRole("searchbox").fill(q); await tien(900);
    const tq = await vanBan(p); const m = tq.match(/Có (\d+) ngành/);
    r.kiem(`Tìm '${q}' ra kết quả (ngành có thật trong dữ liệu)`, m && Number(m[1]) > 0, { thongBao: m?.[0], hieu: (tq.match(/Đã hiểu:[^\n]*/) || [])[0] });
  }
  await p.getByRole("searchbox").fill(""); await tien(500);
  const the = p.getByRole("button", { name: /Điểm chuẩn \d{4}/ }).first();
  if (await coHienThi(the)) { await the.click(); await on(p, 800); r.kiem("Bấm thẻ ngành mở trang chi tiết", /#\/kham-pha\/[^/]+$/.test(p.url()), p.url()); }
  await di(p, `/kham-pha/${A}`, 1000);
  t = await vanBan(p); r.luu("chiTietA_trong", t);
  r.kiem("Chi tiết mời nhập điểm (nút 'Nhập điểm của bạn')", /Nhập điểm/.test(t));
  r.kiem("Chưa nhập điểm thì không có chữ 'Điểm của bạn: <số>'", !/Điểm của bạn:\s*\d/.test(t));
  r.kiem("Chưa nhập điểm thì không có kết luận thấp/cao hơn điểm chuẩn", !/(Thấp|Cao) hơn điểm chuẩn|còn cách xa|Còn cách xa/.test(t));
  r.kiem("Chi tiết không có NaN/undefined", moi(t).length === 0, moi(t));
  r.kiem("Vẫn thấy lịch sử điểm chuẩn khi chưa nhập điểm", /Điểm chuẩn các năm/.test(t) && /2025/.test(t));
  const nhap = nutTheoTen(p, /Nhập điểm của bạn/);
  if (await coHienThi(nhap)) { await nhap.click(); await p.waitForURL(/#\/(bat-dau|thu-tinh-huong|diem-thi-thu)/, { timeout: 4000 }).catch(() => {}); r.kiem("'Nhập điểm của bạn' dẫn tới màn nhập điểm", /#\/(bat-dau|thu-tinh-huong|diem-thi-thu)/.test(p.url()), p.url()); }
  donLoi(ctx, "L1"); await ctx.close();
});

// LUỒNG 2: nhập điểm, đổi điểm, đánh giá nhất quán
await luong("L2", "Nhập/đổi điểm: đánh giá cập nhật nhất quán chi tiết, danh sách, nguyện vọng, hồ sơ", async (r) => {
  const ctx = await taoCtx({ ten: "L2", seed: seedThat([A]) }); const p = await ctx.newPage();
  const MUC = /(Phù hợp|Có thể thử sức|Cần cân nhắc)/;
  const nhanMuc = (t) => { const i = t.indexOf("Mức độ phù hợp với bạn"); const m = (i >= 0 ? t.slice(i, i + 200) : t).match(MUC); return m ? m[1] : null; };
  const nhanTheMuc = (t) => (t.match(MUC) || [])[1] || null;
  const nhanNV = (t) => (t.match(/\b(Thử sức|Vừa sức|An toàn|Dự phòng)\b/) || [])[1] || null;
  const diemBan = (t) => { const m = t.match(/Điểm của bạn:\s*(\d+(?:,\d+)?)/); return m ? so(m[1]) : null; };
  const chenh = (t) => { const m = t.match(/(thấp|cao) hơn mức tham khảo (\d+(?:,\d+)?) điểm/i); return m ? (m[1].toLowerCase() === "thấp" ? -1 : 1) * so(m[2]) : null; };
  const doc = async (nhan) => {
    const v = {};
    await di(p, `/kham-pha/${A}`, 900); let t = await vanBan(p); v.ct = { muc: nhanMuc(t), ban: diemBan(t), chenh: chenh(t) }; r.luu(`ct_${nhan}`, t);
    const ct = await timThe(p, "Giáo dục Tiểu học", /Bạc Liêu/); v.ds = { co: !!ct, muc: nhanTheMuc(ct) }; r.luu(`ds_${nhan}`, ct);
    await di(p, "/nguyen-vong", 900); t = await vanBan(p); v.nv = { nhan: nhanNV(t.slice(t.indexOf("NV 01") >= 0 ? t.indexOf("NV 01") : 0)) }; r.luu(`nv_${nhan}`, t);
    await di(p, "/ho-so", 900); t = await vanBan(p); r.luu(`hs_${nhan}`, t);
    return v;
  };
  const truoc = await doc("truoc"); r.luu("truoc", truoc);
  r.kiem("Trước khi đổi: chi tiết có 'Điểm của bạn' và mức phù hợp", truoc.ct.ban !== null && truoc.ct.muc !== null, truoc.ct);
  r.kiem("Trước khi đổi: thẻ danh sách cùng mức phù hợp với chi tiết", truoc.ds.co && truoc.ds.muc === truoc.ct.muc, { ds: truoc.ds, ct: truoc.ct.muc });
  r.kiem("Trước khi đổi: nguyện vọng có nhãn Thử sức/Vừa sức/An toàn/Dự phòng", truoc.nv.nhan !== null, truoc.nv);
  // đổi điểm qua Cài đặt > Sửa điểm: Toán, Lý, Hóa = 10 (A00 = 30)
  await di(p, "/ho-so/cai-dat", 700);
  await nutTheoTen(p, /^Sửa điểm$/).click(); await on(p, 800);
  for (const mon of ["Toán", "Lý", "Hóa"]) { const o = p.getByRole("textbox", { name: new RegExp(`^${mon}$`) }); await o.fill("10"); await o.blur(); }
  await tien(400);
  const st = await layState(p);
  r.kiem("Đổi điểm lưu vào state (nvai:v2)", st?.hoSo?.diem?.toan === 10 && st?.hoSo?.diem?.vatLy === 10 && st?.hoSo?.diem?.hoaHoc === 10, st?.hoSo?.diem);
  const tiep = nutTheoTen(p, /^Tiếp tục$/); if (await coHienThi(tiep)) { await tiep.click(); await on(p, 500); }
  const sau = await doc("sau"); r.luu("sau", sau);
  r.kiem("Sau khi đổi: điểm trên chi tiết lên 30 (A00 = 10+10+10)", sau.ct.ban === 30, { truoc: truoc.ct.ban, sau: sau.ct.ban });
  r.kiem("Sau khi đổi: mức phù hợp ở chi tiết tốt hơn", MUC.test(sau.ct.muc || "") && sau.ct.muc !== truoc.ct.muc, { truoc: truoc.ct.muc, sau: sau.ct.muc });
  r.kiem("Sau khi đổi: thẻ danh sách khớp chi tiết", sau.ds.co && sau.ds.muc === sau.ct.muc, { ds: sau.ds, ct: sau.ct.muc });
  r.kiem("Sau khi đổi: nguyện vọng đổi nhãn (30 điểm vs chuẩn 26,99 → An toàn)", sau.nv.nhan === "An toàn", { truoc: truoc.nv.nhan, sau: sau.nv.nhan });
  const hs = r.l.vanBan.hs_sau || "";
  r.kiem("Sau khi đổi: Hồ sơ phản ánh điểm mới (có 10 trong điểm mạnh/thấp nhất, không còn 'Thấp nhất: Vật lý 6,9')", !/Vật lý 6,9/.test(hs), hs.match(/Thấp nhất[^\n]*/)?.[0]);
  donLoi(ctx, "L2"); await ctx.close();
});

// LUỒNG 3: ngành A
async function chiTietTheoLoai(r, id, nhan) {
  const ctx = await taoCtx({ ten: nhan, seed: seedThat([]) }); const p = await ctx.newPage();
  await di(p, `/kham-pha/${id}`, 1100);
  const t = await vanBan(p); r.luu("chiTiet", t);
  return { ctx, p, t };
}
await luong("L3", "Ngành A (nhiều năm điểm chuẩn): lịch sử + dự báo + nhãn tham khảo", async (r) => {
  const { ctx, p, t } = await chiTietTheoLoai(r, A, "L3");
  r.kiem("Có phần 'Điểm chuẩn các năm' với ≥ 2 năm", /Điểm chuẩn các năm/.test(t) && (t.match(/Năm 20\d\d/g) || []).length >= 2);
  r.kiem("Có khối dự báo cho năm 2027", /2027/.test(t) && /Dự báo|dự báo/.test(t));
  r.kiem("Có nhãn 'Dự báo tham khảo ... không phải điểm chuẩn chính thức'", /Dự báo tham khảo[^\n]*không phải điểm chuẩn chính thức/.test(t));
  r.kiem("Khoảng dự báo hiện rõ thấp/cao/trung tâm", /Thấp/.test(t) && /Cao/.test(t) && /Trung tâm/.test(t));
  const kd = t.match(/Khoảng\s+(\d+(?:,\d+)?)\s+đến\s+(\d+(?:,\d+)?)/);
  if (kd) r.kiem("Khoảng dự báo không vượt thang 30", so(kd[2]) <= 30 && so(kd[1]) >= 0, kd[0]);
  const truc = await p.evaluate(() => [...document.querySelectorAll("svg text")].map((x) => x.textContent.trim()).filter((x) => /^\d+(,\d+)?$/.test(x)).map((x) => Number(x.replace(",", "."))));
  r.luu("nhanTrucSvg", truc);
  if (truc.some((x) => x > 30)) r.canhBao(`Trục biểu đồ có nhãn vượt thang 30: ${truc.filter((x) => x > 30).join(", ")}`);
  r.kiem("Không có NaN/undefined", moi(t).length === 0, moi(t));
  const nut = p.getByRole("button", { name: /Khoảng dự báo là gì/ });
  if (await coHienThi(nut)) { await nut.click(); await tien(300); r.kiem("Nút giải thích khoảng dự báo mở được", (await nut.getAttribute("aria-expanded")) === "true"); }
  donLoi(ctx, "L3"); await ctx.close();
});

// LUỒNG 4: ngành C
await luong("L4", "Ngành C (chỉ điểm sàn 15,0): 'Chỉ có điểm sàn', không như điểm chuẩn, không thanh so sánh", async (r) => {
  const { ctx, p, t } = await chiTietTheoLoai(r, C, "L4");
  r.kiem("Có chữ 'Chỉ có điểm sàn'", /Chỉ có điểm sàn/i.test(t));
  r.kiem("Không có dòng 'Điểm chuẩn 2025 ... 15 điểm' như điểm chuẩn thật", !/Điểm chuẩn 20\d\d \(thang 30\)\s*\n?\s*15(,0)? điểm/.test(t), (t.match(/Điểm chuẩn[^\n]*\n[^\n]*/g) || []).slice(0, 3));
  r.kiem("Không có khoảng dự báo", !/Điểm chuẩn năm 2027 có thể ở đâu/.test(t) && !/Khoảng \d+(,\d+)? đến/.test(t));
  r.kiem("Không có kết luận thấp/cao hơn điểm chuẩn", !/(Thấp|Cao) hơn điểm chuẩn|(thấp|cao) hơn mức tham khảo/.test(t));
  const co = await p.locator('[role="meter"], [role="progressbar"], [data-thanh-so-sanh], svg[aria-label*="so sánh"]').count();
  r.kiem("Không có thanh so sánh điểm (meter/progressbar)", co === 0, co);
  r.kiem("Không có NaN/undefined", moi(t).length === 0, moi(t));
  // đối chiếu: danh sách Khám phá (tìm 'Bạc Liêu' rồi lọc thẻ) và trang trường
  const ct = await timThe(p, "Bạc Liêu", /Bảo vệ thực vật/); r.luu("theDanhSach", ct);
  if (ct === "") r.canhBao("Không tìm được thẻ ngành C trong Khám phá bằng ô tìm 'Bạc Liêu' (không kiểm được thẻ danh sách).");
  else r.kiem("Thẻ danh sách cũng không gọi 15,0 là điểm chuẩn", !/Điểm chuẩn 20\d\d:\s*15\b/.test(ct), ct.slice(0, 200));
  await di(p, "/truong/DBL", 1000);
  const tt = await vanBan(p); const i = tt.indexOf("Bảo vệ thực vật"); const doan = i >= 0 ? tt.slice(i, i + 260) : ""; r.luu("trangTruongDBL_BVTV", doan);
  r.kiem("Trang trường: ngành chỉ điểm sàn không hiện '15' như điểm chuẩn (phải nói là điểm sàn)", doan !== "" && /điểm sàn/i.test(doan), doan.replace(/\n/g, " | ").slice(0, 200));
  donLoi(ctx, "L4"); await ctx.close();
});

// LUỒNG 5: ngành D (dòng giả)
await luong("L5", "Ngành D (không có điểm hợp lệ): 'Chưa đủ dữ liệu để dự báo' + gợi ý ngành tương tự", async (r) => {
  const { ctx, p, t } = await chiTietTheoLoai(r, D, "L5");
  r.kiem("Trang mở được (ngành giả đã được nạp)", /Ngành thử nghiệm thiếu dữ liệu/.test(t), t.slice(0, 150));
  r.kiem("Có chữ 'Chưa đủ dữ liệu để dự báo'", /Chưa đủ dữ liệu để dự báo/i.test(t));
  r.kiem("Gợi ý ngành tương tự", /tương tự/i.test(t));
  r.kiem("Không có khoảng dự báo / không nêu điểm chuẩn 0", !/Khoảng \d/.test(t) && !/Điểm chuẩn 2025[^\n]*\n?\s*0\b/.test(t));
  r.kiem("Không có NaN/undefined", moi(t).length === 0, moi(t));
  await chup(p, "L5-chi-tiet-D-390");
  donLoi(ctx, "L5"); await ctx.close();
});

// LUỒNG 6: ngành F
await luong("L6", "Ngành F (học bạ/ĐGNL): không so điểm học bạ trực tiếp với điểm THPT", async (r) => {
  const ctx = await taoCtx({ ten: "L6", seed: seedThat([]) }); const p = await ctx.newPage();
  await di(p, `/kham-pha/${F}`, 1100);
  const t = await vanBan(p); r.luu("chiTiet", t);
  r.kiem("Nói rõ phương thức xét học bạ/ĐGNL", /học bạ|Học bạ|ĐGNL/.test(t));
  r.kiem("Không có kết luận 'thấp/cao hơn mức tham khảo' so điểm THPT", !/(thấp|cao) hơn mức tham khảo|(Thấp|Cao) hơn điểm chuẩn/.test(t));
  r.kiem("Không có khoảng dự báo điểm THPT", !/Điểm chuẩn năm 2027 có thể ở đâu/.test(t));
  r.kiem("Không có NaN/undefined", moi(t).length === 0, moi(t));
  const ct = await timThe(p, "Giáo dục Mầm non", /Bắc Ninh/); r.luu("theDanhSach", ct);
  r.kiem("Thẻ danh sách không so học bạ với điểm THPT", ct === "" ? true : !/(thấp|cao) hơn mức tham khảo/.test(ct), ct.slice(0, 200));
  if (ct === "") r.ghiChu("Không tìm thấy thẻ F bằng ô tìm kiếm (bỏ qua kiểm thẻ).");
  donLoi(ctx, "L6"); await ctx.close();
});

// LUỒNG 7 + 8: lưu, thêm nguyện vọng, thứ tự, xoá có xác nhận, reload
await luong("L7", "Lưu ngành, thêm nguyện vọng, chỉnh thứ tự, xoá có xác nhận", async (r) => {
  const ctx = await taoCtx({ ten: "L7", seed: seedThat([]) }); const p = await ctx.newPage();
  await di(p, `/kham-pha/${A}`, 1000);
  await p.getByRole("button", { name: /vào yêu thích/ }).first().click(); await tien(400);
  let st = await layState(p);
  r.kiem("Lưu ngành vào yêu thích (state.yeuThich)", st.yeuThich.includes(A), st.yeuThich);
  r.kiem("Nút đổi sang trạng thái 'Bỏ lưu'", (await p.getByRole("button", { name: /Bỏ lưu/ }).count()) > 0);
  await nutTheoTen(p, /Thêm Nguyện Vọng/).click(); await on(p, 600);
  st = await layState(p);
  r.kiem("Thêm vào nguyện vọng (state.nguyenVong)", st.nguyenVong.includes(A), st.nguyenVong);
  for (const id of [B, C]) { await di(p, `/kham-pha/${id}`, 700); const n = nutTheoTen(p, /Thêm Nguyện Vọng/); if (await coHienThi(n)) { await n.click(); await on(p, 500); } }
  st = await layState(p);
  r.kiem("Có 3 nguyện vọng theo thứ tự thêm", JSON.stringify(st.nguyenVong) === JSON.stringify([A, B, C]), st.nguyenVong);
  await di(p, "/nguyen-vong", 900);
  await chup(p, "L7-nguyen-vong-3-muc");
  await p.getByRole("button", { name: /xuống dưới/ }).first().click(); await tien(500);
  st = await layState(p);
  r.kiem("Nút 'xuống dưới' đổi thứ tự (A và B đổi chỗ)", JSON.stringify(st.nguyenVong) === JSON.stringify([B, A, C]), st.nguyenVong);
  await p.getByRole("button", { name: /lên trên/ }).nth(1).click(); await tien(500);
  st = await layState(p);
  r.kiem("Nút 'lên trên' đổi thứ tự lại", JSON.stringify(st.nguyenVong) === JSON.stringify([A, B, C]), st.nguyenVong);
  await p.getByRole("button", { name: /^Xóa Nguyện Vọng 2/ }).click(); await tien(600);
  st = await layState(p);
  const xacNhan = p.getByRole("button", { name: /^(Xóa|Đồng ý|Xác nhận|Có, xóa|Xóa khỏi danh sách)/ });
  const hoi = (await p.locator('[role="dialog"], [role="alertdialog"]').count()) > 0 || (await xacNhan.count()) > 0;
  r.kiem("Bấm xoá hiện hộp xác nhận, chưa xoá ngay", hoi && st.nguyenVong.length === 3, { hoi, n: st.nguyenVong.length });
  r.luu("hopXacNhan", await vanBan(p));
  if (hoi) {
    const huy = p.getByRole("button", { name: /^(Hủy|Giữ lại|Không|Để sau|Đóng)/ }).first();
    if (await coHienThi(huy)) { await huy.click(); await tien(400); st = await layState(p); r.kiem("Hủy xoá thì giữ nguyên danh sách", st.nguyenVong.length === 3, st.nguyenVong); }
    await p.getByRole("button", { name: /^Xóa Nguyện Vọng 2/ }).click(); await tien(500);
    const dong = p.locator('[role="dialog"] button, [role="alertdialog"] button').filter({ hasText: /Xóa/ }).last();
    const ok = (await coHienThi(dong)) ? dong : p.getByRole("button", { name: /^(Xóa|Đồng ý|Xác nhận)$/ }).last();
    await ok.click(); await tien(600);
    st = await layState(p);
    r.kiem("Xác nhận xoá thì còn 2 nguyện vọng đúng mục", JSON.stringify(st.nguyenVong) === JSON.stringify([A, C]), st.nguyenVong);
  }
  // L8 trong cùng ngữ cảnh: reload
  await p.reload(); await on(p, 900);
  const st2 = await layState(p);
  r.kiem("Reload: state còn nguyên, nguyện vọng không mất", JSON.stringify(st2.nguyenVong) === JSON.stringify(st.nguyenVong) && st2.yeuThich.includes(A), { nv: st2.nguyenVong, yt: st2.yeuThich });
  const t = await vanBan(p); r.kiem("Reload: màn nguyện vọng vẫn hiển thị 2 mục", (t.match(/Nguyện Vọng\s*\n?\s*\d/g) || []).length >= 2 || (await p.getByRole("button", { name: /^Xóa Nguyện Vọng/ }).count()) === 2);
  donLoi(ctx, "L7"); await ctx.close();
});

// LUỒNG 9: lỗi API, timeout, mạng chậm
async function hoiAI(p, cau) {
  await p.getByRole("textbox", { name: /Câu hỏi của bạn/ }).fill(cau);
  await p.getByRole("button", { name: /^Gửi$/ }).click();
}
await luong("L9", "Lỗi API / timeout / mạng chậm: app vẫn dùng được, thông báo dễ hiểu", async (r) => {
  // 9a: mọi /api/* và /snapshots/* bị chặn
  const ctx = await taoCtx({ ten: "L9a", seed: seedThat([A]) });
  await ctx.route(/\/(api|snapshots)\//, (rt) => { rt.request().__qa = true; rt.abort("failed"); });
  const p = await ctx.newPage();
  await di(p, "/kham-pha", 1000);
  let t = await vanBan(p);
  r.kiem("Chặn API: Khám phá vẫn có danh sách", /Điểm chuẩn \d{4}/.test(t));
  r.kiem("Chặn API: không bật màn lỗi trắng/stack", !/Something went wrong|Cannot read|TypeError/.test(t));
  await di(p, `/kham-pha/${A}`, 900); t = await vanBan(p);
  r.kiem("Chặn API: chi tiết vẫn mở và có dữ liệu cục bộ", /Điểm chuẩn các năm/.test(t));
  await di(p, "/tu-van", 800);
  await hoiAI(p, "Điểm chuẩn ngành Giáo dục Tiểu học ĐH Bạc Liêu là bao nhiêu?");
  await tien(5000);
  t = await vanBan(p); r.luu("tuVan_chanAPI", t);
  r.kiem("Chặn API: tư vấn AI vẫn trả lời (tự động từ dữ liệu)", /Bạc Liêu|điểm chuẩn|26,99/i.test(t.split("Câu hỏi của bạn")[0]) && (await p.locator('[role="region"][aria-label="Cuộc trò chuyện"], [aria-label="Cuộc trò chuyện"]').first().innerText().catch(() => "")).length > 60);
  r.kiem("Chặn API: thông báo không lộ lỗi kỹ thuật (fetch/Failed/TypeError/ERR_)", !/Failed to fetch|TypeError|ERR_|NetworkError|undefined/.test(t));
  // báo sai
  await di(p, `/kham-pha/${A}`, 900);
  const bs = p.getByRole("button", { name: /Báo số liệu sai/ }).first();
  if (await coHienThi(bs)) {
    await bs.click(); await tien(600);
    const hop = await p.evaluate(() => { const d = document.querySelector('[role="dialog"]') || document.body; return d.innerText; });
    r.luu("baoSai_form", hop);
    const o = p.locator('[role="dialog"] textarea, textarea').first();
    if (await coHienThi(o)) await o.fill("Kiểm thử tự động: bỏ qua. Số liệu ghi 26,99 cần đối chiếu.");
    const radio = p.locator('[role="dialog"] input[type=radio], [role="dialog"] [role="radio"]').first(); if (await coHienThi(radio)) await radio.click().catch(() => {});
    const gui = p.getByRole("button", { name: /^Gửi/ }).last();
    if (await coHienThi(gui) && await gui.isEnabled()) {
      await gui.click(); await tien(2500);
      const t2 = await p.evaluate(() => (document.querySelector('[role="dialog"]') || document.body).innerText);
      r.luu("baoSai_ketQua", t2);
      r.kiem("Chặn API: báo sai hiện thông báo thân thiện, không lộ lỗi kỹ thuật", /thử lại|chưa gửi được|không gửi|mạng|kết nối|lỗi/i.test(t2) && !/Failed to fetch|TypeError|ERR_|NetworkError|undefined/.test(t2), t2.slice(0, 300));
    } else r.canhBao("Không bấm được nút Gửi của form báo sai (có thể bắt buộc chọn mục khác).");
  } else r.canhBao("Không thấy nút 'Báo số liệu sai' trên chi tiết.");
  donLoi(ctx, "L9a"); await ctx.close();
  // 9b: API trả 503 + 500 + HTML thay JSON
  for (const [ten, tra] of [["503-chua-cau-hinh", { status: 503, contentType: "application/json", body: '{"loi":"chua-cau-hinh"}' }], ["500", { status: 500, contentType: "text/plain", body: "boom" }], ["html-thay-json", { status: 200, contentType: "text/html", body: "<!doctype html><html></html>" }]]) {
    const c2 = await taoCtx({ ten: "L9b-" + ten, seed: seedThat([A]) });
    await c2.route(/\/api\//, (rt) => rt.fulfill(tra));
    const p2 = await c2.newPage(); await di(p2, "/tu-van", 800);
    await hoiAI(p2, "Điểm chuẩn Giáo dục Tiểu học Bạc Liêu?"); await tien(3500);
    const t2 = await p2.getByRole("region", { name: /Cuộc trò chuyện/ }).innerText().catch(() => "");
    r.kiem(`API ${ten}: tư vấn AI vẫn có câu trả lời, không treo`, t2.length > 60 && !/Failed to fetch|TypeError|SyntaxError|Unexpected token|undefined/.test(t2), t2.slice(-300));
    donLoi(c2, "L9b-" + ten); await c2.close();
  }
  // 9c: mạng chậm: trễ 8 giây cho /api/*
  const c3 = await taoCtx({ ten: "L9c", seed: seedThat([A]) });
  await c3.route(/\/api\//, async (rt) => { await tien(8000); rt.fulfill({ status: 503, contentType: "application/json", body: '{"loi":"chua-cau-hinh"}' }).catch(() => {}); });
  const p3 = await c3.newPage(); await di(p3, "/tu-van", 800);
  await hoiAI(p3, "Nên bắt đầu tìm ngành từ đâu?"); await tien(1200);
  const tDangCho = await vanBan(p3); r.luu("tuVan_dangCho", tDangCho);
  r.kiem("Mạng chậm: có dấu hiệu đang xử lý (đang trả lời/loading) và có thể điều hướng", /Đang|đang|\.\.\.|…/.test(tDangCho) && (await p3.getByRole("link", { name: "Khám phá" }).count()) > 0);
  await p3.getByRole("link", { name: "Khám phá" }).click(); await on(p3, 500);
  r.kiem("Mạng chậm: vẫn chuyển sang Khám phá được khi AI chưa trả lời", /#\/kham-pha/.test(p3.url()));
  donLoi(c3, "L9c"); await c3.close();
});

// LUỒNG 10: offline
await luong("L10", "Offline: dữ liệu đã nạp vẫn dùng được, thông báo dễ hiểu", async (r) => {
  const ctx = await taoCtx({ ten: "L10", seed: seedThat([A]) }); const p = await ctx.newPage();
  await di(p, "/kham-pha", 900); await di(p, `/kham-pha/${A}`, 900); await di(p, "/nguyen-vong", 700); await di(p, "/tu-van", 700);
  await ctx.setOffline(true);
  await di(p, "/kham-pha", 700); let t = await vanBan(p);
  r.kiem("Offline: Khám phá vẫn hiển thị danh sách (dữ liệu đã nạp)", /Điểm chuẩn \d{4}/.test(t));
  await di(p, `/kham-pha/${A}`, 700); t = await vanBan(p); r.kiem("Offline: chi tiết ngành vẫn mở", /Điểm chuẩn các năm/.test(t));
  await di(p, "/tu-van", 700);
  await hoiAI(p, "Điểm chuẩn ngành Giáo dục Tiểu học ĐH Bạc Liêu?"); await tien(4500);
  const tv = await p.getByRole("region", { name: /Cuộc trò chuyện/ }).innerText().catch(() => ""); r.luu("tuVan_offline", tv);
  r.kiem("Offline: tư vấn AI vẫn trả lời từ dữ liệu, không lộ lỗi kỹ thuật", tv.length > 60 && !/Failed to fetch|TypeError|ERR_|NetworkError/.test(tv), tv.slice(-250));
  const bao = await p.getByText(/offline|ngoại tuyến|không có mạng|mất kết nối/i).count();
  if (!bao) r.canhBao("Không thấy thông báo 'đang offline' nào trên app khi mất mạng (chỉ kiểm ở màn tư vấn).");
  await ctx.setOffline(false);
  r.ghiChu("Kiểm reload khi offline cần bản build + service worker (dev server không phục vụ được khi offline); chưa kiểm ở dev.");
  donLoi(ctx, "L10"); await ctx.close();
});

// LUỒNG 11: tư vấn AI không bịa điểm chuẩn
await luong("L11", "Tư vấn AI (chế độ tự động) không bịa điểm chuẩn", async (r) => {
  const du = JSON.parse(fs.readFileSync(path.join(goc, "src/data/du-lieu-that.json"), "utf8"));
  const hop = new Set();
  const them = (x) => { if (typeof x === "number") { hop.add(String(x).replace(".", ",")); hop.add(x.toFixed(2).replace(".", ",")); hop.add(x.toFixed(1).replace(".", ",")); } };
  for (const rr of du) { Object.values(rr.diem || {}).forEach(them); them(rr.dk); }
  const s = JSON.parse(seedThat([A])); Object.values(s.hoSo.diem).forEach(them);
  const ctx = await taoCtx({ ten: "L11", seed: seedThat([A]) });
  await ctx.route(/\/api\/tu-van/, (rt) => rt.fulfill({ status: 503, contentType: "application/json", body: '{"loi":"chua-cau-hinh"}' }));
  const p = await ctx.newPage(); await di(p, "/tu-van", 900);
  const cau = [
    ["co-du-lieu", "Điểm chuẩn ngành Giáo dục Tiểu học ĐH Bạc Liêu năm 2025 là bao nhiêu?"],
    ["khong-co", "Điểm chuẩn ngành Phi hành vũ trụ Đại học Hogwarts năm 2026 là bao nhiêu?"],
    ["du-doan", "Năm nay em chắc chắn đậu ngành Giáo dục Tiểu học Bạc Liêu không?"],
  ];
  for (const [k, c] of cau) {
    const truocLen = (await p.getByRole("region", { name: /Cuộc trò chuyện/ }).innerText().catch(() => "")).length;
    await hoiAI(p, c); await tien(3500);
    const all = await p.getByRole("region", { name: /Cuộc trò chuyện/ }).innerText().catch(() => "");
    const tra = all.slice(truocLen);
    r.luu("tl_" + k, tra);
    const so_ = (tra.match(/\d+,\d+/g) || []).filter((x) => !hop.has(x) && !/^\d+,0$/.test(x));
    r.kiem(`(${k}) mọi số thập phân trong câu trả lời đều có trong dữ liệu thật hoặc hồ sơ`, so_.length === 0, so_);
    if (k === "khong-co") r.kiem("(khong-co) nói thiếu dữ liệu, không bịa số", !/\b(2[0-9],\d+)\b/.test(tra) && /chưa có|không có|không tìm thấy|chưa tìm|thiếu/i.test(tra), tra.slice(0, 260));
    if (k === "du-doan") r.kiem("(du-doan) không khẳng định chắc chắn đậu/trượt", !/chắc chắn đậu|chắc chắn đỗ|100%|sẽ đậu/i.test(tra), tra.slice(0, 260));
    if (k === "co-du-lieu") r.kiem("(co-du-lieu) có số 26,99 hoặc nguồn năm 2025", /26,99/.test(tra), tra.slice(0, 260));
  }
  donLoi(ctx, "L11"); await ctx.close();
});

// =====================================================================================
// Kiểm trực quan đo được: các route × viewport (playwright setViewportSize)
function danhSachRoute() {
  const src = fs.readFileSync(path.join(goc, "src/duong-dan.ts"), "utf8");
  const mau = [...src.slice(src.indexOf("export const MAU"), src.indexOf("} as const;")).matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => ({ ten: m[1], mau: m[2] }));
  const thay = { ":buoc": "1", ":id": null, ":ma": "DBL" };
  const ra = [];
  for (const m of mau) {
    if (m.mau.includes(":id")) { if (m.ten === "chiTiet") { ra.push({ ten: "chiTietA", d: `/kham-pha/${A}` }, { ten: "chiTietC", d: `/kham-pha/${C}` }, { ten: "chiTietB", d: `/kham-pha/${B}` }, { ten: "chiTietF", d: `/kham-pha/${F}` }, { ten: "chiTietD", d: `/kham-pha/${D}` }); } continue; }
    let d = m.mau; for (const [k, v] of Object.entries(thay)) if (v) d = d.replace(k, v);
    ra.push({ ten: m.ten, d });
    if (m.ten === "batDau") ra.push({ ten: "batDau2", d: "/bat-dau/2" }, { ten: "batDau3", d: "/bat-dau/3" });
  }
  ra.push({ ten: "soSanhAB", d: `/so-sanh?a=${A}&b=${C}` });
  return ra.filter((x) => x.ten !== "batDau" || true);
}
if (chay("VQ") && !process.argv.includes("--bo-qua-viewport")) {
  log("\n== VQ Kiểm trực quan theo route x viewport");
  const routes = danhSachRoute();
  const ctx = await taoCtx({ ten: "VQ", seed: JSON.stringify((() => { const s = JSON.parse(seedMau()); s.hoSo.laMau = false; s.nguyenVong = [A, B, C]; s.yeuThich = [A]; s.soSanh = [A, C]; return s; })()) });
  const p = await ctx.newPage();
  for (const rt of routes) {
    const loi = ctx.__loi; const dau = { c: loi.console.length, e: loi.pageerror.length };
    for (const w of VIEWPORTS) {
      await p.setViewportSize({ width: w, height: w >= 1000 ? 800 : 780 });
      await di(p, rt.d, 650);
      const kq = await p.evaluate(doTrucQuan);
      kq.moi = moi(await vanBan(p));
      const k = `${rt.ten}@${w}`; ket.truc_quan[k] = { route: rt.d, ...kq };
    }
    ket.truc_quan[`${rt.ten}@loi`] = { console: loi.console.slice(dau.c), pageerror: loi.pageerror.slice(dau.e) };
    log("   ", rt.ten);
  }
  // bàn phím (390)
  await p.setViewportSize({ width: 390, height: 844 });
  for (const rt of routes.filter((x) => ["khamPha", "chiTietA", "nguyenVong", "hoSo", "batDau2", "tuVan", "homNay"].includes(x.ten))) {
    await di(p, rt.d, 700);
    ket.ban_phim[rt.ten] = await doBanPhim(p);
  }
  donLoi(ctx, "VQ"); await ctx.close();
  ghi();
}

// =====================================================================================
// Ảnh baseline bằng agent-browser (390x844 và 1280x800)
if (chay("ANH") && !process.argv.includes("--bo-qua-anh")) {
  log("\n== ANH Chụp bằng agent-browser");
  const env = { ...process.env, AGENT_BROWSER_SESSION: "qa2027" };
  const ab = (a) => { try { return execSync(`agent-browser ${a}`, { env, cwd: goc, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { return "LOI " + (e.stderr || e.message).toString().slice(0, 150); } };
  const seedHS = seedThat([A, B, C]).replace(/'/g, "\\'");
  const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
  const dat = (seed) => ab(`eval -b ${b64(`localStorage.clear(); ${seed ? `localStorage.setItem(${JSON.stringify(KHOA)}, ${JSON.stringify(seed)});` : ""} 1`)}`);
  const man = [
    ["kham-pha", `/kham-pha`, "mau"], ["chi-tiet-A", `/kham-pha/${A}`, "mau"], ["chi-tiet-C", `/kham-pha/${C}`, "mau"], ["chi-tiet-F", `/kham-pha/${F}`, "mau"],
    ["nguyen-vong", `/nguyen-vong`, "mau"], ["ho-so", `/ho-so`, "mau"], ["nhap-diem", `/bat-dau/2`, "trong"], ["thu-tinh-huong", `/thu-tinh-huong`, "mau"],
    ["chi-tiet-A-chua-diem", `/kham-pha/${A}`, "trong"], ["chao", `/chao`, "trong"],
  ];
  const seeds = { mau: seedThat([A, B, C]), trong: null };
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    ab(`set viewport ${w} ${h}`);
    for (const [ten, d, loai] of man) {
      ab(`open ${BASE}/#/chao`); dat(seeds[loai]);
      ab(`open ${BASE}/#${d}`); ab(`eval "location.reload()"`); ab("wait 1400");
      const f = path.join(OUT, `${w}-${ten}.png`);
      const o = ab(`screenshot ${JSON.stringify(f)}`);
      if (fs.existsSync(f)) ket.anh.push(path.relative(goc, f).replace(/\\/g, "/")); else log("   thiếu ảnh", ten, o.slice(0, 100));
    }
  }
  // D: dùng playwright vì cần chèn dòng giả
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await taoCtx({ ten: "ANH-D", seed: seedThat([]), w, h }); const p = await ctx.newPage();
    await di(p, `/kham-pha/${D}`, 1100); await chup(p, `${w}-chi-tiet-D`); await ctx.close();
  }
  ab("close");
}

await browser.close();
// Tóm tắt
const dem = ket.luong.reduce((a, l) => ((a[l.ket] = (a[l.ket] || 0) + 1), a), {});
ket.tomTat = dem;
ghi();
log("\nTÓM TẮT luồng:", JSON.stringify(dem), "→", path.relative(goc, path.join(OUT, "ket-qua.json")));
