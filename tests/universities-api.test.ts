import assert from "node:assert/strict";
import { xuLyDanhSachTruong } from "../functions/api/v1/universities";

async function main() {
  // 1. GET danh sách mặc định
  const req1 = new Request("https://app.test/api/v1/universities?limit=10");
  const res1 = await xuLyDanhSachTruong(req1);
  assert.equal(res1.status, 200);
  const data1 = (await res1.json()) as { tong: number; limit: number; offset: number; data: { maTruong: string; tenTruong: string }[] };
  assert.equal(data1.tong, 118);
  assert.equal(data1.limit, 10);
  assert.equal(data1.data.length, 10);

  // 2. Tra cứu theo mã và tên
  const req2 = new Request("https://app.test/api/v1/universities?q=BKA");
  const res2 = await xuLyDanhSachTruong(req2);
  const data2 = (await res2.json()) as { tong: number; data: { maTruong: string; tenTruong: string }[] };
  assert.equal(data2.tong, 1);
  assert.equal(data2.data[0].maTruong, "BKA");

  // 3. Tra cứu theo tỉnh
  const req3 = new Request("https://app.test/api/v1/universities?tinh=Đà Nẵng");
  const res3 = await xuLyDanhSachTruong(req3);
  const data3 = (await res3.json()) as { tong: number; data: { maTruong: string; tenTruong: string; tinh: string[] }[] };
  assert.ok(data3.tong > 0);
  assert.ok(data3.data.every((d) => d.tinh.includes("Đà Nẵng")));

  // 4. Method OPTIONS trả 204
  const req4 = new Request("https://app.test/api/v1/universities", { method: "OPTIONS" });
  const res4 = await xuLyDanhSachTruong(req4);
  assert.equal(res4.status, 204);

  // 5. Method POST trả 405
  const req5 = new Request("https://app.test/api/v1/universities", { method: "POST" });
  const res5 = await xuLyDanhSachTruong(req5);
  assert.equal(res5.status, 405);

  console.log("universities-api: tất cả kiểm tra đều qua");
}

main();

