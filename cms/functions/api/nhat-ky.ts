// GET /api/nhat-ky (qtv): nhật ký hợp nhất (thao tác quản trị nhat_ky + kiểm toán quy trình nhat_ky_kiem_toan), mới nhất trước. ?trang=&moi=
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { docTrang, json } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro } from "../_thu-vien/quyen";

const HOP = `SELECT 'n' || id AS id, ai, hanh_dong, doi_tuong, luc FROM nhat_ky
  UNION ALL
  SELECT 'k' || id, actor_email, action, entity_type || ':' || entity_id || ' v' || version || COALESCE(' - ' || note, ''), timestamp FROM nhat_ky_kiem_toan`;

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv"], async (c) => {
    if (c.request.method !== "GET") throw khongHoTro();
    const t = docTrang(c.url);
    const [dem, ds] = (await c.d1.batch([
      c.d1.prepare("SELECT (SELECT COUNT(*) FROM nhat_ky) + (SELECT COUNT(*) FROM nhat_ky_kiem_toan) AS c"),
      c.d1.prepare(`SELECT * FROM (${HOP}) ORDER BY luc DESC, id DESC LIMIT ? OFFSET ?`).bind(t.moi, t.offset),
    ])) as unknown as [{ results: { c: number }[] }, { results: { id: string; ai: string; hanh_dong: string; doi_tuong: string; luc: string }[] }];
    return json({ nhatKy: ds.results.map((r) => ({ id: r.id, ai: r.ai, hanhDong: r.hanh_dong, doiTuong: r.doi_tuong, luc: r.luc })), tong: dem.results[0]?.c ?? 0 });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
