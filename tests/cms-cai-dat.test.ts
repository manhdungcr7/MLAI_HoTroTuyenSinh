// Kiểm thử toàn diện cho Cài đặt hệ thống & Nội dung công khai (Phase 5.3 & 5.5):
// - GET /api/cai-dat cho ctv, qtv, sa
// - PUT /api/cai-dat bởi qtv / sa (lưu vào D1 bảng cai_dat_he_thong + ghi nhat_ky CAP_NHAT_CAI_DAT_HE_THONG)
// - Từ chối 403 khi ctv cố PUT /api/cai-dat
// - Từ chối 401 khi chưa đăng nhập
// - Kiểm tra đầu vào (độ dài, kiểu dữ liệu, từ chối secret/API key thô)
// - Khôi phục mặc định (khoiPhucMacDinh: true)
// - Endpoint công khai GET /api/cau-hinh-cong-khai (fallback khi chưa có DB và khi đã lưu vào D1/KV, không lộ metadata nội bộ)
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  CAI_DAT_MAC_DINH,
  xuLy as caiDatApi,
  type CaiDatHeThong,
} from "../cms/functions/api/cai-dat";
import { xuLyCauHinhCongKhai, onRequestGet as cauHinhCongKhaiGet } from "../functions/api/cau-hinh-cong-khai";
import type { Env, KhoD1, KhoD1Cau } from "../cms/functions/_thu-vien/kieu";

const migrations = fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort();
const docSql = (file: string) => fs.readFileSync(path.join("migrations", file), "utf8");
const db = new DatabaseSync(":memory:");
for (const f of migrations) db.exec(docSql(f));

const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);
class Cau implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(public sql: string, private csdl: DatabaseSync) {}
  bind(...g: unknown[]) {
    this.gt = g;
    return this;
  }
  async first<T>() {
    return (this.csdl.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null;
  }
  async all<T>() {
    return { results: this.csdl.prepare(this.sql).all(...(this.gt as never[])) as T[] };
  }
  async run() {
    const r = this.csdl.prepare(this.sql).run(...(this.gt as never[]));
    return { meta: { changes: Number(r.changes) } };
  }
}

const taoD1 = (csdl: DatabaseSync): KhoD1 => ({
  prepare: (sql) => new Cau(sql, csdl),
  async batch(cau) {
    csdl.exec("BEGIN");
    try {
      const ra = cau.map((c) => {
        const x = c as Cau;
        return laDoc(x.sql)
          ? { results: csdl.prepare(x.sql).all(...(x.gt as never[])) }
          : { meta: { changes: Number(csdl.prepare(x.sql).run(...(x.gt as never[])).changes) } };
      });
      csdl.exec("COMMIT");
      return ra as never;
    } catch (e) {
      csdl.exec("ROLLBACK");
      throw e;
    }
  },
});

const d1: KhoD1 = taoD1(db);
const SA = "sa@test.local";
const QTV = "qtv@test.local";
const CTV = "ctv@test.local";

db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'sa', '2026-10-15T00:00:00Z')").run(SA);
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'qtv', '2026-10-15T00:00:00Z')").run(QTV);
db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc) VALUES (?, 'ctv', '2026-10-15T00:00:00Z')").run(CTV);

const env: Env = { DB: d1, GIA_DANH_DEV: "1", SESSION_SECRET: "secret-kiem-thu-32-ky-tu-an-toan!!" };

let dem = 0;
const goi = async (method: string, ai: string | null, body?: unknown, customEnv: Env = env) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
  };
  if (ai) headers["x-gia-danh"] = ai;
  const o = { bayGio: new Date(Date.parse("2026-10-15T08:00:00Z") + ++dem * 1000), taoId: () => `id-${dem}` };
  const r = await caiDatApi(
    {
      request: new Request("http://localhost/api/cai-dat", {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env: customEnv,
      params: {},
    },
    o
  );
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) : null };
};

// 1. Chưa đăng nhập -> 401
{
  const kqKhongHeader = await goi("GET", null);
  assert.equal(kqKhongHeader.status, 401, "Thiếu thông tin đăng nhập phải trả 401");

  const envThat: Env = { DB: d1, SESSION_SECRET: "secret-kiem-thu-32-ky-tu-an-toan!!" };
  const kqKhongCookie = await goi("PUT", null, { caiDat: CAI_DAT_MAC_DINH }, envThat);
  assert.equal(kqKhongCookie.status, 401, "PUT không có cookie phiên phải trả 401");
}

// 2. GET /api/cai-dat: ctv, qtv, sa đều đọc được mặc định ban đầu
for (const vai of [CTV, QTV, SA]) {
  const kq = await goi("GET", vai);
  assert.equal(kq.status, 200, `${vai} phải đọc được cài đặt`);
  assert.deepEqual(kq.json.caiDat, CAI_DAT_MAC_DINH);
  assert.equal(kq.json.capNhatBoi, null);
}

