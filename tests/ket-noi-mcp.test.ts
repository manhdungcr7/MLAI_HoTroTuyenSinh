// Kiểm thử kết nối Claude/ChatGPT: mã ghép nối, bản chụp, MCP (JSON-RPC), công cụ, đề xuất, GPT Actions, giới hạn tần suất.
// D1 là SQLite thật (migration 0009). Chạy: npx tsx tests/ket-noi-mcp.test.ts
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { taoD1KetNoiTest, type D1KetNoiTest } from "./nap-d1-ket-noi";
import { kvTest } from "./nap-d1-han-muc";
import { laMa, type EnvKetNoi } from "../functions/_thu-vien/ket-noi";
import { TOI_DA_TAO_MOI_GIO, xuLyTao } from "../functions/api/ket-noi/tao";
import { xuLyDongBo } from "../functions/api/ket-noi/dong-bo";
import { xuLyTrangThai } from "../functions/api/ket-noi/trang-thai";
import { xuLyXoa } from "../functions/api/ket-noi/index";
import { xuLyDanhSach } from "../functions/api/ket-noi/de-xuat/index";
import { xuLyQuyetDinh } from "../functions/api/ket-noi/de-xuat/[id]";
import { xuLyMcp } from "../functions/mcp/[ma]";
import { taoOpenApi } from "../functions/_thu-vien/ket-noi-openapi";
import { onRequestGet as hoSoGpt } from "../functions/api/gpt/[ma]/ho-so";
import { onRequestGet as diemChuanGpt } from "../functions/api/gpt/[ma]/diem-chuan";
import { onRequestGet as lichGpt } from "../functions/api/gpt/[ma]/lich.ics";
import { onRequestPost as themGpt } from "../functions/api/gpt/[ma]/de-xuat/them-nguyen-vong";
import { onRequestGet as nguyenVongGpt } from "../functions/api/gpt/[ma]/nguyen-vong";
import { onRequestGet as goiYGpt } from "../functions/api/gpt/[ma]/goi-y";
import { onRequestGet as keHoachGpt } from "../functions/api/gpt/[ma]/ke-hoach-tuan";
import { CONG_CU } from "../functions/_thu-vien/ket-noi-cong-cu";

const ORIGIN = "https://app.test";
const PHUT = 60_000;

/** Bản chụp mẫu đúng hình dạng (qua lamSachBanChup). 12 gợi ý để kiểm tra giới hạn 10 đề xuất chờ. */
function banMau(tinh = "TP.HCM", capNhat = "2026-10-16T08:00:00.000Z"): Record<string, unknown> {
  const goiY = Array.from({ length: 12 }, (_, i) => ({ id: `g${i + 1}`, nganh: `Ngành ${i + 1}`, truong: "Trường Thử", maTruong: "TST", diemChuan: 20 + i / 10, namDiem: 2025 }));
  return {
    phienBan: 1, capNhat,
    hoSo: { lop: 12, tinh, nganhQuanTam: ["Công nghệ thông tin"], nganSachToiDaTrieu: 30, khuVuc: ["KV2"], toHopCaoNhat: { ma: "A01", tong: 25.5 } },
    mucTieu: { nganh: "Khoa học máy tính", truong: "UIT", diemCan: 26, conThieu: 0.5 },
    diemThi: [{ ngay: "2026-10-01", tong: 24.5, toHop: "A01" }],
    nguyenVong: [
      { thuTu: 1, id: "uit-cntt", nganh: "Khoa học máy tính", truong: "Đại học CNTT", maTruong: "QSB", diemChuan: { "2025": 26.2, "2024": 25.9 }, nhan: "Vừa sức", chenh: -1.7, hocPhiTrieu: 25, nguon: "Đề án 2025, trang 4" },
      { thuTu: 2, id: "neu-ktdn", nganh: "Kinh tế", truong: "ĐH Kinh tế", maTruong: "KHA", nhan: "An toàn" },
    ],
    goiY,
    keHoachTuan: [{ tieuDe: "Ôn toán hàm số", batDau: "2026-10-19T19:00:00+07:00", ketThuc: "2026-10-19T20:00:00+07:00" }],
  };
}

