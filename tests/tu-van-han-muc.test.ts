import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử hạn mức lượt AI và chế độ AI/Tiết kiệm: máy chủ (D1 SQLite thật) và phía trình duyệt (fetch giả).
// Chạy: npx tsx tests/tu-van-han-muc.test.ts
import assert from "node:assert/strict";
import { xuLy, type Env } from "../functions/api/tu-van";
import { chotLuot, giuLuot, luotConLai, traLaiLuot } from "../functions/_thu-vien/han-muc-ai";
import { ngayVN } from "../src/engine/ngay-vn";
import { layTinTraLoi } from "../src/features/tu-van/cau-tra-loi";
import { docCheDo, docLuot, datLaiHoSoAI, idHoSoAI, laUuid, KHOA_CHE_DO, KHOA_ID_HO_SO, KHOA_LUOT, type KhoAI, type PhienAI } from "../src/features/tu-van/che-do-ai";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { taoD1Test, kvTest, themDinhDanh } from "./nap-d1-han-muc";

const sk = { id: "a1", nganh: "Khoa học máy tính", truong: "UIT", tenTruong: "ĐH CNTT", tinh: "TP.HCM", phuongThuc: "THPT", toHop: ["A01"], diem: { "2024": 26.9 }, nguon: "Đề án 2024, trang 3" };
const HOI = "Em nên ôn tập thế nào để giữ tinh thần tốt?";
// Câu không khớp dữ liệu nào: chế độ Tiết kiệm trả lời "không hiểu" nên cần bật AI.
const CAU_MO = "Bầu trời màu gì vào buổi tối?";
const yc = (o: object, ip = "203.0.113.9") => new Request("https://x/api/tu-van", { method: "POST", headers: { "cf-connecting-ip": ip }, body: JSON.stringify(o) });
/** Mô hình giả: trả đúng một câu có số đã có trong dữ liệu (không bị coi là bịa). Đếm số lần gọi. */
function moHinh(dem: { n: number }, trangThai = 200) {
  return (async () => {
    dem.n++;
    if (trangThai !== 200) return { ok: false, status: trangThai, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "Điểm 26,9 (2024). [nguồn: a1]" }] }) };
  }) as unknown as typeof fetch;
}
const env = (db: ReturnType<typeof taoD1Test>, kv: ReturnType<typeof kvTest>["kv"]): Env => ({ ANTHROPIC_API_KEY: "khoa-bi-mat", RATE_KV: kv, DB: db });
const HO = "11111111-1111-4111-8111-111111111111";

// 1) Server: id sai → 400; thiếu binding D1 → 503 và không gọi mô hình
{
  const { kv } = kvTest(); const dem = { n: 0 };
  assert.equal((await xuLy(yc({ hoSoId: "khong-phai-uuid", requestId: crypto.randomUUID(), cauHoi: HOI, duLieu: [sk] }), env(taoD1Test(), kv), moHinh(dem))).status, 400, "hoSoId sai thì 400");
  assert.equal((await xuLy(yc({ hoSoId: HO, cauHoi: HOI, duLieu: [sk] }), env(taoD1Test(), kv), moHinh(dem))).status, 400, "thiếu requestId thì 400");
  const thieu = await xuLy(yc(themDinhDanh({ cauHoi: HOI, duLieu: [sk] })), { ANTHROPIC_API_KEY: "k", RATE_KV: kv }, moHinh(dem));
  assert.equal(thieu.status, 503, "thiếu D1 thì 503 (fail-closed)");
  assert.equal(dem.n, 0, "không gọi mô hình khi thiếu D1 hoặc id sai");
}

// 2) Hạn mức nguyên tử: 60 yêu cầu song song (cùng hồ sơ, câu hỏi khác nhau để không trúng cache) → đúng 50 thành công
{
  const db = taoD1Test(); const { kv } = kvTest(); const dem = { n: 0 };
  const rs = await Promise.all(Array.from({ length: 60 }, (_, i) =>
    xuLy(yc({ ...themDinhDanh({ cauHoi: `Điểm chuẩn UIT câu ${i} thế nào?`, duLieu: [sk] }, HO) }, `198.51.100.${i}`), env(db, kv), moHinh(dem))));
  const ok = rs.filter((r) => r.status === 200).length, het = rs.filter((r) => r.status === 429).length;
  assert.equal(ok, 50, `đúng 50 thành công, có ${ok}`);
  assert.equal(het, 10, "10 yêu cầu còn lại nhận 429");
  assert.equal(dem.n, 50, "chỉ 50 lần gọi mô hình");
  const d = (await rs.find((r) => r.status === 429)!.json()) as { loi: string };
  assert.equal(d.loi, "het-luot-ngay");
  assert.equal((await luotConLai(db, HO, 50)).con, 0);
}

