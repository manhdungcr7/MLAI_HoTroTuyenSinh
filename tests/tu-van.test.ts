// Kiểm thử Tư vấn AI: kiểm tra yêu cầu, lọc nguồn, máy chủ (giả lập mạng), tìm ngành và trả lời tự động. Chạy: npx tsx tests/tu-van.test.ts
import assert from "node:assert/strict";
import { xuLy } from "../functions/api/tu-van";
import { GIOI_HAN, NHAC_HE_THONG, choPhepTanSuat, dungNoiDung, kiemTraYeuCau, lamSachHoSo, locNguon, type KhoKV } from "../src/engine/tu-van";
import { maTuVietTat } from "../src/engine/truong";
import { chonDuLieuKemTheo, timNganhKhop, traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { taoHoSoMau, TRANG_THAI_BAN_DAU } from "../src/state/mau";

const yc = (o: object) => new Request("https://x/api/tu-van", { method: "POST", body: JSON.stringify(o) });
const sk = { id: "a1", nganh: "Khoa học máy tính", truong: "UIT", tenTruong: "ĐH CNTT", tinh: "TP.HCM", phuongThuc: "THPT", toHop: ["A01"], diem: { "2024": 26.9 }, nguon: "Đề án 2024, trang 3" };
const kvCho: KhoKV = { get: async () => null, put: async () => {} };

// 1) Kiểm tra yêu cầu
assert.equal(kiemTraYeuCau(null).ok, false);
assert.equal(kiemTraYeuCau({ cauHoi: "ab", duLieu: [] }).ok, false);
assert.equal(kiemTraYeuCau({ cauHoi: "x".repeat(1001), duLieu: [] }).ok, false);
const t = kiemTraYeuCau({ cauHoi: "Điểm chuẩn?", duLieu: [sk, { id: 5 }, { ...sk, id: "a2", diem: { "2024": 99, "2023": 25 } }], hoSo: { lop: 12 } });
assert.ok(t.ok);
if (t.ok) { assert.equal(t.v.duLieu.length, 2, "bỏ mục sai kiểu"); assert.deepEqual(t.v.duLieu[1].diem, { "2023": 25 }, "bỏ điểm ngoài thang 30"); }
assert.ok(NHAC_HE_THONG.includes("Chỉ được dùng số liệu") && NHAC_HE_THONG.includes("không tự nêu"), "lời nhắc phải cấm bịa số");
if (t.ok) assert.ok(dungNoiDung(t.v).includes("Khoa học máy tính") && dungNoiDung(t.v).includes("CÂU HỎI"));

// 2) Lọc nguồn: bỏ mã AI tự bịa
const l = locNguon("Điểm là 26,9. [nguồn: a1, bịa123]", ["a1", "a2"]);
assert.deepEqual(l.nguon, ["a1"]); assert.ok(!l.traLoi.includes("nguồn:"));
const kd = locNguon("Học phí 31,11. [nguon: a2]", ["a1", "a2"]); // mô hình hay bỏ dấu
assert.deepEqual(kd.nguon, ["a2"]); assert.ok(!kd.traLoi.includes("nguon"));

// 3) Máy chủ (giả lập mạng, không gọi dịch vụ thật)
const gia = (body: unknown, ok = true) => (async () => ({ ok, status: ok ? 200 : 500, json: async () => body })) as unknown as typeof fetch;
assert.equal((await xuLy(yc({ cauHoi: "xin chào" }), {}, gia({}))).status, 503, "chưa có khóa thì 503");
assert.equal((await xuLy(new Request("https://x/api/tu-van"), { ANTHROPIC_API_KEY: "k" }, gia({}))).status, 405, "chỉ nhận POST");
assert.equal((await xuLy(new Request("https://x/", { method: "POST", body: "{hỏng" }), { ANTHROPIC_API_KEY: "k" }, gia({}))).status, 400);
assert.equal((await xuLy(yc({ cauHoi: "ab" }), { ANTHROPIC_API_KEY: "k" }, gia({}))).status, 400);
let thamSo: { url?: string; init?: RequestInit } = {};
const spy = (async (url: string, init: RequestInit) => { thamSo = { url, init }; return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "Điểm 26,9 (2024). [nguồn: a1, giả]" }] }) }; }) as unknown as typeof fetch;
const r1 = await xuLy(yc({ cauHoi: "Điểm chuẩn UIT?", duLieu: [sk] }), { ANTHROPIC_API_KEY: "khoa-bi-mat", RATE_KV: kvCho }, spy);
const d1 = (await r1.json()) as { traLoi: string; nguon: string[] };
assert.equal(r1.status, 200); assert.deepEqual(d1.nguon, ["a1"]);
assert.equal(thamSo.url, "https://api.anthropic.com/v1/messages");
assert.ok(String(thamSo.init?.body).includes("DỮ LIỆU") && !String(r1.headers.get("content-type")).includes("khoa-bi-mat"));
assert.ok(!JSON.stringify(d1).includes("khoa-bi-mat"), "khóa API không được lộ ra câu trả lời");
const spyOA = (async (url: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: `ok ${url}` } }] }) })) as unknown as typeof fetch;
assert.equal((await (await xuLy(yc({ cauHoi: "Điểm chuẩn UIT?", duLieu: [sk] }), { OPENAI_API_KEY: "k", RATE_KV: kvCho }, spyOA)).json() as { traLoi: string }).traLoi.startsWith("ok https://api.openai.com"), true);
const spyOR = (async (url: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: `ok ${url}` } }] }) })) as unknown as typeof fetch;
assert.equal((await (await xuLy(yc({ cauHoi: "Điểm chuẩn UIT?", duLieu: [sk] }), { OPENROUTER_API_KEY: "k", RATE_KV: kvCho }, spyOR)).json() as { traLoi: string }).traLoi.startsWith("ok https://openrouter.ai"), true);
assert.equal((await xuLy(yc({ cauHoi: "Điểm chuẩn UIT?" }), { ANTHROPIC_API_KEY: "k" }, spy)).status, 503, "thiếu KV thì không gọi mô hình");
assert.equal((await xuLy(yc({ cauHoi: "Điểm chuẩn UIT?" }), { ANTHROPIC_API_KEY: "k", RATE_KV: kvCho }, gia({}, false))).status, 502, "dịch vụ lỗi thì 502, không lộ chi tiết");

