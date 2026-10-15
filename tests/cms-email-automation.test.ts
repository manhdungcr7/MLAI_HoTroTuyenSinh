// Kiểm thử hệ thống Gửi Email Giao dịch (Phase 6) & Tự động hóa Quy trình vận hành (Phase 7).
// Dùng SQLite thật trong bộ nhớ (node:sqlite) + migrations thật:
// 1. 7 mẫu email tiếng Việt chuẩn responsive Light Mode (#0057e7, #f5f8ff), 1 nút hành động (CTA), không lộ mật khẩu/secret.
// 2. Chống gửi trùng (idempotencyKey): gọi 2 lần cùng khóa chỉ gọi provider 1 lần.
// 3. Thử lại lỗi tạm thời (5xx/mạng) kèm tính backoff cấp số nhân vs lỗi vĩnh viễn (4xx hard bounce / sai định dạng -> vào email_bi_chan, không thử lại).
// 4. Trạng thái trung thực khi chưa cấu hình khóa gửi email (SKIPPED_NO_PROVIDER, tuyệt đối không giả mạo DELIVERED).
// 5. Tự động hóa dọn dẹp hệ thống (don_dep_he_thong), xử lý webhook (webhook_trang_thai) và kiểm soát quyền RBAC (ctv bị từ chối 403).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  CAC_LOAI_MAU_EMAIL,
  guiEmailGiaoDich,
  kiemTraDiaChiEmail,
  taoMauEmail,
  tinhBackoffMs,
  type EnvEmail,
} from "../cms/functions/_thu-vien/email";
import type { KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";
import { xuLy as emailLogApi } from "../cms/functions/api/email-log";

// ---------- Khởi tạo D1 thật trong bộ nhớ ----------
const db = new DatabaseSync(":memory:");
for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) {
  db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
}

