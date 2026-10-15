// Dịch vụ gửi thư điện tử giao dịch (Transactional Email) phía máy chủ cho CMS Nguyện Vọng AI.
// Hỗ trợ Resend (RESEND_API_KEY), MailChannels (MAILCHANNELS_API_KEY) và Webhook tùy chỉnh (EMAIL_WEBHOOK_URL).
// Không bao giờ khai báo đã gửi tới hộp thư ("DELIVERED") chỉ vì máy chủ gửi thư nhận yêu cầu HTTP hay khi chưa cấu hình khóa.
// Lưu vết bền vững vào D1 (nhat_ky_email, email_bi_chan), chống gửi trùng (idempotency), chặn địa chỉ bị trả lại (suppression list),
// và tính thời gian chờ tăng dần (exponential backoff) cho lỗi mạng/5xx tạm thời.
import type { Env, KhoD1, TuyChon } from "./kieu";
import { chuanHoaEmail, laEmail } from "./xac-thuc";
import { thoatHtml } from "./telegram";

export type TrangThaiEmail =
  | "QUEUED"
  | "PROVIDER_ACCEPTED"
  | "DELIVERED"
  | "FAILED_TRANSIENT"
  | "FAILED_PERMANENT"
  | "SUPPRESSED_BOUNCE"
  | "SKIPPED_NO_PROVIDER";

export type LoaiMauEmail =
  | "xac_minh_email"
  | "quen_mat_khau"
  | "da_doi_mat_khau"
  | "chao_mung"
  | "thong_bao_tai_khoan"
  | "cap_nhat_ho_so_duyet"
  | "canh_bao_quan_tri";

export const CAC_LOAI_MAU_EMAIL: readonly LoaiMauEmail[] = [
  "xac_minh_email",
  "quen_mat_khau",
  "da_doi_mat_khau",
  "chao_mung",
  "thong_bao_tai_khoan",
  "cap_nhat_ho_so_duyet",
  "canh_bao_quan_tri",
];

export interface EnvEmail extends Env {
  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  EMAIL_WEBHOOK_URL?: string;
  EMAIL_FROM?: string;
}

export interface ThamSoMauEmail {
  hoTen?: string;
  urlHanhDong?: string;
  maXacMinh?: string;
  vaiTro?: string;
  trangThaiTaiKhoan?: string;
  maDoiTuong?: string;
  loaiDoiTuong?: string;
  ketQuaDuyet?: "APPROVED" | "REJECTED";
  nhanXetNguoiDuyet?: string;
  suKienQuanTri?: string;
  chiTietQuanTri?: string;
  thoiGian?: string;
}

export interface NoiDungEmail {
  loaiMau: LoaiMauEmail;
  tieuDe: string;
  html: string;
  vanBan: string;
  nhanNut: string;
  urlNut: string;
}

export interface YeuCauGuiEmail {
  idempotencyKey: string;
  loaiMau: LoaiMauEmail;
  nguoiNhan: string;
  thamSo?: ThamSoMauEmail;
}

export interface BanGhiNhatKyEmail {
  id: string;
  idempotencyKey: string;
  loaiMau: LoaiMauEmail;
  nguoiNhan: string;
  tieuDe: string;
  trangThai: TrangThaiEmail;
  soLanThu: number;
  loiCuoi: string | null;
  providerId: string | null;
  taoLuc: string;
  capNhatLuc: string;
}

export interface BanGhiEmailBiChan {
  email: string;
  lyDo: string;
  soLanBounce: number;
  chanLuc: string;
}

const TEN_MIEN_CAM = new Set(["invalid", "test", "example", "localhost"]);
const KHOANG_CHO_CO_BAN_MS = 2000;
const KHOANG_CHO_TOI_DA_MS = 60_000;
export const SO_LAN_THU_TOI_DA = 3;

/** Tính thời gian chờ theo cấp số nhân (exponential backoff): 2s, 4s, 8s... giới hạn ở 60s. */
export function tinhBackoffMs(soLanThu: number): number {
  const bac = Math.max(0, Math.floor(soLanThu) - 1);
  return Math.min(KHOANG_CHO_TOI_DA_MS, KHOANG_CHO_CO_BAN_MS * Math.pow(2, bac));
}

