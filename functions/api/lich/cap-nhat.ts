import { xuLyCapNhatFeed, type EnvLich } from "../../_thu-vien/lich-feed";

export const onRequestPut = (ctx: { request: Request; env: EnvLich }) => xuLyCapNhatFeed(ctx.request, ctx.env);
