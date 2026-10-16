// Trang đồng ý OAuth (HTML tự chứa, không tải tài nguyên ngoài). Mọi giá trị đưa vào HTML đều được escape.
import { PHAM_VI, type PhamVi } from "./oauth";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const KHUNG = (noiDung: string) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Nguyện Vọng AI · Kết nối</title>
<style>
:root{color-scheme:light dark;--nen:#f7f8fa;--chu:#1b2430;--phu:#4b5563;--the:#fff;--vien:#d6dbe3;--xanh:#1d4ed8;--do:#9f1239}
@media (prefers-color-scheme:dark){:root{--nen:#0f1420;--chu:#e8ecf3;--phu:#aab3c2;--the:#171f2e;--vien:#2c3648;--xanh:#7aa2ff;--do:#ff9db0}}
body{margin:0;background:var(--nen);color:var(--chu);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:480px;margin:0 auto;padding:24px 16px}
.the{background:var(--the);border:1px solid var(--vien);border-radius:12px;padding:20px}
h1{font-size:20px;margin:0 0 8px}
p{margin:8px 0;color:var(--phu)}
ul{padding-left:20px;margin:8px 0}
li{margin:6px 0}
label{display:block;font-weight:600;margin-top:16px}
input[type=text]{width:100%;box-sizing:border-box;margin-top:6px;padding:10px;font:inherit;font-family:ui-monospace,Menlo,monospace;border:1px solid var(--vien);border-radius:8px;background:var(--nen);color:var(--chu)}
.nut{margin-top:16px;display:flex;gap:10px;flex-wrap:wrap}
button{font:inherit;font-weight:600;padding:10px 16px;border-radius:8px;border:1px solid var(--vien);cursor:pointer}
.dong-y{background:var(--xanh);color:#fff;border-color:var(--xanh)}
.tu-choi{background:var(--the);color:var(--chu)}
.loi{color:var(--do);font-weight:600}
</style></head><body><main><div class="the">${noiDung}</div></main></body></html>`;

/** Trang lỗi không chuyển hướng (dùng khi client hoặc redirect_uri không hợp lệ: không được chuyển hướng tới địa chỉ lạ). */
export function trangLoi(thongBao: string): string {
  return KHUNG(`<h1>Không mở được trang kết nối</h1><p>${esc(thongBao)}</p><p>Quay lại ứng dụng Claude hoặc ChatGPT và thử kết nối lại.</p>`);
}

/** Trang đồng ý: hiện tên ứng dụng, các quyền xin, và ô để dán mã kết nối lấy từ Nguyện Vọng AI. */
export function trangDongY(p: { tenUngDung: string; phamVi: PhamVi[]; thamSo: Record<string, string>; loi?: string }): string {
  const dsPhamVi = p.phamVi.map((v) => `<li>${esc(PHAM_VI[v])}</li>`).join("");
  const an = Object.entries(p.thamSo).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
  return KHUNG(`
<h1>Cho phép "${esc(p.tenUngDung)}" xem hồ sơ của bạn?</h1>
<p>Ứng dụng này sẽ được phép:</p>
<ul>${dsPhamVi}</ul>
<p>Bạn có thể ngắt kết nối bất kỳ lúc nào trong Nguyện Vọng AI (Hồ sơ &gt; Cài đặt &gt; Kết nối).</p>
<form method="post" action="/oauth/authorize">
  ${an}
  <label for="ma">Mã kết nối của bạn</label>
  <input type="text" id="ma" name="ma" autocomplete="off" spellcheck="false" required pattern="[a-f0-9]{32}" placeholder="32 ký tự, lấy trong app">
  <p>Mở Nguyện Vọng AI &gt; Hồ sơ &gt; Cài đặt &gt; Kết nối, bấm "Tạo lại" nếu chưa có mã.</p>
  ${p.loi ? `<p class="loi">${esc(p.loi)}</p>` : ""}
  <div class="nut">
    <button class="dong-y" type="submit" name="quyet" value="dong-y">Đồng ý</button>
    <button class="tu-choi" type="submit" name="quyet" value="tu-choi">Từ chối</button>
  </div>
</form>`);
}
