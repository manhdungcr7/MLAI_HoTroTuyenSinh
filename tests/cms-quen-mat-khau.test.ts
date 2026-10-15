// Kiểm thử bảo mật xác thực, khôi phục mật khẩu (quên mật khẩu), giới hạn tần suất (brute-force), thu hồi phiên và phân quyền RBAC.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as dangNhap } from "../cms/functions/api/dang-nhap";
import { xuLy as doiMk } from "../cms/functions/api/doi-mat-khau";
import { xuLy as nguoi } from "../cms/functions/api/nguoi";
import { xuLy as quenMk, THONG_BAO_YEU_CAU } from "../cms/functions/api/quen-mat-khau";
import { xuLy as toi } from "../cms/functions/api/toi";
import { xuLy as xuatBan } from "../cms/functions/api/xuat-ban-snapshot";
import { damBaoBang, type DongDatLaiMatKhau } from "../cms/functions/_thu-vien/d1";
import type { BoiCanh, Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";
import { bamMatKhau, bamToken, taoTokenNgauNhien, xacMinhMatKhau } from "../cms/functions/_thu-vien/mat-khau";
import { xoaBoNhoGioiHan } from "../cms/functions/_thu-vien/xac-thuc";

const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) {
  db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
}
const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string) {}
  bind(...g: unknown[]) { this.gt = g; return this; }
  async first<T>() { return ((db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null); }
  async all<T>() { return { results: db.prepare(this.sql).all(...(this.gt as never[])) as T[] }; }
  async run() { return { meta: { changes: Number(db.prepare(this.sql).run(...(this.gt as never[])).changes) } }; }
}
const d1: KhoD1 = {
  prepare: (sql) => new Cau(sql),
  async batch(cau) {
    db.exec("BEGIN");
    try {
      const ra = cau.map((c) => {
        const x = c as Cau;
        return laDoc(x.sql)
          ? { results: db.prepare(x.sql).all(...(x.gt as never[])) }
          : { meta: { changes: Number(db.prepare(x.sql).run(...(x.gt as never[])).changes) } };
      });
      db.exec("COMMIT");
      return ra as never;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  },
};

const kvMap = new Map<string, string>();
const env: Env = {
  DB: d1,
  KV_CONG_DONG: {
    get: async (k) => kvMap.get(k) ?? null,
    put: async (k, v) => { kvMap.set(k, v); },
  },
  SESSION_SECRET: "bi-mat-kiem-thu-quen-mat-khau-0123456789",
  TELEGRAM_BOT_TOKEN: "bot-test-token",
  TELEGRAM_CHAT_ID: "chat-test-id",
};

const HOST = "https://cms.test";
let gio = Date.parse("2026-10-15T01:00:00Z");
const tatCaPhanHoi: string[] = [];
const tinTelegram: string[] = [];

interface Tuy { cookie?: string | null; body?: unknown; origin?: string | null; ip?: string; env?: Env }
const goi = async (h: unknown, method: string, url: string, t: Tuy = {}) => {
  gio += 1000;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cf-connecting-ip": t.ip ?? "10.0.0.1",
  };
  if (t.origin !== null) headers.origin = t.origin ?? HOST;
  if (t.cookie) headers.cookie = t.cookie;
  const xl = h as (c: BoiCanh, o: { bayGio: Date; fetch?: typeof fetch }) => Promise<Response>;
  const fakeFetch: typeof fetch = async (_input, init) => {
    if (init?.body) {
      try {
        const parsed = JSON.parse(String(init.body)) as { text?: string };
        if (parsed.text) tinTelegram.push(parsed.text);
      } catch { /* bỏ qua */ }
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const r = await xl(
    {
      request: new Request(`${HOST}${url}`, {
        method,
        headers,
        body: t.body === undefined ? undefined : JSON.stringify(t.body),
      }),
      env: t.env ?? env,
      params: {},
    },
    { bayGio: new Date(gio), fetch: fakeFetch }
  );
  const txt = await r.text();
  tatCaPhanHoi.push(txt);
  return { status: r.status, json: txt ? JSON.parse(txt) : null, setCookie: r.headers.get("set-cookie") };
};
const cookieCua = (sc: string | null) => sc!.split(";")[0];

// Khởi tạo bảng và tài khoản mẫu
await damBaoBang(d1);
const SA = "sa@cms.test";
const QTV = "qtv@cms.test";
const CTV = "ctv@cms.test";
const MK_BAN_DAU = "MatKhauBanDau#2026";

for (const [email, vaiTro] of [[SA, "sa"], [QTV, "qtv"], [CTV, "ctv"]] as const) {
  db.prepare(
    "INSERT INTO quan_tri (email, vai_tro, tao_luc, mat_khau, phai_doi_mat_khau, mat_khau_luc) VALUES (?, ?, ?, ?, 0, ?)"
  ).run(email, vaiTro, new Date(gio).toISOString(), await bamMatKhau(MK_BAN_DAU), new Date(gio).toISOString());
}

// 1. Hàm mật mã taoTokenNgauNhien & bamToken
{
  const t1 = taoTokenNgauNhien();
  const t2 = taoTokenNgauNhien();
  assert.match(t1, /^[0-9a-f]{64}$/, "Token 32 byte hex (64 ký tự)");
  assert.notEqual(t1, t2, "Mỗi lần sinh token khác nhau");
  const h1 = await bamToken(t1);
  assert.match(h1, /^[0-9a-f]{64}$/, "Bản băm SHA-256 hex 64 ký tự");
  assert.notEqual(h1, t1, "Bản băm khác hẳn mã gốc");
  assert.equal(await bamToken(`  ${t1}  `), h1, "Chuẩn hóa khoảng trắng khi băm");
}

// 2. Đăng nhập hợp lệ, không hợp lệ và chống dò vét (Brute-force Rate Limit cả khi không có KV)
{
  xoaBoNhoGioiHan();
  kvMap.clear();
  const envKhongKv: Env = { DB: d1, SESSION_SECRET: env.SESSION_SECRET };
  for (let i = 0; i < 5; i++) {
    const r = await goi(dangNhap, "POST", "/api/dang-nhap", {
      body: { email: QTV, matKhau: `sai-${i}` },
      ip: "203.0.113.5",
      env: envKhongKv,
    });
    assert.equal(r.status, 401);
  }
  const biChan = await goi(dangNhap, "POST", "/api/dang-nhap", {
    body: { email: QTV, matKhau: MK_BAN_DAU },
    ip: "203.0.113.5",
    env: envKhongKv,
  });
  assert.equal(biChan.status, 429, "Chặn lần thứ 6 bằng bộ nhớ ngay cả khi thiếu KV");

  // IP khác vẫn đăng nhập bình thường
  const dnOk = await goi(dangNhap, "POST", "/api/dang-nhap", {
    body: { email: QTV, matKhau: MK_BAN_DAU },
    ip: "203.0.113.6",
    env: envKhongKv,
  });
  assert.equal(dnOk.status, 200);
  assert.equal(dnOk.json.email, QTV);
}

// 3. Yêu cầu quên mật khẩu: phản hồi chung chống dò tài khoản, chỉ lưu token_hash vào DB
let tokenLayTuKenhGui = "";
{
  xoaBoNhoGioiHan();
  kvMap.clear();
  tinTelegram.length = 0;

  const rKhongCo = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "yeu_cau", email: "khong-ton-tai@cms.test" },
    ip: "198.51.100.10",
  });
  const rCo = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "yeu_cau", email: QTV.toUpperCase() },
    ip: "198.51.100.11",
  });

  assert.equal(rKhongCo.status, 200);
  assert.equal(rCo.status, 200);
  assert.deepEqual(rKhongCo.json, rCo.json, "Phản hồi cho email tồn tại và không tồn tại giống hệt nhau");
  assert.equal(rCo.json.thongBao, THONG_BAO_YEU_CAU);

  // Chỉ tài khoản thật mới sinh bản ghi trong dat_lai_mat_khau và gửi tin
  assert.equal(tinTelegram.length, 1);
  const m = tinTelegram[0].match(/Mã khôi phục \(15 phút\): <code>([0-9a-f]{64})<\/code>/);
  assert.ok(m, "Kênh thông báo nhận được mã khôi phục 64 hex");
  tokenLayTuKenhGui = m[1];

  // Kiểm tra tuyệt đối không lộ token trong HTTP response hay trong bảng D1 / nhật ký
  assert.ok(!JSON.stringify(rCo.json).includes(tokenLayTuKenhGui), "HTTP response không chứa token gốc");
  const dongDb = db.prepare("SELECT * FROM dat_lai_mat_khau WHERE email = ?").all(QTV) as unknown as DongDatLaiMatKhau[];
  assert.equal(dongDb.length, 1);
  assert.notEqual(dongDb[0].token_hash, tokenLayTuKenhGui, "DB không lưu plaintext token");
  assert.equal(dongDb[0].token_hash, await bamToken(tokenLayTuKenhGui), "DB lưu đúng SHA-256(token)");
  assert.equal(dongDb[0].da_dung, 0);

  const toanBoNhatKy = JSON.stringify(db.prepare("SELECT * FROM nhat_ky").all());
  assert.ok(toanBoNhatKy.includes("YEU_CAU_DAT_LAI_MAT_KHAU"), "Có ghi nhật ký yêu cầu đặt lại");
  assert.ok(!toanBoNhatKy.includes(tokenLayTuKenhGui), "Nhật ký không chứa token gốc");
}

