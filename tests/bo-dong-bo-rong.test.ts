// Manifest hợp lệ nhưng chưa có bản xuất bản nào: app không được xin tệp nào và không rơi sang manifest tĩnh.
import assert from "node:assert/strict";
import { BoDongBoDuLieu, LOI_CHUA_XUAT_BAN } from "../src/engine/du-lieu-tuyen-sinh/bo-dong-bo";

const rong = { schemaVersion: 1, dataVersion: "x", generatedAt: "", recentChanges: [],
  datasets: { schools: { version: "0", hash: "", url: "/snapshots/schools.json", size: 0, recordCount: 0, updatedAt: "" } } };
const daGoi: string[] = [];
(globalThis as { fetch: unknown }).fetch = async (url: string) => {
  daGoi.push(url);
  return new Response(JSON.stringify(rong), { status: 200 });
};
const kq = await new BoDongBoDuLieu().dongBoNen(true);
assert.equal(kq.loi, LOI_CHUA_XUAT_BAN);
assert.deepEqual(daGoi, ["/api/manifest"], "chỉ hỏi manifest API, không thử bản tĩnh, không xin tệp 404");

// API lỗi HTTP thì mới thử bản tĩnh
daGoi.length = 0;
(globalThis as { fetch: unknown }).fetch = async (url: string) => { daGoi.push(url); return new Response("x", { status: 500 }); };
await new BoDongBoDuLieu().dongBoNen(true);
assert.deepEqual(daGoi, ["/api/manifest", "/data/manifest.json"]);
console.log("bo-dong-bo-rong: ok");
