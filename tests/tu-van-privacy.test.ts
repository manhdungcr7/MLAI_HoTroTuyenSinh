import "./nap-du-lieu";
import assert from "node:assert/strict";
import { layTinTraLoi } from "../src/features/tu-van/cau-tra-loi";
import { taoHoSoMau } from "../src/state/mau";
import type { PhienAI } from "../src/features/tu-van/che-do-ai";

const state = taoHoSoMau();
let payload: Record<string, unknown> | undefined;
const phien: PhienAI = {
  cheDo: "ai",
  idHoSo: "11111111-1111-4111-8111-111111111111",
  luot: { con: 10, toiDa: 50 },
  fetch: (async (_url: string, init: RequestInit) => {
    payload = JSON.parse(String(init.body)) as Record<string, unknown>;
    return { ok: false, status: 503, json: async () => ({ loi: "chua-cau-hinh" }) } as Response;
  }) as unknown as typeof fetch,
};

const tin = await layTinTraLoi({
  cau: "Em lớp 11 chưa có điểm thi thử thì nên bắt đầu từ đâu?",
  truoc: [
    { vai: "em", chu: "Điểm A01 của em là 24 điểm." },
    { vai: "mayChu", chu: "Bạn đang cân nhắc CNTT tại TP. Hồ Chí Minh." },
  ],
  s: state,
  nguon: null,
  dungHoSo: false,
  manHinh: "Tư vấn",
  phien,
});

const daGui = payload as Record<string, unknown>;
assert.ok(daGui, "phải gọi endpoint AI đúng một lần");
assert.equal(daGui.hoSo, null, "bỏ chọn hồ sơ phải gửi hoSo: null");
assert.ok(Array.isArray(daGui.duLieu) && daGui.duLieu.every((x) => {
  const suKien = x as Record<string, unknown>;
  return suKien.tongCuaEm === undefined && suKien.toHopDaTinh === undefined && suKien.nhanCuaEm === undefined && suKien.chenh === undefined;
}), "bỏ chọn hồ sơ chỉ được gửi dữ liệu danh mục công khai, không kèm điểm hoặc nhãn riêng");
assert.ok(!String(daGui.nguCanh).includes("24 điểm"), "không gửi lịch sử có dữ liệu cá nhân");
assert.ok(!/24,0|24 điểm|CNTT tại TP\. Hồ Chí Minh/i.test(tin.chu), "fallback khi AI lỗi không được suy ra hồ sơ đã bỏ chọn");

console.log("tu-van-privacy: OK");