// 4. Giới hạn tần suất trên API quên mật khẩu (chống spam yêu cầu khôi phục)
{
  for (let i = 0; i < 5; i++) {
    const r = await goi(quenMk, "POST", "/api/quen-mat-khau", {
      body: { hanhDong: "yeu_cau", email: CTV },
      ip: "198.51.100.77",
    });
    assert.equal(r.status, 200);
  }
  const rChan = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "yeu_cau", email: CTV },
    ip: "198.51.100.77",
  });
  assert.equal(rChan.status, 429, "Yêu cầu khôi phục quá 5 lần bị chặn 429");
}

// 5. Đặt lại mật khẩu thành công, vô hiệu hóa mọi phiên cũ và từ chối dùng lại mã (reused token)
{
  // Đăng nhập tạo 2 phiên đang hoạt động cho QTV trước khi đặt lại mật khẩu
  const phien1 = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: QTV, matKhau: MK_BAN_DAU }, ip: "10.1.1.1" })).setCookie);
  const phien2 = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: QTV, matKhau: MK_BAN_DAU }, ip: "10.1.1.2" })).setCookie);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: phien1 })).status, 200);
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: phien2 })).status, 200);

  // Kiểm tra từ chối mật khẩu quá ngắn (< 8 ký tự) hoặc quá dài (> 128 ký tự)
  assert.equal(
    (await goi(quenMk, "POST", "/api/quen-mat-khau", { body: { hanhDong: "dat_lai", token: tokenLayTuKenhGui, matKhauMoi: "1234567" } })).status,
    400,
    "Từ chối mật khẩu < 8 ký tự"
  );
  assert.equal(
    (await goi(quenMk, "POST", "/api/quen-mat-khau", { body: { hanhDong: "dat_lai", token: tokenLayTuKenhGui, matKhauMoi: "a".repeat(129) } })).status,
    400,
    "Từ chối mật khẩu > 128 ký tự"
  );

  const MK_MOI = "MatKhauMoiAnToan#2026";
  const datLaiOk = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "dat_lai", token: tokenLayTuKenhGui, matKhauMoi: MK_MOI },
  });
  assert.equal(datLaiOk.status, 200);
  assert.equal(datLaiOk.json.ok, true);

  // Cả 2 phiên cũ của QTV phải bị vô hiệu hóa ngay lập tức
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: phien1 })).status, 401, "Phiên 1 bị thu hồi sau khi đặt lại mật khẩu");
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: phien2 })).status, 401, "Phiên 2 bị thu hồi sau khi đặt lại mật khẩu");

  // Mật khẩu cũ không còn đăng nhập được, mật khẩu mới đăng nhập thành công
  assert.equal((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: QTV, matKhau: MK_BAN_DAU } })).status, 401);
  const dnMoi = await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: QTV, matKhau: MK_MOI } });
  assert.equal(dnMoi.status, 200);

  // Dùng lại chính mã khôi phục đó lần thứ 2 phải bị từ chối (reused token rejection)
  const dungLai = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "dat_lai", token: tokenLayTuKenhGui, matKhauMoi: "MatKhauKhacNua#2026" },
  });
  assert.equal(dungLai.status, 400, "Từ chối mã khôi phục đã sử dụng");
  assert.ok(await xacMinhMatKhau(MK_MOI, (db.prepare("SELECT mat_khau FROM quan_tri WHERE email = ?").get(QTV) as { mat_khau: string }).mat_khau));
}