/** Kiểm tra định dạng và tên miền email trước khi gọi nhà cung cấp (địa chỉ sai không bao giờ thử lại). */
export function kiemTraDiaChiEmail(raw: unknown): { hopLe: boolean; email: string; lyDo?: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { hopLe: false, email: "", lyDo: "Địa chỉ email trống" };
  }
  const email = chuanHoaEmail(raw);
  if (!laEmail(email)) {
    return { hopLe: false, email, lyDo: "Định dạng địa chỉ email không hợp lệ" };
  }
  const phan = email.split("@");
  const mien = phan[1] ?? "";
  const duoi = mien.split(".").pop() ?? "";
  if (
    mien.includes("..") ||
    mien.startsWith("-") ||
    mien.endsWith("-") ||
    TEN_MIEN_CAM.has(duoi) ||
    TEN_MIEN_CAM.has(mien) ||
    mien.endsWith(".invalid")
  ) {
    return { hopLe: false, email, lyDo: `Tên miền email không hợp lệ hoặc không nhận thư (${mien})` };
  }
  return { hopLe: true, email };
}

/** Khởi tạo bảng lưu vết email và danh sách chặn (idempotent, chạy an toàn trên cả D1 hiện có). */
export async function damBaoBangEmail(d1: KhoD1): Promise<void> {
  await d1.batch([
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS nhat_ky_email (
        id              TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        loai_mau        TEXT NOT NULL,
        nguoi_nhan      TEXT NOT NULL,
        tieu_de         TEXT NOT NULL,
        trang_thai      TEXT NOT NULL,
        so_lan_thu      INTEGER NOT NULL DEFAULT 0,
        loi_cuoi        TEXT,
        provider_id     TEXT,
        tao_luc         TEXT NOT NULL,
        cap_nhat_luc    TEXT NOT NULL
      )`
    ),
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS email_bi_chan (
        email         TEXT PRIMARY KEY,
        ly_do         TEXT NOT NULL,
        so_lan_bounce INTEGER NOT NULL DEFAULT 1,
        chan_luc      TEXT NOT NULL
      )`
    ),
  ]);
}

