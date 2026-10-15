// API Nhật ký Email & Tự động hóa Quy trình vận hành (Workflow Automation & Diagnostics API).
// Chỉ cho phép quản trị viên (qtv, sa) truy cập (RBAC phía máy chủ).
// - GET /api/email-log: trả danh sách nhat_ky_email, danh sách chặn email_bi_chan và bộ chỉ số thống kê.
// - POST /api/email-log: kích hoạt các quy trình tự động có kiểm tra đầu vào, chống chạy trùng và ghi nhật ký kiểm toán:
//   + thu_lai_email_loi: thử gửi lại các email lỗi tạm thời (FAILED_TRANSIENT, so_lan_thu < 3).
//   + don_dep_he_thong: dọn dẹp phiên đăng nhập hết hạn (phien_dang_nhap) và mã đặt lại mật khẩu hết hạn/đã dùng (dat_lai_mat_khau).
//   + webhook_trang_thai: nhận sự kiện trạng thái (delivered, bounced, complained) để cập nhật nhat_ky_email + email_bi_chan.
import { cauNhatKy } from "../_thu-vien/d1";
import {
  damBaoBangEmail,
  doiBanGhiEmail,
  thuLaiEmailTamThoi,
  xuLyWebhookEmail,
  type BanGhiEmailBiChan,
  type DongNhatKyEmail,
  type EnvEmail,
} from "../_thu-vien/email";
import type { BoiCanh, KhoD1, TuyChon } from "../_thu-vien/kieu";
import { docThan, docTrang, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, QUAN_TRI } from "../_thu-vien/quyen";

async function bangTonTai(d1: KhoD1, tenBang: string): Promise<boolean> {
  const r = await d1
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind(tenBang)
    .first<{ name: string }>();
  return Boolean(r?.name);
}

