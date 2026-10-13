// Kiểm thử lớp Clef (tín hiệu thứ hai): chuẩn hóa, timeout, thiếu binding, state không rò thông tin cá nhân. AI giả, không gọi mạng. Chạy: npx tsx tests/clef.test.ts
import assert from "node:assert/strict";
import { chuanHoaTraLoi, dungStateEn, hoiClef, quyetDinhNguyenVong, type UngVienEn } from "../functions/_thu-vien/ai/clef";
import type { KhoAI } from "../functions/_thu-vien/ai/kieu";

const sc = (score: number) => ({ type: "score", score, legend: { 0: "low", 1: "medium", 2: "high" }, probabilities: {}, confidence: 0.8 });
const tho = (answers: unknown) => ({ model: "clef-omni", answers, usage: { input_tokens: 10, output_tokens: 0 } });
const q1 = { q: { type: "noul" as const, instructions: "x" } };

// 1) Chuẩn hóa hình dạng thật
const n = chuanHoaTraLoi(tho({ a: sc(1.9), b: { type: "noul", noul: 0.98 }, c: { type: "choice", choice: "keep_list", probabilities: { keep_list: 0.6, widen_region: 0.4 }, confidence: 0.5 }, x: 5 }));
assert.equal(n.a.score, 0.95); assert.equal(n.b.noul, 0.98); assert.equal(n.c.choice?.chon, "keep_list"); assert.equal(n.c.choice?.tinCay, 0.5); assert.equal(n.x, undefined);
assert.deepEqual(chuanHoaTraLoi(null), {});

// 2) Timeout và lỗi -> null; thiếu binding -> null
const treo: KhoAI = { run: () => new Promise(() => {}) };
const t0 = Date.now();
assert.equal(await hoiClef(treo, {}, q1, { hanMs: 50 }), null);
assert.ok(Date.now() - t0 < 1000);
assert.equal(await hoiClef({ run: async () => { throw new Error("5012"); } }, {}, q1), null);
assert.equal(await hoiClef(undefined, {}, q1), null);
assert.equal(await quyetDinhNguyenVong(undefined, {}, [{ id: "u1", label: "match" }]), null);

// 3) State không rò thông tin cá nhân, nhãn giữ nguyên là đầu vào
const ung: UngVienEn[] = [
  { id: "ctu-1", label: "match", scoreGap: 0.8, tuitionMillion: 30, interestGroups: ["technology"], communityNote: "Call 0912 345 678 or mail a.b@x.vn, strong labs" },
  { id: "ctu-2", label: "trial", scoreGap: -1.2, tuitionMillion: 120, interestGroups: ["arts"] },
];
const hs = { grade: 12, totalScore: 24, budgetMillion: 50, province: "Hanoi", interests: ["technology"], ten: "Nguyễn Văn A", email: "hs@x.vn", sdt: "0987654321" };
const st = JSON.stringify(dungStateEn(hs, ung));
for (const cam of ["Nguyễn", "hs@x.vn", "0987654321", "0912", "a.b@x.vn", "ctu-1", "ctu-2"]) assert.ok(!st.includes(cam), `rò: ${cam}`);
assert.ok(st.includes('"label":"match"') && st.includes('"label":"trial"') && st.includes("c1"));

// 4) Quyết định: ánh xạ id, uuTienLLM, hành động; tin cậy thấp thì bỏ hành động
let daHoi: { questions: Record<string, unknown> } | undefined;
const gia: KhoAI = { run: async (_m, inp) => { daHoi = inp as never; return tho({ fin_c0: sc(0.1), int_c0: sc(1.9), fin_c1: sc(1.9), int_c1: sc(0.1), next_action: { type: "choice", choice: "review_tuition", probabilities: { review_tuition: 0.6 }, confidence: 0.6 } }); } };
const qd = await quyetDinhNguyenVong(gia, { grade: 12, budgetMillion: 50 }, ung);
assert.ok(qd && daHoi); assert.equal(Object.keys(daHoi.questions).length, 5);
assert.deepEqual(qd.uuTienLLM, ["ctu-2"]);
assert.equal(qd.hanhDong?.chon, "review_tuition");
assert.ok(qd.tai["ctu-2"] > 0.9 && qd.soThich["ctu-1"] > 0.9);
const thap: KhoAI = { run: async () => tho({ fin_c0: sc(0), int_c0: sc(2), next_action: { type: "choice", choice: "keep_list", probabilities: {}, confidence: 0.05 } }) };
assert.equal((await quyetDinhNguyenVong(thap, {}, [ung[0]]))?.hanhDong, null);

console.log("clef.test.ts: ok");
