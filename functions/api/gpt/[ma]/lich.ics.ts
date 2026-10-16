// GET /api/gpt/{mã}/lich.ics: tệp lịch kế hoạch tuần (text/calendar), mở được trên Google Calendar, Apple Calendar, Outlook.
import { lichIcsGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  lichIcsGpt(ctx.env, maTuThamSo(ctx.params.ma));