// 6. Từ chối mã khôi phục đã hết hạn (expired reset token rejection)
{
  tinTelegram.length = 0;
  await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "yeu_cau", email: SA },
    ip: "198.51.100.20",
  });
  const tokenHetHan = tinTelegram[0].match(/Mã khôi phục \(15 phút\): <code>([0-9a-f]{64})<\/code>/)![1];

  // Tua đồng hồ quá 15 phút (16 phút)
  gio += 16 * 60 * 1000;
  const rHetHan = await goi(quenMk, "POST", "/api/quen-mat-khau", {
    body: { hanhDong: "dat_lai", token: tokenHetHan, matKhauMoi: "MatKhauSauKhiHetHan#1" },
    ip: "198.51.100.20",
  });
  assert.equal(rHetHan.status, 400, "Từ chối mã khôi phục đã quá 15 phút");
}

// 7. Đổi mật khẩu khi đang đăng nhập: thu hồi các phiên khác nhưng giữ phiên mới hiện tại
{
  const ckA = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: SA, matKhau: MK_BAN_DAU }, ip: "10.2.2.1" })).setCookie);
  const ckB = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: SA, matKhau: MK_BAN_DAU }, ip: "10.2.2.2" })).setCookie);

  const MK_SA_MOI = "MatKhauSaMoi#2026";
  const rDoi = await goi(doiMk, "POST", "/api/doi-mat-khau", {
    cookie: ckA,
    body: { matKhauCu: MK_BAN_DAU, matKhauMoi: MK_SA_MOI },
  });
  assert.equal(rDoi.status, 200);
  const ckAMoi = cookieCua(rDoi.setCookie);

  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckB })).status, 401, "Phiên khác (ckB) bị thu hồi ngay khi đổi mật khẩu");
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckA })).status, 401, "Cookie cũ (ckA) cũng hết hiệu lực");
  assert.equal((await goi(toi, "GET", "/api/toi", { cookie: ckAMoi })).status, 200, "Cookie mới cấp trong phản hồi đổi mật khẩu hoạt động tốt");
}