const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string) {}
  bind(...g: unknown[]) {
    this.gt = g;
    return this;
  }
  async first<T>() {
    return (db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null;
  }
  async all<T>() {
    return { results: db.prepare(this.sql).all(...(this.gt as never[])) as T[] };
  }
  async run() {
    const r = db.prepare(this.sql).run(...(this.gt as never[]));
    return { meta: { changes: Number(r.changes) } };
  }
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

db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES ('qtv@nguyenvong.ai', 'qtv', '2026-10-15T00:00:00.000Z')").run();
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES ('ctv@nguyenvong.ai', 'ctv', '2026-10-15T00:00:00.000Z')").run();

// ---------- 1. Kiểm thử 7 mẫu email tiếng Việt ----------
assert.equal(CAC_LOAI_MAU_EMAIL.length, 7, "Phải có đủ 7 loại mẫu email");

for (const loai of CAC_LOAI_MAU_EMAIL) {
  const mau = taoMauEmail(loai, {
    hoTen: "Nguyễn Văn An",
    urlHanhDong: "https://nguyenvong.ai/cms/xac-nhan?token=abc123xyz",
    maXacMinh: "849201",
    vaiTro: "Cộng tác viên",
    trangThaiTaiKhoan: "Đã kích hoạt",
    maDoiTuong: "BKA-ktx",
    loaiDoiTuong: "Nơi lưu trú",
    ketQuaDuyet: loai === "cap_nhat_ho_so_duyet" ? "REJECTED" : "APPROVED",
    nhanXetNguoiDuyet: "Cần bổ sung đường dẫn thông báo ký túc xá năm 2026",
    suKienQuanTri: "Xuất bản snapshot 2026.10.15.01",
    chiTietQuanTri: "Đã cập nhật 18 bản ghi mới lên hệ thống",
    thoiGian: "15/10/2026 08:30",
  });

  assert.ok(mau.tieuDe.startsWith("[Nguyện Vọng AI]"), `Tiêu đề mẫu ${loai} phải có thương hiệu rõ ràng`);
  assert.ok(mau.html.includes("#0057e7") && mau.html.includes("#f5f8ff"), `Mẫu ${loai} phải dùng màu thương hiệu Light Mode`);
  assert.ok(mau.html.includes('meta name="viewport"'), `Mẫu ${loai} phải hỗ trợ hiển thị di động (mobile-responsive)`);
  assert.ok(mau.vanBan.length > 40, `Mẫu ${loai} phải có bản chữ thuần (plain-text fallback)`);
  assert.equal((mau.html.match(/<a\s+href=/g) ?? []).length, 1, `Mẫu ${loai} chỉ được có đúng 1 nút hành động chính (CTA)`);
  assert.ok(!/RESEND_API_KEY|SESSION_SECRET|sha256\$/i.test(mau.html + mau.vanBan), `Mẫu ${loai} không được lộ khóa bí mật hay mật khẩu băm`);
}

const mauQuenMk = taoMauEmail("quen_mat_khau", { hoTen: "Trần Bình", urlHanhDong: "https://nguyenvong.ai/cms/dat-lai?t=1" });
assert.ok(mauQuenMk.tieuDe.includes("15 phút") && mauQuenMk.html.includes("15 phút"), "Mẫu quên mật khẩu phải cảnh báo hạn 15 phút");
assert.ok(mauQuenMk.html.includes("không bao giờ gửi mật khẩu"), "Mẫu quên mật khẩu phải khẳng định không gửi mật khẩu dạng chữ thuần");

// ---------- 2. Kiểm thử kiểm tra địa chỉ email & hàm tính backoff ----------
assert.equal(kiemTraDiaChiEmail("hocsinh@thpt.edu.vn").hopLe, true);
assert.equal(kiemTraDiaChiEmail("sai-dinh-dang").hopLe, false);
assert.equal(kiemTraDiaChiEmail("nguoi@domain.invalid").hopLe, false);
assert.equal(tinhBackoffMs(1), 2000);
assert.equal(tinhBackoffMs(2), 4000);
assert.equal(tinhBackoffMs(3), 8000);
assert.equal(tinhBackoffMs(20), 60_000, "Backoff có trần tối đa 60 giây");

// ---------- 3. Trạng thái trung thực khi chưa cấu hình khóa (SKIPPED_NO_PROVIDER) ----------
let demId = 0;
const taoTuyChon = (fetchGia?: typeof fetch) => ({
  bayGio: new Date(Date.parse("2026-10-15T02:00:00Z") + ++demId * 1000),
  taoId: () => `mail-${demId}`,
  fetch: fetchGia,
});

const envChuaCauHinh: EnvEmail = { DB: d1, GIA_DANH_DEV: "1" };
const kqChuaCauHinh = await guiEmailGiaoDich(
  d1,
  envChuaCauHinh,
  {
    idempotencyKey: "key-no-provider-1",
    loaiMau: "chao_mung",
    nguoiNhan: "sinhvien@hust.edu.vn",
    thamSo: { hoTen: "Lê Minh" },
  },
  taoTuyChon()
);
assert.equal(kqChuaCauHinh.trangThai, "SKIPPED_NO_PROVIDER", "Chưa cấu hình khóa phải trả SKIPPED_NO_PROVIDER, không bao giờ giả mạo DELIVERED");
assert.equal(kqChuaCauHinh.providerId, null);

// ---------- 4. Chống gửi trùng (Idempotency) & trạng thái PROVIDER_ACCEPTED ----------
let soLanGoiProvider = 0;
const envCoResend: EnvEmail = { DB: d1, GIA_DANH_DEV: "1", RESEND_API_KEY: "re_test_key_khong_lo" };
const fetchThanhCong: typeof fetch = async () => {
  soLanGoiProvider++;
  return new Response(JSON.stringify({ id: `resend-msg-${soLanGoiProvider}` }), { status: 200 });
};

const guiLan1 = await guiEmailGiaoDich(
  d1,
  envCoResend,
  {
    idempotencyKey: "idem-welcome-001",
    loaiMau: "xac_minh_email",
    nguoiNhan: "ctv.moi@vnu.edu.vn",
    thamSo: { hoTen: "Phạm Hương", maXacMinh: "112233" },
  },
  taoTuyChon(fetchThanhCong)
);
assert.equal(guiLan1.trangThai, "PROVIDER_ACCEPTED", "HTTP 200 từ API chỉ ghi PROVIDER_ACCEPTED cho tới khi có webhook");
assert.equal(guiLan1.providerId, "resend-msg-1");
assert.equal(soLanGoiProvider, 1);

const guiLan2TrungKhoa = await guiEmailGiaoDich(
  d1,
  envCoResend,
  {
    idempotencyKey: "idem-welcome-001",
    loaiMau: "xac_minh_email",
    nguoiNhan: "ctv.moi@vnu.edu.vn",
  },
  taoTuyChon(fetchThanhCong)
);
assert.equal(guiLan2TrungKhoa.id, guiLan1.id);
assert.equal(soLanGoiProvider, 1, "Gửi lại cùng idempotencyKey không được gọi lại nhà cung cấp");

// ---------- 5. Lỗi 4xx Hard Bounce -> FAILED_PERMANENT + đưa vào danh sách chặn (email_bi_chan) ----------
let soLanGoiBounce = 0;
const fetchHardBounce: typeof fetch = async () => {
  soLanGoiBounce++;
  return new Response("Address does not exist (hard bounce)", { status: 422 });
};

const kqBounce = await guiEmailGiaoDich(
  d1,
  envCoResend,
  {
    idempotencyKey: "idem-bounce-001",
    loaiMau: "thong_bao_tai_khoan",
    nguoiNhan: "khongtontai@truong.edu.vn",
  },
  taoTuyChon(fetchHardBounce)
);
assert.equal(kqBounce.trangThai, "FAILED_PERMANENT");
assert.equal(soLanGoiBounce, 1);

// Gửi một email mới tới cùng địa chỉ đã bị bounce cứng -> phải bị chặn ngay (SUPPRESSED_BOUNCE), không gọi provider
const kqBiChan = await guiEmailGiaoDich(
  d1,
  envCoResend,
  {
    idempotencyKey: "idem-bounce-002-new",
    loaiMau: "chao_mung",
    nguoiNhan: "khongtontai@truong.edu.vn",
  },
  taoTuyChon(fetchHardBounce)
);
assert.equal(kqBiChan.trangThai, "SUPPRESSED_BOUNCE", "Địa chỉ trong email_bi_chan phải bị chặn ngay lập tức");
assert.equal(soLanGoiBounce, 1, "Không được gọi mạng cho địa chỉ đã nằm trong danh sách chặn");

// ---------- 6. Lỗi tạm thời 5xx -> FAILED_TRANSIENT & thử lại tự động qua API ----------
let soLanGoiTamThoi = 0;
const fetchTamThoiRoiPhucHoi: typeof fetch = async () => {
  soLanGoiTamThoi++;
  if (soLanGoiTamThoi === 1) {
    return new Response("Upstream gateway timeout", { status: 503 });
  }
  return new Response(JSON.stringify({ id: "resend-recovered-99" }), { status: 200 });
};

const kqTamThoi = await guiEmailGiaoDich(
  d1,
  envCoResend,
  {
    idempotencyKey: "idem-transient-001",
    loaiMau: "cap_nhat_ho_so_duyet",
    nguoiNhan: "nguoiduyet@hcmut.edu.vn",
    thamSo: { maDoiTuong: "BKA-hoc-phi", ketQuaDuyet: "APPROVED" },
  },
  taoTuyChon(fetchTamThoiRoiPhucHoi)
);
assert.equal(kqTamThoi.trangThai, "FAILED_TRANSIENT");
assert.equal(kqTamThoi.soLanThu, 1);

// ---------- 7. Kiểm thử API /api/email-log: RBAC, Thống kê, Thử lại tự động, Webhook & Dọn dẹp hệ thống ----------
const goiApi = async (method: string, ai: string | null, body?: unknown, fetchGia?: typeof fetch) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ai) headers["x-gia-danh"] = ai;
  const r = await emailLogApi(
    {
      request: new Request("http://localhost/api/email-log", {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env: envCoResend,
      params: {},
    },
    taoTuyChon(fetchGia)
  );
  const text = await r.text();
  return { status: r.status, json: text ? JSON.parse(text) : null };
};

// RBAC: chưa đăng nhập -> 401; ctv -> 403; qtv -> 200
assert.equal((await goiApi("GET", null)).status, 401);
assert.equal((await goiApi("GET", "ctv@nguyenvong.ai")).status, 403, "Cộng tác viên (ctv) phải bị chặn 403 ở máy chủ");
assert.equal((await goiApi("POST", "ctv@nguyenvong.ai", { hanhDong: "don_dep_he_thong" })).status, 403);

const thongKeTruoc = await goiApi("GET", "qtv@nguyenvong.ai");
assert.equal(thongKeTruoc.status, 200);
assert.equal(thongKeTruoc.json.thongKe.tong, 5);
assert.equal(thongKeTruoc.json.thongKe.loiTamThoi, 1);
assert.equal(thongKeTruoc.json.thongKe.biChan, 1);
assert.equal(thongKeTruoc.json.thongKe.chuaCauHinh, 1);
assert.ok(thongKeTruoc.json.emailBiChan.some((x: { email: string }) => x.email === "khongtontai@truong.edu.vn"));

// Quy trình tự động 1: Thử lại email lỗi tạm thời (thu_lai_email_loi)
const thuLai = await goiApi("POST", "qtv@nguyenvong.ai", { hanhDong: "thu_lai_email_loi" }, fetchTamThoiRoiPhucHoi);
assert.equal(thuLai.status, 200);
assert.equal(thuLai.json.soLuongQuet, 1);
assert.equal(thuLai.json.thanhCong, 1);
assert.equal(thuLai.json.chiTiet[0].backoffMs, 2000);

// Quy trình tự động 2: Xử lý webhook trạng thái chuyển PROVIDER_ACCEPTED -> DELIVERED
const wh = await goiApi("POST", "qtv@nguyenvong.ai", {
  hanhDong: "webhook_trang_thai",
  providerId: "resend-msg-1",
  trangThaiSuKien: "delivered",
});
assert.equal(wh.status, 200);
assert.equal(wh.json.banGhi.trangThai, "DELIVERED");

// Quy trình tự động 3: Dọn dẹp hệ thống (phien_dang_nhap, dat_lai_mat_khau, khoa_xuat_ban hết hạn)
db.exec(`
  CREATE TABLE IF NOT EXISTS phien_dang_nhap (id TEXT PRIMARY KEY, email TEXT NOT NULL, het_han TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS dat_lai_mat_khau (token TEXT PRIMARY KEY, email TEXT NOT NULL, het_han TEXT NOT NULL);
`);
db.prepare("INSERT INTO phien_dang_nhap (id, email, het_han) VALUES ('p-cu', 'qtv@nguyenvong.ai', '2020-01-01T00:00:00.000Z')").run();
db.prepare("INSERT INTO phien_dang_nhap (id, email, het_han) VALUES ('p-moi', 'qtv@nguyenvong.ai', '2099-01-01T00:00:00.000Z')").run();
db.prepare("INSERT INTO dat_lai_mat_khau (token, email, het_han) VALUES ('t-cu', 'qtv@nguyenvong.ai', '2020-01-01T00:00:00.000Z')").run();
db.prepare("INSERT INTO khoa_xuat_ban (khoa_id, so_huu_boi, khoa_luc, het_han_luc) VALUES ('publish_lock', 'qtv@nguyenvong.ai', '2020-01-01T00:00:00.000Z', '2020-01-01T00:05:00.000Z')").run();

const donDep = await goiApi("POST", "qtv@nguyenvong.ai", { hanhDong: "don_dep_he_thong" });
assert.equal(donDep.status, 200);
assert.equal(donDep.json.phienDaXoa, 1);
assert.equal(donDep.json.tokenDaXoa, 1);
assert.equal(donDep.json.khoaXuatBanDaXoa, 1);
assert.equal(donDep.json.tongDaDon, 3);

// Đảm bảo phiên còn hạn không bị xóa và nhật ký hệ thống đã ghi lại thao tác tự động hóa
const phienConLai = db.prepare("SELECT COUNT(*) AS c FROM phien_dang_nhap").get() as { c: number };
assert.equal(phienConLai.c, 1);
const nhatKyDonDep = db.prepare("SELECT * FROM nhat_ky WHERE hanh_dong = 'he-thong.don-dep'").get() as { doi_tuong: string } | undefined;
assert.ok(nhatKyDonDep?.doi_tuong.includes("phien:1,token:1,khoa:1"), "Phải ghi nhật ký kiểm toán sau khi dọn dẹp hệ thống");

console.log("tests/cms-email-automation.test.ts: tất cả kiểm thử đều đạt 100%");
