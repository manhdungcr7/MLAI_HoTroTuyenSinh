// Kiểm thử bậc thang tư vấn với AI/VECTORIZE/KV giả. Chạy: npx tsx tests/bac-thang.test.ts
import assert from "node:assert/strict";
import { xuLy, type Env } from "../functions/api/tu-van";
import { chuanHoaCauHoi, khoaCache } from "../functions/_thu-vien/ai/cache";
import { boLocRag, cauTruyVanRag, chuDeLuotTruoc } from "../functions/_thu-vien/ai/bac-thang";
import { nhanDienTruongTinh } from "../functions/_thu-vien/ai/ten-truong";
import type { KhoAI, KhoVector } from "../functions/_thu-vien/ai/kieu";

const log = console.log; console.log = () => {}; // bỏ dòng đo đạc trong lúc test
const NHAN = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];
const sk = (i: number) => ({ id: `s${i}`, nganh: `Ngành ${i}`, truong: "UIT", tenTruong: "ĐH CNTT", tinh: "TP.HCM", phuongThuc: "THPT", toHop: ["A01"], diem: { "2024": 25 }, nhanCuaEm: NHAN[i % 4], chenh: i - 3, hocPhiTrieu: 20 + i, nguon: "Đề án 2024" });
const yc = (o: object) => new Request("https://x/api/tu-van", { method: "POST", body: JSON.stringify(o) });
const kvMoi = () => { const m = new Map<string, string>(); return { m, kv: { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => { m.set(k, v); } } }; };

/** Clef giả: ứng viên 0 và 1 rủi ro tài chính cao, hành động = add_safe_option. */
const aiGia = (hong = false): KhoAI => ({
  run: async (model, input) => {
    if (model.includes("bge")) return { data: [new Array(1024).fill(0.1)] };
    if (hong) throw new Error("clef hỏng");
    const qs = Object.keys((input as { questions: object }).questions);
    const answers: Record<string, unknown> = {};
    for (const q of qs) {
      if (q === "next_action") answers[q] = { type: "choice", choice: "add_safe_option", confidence: 0.9, probabilities: {} };
      else answers[q] = { type: "score", score: q === "fin_c0" || q === "fin_c1" ? 2 : 0, legend: { 0: "a", 1: "b", 2: "c" } };
    }
    return { answers, usage: { input_tokens: 10 } };
  },
});
const vecGia: KhoVector = {
  upsert: async () => ({}), deleteByIds: async () => ({}),
  query: async () => ({ matches: [
    { id: "noi_luu_tru:UIT-1", score: 0.9, metadata: { maTruong: "UIT", tinh: "TP.HCM", loai: "noi_luu_tru", phienBan: "1", chinhThuc: false, noiDung: "Khu trọ quanh UIT khá nhiều.", nguon: "" } },
    { id: "school:UIT", score: 0.8, metadata: { maTruong: "UIT", tinh: "TP.HCM", loai: "school", phienBan: "1", chinhThuc: true, noiDung: "Trường UIT.", nguon: "" } },
  ] }),
};
let goi = 0, loiNhan = "", traVe = "Có khu trọ [nguồn: s0, noi_luu_tru:UIT-1, bịa-9]";
const f = (async (_u: string, init: RequestInit) => {
  goi++; loiNhan = String(init.body);
  return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: traVe }] }) };
}) as unknown as typeof fetch;
const goiXuLy = async (env: Env, body: object) => { const r = await xuLy(yc(body), env, f); return { status: r.status, d: (await r.json()) as Record<string, unknown> }; };
const body = { cauHoi: "Nơi ở quanh UIT thế nào?", hoSo: { tinh: "TP.HCM", nganSachToiDaTrieu: 25 }, duLieu: [0, 1, 2, 3, 4, 5, 6, 7].map(sk) };

// 1) Cache: lần hai không gọi LLM; khác dấu/hoa thường vẫn trúng; đổi nhãn thì không trúng
{
  const { kv } = kvMoi();
  const env: Env = { ANTHROPIC_API_KEY: "k", RATE_KV: kv };
  goi = 0;
  const a = await goiXuLy(env, body);
  assert.equal(a.status, 200); assert.equal(a.d.tang, "llm"); assert.equal(goi, 1);
  const b = await goiXuLy(env, { ...body, cauHoi: "noi o quanh uit the nao" });
  assert.equal(b.d.tang, "cache"); assert.equal(goi, 1, "cache hit không gọi LLM"); assert.equal(b.d.traLoi, a.d.traLoi);
  const doiNhan = await goiXuLy(env, { ...body, duLieu: body.duLieu.map((d, i) => (i === 0 ? { ...d, nhanCuaEm: "An toàn" } : d)) });
  assert.equal(doiNhan.d.tang, "llm"); assert.equal(goi, 2);
  assert.equal(chuanHoaCauHoi("Điểm chuẩn  UIT?"), "diem chuan uit");
}