// 3. CTV cố tình gọi PUT /api/cai-dat -> bị chặn 403
{
  const kq = await goi("PUT", CTV, { caiDat: CAI_DAT_MAC_DINH });
  assert.equal(kq.status, 403, "CTV không được phép cập nhật cài đặt hệ thống");
}

// 4. QTV cập nhật cài đặt thành công -> lưu vào D1 và ghi nhật ký CAP_NHAT_CAI_DAT_HE_THONG
const caiDatMoiQtv: CaiDatHeThong = {
  tenHeThong: "Nguyện Vọng AI 2026",
  thongBaoChung: {
    bat: true,
    noiDung: "Hệ thống đang cập nhật điểm chuẩn chính thức đợt 1 năm 2026.",
    mucDo: "canhBao",
  },
  lienHe: {
    emailHoTro: "tuyensinh@nguyenvong.ai",
    dienThoai: "024 3869 4242",
    donVi: "Ban Điều phối Dữ liệu Nguyện Vọng AI",
  },
  cauHinhNghiepVu: {
    namTuyenSinh: 2027,
    soNguyenVongToiDaGoiY: 10,
    choPhepDangKySom: false,
    choPhepBaoSai: true,
  },
  emailGuiDi: {
    tenHienThi: "Ban Tuyển sinh Nguyện Vọng AI",
    diaChiPhanHoi: "phanhoi@nguyenvong.ai",
  },
  cauHoiThuongGap: [
    {
      cauHoi: "Làm sao để báo số liệu sai?",
      traLoi: "Em bấm nút Báo số liệu chưa khớp ngay tại trang chi tiết trường và đính kèm link đề án chính thức.",
    },
  ],
};

{
  const kq = await goi("PUT", QTV, { caiDat: caiDatMoiQtv });
  assert.equal(kq.status, 200);
  assert.deepEqual(kq.json.caiDat, caiDatMoiQtv);
  assert.equal(kq.json.capNhatBoi, QTV);
  assert.ok(kq.json.capNhatLuc);

  // Kiểm tra đọc lại bằng CTV thấy đúng dữ liệu mới
  const docLai = await goi("GET", CTV);
  assert.equal(docLai.status, 200);
  assert.deepEqual(docLai.json.caiDat, caiDatMoiQtv);
  assert.equal(docLai.json.capNhatBoi, QTV);

  // Kiểm tra nhật ký kiểm toán trong bảng nhat_ky
  const log = db
    .prepare("SELECT ai, hanh_dong, doi_tuong FROM nhat_ky WHERE hanh_dong = 'CAP_NHAT_CAI_DAT_HE_THONG' ORDER BY id DESC LIMIT 1")
    .get() as { ai: string; hanh_dong: string; doi_tuong: string } | undefined;
  assert.ok(log, "Phải có bản ghi nhật ký CAP_NHAT_CAI_DAT_HE_THONG");
  assert.equal(log.ai, QTV);
  const chiTietLog = JSON.parse(log.doi_tuong) as { truoc: CaiDatHeThong; sau: CaiDatHeThong };
  assert.equal(chiTietLog.truoc.tenHeThong, "Nguyện Vọng AI");
  assert.equal(chiTietLog.sau.tenHeThong, "Nguyện Vọng AI 2026");
}

// 5. SA cập nhật và khôi phục mặc định (rollback/reset)
{
  const banSa: CaiDatHeThong = {
    ...caiDatMoiQtv,
    tenHeThong: "Nguyện Vọng AI — Bản SA",
    thongBaoChung: { bat: true, noiDung: "Đang bảo trì nâng cấp máy chủ 15 phút.", mucDo: "baoTri" },
  };
  const kqSa = await goi("PUT", SA, banSa);
  assert.equal(kqSa.status, 200);
  assert.equal(kqSa.json.caiDat.tenHeThong, "Nguyện Vọng AI — Bản SA");
  assert.equal(kqSa.json.capNhatBoi, SA);
}

