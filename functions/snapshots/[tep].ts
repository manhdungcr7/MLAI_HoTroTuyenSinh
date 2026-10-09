// Phục vụ các tệp snapshot mà CMS đã xuất bản: /snapshots/<tên>.<phiên bản>.<băm 8 ký tự>.json
// Nguồn: KV `snapshot:<phiên bản>:<tên>` (nhanh), không có thì D1 `snapshot_tap` (nguồn sự thật).
// Tên tệp có mã băm nên nội dung không bao giờ đổi: cache vĩnh viễn. Máy chủ tự kiểm lại băm trước khi trả,
// nên một tệp hỏng hay bị ghi nhầm trong KV không bao giờ tới tay học sinh (thà báo 404, app giữ bản cũ đang có).

export interface KhoKvDoc { get: (khoa: string) => Promise<string | null> }
export interface KhoD1Doc {
  prepare: (sql: string) => { bind: (...a: unknown[]) => { first: <T>() => Promise<T | null> } };
}
export interface EnvSnapshot { KV_CONG_DONG?: KhoKvDoc; DB?: KhoD1Doc }

const MAU_TEN = /^([a-z]+(?:-[a-z]+)*)\.(\d{4}\.\d{2}\.\d{2}\.\d{2})\.([0-9a-f]{8})\.json$/;
const TEN_HOP_LE = new Set(["schools", "tuition", "scholarships", "admissions", "announcements", "cutoff-scores", "community"]);

export async function bamSha256(chu: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chu));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const loi = (status: number, thongBao: string) =>
  new Response(JSON.stringify({ loi: thongBao }), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function phucVuSnapshot(env: EnvSnapshot, tep: string): Promise<Response> {
  const m = MAU_TEN.exec(tep);
  if (!m || !TEN_HOP_LE.has(m[1])) return loi(404, "Không có tệp này");
  const [, tenUrl, phienBan, bam8] = m;
  // Tên trong URL là "cutoff-scores" nhưng CMS lưu theo khóa của manifest ("cutoffScores") ở cả KV lẫn D1.
  const ten = tenUrl === "cutoff-scores" ? "cutoffScores" : tenUrl;

  let noiDung: string | null = null;
  try { noiDung = (await env.KV_CONG_DONG?.get(`snapshot:${phienBan}:${ten}`)) ?? null; } catch { noiDung = null; }
  if (noiDung === null && env.DB) {
    try {
      const h = await env.DB.prepare("SELECT noi_dung FROM snapshot_tap WHERE data_version = ? AND ten = ? LIMIT 1").bind(phienBan, ten).first<{ noi_dung: string }>();
      noiDung = h?.noi_dung ?? null;
    } catch { noiDung = null; }
  }
  if (noiDung === null) return loi(404, "Phiên bản dữ liệu này chưa có hoặc đã bị gỡ");
  if ((await bamSha256(noiDung)).slice(0, 8) !== bam8) return loi(404, "Nội dung không khớp mã băm, không phục vụ");

  return new Response(noiDung, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const onRequestGet = (ctx: { env: EnvSnapshot; params: { tep?: string | string[] } }) =>
  phucVuSnapshot(ctx.env, String(Array.isArray(ctx.params.tep) ? ctx.params.tep[0] : ctx.params.tep ?? ""));
