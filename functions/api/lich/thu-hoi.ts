import { xuLyThuHoiFeed, type EnvLich } from "../../_thu-vien/lich-feed";

export const onRequestDelete = (ctx: { request: Request; env: EnvLich }) => xuLyThuHoiFeed(ctx.request, ctx.env);
