// GET /api/truong/:ma  và  PUT /api/truong/:ma (kênh chính thức/cộng đồng của trường, thay toàn bộ dòng; ô rỗng = xóa).
import { kiemTraBanGhiTruong } from "../../../../src/data/dong-gop-kiem-tra";
import { banGhiTruongTuHang, cauNhatKy, demBang, thongTinTuHang, type HangThongTin, type HangTruong } from "../../_thu-vien/d1";
import { chay, khongHoTro, TAP_TRUONG, TEN_TRUONG } from "../../_thu-vien/quyen";
import { docThan, docTrang, json, khongTimThay, loiKiemTra } from "../../_thu-vien/phan-hoi";
import { tuPhatHanh } from "../../_thu-vien/phat-hanh";
import { gomTienDo, tienDoCua } from "../../_thu-vien/tien-do";
import type { BoiCanh, TuyChon } from "../../_thu-vien/kieu";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    const ma = typeof c.params.ma === "string" ? c.params.ma : "";
    if (!TAP_TRUONG.has(ma)) throw khongTimThay("Không có trường với mã này");

    if (c.request.method === "GET") {
      const t = docTrang(c.url);
      const duocSua = await c.coQuyenSuaTruong(ma);
      const hangKenh = await c.d1.prepare("SELECT * FROM truong_cong_dong WHERE ma_truong = ? LIMIT 1").bind(ma).first<HangTruong>();
      // ctv chỉ thấy bản ghi của trường được giao; trường khác chỉ xem kênh và tiến độ
      const xemTin = c.vaiTro === "qtv" || duocSua;
      const tong = xemTin ? await demBang(c.d1, "SELECT COUNT(*) AS c FROM thong_tin_truong WHERE ma_truong = ?", ma) : 0;
      const tin = xemTin
        ? (await c.d1.prepare("SELECT * FROM thong_tin_truong WHERE ma_truong = ? ORDER BY cap_nhat_luc DESC, id LIMIT ? OFFSET ?").bind(ma, t.moi, t.offset).all<HangThongTin>()).results
        : [];
      const tienDo = tienDoCua(ma, await gomTienDo(c.d1));
      return json({ maTruong: ma, ten: TEN_TRUONG[ma], ...(hangKenh && { kenh: banGhiTruongTuHang(hangKenh) }), thongTin: tin.map(thongTinTuHang), tong, tienDo, duocSua });
    }

    if (c.request.method === "PUT") {
      await c.yeuCauSuaTruong(ma);
      const than = await docThan(c.request);
      const kt = kiemTraBanGhiTruong({ ...than, maTruong: ma }, { tapTruong: TAP_TRUONG });
      if (!kt.ok) throw loiKiemTra(kt.loi);
      const b = kt.duLieu;
      await c.d1
        .prepare(
          `INSERT INTO truong_cong_dong (ma_truong, fanpage_url, nhom_tuyen_sinh_chinh_thuc_url, nhom_cong_dong_url, website_tuyen_sinh_url, ghi_chu, cap_nhat_luc, cap_nhat_boi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(ma_truong) DO UPDATE SET fanpage_url = excluded.fanpage_url, nhom_tuyen_sinh_chinh_thuc_url = excluded.nhom_tuyen_sinh_chinh_thuc_url,
             nhom_cong_dong_url = excluded.nhom_cong_dong_url, website_tuyen_sinh_url = excluded.website_tuyen_sinh_url, ghi_chu = excluded.ghi_chu,
             cap_nhat_luc = excluded.cap_nhat_luc, cap_nhat_boi = excluded.cap_nhat_boi`,
        )
        .bind(ma, b.fanpageUrl ?? null, b.nhomTuyenSinhChinhThucUrl ?? null, b.nhomCongDongUrl ?? null, b.websiteTuyenSinhUrl ?? null, b.ghiChu ?? null, c.luc, c.email)
        .run();
      await cauNhatKy(c.d1, c.email, "truong.sua-kenh", `truong_cong_dong:${ma}`, c.luc).run();
      const phatHanh = await tuPhatHanh(c.env, c.d1, c.email, c.bayGio);
      return json(b, 200, { "x-phat-hanh": phatHanh });
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
