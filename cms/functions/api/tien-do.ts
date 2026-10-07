// GET /api/tien-do: mỗi trường đã có/thiếu mục nào. ?cua-toi=1  ?trang=&moi=  (tongDu, tong tính trên toàn bộ danh sách lọc)
import { chay, khongHoTro, TEN_TRUONG, truongDuocGiao } from "../_thu-vien/quyen";
import { docTrang, json } from "../_thu-vien/phan-hoi";
import { gomTienDo, tienDoCua } from "../_thu-vien/tien-do";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    if (c.request.method !== "GET") throw khongHoTro();
    const t = docTrang(c.url);
    const duocGiao = c.url.searchParams.get("cua-toi") === "1" ? new Set(await truongDuocGiao(c.d1, c.email)) : null;
    const du = await gomTienDo(c.d1);
    const ds = Object.keys(TEN_TRUONG).filter((ma) => !duocGiao || duocGiao.has(ma)).sort().map((ma) => tienDoCua(ma, du));
    return json({ truong: ds.slice(t.offset, t.offset + t.moi), tongDu: ds.filter((x) => x.du).length, tong: ds.length });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
