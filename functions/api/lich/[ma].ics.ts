import { xuLyDocFeed, type EnvLich } from "../../_thu-vien/lich-feed";

export const onRequestGet = (ctx: { request: Request; env: EnvLich; params: { ma: string | string[] } }) =>
  xuLyDocFeed(ctx.request, ctx.env, Array.isArray(ctx.params.ma) ? ctx.params.ma[0] : ctx.params.ma);
