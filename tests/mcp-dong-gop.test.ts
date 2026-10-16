// Kiểm thử MCP đóng góp cho cộng tác viên (issue #10, mức 1.5): khóa kết nối, xác thực, phạm vi trường, hàng đợi duyệt, kiểm chất lượng, giới hạn tần suất, nhật ký.
// SQLite thật + mọi migration thật (tests/nap-d1-dong-gop.ts). Chạy: npx tsx tests/mcp-dong-gop.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import { xuLy as banGhi } from "../cms/functions/api/ban-ghi";
import { xuLy as mcp } from "../cms/functions/api/mcp-dong-gop";
import { THONG_BAO_KHOA_SAI } from "../cms/functions/_thu-vien/khoa-ket-noi";
import { maBanGhiDiemChuan } from "../cms/functions/_thu-vien/dong-gop-kiem";
import { entityIdDiemChuan } from "../cms/src/du-lieu-truong/chuong-trinh";
import { goiCongCu, goiKhoa, goiMcp, MoiTruong, taoMoiTruong, themQuanTri } from "./nap-d1-dong-gop";

const T0 = new Date("2026-10-16T03:00:00Z");
const luc = (phut = 0, ngay = 0) => new Date(T0.getTime() + phut * 60_000 + ngay * 86_400_000);

type ChuongTrinhJson = Record<string, [string, string, number | null, number | null, string][]>;
const CT = JSON.parse(fs.readFileSync("cms/src/du-lieu-truong/chuong-trinh-truong.json", "utf8")) as ChuongTrinhJson;
const P1 = CT.BKA[0][0];
const P2 = CT.BKA[1][0];
const NGUON = { loai: "de_an", url: "https://tuyensinh.bka.edu.vn/de-an-2025.pdf", trang: "12", trichDan: "CNTT: Khoa học Máy tính điểm chuẩn 2025 là 26,50 (THPT)" };

const dem = (m: MoiTruong, sql: string, ...gt: unknown[]) => (m.db.prepare(sql).get(...(gt as never[])) as { c: number }).c;
const hang = (m: MoiTruong, sql: string, ...gt: unknown[]) => m.db.prepare(sql).get(...(gt as never[])) as Record<string, unknown>;

function seedPublished(m: MoiTruong, entityId: string, data: Record<string, unknown>, version = 1) {
  const id = `pub-${entityId}-${version}`;
  m.db.prepare(`INSERT INTO ban_ghi_cms (id, entity_type, entity_id, version, status, data_json, source_url, source_title, source_publisher, source_verified_at,
      importance, change_note, created_by, created_at, updated_by, updated_at, published_by, published_at)
    VALUES (?, 'cutoff_score', ?, ?, 'PUBLISHED', ?, 'https://bka.edu.vn/seed', 'Đề án seed', 'ĐH Bách Khoa Hà Nội', '2026-10-01T00:00:00.000Z',
      'normal', 'seed', 'admin@test.local', '2026-10-01T00:00:00.000Z', 'admin@test.local', '2026-10-01T00:00:00.000Z', 'admin@test.local', '2026-10-01T00:00:00.000Z')`)
    .run(id, entityId, version, JSON.stringify(data));
  return id;
}

