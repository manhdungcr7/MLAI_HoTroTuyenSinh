// Cổng kiểm tra đồng nhất. Chạy: npm run kiem-tra
// 1) Mọi route trong MAU đã được đăng ký trong features/*/routes.tsx.
// 2) Mọi DUONG_DAN.xxx() sinh ra đường dẫn khớp đúng một MAU.
// 3) Không viết tay đường dẫn "/..." trong src/features và src/components.
// 4) Không viết tay mã màu (#xxxxxx) ngoài src/styles.
// 5) Không dùng từ khó hiểu / thuật ngữ trong chữ hiển thị.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DUONG_DAN, MAU } from "../src/duong-dan";

const goc = join(import.meta.dirname, "..", "src");
const loi: string[] = [];

function duyet(thuMuc: string, ra: string[] = []): string[] {
  for (const ten of readdirSync(thuMuc)) {
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) duyet(p, ra);
    else if (/\.(tsx?|css)$/.test(ten)) ra.push(p);
  }
  return ra;
}
const tatCa = duyet(goc);
const doc = (p: string) => readFileSync(p, "utf8");
const tenFile = (p: string) => relative(join(goc, ".."), p).replaceAll("\\", "/");
/** Bỏ chú thích để không báo nhầm. */
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((d) => d.replace(/(^|\s)\/\/.*$/, "$1")).join("\n");

// 1) Route đã đăng ký
const fileRoutes = tatCa.filter((p) => /features[\\/].+[\\/]routes\.tsx$/.test(p));
const daDangKy = new Set<string>();
for (const f of fileRoutes) for (const m of doc(f).matchAll(/MAU\.(\w+)/g)) daDangKy.add(m[1]);
for (const k of Object.keys(MAU)) if (!daDangKy.has(k)) loi.push(`[route] MAU.${k} (${MAU[k as keyof typeof MAU]}) chưa được đăng ký trong features/*/routes.tsx`);

// 2) Mỗi hàm dựng đường dẫn khớp một mẫu
const mauRegex = Object.entries(MAU).map(([k, m]) => [k, new RegExp("^" + m.replace(/:[^/]+/g, "[^/]+") + "$")] as const);
const mau: Record<string, unknown[]> = { batDau: [1], chiTiet: ["x"], viec: ["x"], soSanh: ["a", "b"], tuan: ["lich"] };
for (const [ten, fn] of Object.entries(DUONG_DAN) as [string, (...a: unknown[]) => string][]) {
  const kq = fn(...(mau[ten] ?? [])).split("?")[0];
  const trung = mauRegex.filter(([, r]) => r.test(kq)).map(([k]) => k);
  if (trung.length === 0) loi.push(`[route] DUONG_DAN.${ten}() = "${kq}" không khớp mẫu nào trong MAU`);
}

// 3 + 4 + 5) Quét mã nguồn slice và thành phần
const TU_CAM = ["dashboard", "kịch bản", "giả lập", "tác động", "rủi ro", "chống trượt", "tối ưu", "CTA", "widget", "onboarding", "profile", "chắc chắn", "chắc chân", "an toàn không", "yên tâm", "cơ hội tốt"];
for (const f of tatCa) {
  const ten = tenFile(f);
  const trongFeature = /src\/(features|components)\//.test(ten);
  if (!trongFeature) continue;
  const code = boChuThich(doc(f));
  for (const m of code.matchAll(/(?:\bto|\bhref|quayLai|\bnav|navigate|\bNavigate to)\s*[=(]\s*\{?\s*["'`]\/(?!\/)/g)) {
    const dong = code.slice(0, m.index).split("\n").length;
    loi.push(`[duong-dan] ${ten}:${dong} viết tay đường dẫn, dùng DUONG_DAN.xxx()`);
  }
  for (const m of code.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const dong = code.slice(0, m.index).split("\n").length;
    loi.push(`[mau] ${ten}:${dong} mã màu viết tay "${m[0]}", dùng token/gradient của theme`);
  }
  for (const tu of TU_CAM) {
    // từ nằm trong chuỗi chữ hoặc trong nội dung JSX
    const re = new RegExp("[\"'`>][^\"'`<{}]*\\b" + tu + "\\b[^\"'`<{}]*[\"'`<]", "i");
    code.split("\n").forEach((d, i) => { if (re.test(d)) loi.push(`[tu-ngu] ${ten}:${i + 1} có từ khó hiểu "${tu}"`); });
  }
}

if (loi.length) {
  console.error(`Kiểm tra đồng nhất: ${loi.length} lỗi\n` + [...new Set(loi)].map((l) => " - " + l).join("\n"));
  process.exit(1);
}
console.log(`Kiểm tra đồng nhất: tất cả đều qua (${Object.keys(MAU).length} route, ${fileRoutes.length} slice).`);