// 3) Lỗi hạ tầng (500) hoàn lượt; kết quả sai số liệu (422) KHÔNG hoàn (mô hình đã được gọi, tránh lách hạn mức bằng hoSoId mới)
{
  const db = taoD1Test(); const { kv } = kvTest(); const dem = { n: 0 };
  const lo = await xuLy(yc(themDinhDanh({ cauHoi: HOI, duLieu: [sk] }, HO)), env(db, kv), moHinh(dem, 500));
  assert.equal(lo.status, 502);
  assert.equal((await luotConLai(db, HO, 50)).con, 50, "lỗi không trừ lượt");
  const sai = await xuLy(yc(themDinhDanh({ cauHoi: "Câu khác để không trúng cache", duLieu: [sk] }, HO)), env(db, kv), (async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "Điểm 99,9 (2024)." }] }) })) as unknown as typeof fetch);
  assert.equal(sai.status, 422, "số liệu bịa bị chặn");
  assert.equal((await luotConLai(db, HO, 50)).con, 49, "câu bị chặn 422 vẫn tính một lượt");
  assert.equal(((await sai.json()) as { ma?: string }).ma, undefined, "không lộ mã nhà cung cấp");
  assert.equal(((await lo.json()) as { ma?: string }).ma, undefined, "502 không lộ mã nhà cung cấp");
}

// 4) Idempotent theo requestId: gửi lại cùng mã không trừ hai lần
{
  const db = taoD1Test(); const { kv } = kvTest(); const dem = { n: 0 };
  const body = themDinhDanh({ cauHoi: "Điểm chuẩn UIT năm nay ra sao?", duLieu: [sk] }, HO);
  assert.equal((await xuLy(yc(body), env(db, kv), moHinh(dem))).status, 200);
  assert.equal((await xuLy(yc(body), env(db, kv), moHinh(dem))).status, 409, "gửi lại cùng requestId thì 409, không gọi lại mô hình");
  assert.equal(dem.n, 1);
  assert.equal((await luotConLai(db, HO, 50)).con, 49, "trừ đúng một lần");
}

// 5) Chốt và trả lượt trực tiếp ở lớp hạn mức (không qua HTTP)
{
  const db = taoD1Test(); const t = Date.parse("2026-10-15T10:00:00+07:00");
  const g = await giuLuot(db, HO, "a0000000-0000-4000-8000-000000000001", 1, t);
  assert.equal(g.ok, true);
  if (g.ok) await traLaiLuot(db, g.giu);
  assert.equal((await luotConLai(db, HO, 1, t)).con, 1, "trả lượt đưa đếm về 0");
  const g2 = await giuLuot(db, HO, "a0000000-0000-4000-8000-000000000002", 1, t);
  assert.equal(g2.ok, true); if (g2.ok) await chotLuot(db, g2.giu);
  assert.equal((await luotConLai(db, HO, 1, t)).con, 0, "đã chốt thì vẫn trừ");
}

// 6) Biên ngày giờ Việt Nam: 23:59:59 và 00:00:00 (+07) thuộc hai ngày khác nhau; lượt reset đúng 00:00
{
  const db = taoD1Test();
  const cuoi = Date.parse("2026-10-15T23:59:59+07:00"), dau = Date.parse("2026-10-16T00:00:00+07:00");
  assert.equal(ngayVN(cuoi), "2026-10-15"); assert.equal(ngayVN(dau), "2026-10-16");
  assert.equal(ngayVN(Date.parse("2026-10-15T16:59:59Z")), "2026-10-15", "16:59:59Z là 23:59:59 giờ VN");
  assert.equal(ngayVN(Date.parse("2026-10-15T17:00:00Z")), "2026-10-16", "17:00:00Z là 00:00 giờ VN");
  assert.equal((await giuLuot(db, HO, "b0000000-0000-4000-8000-000000000001", 1, cuoi)).ok, true);
  assert.equal((await giuLuot(db, HO, "b0000000-0000-4000-8000-000000000002", 1, cuoi)).ok, false, "hết lượt trong ngày cũ");
  assert.equal((await giuLuot(db, HO, "b0000000-0000-4000-8000-000000000003", 1, dau)).ok, true, "00:00 đã có lượt mới");
}