// 2) Clef + RAG: cắt sự kiện, id cộng đồng lọt qua, id bịa bị lọc
{
  const { kv } = kvMoi();
  const r = await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: kv, AI: aiGia(), VECTORIZE: vecGia }, body);
  assert.equal(r.status, 200);
  assert.deepEqual(r.d.nguon, ["s0", "noi_luu_tru:UIT-1"], "id cộng đồng được giữ, id bịa bị bỏ");
  assert.deepEqual(r.d.congDong, ["noi_luu_tru:UIT-1"]);
  assert.ok(typeof r.d.viecTiep === "string" && r.d.viecTiep.includes("An toàn"));
  const gui = JSON.parse(loiNhan).messages[0].content as string;
  assert.ok(gui.includes("GHI CHÚ CỘNG ĐỒNG") && gui.includes("chưa chính thức") && gui.includes("TÍN HIỆU THỨ HAI"));
  const soDong = gui.split("\n").filter((l) => l.startsWith('{"id":"s')).length;
  assert.ok(soDong >= 4 && soDong <= 6, `cắt còn 4-6 sự kiện, có ${soDong}`);
  assert.ok(gui.includes('"id":"s0"') && gui.includes('"id":"s1"'), "ứng viên Clef nêu phải còn lại");
}

// 3) Clef lỗi vẫn ra câu trả lời, giữ nguyên dữ liệu client
{
  const { kv } = kvMoi();
  const r = await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: kv, AI: aiGia(true) }, body);
  assert.equal(r.status, 200); assert.equal(r.d.tang, "llm");
  assert.equal((JSON.parse(loiNhan).messages[0].content as string).split("\n").filter((l) => l.startsWith('{"id":"s')).length, 8);
  assert.equal(r.d.viecTiep, undefined);
}

// 4) Không khóa LLM: có Clef thì 503 kèm gợi ý; không gì cả thì 503 như cũ; RAG chỉ chạy khi có cả hai binding
{
  const { kv } = kvMoi();
  const a = await goiXuLy({ RATE_KV: kv, AI: aiGia() }, body);
  assert.equal(a.status, 503); assert.equal(a.d.loi, "chua-cau-hinh");
  assert.equal((a.d.goiY as { nextAction: string }).nextAction, "add_safe_option");
  assert.equal((await goiXuLy({ RATE_KV: kv }, body)).status, 503);
  goi = 0;
  const b = await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: kv, VECTORIZE: vecGia }, body);
  assert.equal(b.status, 200); assert.equal(goi, 1); assert.equal(b.d.congDong, undefined);
}

// 5) CACHE_KV ưu tiên hơn RATE_KV và KV lỗi không làm vỡ
{
  const rate = kvMoi(), cache = kvMoi();
  await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: rate.kv, CACHE_KV: cache.kv }, body);
  assert.ok([...cache.m.keys()].some((k) => k.startsWith("tvc")) && ![...rate.m.keys()].some((k) => k.startsWith("tvc")));
  const hong = { get: async (k: string) => { if (k.startsWith("tvc")) throw new Error("kv"); return null; }, put: async (k: string) => { if (k.startsWith("tvc")) throw new Error("kv"); } };
  assert.equal((await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: hong }, body)).status, 200);
}

