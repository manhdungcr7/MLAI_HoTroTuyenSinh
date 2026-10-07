// /api/ban-ghi: bản ghi CMS có quy trình DRAFT -> SUBMITTED -> (IN_REVIEW) -> APPROVED -> PUBLISHED, hoặc REJECTED (kèm lý do) quay lại sửa.
// PUBLISHED chỉ đến từ POST /api/xuat-ban-snapshot (qtv). Quyền kiểm ở máy chủ: ctv chỉ tạo/sửa/gửi bản ghi của chính mình, thuộc trường được giao.
import type { BanGhiCms, TrangThaiCms, VaiTroCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { chuyenTrangThaiWorkflow, taoBanNhapMoi, taoPhienBanSuaDoi } from "../../../src/engine/du-lieu-tuyen-sinh/workflow";
import { cauChenBanGhi, cauKiemToan, daThayDoi, kiemTraData, kiemTraEntity, kiemTraGhiChu, kiemTraMucDo, kiemTraNguon, mapTuD1, maTruongCua, TRANG_THAI_CMS, type HangBanGhiD1 } from "../_thu-vien/ban-ghi-d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, cam, docThan, docTrang, json, khongTimThay, locEnum, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, TAP_TRUONG, type NguCanh } from "../_thu-vien/quyen";
import { thongBaoSuKien } from "../_thu-vien/telegram";

const lech = () => new LoiHttp(409, "lech-trang-thai", "Bản ghi vừa được người khác thay đổi. Hãy tải lại rồi thao tác tiếp.");

/** Ctv phải được giao trường của bản ghi. Thực thể không gắn trường (thông báo chung) chỉ qtv được đụng vào. */
async function kiemQuyenTruong(c: NguCanh, entityType: string, entityId: string) {
  const ma = maTruongCua(entityId);
  if (TAP_TRUONG.has(ma)) return c.yeuCauSuaTruong(ma);
  if (entityType === "announcement") return c.yeuCauQtv("Thông báo chung không gắn trường chỉ quản trị viên được tạo");
  throw sai("entityId phải bắt đầu bằng mã trường hợp lệ (ví dụ BKA hoặc BKA-7480201)", "entityId");
}

/** Ctv chỉ đụng được bản ghi của chính mình (qtv: mọi bản ghi). */
function kiemSoHuu(c: NguCanh, h: HangBanGhiD1) {
  if (c.vaiTro === "ctv" && h.created_by !== c.email) throw cam("Bạn chỉ thao tác được trên bản ghi do chính bạn tạo");
}

async function layHang(c: NguCanh, id: string): Promise<HangBanGhiD1> {
  const h = await c.d1.prepare("SELECT * FROM ban_ghi_cms WHERE id = ? LIMIT 1").bind(id).first<HangBanGhiD1>();
  if (!h) throw khongTimThay("Không tìm thấy bản ghi");
  return h;
}

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    const vaiTroCms: VaiTroCms = c.vaiTro === "qtv" ? "admin" : "contributor";
    const m = c.request.method;

    // ===== GET: danh sách (phân trang) hoặc một bản ghi theo ?id= =====
    if (m === "GET") {
      const id = c.url.searchParams.get("id");
      // ctv thấy bản của mình và bản đã xuất bản; qtv thấy tất cả
      const gioiHan = c.vaiTro === "ctv" ? "(created_by = ? OR status = 'PUBLISHED')" : "";
      const gtGioiHan = c.vaiTro === "ctv" ? [c.email] : [];
      if (id) {
        const h = await c.d1.prepare(`SELECT * FROM ban_ghi_cms WHERE id = ?${gioiHan ? ` AND ${gioiHan}` : ""} LIMIT 1`).bind(id, ...gtGioiHan).first<HangBanGhiD1>();
        if (!h) throw khongTimThay("Không tìm thấy bản ghi");
        return json(mapTuD1(h));
      }
      const t = docTrang(c.url);
      const dk: string[] = gioiHan ? [gioiHan] : [];
      const gt: unknown[] = [...gtGioiHan];
      const loai = c.url.searchParams.get("entityType");
      if (loai) { dk.push("entity_type = ?"); gt.push(loai); }
      const eid = c.url.searchParams.get("entityId");
      if (eid) { dk.push("entity_id = ?"); gt.push(eid); }
      const tt = locEnum(c.url.searchParams.get("status"), TRANG_THAI_CMS, "status");
      if (tt) { dk.push("status = ?"); gt.push(tt); }
      const nguoiTao = c.url.searchParams.get("createdBy");
      if (nguoiTao && c.vaiTro === "qtv") { dk.push("created_by = ?"); gt.push(nguoiTao.toLowerCase()); }
      const where = dk.length ? `WHERE ${dk.join(" AND ")}` : "";
      const [dem, ds] = (await c.d1.batch([
        c.d1.prepare(`SELECT COUNT(*) AS c FROM ban_ghi_cms ${where}`).bind(...gt),
        c.d1.prepare(`SELECT * FROM ban_ghi_cms ${where} ORDER BY updated_at DESC, id LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset),
      ])) as unknown as [{ results: { c: number }[] }, { results: HangBanGhiD1[] }];
      return json({ items: ds.results.map(mapTuD1), tong: dem.results[0]?.c ?? 0 });
    }

    // ===== POST: tạo bản nháp mới (CREATE) hoặc bản sửa đổi từ bản đã PUBLISHED (CREATE_MODIFICATION) =====
    if (m === "POST") {
      const body = await docThan(c.request);
      const action = String(body.action || "CREATE");

      if (action === "CREATE") {
        const { entityType, entityId } = kiemTraEntity(body.entityType, body.entityId);
        await kiemQuyenTruong(c, entityType, entityId);
        const data = kiemTraData(body.data, entityId);
        const source = kiemTraNguon(body.source, c.email, c.luc);
        const importance = kiemTraMucDo(body.importance);
        const changeNote = kiemTraGhiChu(body.changeNote, "Tạo mới bản ghi");
        const mo = await c.d1.prepare("SELECT id, status FROM ban_ghi_cms WHERE entity_type = ? AND entity_id = ? AND status IN ('DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','PUBLISHED') LIMIT 1").bind(entityType, entityId).first<{ id: string; status: string }>();
        if (mo) throw new LoiHttp(409, "da-ton-tai", `Đã có bản ghi ${entityType}/${entityId} (id ${mo.id}, trạng thái ${mo.status}). Dùng action CREATE_MODIFICATION trên bản đã xuất bản hoặc sửa bản đang mở.`);
        const kq = taoBanNhapMoi({ id: (c.o.taoId ?? (() => crypto.randomUUID()))(), entityType, entityId, data, source, changeNote, importance, actorEmail: c.email, actorRole: vaiTroCms, now: c.luc });
        if (!kq.thanhCong || !kq.duLieu) throw sai(kq.loi || "Không thể tạo bản ghi");
        const b = kq.duLieu;
        await c.d1.batch([cauChenBanGhi(c.d1, b), cauKiemToan(c.d1, { email: c.email, hanhDong: "CREATE", entityType, entityId, version: b.version, ghiChu: changeNote, luc: c.luc })]);
        return json(b, 201);
      }

      if (action === "CREATE_MODIFICATION") {
        const cur = await layHang(c, String(body.currentId || ""));
        if (cur.status !== "PUBLISHED") throw sai("Chỉ tạo bản sửa đổi từ bản ghi đang PUBLISHED. Bản chưa xuất bản thì sửa trực tiếp (PUT).", "currentId");
        await kiemQuyenTruong(c, cur.entity_type, cur.entity_id);
        const mo = await c.d1.prepare("SELECT id FROM ban_ghi_cms WHERE entity_type = ? AND entity_id = ? AND status IN ('DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED') LIMIT 1").bind(cur.entity_type, cur.entity_id).first<{ id: string }>();
        if (mo) throw new LoiHttp(409, "da-co-ban-nhap", `Thực thể này đã có một bản đang xử lý (id ${mo.id}). Hoàn tất hoặc lưu trữ bản đó trước.`);
        const hienTai = mapTuD1(cur);
        const kq = taoPhienBanSuaDoi({
          newId: (c.o.taoId ?? (() => crypto.randomUUID()))(), banGhiHienTai: hienTai,
          duLieuMoi: kiemTraData(body.duLieuMoi ?? hienTai.data, cur.entity_id),
          sourceMoi: kiemTraNguon(body.sourceMoi ?? hienTai.source, c.email, c.luc),
          changeNote: kiemTraGhiChu(body.changeNote, "Chỉnh sửa dữ liệu"), importance: kiemTraMucDo(body.importance, hienTai.importance),
          actorEmail: c.email, actorRole: vaiTroCms, now: c.luc,
        });
        if (!kq.thanhCong || !kq.duLieu) throw sai(kq.loi || "Lỗi tạo bản nháp sửa đổi");
        const b = kq.duLieu;
        await c.d1.batch([cauChenBanGhi(c.d1, b), cauKiemToan(c.d1, { email: c.email, hanhDong: "CREATE", entityType: b.entityType, entityId: b.entityId, version: b.version, ghiChu: kq.auditLog?.note, luc: c.luc })]);
        return json(b, 201);
      }
      throw sai("action phải là CREATE hoặc CREATE_MODIFICATION", "action");
    }

    // ===== PUT: sửa nội dung bản DRAFT/REJECTED (version tăng 1 mỗi lần sửa) =====
    if (m === "PUT") {
      const body = await docThan(c.request);
      const cur = await layHang(c, String(body.id || ""));
      kiemSoHuu(c, cur);
      if (cur.status !== "DRAFT" && cur.status !== "REJECTED") throw sai(`Chỉ sửa được bản ở trạng thái DRAFT hoặc REJECTED, hiện là ${cur.status}`, "id");
      await kiemQuyenTruong(c, cur.entity_type, cur.entity_id);
      const hienTai = mapTuD1(cur);
      const data = body.data === undefined ? hienTai.data : kiemTraData(body.data, cur.entity_id);
      const nguon = body.source === undefined ? hienTai.source : kiemTraNguon(body.source, c.email, c.luc);
      const importance = kiemTraMucDo(body.importance, hienTai.importance);
      const ghiChu = kiemTraGhiChu(body.changeNote, cur.change_note);
      const [kq] = await c.d1.batch([
        c.d1.prepare(`UPDATE ban_ghi_cms SET data_json = ?, source_url = ?, source_title = ?, source_publisher = ?, source_published_at = ?, source_verified_at = ?, importance = ?, change_note = ?, updated_by = ?, updated_at = ?, version = version + 1
                      WHERE id = ? AND status = ? AND updated_at = ?`)
          .bind(JSON.stringify(data), nguon.url, nguon.tieuDe, nguon.donViCongBo, nguon.ngayCongBo ?? null, nguon.ngayKiemChung, importance, ghiChu, c.email, c.luc, cur.id, cur.status, cur.updated_at),
        cauKiemToan(c.d1, { email: c.email, hanhDong: "EDIT", entityType: cur.entity_type, entityId: cur.entity_id, version: cur.version + 1, ghiChu, luc: c.luc }, true),
      ]);
      if (!daThayDoi(kq)) throw lech();
      return json(mapTuD1(await layHang(c, cur.id)));
    }

    // ===== PATCH: chuyển trạng thái (SUBMITTED, IN_REVIEW, APPROVED, REJECTED, ARCHIVED) =====
    if (m === "PATCH") {
      const body = await docThan(c.request);
      const dich = body.status as TrangThaiCms;
      if (!["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "ARCHIVED"].includes(dich)) {
        if (dich === "PUBLISHED") throw sai("Không đặt PUBLISHED trực tiếp. Dùng POST /api/xuat-ban-snapshot (qtv) để xuất bản các bản APPROVED.", "status");
        throw sai("status phải là SUBMITTED, IN_REVIEW, APPROVED, REJECTED hoặc ARCHIVED", "status");
      }
      const cur = await layHang(c, String(body.id || ""));
      if (c.vaiTro === "ctv") {
        if (dich !== "SUBMITTED") throw cam("Cộng tác viên chỉ được gửi duyệt. Duyệt, từ chối, lưu trữ là việc của quản trị viên.");
        kiemSoHuu(c, cur);
      }
      await kiemQuyenTruong(c, cur.entity_type, cur.entity_id);
      const lyDo = typeof body.rejectionReason === "string" ? body.rejectionReason.trim().slice(0, 1000) : undefined;
      const hienTai = mapTuD1(cur);
      let b: BanGhiCms;
      let hanhDong: string;
      let ghiChu: string | undefined;
      if (dich === "ARCHIVED") {
        if (cur.status !== "DRAFT" && cur.status !== "REJECTED") throw sai(`Chỉ lưu trữ được bản DRAFT hoặc REJECTED, hiện là ${cur.status}`, "status");
        b = { ...hienTai, status: "ARCHIVED", updatedBy: c.email, updatedAt: c.luc };
        hanhDong = "ARCHIVE"; ghiChu = `Lưu trữ từ ${cur.status}`;
      } else {
        const kq = chuyenTrangThaiWorkflow({ banGhi: hienTai, trangThaiDich: dich, actorEmail: c.email, actorRole: vaiTroCms, lyDoTuChoi: lyDo, now: c.luc });
        if (!kq.thanhCong || !kq.duLieu) {
          const thieuLyDo = kq.loi?.startsWith("Bắt buộc") ?? false;
          throw new LoiHttp(thieuLyDo ? 400 : 409, thieuLyDo ? "du-lieu-sai" : "chuyen-trang-thai-khong-hop-le", kq.loi || "Không thể chuyển trạng thái", thieuLyDo ? [{ truong: "rejectionReason", thongBao: kq.loi! }] : []);
        }
        b = kq.duLieu;
        if (dich === "SUBMITTED") b.rejectionReason = undefined; // gửi lại sau khi sửa: xóa lý do cũ
        hanhDong = kq.auditLog?.action ?? dich; ghiChu = kq.auditLog?.note;
      }
      const [kq] = await c.d1.batch([
        c.d1.prepare(`UPDATE ban_ghi_cms SET status = ?, rejection_reason = ?, updated_by = ?, updated_at = ?, submitted_by = ?, submitted_at = ?, reviewed_by = ?, reviewed_at = ?, published_by = ?, published_at = ?
                      WHERE id = ? AND status = ?`)
          .bind(b.status, b.rejectionReason ?? null, b.updatedBy, b.updatedAt, b.submittedBy ?? null, b.submittedAt ?? null, b.reviewedBy ?? null, b.reviewedAt ?? null, b.publishedBy ?? null, b.publishedAt ?? null, cur.id, cur.status),
        cauKiemToan(c.d1, { email: c.email, hanhDong, entityType: cur.entity_type, entityId: cur.entity_id, version: cur.version, ghiChu, luc: c.luc }, true),
      ]);
      if (!daThayDoi(kq)) throw lech();
      const tb = dich === "SUBMITTED" || dich === "APPROVED" || dich === "REJECTED"
        ? await thongBaoSuKien(c.env, { hanhDong: dich, email: c.email, loai: cur.entity_type, maDoiTuong: cur.entity_id, lyDo: dich === "REJECTED" ? lyDo : undefined }, c.o)
        : "khong-can";
      return json(b, 200, { "x-thong-bao": tb });
    }

    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