// 7) Phía trình duyệt: Tiết kiệm không gọi fetch; AI gọi đúng một lần; hết lượt rơi về tự động; lỗi mạng không báo hết lượt
{
  const dem = { n: 0 };
  const s = TRANG_THAI_BAN_DAU;
  const phien = (p: Partial<PhienAI>): PhienAI => ({ cheDo: "ai", idHoSo: HO, luot: { con: 50, toiDa: 50 }, fetch: moHinh(dem), ...p });
  const hoi = (p: Partial<PhienAI>, cau = CAU_MO) => layTinTraLoi({ cau, truoc: [], s, nguon: null, dungHoSo: false, manHinh: "Tư vấn chung", phien: phien(p) });

  // Tiết kiệm: không gọi fetch, dù câu không hiểu thì chỉ nói cần bật AI (không báo lỗi mạng)
  const tk = await hoi({ cheDo: "tietKiem" });
  assert.equal(dem.n, 0, "tiết kiệm không gọi /api/tu-van");
  assert.equal(tk.thuLai, undefined, "không báo lỗi mạng");
  assert.equal(tk.batAI, true, "câu không hiểu ở chế độ Tiết kiệm có nút bật AI");

  // Chào hỏi không tốn lượt và không gọi mô hình
  await hoi({ cheDo: "ai" }, "xin chào");
  assert.equal(dem.n, 0, "chào hỏi không gọi AI");

  // Hỏi số lượt: nói số thật
  const luot = await hoi({ cheDo: "ai", luot: { con: 37, toiDa: 50 } }, "Hôm nay còn bao nhiêu lượt AI?");
  assert.ok(luot.chu.includes("37/50"), luot.chu);
  assert.equal(dem.n, 0);

  // AI: gọi đúng một lần, ghi lại số lượt máy chủ báo
  let ghi: { con: number; toiDa: number } | null = null;
  const ai = await hoi({ cheDo: "ai", luot: { con: 50, toiDa: 50 }, ghiLuot: (l) => { ghi = l; }, fetch: (async (_u: string, init: RequestInit) => {
    dem.n++; const b = JSON.parse(String(init.body));
    assert.equal(b.hoSoId, HO, "gửi kèm mã hồ sơ"); assert.ok(laUuid(b.requestId), "gửi kèm mã yêu cầu UUID");
    return { ok: true, status: 200, json: async () => ({ traLoi: "Hãy ngủ đủ và chia nhỏ việc ôn.", nguon: [], tang: "llm", luot: { con: 49, toiDa: 50 } }) };
  }) as unknown as typeof fetch });
  assert.equal(dem.n, 1, "AI gọi đúng một lần");
  assert.equal(ai.chu, "Hãy ngủ đủ và chia nhỏ việc ôn.");
  assert.deepEqual(ghi, { con: 49, toiDa: 50 });

  // Hết lượt (máy chủ 429 het-luot-ngay): rơi về tự động, ghi chú gọn, không phải lỗi
  let ghi2: { con: number; toiDa: number } | null = null;
  const het = await hoi({ cheDo: "ai", ghiLuot: (l) => { ghi2 = l; }, fetch: (async () => ({ ok: false, status: 429, json: async () => ({ loi: "het-luot-ngay", luot: { con: 0, toiDa: 50 } }) })) as unknown as typeof fetch });
  assert.equal(het.ghiChu, "Hôm nay đã dùng hết 50 lượt AI", "thông báo gọn khi hết lượt");
  assert.equal(het.thuLai, undefined, "hết lượt không phải lỗi mạng");
  assert.deepEqual(ghi2, { con: 0, toiDa: 50 });

  // Đã biết hết lượt từ trước: không gọi mạng
  const dh = { n: 0 };
  await hoi({ cheDo: "ai", luot: { con: 0, toiDa: 50 }, fetch: moHinh(dh) });
  assert.equal(dh.n, 0, "hết lượt đã biết thì không gọi mạng");

  // Lỗi mạng: có thuLai, không ghi chú hết lượt
  const mang = await hoi({ cheDo: "ai", fetch: (async () => { throw new Error("mất mạng"); }) as unknown as typeof fetch });
  assert.equal(mang.ghiChu, undefined, "lỗi mạng không báo hết lượt");
}

// 8) Lưu trữ phía trình duyệt: mặc định là AI, mã hồ sơ là UUID và giữ nguyên, Xóa hết cấp mã mới
{
  const m = new Map<string, string>();
  const kho: KhoAI = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); }, removeItem: (k) => { m.delete(k); } };
  assert.equal(docCheDo(kho), "ai", "chưa có khóa thì là AI");
  m.set(KHOA_CHE_DO, "gi-do-la"); assert.equal(docCheDo(kho), "ai", "giá trị lạ là AI");
  const a = idHoSoAI(kho); assert.ok(laUuid(a)); assert.equal(idHoSoAI(kho), a, "giữ nguyên mã hồ sơ");
  m.set(KHOA_LUOT, JSON.stringify({ ngay: ngayVN(Date.now() - 86_400_000), con: 3, toiDa: 50 }));
  assert.equal(docLuot(kho), null, "số lượt của ngày khác không được tin");
  datLaiHoSoAI(kho);
  assert.equal(m.has(KHOA_ID_HO_SO), false); assert.equal(m.has(KHOA_CHE_DO), false); assert.equal(m.has(KHOA_LUOT), false);
  assert.notEqual(idHoSoAI(kho), a, "Xóa hết cấp mã mới");
}