// 7) Nhận diện trường được hỏi và không cache khi RAG rỗng
{
  assert.deepEqual(nhanDienTruongTinh("Học phí ngành Dược học ở Khoa Y Dược Đà Nẵng bao nhiêu?"), { truong: ["DDY"], tinh: ["Đà Nẵng"] });
  assert.deepEqual(nhanDienTruongTinh("Điểm chuẩn Bách Khoa Hà Nội").truong, ["BKA"], "Hà Nội không kéo theo ĐH Hà Nội");
  assert.deepEqual(nhanDienTruongTinh("ngành nào hợp với em"), { truong: [], tinh: [] });
  const bo = boLocRag({ cauHoi: "Học phí Khoa Y Dược Đà Nẵng?", hoSo: { tinh: "Hà Nội" }, duLieu: [sk(0)] });
  assert.ok(bo.some((b) => b.maTruong === "DDY") && bo.some((b) => b.tinh === "Đà Nẵng") && bo.some((b) => !b.maTruong && !b.tinh), "có lọc trường hỏi, tỉnh hỏi và truy vấn toàn kho");
  const rong: KhoVector = { ...vecGia, query: async () => ({ matches: [] }) };
  const { m, kv } = kvMoi();
  traVe = "Mình chưa có dữ liệu về trường này.";
  await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: kv, AI: aiGia(), VECTORIZE: rong }, { ...body, cauHoi: "Câu hỏi RAG rỗng một" });
  assert.ok(![...m.keys()].some((k) => k.startsWith("tvc")), "RAG rỗng thì không ghi cache");
  traVe = "Trả lời [nguồn: s0]";
  await goiXuLy({ ANTHROPIC_API_KEY: "k", RATE_KV: kv, AI: aiGia(), VECTORIZE: rong }, { ...body, cauHoi: "Câu hỏi có nguồn hai" });
  assert.ok([...m.keys()].some((k) => k.startsWith("tvc")), "có nguồn thì cache");
}

// Ngữ cảnh nối tiếp: khóa cache khác nhau theo nguCanh; câu quá ngắn được ghép chủ đề lượt trước để tìm RAG
{
  const ds = [{ id: "s0", nhanCuaEm: "Vừa sức" }];
  const a = await khoaCache("Còn ngành kia thì sao?", ds, null, "v1", "Tư vấn chung\nEm hỏi: Điểm chuẩn UIT?\nMình đáp: 25");
  const b = await khoaCache("Còn ngành kia thì sao?", ds, null, "v1", "Tư vấn chung\nEm hỏi: Điểm chuẩn NEU?\nMình đáp: 26");
  const c = await khoaCache("Còn ngành kia thì sao?", ds, null, "v1", "Tư vấn chung\nEm hỏi: Điểm chuẩn UIT?\nMình đáp: 25");
  assert.notEqual(a, b); assert.equal(a, c);
  assert.notEqual(await khoaCache("x y z", ds, null, "v1"), await khoaCache("x y z", ds, null, "v1", "Em hỏi: UIT"));
  const nc = "Tư vấn chung\nCác lượt trước:\nEm hỏi: Học phí Khoa Y Dược Đà Nẵng?\nMình đáp: …\nEm hỏi: Điểm chuẩn UIT?\nMình đáp: …";
  assert.equal(chuDeLuotTruoc(nc), "Điểm chuẩn UIT?"); assert.equal(chuDeLuotTruoc(undefined), "");
  assert.equal(cauTruyVanRag({ cauHoi: "Còn nơi ở thì sao?", nguCanh: nc, duLieu: [] }), "Điểm chuẩn UIT? Còn nơi ở thì sao?");
  assert.equal(cauTruyVanRag({ cauHoi: "Nơi ở quanh trường UIT thế nào, có ký túc xá không?", nguCanh: nc, duLieu: [] }), "Nơi ở quanh trường UIT thế nào, có ký túc xá không?");
  assert.ok(boLocRag({ cauHoi: "Còn học phí?", nguCanh: "x\nEm hỏi: Học phí Khoa Y Dược Đà Nẵng?", duLieu: [] }).some((b) => b.maTruong === "DDY"), "trường nêu ở lượt trước vẫn được lọc RAG");
  // Hai cuộc trò chuyện khác nhau không dùng chung câu trả lời đã cache
  const { kv } = kvMoi(); const env: Env = { ANTHROPIC_API_KEY: "k", RATE_KV: kv };
  goi = 0; traVe = "Trả lời A [nguồn: s0]";
  const q = { ...body, cauHoi: "Còn ngành kia thì sao?" };
  await goiXuLy(env, { ...q, nguCanh: "Em hỏi: UIT?" }); await goiXuLy(env, { ...q, nguCanh: "Em hỏi: NEU?" }); await goiXuLy(env, { ...q, nguCanh: "Em hỏi: UIT?" });
  assert.equal(goi, 2, "cùng nguCanh trúng cache, khác nguCanh thì hỏi lại");
}

console.log = log;
console.log("bac-thang: tất cả kiểm tra đều qua");