// 8. Kiểm tra chặn truy cập trái phép theo phân quyền (Unauthorized RBAC access attempts)
{
  const ckCtv = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: CTV, matKhau: MK_BAN_DAU }, ip: "10.3.3.1" })).setCookie);
  const ckQtv = cookieCua((await goi(dangNhap, "POST", "/api/dang-nhap", { body: { email: QTV, matKhau: "MatKhauMoiAnToan#2026" }, ip: "10.3.3.2" })).setCookie);

  // Chưa đăng nhập gọi API quản trị -> 401
  assert.equal((await goi(nguoi, "GET", "/api/nguoi", { cookie: null })).status, 401);
  // CTV gọi danh sách người dùng hoặc xuất bản snapshot -> 403
  assert.equal((await goi(nguoi, "GET", "/api/nguoi", { cookie: ckCtv })).status, 403);
  assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", { cookie: ckCtv, body: { action: "PUBLISH" } })).status, 403);
  // QTV tạo tài khoản SA hoặc gọi ROLLBACK của SA -> 403
  assert.equal((await goi(nguoi, "POST", "/api/nguoi", { cookie: ckQtv, body: { email: "sa-gia@cms.test", vaiTro: "sa" } })).status, 403);
  assert.equal((await goi(xuatBan, "POST", "/api/xuat-ban-snapshot", { cookie: ckQtv, body: { action: "ROLLBACK", targetVersion: "v1" } })).status, 403);
  // Gửi POST quên mật khẩu từ Origin lạ (CSRF) -> 403
  assert.equal(
    (await goi(quenMk, "POST", "/api/quen-mat-khau", { origin: "https://trang-la.evil", body: { hanhDong: "yeu_cau", email: SA } })).status,
    403
  );
}

console.log("OK cms-quen-mat-khau");
