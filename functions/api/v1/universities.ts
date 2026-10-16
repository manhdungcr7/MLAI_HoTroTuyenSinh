// GET /api/v1/universities: tra cứu danh mục 118 trường đại học (công khai, không cần đăng nhập).
import { DANH_MUC_TRUONG } from "../../../src/data/truong-danh-muc";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const khongDau = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

export async function xuLyDanhSachTruong(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ loi: "Chỉ nhận GET" }), {
      status: 405,
      headers: { ...CORS, "content-type": "application/json; charset=utf-8" },
    });
  }

  const url = new URL(request.url);
  const q = khongDau(url.searchParams.get("q") ?? "").trim();
  const tinh = khongDau(url.searchParams.get("tinh") ?? "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  const tu = q.split(/\s+/).filter(Boolean);
  const loc = DANH_MUC_TRUONG.filter(([ma, ten, dsTinh]) => {
    if (tinh && !dsTinh.some((tp) => khongDau(tp).includes(tinh))) return false;
    if (!tu.length) return true;
    const gop = khongDau(`${ma} ${ten}`);
    return tu.every((w) => gop.includes(w));
  });

  const tong = loc.length;
  const data = loc.slice(offset, offset + limit).map(([maTruong, tenTruong, dsTinh]) => ({
    maTruong,
    tenTruong,
    tinh: dsTinh,
  }));

  return new Response(
    JSON.stringify({
      tong,
      limit,
      offset,
      data,
    }),
    {
      status: 200,
      headers: {
        ...CORS,
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

export const onRequest = ({ request }: { request: Request }) => xuLyDanhSachTruong(request);