function khungHtmlEmail(tieuDe: string, loiChao: string, doanVan: string[], nhanNut: string, urlNut: string, luuYPhu: string): string {
  const cacDoan = doanVan
    .map((d) => `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#102a43;">${d}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${thoatHtml(tieuDe)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#102a43;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f8ff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#0057e7;padding:20px 24px;">
              <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">Nguyện Vọng AI — Hệ thống Quản trị</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.4;color:#102a43;">${thoatHtml(tieuDe)}</h1>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#102a43;font-weight:600;">${thoatHtml(loiChao)}</p>
              ${cacDoan}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#0057e7;">
                    <a href="${thoatHtml(urlNut)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${thoatHtml(nhanNut)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:#486581;border-top:1px solid #e6effa;padding-top:14px;">${thoatHtml(luuYPhu)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Tạo nội dung HTML (giao diện sáng #0057e7 / #f5f8ff, 1 nút hành động chính) và bản chữ thuần cho 7 mẫu email tiếng Việt. */
export function taoMauEmail(loaiMau: LoaiMauEmail, thamSo: ThamSoMauEmail = {}): NoiDungEmail {
  const ten = thamSo.hoTen?.trim() ? thamSo.hoTen.trim() : "bạn";
  const loiChao = `Chào ${ten},`;
  const urlMacDinh = thamSo.urlHanhDong?.trim() || "https://nguyenvong.ai/cms";

  switch (loaiMau) {
    case "xac_minh_email": {
      const tieuDe = "[Nguyện Vọng AI] Xác minh địa chỉ email của bạn";
      const ma = thamSo.maXacMinh ? ` Mã xác minh của bạn là: ${thoatHtml(thamSo.maXacMinh)}.` : "";
      const doan = [
        `Cảm ơn bạn đã đăng ký tài khoản trên hệ thống Nguyện Vọng AI.${ma}`,
        "Vui lòng bấm vào nút bên dưới để hoàn tất xác minh địa chỉ email và kích hoạt tài khoản.",
      ];
      const nhanNut = "Xác minh email";
      const luuY = "Liên kết xác minh có hiệu lực trong 24 giờ. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "quen_mat_khau": {
      const tieuDe = "[Nguyện Vọng AI] Yêu cầu đặt lại mật khẩu (hiệu lực 15 phút)";
      const doan = [
        "Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản quản trị của bạn.",
        "Để đảm bảo an toàn, chúng tôi không bao giờ gửi mật khẩu dạng văn bản thuần qua email. Vui lòng bấm nút bên dưới trong vòng 15 phút để tự tạo mật khẩu mới.",
      ];
      const nhanNut = "Đặt lại mật khẩu";
      const luuY = "Liên kết đặt lại mật khẩu chỉ có hiệu lực trong 15 phút và chỉ dùng một lần. Nếu không phải bạn yêu cầu, hãy giữ nguyên mật khẩu hiện tại.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "da_doi_mat_khau": {
      const tieuDe = "[Nguyện Vọng AI] Cảnh báo bảo mật: Mật khẩu đã được thay đổi";
      const luc = thamSo.thoiGian ? ` vào lúc ${thoatHtml(thamSo.thoiGian)}` : "";
      const doan = [
        `Mật khẩu tài khoản Nguyện Vọng AI của bạn vừa được thay đổi thành công${luc}.`,
        "Mọi phiên đăng nhập trước đó trên các thiết bị khác đã được thu hồi tự động để bảo vệ tài khoản.",
      ];
      const nhanNut = "Kiểm tra tài khoản";
      const luuY = "Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay quản trị viên hệ thống để khóa tài khoản khẩn cấp.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "chao_mung": {
      const tieuDe = "[Nguyện Vọng AI] Chào mừng bạn đồng hành cùng Nguyện Vọng AI";
      const doan = [
        "Chào mừng bạn gia nhập cộng đồng Nguyện Vọng AI — nền tảng hỗ trợ học sinh THPT tra cứu thông tin tuyển sinh minh bạch và có nguồn kiểm chứng.",
        "Bạn có thể truy cập ngay vào hệ thống để xem hướng dẫn đóng góp dữ liệu trường hoặc tra cứu thông tin.",
      ];
      const nhanNut = "Bắt đầu ngay";
      const luuY = "Mọi đóng góp dữ liệu đều được kiểm duyệt đối chiếu với đề án tuyển sinh chính thức của các trường.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "thong_bao_tai_khoan": {
      const tieuDe = "[Nguyện Vọng AI] Thông báo cập nhật quyền và trạng thái tài khoản";
      const vai = thamSo.vaiTro ? `Vai trò hiện tại: ${thoatHtml(thamSo.vaiTro)}. ` : "";
      const tt = thamSo.trangThaiTaiKhoan ? `Trạng thái: ${thoatHtml(thamSo.trangThaiTaiKhoan)}.` : "";
      const doan = [
        `Tài khoản của bạn trên hệ thống quản trị Nguyện Vọng AI vừa được cập nhật. ${vai}${tt}`.trim(),
        "Vui lòng đăng nhập vào trang quản trị để xem danh sách các trường được phân công và quyền hạn tương ứng.",
      ];
      const nhanNut = "Mở trang quản trị";
      const luuY = "Nếu cần hỗ trợ thêm về phân công trường, vui lòng liên hệ ban quản trị.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "cap_nhat_ho_so_duyet": {
      const daDuyet = thamSo.ketQuaDuyet === "APPROVED";
      const trangThaiChu = daDuyet ? "Đã được phê duyệt" : "Cần bổ sung / chỉnh sửa";
      const ma = thamSo.maDoiTuong ? ` (${thamSo.maDoiTuong})` : "";
      const tieuDe = `[Nguyện Vọng AI] Hồ sơ dữ liệu${ma}: ${trangThaiChu}`;
      const nhanXet = thamSo.nhanXetNguoiDuyet?.trim()
        ? `Nhận xét từ người duyệt: "${thoatHtml(thamSo.nhanXetNguoiDuyet.trim())}"`
        : daDuyet
          ? "Hồ sơ của bạn đã đạt chuẩn nguồn kiểm chứng và sẵn sàng cho đợt xuất bản tiếp theo."
          : "Vui lòng kiểm tra lại liên kết nguồn chính thức và cập nhật theo ghi chú của người duyệt.";
      const doan = [
        `Bản ghi dữ liệu ${thoatHtml(thamSo.loaiDoiTuong ?? "trường đại học")}${thoatHtml(ma)} đã chuyển sang trạng thái: ${trangThaiChu}.`,
        nhanXet,
      ];
      const nhanNut = "Xem chi tiết hồ sơ";
      const luuY = "Cảm ơn bạn đã đóng góp dữ liệu chính xác cho học sinh THPT.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }

    case "canh_bao_quan_tri": {
      const suKien = thamSo.suKienQuanTri?.trim() || "Sự kiện vận hành hệ thống";
      const tieuDe = `[Nguyện Vọng AI] Cảnh báo quản trị: ${suKien}`;
      const doan = [
        `Hệ thống ghi nhận sự kiện quản trị quan trọng: ${thoatHtml(suKien)}.`,
        thamSo.chiTietQuanTri?.trim()
          ? `Chi tiết: ${thoatHtml(thamSo.chiTietQuanTri.trim())}`
          : "Vui lòng kiểm tra nhật ký hệ thống và trạng thái xuất bản hiện tại.",
      ];
      const nhanNut = "Kiểm tra hệ thống";
      const luuY = "Thư này được gửi tự động tới nhóm Quản trị viên vận hành Nguyện Vọng AI.";
      return {
        loaiMau,
        tieuDe,
        nhanNut,
        urlNut: urlMacDinh,
        html: khungHtmlEmail(tieuDe, loiChao, doan, nhanNut, urlMacDinh, luuY),
        vanBan: [tieuDe, loiChao, ...doan, `${nhanNut}: ${urlMacDinh}`, luuY].join("\n\n"),
      };
    }
  }
}

interface DongNhatKyEmail {
  id: string;
  idempotency_key: string;
  loai_mau: LoaiMauEmail;
  nguoi_nhan: string;
  tieu_de: string;
  trang_thai: TrangThaiEmail;
  so_lan_thu: number;
  loi_cuoi: string | null;
  provider_id: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
}

function doiBanGhiEmail(r: DongNhatKyEmail): BanGhiNhatKyEmail {
  return {
    id: r.id,
    idempotencyKey: r.idempotency_key,
    loaiMau: r.loai_mau,
    nguoiNhan: r.nguoi_nhan,
    tieuDe: r.tieu_de,
    trangThai: r.trang_thai,
    soLanThu: Number(r.so_lan_thu),
    loiCuoi: r.loi_cuoi ?? null,
    providerId: r.provider_id ?? null,
    taoLuc: r.tao_luc,
    capNhatLuc: r.cap_nhat_luc,
  };
}

export function daCauHinhEmailProvider(env: EnvEmail): boolean {
  return Boolean(env.RESEND_API_KEY || env.MAILCHANNELS_API_KEY || env.EMAIL_WEBHOOK_URL);
}

interface KetQuaGoiProvider {
  loai: "accepted" | "transient" | "permanent" | "no_provider";
  providerId?: string;
  loi?: string;
}

async function goiNhaCungCap(env: EnvEmail, nguoiNhan: string, noiDung: NoiDungEmail, idempotencyKey: string, o: TuyChon): Promise<KetQuaGoiProvider> {
  if (!daCauHinhEmailProvider(env)) {
    return { loai: "no_provider", loi: "Máy chủ chưa cấu hình khóa gửi email (RESEND_API_KEY / MAILCHANNELS_API_KEY / EMAIL_WEBHOOK_URL)" };
  }
  const hamFetch = o.fetch ?? fetch;
  const nguoiGui = env.EMAIL_FROM || "Nguyện Vọng AI <no-reply@nguyenvong.ai>";

  try {
    let r: Response;
    if (env.RESEND_API_KEY) {
      r = await hamFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          from: nguoiGui,
          to: [nguoiNhan],
          subject: noiDung.tieuDe,
          html: noiDung.html,
          text: noiDung.vanBan,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } else if (env.MAILCHANNELS_API_KEY) {
      r = await hamFetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "x-api-key": env.MAILCHANNELS_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: nguoiNhan }] }],
          from: { email: "no-reply@nguyenvong.ai", name: "Nguyện Vọng AI" },
          subject: noiDung.tieuDe,
          content: [
            { type: "text/plain", value: noiDung.vanBan },
            { type: "text/html", value: noiDung.html },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });
    } else {
      r = await hamFetch(env.EMAIL_WEBHOOK_URL!, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          to: nguoiNhan,
          subject: noiDung.tieuDe,
          html: noiDung.html,
          text: noiDung.vanBan,
        }),
        signal: AbortSignal.timeout(5000),
      });
    }

    if (r.ok) {
      let providerId = `msg-${idempotencyKey}`;
      try {
        const body = (await r.json()) as { id?: string; messageId?: string };
        if (typeof body?.id === "string" && body.id) providerId = body.id;
        else if (typeof body?.messageId === "string" && body.messageId) providerId = body.messageId;
      } catch {
        /* phản hồi 202 không thân JSON vẫn hợp lệ */
      }
      return { loai: "accepted", providerId };
    }

    const chiTiet = (await r.text().catch(() => "")).slice(0, 300);
    // 429 hoặc >= 500 là lỗi tạm thời (có thể thử lại); 4xx khác (400, 404, 422...) là lỗi vĩnh viễn / địa chỉ bị từ chối
    if (r.status === 429 || r.status >= 500) {
      return { loai: "transient", loi: `HTTP ${r.status}${chiTiet ? `: ${chiTiet}` : ""}` };
    }
    return { loai: "permanent", loi: `HTTP ${r.status}${chiTiet ? `: ${chiTiet}` : ""}` };
  } catch (e) {
    return { loai: "transient", loi: e instanceof Error ? e.message : "Lỗi kết nối mạng tới dịch vụ email" };
  }
}

export async function chanEmail(d1: KhoD1, email: string, lyDo: string, luc: string): Promise<void> {
  await damBaoBangEmail(d1);
  const chuan = chuanHoaEmail(email);
  await d1
    .prepare(
      `INSERT INTO email_bi_chan (email, ly_do, so_lan_bounce, chan_luc)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(email) DO UPDATE SET
         ly_do = excluded.ly_do,
         so_lan_bounce = email_bi_chan.so_lan_bounce + 1,
         chan_luc = excluded.chan_luc`
    )
    .bind(chuan, lyDo.slice(0, 300), luc)
    .run();
}

/**
 * Gửi email giao dịch có kiểm tra trùng khóa (idempotency), danh sách chặn (suppression list),
 * định dạng địa chỉ, và ghi nhật ký trạng thái trung thực vào D1.
 */
export async function guiEmailGiaoDich(d1: KhoD1, env: EnvEmail, yeuCau: YeuCauGuiEmail, o: TuyChon = {}): Promise<BanGhiNhatKyEmail> {
  await damBaoBangEmail(d1);
  const bayGio = o.bayGio ?? new Date();
  const luc = bayGio.toISOString();
  const taoId = o.taoId ?? (() => crypto.randomUUID());

  const khoa = yeuCau.idempotencyKey.trim();
  if (!khoa) throw new Error("Thiếu idempotencyKey khi gửi email");

  // 1. Kiểm tra chống gửi trùng (Idempotency)
  const daCo = await d1
    .prepare("SELECT * FROM nhat_ky_email WHERE idempotency_key = ? LIMIT 1")
    .bind(khoa)
    .first<DongNhatKyEmail>();

  if (daCo && (daCo.trang_thai === "PROVIDER_ACCEPTED" || daCo.trang_thai === "DELIVERED")) {
    return doiBanGhiEmail(daCo);
  }

  const noiDung = taoMauEmail(yeuCau.loaiMau, yeuCau.thamSo);
  const kt = kiemTraDiaChiEmail(yeuCau.nguoiNhan);
  const emailNhan = kt.email || String(yeuCau.nguoiNhan ?? "").trim();
  const id = daCo?.id ?? taoId();

  // 2. Địa chỉ sai định dạng hoặc sai tên miền -> FAILED_PERMANENT ngay lập tức, đưa vào danh sách chặn, không gọi mạng
  if (!kt.hopLe) {
    const lyDo = kt.lyDo ?? "Địa chỉ email không hợp lệ";
    if (emailNhan) await chanEmail(d1, emailNhan, lyDo, luc);
    await d1
      .prepare(
        `INSERT INTO nhat_ky_email (id, idempotency_key, loai_mau, nguoi_nhan, tieu_de, trang_thai, so_lan_thu, loi_cuoi, provider_id, tao_luc, cap_nhat_luc)
         VALUES (?, ?, ?, ?, ?, 'FAILED_PERMANENT', 1, ?, NULL, ?, ?)
         ON CONFLICT(idempotency_key) DO UPDATE SET
           trang_thai = 'FAILED_PERMANENT',
           loi_cuoi = excluded.loi_cuoi,
           cap_nhat_luc = excluded.cap_nhat_luc`
      )
      .bind(id, khoa, yeuCau.loaiMau, emailNhan, noiDung.tieuDe, lyDo, daCo?.tao_luc ?? luc, luc)
      .run();
    const Dong = await d1.prepare("SELECT * FROM nhat_ky_email WHERE idempotency_key = ? LIMIT 1").bind(khoa).first<DongNhatKyEmail>();
    return doiBanGhiEmail(Dong!);
  }

  // 3. Kiểm tra danh sách chặn do bounce cứng trước đó (Suppression check)
  const biChan = await d1
    .prepare("SELECT email, ly_do FROM email_bi_chan WHERE email = ? LIMIT 1")
    .bind(emailNhan)
    .first<{ email: string; ly_do: string }>();

  if (biChan) {
    const thongBaoChan = `Địa chỉ nằm trong danh sách chặn (${biChan.ly_do})`;
    await d1
      .prepare(
        `INSERT INTO nhat_ky_email (id, idempotency_key, loai_mau, nguoi_nhan, tieu_de, trang_thai, so_lan_thu, loi_cuoi, provider_id, tao_luc, cap_nhat_luc)
         VALUES (?, ?, ?, ?, ?, 'SUPPRESSED_BOUNCE', 0, ?, NULL, ?, ?)
         ON CONFLICT(idempotency_key) DO UPDATE SET
           trang_thai = 'SUPPRESSED_BOUNCE',
           loi_cuoi = excluded.loi_cuoi,
           cap_nhat_luc = excluded.cap_nhat_luc`
      )
      .bind(id, khoa, yeuCau.loaiMau, emailNhan, noiDung.tieuDe, thongBaoChan, daCo?.tao_luc ?? luc, luc)
      .run();
    const Dong = await d1.prepare("SELECT * FROM nhat_ky_email WHERE idempotency_key = ? LIMIT 1").bind(khoa).first<DongNhatKyEmail>();
    return doiBanGhiEmail(Dong!);
  }

  // 4. Gọi nhà cung cấp email
  const soLanThuMoi = (daCo?.so_lan_thu ?? 0) + 1;
  const kq = await goiNhaCungCap(env, emailNhan, noiDung, khoa, o);

  let trangThai: TrangThaiEmail;
  let loiCuoi: string | null = null;
  let providerId: string | null = null;

  if (kq.loai === "no_provider") {
    // Trung thực: chưa cấu hình khóa thì ghi SKIPPED_NO_PROVIDER, tuyệt đối không giả mạo DELIVERED
    trangThai = "SKIPPED_NO_PROVIDER";
    loiCuoi = kq.loi ?? null;
  } else if (kq.loai === "accepted") {
    // Trung thực: HTTP 2xx từ API chỉ có nghĩa là nhà cung cấp đã nhận yêu cầu (PROVIDER_ACCEPTED), chỉ thành DELIVERED khi có webhook
    trangThai = "PROVIDER_ACCEPTED";
    providerId = kq.providerId ?? null;
  } else if (kq.loai === "permanent") {
    trangThai = "FAILED_PERMANENT";
    loiCuoi = kq.loi ?? "Nhà cung cấp từ chối vĩnh viễn (4xx hard bounce)";
    await chanEmail(d1, emailNhan, loiCuoi, luc);
  } else {
    trangThai = "FAILED_TRANSIENT";
    loiCuoi = kq.loi ?? "Lỗi tạm thời khi gửi email";
  }

  await d1
    .prepare(
      `INSERT INTO nhat_ky_email (id, idempotency_key, loai_mau, nguoi_nhan, tieu_de, trang_thai, so_lan_thu, loi_cuoi, provider_id, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(idempotency_key) DO UPDATE SET
         trang_thai = excluded.trang_thai,
         so_lan_thu = excluded.so_lan_thu,
         loi_cuoi = excluded.loi_cuoi,
         provider_id = COALESCE(excluded.provider_id, nhat_ky_email.provider_id),
         cap_nhat_luc = excluded.cap_nhat_luc`
    )
    .bind(id, khoa, yeuCau.loaiMau, emailNhan, noiDung.tieuDe, trangThai, soLanThuMoi, loiCuoi, providerId, daCo?.tao_luc ?? luc, luc)
    .run();

  const capNhat = await d1.prepare("SELECT * FROM nhat_ky_email WHERE idempotency_key = ? LIMIT 1").bind(khoa).first<DongNhatKyEmail>();
  return doiBanGhiEmail(capNhat!);
}

/** Thử gửi lại các email bị lỗi tạm thời (FAILED_TRANSIENT) có số lần thử < 3. */
export async function thuLaiEmailTamThoi(
  d1: KhoD1,
  env: EnvEmail,
  o: TuyChon = {}
): Promise<{ soLuongQuet: number; thanhCong: number; vanLoi: number; chiTiet: { id: string; trangThai: TrangThaiEmail; backoffMs: number }[] }> {
  await damBaoBangEmail(d1);
  const ds = await d1
    .prepare("SELECT * FROM nhat_ky_email WHERE trang_thai = 'FAILED_TRANSIENT' AND so_lan_thu < ? ORDER BY cap_nhat_luc ASC LIMIT 25")
    .bind(SO_LAN_THU_TOI_DA)
    .all<DongNhatKyEmail>();

  let thanhCong = 0;
  let vanLoi = 0;
  const chiTiet: { id: string; trangThai: TrangThaiEmail; backoffMs: number }[] = [];

  for (const dong of ds.results) {
    const backoffMs = tinhBackoffMs(dong.so_lan_thu);
    const kq = await guiEmailGiaoDich(
      d1,
      env,
      {
        idempotencyKey: dong.idempotency_key,
        loaiMau: dong.loai_mau,
        nguoiNhan: dong.nguoi_nhan,
      },
      o
    );
    if (kq.trangThai === "PROVIDER_ACCEPTED" || kq.trangThai === "DELIVERED") thanhCong++;
    else vanLoi++;
    chiTiet.push({ id: kq.id, trangThai: kq.trangThai, backoffMs });
  }

  return { soLuongQuet: ds.results.length, thanhCong, vanLoi, chiTiet };
}

/** Xử lý sự kiện webhook trạng thái từ nhà cung cấp email (delivered, bounced, complained). */
export async function xuLyWebhookEmail(
  d1: KhoD1,
  suKien: { idempotencyKey?: string; providerId?: string; email?: string; trangThaiSuKien: "delivered" | "bounced" | "complained"; lyDo?: string },
  luc: string
): Promise<BanGhiNhatKyEmail | null> {
  await damBaoBangEmail(d1);
  let dong: DongNhatKyEmail | null = null;
  if (suKien.idempotencyKey) {
    dong = await d1.prepare("SELECT * FROM nhat_ky_email WHERE idempotency_key = ? LIMIT 1").bind(suKien.idempotencyKey).first<DongNhatKyEmail>();
  } else if (suKien.providerId) {
    dong = await d1.prepare("SELECT * FROM nhat_ky_email WHERE provider_id = ? LIMIT 1").bind(suKien.providerId).first<DongNhatKyEmail>();
  }

  const emailMucTieu = suKien.email ? chuanHoaEmail(suKien.email) : dong?.nguoi_nhan;
  const trangThaiMoi: TrangThaiEmail = suKien.trangThaiSuKien === "delivered" ? "DELIVERED" : "FAILED_PERMANENT";
  const lyDo =
    suKien.trangThaiSuKien === "delivered"
      ? null
      : suKien.lyDo?.trim() || (suKien.trangThaiSuKien === "complained" ? "Người nhận báo cáo thư rác (complained)" : "Hộp thư trả lại vĩnh viễn (hard bounce)");

  if (suKien.trangThaiSuKien !== "delivered" && emailMucTieu) {
    await chanEmail(d1, emailMucTieu, lyDo ?? "Hard bounce", luc);
  }

  if (!dong) return null;

  await d1
    .prepare("UPDATE nhat_ky_email SET trang_thai = ?, loi_cuoi = COALESCE(?, loi_cuoi), cap_nhat_luc = ? WHERE id = ?")
    .bind(trangThaiMoi, lyDo, luc, dong.id)
    .run();

  const moi = await d1.prepare("SELECT * FROM nhat_ky_email WHERE id = ? LIMIT 1").bind(dong.id).first<DongNhatKyEmail>();
  return moi ? doiBanGhiEmail(moi) : null;
}

export { doiBanGhiEmail, type DongNhatKyEmail };
