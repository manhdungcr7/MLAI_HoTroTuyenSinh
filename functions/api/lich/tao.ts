import { xuLyTaoFeed, type EnvLich } from "../../_thu-vien/lich-feed";

export const onRequestPost = (ctx: { request: Request; env: EnvLich }) => xuLyTaoFeed(ctx.request, ctx.env);
