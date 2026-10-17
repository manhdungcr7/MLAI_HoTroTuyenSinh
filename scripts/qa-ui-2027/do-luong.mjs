// Hàm đo chạy TRONG trang (page.evaluate). Trả về mảng lỗi trực quan. Không sửa DOM.
export function doTrucQuan() {
  const out = { tranNgang: null, nutNho: [], chuNho: [], biCat: [], nutRotDong: [], anhHong: [], nutIconThieuNhan: [] };
  const de = document.documentElement;
  out.tranNgang = de.scrollWidth > de.clientWidth + 1 ? { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth } : null;
  const hien = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.display === "none" || c.visibility === "hidden") return false;
    }
    return true;
  };
  const mo = (el) => {
    const t = (el.getAttribute("aria-label") || el.innerText || el.value || el.title || "").replace(/\s+/g, " ").trim().slice(0, 50);
    const id = el.id ? "#" + el.id : "";
    const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    return `${el.tagName.toLowerCase()}${id}${cls} "${t}"`;
  };
  const tuongTac = [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="switch"], [role="link"], input:not([type=hidden]), select, textarea, summary')].filter(hien);
  for (const el of tuongTac) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // link chữ nằm trong đoạn văn (inline) được bỏ qua
    const inline = el.tagName === "A" && cs.display === "inline" && el.closest("p, li, span, td");
    if (inline) continue;
    // ô tích/radio có nhãn bao quanh: đo theo nhãn
    let rr = r;
    if (el.tagName === "INPUT" && /checkbox|radio/.test(el.type)) { const lb = el.closest("label") || (el.id && document.querySelector(`label[for="${el.id}"]`)); if (lb) rr = lb.getBoundingClientRect(); }
    if (el.tagName === "INPUT" && /checkbox|radio/.test(el.type) && getComputedStyle(el).opacity === "0") continue;
    if (rr.height < 44 - 0.5 || rr.width < 44 - 0.5) out.nutNho.push({ el: mo(el), w: Math.round(rr.width), h: Math.round(rr.height) });
    // nút chỉ có biểu tượng
    const co = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title || (el.innerText || "").trim() || el.getAttribute("alt") || (el.labels && el.labels.length ? "x" : "") || el.getAttribute("placeholder"));
    if (!co && /BUTTON|A/.test(el.tagName)) out.nutIconThieuNhan.push(mo(el) + " <" + el.outerHTML.slice(0, 80).replace(/\s+/g, " ") + ">");
    // nút rớt dòng (nhãn ngắn nhưng cao hơn 1.7 dòng)
    const txt = (el.innerText || "").trim();
    if (txt && txt.length <= 28 && (el.tagName === "BUTTON" || el.getAttribute("role") === "button")) {
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
      const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      if (r.height - padV > lh * 1.7 && !el.querySelector("svg, img")) out.nutRotDong.push({ el: mo(el), h: Math.round(r.height), dong: Math.round((r.height - padV) / lh) });
    }
  }
  // chữ nhỏ hơn 13px (chỉ phần tử có chữ trực tiếp)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const daTinh = new Set();
  for (let n; (n = walker.nextNode()); ) {
    const t = n.nodeValue.trim();
    if (!t) continue;
    const p = n.parentElement;
    if (!p || daTinh.has(p) || !hien(p)) continue;
    daTinh.add(p);
    if (/SCRIPT|STYLE|NOSCRIPT|SVG|TEXT|TSPAN/i.test(p.tagName) || p.closest("svg")) continue;
    const fs = parseFloat(getComputedStyle(p).fontSize);
    if (fs < 13) out.chuNho.push({ el: mo(p), px: fs, chu: t.slice(0, 40) });
  }
  // bị cắt chữ
  for (const el of document.querySelectorAll("body *")) {
    if (!el.childNodes.length || !hien(el)) continue;
    const cs = getComputedStyle(el);
    const cat = /hidden|clip|auto|scroll/.test(cs.overflowX);
    if (cat && el.scrollWidth > el.clientWidth + 1 && (el.innerText || "").trim() && !/auto|scroll/.test(cs.overflowX)) {
      out.biCat.push({ el: mo(el), sw: el.scrollWidth, cw: el.clientWidth, ellipsis: cs.textOverflow === "ellipsis" });
    }
  }
  for (const img of document.images) if (hien(img) && img.complete && img.naturalWidth === 0) out.anhHong.push(img.src.slice(0, 120));
  const gioi = (a) => a.slice(0, 12);
  for (const k of ["nutNho", "chuNho", "biCat", "nutRotDong", "nutIconThieuNhan"]) { out[k + "_tong"] = out[k].length; out[k] = gioi(out[k]); }
  return out;
}

// Điều hướng bàn phím: Tab đi hết, focus nhìn thấy được.
export async function doBanPhim(page, toiDa = 90) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const tong = await page.evaluate(() => {
    const ok = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.disabled && el.tabIndex >= 0; };
    return [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [tabindex]')].filter(ok).length;
  });
  const dao = new Set(); let khongThayFocus = []; let lap = 0;
  for (let i = 0; i < Math.min(toiDa, tong + 5); i++) {
    await page.keyboard.press("Tab");
    const t = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow && cs.boxShadow !== "none";
      const pe = el.closest("[class]");
      return { k: el.tagName + "|" + (el.getAttribute("aria-label") || el.innerText || el.id || "").slice(0, 40), thay: outline || shadow || (el.matches(":focus-visible") && cs.outlineStyle !== "none") };
    });
    if (!t) { lap++; continue; }
    if (dao.has(t.k)) { lap++; if (lap > 3) break; continue; }
    dao.add(t.k);
    if (!t.thay) khongThayFocus.push(t.k);
  }
  return { phanTuTab: tong, daToi: dao.size, khongThayFocus: khongThayFocus.slice(0, 10), khongThayFocus_tong: khongThayFocus.length };
}