// 3) Trần toàn hệ thống: đổi mã hồ sơ không lách được. 5 hồ sơ khác nhau, trần 3 lượt/ngày toàn hệ thống.
{
  const db = taoD1Test(); const { kv } = kvTest(); const dem = { n: 0 };
  const e: Env = { ...env(db, kv), AI_TONG_NGAY: "3" };
  const hoSo = ["21111111-1111-4111-8111-111111111111", "31111111-1111-4111-8111-111111111111", "41111111-1111-4111-8111-111111111111", "51111111-1111-4111-8111-111111111111", "61111111-1111-4111-8111-111111111111"];
  const rs: Response[] = [];
  for (let i = 0; i < hoSo.length; i++) {
    rs.push(await xuLy(yc({ ...themDinhDanh({ cauHoi: `Điểm chuẩn UIT đợt ${i} thế nào?`, duLieu: [sk] }, hoSo[i]) }, `198.51.101.${i}`), e, moHinh(dem)));
  }
  assert.deepEqual(rs.map((r) => r.status), [200, 200, 200, 429, 429], "3 lượt đầu được, sau đó 429 toàn hệ thống");
  assert.equal(((await rs[3].json()) as { loi: string }).loi, "het-luot-he-thong");
  assert.equal(dem.n, 3, "chỉ 3 lần gọi mô hình");
  assert.equal((await luotConLai(db, hoSo[3], 50)).con, 50, "hồ sơ bị từ chối không mất lượt cá nhân");
  assert.equal((await luotConLai(db, hoSo[0], 50)).con, 49, "hồ sơ được phục vụ bị trừ đúng một lượt");
}

// 4b) Trần theo IP: một IP đổi hoSoId liên tục vẫn bị chặn ở 40 lượt, IP khác không bị ảnh hưởng
{
  const db = taoD1Test(); const { kv } = kvTest(); const dem = { n: 0 };
  const e: Env = { ...env(db, kv), AI_IP_NGAY: "2" };
  const st: number[] = [];
  for (let i = 0; i < 4; i++) st.push((await xuLy(yc(themDinhDanh({ cauHoi: `Điểm chuẩn UIT lần ${i} ra sao?`, duLieu: [sk] }, crypto.randomUUID()), "192.0.2.1"), e, moHinh(dem))).status);
  assert.deepEqual(st, [200, 200, 429, 429], "UUID ngẫu nhiên không lách được trần IP");
  assert.equal(dem.n, 2);
  assert.equal((await xuLy(yc(themDinhDanh({ cauHoi: "Điểm chuẩn UIT IP khác?", duLieu: [sk] }, crypto.randomUUID()), "192.0.2.2"), e, moHinh(dem))).status, 200, "IP khác vẫn dùng được");
  const h = await xuLy(yc(themDinhDanh({ cauHoi: "Điểm chuẩn UIT lần nữa?", duLieu: [sk] }, crypto.randomUUID()), "192.0.2.1"), e, moHinh(dem));
  assert.equal(((await h.json()) as { loi: string }).loi, "het-luot-ip");
}

// 9) Client: 422 và 429 chung không bị gộp thành "lỗi mạng"
{
  const s = TRANG_THAI_BAN_DAU;
  const hoi = (status: number, body: object) => layTinTraLoi({ cau: CAU_MO, truoc: [], s, nguon: null, dungHoSo: false, manHinh: "Tư vấn chung", phien: { cheDo: "ai", idHoSo: HO, luot: { con: 50, toiDa: 50 }, fetch: (async () => ({ ok: false, status, json: async () => body })) as unknown as typeof fetch } });
  const a = await hoi(422, { loi: "so-lieu-khong-khop" });
  assert.equal(a.thuLai, undefined, "422 không phải lỗi mạng"); assert.ok(a.chu.includes("chưa khớp dữ liệu") || a.ghiChu?.includes("chưa khớp dữ liệu"), a.chu);
  const b = await hoi(429, { loi: "het-luot-he-thong" });
  assert.equal(b.thuLai, undefined, "429 chung không phải lỗi mạng"); assert.ok((b.ghiChu ?? b.chu).includes("hết lượt hỏi AI"));
  const c = await hoi(502, { loi: "Dịch vụ tư vấn đang bận" });
  assert.equal(c.ghiChu, undefined);
}

console.log("tu-van-han-muc: tất cả kiểm tra đều qua");