// 6. Kiểm tra validation đầu vào và chặn tuyệt đối secret/API key thô
{
  // Gửi kèm trường chứa tên nhạy cảm (apiKey / secret)
  const chuaBiMat = await goi("PUT", SA, {
    ...caiDatMoiQtv,
    resend_api_key: "re_123456",
  });
  assert.equal(chuaBiMat.status, 400, "Phải từ chối payload chứa khóa bí mật");

  // Bật thông báo nhưng để trống nội dung
  const tbRong = await goi("PUT", QTV, {
    caiDat: {
      ...caiDatMoiQtv,
      thongBaoChung: { bat: true, noiDung: "   ", mucDo: "thongTin" },
    },
  });
  assert.equal(tbRong.status, 400, "Bật thông báo chung mà nội dung rỗng phải trả 400");

  // Email hỗ trợ sai định dạng
  const emailSai = await goi("PUT", QTV, {
    caiDat: {
      ...caiDatMoiQtv,
      lienHe: { ...caiDatMoiQtv.lienHe, emailHoTro: "khong-phai-email" },
    },
  });
  assert.equal(emailSai.status, 400, "Email hỗ trợ sai phải trả 400");

  // Năm tuyển sinh ngoài khoảng hợp lệ
  const namSai = await goi("PUT", QTV, {
    caiDat: {
      ...caiDatMoiQtv,
      cauHinhNghiepVu: { ...caiDatMoiQtv.cauHinhNghiepVu, namTuyenSinh: 1999 },
    },
  });
  assert.equal(namSai.status, 400, "Năm tuyển sinh không hợp lệ phải trả 400");

  // Số nguyện vọng gợi ý vượt trần
  const soNvSai = await goi("PUT", QTV, {
    caiDat: {
      ...caiDatMoiQtv,
      cauHinhNghiepVu: { ...caiDatMoiQtv.cauHinhNghiepVu, soNguyenVongToiDaGoiY: 99 },
    },
  });
  assert.equal(soNvSai.status, 400, "Số nguyện vọng vượt quá 20 phải trả 400");

  // Câu hỏi thường gặp quá ngắn
  const faqNgan = await goi("PUT", QTV, {
    caiDat: {
      ...caiDatMoiQtv,
      cauHoiThuongGap: [{ cauHoi: "Hỏi?", traLoi: "Đáp" }],
    },
  });
  assert.equal(faqNgan.status, 400, "FAQ quá ngắn phải trả 400");
}

// 7. Endpoint công khai functions/api/cau-hinh-cong-khai.ts
{
  // Khi có D1 chứa dữ liệu đã cập nhật: chỉ trả đúng 5 nhóm trường công khai, không lộ emailGuiDi hay capNhatBoi
  const resCongKhai = await xuLyCauHinhCongKhai(new Request("http://localhost/api/cau-hinh-cong-khai"), { DB: d1 });
  assert.equal(resCongKhai.status, 200);
  const bodyCongKhai = (await resCongKhai.json()) as Record<string, unknown>;
  assert.equal(bodyCongKhai.tenHeThong, "Nguyện Vọng AI — Bản SA");
  assert.deepEqual(bodyCongKhai.thongBaoChung, {
    bat: true,
    noiDung: "Đang bảo trì nâng cấp máy chủ 15 phút.",
    mucDo: "baoTri",
  });
  assert.equal("emailGuiDi" in bodyCongKhai, false, "Không được lộ cấu hình emailGuiDi nội bộ ra endpoint công khai");
  assert.equal("capNhatBoi" in bodyCongKhai, false, "Không được lộ email quản trị viên ra endpoint công khai");

  // Khi không gắn D1/KV: trả về bản mặc định an toàn
  const resFallback = await cauHinhCongKhaiGet({ env: {} });
  assert.equal(resFallback.status, 200);
  const bodyFallback = (await resFallback.json()) as Record<string, unknown>;
  assert.equal(bodyFallback.tenHeThong, CAI_DAT_MAC_DINH.tenHeThong);
  assert.deepEqual(bodyFallback.cauHinhNghiepVu, CAI_DAT_MAC_DINH.cauHinhNghiepVu);
}

// 8. Khôi phục mặc định qua PUT { khoiPhucMacDinh: true }
{
  const kqReset = await goi("PUT", QTV, { khoiPhucMacDinh: true });
  assert.equal(kqReset.status, 200);
  assert.deepEqual(kqReset.json.caiDat, CAI_DAT_MAC_DINH);

  const tongLog = (
    db.prepare("SELECT COUNT(*) AS c FROM nhat_ky WHERE hanh_dong = 'CAP_NHAT_CAI_DAT_HE_THONG'").get() as { c: number }
  ).c;
  assert.equal(tongLog, 3, "Cả 3 lần cập nhật/khôi phục đều phải được ghi vào nhat_ky");
}

// HEAD kiểm tra được metadata cache mà không tải lại cấu hình công khai.
{
  const headCongKhai = await xuLyCauHinhCongKhai(new Request("http://localhost/api/cau-hinh-cong-khai", { method: "HEAD" }), { DB: d1 });
  assert.equal(headCongKhai.status, 200);
  assert.equal(await headCongKhai.text(), "");
  assert.match(headCongKhai.headers.get("Cache-Control") ?? "", /max-age=120/);
}

console.log("OK cms-cai-dat");