async function main() {
  const ok: string[] = [];
  const test = async (ten: string, f: () => Promise<void>) => { await f(); ok.push(ten); console.log(`✓ ${ten}`); };

  // ----- Dựng môi trường: sa, qtv, ctv (được giao BKA), một người không thuộc quan_tri -----
  const m = taoMoiTruong();
  themQuanTri(m, "sa@test.local", "sa");
  themQuanTri(m, "qtv@test.local", "qtv");
  themQuanTri(m, "ctv@test.local", "ctv");
  themQuanTri(m, "ctv2@test.local", "ctv");
  m.db.prepare("INSERT INTO phan_cong (email, ma_truong) VALUES ('ctv@test.local', 'BKA')").run();
  const HOC_SINH = "hocsinh@test.local";

  let KHOA_CTV = "";
  let KHOA_QTV = "";
  let IDKHOA_CTV = "";

  await test("Tạo khóa: dạng nvk_ + 40 hex, hiện một lần, tối đa 3 khóa mỗi người", async () => {
    const r1 = await goiKhoa(m, "POST", "ctv@test.local", { body: {}, bayGio: luc() });
    assert.equal(r1.status, 201);
    KHOA_CTV = String(r1.json!.khoa);
    IDKHOA_CTV = String(r1.json!.id);
    assert.match(KHOA_CTV, /^nvk_[0-9a-f]{40}$/);
    assert.equal(Date.parse(String(r1.json!.hetHan)) - luc().getTime(), 90 * 86_400_000, "mặc định 90 ngày");
    assert.equal((await goiKhoa(m, "POST", "ctv@test.local", { body: {}, bayGio: luc(1) })).status, 201);
    assert.equal((await goiKhoa(m, "POST", "ctv@test.local", { body: {}, bayGio: luc(2) })).status, 201);
    const bon = await goiKhoa(m, "POST", "ctv@test.local", { body: {}, bayGio: luc(3) });
    assert.equal(bon.status, 409, "khóa thứ 4 bị từ chối");
    const ds = await goiKhoa(m, "GET", "ctv@test.local", { bayGio: luc(4) });
    assert.equal((ds.json!.khoa as unknown[]).length, 3);
    assert.ok(!JSON.stringify(ds.json).includes(KHOA_CTV), "danh sách không lộ khóa gốc");
    // DB chỉ có băm
    const cot = JSON.stringify(m.db.prepare("SELECT * FROM khoa_api").all());
    assert.ok(!cot.includes(KHOA_CTV), "DB không chứa khóa gốc");
    const bam = String(hang(m, "SELECT bam_sha256 FROM khoa_api WHERE id = ?", IDKHOA_CTV).bam_sha256);
    assert.equal(bam.length, 64);
    assert.notEqual(bam, KHOA_CTV);
    // Nhật ký kiểm toán khi tạo
    assert.equal(dem(m, "SELECT COUNT(*) c FROM nhat_ky_kiem_toan WHERE action = 'KHOA_TAO' AND actor_email = 'ctv@test.local'"), 3);
  });

  await test("Học sinh hoặc người không thuộc quan_tri không tạo được khóa", async () => {
    assert.equal((await goiKhoa(m, "POST", HOC_SINH, { body: {}, bayGio: luc(5) })).status, 403);
    assert.equal((await goiKhoa(m, "GET", null, { bayGio: luc(5) })).status, 401, "không gửi danh tính giả thì không vào");
  });

  // Khóa qtv riêng để kiểm quyền
  await test("Khóa qtv: tạo bằng phiên của qtv", async () => {
    const r = await goiKhoa(m, "POST", "qtv@test.local", { body: { soNgay: 30 }, bayGio: luc(6) });
    assert.equal(r.status, 201);
    KHOA_QTV = String(r.json!.khoa);
    assert.equal(Date.parse(String(r.json!.hetHan)) - luc(6).getTime(), 30 * 86_400_000);
    assert.equal((await goiKhoa(m, "POST", "qtv@test.local", { body: { soNgay: 0 }, bayGio: luc(6) })).status, 400);
  });

  await test("Xác thực: thiếu, sai, sai định dạng đều 401 cùng một thông điệp", async () => {
    for (const khoa of [null, "nvk_" + "0".repeat(40), "nvk_abc", "Bearer x", KHOA_CTV.toUpperCase()]) {
      const r = await goiMcp(m, khoa, { jsonrpc: "2.0", id: 1, method: "ping" }, { bayGio: luc(7) });
      assert.equal(r.status, 401);
      assert.equal((r.json as { error: { message: string } }).error.message, THONG_BAO_KHOA_SAI);
    }
  });

  await test("Giao thức: initialize, thông báo 202, ping, tools/list, GET 405, OPTIONS, phương thức lạ", async () => {
    const init = await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }, { bayGio: luc(8) });
    const res = (init.json as { result: { protocolVersion: string; capabilities: unknown; serverInfo: { name: string } } }).result;
    assert.equal(res.protocolVersion, "2025-06-18");
    assert.ok(res.capabilities && res.serverInfo.name === "nguyenvong-dong-gop");
    const note = await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", method: "notifications/initialized" }, { bayGio: luc(8) });
    assert.equal(note.status, 202);
    const ping = await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", id: 2, method: "ping" }, { bayGio: luc(8) });
    assert.deepEqual((ping.json as { result: unknown }).result, {});
    const ds = await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", id: 3, method: "tools/list" }, { bayGio: luc(8) });
    const tools = (ds.json as { result: { tools: { name: string }[] } }).result.tools.map((t) => t.name).sort();
    assert.deepEqual(tools, ["de_xuat_diem_chuan", "trang_thai_dong_gop", "truong_cua_toi", "xem_du_lieu_truong"]);
    assert.equal((await goiMcp(m, null, null, { method: "GET" })).status, 405);
    const opt = await mcp({ request: new Request("http://localhost/api/mcp-dong-gop", { method: "OPTIONS" }), env: m.env });
    assert.equal(opt.status, 204);
    assert.equal(opt.headers.get("access-control-allow-origin"), "*");
    const la = await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", id: 4, method: "resources/list" }, { bayGio: luc(8) });
    assert.equal((la.json as { error: { code: number } }).error.code, -32601);
    const hong = await goiMcp(m, KHOA_CTV, "{ không phải json", { bayGio: luc(8), rawBody: "{ không phải json" });
    assert.equal(hong.status, 400);
  });

  await test("Công cụ đọc: truong_cua_toi và xem_du_lieu_truong, ngoài phạm vi thì isError", async () => {
    const t = await goiCongCu(m, KHOA_CTV, "truong_cua_toi", {}, luc(9));
    assert.equal(t.isError, false);
    assert.deepEqual(JSON.parse(t.text).truong.map((x: { maTruong: string }) => x.maTruong), ["BKA"]);
    const x = await goiCongCu(m, KHOA_CTV, "xem_du_lieu_truong", { maTruong: "BKA" }, luc(9));
    assert.equal(x.isError, false);
    const kq = JSON.parse(x.text);
    assert.equal(kq.nam, 2025, "mặc định năm trước");
    assert.equal(kq.diemChuan.chuaCo.soLuong, CT.BKA.length, "chưa có điểm chuẩn nào");
    assert.ok(kq.thieu.includes("diem_chuan_nam_2025"));
    assert.ok(x.text.length <= 3000);
    const qsc = await goiCongCu(m, KHOA_CTV, "xem_du_lieu_truong", { maTruong: "QSC" }, luc(9));
    assert.equal(qsc.isError, true);
    assert.match(qsc.text, /chưa được giao/);
    const sai = await goiCongCu(m, KHOA_CTV, "xem_du_lieu_truong", { maTruong: "ZZZ" }, luc(9));
    assert.equal(sai.isError, true);
  });

  // ----- Dữ liệu đã công bố sẵn để kiểm chênh lệch và "không đổi bản đã xuất bản" -----
  const maPub = maBanGhiDiemChuan("BKA", 2025, P1, "THPT", "A00");
  const idPub = seedPublished(m, maPub, { id: P1, tenNganh: CT.BKA[0][1], maTruong: "BKA", maNganh: "", nam: 2025, phuongThuc: "THPT", toHop: "A00", diemChuan: 20 });
  const truocPub = hang(m, "SELECT data_json, status, version FROM ban_ghi_cms WHERE id = ?", idPub);

  await test("Đề xuất: vào hàng chờ SUBMITTED, bản đã công bố không đổi, chênh > 4 điểm được gắn cờ", async () => {
    let n = 0;
    const taoId = () => `dx-${++n}`;
    const r = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", {
      maTruong: "BKA",
      hang: [
        { idChuongTrinh: P1, nam: 2025, diem: 29.5, toHop: "A00" },
        { idChuongTrinh: P2, nam: 2025, diem: 26.5, toHop: "A00" },
        { idChuongTrinh: "qsc-0000", nam: 2025, diem: 25, toHop: "A00" },
        { idChuongTrinh: P2, nam: 2010, diem: 25, toHop: "A00" },
        { idChuongTrinh: P2, nam: 2025, diem: 35, toHop: "A00" },
      ],
      nguon: NGUON,
    }, luc(10), taoId);
    assert.equal(r.isError, false, r.text);
    const kq = JSON.parse(r.text);
    assert.equal(kq.chapNhan, 2);
    assert.equal(kq.boQua.length, 3);
    const p1 = kq.daVaoHangChoDuyet.find((x: { idChuongTrinh: string }) => x.idChuongTrinh === P1);
    assert.equal(p1.chenhLon, true);
    assert.equal(p1.loai, "sua_ban_da_cong_bo");
    const p2 = kq.daVaoHangChoDuyet.find((x: { idChuongTrinh: string }) => x.idChuongTrinh === P2);
    assert.equal(p2.chenhLon, false);
    assert.equal(p2.loai, "moi");
    // Hàng đợi: đúng SUBMITTED, người gửi là khóa/email CTV
    const moi = hang(m, "SELECT * FROM ban_ghi_cms WHERE id = 'dx-2'");
    assert.equal(moi.status, "SUBMITTED");
    assert.equal(moi.submitted_by, "ctv@test.local");
    assert.ok(moi.submitted_at);
    assert.equal(moi.entity_id, maBanGhiDiemChuan("BKA", 2025, P2, "THPT", "A00"));
    // Bản đã công bố không đổi
    const sauPub = hang(m, "SELECT data_json, status, version FROM ban_ghi_cms WHERE id = ?", idPub);
    assert.deepEqual(sauPub, truocPub);
    // Bản sửa đổi nối vào bản đã công bố
    const sua = hang(m, "SELECT * FROM ban_ghi_cms WHERE id = 'dx-1'");
    assert.equal(sua.status, "SUBMITTED");
    assert.equal(sua.version, 2);
    assert.equal(sua.previous_version_id, idPub);
    // Dấu nhập qua AI, nội bộ, không nằm trong data_json (không đi vào bản chụp công khai)
    const dau = JSON.parse(String(sua.nhap_qua_ai));
    assert.equal(dau.via, "mcp");
    assert.equal(dau.nhapQuaAI, true);
    assert.equal(dau.chenhLon, true);
    assert.equal(dau.diemCu, 20);
    assert.equal(dau.nguon.trichDan, NGUON.trichDan);
    assert.ok(!String(sua.data_json).includes("trichDan"));
    assert.ok(!String(sua.data_json).includes("nhapQuaAI"));
  });

  await test("Idempotent: gửi lại đúng các hàng đó thì không tạo bản trùng", async () => {
    const before = dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms");
    const r = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", {
      maTruong: "BKA",
      hang: [{ idChuongTrinh: P1, nam: 2025, diem: 29.5, toHop: "A00" }, { idChuongTrinh: P2, nam: 2025, diem: 26.5, toHop: "A00" }],
      nguon: NGUON,
    }, luc(11), () => "trung-x");
    const kq = JSON.parse(r.text);
    assert.equal(kq.chapNhan, 0);
    assert.equal(kq.boQua.length, 2);
    assert.equal(dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms"), before);
  });

  await test("Từ chối: thiếu trichDan, url không http, quá 100 hàng, không gửi gì", async () => {
    const before = dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms");
    const thieuTrich = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: [{ idChuongTrinh: P2, nam: 2025, diem: 26 }], nguon: { loai: "de_an", url: NGUON.url, trang: "1" } }, luc(12));
    assert.equal(thieuTrich.isError, true);
    assert.match(thieuTrich.text, /trichDan/);
    const url = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: [{ idChuongTrinh: P2, nam: 2025, diem: 26 }], nguon: { ...NGUON, url: "ftp://bka.edu.vn/a" } }, luc(12));
    assert.equal(url.isError, true);
    const nhieu = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: Array.from({ length: 101 }, () => ({ idChuongTrinh: P2, nam: 2025, diem: 26 })), nguon: NGUON }, luc(12));
    assert.equal(nhieu.isError, true);
    assert.equal(dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms"), before);
  });

  await test("Hàng điểm ngoài thang bị từ chối, hàng đúng vẫn nhận; thang ĐGNL khác THPT", async () => {
    const r = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", {
      maTruong: "BKA",
      hang: [
        { idChuongTrinh: CT.BKA[2][0], nam: 2025, diem: 5, toHop: "A00" },
        { idChuongTrinh: CT.BKA[2][0], nam: 2025, diem: 27, toHop: "A00" },
        { idChuongTrinh: CT.BKA[3][0], nam: 2025, diem: 850, phuongThuc: "DGNL", toHop: "KHONG" },
      ],
      nguon: NGUON,
    }, luc(13), () => `hang-${Math.random()}`);
    assert.equal(r.isError, false);
    const kq = JSON.parse(r.text);
    assert.equal(kq.chapNhan, 2);
    assert.equal(kq.boQua.length, 1);
    assert.match(kq.boQua[0].lyDo, /ngoài thang/);
  });

  await test("Nguồn và dấu nhập qua AI hiện được trên API CMS (cùng đường dẫn /api/ban-ghi của quản trị)", async () => {
    const ds = await banGhi({ request: new Request("http://localhost/api/ban-ghi?status=SUBMITTED&truong=BKA&moi=50", { headers: { "x-gia-danh": "qtv@test.local" } }), env: m.env }, {});
    assert.equal(ds.status, 200);
    const body = (await ds.json()) as { items: { id: string; nhapQuaAI?: { via: string; nguon: { trichDan: string } }; status: string }[] };
    const co = body.items.find((x) => x.id === "dx-1");
    assert.ok(co, "bản đề xuất có trong hàng chờ");
    assert.equal(co!.nhapQuaAI!.via, "mcp");
    assert.equal(co!.nhapQuaAI!.nguon.trichDan, NGUON.trichDan);
    const daCong = await banGhi({ request: new Request(`http://localhost/api/ban-ghi?id=${idPub}`, { headers: { "x-gia-danh": "qtv@test.local" } }), env: m.env }, {});
    assert.equal(((await daCong.json()) as Record<string, unknown>).nhapQuaAI, undefined, "bản nhập tay không có dấu");
  });

  await test("Trạng thái đóng góp và nhật ký kiểm toán (không ghi trích dẫn dài)", async () => {
    const t = await goiCongCu(m, KHOA_CTV, "trang_thai_dong_gop", {}, luc(14));
    assert.equal(t.isError, false);
    const kq = JSON.parse(t.text);
    assert.ok(kq.dong.some((x: { trangThai: string; chenhLon?: boolean }) => x.trangThai === "cho_duyet" && x.chenhLon === true));
    assert.ok(t.text.length <= 3000);
    const nk = m.db.prepare("SELECT note FROM nhat_ky_kiem_toan WHERE action = 'MCP_DE_XUAT'").all() as { note: string }[];
    assert.ok(nk.length >= 3);
    assert.ok(nk.every((x) => x.note.includes("via=mcp") && x.note.includes("so_hang=")));
    assert.ok(nk.every((x) => !x.note.includes("CNTT:")), "không ghi trích dẫn");
  });

  await test("Phạm vi: CTV không ghi được trường không được giao, không có dòng nào được ghi", async () => {
    const before = dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms WHERE entity_id LIKE 'QSC%'");
    const r = await goiCongCu(m, KHOA_CTV, "de_xuat_diem_chuan", { maTruong: "QSC", hang: [{ idChuongTrinh: CT.BKA[0][0], nam: 2025, diem: 26 }], nguon: NGUON }, luc(15));
    assert.equal(r.isError, true);
    assert.match(r.text, /chưa được giao/);
    assert.equal(dem(m, "SELECT COUNT(*) c FROM ban_ghi_cms WHERE entity_id LIKE 'QSC%'"), before);
  });

  await test("Quyền qtv: nhận mọi trường; hạ vai xuống ctv thì mất quyền ngay; xóa khỏi quan_tri thì 401", async () => {
    themQuanTri(m, "qtv2@test.local", "qtv");
    const k = await goiKhoa(m, "POST", "qtv2@test.local", { body: { soNgay: 30 }, bayGio: luc(16) });
    const khoa2 = String(k.json!.khoa);
    const r = await goiCongCu(m, khoa2, "de_xuat_diem_chuan", { maTruong: "QSC", hang: [{ idChuongTrinh: "qsc-none", nam: 2025, diem: 26 }], nguon: NGUON }, luc(16));
    assert.equal(r.isError, false, "qtv không bị giới hạn trường; hàng sai id thì bị boQua");
    m.db.prepare("UPDATE quan_tri SET vai_tro = 'ctv' WHERE email = 'qtv2@test.local'").run();
    const hap = await goiCongCu(m, khoa2, "xem_du_lieu_truong", { maTruong: "QSC" }, luc(16));
    assert.equal(hap.isError, true, "vai bị hạ thì mất quyền trường ngoài phân công");
    m.db.prepare("DELETE FROM quan_tri WHERE email = 'qtv2@test.local'").run();
    assert.equal((await goiMcp(m, khoa2, { jsonrpc: "2.0", id: 1, method: "ping" }, { bayGio: luc(16) })).status, 401);
  });

  await test("Phải đổi mật khẩu tạm thì khóa không dùng được", async () => {
    const k = await goiKhoa(m, "POST", "ctv2@test.local", { body: {}, bayGio: luc(17) });
    assert.equal(k.status, 201);
    m.db.prepare("UPDATE quan_tri SET phai_doi_mat_khau = 1 WHERE email = 'ctv2@test.local'").run();
    assert.equal((await goiMcp(m, String(k.json!.khoa), { jsonrpc: "2.0", id: 1, method: "ping" }, { bayGio: luc(17) })).status, 401);
  });

  await test("Thu hồi có hiệu lực ngay; hết hạn thì 401; thu hồi lần hai là 404", async () => {
    const xoa = await goiKhoa(m, "DELETE", "ctv@test.local", { query: `?id=${IDKHOA_CTV}`, bayGio: luc(18) });
    assert.equal(xoa.status, 204);
    assert.equal((await goiMcp(m, KHOA_CTV, { jsonrpc: "2.0", id: 1, method: "ping" }, { bayGio: luc(18) })).status, 401);
    assert.equal((await goiKhoa(m, "DELETE", "ctv@test.local", { query: `?id=${IDKHOA_CTV}`, bayGio: luc(18) })).status, 404);
    const lucSau = luc(18, 91);
    assert.equal((await goiMcp(m, KHOA_QTV, { jsonrpc: "2.0", id: 1, method: "ping" }, { bayGio: lucSau })).status, 401, "khóa 30 ngày hết hạn");
    assert.equal(dem(m, "SELECT COUNT(*) c FROM nhat_ky_kiem_toan WHERE action = 'KHOA_THU_HOI'"), 1);
  });

  await test("Giới hạn tần suất: 60 hàng mỗi phút, 500 hàng mỗi ngày; KV hỏng thì từ chối (fail-closed)", async () => {
    const rac = (n: number) => Array.from({ length: n }, () => ({ idChuongTrinh: P2, nam: 2010, diem: 26 }));
    const qua = await goiCongCu(m, KHOA_QTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: rac(61), nguon: NGUON }, luc(20));
    assert.equal(qua.isError, true);
    assert.match(qua.text, /60 hàng/);
    for (let i = 0; i < 10; i++) {
      const r = await goiCongCu(m, KHOA_QTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: rac(50), nguon: NGUON }, luc(21 + i));
      assert.equal(r.isError, false, `lô ${i + 1}`);
    }
    const vuot = await goiCongCu(m, KHOA_QTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: rac(1), nguon: NGUON }, luc(40));
    assert.equal(vuot.isError, true);
    assert.match(vuot.text, /500 hàng/);
    m.kvHong.hong = true;
    const hong = await goiCongCu(m, KHOA_QTV, "de_xuat_diem_chuan", { maTruong: "BKA", hang: rac(1), nguon: NGUON }, luc(41, 1));
    assert.equal(hong.isError, true, "KV hỏng thì không ghi");
    m.kvHong.hong = false;
  });

  await test("Sau khi thu hồi một khóa, người này còn 2 khóa hiệu lực và tạo thêm được", async () => {
    const dsCtv = await goiKhoa(m, "GET", "ctv@test.local", { bayGio: luc(50) });
    const conHieuLuc = (dsCtv.json!.khoa as { conHieuLuc: boolean }[]).filter((k) => k.conHieuLuc).length;
    assert.equal(conHieuLuc, 2);
    assert.equal((await goiKhoa(m, "POST", "ctv@test.local", { body: {}, bayGio: luc(50) })).status, 201, "còn chỗ thì tạo được khóa mới");
  });

  // Khóa không bao giờ trả lại sau tạo: kiểm lần cuối
  await test("Khóa còn lại không xuất hiện trong nhật ký, không trả lại khi xem danh sách", async () => {
    const nk = JSON.stringify(m.db.prepare("SELECT * FROM nhat_ky_kiem_toan").all());
    assert.ok(!nk.includes(KHOA_CTV) && !nk.includes(KHOA_QTV));
    const ds = await goiKhoa(m, "GET", "qtv@test.local", { bayGio: luc(51) });
    assert.ok(!JSON.stringify(ds.json).includes(KHOA_QTV));
  });

  // Đối chiếu công thức mã bản ghi với CMS
  await test("Mã bản ghi điểm chuẩn khớp đúng công thức của CMS", async () => {
    for (const [ma, nam, id, pt, th] of [["BKA", 2025, P1, "THPT", "A00"], ["BKA", 2026, P2, "HOC_BA", "KHONG"], ["QSC", 2024, "qsc-x", "DGNL", "A01"]] as const) {
      assert.equal(maBanGhiDiemChuan(ma, nam, id, pt, th), entityIdDiemChuan(ma, nam, id, pt, th));
    }
  });

  console.log(`\n${ok.length} kiểm thử MCP đóng góp đạt.`);
}

main().catch((e) => {
  console.error("✗", e);
  process.exitCode = 1;
});
