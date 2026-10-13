// Tạo (hoặc đặt lại) siêu quản trị đầu tiên cho CMS.
//   npx tsx scripts/tao-sa.ts <email> [--mat-khau=<mật khẩu>] [--local | --remote]
// Không có --local/--remote: chỉ in SQL (chạy tay bằng wrangler d1 execute). Mật khẩu in ra màn hình MỘT lần; trong SQL chỉ có bản băm.
// Tài khoản luôn bị buộc đổi mật khẩu ở lần đăng nhập đầu. Email đã có thì được nâng lên sa và đặt lại mật khẩu.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bamMatKhau, loiMatKhauMoi, sinhMatKhauTam } from "../cms/functions/_thu-vien/mat-khau";
import { chuanHoaEmail, laEmail } from "../cms/functions/_thu-vien/xac-thuc";

export interface ThamSo { email: string; matKhau: string | null; dich: "local" | "remote" | null }

/** Đọc tham số dòng lệnh; ném Error tiếng Việt nếu sai. */
export function docThamSo(argv: string[]): ThamSo {
  let email = "", matKhau: string | null = null, dich: ThamSo["dich"] = null;
  for (const a of argv) {
    if (a === "--local" || a === "--remote") dich = a.slice(2) as "local" | "remote";
    else if (a.startsWith("--mat-khau=")) matKhau = a.slice("--mat-khau=".length);
    else if (a.startsWith("--")) throw new Error(`Tham số lạ: ${a}`);
    else if (!email) email = a;
    else throw new Error("Chỉ nhận một email");
  }
  if (!laEmail(email)) throw new Error("Cần một email hợp lệ. Ví dụ: npx tsx scripts/tao-sa.ts ban@gmail.com --remote");
  if (matKhau !== null) { const loi = loiMatKhauMoi(matKhau); if (loi) throw new Error(loi); }
  return { email: chuanHoaEmail(email), matKhau, dich };
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
/** SQL tạo/nâng sa. Không chứa mật khẩu, chỉ có bản băm. */
export async function sqlTaoSa(email: string, matKhau: string, bayGio = new Date()): Promise<string> {
  const luc = bayGio.toISOString();
  return `INSERT INTO quan_tri (email, vai_tro, tao_luc, mat_khau, phai_doi_mat_khau, mat_khau_luc) VALUES (${q(email)}, 'sa', ${q(luc)}, ${q(await bamMatKhau(matKhau))}, 1, ${q(luc)}) ON CONFLICT(email) DO UPDATE SET vai_tro = 'sa', mat_khau = excluded.mat_khau, phai_doi_mat_khau = 1, mat_khau_luc = excluded.mat_khau_luc;`;
}

async function chinh() {
  const t = docThamSo(process.argv.slice(2));
  const matKhau = t.matKhau ?? sinhMatKhauTam();
  const sql = await sqlTaoSa(t.email, matKhau);
  console.log(`Email: ${t.email}\nMật khẩu tạm (chỉ hiện lần này, đổi ngay khi đăng nhập): ${matKhau}\n`);
  if (!t.dich) { console.log(`SQL (chưa chạy):\n${sql}`); return; }
  const thu = mkdtempSync(join(tmpdir(), "tao-sa-"));
  try {
    const tep = join(thu, "tao-sa.sql");
    writeFileSync(tep, sql + "\n");
    const r = spawnSync("npx", ["wrangler", "d1", "execute", "nguyenvongai_db", `--${t.dich}`, `--file=${tep}`, "--config=cms/wrangler.jsonc"], { stdio: "inherit", shell: process.platform === "win32" });
    if (r.status !== 0) throw new Error("wrangler báo lỗi, tài khoản chưa được tạo");
    console.log("Xong. Đăng nhập vào CMS bằng email và mật khẩu tạm ở trên.");
  } finally { rmSync(thu, { recursive: true, force: true }); }
}

if (process.argv[1] && process.argv[1].split(/[\\/]/).pop() === "tao-sa.ts") chinh().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
