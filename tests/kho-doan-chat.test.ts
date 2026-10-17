// Kiểm thử kho đoạn chat (tối đa 10). Chạy: npx tsx tests/kho-doan-chat.test.ts
import assert from "node:assert/strict";
import { docCacDoan, goDoanChat, luuDoanChat, TOI_DA_DOAN } from "../src/features/tu-van/kho-doan-chat";
import type { TinNhan } from "../src/features/tu-van/hoi-thoai";

const kho = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
const doan = (c: string): TinNhan[] => [{ vai: "em", chu: c }, { vai: "mayChu", chu: "ok" }];

const k1 = kho();
for (let i = 0; i < 13; i++) luuDoanChat(k1, doan(`câu ${i}`), 1000 + i);
const ds = docCacDoan(k1);
assert.equal(ds.length, TOI_DA_DOAN);
assert.equal(ds[0].tieuDe, "câu 12");

const k2 = kho();
luuDoanChat(k2, [{ vai: "em", chu: "chưa đáp" }]);
assert.equal(docCacDoan(k2).length, 0);
luuDoanChat(k2, doan("a"));
assert.equal(goDoanChat(k2, docCacDoan(k2)[0].id)?.tin.length, 2);
assert.equal(docCacDoan(k2).length, 0);

const k3 = kho(); k3.setItem("nvai:tu-van-doan", "{hỏng");
assert.deepEqual(docCacDoan(k3), []);
console.log("kho-doan-chat: ok");