interface Moi { db: D1KetNoiTest; kv: ReturnType<typeof kvTest>; env: EnvKetNoi }
function moiMoiTruong(): Moi {
  const db = taoD1KetNoiTest();
  const kv = kvTest();
  return { db, kv, env: { DB: db, RATE_KV: kv.kv } };
}

const req = (url: string, o: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) =>
  new Request(url, {
    method: o.method ?? "GET",
    headers: { ...(o.body !== undefined ? { "content-type": "application/json" } : {}), ...(o.headers ?? {}) },
    body: o.body !== undefined ? (typeof o.body === "string" ? o.body : JSON.stringify(o.body)) : undefined,
  });

async function taoMa(m: Moi, ban: Record<string, unknown> = banMau()): Promise<string> {
  const r = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: ban } }), m.env);
  assert.equal(r.status, 201);
  return (await r.json() as { ma: string }).ma;
}

const hdr = (ma: string) => ({ "x-ket-noi": ma });

async function mcp(m: Moi, ma: string, body: unknown, env: EnvKetNoi = m.env): Promise<{ status: number; json: any; headers: Headers }> {
  const r = await xuLyMcp(req(`${ORIGIN}/mcp/${ma}`, { method: "POST", body }), env, ma);
  const text = await r.text();
  return { status: r.status, json: text ? JSON.parse(text) : null, headers: r.headers };
}

