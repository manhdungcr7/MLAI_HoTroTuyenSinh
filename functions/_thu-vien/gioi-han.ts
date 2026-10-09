// Giới hạn tần suất cho các endpoint công khai (báo sai, đăng ký tình nguyện viên). Đếm bằng KV theo địa chỉ IP băm, không lưu IP thô.
// KV không nguyên tử nên đếm có sai số nhỏ; mục tiêu là chặn người dùng bấm liên tục và máy gửi hàng loạt, không phải đo chính xác.
export interface KhoKvGhi {
  get: (khoa: string) => Promise<string | null>;
  put: (khoa: string, giaTri: string, tuyChon?: { expirationTtl?: number }) => Promise<void>;
}

async function bamNgan(chu: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chu));
  return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Đã vượt giới hạn trong cửa sổ hiện tại thì trả true (không tăng đếm nữa); chưa thì tăng đếm và trả false. KV lỗi hoặc thiếu thì cho qua. */
export async function vuotGioiHan(kv: KhoKvGhi | undefined, nhom: string, request: Request, toiDa: number, cuaSoGiay: number, bayGio = Date.now()): Promise<boolean> {
  if (!kv) return false;
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "khong-ro";
  const khoa = `gh:${nhom}:${await bamNgan(ip)}:${Math.floor(bayGio / (cuaSoGiay * 1000))}`;
  try {
    const dem = Number((await kv.get(khoa)) ?? 0);
    if (dem >= toiDa) return true;
    await kv.put(khoa, String(dem + 1), { expirationTtl: Math.max(60, cuaSoGiay * 2) });
    return false;
  } catch { return false; }
}

export const traLoiJson = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/** Đọc thân JSON tối đa 8KB. Trả null nếu quá lớn hoặc không phải đối tượng JSON. */
export async function docThanNho(request: Request): Promise<Record<string, unknown> | null> {
  const chu = await request.text();
  if (new TextEncoder().encode(chu).length > 8 * 1024) return null;
  try {
    const v: unknown = JSON.parse(chu);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch { return null; }
}
