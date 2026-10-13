// POST /api/goi-y-duyet { id }: gợi ý cho người duyệt (quy tắc + Clef + kiểm trùng). Chỉ quản trị viên (vai trò duyệt).
// Không đổi trạng thái, không ghi vào bản ghi. Xem cms/functions/_thu-vien/ai-duyet.ts.
import { goiYDuyet } from "../_thu-vien/ai-duyet";
import { mapTuD1, type HangBanGhiD1 } from "../_thu-vien/ban-ghi-d1";
import type { BoiCanh, Env, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, docThan, json, khongTimThay, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, QUAN_TRI } from "../_thu-vien/quyen";

/** Tối đa số lần xin gợi ý mỗi người mỗi phút (mỗi lần tốn một lượt Clef và một lượt nhúng). */
export const GIOI_HAN_GOI_Y_MOI_PHUT = 20;

async function gioiHanGoiY(env: Env, email: string, bayGio: Date): Promise<void> {
  const kv = env.KV_CONG_DONG;
  if (!kv) return;
  try {
    const khoa = `gy:${email}:${Math.floor(bayGio.getTime() / 60_000)}`;
    const dem = Number((await kv.get(khoa)) ?? 0);
    if (dem >= GIOI_HAN_GOI_Y_MOI_PHUT) throw new LoiHttp(429, "qua-nhanh", "Bạn xin gợi ý hơi nhanh, đợi một phút rồi thử lại");
    await kv.put(khoa, String(dem + 1), { expirationTtl: 120 });
  } catch (e) {
    if (e instanceof LoiHttp) throw e; // KV lỗi thì không chặn
  }
}

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    if (c.request.method !== "POST") throw khongHoTro();
    const b = await docThan(c.request);
    const id = typeof b.id === "string" ? b.id : "";
    if (!id || id.length > 100) throw sai("Thiếu id bản ghi", "id");
    await gioiHanGoiY(c.env, c.email, c.bayGio);
    const h = await c.d1.prepare("SELECT * FROM ban_ghi_cms WHERE id = ? LIMIT 1").bind(id).first<HangBanGhiD1>();
    if (!h) throw khongTimThay("Không tìm thấy bản ghi");
    return json(await goiYDuyet(c.env, mapTuD1(h)));
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