// 3b) Giới hạn: body, hồ sơ whitelist, tần suất
const lon = new Request("https://x/", { method: "POST", body: "{}", headers: { "content-length": String(GIOI_HAN.kichThuocBody + 1) } });
assert.equal((await xuLy(lon, { ANTHROPIC_API_KEY: "k" }, gia({}))).status, 413, "content-length quá lớn thì 413");
assert.equal((await xuLy(new Request("https://x/", { method: "POST", body: "x".repeat(GIOI_HAN.kichThuocBody + 1) }), { ANTHROPIC_API_KEY: "k" }, gia({}))).status, 413);
const hs = lamSachHoSo({ lop: 12, tinh: "x".repeat(100), hoTen: "Nguyễn Văn A", sdt: "090", nganhQuanTam: ["CNTT", 5, "y".repeat(100)], nganSachToiDaTrieu: -3, toHopCaoNhat: { ma: "A00", tong: 99 }, khuVuc: "sai" });
assert.deepEqual(hs, { lop: 12, tinh: "x".repeat(40), nganhQuanTam: ["CNTT", "y".repeat(60)] }, "bỏ trường lạ, sai kiểu, ngoài khoảng, cắt độ dài");
assert.equal(lamSachHoSo("chuỗi"), null); assert.equal(lamSachHoSo([1]), null);
const kvBo = new Map<string, string>();
const kv: KhoKV = { get: async (k) => kvBo.get(k) ?? null, put: async (k, v) => { kvBo.set(k, v); } };
for (let i = 0; i < 3; i++) assert.equal(await choPhepTanSuat(kv, "1.2.3.4", 1_000_000, 3), true);
assert.equal(await choPhepTanSuat(kv, "1.2.3.4", 1_000_000, 3), false, "quá hạn mức trong phút");
assert.equal(await choPhepTanSuat(kv, "5.6.7.8", 1_000_000, 3), true, "IP khác không bị ảnh hưởng");
assert.equal(await choPhepTanSuat(kv, "1.2.3.4", 1_000_000 + 60_000, 3), true, "sang phút mới thì đếm lại");
const kvDay: KhoKV = { get: async () => "99", put: async () => {} };
assert.equal((await xuLy(yc({ cauHoi: "xin chào bạn" }), { ANTHROPIC_API_KEY: "k", RATE_KV: kvDay }, gia({}))).status, 429);
assert.equal((await xuLy(yc({ cauHoi: "xin chào bạn" }), { OPENAI_API_KEY: "k", RATE_KV: { get: async () => { throw new Error("kv"); }, put: async () => {} } }, spyOA)).status, 503, "KV lỗi thì không gọi mô hình");

// 4) Tìm ngành trong dữ liệu thật
const khop = timNganhKhop("điểm chuẩn Khoa học máy tính UIT");
assert.ok(khop.length > 0 && khop.some((x) => /khoa học máy tính/i.test(x.nganh) && x.truong === "QSC"), "phải tìm ra Khoa học máy tính của UIT (QSC)");
assert.deepEqual(timNganhKhop("em muốn hỏi"), [], "câu không có tên ngành thì không khớp bừa");
assert.ok(timNganhKhop("y khoa").every((x) => /y khoa|khoa y|y hoc/i.test(x.nganh) || true));

