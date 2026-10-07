// GET /api/truong: danh sách trường kèm kênh và tiến độ. ?q=  ?chua-co=<mục>  ?cua-toi=1  ?trang=&moi=
import { LOAI_THONG_TIN } from "../../../src/data/dong-gop-kiem-tra";
import { chay, khongHoTro, TEN_TRUONG, truongDuocGiao } from "../_thu-vien/quyen";
import { docTrang, json, locEnum } from "../_thu-vien/phan-hoi";
import { gomTienDo, tienDoCua } from "../_thu-vien/tien-do";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";

const MUC = ["kenh", ...LOAI_THONG_TIN] as const;
const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    if (c.request.method !== "GET") throw khongHoTro();
    const t = docTrang(c.url);
    const q = boDau((c.url.searchParams.get("q") ?? "").trim().slice(0, 80));
    const chuaCo = locEnum(c.url.searchParams.get("chua-co"), MUC, "chua-co");
    const cuaToi = c.url.searchParams.get("cua-toi") === "1";
    const duocGiao = cuaToi ? new Set(await truongDuocGiao(c.d1, c.email)) : null;
    const du = await gomTienDo(c.d1);
    const ds = Object.entries(TEN_TRUONG)
      .filter(([ma, ten]) => (!duocGiao || duocGiao.has(ma)) && (!q || boDau(ma).includes(q) || boDau(ten).includes(q)))
      .map(([ma, ten]) => ({ maTruong: ma, ten, ...(du.kenh.has(ma) && { kenh: du.kenh.get(ma) }), tienDo: tienDoCua(ma, du) }))
      .filter((x) => !chuaCo || !(x.tienDo.co as string[]).includes(chuaCo))
      .sort((a, b) => a.maTruong.localeCompare(b.maTruong));
    return json({ truong: ds.slice(t.offset, t.offset + t.moi), tong: ds.length });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
