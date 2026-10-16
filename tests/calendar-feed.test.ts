// Kiểm thử feed iCalendar riêng tư: tạo, kiểm tra dữ liệu, cập nhật, đọc và thu hồi.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { xuLyTaoFeed, xuLyCapNhatFeed, xuLyDocFeed, xuLyThuHoiFeed } from "../functions/_thu-vien/lich-feed";
import type { EnvLich } from "../functions/_thu-vien/lich-feed";
import { taoD1KetNoiTest } from "./nap-d1-ket-noi";
import { kvTest } from "./nap-d1-han-muc";

const ORIGIN = "https://app.test";
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const db = taoD1KetNoiTest();
const kv = kvTest();
const env: EnvLich = { DB: db, RATE_KV: kv.kv };
const req = (url: string, options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) => new Request(url, {
  method: options.method ?? "GET",
  headers: { ...(options.body !== undefined ? { "content-type": "application/json" } : {}), ...(options.headers ?? {}) },
  body: options.body === undefined ? undefined : JSON.stringify(options.body),
});

const created = await xuLyTaoFeed(req(`${ORIGIN}/api/lich/tao`, { method: "POST" }), env);
assert.equal(created.status, 201);
const credentials = await created.json() as { feedUrl: string; writeKey: string };
const feedKey = new URL(credentials.feedUrl).pathname.match(/\/api\/lich\/([a-f0-9]{48})\.ics$/)?.[1];
assert.ok(feedKey);
assert.match(credentials.writeKey, /^[a-f0-9]{48}$/);
const rows = db.db.prepare("SELECT ma_bam, quan_ly_bam, su_kien FROM lich_feed").all() as { ma_bam: string; quan_ly_bam: string; su_kien: string }[];
assert.equal(rows.length, 1);
assert.equal(rows[0].ma_bam, sha256(feedKey));
assert.equal(rows[0].quan_ly_bam, sha256(credentials.writeKey));
assert.ok(!JSON.stringify(rows).includes(feedKey));
assert.ok(!JSON.stringify(rows).includes(credentials.writeKey));

const getFeed = () => xuLyDocFeed(req(credentials.feedUrl), env, feedKey);
const empty = await getFeed();
assert.equal(empty.status, 200);
assert.match(empty.headers.get("content-type") ?? "", /text\/calendar/);
assert.match(await empty.text(), /BEGIN:VCALENDAR[\s\S]*END:VCALENDAR/);

const auth = { authorization: `Bearer ${credentials.writeKey}` };
const event = { tieuDe: "Ôn Toán, hàm số", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T19:45:00+07:00", ghiChu: "Đọc bài; ghi ý chính", taskId: "viec-123", progressStatus: "xong" };
const unauthorized = await xuLyCapNhatFeed(req(`${ORIGIN}/api/lich/cap-nhat`, { method: "PUT", body: { suKien: [event] } }), env);
assert.equal(unauthorized.status, 401);
const invalidDate = await xuLyCapNhatFeed(req(`${ORIGIN}/api/lich/cap-nhat`, { method: "PUT", headers: auth, body: { suKien: [{ ...event, batDau: "2026-02-31T19:00:00+07:00" }] } }), env);
assert.equal(invalidDate.status, 400);
const success = await xuLyCapNhatFeed(req(`${ORIGIN}/api/lich/cap-nhat`, { method: "PUT", headers: auth, body: { suKien: [event] } }), env);
assert.equal(success.status, 200);
const ics = await (await getFeed()).text();
assert.match(ics, /SUMMARY:Ôn Toán\\, hàm số/);
assert.match(ics, /DESCRIPTION:Đọc bài\\; ghi ý chính/);
assert.doesNotMatch(ics, /progressStatus|viec-123/);
const uid = ics.match(/UID:([^\r\n]+)/)?.[1];
assert.ok(uid);

const updated = await xuLyCapNhatFeed(req(`${ORIGIN}/api/lich/cap-nhat`, { method: "PUT", headers: auth, body: { suKien: [{ ...event, batDau: "2026-10-19T20:00:00+07:00", ketThuc: "2026-10-19T20:45:00+07:00" }] } }), env);
assert.equal(updated.status, 200);
const changedIcs = await (await getFeed()).text();
assert.equal(changedIcs.match(/BEGIN:VEVENT/g)?.length, 1, "thay thế snapshot chứ không nhân đôi sự kiện");
assert.equal(changedIcs.match(/UID:([^\r\n]+)/)?.[1], uid, "UID gắn với task giữ nguyên khi đổi giờ");
const clear = await xuLyCapNhatFeed(req(`${ORIGIN}/api/lich/cap-nhat`, { method: "PUT", headers: auth, body: { suKien: [] } }), env);
assert.equal(clear.status, 200);
assert.doesNotMatch(await (await getFeed()).text(), /BEGIN:VEVENT/);

const revoked = await xuLyThuHoiFeed(req(`${ORIGIN}/api/lich/thu-hoi`, { method: "DELETE", headers: auth }), env);
assert.equal(revoked.status, 200);
assert.equal((await getFeed()).status, 404);
const revokedAgain = await xuLyThuHoiFeed(req(`${ORIGIN}/api/lich/thu-hoi`, { method: "DELETE", headers: auth }), env);
assert.equal(revokedAgain.status, 404);

console.log("calendar-feed: ok");