/** Gọi một công cụ và trả { isError, data } (data là JSON đã parse của nội dung text). */
async function congCu(m: Moi, ma: string, ten: string, args: Record<string, unknown> = {}) {
  const r = await mcp(m, ma, { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: ten, arguments: args } });
  assert.equal(r.status, 200, `${ten}: HTTP ${r.status}`);
  const kq = r.json.result as { content: { type: string; text: string }[]; isError?: boolean };
  const text = kq.content[0].text;
  let data: any = text;
  try { data = JSON.parse(text); } catch { /* lời nhắn lỗi là chữ thường */ }
  return { isError: kq.isError === true, data };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function main() {
  // 1) Tạo kết nối: 201, mã 32 hex, URL tuyệt đối, chỉ lưu băm
  const m = moiMoiTruong();
  const r1 = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: banMau() } }), m.env);
  assert.equal(r1.status, 201);
  const t1 = await r1.json() as { ma: string; mcpUrl: string; actionsUrl: string; hetHan: string };
  assert.match(t1.ma, /^[a-f0-9]{32}$/);
  assert.equal(t1.mcpUrl, `${ORIGIN}/mcp/${t1.ma}`);
  assert.equal(t1.actionsUrl, `${ORIGIN}/api/gpt/${t1.ma}`);
  const conHan = Date.parse(t1.hetHan) - Date.now();
  assert.ok(conHan > 29 * 86_400_000 && conHan <= 30 * 86_400_000 + PHUT, "hết hạn khoảng 30 ngày");
  const dongKetNoi = m.db.db.prepare("SELECT ma_bam, ban_chup, cap_nhat FROM ket_noi_ai").all() as { ma_bam: string; ban_chup: string; cap_nhat: string }[];
  assert.equal(dongKetNoi.length, 1);
  assert.equal(dongKetNoi[0].ma_bam, sha256(t1.ma), "server chỉ lưu SHA-256 của mã");
  assert.equal(JSON.stringify(dongKetNoi).includes(t1.ma), false, "mã thô không xuất hiện trong D1");
  assert.equal(dongKetNoi[0].cap_nhat, "2026-10-16T08:00:00.000Z");

  // 2) Tạo với dữ liệu sai hoặc quá lớn: 400
  const sai = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: { phienBan: 2 } } }), m.env);
  assert.equal(sai.status, 400);
  const lon = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: banMau(), dem: "x".repeat(70_000) } }), m.env);
  assert.equal(lon.status, 400, "thân trên 64.000 byte bị từ chối");
  const khongJson = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: "{không phải json" }), m.env);
  assert.equal(khongJson.status, 400);
  const khongDb = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: banMau() } }), { RATE_KV: m.kv.kv });
  assert.equal(khongDb.status, 503, "thiếu DB thì 503");

  // 3) Mã sai, không tồn tại, hết hạn và đã thu hồi: cùng một thông điệp
  const ma = t1.ma;
  const khongCo = "0".repeat(32);
  const a = await mcp(m, "zz-khong-hop-le", { jsonrpc: "2.0", id: 1, method: "ping" });
  const b = await mcp(m, khongCo, { jsonrpc: "2.0", id: 1, method: "ping" });
  assert.equal(a.status, 404);
  assert.equal(b.status, 404);
  assert.equal(a.json.error.message, b.json.error.message, "không tiết lộ mã có tồn tại hay không");
  const ketQuaDong = await xuLyTrangThai(req(`${ORIGIN}/api/ket-noi/trang-thai`, { headers: hdr(ma) }), m.env);
  assert.equal(ketQuaDong.status, 200);
  const trangThai = await ketQuaDong.json() as { bat: boolean; soTruyCap: number; lanCuoi: string | null; hetHan: string };
  assert.equal(trangThai.bat, true);
  assert.equal(trangThai.soTruyCap, 0, "truy cập đầu tiên: trạng thái tính trước lượt này");
  assert.equal(trangThai.lanCuoi, null);
  assert.equal(trangThai.hetHan, t1.hetHan);
  assert.equal((await xuLyTrangThai(req(`${ORIGIN}/api/ket-noi/trang-thai`, { headers: hdr(ma) }), m.env).then((x) => x.json()) as { soTruyCap: number }).soTruyCap, 1, "mỗi truy cập được ghi");

  // 4) Đồng bộ bản chụp: đổi cập nhật, bản cũ bị thay
  const r4 = await xuLyDongBo(req(`${ORIGIN}/api/ket-noi/dong-bo`, { method: "PUT", headers: hdr(ma), body: { banChup: banMau("Hà Nội", "2026-10-17T09:00:00.000Z") } }), m.env);
  assert.equal(r4.status, 200);
  assert.deepEqual(await r4.json(), { ok: true, capNhat: "2026-10-17T09:00:00.000Z" });
  const capMoi = await congCu(m, ma, "lay_ho_so");
  assert.equal((capMoi.data as { hoSo: { tinh: string } }).hoSo.tinh, "Hà Nội");
  assert.equal((await xuLyDongBo(req(`${ORIGIN}/api/ket-noi/dong-bo`, { method: "PUT", body: { banChup: banMau() } }), m.env)).status, 404, "thiếu header mã");

  // 5) Cô lập: mã B không đọc được gì của mã A
  const maB = await taoMa(m, banMau("Đà Nẵng"));
  const hoSoB = await congCu(m, maB, "lay_ho_so");
  assert.equal((hoSoB.data as { hoSo: { tinh: string } }).hoSo.tinh, "Đà Nẵng");
  const hoSoA = await congCu(m, ma, "lay_ho_so");
  assert.equal((hoSoA.data as { hoSo: { tinh: string } }).hoSo.tinh, "Hà Nội");
  const deXuatA = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "g1" });
  assert.equal(deXuatA.isError, false);
  const danhSachB = await xuLyDanhSach(req(`${ORIGIN}/api/ket-noi/de-xuat`, { headers: hdr(maB) }), m.env);
  assert.deepEqual(await danhSachB.json(), { deXuat: [] }, "đề xuất của A không lộ sang B");

  // 6) MCP: initialize, thông báo, ping, tools/list (bộ đếm tần suất được xóa giữa các phần để không phụ thuộc đồng hồ)
  m.kv.m.clear();
  const init = await mcp(m, ma, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
  assert.equal(init.json.result.protocolVersion, "2025-06-18");
  assert.deepEqual(init.json.result.capabilities, { tools: {} });
  assert.deepEqual(init.json.result.serverInfo, { name: "nguyen-vong-ai", version: "1.1.0" });
  const initLa = await mcp(m, ma, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } });
  assert.equal(initLa.json.result.protocolVersion, "2025-03-26", "phiên bản lạ thì trả 2025-03-26");
  const thongBao = await mcp(m, ma, { jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(thongBao.status, 202);
  assert.equal(thongBao.json, null, "202 không có nội dung");
  const ping = await mcp(m, ma, { jsonrpc: "2.0", id: 2, method: "ping" });
  assert.deepEqual(ping.json.result, {});
  const dsCongCu = await mcp(m, ma, { jsonrpc: "2.0", id: 3, method: "tools/list" });
  const tenCongCu = (dsCongCu.json.result.tools as { name: string }[]).map((t) => t.name).sort();
  assert.deepEqual(tenCongCu, ["de_xuat_them_nguyen_vong", "diem_chuan", "goi_y_nganh", "ke_hoach_tuan", "lay_ho_so", "lay_nguyen_vong"]);
  assert.equal(CONG_CU.length, 6);
  const khongCongCu = await mcp(m, ma, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "xoa_tat_ca", arguments: {} } });
  assert.equal(khongCongCu.json.error.code, -32602);
  const pheDuoc = await mcp(m, ma, { jsonrpc: "2.0", id: 5, method: "resources/list" });
  assert.equal(pheDuoc.json.error.code, -32601);
  const gioi = await xuLyMcp(new Request(`${ORIGIN}/mcp/${ma}`, { method: "GET" }), m.env, ma);
  assert.equal(gioi.status, 405);
  const tuyChon = await xuLyMcp(new Request(`${ORIGIN}/mcp/${ma}`, { method: "OPTIONS" }), m.env, ma);
  assert.equal(tuyChon.status, 204);
  assert.equal(tuyChon.headers.get("access-control-allow-origin"), "*");
  assert.match(tuyChon.headers.get("access-control-allow-headers") ?? "", /mcp-protocol-version/);
  const jsonHong = await xuLyMcp(req(`${ORIGIN}/mcp/${ma}`, { method: "POST", body: "{hong" }), m.env, ma);
  assert.equal(jsonHong.status, 400);
  assert.equal((await jsonHong.json() as { error: { code: number } }).error.code, -32700);

  // 7) Công cụ đọc trả đúng dữ liệu
  const nv = await congCu(m, ma, "lay_nguyen_vong");
  assert.equal((nv.data as { nguyenVong: unknown[] }).nguyenVong.length, 2);
  assert.equal(typeof (nv.data as { capNhat: string }).capNhat, "string");
  const goi = await congCu(m, ma, "goi_y_nganh");
  assert.equal((goi.data as { goiY: unknown[] }).goiY.length, 12);
  const dc1 = await congCu(m, ma, "diem_chuan", { truyVan: "khoa hoc may tinh" });
  const ketQua1 = (dc1.data as { ketQua: { diemChuan: Record<string, number>; nguon: string }[] }).ketQua;
  assert.equal(ketQua1.length, 1);
  assert.deepEqual(ketQua1[0].diemChuan, { "2025": 26.2, "2024": 25.9 });
  assert.equal(ketQua1[0].nguon, "Đề án 2025, trang 4");
  const dc2 = await congCu(m, ma, "diem_chuan", { truyVan: "Ngành 3" });
  const ketQua2 = (dc2.data as { ketQua: { diemChuan: unknown }[] }).ketQua;
  assert.deepEqual(ketQua2[0].diemChuan, { "2025": 20.2 }, "gợi ý có điểm theo năm");
  const dc3 = await congCu(m, ma, "diem_chuan", { truyVan: "xyzabc" });
  assert.deepEqual((dc3.data as { ketQua: unknown[] }).ketQua, [], "không có thì nói chưa có, không bịa");
  assert.ok(typeof (dc3.data as { ghiChu?: string }).ghiChu === "string");
  const dcRong = await congCu(m, ma, "diem_chuan", { truyVan: "  " });
  assert.equal(dcRong.isError, true);
  const kh = await congCu(m, ma, "ke_hoach_tuan");
  const suKien = (kh.data as { suKien: { linkGoogleCalendar: string; icsUrl: string; tieuDe: string }[] }).suKien;
  assert.equal(suKien.length, 1);
  assert.match(suKien[0].linkGoogleCalendar, /^https:\/\/calendar\.google\.com\//);
  assert.equal(suKien[0].icsUrl, `${ORIGIN}/api/gpt/${ma}/lich.ics`);
  const jsonKq = await mcp(m, ma, { jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "lay_ho_so", arguments: {} } });
  assert.ok(JSON.stringify(jsonKq.json).length < 4000, "kết quả gọn");

  // 8) Đề xuất thêm nguyện vọng: id lạ bị từ chối, id hợp lệ tạo đề xuất chờ, không đổi bản chụp
  m.kv.m.clear();
  const banTruoc = (m.db.db.prepare("SELECT ban_chup FROM ket_noi_ai WHERE ma_bam = ?").get(sha256(ma)) as { ban_chup: string }).ban_chup;
  const laId = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "khong-co" });
  assert.equal(laId.isError, true);
  assert.match(String(laId.data), /goi_y_nganh/);
  const viTriSai = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "g2", viTri: 31 });
  assert.equal(viTriSai.isError, true);
  const de1 = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "g2", viTri: 2, tomTat: "Lời AI tự viết" });
  assert.equal(de1.isError, false);
  assert.equal(de1.data.trangThai, "cho");
  assert.equal(de1.data.loiNhan, "Đã gửi đề xuất, đang chờ bạn xác nhận trong app");
  const de1Lai = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "g2", viTri: 2 });
  assert.equal(de1Lai.data.deXuatId, de1.data.deXuatId, "gọi lại không nhân đôi");
  const banSau = (m.db.db.prepare("SELECT ban_chup FROM ket_noi_ai WHERE ma_bam = ?").get(sha256(ma)) as { ban_chup: string }).ban_chup;
  assert.equal(banSau, banTruoc, "đề xuất không đổi bản chụp");
  const dongDeXuat = m.db.db.prepare("SELECT tom_tat, loai, trang_thai FROM ket_noi_de_xuat WHERE id = ?").get(de1.data.deXuatId) as { tom_tat: string; loai: string; trang_thai: string };
  assert.match(dongDeXuat.tom_tat, /Ngành 2/, "tóm tắt do máy chủ dựng từ bản chụp");
  assert.equal(dongDeXuat.tom_tat.includes("Lời AI"), false, "không lấy văn bản của AI");
  assert.equal(dongDeXuat.loai, "them-nguyen-vong");
  assert.equal(dongDeXuat.trang_thai, "cho");

  // 9) Tối đa 10 đề xuất chờ: đã có g2 (1), thêm g1, g3..g10 (đủ 10), g11 bị chặn
  for (const id of ["g1", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10"]) {
    const kq = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: id });
    assert.equal(kq.isError, false, `đề xuất ${id}`);
  }
  const bi = await congCu(m, ma, "de_xuat_them_nguyen_vong", { idChuongTrinh: "g11" });
  assert.equal(bi.isError, true);
  assert.match(String(bi.data), /10 đề xuất/);

  // 10) Danh sách và quyết định của em
  m.kv.m.clear();
  const dsDeXuat = await xuLyDanhSach(req(`${ORIGIN}/api/ket-noi/de-xuat`, { headers: hdr(ma) }), m.env);
  const dsJson = await dsDeXuat.json() as { deXuat: { id: string; loai: string; tomTat: string; taoLuc: number }[] };
  assert.equal(dsJson.deXuat.length, 10);
  assert.equal(typeof dsJson.deXuat[0].taoLuc, "number");
  const idDauTien = dsJson.deXuat[0].id;
  const xacNhan = await xuLyQuyetDinh(req(`${ORIGIN}/api/ket-noi/de-xuat/${idDauTien}`, { method: "POST", headers: hdr(ma), body: { quyetDinh: "xac-nhan" } }), m.env, idDauTien);
  assert.equal(xacNhan.status, 200);
  assert.equal((await xuLyQuyetDinh(req(`${ORIGIN}/api/ket-noi/de-xuat/${idDauTien}`, { method: "POST", headers: hdr(ma), body: { quyetDinh: "xac-nhan" } }), m.env, idDauTien)).status, 404, "đã quyết định rồi");
  const idThuHai = dsJson.deXuat[1].id;
  assert.equal((await xuLyQuyetDinh(req(`${ORIGIN}/api/ket-noi/de-xuat/${idThuHai}`, { method: "POST", headers: hdr(ma), body: { quyetDinh: "sai" } }), m.env, idThuHai)).status, 400);
  assert.equal((await xuLyQuyetDinh(req(`${ORIGIN}/api/ket-noi/de-xuat/${idThuHai}`, { method: "POST", headers: hdr(ma), body: { quyetDinh: "tu-choi" } }), m.env, idThuHai)).status, 200);
  const trangDB = m.db.db.prepare("SELECT id, trang_thai FROM ket_noi_de_xuat WHERE id IN (?, ?) ORDER BY id").all(idDauTien, idThuHai) as { id: string; trang_thai: string }[];
  assert.deepEqual(trangDB.map((x) => x.trang_thai).sort(), ["tu-choi", "xac-nhan"]);
  const dsSauQuyet = await (await xuLyDanhSach(req(`${ORIGIN}/api/ket-noi/de-xuat`, { headers: hdr(ma) }), m.env)).json() as { deXuat: unknown[] };
  assert.equal(dsSauQuyet.deXuat.length, 8, "chỉ hiện đề xuất đang chờ");
  assert.equal((await xuLyQuyetDinh(req(`${ORIGIN}/api/ket-noi/de-xuat/abc`, { method: "POST", headers: hdr(ma), body: { quyetDinh: "xac-nhan" } }), m.env, "abc")).status, 400);

  // 11) Giới hạn tần suất: 60 yêu cầu/phút mỗi mã; KV lỗi hoặc thiếu thì từ chối. Cố định đồng hồ để không lệch phút.
  m.kv.m.clear();
  const thucDateNow = Date.now;
  const giaCo = thucDateNow();
  Date.now = () => giaCo;
  try {
    const maC = await taoMa(m);
    for (let i = 0; i < 60; i++) {
      const r = await mcp(m, maC, { jsonrpc: "2.0", id: i, method: "ping" });
      assert.equal(r.status, 200, `yêu cầu ${i + 1}`);
    }
    const quaGioi = await mcp(m, maC, { jsonrpc: "2.0", id: 99, method: "ping" });
    assert.equal(quaGioi.status, 429);
    const kvLoi: EnvKetNoi = { DB: m.db, RATE_KV: { get: async () => { throw new Error("kv hỏng"); }, put: async () => {} } };
    assert.equal((await mcp(m, maC, { jsonrpc: "2.0", id: 1, method: "ping" }, kvLoi)).status, 503, "KV lỗi thì fail-closed");
    assert.equal((await mcp(m, maC, { jsonrpc: "2.0", id: 1, method: "ping" }, { DB: m.db })).status, 503, "thiếu RATE_KV thì fail-closed");
  } finally {
    Date.now = thucDateNow;
  }

  // 12) GPT Actions: openapi.json, REST mỏng gọi đúng công cụ, lich.ics
  m.kv.m.clear();
  const spec = taoOpenApi(ORIGIN, maB) as { openapi: string; servers: { url: string }[]; paths: Record<string, Record<string, { operationId: string }>> };
  assert.equal(JSON.parse(JSON.stringify(spec)).openapi, "3.1.0", "JSON hợp lệ");
  assert.equal(spec.openapi, "3.1.0");
  assert.equal(spec.servers[0].url, `${ORIGIN}/api/gpt/${maB}`);
  const opIds = Object.values(spec.paths).flatMap((p) => Object.values(p).map((o) => o.operationId));
  assert.equal(new Set(opIds).size, opIds.length, "operationId không trùng");
  for (const id of ["layHoSo", "layNguyenVong", "layGoiYNganh", "traDiemChuan", "layKeHoachTuan", "layLichIcs", "themNguyenVongDeXuat"]) assert.ok(opIds.includes(id), id);
  assert.equal(laMa("xyz"), false, "mã sai định dạng bị loại ở route openapi.json");
  const gHoSo = await hoSoGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/ho-so`), env: m.env, params: { ma: maB } });
  assert.equal(((await gHoSo.json()) as { hoSo: { tinh: string } }).hoSo.tinh, "Đà Nẵng");
  const gNv = await nguyenVongGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/nguyen-vong`), env: m.env, params: { ma: maB } });
  assert.equal(((await gNv.json()) as { nguyenVong: unknown[] }).nguyenVong.length, 2);
  const gGoi = await goiYGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/goi-y`), env: m.env, params: { ma: maB } });
  assert.equal(((await gGoi.json()) as { goiY: unknown[] }).goiY.length, 12);
  const gDc = await diemChuanGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/diem-chuan?truyVan=khoa%20hoc%20may%20tinh`), env: m.env, params: { ma: maB } });
  assert.equal(((await gDc.json()) as { ketQua: unknown[] }).ketQua.length, 1, "mã B có cùng ngành trong bản chụp mẫu");
  const gKh = await keHoachGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/ke-hoach-tuan`), env: m.env, params: { ma: maB } });
  assert.equal(((await gKh.json()) as { suKien: unknown[] }).suKien.length, 1);
  const gLich = await lichGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/lich.ics`), env: m.env, params: { ma: maB } });
  assert.equal(gLich.headers.get("content-type"), "text/calendar; charset=utf-8");
  assert.ok((await gLich.text()).startsWith("BEGIN:VCALENDAR"));
  const gThem = await themGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/de-xuat/them-nguyen-vong`, { method: "POST", body: { idChuongTrinh: "g5", viTri: 1 } }), env: m.env, params: { ma: maB } });
  assert.equal(gThem.status, 200);
  assert.equal(((await gThem.json()) as { trangThai: string }).trangThai, "cho");
  const gThemLoi = await themGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/de-xuat/them-nguyen-vong`, { method: "POST", body: { idChuongTrinh: "la" } }), env: m.env, params: { ma: maB } });
  assert.equal(gThemLoi.status, 400);
  const gThemRac = await themGpt({ request: req(`${ORIGIN}/api/gpt/${maB}/de-xuat/them-nguyen-vong`, { method: "POST", body: "[]" }), env: m.env, params: { ma: maB } });
  assert.equal(gThemRac.status, 400);
  assert.equal((await hoSoGpt({ request: req(`${ORIGIN}/api/gpt/${khongCo}/ho-so`), env: m.env, params: { ma: khongCo } })).status, 404);

  // 13) Hết hạn: không đọc được; tạo kết nối mới dọn bản cũ
  m.db.db.prepare("UPDATE ket_noi_ai SET het_han = 1 WHERE ma_bam = ?").run(sha256(maB));
  assert.equal((await mcp(m, maB, { jsonrpc: "2.0", id: 1, method: "ping" })).status, 404);
  await taoMa(m);
  const conLai = (m.db.db.prepare("SELECT COUNT(*) AS n FROM ket_noi_ai WHERE ma_bam = ?").get(sha256(maB)) as { n: number }).n;
  assert.equal(conLai, 0, "bản hết hạn bị dọn");
  // mã hết hạn vẫn còn dấu vết đề xuất: cũng bị dọn cùng lúc
  assert.equal((m.db.db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat WHERE ma_bam = ?").get(sha256(maB)) as { n: number }).n, 0);

  // 14) Xóa sạch
  const xoa = await xuLyXoa(req(`${ORIGIN}/api/ket-noi`, { method: "DELETE", headers: hdr(ma) }), m.env);
  assert.deepEqual(await xoa.json(), { ok: true });
  assert.equal((m.db.db.prepare("SELECT COUNT(*) AS n FROM ket_noi_ai WHERE ma_bam = ?").get(sha256(ma)) as { n: number }).n, 0);
  assert.equal((m.db.db.prepare("SELECT COUNT(*) AS n FROM ket_noi_de_xuat WHERE ma_bam = ?").get(sha256(ma)) as { n: number }).n, 0);
  assert.equal((await mcp(m, ma, { jsonrpc: "2.0", id: 1, method: "ping" })).status, 404, "đã thu hồi");
  assert.equal((await xuLyTrangThai(req(`${ORIGIN}/api/ket-noi/trang-thai`, { headers: hdr(ma) }), m.env)).status, 404);

  // Giới hạn tạo mã theo IP: quá TOI_DA_TAO_MOI_GIO thì 429; IP khác vẫn tạo được; thiếu KV thì 503
  {
    const m = moiMoiTruong();
    const tao = (ip: string) => xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", headers: { "cf-connecting-ip": ip }, body: { banChup: banMau() } }), m.env);
    for (let i = 0; i < TOI_DA_TAO_MOI_GIO; i++) assert.equal((await tao("203.0.113.50")).status, 201);
    assert.equal((await tao("203.0.113.50")).status, 429, "quá giới hạn theo IP");
    assert.equal((await tao("203.0.113.51")).status, 201, "IP khác không bị ảnh hưởng");
    const khongKv = await xuLyTao(req(`${ORIGIN}/api/ket-noi/tao`, { method: "POST", body: { banChup: banMau() } }), { DB: m.db });
    assert.equal(khongKv.status, 503, "thiếu KV thì từ chối (fail-closed)");
  }
  console.log("ket-noi-mcp: tất cả kiểm tra đều qua");
}

main().catch((e) => { console.error(e); process.exit(1); });
