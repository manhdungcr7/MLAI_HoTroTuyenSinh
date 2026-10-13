// GET /api/nhat-ky (sa: đầy đủ; qtv: không thấy thao tác lên tài khoản sa/qtv): nhật ký hợp nhất (thao tác quản trị nhat_ky + kiểm toán quy trình nhat_ky_kiem_toan), mới nhất trước. ?trang=&moi=
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { docTrang, json } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, QUAN_TRI } from "../_thu-vien/quyen";

const AN_TAI_KHOAN = "WHERE hanh_dong NOT LIKE 'quan-tri.%' AND hanh_dong NOT LIKE 'nguoi.%.sa' AND hanh_dong NOT LIKE 'nguoi.%.qtv'";
const hop = (loc: string) => `SELECT 'n' || id AS id, ai, hanh_dong, doi_tuong, luc FROM nhat_ky ${loc}
  UNION ALL
  SELECT 'k' || id, actor_email, action, entity_type || ':' || entity_id || ' v' || version || COALESCE(' - ' || note, ''), timestamp FROM nhat_ky_kiem_toan`;

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    if (c.request.method !== "GET") throw khongHoTro();
    const t = docTrang(c.url);
    const loc = c.vaiTro === "sa" ? "" : AN_TAI_KHOAN;
    const [dem, ds] = (await c.d1.batch([
      c.d1.prepare(`SELECT (SELECT COUNT(*) FROM nhat_ky ${loc}) + (SELECT COUNT(*) FROM nhat_ky_kiem_toan) AS c`),
      c.d1.prepare(`SELECT * FROM (${hop(loc)}) ORDER BY luc DESC, id DESC LIMIT ? OFFSET ?`).bind(t.moi, t.offset),
    ])) as unknown as [{ results: { c: number }[] }, { results: { id: string; ai: string; hanh_dong: string; doi_tuong: string; luc: string }[] }];
    return json({ nhatKy: ds.results.map((r) => ({ id: r.id, ai: r.ai, hanhDong: r.hanh_dong, doiTuong: r.doi_tuong, luc: r.luc })), tong: dem.results[0]?.c ?? 0 });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