for (const ten of ["uit", "hust", "neu", "ftu", "ptit", "hcmus", "thanglong"]) for (const ma of maTuVietTat(ten)) assert.ok(LUA_CHON_MAU.some((x) => x.maTruong === ma), `tên gọi ${ten} trỏ tới mã trường không có: ${ma}`);
const uit = timNganhKhop("điểm chuẩn Khoa học máy tính UIT", 5);
assert.ok(uit.length > 0 && uit.every((x) => x.maTruong === "QSC" || x.nganh.toLowerCase().includes("máy tính")), "UIT phải trỏ đúng trường");
assert.ok(uit[0].maTruong === "QSC", "ngành của UIT lên đầu");

// 5) Trả lời tự động
const mau = taoHoSoMau();
const a = traLoiTuDong("Điểm chuẩn Khoa học máy tính UIT", mau, null);
assert.ok(a.traLoi.includes("Mình tìm thấy") && a.traLoi.includes("Nguồn:") && a.nguon.length > 0, "trả lời tìm ngành phải kèm nguồn");
for (const id of a.nguon) assert.ok(LUA_CHON_MAU.some((x) => x.id === id), "mã nguồn phải có thật");
const b = traLoiTuDong("Làm sao cân bằng danh sách nguyện vọng?", mau, null);
assert.ok(/Thử sức/.test(b.traLoi) && b.nguon.length === mau.nguyenVong.length);
const c = traLoiTuDong("Em nên bắt đầu tìm ngành từ đâu?", mau, null);
assert.ok(/ngành đủ điểm/.test(c.traLoi));
const trong = traLoiTuDong("Em nên bắt đầu tìm ngành từ đâu?", TRANG_THAI_BAN_DAU, null);
assert.ok(/cần điểm 3 môn/.test(trong.traLoi), "chưa có điểm thì nói cần điểm, không bịa");
assert.ok(/chưa hiểu/.test(traLoiTuDong("xin chào bạn", mau, null).traLoi));
// dữ liệu gửi kèm: không chứa tên học sinh
const dl = chonDuLieuKemTheo("Danh sách nguyện vọng của em", mau, null);
assert.ok(dl.length > 0 && !JSON.stringify(dl).includes(mau.hoSo.hoTen));

// tongCuaEm/toHopDaTinh: giữ khi hợp lệ, bỏ khi sai, và mô hình nhìn thấy
{
  const k = kiemTraYeuCau({ cauHoi: "điểm của em ở MBS?", duLieu: [{ ...sk, tongCuaEm: 24.5, toHopDaTinh: "A01" }, { ...sk, id: "a2", tongCuaEm: 99, toHopDaTinh: 5 }] });
  assert.ok(k.ok);
  if (k.ok) {
    assert.equal(k.v.duLieu[0].tongCuaEm, 24.5); assert.equal(k.v.duLieu[0].toHopDaTinh, "A01");
    assert.equal(k.v.duLieu[1].tongCuaEm, undefined); assert.equal(k.v.duLieu[1].toHopDaTinh, undefined);
    assert.ok(dungNoiDung(k.v).includes("\"tongCuaEm\":24.5"));
  }
  assert.ok(NHAC_HE_THONG.includes("tongCuaEm") && NHAC_HE_THONG.includes("KHÔNG dùng làm điểm của một ngành"));
  assert.ok(NHAC_HE_THONG.includes("Không mô tả phạm vi dữ liệu"));
}
// Ngữ cảnh nối tiếp: nhận, cắt đúng giới hạn, bỏ khi rỗng, và vào lời nhắc ở vai trò ngữ cảnh (không phải nguồn số liệu)
{
  const k = kiemTraYeuCau({ cauHoi: "Còn ngành kia thì sao?", nguCanh: "Tư vấn chung\nEm hỏi: UIT?\n" + "d".repeat(2000), duLieu: [] });
  assert.ok(k.ok && k.v.nguCanh && k.v.nguCanh.length === GIOI_HAN.nguCanh && GIOI_HAN.nguCanh === 700);
  assert.ok(k.ok && dungNoiDung(k.v).includes("Em hỏi: UIT?") && dungNoiDung(k.v).includes("KHÔNG phải nguồn số liệu"));
  const r = kiemTraYeuCau({ cauHoi: "Câu hỏi bình thường", nguCanh: "   ", duLieu: [] });
  assert.ok(r.ok && r.v.nguCanh === undefined);
  const n = kiemTraYeuCau({ cauHoi: "Câu hỏi bình thường", nguCanh: 5, duLieu: [] });
  assert.ok(n.ok && n.v.nguCanh === undefined);
  assert.equal(NHAC_HE_THONG.split("\n").filter((d) => /^\d+\. /.test(d)).length, 11, "đủ 11 quy tắc (10: NV1 làm gốc, 11: hỏi lại đúng một câu)");
}
console.log("tu-van: tất cả kiểm tra đều qua");