async function donDepHeThong(d1: KhoD1, luc: string): Promise<{ phienDaXoa: number; tokenDaXoa: number; khoaXuatBanDaXoa: number }> {
  let phienDaXoa = 0;
  let tokenDaXoa = 0;
  let khoaXuatBanDaXoa = 0;

  if (await bangTonTai(d1, "phien_dang_nhap")) {
    const kq = await d1.prepare("DELETE FROM phien_dang_nhap WHERE het_han < ?").bind(luc).run();
    phienDaXoa = Number(kq.meta?.changes ?? 0);
  }

  if (await bangTonTai(d1, "dat_lai_mat_khau")) {
    const kq = await d1.prepare("DELETE FROM dat_lai_mat_khau WHERE het_han < ?").bind(luc).run();
    tokenDaXoa = Number(kq.meta?.changes ?? 0);
  }

  if (await bangTonTai(d1, "khoa_xuat_ban")) {
    const kq = await d1.prepare("DELETE FROM khoa_xuat_ban WHERE het_han_luc < ?").bind(luc).run();
    khoaXuatBanDaXoa = Number(kq.meta?.changes ?? 0);
  }

  return { phienDaXoa, tokenDaXoa, khoaXuatBanDaXoa };
}

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    await damBaoBangEmail(c.d1);

    if (c.request.method === "GET") {
      const t = docTrang(c.url);
      const [dsEmail, dsChan, thongKe] = await Promise.all([
        c.d1
          .prepare("SELECT * FROM nhat_ky_email ORDER BY cap_nhat_luc DESC, id DESC LIMIT ? OFFSET ?")
          .bind(t.moi, t.offset)
          .all<DongNhatKyEmail>(),
        c.d1
          .prepare("SELECT email, ly_do, so_lan_bounce, chan_luc FROM email_bi_chan ORDER BY chan_luc DESC LIMIT 100")
          .all<{ email: string; ly_do: string; so_lan_bounce: number; chan_luc: string }>(),
        c.d1
          .prepare(
            `SELECT
              COUNT(*) AS tong,
              SUM(CASE WHEN trang_thai IN ('PROVIDER_ACCEPTED', 'DELIVERED') THEN 1 ELSE 0 END) AS thanh_cong,
              SUM(CASE WHEN trang_thai = 'FAILED_TRANSIENT' THEN 1 ELSE 0 END) AS loi_tam_thoi,
              SUM(CASE WHEN trang_thai = 'FAILED_PERMANENT' THEN 1 ELSE 0 END) AS loi_vinh_vien,
              SUM(CASE WHEN trang_thai = 'SUPPRESSED_BOUNCE' THEN 1 ELSE 0 END) AS bi_chan,
              SUM(CASE WHEN trang_thai = 'SKIPPED_NO_PROVIDER' THEN 1 ELSE 0 END) AS chua_cau_hinh
            FROM nhat_ky_email`
          )
          .first<{
            tong: number;
            thanh_cong: number | null;
            loi_tam_thoi: number | null;
            loi_vinh_vien: number | null;
            bi_chan: number | null;
            chua_cau_hinh: number | null;
          }>(),
      ]);

      const emailBiChan: BanGhiEmailBiChan[] = dsChan.results.map((x) => ({
        email: x.email,
        lyDo: x.ly_do,
        soLanBounce: Number(x.so_lan_bounce),
        chanLuc: x.chan_luc,
      }));

      return json({
        nhatKyEmail: dsEmail.results.map(doiBanGhiEmail),
        emailBiChan,
        thongKe: {
          tong: Number(thongKe?.tong ?? 0),
          thanhCong: Number(thongKe?.thanh_cong ?? 0),
          loiTamThoi: Number(thongKe?.loi_tam_thoi ?? 0),
          loiVinhVien: Number(thongKe?.loi_vinh_vien ?? 0),
          biChan: Number(thongKe?.bi_chan ?? 0),
          chuaCauHinh: Number(thongKe?.chua_cau_hinh ?? 0),
        },
      });
    }

    if (c.request.method !== "POST") throw khongHoTro();
    const b = await docThan(c.request);
    const hanhDong = typeof b.hanhDong === "string" ? b.hanhDong : "";

    if (hanhDong === "thu_lai_email_loi") {
      const kq = await thuLaiEmailTamThoi(c.d1, c.env as EnvEmail, c.o);
      await cauNhatKy(
        c.d1,
        c.email,
        "he-thong.thu-lai-email",
        `quet:${kq.soLuongQuet},ok:${kq.thanhCong},loi:${kq.vanLoi}`,
        c.luc
      ).run();
      return json({ hanhDong, ...kq });
    }

    if (hanhDong === "don_dep_he_thong") {
      const kq = await donDepHeThong(c.d1, c.luc);
      const tongDaDon = kq.phienDaXoa + kq.tokenDaXoa + kq.khoaXuatBanDaXoa;
      await cauNhatKy(
        c.d1,
        c.email,
        "he-thong.don-dep",
        `phien:${kq.phienDaXoa},token:${kq.tokenDaXoa},khoa:${kq.khoaXuatBanDaXoa}`,
        c.luc
      ).run();
      return json({ hanhDong, ...kq, tongDaDon });
    }

    if (hanhDong === "webhook_trang_thai") {
      const tt = b.trangThaiSuKien;
      if (tt !== "delivered" && tt !== "bounced" && tt !== "complained") {
        throw sai("Trạng thái sự kiện webhook phải là delivered, bounced hoặc complained", "trangThaiSuKien");
      }
      const idempotencyKey = typeof b.idempotencyKey === "string" ? b.idempotencyKey.trim() : undefined;
      const providerId = typeof b.providerId === "string" ? b.providerId.trim() : undefined;
      const email = typeof b.email === "string" ? b.email.trim() : undefined;
      const lyDo = typeof b.lyDo === "string" ? b.lyDo.trim() : undefined;

      if (!idempotencyKey && !providerId && !email) {
        throw sai("Cần ít nhất một trong các trường idempotencyKey, providerId hoặc email để xử lý webhook", "idempotencyKey");
      }

      const capNhat = await xuLyWebhookEmail(
        c.d1,
        { idempotencyKey, providerId, email, trangThaiSuKien: tt, lyDo },
        c.luc
      );
      await cauNhatKy(
        c.d1,
        c.email,
        "he-thong.webhook-email",
        `${tt}:${idempotencyKey ?? providerId ?? email}`,
        c.luc
      ).run();
      return json({ hanhDong, trangThaiSuKien: tt, banGhi: capNhat });
    }

    throw sai("Hành động tự động hóa không hợp lệ (hỗ trợ: thu_lai_email_loi, don_dep_he_thong, webhook_trang_thai)", "hanhDong");
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
