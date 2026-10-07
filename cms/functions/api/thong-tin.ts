// GET /api/thong-tin (lọc ?truong= ?loai= ?trangThai= ?nguonGui= ?trang= ?moi=)  và  POST /api/thong-tin (tạo bản ghi).
import { LOAI_THONG_TIN, duocDatTrangThai, kiemTraThongTin } from "../../../src/data/dong-gop-kiem-tra";
import { cauNhatKy, demBang, thongTinTuHang, type HangThongTin } from "../_thu-vien/d1";
import { chay, khongHoTro, TAP_TRUONG } from "../_thu-vien/quyen";
import { cam, docThan, docTrang, json, locEnum, loiKiemTra, sai } from "../_thu-vien/phan-hoi";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";

const TRANG_THAI = ["nhap", "cho", "duyet", "an"] as const;

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    if (c.request.method === "GET") {
      const t = docTrang(c.url);
      const dk: string[] = [];
      const gt: unknown[] = [];
      const truong = c.url.searchParams.get("truong");
      if (truong) { dk.push("ma_truong = ?"); gt.push(truong); }
      const loai = locEnum(c.url.searchParams.get("loai"), LOAI_THONG_TIN, "loai");
      if (loai) { dk.push("loai = ?"); gt.push(loai); }
      const tt = locEnum(c.url.searchParams.get("trangThai"), TRANG_THAI, "trangThai");
      if (tt) { dk.push("trang_thai = ?"); gt.push(tt); }
      const ng = locEnum(c.url.searchParams.get("nguonGui"), ["cms", "agent"], "nguonGui");
      if (ng) { dk.push("nguon_gui = ?"); gt.push(ng); }
      if (c.vaiTro === "ctv") { dk.push("ma_truong IN (SELECT ma_truong FROM phan_cong WHERE email = ?)"); gt.push(c.email); }
      const where = dk.length ? `WHERE ${dk.join(" AND ")}` : "";
      const tong = await demBang(c.d1, `SELECT COUNT(*) AS c FROM thong_tin_truong ${where}`, ...gt);
      const r = await c.d1.prepare(`SELECT * FROM thong_tin_truong ${where} ORDER BY cap_nhat_luc DESC, id LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset).all<HangThongTin>();
      return json({ thongTin: r.results.map(thongTinTuHang), tong });
    }

    if (c.request.method === "POST") {
      const than = await docThan(c.request);
      const ma = typeof than.maTruong === "string" ? than.maTruong.trim() : "";
      if (!TAP_TRUONG.has(ma)) throw sai("Không có trường với mã này", "maTruong");
      await c.yeuCauSuaTruong(ma);
      // Ctv luôn tạo ở 'cho' (hoặc 'nhap'); chỉ nhận nhap/cho từ client khi tạo mới, mặc định 'cho'.
      const tt = than.trangThai === undefined ? "cho" : than.trangThai;
      if (tt !== "nhap" && tt !== "cho") {
        if (tt === "duyet" || tt === "an") { if (!duocDatTrangThai(c.vaiTro, tt)) throw cam("Chỉ quản trị viên được đặt trạng thái này"); }
        else throw sai("Trạng thái không hợp lệ", "trangThai");
      }
      const id = (c.o.taoId ?? (() => crypto.randomUUID()))();
      // id, phienBan, luc, nguoiDang do máy chủ quyết định, bỏ giá trị client gửi
      const kt = kiemTraThongTin({ ...than, id, maTruong: ma, trangThai: tt, phienBan: 1, luc: c.luc, nguoiDang: c.email }, { tapTruong: TAP_TRUONG, bayGio: c.bayGio });
      if (!kt.ok) throw loiKiemTra(kt.loi);
      const b = kt.duLieu;
      await c.d1
        .prepare(
          `INSERT INTO thong_tin_truong (id, ma_truong, loai, nam, link_nguon, trang_thai, phien_ban, tao_boi, nguon_gui, khoa_id, tao_luc, cap_nhat_luc, du_lieu)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'cms', NULL, ?, ?, ?)`,
        )
        .bind(b.id, b.maTruong, b.loai, b.nam ?? null, b.linkNguon ?? null, b.trangThai, c.email, c.luc, c.luc, JSON.stringify(b.duLieu))
        .run();
      await cauNhatKy(c.d1, c.email, `thong-tin.tao.${b.trangThai}`, `thong_tin_truong:${b.id}`, c.luc).run();
      const phatHanh = "khong-tu-dong";
      return json({ ...b, nguonGui: "cms", taoLuc: c.luc }, 201, { "x-phat-hanh": phatHanh });
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
